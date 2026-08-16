import os

from dotenv import load_dotenv

load_dotenv()

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import Limiter, _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded
from slowapi.util import get_remote_address

from app.database import Base, engine

Base.metadata.create_all(bind=engine)

limiter = Limiter(key_func=get_remote_address)

app = FastAPI(title="Mini AI Interviewer")
app.state.limiter = limiter
app.add_exception_handler(RateLimitExceeded, _rate_limit_exceeded_handler)

frontend_origin = os.environ.get("FRONTEND_ORIGIN", "http://localhost:3000")
app.add_middleware(
    CORSMiddleware,
    allow_origins=[frontend_origin],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/health")
def health():
    return {"status": "ok"}
