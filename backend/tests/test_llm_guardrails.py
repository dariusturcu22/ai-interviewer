from unittest.mock import MagicMock, patch

from app.interviews.llm import _coerce_field, generate_next_question


def test_coerce_field_rejects_a_value_outside_the_declared_enum():
    sentiment_schema = {"type": "string", "enum": ["positive", "neutral", "negative", "mixed"]}
    is_valid, _ = _coerce_field("ecstatic", sentiment_schema)
    assert is_valid is False


def test_coerce_field_accepts_a_value_inside_the_declared_enum():
    sentiment_schema = {"type": "string", "enum": ["positive", "neutral", "negative", "mixed"]}
    is_valid, value = _coerce_field("mixed", sentiment_schema)
    assert is_valid is True
    assert value == "mixed"


def _mock_tool_use_response(name: str, input_dict: dict):
    block = MagicMock()
    block.type = "tool_use"
    block.name = name
    block.input = input_dict
    response = MagicMock()
    response.content = [block]
    return response


def test_end_interview_tool_not_offered_below_min_questions_without_prior_redirect():
    with patch("app.interviews.llm._client") as mock_client:
        mock_client.messages.create.return_value = _mock_tool_use_response(
            "ask_question",
            {"question": "Tell me more?", "focus_area": "area a", "is_redirect": False},
        )
        generate_next_question(
            topic="a topic",
            plan={"strategy": "s", "focus_areas": ["area a"]},
            transcript=[],
            question_count=1,
            min_questions=3,
            max_questions=5,
            had_prior_redirect=False,
        )

    call_kwargs = mock_client.messages.create.call_args.kwargs
    tool_names = {tool["name"] for tool in call_kwargs["tools"]}
    assert tool_names == {"ask_question"}
    assert call_kwargs["tool_choice"] == {"type": "tool", "name": "ask_question"}


def test_end_interview_tool_offered_below_min_questions_with_prior_redirect():
    with patch("app.interviews.llm._client") as mock_client:
        mock_client.messages.create.return_value = _mock_tool_use_response(
            "end_interview", {"closing_message": "Thanks for your time!"}
        )
        generate_next_question(
            topic="a topic",
            plan={"strategy": "s", "focus_areas": ["area a"]},
            transcript=[],
            question_count=1,
            min_questions=3,
            max_questions=5,
            had_prior_redirect=True,
        )

    call_kwargs = mock_client.messages.create.call_args.kwargs
    tool_names = {tool["name"] for tool in call_kwargs["tools"]}
    assert tool_names == {"ask_question", "end_interview"}
    assert call_kwargs["tool_choice"] == {"type": "any"}
