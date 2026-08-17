import uuid
from datetime import datetime
from typing import Literal

from pydantic import BaseModel, Field


class StartInterviewRequest(BaseModel):
    topic: str = Field(min_length=1, max_length=200)


class StartInterviewResponse(BaseModel):
    status: Literal["in_progress", "declined"]
    session_id: uuid.UUID | None = None
    question: str | None = None
    question_number: int | None = None
    message: str | None = None


class AnswerRequest(BaseModel):
    session_id: uuid.UUID
    answer: str = Field(min_length=1, max_length=5000)
    # Which question this answer responds to, matching the transcript length at the
    # time it was fetched - lets the server reject a stale submission (e.g. the same
    # interview resumed and answered from two tabs) instead of silently misapplying
    # it to whatever question happens to be current by the time the request lands.
    question_number: int = Field(ge=1)


class InterviewResult(BaseModel):
    summary: str
    sentiment: str
    sentiment_note: str
    key_points: list[str]
    keywords: list[str]
    closing_message: str
    transcript: list[dict]


class AnswerResponse(BaseModel):
    status: Literal["in_progress", "completed"]
    question: str | None = None
    question_number: int | None = None
    result: InterviewResult | None = None


class InterviewListItem(BaseModel):
    id: uuid.UUID
    topic: str
    status: str
    created_at: datetime

    model_config = {"from_attributes": True}


class InterviewDetail(BaseModel):
    id: uuid.UUID
    topic: str
    status: str
    plan: dict
    transcript: list
    summary: str | None
    sentiment: str | None
    sentiment_note: str | None
    key_points: list | None
    keywords: list | None
    created_at: datetime

    model_config = {"from_attributes": True}
