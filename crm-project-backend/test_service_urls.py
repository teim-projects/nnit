import os
import django

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'krishna_air.settings.dev')
django.setup()

from django.urls import resolve, reverse

try:
    url = reverse('technician-list')
    print("Resolved technician-list URL:", url)
except Exception as e:
    print("Error reversing technician-list:", e)

try:
    url = reverse('servicerequest-list')
    print("Resolved servicerequest-list URL:", url)
except Exception as e:
    print("Error reversing servicerequest-list:", e)
