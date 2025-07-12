from fastapi import FastAPI, HTTPException, Request, File, Form, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from utils import db_obj , logger
import traceback
import logging
from typing import List, Optional

from utils.chat_history_manager import ChatHistoryManager

#Agents
from agents.srs_creator_agent import SRSCreatorAgent

#Models
from models import (
    SRSGeneratorRequest
)

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



@app.post("/generate-srs-proposal")
def generate_srs_proposal(
    request: Request,
    project_id: str = Form(...),
    model_type: str = Form(default="openai"),
    model_id: str = Form(default="gpt-4o"),
    user_query: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    ):
    try:

        history = ChatHistoryManager(session_id=project_id)
        user_and_agent_chat_message = history.create_proposal_user_message_string()

        # Initialize research agent
        proposal_generator_agent_obj = SRSCreatorAgent()
        
        def stream_proposal():
            accumulated_proposal = ""
            first_chunk = True
            last_chunk = None

            try:
                for chunk in proposal_generator_agent_obj.generate_srs_document(
                    llm_response=user_and_agent_chat_message,
                ):
                    if first_chunk:
                        first_chunk = False
                        temp = chunk
                        chunk = chunk.replace("```string", "", 1).replace("```", "", 1).lstrip()
                        logger.log(message=f"First chunk after: {chunk} First chunk before {temp}", log_level="INFO")

                    if last_chunk is not None:
                        # print("chunk ", last_chunk)
                        yield f"data: {last_chunk}\n\n"
                        accumulated_proposal += last_chunk

                    last_chunk = chunk

                if last_chunk:
                    last_chunk = last_chunk.rstrip("```")
                    # print("chunk ", last_chunk)
                    yield f"data: {last_chunk}\n\n"
                    accumulated_proposal += last_chunk
                
                logger.log(message=f"SRS document streamed. accumulated_proposal {accumulated_proposal}", log_level="INFO")
                with open("SRS document.txt", "w", encoding='utf-8') as file:
                    file.write(accumulated_proposal)

                # Store chat history after streaming completes
                history.store_proposal_chat_history(
                    user_query=user_query, 
                    agent_response=accumulated_proposal
                )


            except Exception as e:
                yield f"data: {handle_streaming_error(e)}\n\n"
            
        return StreamingResponse(stream_proposal(), media_type="text/event-stream")

    except Exception as e:
        logger.log(message=f"Unhandled error: {e}", log_level="ERROR")
        return handle_api_error(e)
    
# Middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response status code: {response.status_code}")
    return response