from email.message import EmailMessage
import aiosmtplib
import os
from dotenv import load_dotenv

load_dotenv()
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
HOST_NAME=os.getenv("HOST_NAME")
PORT=os.getenv("PORT")

async def send_email(subject: str, body: str):
    message = EmailMessage()
    message["From"] = "no-reply@example.com"         
    message["To"] = "khadij70707@gmail.com"
    message["Subject"] = subject
    message.set_content(body)

    await aiosmtplib.send(
        message,
        hostname=HOST_NAME,                     
        port=587,
        start_tls=True,
        username=EMAIL_USER,              
        password=EMAIL_PASS
    )
