from fastapi import FastAPI, APIRouter,Request, Depends, HTTPException, Request, File, Form, UploadFile
from fastapi.responses import StreamingResponse, JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from utils import db_obj , logger
from utils.sendEmail import send_email
from datetime import datetime
import uuid
import traceback
from typing import List, Optional
from models import (
    UserRegisterRequest, UserLogin , SRSGeneratorRequest , CreateProjectRequest,EmailRequest,
    TaskCreatorAgentRequest , EmailSummaryGeneratorRequest , FetchUserChatInfoRequest
)


from utils.chat_history_manager import ChatHistoryManager

#Agents
from agents.srs_creator_agent import SRSCreatorAgent
from agents.task_planner_agent import TaskPlannerAgent
# from agents.task_creator_agent import TaskCreatorAgent

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



#Register API
@app.post("/register")
async def register_user(payload: UserRegisterRequest):
    try:
       
        existing_user=db_obj.check_user_query(payload.email)

        if existing_user:
            return JSONResponse(
                content={"status": "error", "message": "Username or email already exists"},
                status_code=409
            )

       
        role_result=db_obj.get_role_id_by_name(payload.role_name)
        if not role_result:
            return JSONResponse(
                content={"status": "error", "message": "Invalid role name"},
                status_code=400
            )
        role_id = role_result[0][0]


        user_id = str(uuid.uuid4())
        now = datetime.now()

        user_data = (
            user_id,
            payload.username,
            payload.email,
            payload.password,  
            payload.first_name,
            payload.last_name,
            role_id,
            now,
            now
        )
                
        db_obj.insert_user(user_data)
       
        return JSONResponse(
            content={"status": "success", "message": "User registered successfully", "user_id": user_id},
            status_code=201
        )

    except Exception as e:
        return handle_api_error(e)
    
@app.post("/login")
async def login_user(payload: UserLogin):
    try:
        
        result=db_obj.get_user_by_email(payload.email)

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
        
        roles=db_obj.get_role()
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


@app.post("/create-project")
def create_project(
    request: Request,creat_project: CreateProjectRequest):
    try:
        # Insert Project and Conversation
        db_obj.insert_project(
            project_id=creat_project.project_id,
            project_name=creat_project.project_name, 
            conversation_id=creat_project.conversation_id,
            user_id  = creat_project.user_id
        )
        
        db_obj.insert_conversation(
            conversation_id=creat_project.conversation_id,
            project_id=creat_project.project_id,
            chat_type=creat_project.chat_type,
            user_id  = creat_project.user_id
        )
        project_id=creat_project.project_id
        return JSONResponse(
            content={
                "message": "Project created successfully",
                "project_id": project_id
            },
            status_code=200
        )
    
    except Exception as e:
        logger.error(f"Error creating project: {str(e)}")
        return handle_api_error(e)
    

