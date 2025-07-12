from fastapi import FastAPI, APIRouter,Request, Depends, HTTPException, Request, File, Form, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from utils import db_obj , logger
from datetime import datetime
import uuid
import traceback
from typing import List, Optional
from models import UserRegisterRequest, UserLogin


from utils.chat_history_manager import ChatHistoryManager

#Agents
from agents.srs_creator_agent import SRSCreatorAgent


from utils.helpers import  process_files_for_storage


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

@app.post("/upload-files")
def upload_files(
    request: Request,
    project_id: str = Form(...),
    conversation_id: str = Form(...),
    chat_type : str = Form(default="srs_creator"),
    files: Optional[List[UploadFile]] = File(None) 
):
    try:
        if not files:
            raise HTTPException(status_code=400, detail="No files uploaded")
        
        # Process the uploaded files
        processed_files = process_files_for_storage(files)
        
        if not processed_files:
            raise HTTPException(status_code=400, detail="No valid files processed")
        
        db_obj.insert_conversation(
            conversation_id=conversation_id,
            project_id=project_id,
            chat_type=chat_type
        )
        # Save file attachments
        attachment_ids = db_obj.save_file_attachments(conversation_id, processed_files)
        
        
        # Prepare response data
        response_data = {
           "attachment_ids": attachment_ids,
        }
        
        return JSONResponse(content=response_data, status_code=200)
   
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.error(f"Error uploading files: {str(e)}")
        return handle_api_error(e)

@app.post("/generate-srs-proposal")
def generate_srs_proposal(
    request: Request,
    project_id: str = Form(...),
    model_type: str = Form(default="openai"),
    model_id: str = Form(default="gpt-4o"),
    temperature: Optional[float] = Form(default=0.2),
    user_query: str = Form(...),
    files: Optional[List[UploadFile]] = File(None),
    ):
    try:

        history = ChatHistoryManager(session_id=project_id)
        user_and_agent_chat_message = history.create_proposal_user_message_string()


        #Read Files
        file_text = process_files_for_storage(files)

        # Initialize research agent
        proposal_generator_agent_obj = SRSCreatorAgent()
        
        def stream_proposal():
            accumulated_proposal = ""
            first_chunk = True
            last_chunk = None

            try:
                for chunk in proposal_generator_agent_obj.generate_srs_document(
                    chat_history = user_and_agent_chat_message,
                    user_query = user_query,
                    model_type = model_type , 
                    temperature = temperature,
                    model_id = model_id,
                    file_text = file_text
                ):
                    if first_chunk:
                        first_chunk = False
                        temp = chunk
                        chunk = chunk.replace("```string", "", 1).replace("```", "", 1).lstrip()

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
                
                # logger.log(message=f"SRS document streamed. accumulated_proposal {accumulated_proposal}", log_level="INFO")
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
        # logger.log(message=f"Unhandled error: {e}", log_level="ERROR")
        return handle_api_error(e)
    
# Middleware to log all requests
@app.middleware("http")
async def log_requests(request: Request, call_next):
    logger.info(f"Request: {request.method} {request.url.path}")
    response = await call_next(request)
    logger.info(f"Response status code: {response.status_code}")
    return response

#Register API
@app.post("/register")
async def register_user(payload: UserRegisterRequest):
    try:
        check_user_query = """
            SELECT 1 FROM task_management.users 
            WHERE username = %s OR email = %s
        """
        
        existing_user = db_obj.retrieve_data(
            query=check_user_query,
            data=(payload.username, payload.email)
        )

        if existing_user:
            return JSONResponse(
                content={"status": "error", "message": "Username or email already exists"},
                status_code=409
            )

        # insert_user_query = """
        #     INSERT INTO task_management.users 
        #     (user_id, username, email, password, first_name, last_name, role_id, created_at, updated_at, is_active)
        #     VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
        # """

        # 2. Fetch role_id using role_name
        fetch_role_id_query = """
            SELECT role_id FROM task_management.roles WHERE role_name = %s
        """
        role_result = db_obj.retrieve_data(
            query=fetch_role_id_query,
            data=(payload.role_name,)
        )
        if not role_result:
            return JSONResponse(
                content={"status": "error", "message": "Invalid role name"},
                status_code=400
            )
        role_id = role_result[0][0]

        # 3. Insert new user with the role_id
        insert_user_query = """
            INSERT INTO task_management.users 
            (user_id, username, email, password, first_name, last_name, role_id, created_at, updated_at, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
        """

        user_id = str(uuid.uuid4())
        password=payload.password

        db_obj.execute_query(
            query=insert_user_query,
            data=(
                user_id,
                payload.username,
                payload.email,
                password,
                payload.first_name,
                payload.last_name,
                role_id,
                datetime.now(),
                datetime.now()
            )
        )

        return JSONResponse(
            content={"status": "success", "message": "User registered successfully", "user_id": user_id},
            status_code=201
        )

    except Exception as e:
        return handle_api_error(e)
    
@app.post("/login")
async def login_user(payload: UserLogin):
    try:
        fetch_user_query = """
            SELECT user_id, username, email, password, first_name, last_name, role_id 
            FROM task_management.users 
            WHERE email = %s
        """

        result = db_obj.retrieve_data(
            query=fetch_user_query,
            data=(payload.email,)
        )

        if not result:
            return JSONResponse(
                content={"status": "error", "message": "User not found"},
                status_code=404
            )

        user_row = result[0]
        db_password = user_row[3]

        if payload.password != db_password:
            return JSONResponse(
                content={"status": "error", "message": "Invalid password"},
                status_code=401
            )

        return JSONResponse(
            content={
                "status": "success",
                "message": "Login successful",
                "user": {
                    "user_id": user_row[0],
                    "username": user_row[1],
                    "email": user_row[2],
                    "first_name": user_row[4],
                    "last_name": user_row[5],
                    "role_id": user_row[6],
                }
            },
            status_code=200
        )

    except Exception as e:
        return handle_api_error(e)


@app.get("/roles")
async def get_roles():
    try:
        fetch_roles_query = """
            SELECT role_id, role_name, description 
            FROM task_management.roles
        """

        roles = db_obj.retrieve_data(query=fetch_roles_query)

        roles_list = [
            {
                "role_id": role[0],
                "role_name": role[1],
                "description": role[2]
            }
            for role in roles
        ]

        return JSONResponse(
            content={"status": "success", "roles": roles_list},
            status_code=200
        )

    except Exception as e:
        return handle_api_error(e)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8000)