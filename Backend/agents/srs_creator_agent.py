from abc import ABC
from .core import Agent 
import json 
from utils.model_token_manager import adjust_prompt_and_history_for_proposal

class SRSCreatorAgent(Agent, ABC):
    
    agentType: str = "SRSCreatorAgent"

    def generate_srs_document(self, chat_history, user_query, model_type, model_id, temperature, file_text):
        try:
            base_prompt = f"""
            <USER_QUERY>{user_query}</USER_QUERY>
            
            <SYSTEM_PROMPT>
            You are an expert software requirements analyst. Your task is to create a comprehensive Software Requirements Specification (SRS) document based on the user's query and requirements.

            This is a two-stage process:

            STAGE 1: SRS PLAN (5-10 POINTS)
            First, analyze the user query and provide a clear, structured plan consisting of 5-10 key points. Present this plan in a numbered list format that covers:

            1. Project overview and scope
            2. Primary objectives and success criteria
            3. Key stakeholders and target users
            4. Core functional requirements (3-5 main features)
            5. Technical stack recommendations
            6. Data management approach
            7. Integration requirements with existing systems
            8. Security and compliance considerations
            9. Potential challenges or constraints
            10. Quality assurance approach

            Keep each point brief but specific - Single Sentence will be enough. The entire plan should be concise yet comprehensive enough to guide the full SRS development. DO NOT include timeline details in this stage.

            STAGE 2: COMPLETE SRS DOCUMENT
            After the plan is approved or modified by the user, you will generate a comprehensive SRS document that follows the approved plan and includes:

            1. INTRODUCTION
            - Purpose and scope
            - System overview
            - Definitions and acronyms

            2. FRONTEND SPECIFICATIONS
            - UI design description
            - Screen layouts and user flows
            - Responsive design requirements

            3. BACKEND ARCHITECTURE
            - API specifications and endpoints
            - Business logic implementation
            - Integration points

            4. DATABASE DESIGN
            - Database tables with schema (fields, data types, relationships)
            - Data flow diagrams
            - Data migration strategy

            5. NON-FUNCTIONAL REQUIREMENTS
            - Performance metrics
            - Security requirements
            - Scalability considerations

            6. IMPLEMENTATION TIMELINE
            - Development phases with specific milestones
            - Estimated duration for each phase
            - Dependencies between phases
            - Resource allocation recommendations
            - Critical path identification

            Use proper formatting with tables, headings, and lists. Provide detailed descriptions for each component.

            IMPORTANT INSTRUCTIONS:
            - Present the Stage 1 plan as a numbered list of 5-10 points only
            - After presenting the plan, add this exact line: "[To generate the complete SRS document based on this plan, please reply with 'Generate SRS' or suggest changes to the points above.]"
            - When the user approves or modifies the plan, generate the complete SRS based on the final agreed points
            - Include a detailed implementation timeline ONLY in Stage 2
            - Do not include unnecessary greetings or acknowledgments

            </SYSTEM_PROMPT>
            """
            
            component = adjust_prompt_and_history_for_proposal(model_id, base_prompt, chat_history, file_text)
            
            context_prompt = component.get('prompt', base_prompt)
            required_token = component.get('required_token', 8192)
            model_name = component.get('model_name', model_id)
            model_type = component.get('model_type', model_type)
            
            self.initialize_model_from_child(
                model_id=model_name,
                max_tokens=required_token,
                temperature=temperature,
                model_type=model_type,
                location=component.get('location')
            )
            
            for chunk in self.generate_llm_response_v_streaming(context_prompt):
                yield chunk
                
        except Exception as e:
            raise Exception(f"Error streaming response generate_srs_document: {e}")
        


    def generate_summary(self, model_id, temperature , src_document):
        try:

            base_prompt = f"""
            <SYSTEM_PROMPT>
            You are an executive-level technical communication specialist. Create a concise, professional summary of the SRS document below formatted as a stakeholder email.
            JSON FORMAT:
            {{
            "subject": "SRS Summary for {src_document}",
            "body": "Body here",
            }}
            Your summary must include:
            • Project overview (1-2 sentences)
            • 3-5 key requirements/features
            • Technical approach highlights
            • Critical timeline milestones
            • Clear next steps
            
            Keep the summary under 300 words. Use professional language, bullet points for clarity, and a formal but approachable tone.
            
            Document to summarize:
            {src_document}
            </SYSTEM_PROMPT>
            """
            
            component = adjust_prompt_and_history_for_proposal(model_id, base_prompt, '', src_document)
            
            context_prompt = component.get('prompt', base_prompt)
            required_token = component.get('required_token', 8192)
            model_name = component.get('model_name', model_id)
            model_type = component.get('model_type', model_type)
            
            self.initialize_model_from_child(
                model_id=model_name,
                max_tokens=required_token,
                temperature=temperature,
                model_type=model_type,
                location=component.get('location')
            )
            response = self.generate_llm_response_in_json(context_prompt)
            return response

        except Exception as e:
            raise Exception(f"Error streaming response generate_summary: {e}")