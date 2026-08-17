from unittest.mock import patch

PLAN = {
    "is_appropriate": True,
    "decline_reason": "",
    "strategy": "test strategy",
    "focus_areas": ["area a", "area b", "area c"],
}

NEXT_QUESTION_SEQUENCE = [
    {"action": "ask_question", "question": "Q1", "focus_area": "area a", "is_redirect": False},
    {"action": "ask_question", "question": "Q2", "focus_area": "area b", "is_redirect": False},
    {"action": "ask_question", "question": "Q3", "focus_area": "area c", "is_redirect": False},
    {"action": "end_interview", "closing_message": "Thanks for chatting!"},
]

ANALYSIS = {
    "summary": "test summary",
    "sentiment": "positive",
    "sentiment_note": "test sentiment note",
    "key_points": ["point one", "point two", "point three"],
}


def test_start_then_answer_until_completion(client):
    with (
        patch("app.llm.create_interview_plan", return_value=PLAN),
        patch("app.llm.generate_next_question", side_effect=NEXT_QUESTION_SEQUENCE),
        patch("app.llm.analyze_interview", return_value=ANALYSIS),
    ):
        start_response = client.post("/interview/start", json={"topic": "test topic"})
        assert start_response.status_code == 200
        start_body = start_response.json()
        assert start_body["status"] == "in_progress"
        assert start_body["question"] == "Q1"
        assert start_body["question_number"] == 1
        session_id = start_body["session_id"]

        second_question = client.post(
            "/interview/answer",
            json={"session_id": session_id, "answer": "answer one", "question_number": 1},
        )
        assert second_question.json()["question"] == "Q2"
        assert second_question.json()["question_number"] == 2

        third_question = client.post(
            "/interview/answer",
            json={"session_id": session_id, "answer": "answer two", "question_number": 2},
        )
        assert third_question.json()["question"] == "Q3"
        assert third_question.json()["question_number"] == 3

        final_response = client.post(
            "/interview/answer",
            json={"session_id": session_id, "answer": "answer three", "question_number": 3},
        )
        final_body = final_response.json()
        assert final_body["status"] == "completed"
        assert final_body["result"]["summary"] == "test summary"
        assert final_body["result"]["sentiment"] == "positive"
        assert final_body["result"]["key_points"] == ANALYSIS["key_points"]
        assert final_body["result"]["closing_message"] == "Thanks for chatting!"
        assert isinstance(final_body["result"]["keywords"], list)

    detail_response = client.get(f"/interview/{session_id}")
    assert detail_response.status_code == 200
    assert detail_response.json()["status"] == "completed"


def test_stale_question_number_is_rejected(client):
    with (
        patch("app.llm.create_interview_plan", return_value=PLAN),
        patch("app.llm.generate_next_question", side_effect=NEXT_QUESTION_SEQUENCE),
    ):
        start_response = client.post("/interview/start", json={"topic": "test topic"})
        session_id = start_response.json()["session_id"]

        # Answering question 1 twice in a row - the second submission is stale, as if a
        # second tab had the interview open and submitted after the first tab already
        # advanced it.
        client.post(
            "/interview/answer",
            json={"session_id": session_id, "answer": "answer one", "question_number": 1},
        )
        stale_response = client.post(
            "/interview/answer",
            json={"session_id": session_id, "answer": "a stale answer", "question_number": 1},
        )

    assert stale_response.status_code == 409


def test_declined_topic_does_not_create_session(client):
    declined_plan = {
        "is_appropriate": False,
        "decline_reason": "not appropriate for a research interview",
        "strategy": "",
        "focus_areas": [],
    }
    with patch("app.llm.create_interview_plan", return_value=declined_plan):
        response = client.post("/interview/start", json={"topic": "test topic"})

    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "declined"
    assert body["session_id"] is None
    assert body["message"] == "not appropriate for a research interview"


def test_answer_on_unknown_session_returns_404(client):
    response = client.post(
        "/interview/answer",
        json={
            "session_id": "00000000-0000-0000-0000-000000000000",
            "answer": "hello",
            "question_number": 1,
        },
    )
    assert response.status_code == 404
