import os

from fastapi import FastAPI, HTTPException, Request
from fastapi.exception_handlers import (
    http_exception_handler,
    request_validation_exception_handler,
)
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
from fastapi.responses import JSONResponse
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app.core.database import Base, engine
from app.core.limiter import limiter
from app.interviews.llm import LLMOutputError, LLMServiceError
from app.interviews.routes import router

Base.metadata.create_all(bind=engine)

app = FastAPI(title="Mini AI Interviewer")
app.state.limiter = limiter

frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")

# Exception handlers run outside CORSMiddleware's wrapping in Starlette's middleware
# stack, so error responses need the CORS header added explicitly. Otherwise the
# browser reports a misleading "CORS policy" failure instead of the real error.
_cors_headers = {"Access-Control-Allow-Origin": frontend_origin}


@app.exception_handler(RateLimitExceeded)
def cors_aware_rate_limit_handler(request: Request, exc: RateLimitExceeded):
    response = _rate_limit_exceeded_handler(request, exc)
    response.headers.update(_cors_headers)
    return response


@app.exception_handler(LLMServiceError)
def llm_service_error_handler(request: Request, exc: LLMServiceError):
    return JSONResponse(
        status_code=503,
        content={"detail": "The interview service is temporarily unavailable. Please try again."},
        headers=_cors_headers,
    )


@app.exception_handler(LLMOutputError)
def llm_output_error_handler(request: Request, exc: LLMOutputError):
    return JSONResponse(
        status_code=502,
        content={
            "detail": "The interview service returned an unexpected response. Please try again."
        },
        headers=_cors_headers,
    )


@app.exception_handler(Exception)
def unhandled_exception_handler(request: Request, exc: Exception):
    return JSONResponse(
        status_code=500,
        content={"detail": "Something went wrong on our end. Please try again."},
        headers=_cors_headers,
    )


@app.exception_handler(HTTPException)
async def cors_aware_http_exception_handler(request: Request, exc: HTTPException):
    response = await http_exception_handler(request, exc)
    response.headers.update(_cors_headers)
    return response


@app.exception_handler(RequestValidationError)
async def cors_aware_validation_exception_handler(request: Request, exc: RequestValidationError):
    response = await request_validation_exception_handler(request, exc)
    response.headers.update(_cors_headers)
    return response


app.add_middleware(GZipMiddleware, minimum_size=500)
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
