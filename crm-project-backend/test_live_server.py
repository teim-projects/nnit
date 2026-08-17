"""
Test live Django server authentication
"""
import requests

BASE_URL = "http://127.0.0.1:8000"

print("=" * 60)
print("TESTING LIVE DJANGO SERVER")
print("=" * 60)

# Test 1: Check if server is running
try:
    response = requests.get(f"{BASE_URL}/test/", timeout=2)
    print(f"\n✅ Server is running (test endpoint: {response.status_code})")
except Exception as e:
    print(f"\n❌ Server not running or not accessible: {e}")
    print("Make sure Django server is running: python manage.py runserver")
    exit(1)

# Test 2: Login and get token
print("\n" + "-" * 60)
print("LOGGING IN...")
print("-" * 60)

login_data = {
    "email_or_mobile": "adadmin@gmail.com",  # Change this to your test user
    "password": "Test@123"  # Change this to your test password
}

try:
    response = requests.post(f"{BASE_URL}/auth/dj-rest-auth/login/", json=login_data)
    if response.status_code == 200:
        token = response.json().get('access')
        print(f"✅ Login successful!")
        print(f"Token: {token[:50]}...")
    else:
        print(f"❌ Login failed: {response.status_code}")
        print(f"Response: {response.json()}")
        exit(1)
except Exception as e:
    print(f"❌ Login error: {e}")
    exit(1)

# Test 3: Test auth/me/ endpoint
print("\n" + "-" * 60)
print("TESTING /auth/me/...")
print("-" * 60)

headers = {"Authorization": f"Bearer {token}"}
try:
    response = requests.get(f"{BASE_URL}/auth/me/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ /auth/me/ works!")
    else:
        print(f"❌ /auth/me/ failed: {response.json()}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 4: Test parking/categories/ endpoint
print("\n" + "-" * 60)
print("TESTING /parking/categories/...")
print("-" * 60)

try:
    response = requests.get(f"{BASE_URL}/parking/categories/?is_active=true", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ /parking/categories/ works!")
        data = response.json()
        print(f"Returned {len(data.get('results', data))} categories")
    else:
        print(f"❌ /parking/categories/ failed!")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")

# Test 5: Test parking/requirements/ endpoint
print("\n" + "-" * 60)
print("TESTING /parking/requirements/...")
print("-" * 60)

try:
    response = requests.get(f"{BASE_URL}/parking/requirements/", headers=headers)
    print(f"Status: {response.status_code}")
    if response.status_code == 200:
        print("✅ /parking/requirements/ works!")
        data = response.json()
        print(f"Returned {len(data.get('results', data))} requirements")
    else:
        print(f"❌ /parking/requirements/ failed!")
        print(f"Response: {response.text}")
except Exception as e:
    print(f"❌ Error: {e}")

print("\n" + "=" * 60)
print("TEST COMPLETE")
print("=" * 60)
