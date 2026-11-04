import requests

url = "http://localhost:8000/lead/lead/import-bulk/"
payload = {
    "records": [
        {
            "Customer Name": "Test User 1",
            "Contact Number": "9998887771",
            "Email": "test1@example.com",
            "Company Name": "Test Site 1",
            "Lead Source": "website",
            "Status": "new"
        }
    ]
}

try:
    res = requests.post(url, json=payload)
    print("Status Code:", res.status_code)
    print("Response JSON:", res.json())
except Exception as e:
    print("Error:", e)
