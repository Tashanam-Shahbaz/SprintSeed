from psycopg2 import pool
import os
from dotenv import load_dotenv
import psycopg2
import time
from psycopg2 import OperationalError, InterfaceError
from .shared import logger

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
