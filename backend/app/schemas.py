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
    message: str | None = None


class AnswerRequest(BaseModel):
    session_id: uuid.UUID
    answer: str = Field(min_length=1, max_length=5000)


class InterviewResult(BaseModel):
    summary: str
    sentiment: str
    sentiment_note: str
    key_points: list[str]
    keywords: list[str]
    closing_message: str


class AnswerResponse(BaseModel):
    status: Literal["in_progress", "completed"]
    question: str | None = None
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
