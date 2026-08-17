import uuid

from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.limiter import limiter
from app.interviews import llm
from app.interviews.keywords import extract_keywords
from app.interviews.models import Interview
from app.interviews.schemas import (
    AnswerRequest,
    AnswerResponse,
    InterviewDetail,
    InterviewListItem,
    InterviewResult,
    StartInterviewRequest,
    StartInterviewResponse,
)

router = APIRouter()

MIN_QUESTIONS = 3
MAX_QUESTIONS = 5


@router.post("/interview/start", response_model=StartInterviewResponse)
@limiter.limit("10/minute")
def start_interview(request: Request, body: StartInterviewRequest, db: Session = Depends(get_db)):
    plan_result = llm.create_interview_plan(body.topic)

    if not plan_result["is_appropriate"]:
        return StartInterviewResponse(status="declined", message=plan_result["decline_reason"])

    plan = {"strategy": plan_result["strategy"], "focus_areas": plan_result["focus_areas"]}
    first_step = llm.generate_next_question(
        topic=body.topic,
        plan=plan,
        transcript=[],
        question_count=0,
        min_questions=MIN_QUESTIONS,
        max_questions=MAX_QUESTIONS,
        had_prior_redirect=False,
    )

    transcript = [
        {
            "question": first_step["question"],
            "focus_area": first_step["focus_area"],
            "is_redirect": first_step["is_redirect"],
            "answer": None,
        }
    ]

    interview = Interview(topic=body.topic, plan=plan, transcript=transcript)
    db.add(interview)
    db.commit()
    db.refresh(interview)

    return StartInterviewResponse(
        status="in_progress",
        session_id=interview.id,
        question=first_step["question"],
        question_number=1,
    )


@router.post("/interview/answer", response_model=AnswerResponse)
@limiter.limit("20/minute")
def submit_answer(request: Request, body: AnswerRequest, db: Session = Depends(get_db)):
    # Locks the row for the duration of this request so a concurrent submission for the
    # same session (e.g. the same interview resumed in two tabs) can't read the same
    # "current question" this one is about to advance past. It blocks until this
    # transaction commits, then re-checks question_number below and is correctly
    # rejected as stale rather than silently overwriting the wrong transcript entry.
    interview = db.get(Interview, body.session_id, with_for_update=True)
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    if interview.status != "in_progress":
        raise HTTPException(status_code=409, detail="Interview has already ended")
    if body.question_number != len(interview.transcript):
        raise HTTPException(
            status_code=409,
            detail="This question is no longer current. The interview may have moved on "
            "in another tab, refresh to see the latest question.",
        )

    # Copies each turn dict, not just the outer list. The JSONB column isn't wrapped in
    # MutableList/MutableDict, so SQLAlchemy detects a change by comparing old vs. new
    # values. Reusing the same turn dicts and mutating one in place (transcript[-1][...] = ...)
    # would make the "before" value equal the "after" value whenever the list length doesn't
    # also change (i.e. on the final answer, where no new question gets appended below), so
    # the ORM would see no change and silently skip persisting it.
    transcript = [dict(turn) for turn in interview.transcript]
    transcript[-1]["answer"] = body.answer
    answered_count = len(transcript)

    if answered_count >= MAX_QUESTIONS:
        closing_message = f"Thanks for sharing your thoughts on {interview.topic}!"
        interview.transcript = transcript
        result = _finish_interview(db, interview, closing_message)
        return AnswerResponse(status="completed", result=result)

    had_prior_redirect = any(turn["is_redirect"] for turn in transcript)
    next_step = llm.generate_next_question(
        topic=interview.topic,
        plan=interview.plan,
        transcript=transcript,
        question_count=answered_count,
        min_questions=MIN_QUESTIONS,
        max_questions=MAX_QUESTIONS,
        had_prior_redirect=had_prior_redirect,
    )

    if next_step["action"] == "end_interview":
        interview.transcript = transcript
        result = _finish_interview(db, interview, next_step["closing_message"])
        return AnswerResponse(status="completed", result=result)

    transcript.append(
        {
            "question": next_step["question"],
            "focus_area": next_step["focus_area"],
            "is_redirect": next_step["is_redirect"],
            "answer": None,
        }
    )
    interview.transcript = transcript
    db.commit()

    return AnswerResponse(
        status="in_progress", question=next_step["question"], question_number=len(transcript)
    )


def _finish_interview(db: Session, interview: Interview, closing_message: str) -> InterviewResult:
    analysis = llm.analyze_interview(interview.topic, interview.transcript)
    keywords = extract_keywords(interview.transcript)

    interview.status = "completed"
    interview.summary = analysis["summary"]
    interview.sentiment = analysis["sentiment"]
    interview.sentiment_note = analysis["sentiment_note"]
    interview.key_points = analysis["key_points"]
    interview.keywords = keywords
    db.commit()

    return InterviewResult(
        summary=interview.summary,
        sentiment=interview.sentiment,
        sentiment_note=interview.sentiment_note,
        key_points=interview.key_points,
        keywords=interview.keywords,
        closing_message=closing_message,
        transcript=interview.transcript,
    )


@router.get("/interviews", response_model=list[InterviewListItem])
def list_interviews(db: Session = Depends(get_db)):
    interviews = db.query(Interview).order_by(Interview.created_at.desc()).limit(20).all()
    return interviews


@router.get("/interview/{interview_id}", response_model=InterviewDetail)
def get_interview(interview_id: uuid.UUID, db: Session = Depends(get_db)):
    interview = db.get(Interview, interview_id)
    if interview is None:
        raise HTTPException(status_code=404, detail="Interview not found")
    return interview
