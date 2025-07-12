from langchain_community.chat_message_histories import RedisChatMessageHistory
from langchain.schema import HumanMessage, AIMessage
from utils import redis_url , logger
import traceback



class ChatHistoryManager:
    """
    This class is used to manage the chat history of the user and the agent.
    """
    def __init__(self, session_id, key_prefix='sprint_speed', ttl=3600):
        self.chat_history = RedisChatMessageHistory(session_id=session_id, url=redis_url, key_prefix=key_prefix, ttl=ttl)
        logger.debug("Chat history manager initialized successfully.")

    def add_message_child(self, session_id, key, message):
        try:
            redis_key = f"{key}:{session_id}"
            self.chat_history.redis_client.lpush(redis_key, message)
            if self.chat_history.ttl:
                self.chat_history.redis_client.expire(key, self.chat_history.ttl)
        except Exception as e:
            logger.error(f"Failed to add message to Redis: {e} , message: {message} , key: {key}")

    def get_message_child(self, key, session_id):
        try:
            redis_key = f"{key}:{session_id}"
            messages = self.chat_history.redis_client.lrange(redis_key, 0, -1)
            return [msg.decode("utf-8") if isinstance(msg, bytes) else msg for msg in messages]
        except Exception as e:
            logger.error(f"Failed to get messages from Redis: {e}, key: {key}")
            return []

    def store_chat_history(self, user_query, agent_response):
        try:
            self.chat_history.add_message(HumanMessage(content=user_query, additional_kwargs={"type": "plan"}))
            self.chat_history.add_message(AIMessage(content=agent_response, additional_kwargs={"type": "plan"}))
            logger.debug("Stored chat history successfully.")
        except Exception as e:
            trace = traceback.format_exc()
            logger.error(f"Failed to store chat history: {e}\nTraceback: {trace}")

    def get_chat_history(self):
        try:
            history = self.chat_history.messages
            return history
        except Exception as e:
            trace = traceback.format_exc()
            logger.error(f"Failed to get chat history: {e}\nTraceback: {trace}")
            return []

    def create_user_message_string(self):
        try:
            user_message_string = ""
            for message in self.chat_history.messages:
                if isinstance(message, HumanMessage) and message.additional_kwargs.get("type") == "plan":
                    user_message_string += f"User: {message.content}\n"
                elif isinstance(message, AIMessage) and message.additional_kwargs.get("type") == "plan":
                    user_message_string += f"Agent: {message.content}\n"

            logger.debug(f"Created user message string successfully.\n{user_message_string}")
            return user_message_string

        except Exception as e:
            trace = traceback.format_exc()
            logger.error(f"Failed to create user message string: {e}\nTraceback: {trace}")
            return ""

    def store_proposal_chat_history(self, user_query, agent_response):
        try:
            self.chat_history.add_message(HumanMessage(content=user_query, additional_kwargs={"type": "proposal"}))
            self.chat_history.add_message(AIMessage(content=agent_response, additional_kwargs={"type": "proposal"}))
            logger.debug("Stored chat history successfully.")
        except Exception as e:
            trace = traceback.format_exc()
            logger.error(f"Failed to store chat history: {e}\nTraceback: {trace}")

    def create_proposal_user_message_string(self):
        try:
            history = self.get_chat_history()
            last_agent_message = None
            user_message_string = ""

            for message in history:
                if isinstance(message, HumanMessage) and message.additional_kwargs.get("type") == "proposal":
                    user_message_string += f"User: {message.content}\n"

                if isinstance(message, AIMessage) and message.additional_kwargs.get("type") == "proposal":
                    last_agent_message = f"Agent: {message.content}"  # pick only the latest one

            if last_agent_message:
                user_message_string += f"\n{last_agent_message}"

            logger.debug(f"Created proposal user message string successfully.\n{user_message_string}")
            return user_message_string

        except Exception as e:
            trace = traceback.format_exc()
            logger.error(f"Failed to create proposal user message string: {e}\nTraceback: {trace}")
            return ""