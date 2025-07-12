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