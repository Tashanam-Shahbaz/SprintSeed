from abc import ABC
from .core import Agent 
import json 
from utils.model_token_manager import adjust_prompt_and_history_for_proposal

class SRSCreatorAgent(Agent, ABC):
    
    agentType: str = "SRSCreatorAgent"

    def generate_srs_document(self):
        try:
            context_prompt = ""
            for chunk in  self.generate_llm_response_v_streaming(context_prompt):
                yield chunk
        except Exception as e:
            raise Exception(f"Error streaming response generate_research_proposal: {e}")