@app.post("/upload-files")
def upload_files(
    requet: Request,
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
def generate_srs_proposal(request: Request, agent_request: SRSGeneratorRequest):
    try:

        history = ChatHistoryManager(session_id=agent_request.project_id)
        user_and_agent_chat_message = history.create_proposal_user_message_string()

        #Insert Project and Conversation
        db_obj.insert_project(
            project_id=agent_request.project_id,
            project_name=agent_request.project_name, 
            conversation_id=agent_request.conversation_id,
            user_id=agent_request.user_id
        )

        db_obj.insert_conversation(
            conversation_id=agent_request.conversation_id,
            project_id=agent_request.project_id,
            chat_type=agent_request.chat_type,
            user_id=agent_request.user_id
        )

        #Read Files
        file_text = db_obj.read_files(
            file_ids=agent_request.file_ids,
        )

        # Initialize research agent
        proposal_generator_agent_obj = SRSCreatorAgent()
        
        def stream_proposal():
            accumulated_proposal = ""
            first_chunk = True
            last_chunk = None

            try:
                for chunk in proposal_generator_agent_obj.generate_srs_document(
                    chat_history = user_and_agent_chat_message,
                    user_query = agent_request.user_query,
                    model_type = agent_request.model_type , 
                    temperature = agent_request.temperature,
                    model_id = agent_request.model_id,
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
                    user_query=agent_request.user_query, 
                    agent_response=accumulated_proposal
                )


                db_obj.insert_conversation_message(
                    conversation_id=agent_request.conversation_id,
                    user_query=agent_request.user_query,
                    agent_response=accumulated_proposal,
                    model_id=agent_request.model_id,
                    model_type = agent_request.model_type,
                )


            except Exception as e:
                yield f"data: {handle_streaming_error(e)}\n\n"
            
        return StreamingResponse(stream_proposal(), media_type="text/event-stream")

    except Exception as e:
        # logger.log(message=f"Unhandled erragentor: {e}", log_level="ERROR")
        return handle_api_error(e)


@app.post("/email-summary-generator")
async def email_summary_generator(agent_request: EmailSummaryGeneratorRequest):
    try:
       
        # Initialize email summary generator agent
        email_summary_generator_agent = SRSCreatorAgent()
        src_document = db_obj.get_finalize_srs(
            project_id=agent_request.project_id,
        )
        # Generate email summary
        response = email_summary_generator_agent.generate_summary(
            agent_request.model_id, agent_request.model_type, agent_request.temperature , src_document
        )

        #TODO
        subject = response.get("subject")
        body = response.get("body")
        return JSONResponse(
            content={
                "subject": subject,
                "body": body
            },
            status_code=200
        )
       
       
        # Step 6: Return success
        # return JSONResponse(
        #     content={"status": "success", "message": "Email summary sent successfully."},
        #     status_code=200
        # )

    except Exception as e:
        return JSONResponse(
            content={"status": "error", "message": f"Error sending email: {e}"},
            status_code=500
        )


    except Exception as e:
        logger.error(f"Error in email summary generator: {str(e)}")
        return handle_api_error(e)
    
@app.post("/send-email")
async def send_email_api(email_request: EmailRequest):
    try:
        await send_email(
            subject=email_request.subject,
            body=email_request.body,
            reciever=email_request.recipient
        )
        return JSONResponse(
            content={"message": "Email sent successfully"},
            status_code=200
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send email: {e}")

@app.get("/models")
async def get_models():
    try:
        models = db_obj.get_all_llm_models()  

        model_list = [
            {
                "model_id": model[0],
                "display_model_name": model[1],
                "model_name": model[2],
                "model_type": model[3],
                "context_window": model[4],
                "max_token": model[5],
                "location": model[6],
                "is_image_support": model[7],
                "is_deleted": model[8],
                "created_at": model[9].strftime('%Y-%m-%d %H:%M:%S')
            }
            for model in models
        ]

        return JSONResponse(
            content={"status": "success", "models": model_list},
            status_code=200
        )

    except Exception as e:
        return handle_api_error(e)@app.post("/task-generator-agent")

@app.get("/task_creation")
def task_creation(request: Request , agent_request: TaskCreatorAgentRequest):
    try:

        src_document = db_obj.get_finalize_srs(
            project_id=agent_request. project_id,
        )
        task_generator = TaskPlannerAgent()
        task_result = task_generator.generate_task_plan(
            model_type=agent_request.model_type,
            model_id=agent_request.model_id,
            temperature=agent_request.temperature,
            src_document=src_document
        )

        task = task_result.get("tasks", [])
        db_obj.insert_task(
            project_id=agent_request.project_id,
            task_data=task
        )
        return JSONResponse(content=task_result, status_code=200)
   
    except HTTPException as he:
        # Re-raise HTTP exceptions
        raise he
    except Exception as e:
        logger.error(f"Error uploading files: {str(e)}")
        return handle_api_error(e)


@app.post("/fetch-user-chat-info")
async def fetch_user_chat_info(request: FetchUserChatInfoRequest):
    try:
        user_id = request.user_id
        chat_info = db_obj.get_user_chat_info(user_id)

        if not chat_info:
            return JSONResponse(
                content={"status": "error", "message": "No chat information found for the user"},
                status_code=404
            )

        return JSONResponse(
            content={"status": "success", "chat_info": chat_info},
            status_code=200
        )

    except Exception as e:
        logger.error(f"Error fetching user chat info: {str(e)}")
        return handle_api_error(e)
    
@app.post("/fetch-user-chat-details")
async def fetch_user_chat_details(request: FetchUserChatInfoRequest):
    try:
        user_id = request.user_id
        project_id = request.project_id
        chat_details = db_obj.get_user_chat_details(user_id , project_id)

        if not chat_details:
            return JSONResponse(
                content={"status": "error", "message": "No chat details found for the user"},
                status_code=404
            )

        return JSONResponse(
            content={"status": "success", "chat_details": chat_details},
            status_code=200
        )

    except Exception as e:
        logger.error(f"Error fetching user chat details: {str(e)}")
        return handle_api_error(e)
if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, port=8000)