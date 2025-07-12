from pydantic import BaseModel, Field
from typing import Optional , List , Dict , Any
import uuid

#user Model
from pydantic import BaseModel, EmailStr
from typing import Optional


class UserRegisterRequest(BaseModel):
    username: str
    email: EmailStr
    password: str
    first_name: Optional[str]=None
    last_name:Optional[str]=None
    role_name: Optional[str]=None

class UserLogin(BaseModel):
    email:str
    password: str


class SRSGeneratorRequest(BaseModel):
    project_id: str = Field(..., description="Unique identifier for the project")
    project_name : Optional[str] = Field(default="Project Name", description="Name of the project for which SRS is being generated")
    conversation_id : str = Field(
        default_factory=lambda: str(uuid.uuid4()), description="Unique identifier for the conversation"
    )
    model_type: str = Field(default="openai", description="Type of model to use for generation")
    model_id: str = Field(default="gpt-4o", description="ID of the model to use for generation")
    temperature: Optional[float] = Field(default=0.2, description="Temperature setting for the model")
    user_query: str = Field(..., description="User's query or request for SRS generation")
    file_ids: Optional[List[str]] = Field(
        None, description="List of file paths to be processed for SRS generation"
    )