from email.message import EmailMessage
import aiosmtplib
import os
from dotenv import load_dotenv

load_dotenv()
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
async def send_email(subject: str, body: str):
    message = EmailMessage()
    message["From"] = "no-reply@example.com"         # Replace with your sender email
    message["To"] = "khadij70707@gmail.com"
    message["Subject"] = subject
    message.set_content(body)

    await aiosmtplib.send(
        message,
        hostname="smtp.gmail.com",                     
        port=587,
        start_tls=True,
        username=EMAIL_USER,              
        password=EMAIL_PASS
    )
