import requests

try:
    res = requests.get('http://127.0.0.1:8000/services/technicians/')
    print("GET /services/technicians/ -> Status:", res.status_code)
except Exception as e:
    print("Error reaching /services/technicians/:", e)

try:
    res = requests.get('http://127.0.0.1:8000/api/services/technicians/')
    print("GET /api/services/technicians/ -> Status:", res.status_code)
except Exception as e:
    print("Error reaching /api/services/technicians/:", e)
