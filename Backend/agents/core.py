from abc import ABC
from typing import Dict, Optional
from langchain_google_vertexai import VertexAI , HarmBlockThreshold, HarmCategory , ChatVertexAI
from langchain_openai import ChatOpenAI
from langchain.prompts import ChatPromptTemplate
from langchain.chains.llm import LLMChain
from langchain_google_vertexai.model_garden import ChatAnthropicVertex
from langchain_core.prompts import PromptTemplate
from langchain_core.output_parsers import JsonOutputParser
from langchain_google_genai import ChatGoogleGenerativeAI
from langchain_core.messages import HumanMessage, AIMessage , BaseMessage
import json
import os

# from utils import api_key , google_developer_api_key
api_key  = os.getenv("OPEN_API_KEY", "")
genai_api_key = os.getenv("GENAI_API_KEY")

LOCATION = "us-central1"

class Agent(ABC):
    """
    The core class for all Agents
    """

    agentType: str = "Agent"

    def __init__(self,
                model_id = '',
                max_tokens:Optional[int] = 1024,
                temperature:Optional[float] = 0.2,
                model_type: Optional[str] = "google",
                location: Optional[str] = LOCATION,
                ):
        """
        Args:
            model_id (str): The model identifier.
            max_tokens (int, optional): The maximum number of tokens. Defaults to 1024.
            temperature (float, optional): The temperature for the model. Defaults to 0.5.
        """
        self.safety_settings = self._default_safety_settings()
        if model_id != '':
            self.model_id = model_id
            self.max_tokens = max_tokens
            self.temperature = temperature
            self.location = location
            self.model_type = model_type
            self.model = self._initialize_model()

        

    def  initialize_model_from_child(self , model_id , max_tokens , temperature , model_type,  location = None):
        self.model_id = model_id
        self.max_tokens = max_tokens
        self.temperature = temperature
        self.model_type = model_type
        self.location = location
        self.model = self._initialize_model()

    def _default_safety_settings(self) -> Dict[HarmCategory, HarmBlockThreshold]:
        return {
            HarmCategory.HARM_CATEGORY_HARASSMENT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_HATE_SPEECH: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT: HarmBlockThreshold.BLOCK_NONE,
            HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT: HarmBlockThreshold.BLOCK_NONE,
        }

    def _initialize_model(self):
        if self.model_type == "openai":
            return ChatOpenAI(
                model_name=self.model_id,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                api_key=api_key
            )
        elif self.model_type == "anthropic":
            return ChatAnthropicVertex(
                model_name=self.model_id,
                safety_settings=self.safety_settings,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                project_id=self.model_id,
                location=self.location
            )
        elif self.model_type == "google_genai":
            return ChatGoogleGenerativeAI(
                model=self.model_id,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                max_retries=2,
                api_key=genai_api_key
            )
        
        elif self.model_type == "google":
            return ChatVertexAI(
                model_name=self.model_id,
                safety_settings=self.safety_settings,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                location = self.location
            )
        
        else:
            return ChatVertexAI(
                model_name=self.model_id,
                max_tokens=self.max_tokens,
                temperature=self.temperature,
                location = self.location
            )

    def generate_llm_response(self, prompt: str) -> str:
        model_response = self.model.invoke(prompt)
        if "claude" in self.model_id or "gpt" in self.model_id or "gemini" in self.model_id:
            model_response = model_response.content
        return str(model_response)

    
    def generate_llm_response_v_streaming(self, prompt: str):
        try:
            response_stream = self.model.stream(prompt)  
            if "claude" in self.model_id or "gpt" in self.model_id or 'thinking' in self.model_id or "gemini" in self.model_id:
                for chunk in response_stream:
                    yield chunk.content
            else:
                for chunk in response_stream:
                    yield str(chunk)

        except Exception as e:
            raise Exception(f"Error streaming response generate_llm_response_v_streaming: {e}")            

    def generate_llm_response_in_json(self,context_prompt):
        try:
            parser = JsonOutputParser()
            prompt = PromptTemplate(
                template="Answer the user query.\n{format_instructions}\n{query}\n",
                input_variables=["query"],
                partial_variables={"format_instructions": parser.get_format_instructions()},
            )
            chain = prompt | self.model | parser
            result = chain.invoke({"query": context_prompt})
            return result
        except Exception as e:
            raise Exception(f"Error generating response in json: {e}")
    
    def generate_llm_response_in_json_v2(self, context_prompt, base64_images=None):
        try:
            # Handle case when base64_images is None
            if base64_images is None:
                base64_images = []
                
            # Create message list with context prompt that includes metadata
            message = [{"type": "text", "text": context_prompt}]
                
            # Add images to the message
            for image in base64_images:
                # Extract just the image data
                image_url = image["base64_data"] if isinstance(image, dict) else image
                
                # Add the image to the message
                message.append({
                    "type": "image_url",
                    "image_url": {
                        "url": image_url
                    }
                })
            
            # Create the parser and prompt template
            parser = JsonOutputParser()
            # Create the chain
            chain = self.model | parser
            
            # Invoke the chain with the entire message list
            result = chain.invoke([HumanMessage(content=message)])
            
            return result
                   
        except Exception as e:
            raise Exception(f"Error generating response in json: {e}")   
        
    def create_chat_chains(self, prompt: str, memory) -> LLMChain:
        chat_prompt = ChatPromptTemplate.from_template(prompt)
        return LLMChain(
            llm=self.model,
            memory=memory,
            prompt=chat_prompt,
            verbose=False
        )
    

