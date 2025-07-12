from .database import DB
from .shared import logger
import os

redis_url = os.getenv("REDIS_URL")
genai_api_key = os.getenv("GENAI_API_KEY")


db_schema = os.getenv("DB_SCHEMA")
db_host = os.getenv("DB_HOST")
db_user = os.getenv("DB_USER")
db_password = os.getenv("DB_PASSWORD")


db_obj = DB(
    schema= db_schema,
    port= '5432',
    host= db_host,
    username=db_user,
    password=db_password,
)
