import os

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.database import Base, engine
from app.limiter import limiter
from app.llm import LLMOutputError, LLMServiceError
from app.routes import router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mini AI Interviewer")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)


@app.exception_handler(LLMServiceError)
def llm_service_error_handler(request: Request, exc: LLMServiceError):
    return JSONResponse(
        status_code=503,
        content={"detail": "The interview service is temporarily unavailable. Please try again."},
    )


@app.exception_handler(LLMOutputError)
def llm_output_error_handler(request: Request, exc: LLMOutputError):
    return JSONResponse(
        status_code=502,
        content={
            "detail": "The interview service returned an unexpected response. Please try again."
        },
    )


frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(router)


@app.get("/health")
def health():
    return {"status": "ok"}
