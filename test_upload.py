#!/usr/bin/env python3
import requests
import tempfile
import os

# Login to get token
login_data = {
    'email': 'test.admin@tiskis.edu.ua',
    'password': 'SecurePass123!'
}

response = requests.post('http://localhost:3000/api/auth/login', json=login_data)
if response.status_code == 200:
    token = response.json()['token']
    print(f"✅ Login successful")
else:
    print(f"❌ Login failed: {response.status_code}")
    exit(1)

# Create a test file
test_content = "Це тестовий документ для системи ТИС КІС"

with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
    f.write(test_content)
    temp_file_path = f.name

try:
    # Test file upload
    files = {
        'file': ('test_document.txt', open(temp_file_path, 'rb'), 'text/plain')
    }
    data = {
        'title': 'Тестовий документ',
        'description': 'Опис тестового документа'
    }
    
    headers = {"Authorization": f"Bearer {token}"}
    
    print("Testing file upload...")
    response = requests.post('http://localhost:3000/api/documents/upload', files=files, data=data, headers=headers, timeout=30)
    
    print(f"Status: {response.status_code}")
    print(f"Response: {response.text}")
    
    if response.status_code == 200:
        result = response.json()
        print(f"✅ Upload successful: {result['document']['id']}")
    else:
        print(f"❌ Upload failed")
        
finally:
    # Clean up
    if 'files' in locals() and files['file'][1]:
        files['file'][1].close()
    if os.path.exists(temp_file_path):
        os.unlink(temp_file_path)