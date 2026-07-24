"""
Test quotation creation with large unit_price
"""
import requests
import json

# Test data
data = {
    "customer": 1,  # Update with valid customer ID
    "parking_product_id": 1,  # Update with valid parking product ID
    "quantity": 1,
    "unit_price": "999999999.99",  # Large price that was causing error before
    "gst_percent": 18
}

url = "http://127.0.0.1:8000/quotation/simple-quotation/"

print("🧪 Testing quotation creation with large unit_price...")
print(f"Unit Price: {data['unit_price']}")

try:
    response = requests.post(url, json=data, headers={"Content-Type": "application/json"})
    
    if response.status_code == 201:
        print("✅ SUCCESS! Quotation created")
        print(json.dumps(response.json(), indent=2))
    else:
        print(f"❌ FAILED: Status {response.status_code}")
        print(response.text)
except Exception as e:
    print(f"❌ ERROR: {e}")
