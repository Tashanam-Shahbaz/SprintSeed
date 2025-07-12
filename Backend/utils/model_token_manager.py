import tiktoken
from utils import logger , db_obj
import json
import traceback

model_dict_static = [
    {
    "model_name": "claude-3-7-sonnet@20250219",
    "model_type": "anthropic",
    "max_token":64000,
    "context_window": 200000,
    "location": "europe-west1",
    "is_image_support": True
    },
    {
        "model_name": "gemini-1.5-pro-001",
        "model_type": "google_genai",
        "max_token": 8192,
        "context_window": 2000000,
        "location": "us-central1",
        "is_image_support": True
    },
    {
        "model_name": "gemini-1.5-pro-002",
        "model_type": "google_genai",
        "max_token": 8192,
        "context_window": 2000000,
        "location": "us-central1",
        "is_image_support": True
    },
    {
        "model_name": "gemini-1.5-flash-001",
        "model_type": "google_genai",
        "max_token": 8192,
        "context_window": 1000000,
        "location": "us-central1",
        "is_image_support": True
    },
    {
        "model_name": "gemini-1.5-flash-002",
        "model_type": "google_genai",
        "max_token": 8192,
        "context_window": 1000000,
        "location": "us-central1",
        "is_image_support": True
    },
    {
            "model_name": "gemini-2.0-flash-exp",
            "model_type": "google_genai", 
            "max_token": 8192, 
            "context_window": 1048576,  #Autual context window 1048576
            "location": "us-central1",
            "is_image_support": True,
            
    },
    {
        "model_name": "gpt-4",
        "model_type": "openai",
        "max_token": 8192,
        "context_window": 8192,
        "location": "us-central1",
        "is_image_support": False,
    },
    {
        "model_name": "gpt-4o",
        "model_type": "openai",
        "max_token": 8192,
        "context_window": 100000,
        "location": "us-central1",
        "is_image_support": True,
    },
    {
        "model_name": "gpt-4-turbo",
        "model_type": "openai",
        "max_token": 8192,
        "context_window": 100000,
        "location": "us-central1",
        "is_image_support": True,
    },
    {
        "model_name": "claude-3-5-sonnet@20240620",
        "model_type": "anthropic",
        "max_token": 4096,
        "context_window": 200000,
        "location": "europe-west1",
        "is_image_support": True,
    },
    {"model_name": "claude-3-5-sonnet-v2@20241022",
      "model_type": "anthropic", 
      "max_token": 4096, 
      "context_window": 200000,
      "location": "us-central1",
      "is_image_support": True,
      },
    {
    "model_name": "gemini-2.0-flash-thinking-exp",
    "model_type": "google_genai",
    "max_token": 64000,
    "context_window": 1000000,
    "location": "us-central1",
    "is_image_support": True,
    },
    {
        "model_name": "gemini-2.5-pro",
        "model_type": "google_genai",
        "max_token": 64000,
        "context_window": 1000000,
        "location": "us-central1",
        "is_image_support": True,
    },
        {
        "model_name": "gemini-2.5-flash",
        "model_type": "google_genai",
        "max_token": 64000,
        "context_window": 1000000,
        "location": "us-central1",
        "is_image_support": True,
    }
]

model_dict = model_dict_static

def number_of_tokens(text):
    enc = tiktoken.encoding_for_model("gpt-4")
    tokens = enc.encode(text)
    return len(tokens)


def remove_extra_tokens(summary, exceeded_tokens):
    enc = tiktoken.encoding_for_model("gpt-4")

    content = summary
    content = enc.encode(content)
    content = content[:int(len(content)*exceeded_tokens)]
    summary = enc.decode(content)
    return summary


def is_valid(config):
    return all([
        config.get("context_window"),
        config.get("max_token"),
        config.get("model_name"),
        config.get("model_type"),
        config.get("location"),
        config.get("is_image_support") is not None
    ])
    
def get_valid_llm_config(llm_config, model_name_id=None):

    if llm_config and is_valid(llm_config):
        return llm_config

    fallback_config = None
    if model_name_id:
        fallback_config = next((model for model in model_dict_static if model["model_name"] == model_name_id), None)

    if not fallback_config or not is_valid(fallback_config):
        fallback_config = model_dict_static[0]

    return fallback_config


       
