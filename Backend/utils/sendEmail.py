from email.message import EmailMessage
import aiosmtplib
import os
from dotenv import load_dotenv
import base64


load_dotenv()
EMAIL_USER = os.getenv("EMAIL_USER")
EMAIL_PASS = os.getenv("EMAIL_PASS")
HOST_NAME=os.getenv("HOST_NAME")
PORT=os.getenv("PORT")

async def send_email(subject: str, body: str,reciever:str,attachment=None):
    message = EmailMessage()
    message["From"] = "khadij70707@gmail.com"         
    message["To"] = reciever
    message["Subject"] = subject
    message.set_content(body)
    if attachment:
        # Example base64 format: "data:application/pdf;base64,JVBERi0xLj..."
        header, base64_data = attachment.split(",", 1)
        file_data = base64.b64decode(base64_data)

        # Extract MIME type and filename from header
        import re
        mime_match = re.search(r'data:(.*?);base64', header)
        mime_type = mime_match.group(1) if mime_match else 'application/octet-stream'
        maintype, subtype = mime_type.split("/")

        # Optionally derive filename from MIME type
        filename = f"attachment.{subtype}"

        message.add_attachment(file_data, maintype=maintype, subtype=subtype, filename=filename)


    await aiosmtplib.send(
        message,
        hostname=HOST_NAME,                     
        port=587,
        start_tls=True,
        username=EMAIL_USER,              
        password=EMAIL_PASS
    )
