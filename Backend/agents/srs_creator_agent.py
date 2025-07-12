from abc import ABC
from .core import Agent 
import json 
from utils.model_token_manager import adjust_prompt_and_history_for_proposal

class SRSCreatorAgent(Agent, ABC):
    
    agentType: str = "SRSCreatorAgent"

    def generate_srs_document(self , chat_history,user_query  ,model_type ,  model_id , temperature , file_text):
        try:
            base_prompt = f"""
            Analyse ths user query and chat history and generate a detailed SRS document. 
            SRS document contain three major tasks and some other small descriptions too as in the SRS,
            in those three main tasks the UI design description as frontend, UI related APIs as backend, 
            Database related tables with a proper table format of data type and its use. 
            All in descriptive and detailed and proper heading and table wise where its needed.
            <USER_QUERY> {user_query}</User_Query>
            """

            component = adjust_prompt_and_history_for_proposal(model_id , base_prompt , chat_history , file_text)
            
            context_prompt = component.get('prompt', base_prompt) 
            required_token = component.get('required_token', 8192)
            model_name = component.get('model_name', model_id)
            model_type = component.get('model_type', model_type)
            self.initialize_model_from_child( model_id= model_name, 
                                             max_tokens= required_token , 
                                             temperature= temperature , 
                                             model_type= model_type , 
                                             location = component.get('location')
                                             )


            for chunk in  self.generate_llm_response_v_streaming(context_prompt):
                yield chunk
        except Exception as e:
            raise Exception(f"Error streaming response generate_research_proposal: {e}")