def adjust_prompt_and_history_for_proposal(model_name, base_prompt, llm_response, file_data: str = '' , llm_config = None):
    
    # Get model configuration
    model_config = get_valid_llm_config(llm_config, model_name)
    context_size = model_config["context_window"]
    max_token = model_config["max_token"]

    # Initialize logging information
    process_info = {
        "model_name": model_config.get("model_name"),
        "initial_tokens": 0,
        "file_data": False,
        "llm_response_included": False,
        "file_processing": "not_attempted",
        "final_tokens": 0,
        "status": "started"
    }

    final_prompt = base_prompt
    total_tokens = number_of_tokens(final_prompt)
    process_info["initial_tokens"] = total_tokens
    
    try:
        # Handle datastore if provided
        if file_data:
                parsed_datastore = file_data
                process_info["file_processing"] = "string_format"

                available_tokens = (context_size - total_tokens) / 1.40  # Apply a 25% buffer
                
                adjusted_file_data = remove_extra_tokens(
                    str(parsed_datastore),
                    available_tokens / len(str(parsed_datastore))
                )
                process_info["file_processing"] = "string_processed"
                
                if adjusted_file_data:
                    combined_prompt = f"{base_prompt}\n<USER_UPLOADED_FILE>: {adjusted_file_data} </USER_UPLOADED_FILE>"
                    process_info["datastore_included"] = True
                    
                    # Check if we can add LLM response
                    if llm_response:
                        temp_prompt = f"{combined_prompt}\nPREVIOUS RESPONSE: {llm_response}"
                        if number_of_tokens(temp_prompt) <= context_size:
                            final_prompt = temp_prompt
                            process_info["llm_response_included"] = True
                        else:
                            final_prompt = combined_prompt
                    else:
                        final_prompt = combined_prompt

        # If no datastore or datastore processing failed, try to include LLM response
        elif llm_response:
            temp_prompt = f"{base_prompt}\nPREVIOUS RESPONSE: {llm_response}"
            if number_of_tokens(temp_prompt) <= context_size:
                final_prompt = temp_prompt
                process_info["llm_response_included"] = True
                
    except Exception as e:
        process_info["status"] = f"error: {str(e)}"
        process_info["traceback"] = traceback.format_exc()
        # Fall back to base prompt + LLM response if everything else fails
        if llm_response:
            temp_prompt = f"{base_prompt}\nPREVIOUS RESPONSE: {llm_response}"
            if number_of_tokens(temp_prompt) <= context_size:
                final_prompt = temp_prompt
                process_info["llm_response_included"] = True

    # Calculate final token counts
    total_tokens = number_of_tokens(final_prompt)
    remaining_tokens = context_size - total_tokens
    required_token = min(max_token, remaining_tokens)

    # Update final process info
    process_info.update({
        "final_tokens": total_tokens,
        "remaining_tokens": remaining_tokens,
        "original_tokens": required_token,
        "required_token": int(required_token / 1.30) if 'claude' in model_name else required_token,
        "context_size": context_size,
        "max_token": max_token,
        "status": "completed" if process_info["status"] == "started" else process_info["status"]
    })


    return {
        "prompt": final_prompt.strip(),
        "remaining_tokens": remaining_tokens,
        "required_token": required_token,
        "model_name": model_config.get("model_name"),
        "model_type": model_config.get("model_type"),
        "location": model_config.get("location"),
    }

def adjust_prompt_for_document_content(model_name, base_prompt, document_content , llm_config = None):
    

    model_config = get_valid_llm_config(llm_config, model_name)
    context_size = model_config["context_window"]
    max_token = model_config["max_token"]

    process_info = {
        "model_name":  model_config.get("model_name"),
        "initial_tokens": 0,
        "document_included": False,
        "final_tokens": 0,
        "status": "started"
    }
    
    final_prompt = base_prompt
    total_tokens = number_of_tokens(base_prompt)

    process_info["initial_tokens"] = total_tokens

    if document_content:
        available_tokens = context_size - total_tokens - 2000
        truncated_content = remove_extra_tokens(document_content, available_tokens)
        if truncated_content:
            final_prompt = f"{base_prompt}\nDOCUMENT CONTENT: {truncated_content}"
            process_info["document_included"] = True

    total_tokens = number_of_tokens(final_prompt)
    remaining_tokens = context_size - total_tokens
    # required_token = min(max_token, remaining_tokens)
    required_token = 1000

    process_info.update({
        "final_tokens": total_tokens,
        "remaining_tokens": remaining_tokens,
        "required_token": required_token,
        "context_size": context_size,
        "max_token": max_token,
        "status": "completed"
    })

    logger.log(log_level='INFO' if process_info["status"] == "completed" else "ERROR",message= f"Token Adjustment: {json.dumps(process_info, indent=2)}")

    return {
        "prompt": final_prompt.strip(),
        "remaining_tokens": remaining_tokens,
        "required_token": required_token,
        "model_name": model_config.get("model_name"),
        "model_type": model_config.get("model_type"),
        "location": model_config.get("location"),
    }

# # Example usage
# model_name = "gpt-4o"
# prompt = "This is a sample input prompt for the model."
# history = ["Previous conversation message 1", "Previous conversation message 2"]

# result = adjust_prompt_and_history(model_name, prompt, history)
# print(result)