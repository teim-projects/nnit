"""
Test parking endpoints with YOUR token from browser
"""
import requests
import sys

BASE_URL = "http://127.0.0.1:8000"

print("=" * 70)
print(" TESTING PARKING ENDPOINTS WITH YOUR TOKEN")
print("=" * 70)

print("\nInstructions:")
print("1. Open browser DevTools (F12)")
print("2. Go to Application/Storage -> Local Storage")
print("3. Copy the value of 'access_token' or 'access'")
print("4. Paste it below when prompted")
print()

token = input("Enter your token: ").strip()

if not token:
    print("❌ No token provided!")
    exit(1)

print("\n" + "=" * 70)

# Test 1: /auth/me/
print("\n[1] Testing /auth/me/ (should work)...")
headers = {"Authorization": f"Bearer {token}"}
try:
    response = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
    if response.status_code == 200:
        print(f"  ✅ SUCCESS ({response.status_code})")
        user_data = response.json()
        print(f"  User: {user_data.get('email', 'N/A')}")
    else:
        print(f"  ❌ FAILED ({response.status_code})")
        print(f"  Response: {response.text[:200]}")
except Exception as e:
    print(f"  ❌ ERROR: {e}")

# Test 2: /parking/categories/
print("\n[2] Testing /parking/categories/ (your issue)...")
try:
    response = requests.get(f"{BASE_URL}/parking/categories/?is_active=true", headers=headers)
    if response.status_code == 200:
        print(f"  ✅ SUCCESS ({response.status_code}) - ISSUE FIXED!")
        data = response.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        print(f"  Found {len(results) if isinstance(results, list) else 'unknown'} categories")
    elif response.status_code == 401:
        print(f"  ❌ UNAUTHORIZED ({response.status_code}) - STILL BROKEN")
        print(f"  Response: {response.text}")
    else:
        print(f"  ❌ OTHER ERROR ({response.status_code})")
        print(f"  Response: {response.text[:200]}")
except Exception as e:
    print(f"  ❌ ERROR: {e}")

# Test 3: /parking/products/
print("\n[3] Testing /parking/products/...")
try:
    response = requests.get(f"{BASE_URL}/parking/products/?is_active=true", headers=headers)
    if response.status_code == 200:
        print(f"  ✅ SUCCESS ({response.status_code})")
    elif response.status_code == 401:
        print(f"  ❌ UNAUTHORIZED ({response.status_code})")
    else:
        print(f"  ❌ OTHER ERROR ({response.status_code})")
except Exception as e:
    print(f"  ❌ ERROR: {e}")

# Test 4: /parking/requirements/
print("\n[4] Testing /parking/requirements/...")
try:
    response = requests.get(f"{BASE_URL}/parking/requirements/", headers=headers)
    if response.status_code == 200:
        print(f"  ✅ SUCCESS ({response.status_code})")
        data = response.json()
        results = data.get('results', data) if isinstance(data, dict) else data
        print(f"  Found {len(results) if isinstance(results, list) else 'unknown'} requirements")
    elif response.status_code == 401:
        print(f"  ❌ UNAUTHORIZED ({response.status_code})")
    else:
        print(f"  ❌ OTHER ERROR ({response.status_code})")
except Exception as e:
    print(f"  ❌ ERROR: {e}")

print("\n" + "=" * 70)
print(" TEST COMPLETE")
print("=" * 70)
print("\nIf all tests show ✅, the issue is FIXED!")
print("If /parking/ endpoints show ❌ 401, the server needs restart.")
print("=" * 70)
