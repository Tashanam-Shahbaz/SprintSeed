from abc import ABC
from .core import Agent 
import json 
from utils.model_token_manager import adjust_prompt_and_history_for_proposal
from utils import logger
from typing import Dict, Any

class TaskPlannerAgent(Agent, ABC):
    
    agentType: str = "TaskPlannerAgent"

    def generate_task_plan(self, model_type: str, model_id: str, temperature: float, src_document: str) -> Dict[str, Any]:
        """
        Generate a comprehensive task plan from an SRS document
        
        Args:
            model_type: Type of LLM (e.g., 'openai', 'anthropic', etc.)
            model_id: Specific model identifier
            temperature: Creativity parameter for generation
            src_document: The SRS document content
            
        Returns:
            Dict containing project analysis and task breakdown
        """
        try:
            base_prompt = f"""
            You are an expert Task Planner Agent specializing in software development project management. Your role is to analyze the provided document and break it down into actionable, well-defined tasks.
            
            INSTRUCTIONS:
            1. Carefully analyze the document to understand the project scope, requirements, and technical specifications
            2. Create comprehensive tasks that cover all aspects of implementation
            3. Assign each task to the appropriate role: Frontend Developer, Backend Developer, or Database Engineer
            4. Ensure tasks are specific, measurable, and appropriately scoped (not too broad or too narrow)
            5. Include clear acceptance criteria in each task description
            6. Consider dependencies between tasks and indicate them when relevant
            7. Prioritize tasks when possible (high, medium, low)
            
            For each task, provide:
            - A clear, concise title that summarizes the work
            - A detailed description explaining what needs to be done and why
            - Technical requirements or specifications needed to complete the task
            - Expected deliverables and acceptance criteria
            - Any dependencies on other tasks
            - Priority level (high, medium, low) - YOU decide this based on task importance and impact
            - Complexity level (high, medium, low) - YOU decide this based on technical difficulty
            
            FORMAT YOUR RESPONSE AS JSON:
            {{
                "project_analysis": "Brief overall analysis of the project based on the document",
                "tasks": [
                    {{
                        "id": "TASK-001",
                        "task_title": "Descriptive Task Name",
                        "description": "Detailed explanation of what needs to be done",
                        "technical_requirements": "Specific technical details needed to implement",
                        "acceptance_criteria": "List of criteria that must be met for task completion",
                        "dependencies": ["TASK-ID", "TASK-ID"] or null if no dependencies,
                        "assigned_to": "Frontend Developer|Backend Developer|Database Engineer",
                        "priority": "high|medium|low",
                        "complexity": "high|medium|low",
                        "estimated_hours": number,
                        "status": "open"
                    }}
                ]
            }}
            
            Ensure your task breakdown is comprehensive, covering all aspects of the project described in the document.
            
            The SRS document is as follows:
            {src_document}
            """
            
            # Adjust prompt based on the model and document content
            component = adjust_prompt_and_history_for_proposal(
                model_name=model_id, 
                base_prompt=base_prompt, 
                llm_response='', 
                file_data=src_document
            )
            
            # Extract optimized parameters
            context_prompt = component.get('prompt', base_prompt)
            required_token = component.get('required_token', 8192)
            model_name = component.get('model_name', model_id)
            model_type = component.get('model_type', model_type)
            location = component.get('location')
            
            # Initialize the model with appropriate parameters
            self.initialize_model_from_child(
                model_id=model_name,
                max_tokens=required_token,
                temperature=temperature,
                model_type=model_type,
                location=location
            )
            
            # Generate response from LLM
            response = self.generate_llm_response_in_json(context_prompt)
            
            # Ensure the response is properly formatted
            if isinstance(response, str):
                try:
                    response_dict = json.loads(response)
                    return response_dict
                except json.JSONDecodeError:
                    logger.error("Failed to parse JSON response from LLM")
                    # Try to extract JSON from text response (handling cases where LLM adds explanatory text)
                    import re
                    json_match = re.search(r'({[\s\S]*})', response)
                    if json_match:
                        try:
                            response_dict = json.loads(json_match.group(1))
                            return response_dict
                        except:
                            pass
                    
                    # Return raw response if parsing fails
                    return {"raw_response": response}
            
            return response
            
        except Exception as e:
            logger.error(f"Error in task plan generation: {str(e)}")
            raise