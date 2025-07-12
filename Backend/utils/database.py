from psycopg2 import pool
import os
from dotenv import load_dotenv
import psycopg2
import time
from psycopg2 import OperationalError, InterfaceError
from .shared import logger
import uuid
from typing import List, Dict, Any
load_dotenv()

MIN_CONNECTION = int(os.getenv("MIN_CONNECTION", 1))
MAX_CONNECTION = int(os.getenv("MAX_CONNECTION", 6))
print("MIN_CONNECTION", MIN_CONNECTION, type(MIN_CONNECTION))
print("MAX_CONNECTION", MAX_CONNECTION, type(MAX_CONNECTION))


class DB:
    def __init__(self, schema, port, host, username, password):
        self.schema = schema
        self.port = port
        self.host = host
        self.username = username
        self.password = password
        self.connection_pool = None
        self.max_retries = 3
        self.retry_delay = 3  # seconds
        self.init_connection_pool()

    def init_connection_pool(self):
        try:
            """Initialize the connection pool with retries."""
            retry_count = 0
            while retry_count < self.max_retries:
                try:
                    self.connection_pool = self.create_connection_pool()
                    print(f"Connection pool initialized successfully after {retry_count + 1} attempts.")
                    return
                except Exception as e:
                    retry_count += 1
                    if retry_count == self.max_retries:
                        raise Exception(f"Failed to initialize connection pool after {self.max_retries} attempts: {e}")
                    time.sleep(self.retry_delay)
        except Exception as e:
            logger.critical(f"Error initializing connection pool: {e}")
            raise Exception(f"Error initializing connection pool: {e}")            

    def create_connection_pool(self):
        """Create a connection pool with proper SSL configuration."""
        try:
            print("Creating connection pool")
            connection_pool = pool.SimpleConnectionPool(
                minconn=MIN_CONNECTION,
                maxconn=MAX_CONNECTION,
                host=self.host,
                port=self.port, 
                user=self.username,
                password=self.password
            )
            
            # Test and initialize connections in the pool
            for _ in range(connection_pool.minconn):
                conn = connection_pool.getconn()
                conn.autocommit = True
                connection_pool.putconn(conn)
            
            return connection_pool
        
        except Exception as e:
            logger.critical(f"Error creating connection pool: {e}")
            raise Exception(f"Error creating connection pool: {e}")

    def get_connection_and_cursor(self):
        """Get a database connection and cursor with retry mechanism."""
        for attempt in range(1, self.max_retries + 1):
            try:
                connection = self.connection_pool.getconn()

                if connection.closed != 0:
                    print(f"Connection status for closed connection: {connection.closed} , Attempt: {attempt}")
                    logger.warning("Connection closed. Reinitializing connection pool.")
                    self.init_connection_pool()
                    connection = self.connection_pool.getconn()

                print(f"Connection status: {connection.closed} , type {type(connection.closed)}, Attempt: {attempt}")
                return connection, connection.cursor()

            except psycopg2.OperationalError as e:
                logger.error(f"OperationalError: {e}. Retrying {attempt}/{self.max_retries}")
                time.sleep(self.retry_delay)
                self.init_connection_pool()  # Reinitialize pool immediately if OperationalError occurs

            except Exception as e:
                logger.critical(f"Unexpected error: {e}")
                raise Exception(f"Unexpected error: {e}")

        raise Exception("Failed to get a database connection after multiple attempts.")
    
    def close_connection_and_cursor(self, connection, cursor):
        """Close the cursor and return the connection to the pool."""
        if cursor:
            cursor.close()
        if connection and self.connection_pool:
            print("Inside close_connection_and_cursor and connection is ", connection.closed)
            if connection.closed == 0: # for preventing error: trying to put unkeyed connection
                self.connection_pool.putconn(connection)
            else:
                print(f"Connection already closed in close_connection_and_cursor {connection.closed}")    

    def close_pool(self):
        """Close all connections in the pool."""
        if self.connection_pool:
            self.connection_pool.closeall()
            print("Connection pool closed")

    def retry_for_operational_error(self, query, data):
        for attempt in range(self.max_retries):
            try:
                print("Inside Operation Method", self.max_retries)
                time.sleep(1)  # Wait before retrying
                self.init_connection_pool()
                connection, cursor = self.get_connection_and_cursor()
                cursor.execute(query, data if data else ())
                result = cursor.fetchall()
                logger.info(f"Data retrieved successfully after retry in retry_for_operational_error method. query: {query}, data: {data}, result: {result}")
                return result
            except Exception as e:
                logger.error(f"Retry attempt {attempt + 1} failed. Error: {e} for query: {query}")
            finally:
                self.close_connection_and_cursor(connection, cursor)
        raise Exception("Retry not working")
    
    def retrieve_data(self, query='', data=None):
        connection, cursor = None, None
        try:
            connection, cursor = self.get_connection_and_cursor()
            if data:
                cursor.execute(query, data)
            else:
                cursor.execute(query)
            result = cursor.fetchall()
            logger.info(f"Data retrieved successfully in retrieve_data. query: {query}, data: {data}, result: {result}")
            return result
        except (OperationalError, InterfaceError) as e: 
            print("Operation Error occurred in retrieve_data", e)
            return self.retry_for_operational_error(query, data)
        
        except Exception as error:
            print("Error occurred in retrieve_data", error)
            logger.error(f"Error retrieving data: {error} for query: {query}")
            if connection:
                connection.rollback()
            raise Exception(f"Error retrieving data: {error} for query: {query}")    
        finally:
            self.close_connection_and_cursor(connection, cursor)

    def execute_query(self, query, data=None):
        connection, cursor = None, None
        try:
            connection, cursor = self.get_connection_and_cursor() 
            if data:
                cursor.execute(query, data)
            else:
                cursor.execute(query)
            
            connection.commit()
            logger.info(f"Query executed successfully. query: {query} , data: {data}")
            return True
        
        except (OperationalError, InterfaceError) as e: 
            print("Operation Error occurred in retrieve_data", e)
            return self.retry_execute_query(query, data)
        
        except Exception as e:
            print("Error executing query:", e)
            if connection:
                connection.rollback()
            error_message = f"Database query failed: {str(e)}\nQuery: {query}\nParameters: {data}"
            logger.error(error_message)
            raise Exception("Database query failed")

        finally:
            self.close_connection_and_cursor(connection, cursor)     

    def retry_execute_query(self, query, data):
        """Retry executing a query in case of transient errors."""
        for attempt in range(1, self.max_retries + 1):
            connection, cursor = None, None
            try:
                print(f"Retrying query execution (Attempt {attempt}/{self.max_retries})")
                time.sleep(1)  # Wait before retrying
                connection, cursor = self.get_connection_and_cursor()

                cursor.execute(query, data if data else ())

                # Commit only for modification queries
                if query.strip().lower().startswith(("insert", "update", "delete")):
                    connection.commit()

                logger.info(f"Query executed successfully after retry. Attempt {attempt}. Query: {query}")
                return True

            except Exception as e:
                logger.error(f"Retry attempt {attempt} failed in retry_execute_query. Error: {e} for query: {query}")
                if connection:
                    connection.rollback()
                raise Exception("Query execution failed after multiple retries.")

            finally:
                self.close_connection_and_cursor(connection, cursor)

    def insert_project(self, project_id: str, project_name : str ,  conversation_id: str):
        """Insert a new project into the database if it does not already exist."""
        try:
            # Check if project exists
            check_query = f"""
                SELECT 1 FROM {self.schema}.projects WHERE project_id = %s
            """
            exists = self.retrieve_data(check_query, (project_id,))
            if exists:
                logger.info(f"Project already exists: {project_id}")
                return

            # Insert if not exists
            insert_query = f"""
                INSERT INTO {self.schema}.projects (project_id, project_name, created_at)
                VALUES (%s, %s , CURRENT_TIMESTAMP)
            """
            data = (project_id, project_name)
            self.execute_query(insert_query, data)
            logger.info(f"Project inserted successfully: {project_id}")
        except Exception as e:
            logger.error(f"Error inserting project: {e}")
            raise Exception(f"Error inserting project: {e}")
    
    def insert_conversation(self, conversation_id: str, project_id: str, chat_type: str):
        """Insert a new conversation into the database if it does not already exist."""
        try:
            # Check if conversation exists
            check_query = f"""
                SELECT 1 FROM {self.schema}.conversation WHERE conversation_id = %s
            """
            exists = self.retrieve_data(check_query, (conversation_id,))
            if exists:
                logger.info(f"Conversation already exists: {conversation_id}")
                return

            # Insert if not exists
            insert_query = f"""
                INSERT INTO {self.schema}.conversation (conversation_id, project_id, chat_type, created_at)
                VALUES (%s, %s, %s, CURRENT_TIMESTAMP)
            """
            data = (conversation_id, project_id, chat_type)
            self.execute_query(insert_query, data)
            logger.info(f"Conversation inserted successfully: {conversation_id}, {project_id}, {chat_type}")
        except Exception as e:
            logger.error(f"Error inserting conversation: {e}")
            raise Exception(f"Error inserting conversation: {e}")
        
    def save_file_attachments(self , conversation_id: str, processed_files: List[Dict[str, Any]]) -> List[str]:
        try:
            """
            Save file attachments to the database.
            Returns a list of attachment IDs.
            """
            attachment_ids = []
            
            attachment_query =f"""
                    INSERT INTO {self.schema}.conversation_attachment 
                    (attachment_id, conversation_id, file_name, file_type, file_size, file_content, created_at, is_deleted) 
                    VALUES
                    """
            for file_info in processed_files:
                attachment_id = str(uuid.uuid4())
                
                # Insert the attachment record
                attachment_query += """(%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, FALSE),"""
                
                attachment_data = (
                    attachment_id, 
                    conversation_id, 
                    file_info["file_name"],
                    file_info["file_type"],
                    file_info["file_size"],
                file_info["file_content"]
                )
                attachment_ids.append(attachment_id)

            attachment_query = attachment_query[:-1]   
            self.execute_query(attachment_query, attachment_data)
            
            
            return attachment_ids
        except Exception as e:
            logger.error(f"Error saving file attachments: {e}")
            raise Exception(f"Error saving file attachments: {e}")

    def read_files(self, file_ids: List[str]) -> str:
        """
        Read file contents from the database based on provided file IDs.
        Returns a string containing the concatenated file contents.
        """
        try:
            if not file_ids:
                return ''
            
            query = f"""
                SELECT file_name , file_content FROM {self.schema}.conversation_attachment 
                WHERE attachment_id = ANY(%s) AND is_deleted = FALSE
            """
            result = self.retrieve_data(query, (file_ids,))
            file_content = ""
            for file_info in result:
                file_content += f"File Name: {file_info[0]}\nContent:\n{file_info[1]}\n\n"
            
            return file_content
        
        except Exception as e:
            logger.error(f"Error reading files: {e}")
            raise Exception(f"Error reading files: {e}")
        


    def insert_conversation_message(self, conversation_id: str, user_query: str, agent_response: str, model_id: str, model_type: str):
        """Insert a new conversation message into the database."""
        try:
            message_id = str(uuid.uuid4())
            insert_query = f"""
                INSERT INTO {self.schema}.conversation_message 
                (message_id , conversation_id, user_query, agent_response, model_id, model_type, created_at) 
                VALUES (%s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP)
            """
            data = (message_id , conversation_id, user_query, agent_response, model_id, model_type)
            self.execute_query(insert_query, data)
            logger.info(f"Conversation message inserted successfully: {conversation_id}")
        except Exception as e:
            logger.error(f"Error inserting conversation message: {e}")
            return
                
    def get_all_llm_models(self):
        try:
            query = """
                SELECT model_id, display_model_name, model_name, model_type, context_window, max_token, location, is_image_support, is_deleted, created_at
                FROM task_management.llm_models
                WHERE is_deleted = FALSE
                ORDER BY created_at DESC
            """
            return self.retrieve_data(query=query)
        except Exception as e:
            logger.error(f"Error retrieving LLM models: {e}")
            raise Exception("Failed to retrieve LLM models.")
    
    def get_role_id_by_name(self, role_name: str):
        query = """
            SELECT role_id FROM task_management.roles WHERE role_name = %s
        """
        result = self.retrieve_data(query=query, data=(role_name,))
        return result if result else None
    
    def check_user_query(self, email: str) -> bool:
        query = """
            SELECT 1 FROM task_management.users WHERE email = %s
        """
        result = self.retrieve_data(query=query, data=(email,))
        return result
    
    def insert_user(self, user_data: tuple):
        query = """
            INSERT INTO task_management.users 
            (user_id, username, email, password, first_name, last_name, role_id, created_at, updated_at, is_active)
            VALUES (%s, %s, %s, %s, %s, %s, %s, %s, %s, TRUE)
        """
        self.execute_query(query=query, data=user_data)

    def get_user_by_email(self, email: str):
        query = """
            SELECT user_id, username, email, password, first_name, last_name, role_id 
            FROM task_management.users 
            WHERE email = %s
        """
        result = self.retrieve_data(query=query, data=(email,))
        return result if result else None
    
    def get_role(self):
        query = """
            SELECT role_id, role_name, description 
            FROM task_management.roles
        """
        return self.retrieve_data(query=query)


    def get_finalize_srs(self, project_id: str) -> str:
        """Retrieve the final SRS from the conversation messages."""
        try:

            query = f"""
                SELECT agent_response 
                FROM {self.schema}.conversation_message cm
                JOIN {self.schema}.conversation c ON cm.conversation_id = c.conversation_id
                WHERE c.project_id = %s 
                Order by cm.created_at DESC LIMIT 1"""
            
            result = self.retrieve_data(query, (project_id,))
            if result:
                return result[0][0]  # Return the agent response
            return ""
        except Exception as e:
            logger.error(f"Error retrieving final SRS: {e}")
            raise Exception(f"Error retrieving final SRS: {e}")

    def insert_task(self, project_id: str, task_data: List[Dict[str, Any]]):
        """
        Insert multiple tasks into the tasks table using a single query with multiple value sets.
        """
        try:
            if not task_data:
                return []
                
            # Start building the query
            insert_query = f"""
                INSERT INTO {self.schema}.tasks (
                    task_id, title, description, project_id, status, priority, complexity,
                    estimated_hours, created_by, due_date, technical_requirements, acceptance_criteria, 
                    created_at, updated_at
                ) VALUES 
            """
            
            # Collect all task IDs and prepare data tuples
            task_ids = []
            all_values = ()
            
            # Build the values part of the query and collect all data
            for task in task_data:
                # Generate task ID if not provided
                task_id = task.get("id") or task.get("task_id") or f"TASK-{str(uuid.uuid4())[:8]}"
                task_ids.append(task_id)
                
                # Add value placeholders for this task
                insert_query += "(%s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, %s, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP),"
                
                # Add actual values to the data tuple
                task_values = (
                    task_id,
                    task.get("task_title") or task.get("title"),
                    task.get("description"),
                    project_id,
                    task.get("status", "open"),
                    task.get("priority", "medium"),
                    task.get("complexity", "medium"),
                    task.get("estimated_hours", 4),
                    task.get("created_by"),
                    task.get("due_date"),
                    task.get("technical_requirements", ""),
                    task.get("acceptance_criteria", "")
                )
                all_values += task_values
            
            # Remove the trailing comma
            insert_query = insert_query[:-1]
            
            # Execute the query with all data
            self.execute_query(insert_query, all_values)
            logger.info(f"{len(task_data)} task(s) inserted successfully.")
            
            return task_ids
            
        except Exception as e:
            logger.error(f"Error inserting tasks: {e}")
            raise Exception(f"Error inserting tasks: {e}")

