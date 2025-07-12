from abc import ABC
from .core import Agent 
import json 

class TaskAssignmentAgent(Agent, ABC):

    
    agentType: str = "TaskAssignmentAgent"

    def run(self ):
        try:
            context_prompt = ""
            generated_result = self.generate_llm_response_in_json(context_prompt)
            return generated_result
    
        except Exception as e:
            raise Exception(f"Error generating research plan: {e}")    
