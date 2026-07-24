"""
Test customer and products endpoints
"""
import requests

base_url = "http://127.0.0.1:8000"

# You'll need to add a valid JWT token here
headers = {
    "Authorization": "Bearer YOUR_JWT_TOKEN_HERE",
    "Content-Type": "application/json"
}

print("🧪 Testing Quotation Endpoints...\n")

# Test 1: Customers
print("1️⃣ Testing Customers Endpoint:")
print(f"   GET {base_url}/quotation/customer/")
try:
    response = requests.get(f"{base_url}/quotation/customer/", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Found {len(data)} customers")
        if data:
            print(f"   Sample: {data[0].get('name', 'N/A')}")
    else:
        print(f"   ❌ Error: {response.text}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print()

# Test 2: Products  
print("2️⃣ Testing Products Endpoint:")
print(f"   GET {base_url}/quotation/products/")
try:
    response = requests.get(f"{base_url}/quotation/products/", headers=headers)
    print(f"   Status: {response.status_code}")
    if response.status_code == 200:
        data = response.json()
        print(f"   ✅ Found {len(data)} products")
        if data:
            print(f"   Sample: {data[0].get('product_name', 'N/A')}")
    else:
        print(f"   ❌ Error: {response.text}")
except Exception as e:
    print(f"   ❌ Error: {e}")

print()
print("📝 Note: Add your JWT token to test with authentication")
