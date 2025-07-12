from pydantic import BaseModel, Field
from typing import Optional , List , Dict , Any
import uuid

class SRSGeneratorRequest(BaseModel):
    """
    Model for SRS Generator Request
    """
    project_id: str = Field(..., description="ID of the project")
    requirements: List[Dict[str, Any]] = Field(..., description="List of requirements to be included in the SRS")
    additional_info: Optional[Dict[str, Any]] = Field(None, description="Any additional information to be included in the SRS")