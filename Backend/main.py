from fastapi import FastAPI, HTTPException, Request, File, Form, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
import traceback
import logging

from utils import db_obj , logger



@asynccontextmanager
async def lifespan(app: FastAPI): 
    logger.info("Starting up FastAPI application")
    yield 
    db_obj.close_pool()
    logger.info("Database connection pool closed")


app = FastAPI(title="SprintSpeed", lifespan=lifespan)

allow_origins=["http://localhost:3000"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)


def handle_api_error(e: Exception):
    error_traceback = traceback.format_exc()
    logger.error(f"API error occurred: {str(e)}\nTraceback: {error_traceback}")
    
    status_code = getattr(e, "status_code", 500)

    return JSONResponse(
        content={
            "status": "error",
            "message": f"API error occurred: {str(e)}",
            # "traceback": error_traceback
        },
        status_code=status_code,
    )

def handle_streaming_error(e: Exception):
    error_traceback = traceback.format_exc()
    logger.error(f"Streaming API error occurred: {str(e)}\nTraceback: {error_traceback}")

    if hasattr(e, "code") and e.code == "context_length_exceeded":
        logger.warning("Context length exceeded error")
        return "context_length_exceeded"
    
    elif (hasattr(e, "code") and e.code == "529") or "529" in str(e) or "overloaded" in str(e).lower():
        logger.warning("Service overloaded (529 error)")
        return "error_overloaded_sonnet_529"
    
    elif (hasattr(e, "code") and e.code == "429") or "429" in str(e) or "rate limit" in str(e).lower():
        logger.warning("Rate limit exceeded error")
        return "error_rate_limit_exceeded"
    
    logger.error("Failed to process request")
    return "failed_to_process_your_request"


@app.get("/")
def root():
    logger.info("Root endpoint accessed")
    return "Researcher Working Fine!"


@app.post("/demo")
def demo(request: Request):
    try:
        logger.info("Demo endpoint accessed")
        # Your demo implementation code here
        response = {"message": "Demo endpoint working"}
        return JSONResponse(content=response, status_code=200)
    except Exception as e:
        logger.error(f"Error in demo endpoint: {str(e)}")
        return handle_api_error(e)


# Middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response status code: {response.status_code}")
    return response