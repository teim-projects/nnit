import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from django.core.mail import EmailMultiAlternatives
from django.conf import settings

subject = "Proposal Notice — NNIT Car Parking Systems"
from_email = settings.DEFAULT_FROM_EMAIL
recipient_list = ["bharatsharmaji885@gmail.com"]

html = '''<!DOCTYPE html>
<html>
<head><meta charset="utf-8"></head>
<body style="font-family:'Segoe UI',sans-serif; background-color:#f4f6f9; margin:0; padding:20px; color:#333;">
  <div style="max-width:600px; margin:0 auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 15px rgba(0,0,0,0.08); border:1px solid #e2e8f0;">
    <img src="https://files.catbox.moe/4i67y4.jpg" alt="NNIT Car Parking Systems Header" style="width:100%; display:block; margin:0; padding:0; border:0;" />
    <div style="padding:25px; line-height:1.6;">
      <h3 style="color:#0f172a;">Dear Pooja,</h3>
      <p>Thank you for reaching out to <strong>NNIT Car Parking Systems</strong>! We design high-performance automated stacker & puzzle parking solutions.</p>
      <p style="margin-top:20px;">Best Regards,<br><strong>NNIT Team</strong></p>
    </div>
  </div>
</body>
</html>'''

try:
    msg = EmailMultiAlternatives(subject, "Dear Pooja,\nThank you for reaching out to NNIT Car Parking Systems!", from_email, recipient_list)
    msg.attach_alternative(html, "text/html")
    res = msg.send(fail_silently=False)
    print("Success! Number of emails sent:", res)
except Exception as e:
    print("SMTP Error:", type(e).__name__, str(e))
