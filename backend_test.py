#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for ТИС КІС Calendar and Tasks System
Testing Calendar Events API, Tasks Management API, and Notifications API
Plus existing authentication, user management, and document management
"""

import requests
import json
import os
import tempfile
import time
from datetime import datetime, timedelta
import uuid

# Configuration - use external URL for testing
BASE_URL = "https://tys-edu-system.preview.emergentagent.com/api"

class TISKISBackendTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        self.test_user_data = {
            "email": "test.admin@tiskis.edu.ua",
            "password": "SecurePass123!",
            "fullName": "Тестовий Адміністратор",
            "role": "admin"
        }
        self.test_manager_data = {
            "email": "test.manager@tiskis.edu.ua", 
            "password": "ManagerPass456!",
            "fullName": "Тестовий Менеджер",
            "role": "manager"
        }
        self.test_user_regular = {
            "email": "test.user@tiskis.edu.ua",
            "password": "UserPass789!",
            "fullName": "Тестовий Користувач",
            "role": "user"
        }
        self.results = {
            "authentication": {},
            "user_management": {},
            "document_management": {},
            "enhanced_document_workflow": {},
            "file_upload_system": {},
            "workflow_history": {},
            "dashboard_stats": {},
            "calendar_events_api": {},
            "tasks_management_api": {},
            "notifications_api": {},
            "complete_workflow": {},
            "summary": {"passed": 0, "failed": 0, "errors": []}
        }
        self.test_document_id = None
        self.manager_token = None
        self.user_token = None
        self.test_events = []
        self.test_tasks = []
        self.test_notifications = []

    def log_result(self, category, test_name, success, message, response_data=None):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {category} - {test_name}: {message}")
        
        if category not in self.results:
            self.results[category] = {}
        
        self.results[category][test_name] = {
            "success": success,
            "message": message,
            "response_data": response_data,
            "timestamp": datetime.now().isoformat()
        }
        
        if success:
            self.results["summary"]["passed"] += 1
        else:
            self.results["summary"]["failed"] += 1
            self.results["summary"]["errors"].append(f"{category} - {test_name}: {message}")

    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        # Handle trailing slash issue - remove trailing slash from endpoint if present
        endpoint = endpoint.rstrip('/')
        url = f"{self.base_url}{endpoint}"
        
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
        
        if self.auth_token:
            default_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=default_headers, timeout=10)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=default_headers, timeout=10)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=default_headers, timeout=10)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=default_headers, timeout=10)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request error for {method} {url}: {str(e)}")
            return None

    def test_api_root(self):
        """Test API root endpoint"""
        print("\n=== Testing API Root Endpoint ===")
        
        response = self.make_request("GET", "/")
        if response and response.status_code == 200:
            data = response.json()
            if "ТИС КІС API" in data.get("message", ""):
                self.log_result("authentication", "api_root", True, "API root endpoint working")
                return True
            else:
                self.log_result("authentication", "api_root", False, f"Unexpected response: {data}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("authentication", "api_root", False, f"API root failed with status: {status}")
        return False

    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        
        # Test admin registration
        response = self.make_request("POST", "/auth/register", self.test_user_data)
        if response and response.status_code == 200:
            data = response.json()
            if "успішно зареєстрований" in data.get("message", ""):
                self.log_result("authentication", "register_admin", True, "Admin registration successful")
            else:
                self.log_result("authentication", "register_admin", False, f"Unexpected response: {data}")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response else "No response"
            self.log_result("authentication", "register_admin", False, f"Registration failed: {status} - {error_msg}")

        # Test manager registration
        response = self.make_request("POST", "/auth/register", self.test_manager_data)
        if response and response.status_code == 200:
            self.log_result("authentication", "register_manager", True, "Manager registration successful")
        else:
            status = response.status_code if response else "No response"
            self.log_result("authentication", "register_manager", False, f"Manager registration failed: {status}")

        # Test regular user registration
        response = self.make_request("POST", "/auth/register", self.test_user_regular)
        if response and response.status_code == 200:
            self.log_result("authentication", "register_user", True, "User registration successful")
        else:
            status = response.status_code if response else "No response"
            self.log_result("authentication", "register_user", False, f"User registration failed: {status}")

        # Test duplicate registration (should fail)
        response = self.make_request("POST", "/auth/register", self.test_user_data)
        if response and response.status_code == 400:
            data = response.json()
            if "уже існує" in data.get("error", ""):
                self.log_result("authentication", "duplicate_registration", True, "Duplicate registration properly rejected")
            else:
                self.log_result("authentication", "duplicate_registration", False, f"Unexpected error message: {data}")
        elif response is None:
            self.log_result("authentication", "duplicate_registration", False, "No response received")
        else:
            status = response.status_code if response else "No response"
            self.log_result("authentication", "duplicate_registration", False, f"Duplicate registration not handled: {status}")

        # Test invalid registration (missing fields)
        invalid_data = {"email": "test@example.com"}
        response = self.make_request("POST", "/auth/register", invalid_data)
        if response and response.status_code == 400:
            self.log_result("authentication", "invalid_registration", True, "Invalid registration properly rejected")
        elif response is None:
            self.log_result("authentication", "invalid_registration", False, "No response received")
        else:
            status = response.status_code if response else "No response"
            self.log_result("authentication", "invalid_registration", False, f"Invalid registration not handled: {status}")

    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== Testing User Login ===")
        
        # Test valid login
        login_data = {
            "email": self.test_user_data["email"],
            "password": self.test_user_data["password"]
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        if response and response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                self.auth_token = data["token"]
                self.log_result("authentication", "valid_login", True, "Login successful with token")
                
                # Verify user data in response
                user = data["user"]
                if user.get("email") == self.test_user_data["email"] and "password" not in user:
                    self.log_result("authentication", "login_user_data", True, "User data correct, password not exposed")
                else:
                    self.log_result("authentication", "login_user_data", False, "User data incorrect or password exposed")
            else:
                self.log_result("authentication", "valid_login", False, f"Missing token or user in response: {data}")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response else "No response"
            self.log_result("authentication", "valid_login", False, f"Login failed: {status} - {error_msg}")

        # Test invalid login
        invalid_login = {
            "email": self.test_user_data["email"],
            "password": "wrongpassword"
        }
        
        response = self.make_request("POST", "/auth/login", invalid_login)
        if response and response.status_code == 401:
            self.log_result("authentication", "invalid_login", True, "Invalid login properly rejected")
        elif response is None:
            self.log_result("authentication", "invalid_login", False, "No response received")
        else:
            status = response.status_code if response else "No response"
            self.log_result("authentication", "invalid_login", False, f"Invalid login not handled: {status}")

        # Test missing credentials
        response = self.make_request("POST", "/auth/login", {"email": "test@example.com"})
        if response and response.status_code == 400:
            self.log_result("authentication", "missing_credentials", True, "Missing credentials properly rejected")
        elif response is None:
            self.log_result("authentication", "missing_credentials", False, "No response received")
        else:
            status = response.status_code if response else "No response"
            self.log_result("authentication", "missing_credentials", False, f"Missing credentials not handled: {status}")

    def test_jwt_verification(self):
        """Test JWT token verification"""
        print("\n=== Testing JWT Token Verification ===")
        
        if not self.auth_token:
            self.log_result("authentication", "jwt_verify", False, "No auth token available for testing")
            return

        # Test valid token
        response = self.make_request("GET", "/auth/verify")
        if response and response.status_code == 200:
            data = response.json()
            if data.get("valid") and "user" in data:
                self.log_result("authentication", "jwt_verify_valid", True, "JWT verification successful")
            else:
                self.log_result("authentication", "jwt_verify_valid", False, f"Invalid verification response: {data}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("authentication", "jwt_verify_valid", False, f"JWT verification failed: {status}")

        # Test invalid token
        old_token = self.auth_token
        self.auth_token = "invalid_token"
        
        response = self.make_request("GET", "/auth/verify")
        if response and response.status_code == 401:
            self.log_result("authentication", "jwt_verify_invalid", True, "Invalid JWT properly rejected")
        elif response is None:
            self.log_result("authentication", "jwt_verify_invalid", False, "No response received")
        else:
            status = response.status_code if response else "No response"
            self.log_result("authentication", "jwt_verify_invalid", False, f"Invalid JWT not handled: {status}")
        
        # Restore valid token
        self.auth_token = old_token

        # Test no token
        self.auth_token = None
        response = self.make_request("GET", "/auth/verify")
        if response and response.status_code == 401:
            self.log_result("authentication", "jwt_verify_no_token", True, "Missing JWT properly rejected")
        elif response is None:
            self.log_result("authentication", "jwt_verify_no_token", False, "No response received")
        else:
            status = response.status_code if response else "No response"
            self.log_result("authentication", "jwt_verify_no_token", False, f"Missing JWT not handled: {status}")
        
        # Restore token
        self.auth_token = old_token

    def test_user_management(self):
        """Test user management endpoints"""
        print("\n=== Testing User Management ===")
        
        if not self.auth_token:
            self.log_result("user_management", "no_token", False, "No auth token available")
            return

        # Test get users list (admin/manager access)
        response = self.make_request("GET", "/users")
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list) and len(data) > 0:
                # Check that passwords are not included
                has_password = any("password" in user for user in data)
                if not has_password:
                    self.log_result("user_management", "get_users_list", True, f"Users list retrieved successfully ({len(data)} users)")
                else:
                    self.log_result("user_management", "get_users_list", False, "Users list contains password fields")
            else:
                self.log_result("user_management", "get_users_list", False, f"Invalid users list response: {data}")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response else "No response"
            self.log_result("user_management", "get_users_list", False, f"Get users failed: {status} - {error_msg}")

        # Test get current user profile
        response = self.make_request("GET", "/users/me")
        if response and response.status_code == 200:
            data = response.json()
            if "email" in data and "password" not in data:
                self.log_result("user_management", "get_current_user", True, "Current user profile retrieved successfully")
            else:
                self.log_result("user_management", "get_current_user", False, f"Invalid user profile response: {data}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("user_management", "get_current_user", False, f"Get current user failed: {status}")

    def test_role_based_access(self):
        """Test role-based access control"""
        print("\n=== Testing Role-Based Access Control ===")
        
        # Login as regular user
        user_login = {
            "email": self.test_user_regular["email"],
            "password": self.test_user_regular["password"]
        }
        
        response = self.make_request("POST", "/auth/login", user_login)
        if response and response.status_code == 200:
            user_token = response.json().get("token")
            
            # Test regular user trying to access admin endpoint
            old_token = self.auth_token
            self.auth_token = user_token
            
            response = self.make_request("GET", "/users")
            if response and response.status_code == 403:
                self.log_result("user_management", "rbac_user_denied", True, "Regular user properly denied admin access")
            elif response is None:
                self.log_result("user_management", "rbac_user_denied", False, "No response received")
            else:
                status = response.status_code if response else "No response"
                self.log_result("user_management", "rbac_user_denied", False, f"RBAC not working: {status}")
            
            # Restore admin token
            self.auth_token = old_token
        else:
            self.log_result("user_management", "rbac_user_login", False, "Could not login as regular user for RBAC test")

    def test_document_management(self):
        """Test document management endpoints"""
        print("\n=== Testing Document Management ===")
        
        if not self.auth_token:
            self.log_result("document_management", "no_token", False, "No auth token available")
            return

        # Test get documents
        response = self.make_request("GET", "/documents")
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_result("document_management", "get_documents", True, f"Documents retrieved successfully ({len(data)} documents)")
                
                # Verify document structure
                if len(data) > 0:
                    doc = data[0]
                    required_fields = ["id", "name", "type", "size", "uploadedBy", "uploadedAt"]
                    has_all_fields = all(field in doc for field in required_fields)
                    if has_all_fields:
                        self.log_result("document_management", "document_structure", True, "Document structure is correct")
                    else:
                        missing = [f for f in required_fields if f not in doc]
                        self.log_result("document_management", "document_structure", False, f"Missing fields: {missing}")
            else:
                self.log_result("document_management", "get_documents", False, f"Invalid documents response: {data}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("document_management", "get_documents", False, f"Get documents failed: {status}")

        # Test unauthorized access
        old_token = self.auth_token
        self.auth_token = None
        
        response = self.make_request("GET", "/documents")
        if response and response.status_code == 401:
            self.log_result("document_management", "unauthorized_access", True, "Unauthorized access properly rejected")
        elif response is None:
            self.log_result("document_management", "unauthorized_access", False, "No response received")
        else:
            status = response.status_code if response else "No response"
            self.log_result("document_management", "unauthorized_access", False, f"Unauthorized access not handled: {status}")
        
        # Restore token
        self.auth_token = old_token

    def test_dashboard_stats(self):
        """Test dashboard statistics endpoint"""
        print("\n=== Testing Dashboard Statistics ===")
        
        if not self.auth_token:
            self.log_result("dashboard_stats", "no_token", False, "No auth token available")
            return

        # Test get dashboard stats
        response = self.make_request("GET", "/dashboard/stats")
        if response and response.status_code == 200:
            data = response.json()
            required_fields = ["totalUsers", "totalDocuments", "activeProjects", "pendingTasks"]
            has_all_fields = all(field in data for field in required_fields)
            
            if has_all_fields:
                # Verify totalUsers is reasonable (should be at least 3 from our test users)
                if data["totalUsers"] >= 3:
                    self.log_result("dashboard_stats", "get_stats", True, f"Dashboard stats retrieved successfully: {data}")
                else:
                    self.log_result("dashboard_stats", "get_stats", False, f"User count seems incorrect: {data['totalUsers']}")
            else:
                missing = [f for f in required_fields if f not in data]
                self.log_result("dashboard_stats", "get_stats", False, f"Missing stats fields: {missing}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("dashboard_stats", "get_stats", False, f"Get dashboard stats failed: {status}")

        # Test unauthorized access
        old_token = self.auth_token
        self.auth_token = None
        
        response = self.make_request("GET", "/dashboard/stats")
        if response and response.status_code == 401:
            self.log_result("dashboard_stats", "unauthorized_access", True, "Unauthorized access properly rejected")
        elif response is None:
            self.log_result("dashboard_stats", "unauthorized_access", False, "No response received")
        else:
            status = response.status_code if response else "No response"
            self.log_result("dashboard_stats", "unauthorized_access", False, f"Unauthorized access not handled: {status}")
        
        # Restore token
        self.auth_token = old_token

    def test_cors_headers(self):
        """Test CORS headers are present"""
        print("\n=== Testing CORS Headers ===")
        
        response = self.make_request("GET", "/")
        if response:
            cors_headers = [
                "Access-Control-Allow-Origin",
                "Access-Control-Allow-Methods", 
                "Access-Control-Allow-Headers"
            ]
            
            missing_headers = []
            for header in cors_headers:
                if header not in response.headers:
                    missing_headers.append(header)
            
            if not missing_headers:
                self.log_result("authentication", "cors_headers", True, "All CORS headers present")
            else:
                self.log_result("authentication", "cors_headers", False, f"Missing CORS headers: {missing_headers}")
        else:
            self.log_result("authentication", "cors_headers", False, "No response to check CORS headers")

    def login_additional_users(self):
        """Login manager and regular user for workflow testing"""
        print("\n=== Logging in Additional Users for Workflow Testing ===")
        
        # Login manager
        manager_login = {
            "email": self.test_manager_data["email"],
            "password": self.test_manager_data["password"]
        }
        
        response = self.make_request("POST", "/auth/login", manager_login)
        if response and response.status_code == 200:
            data = response.json()
            self.manager_token = data.get("token")
            self.log_result("enhanced_document_workflow", "manager_login", True, "Manager logged in successfully")
        else:
            self.log_result("enhanced_document_workflow", "manager_login", False, "Manager login failed")
            return False

        # Login regular user
        user_login = {
            "email": self.test_user_regular["email"],
            "password": self.test_user_regular["password"]
        }
        
        response = self.make_request("POST", "/auth/login", user_login)
        if response and response.status_code == 200:
            data = response.json()
            self.user_token = data.get("token")
            self.log_result("enhanced_document_workflow", "user_login", True, "Regular user logged in successfully")
            return True
        else:
            self.log_result("enhanced_document_workflow", "user_login", False, "Regular user login failed")
            return False

    def test_document_upload(self):
        """Test enhanced document upload with file handling"""
        print("\n=== Testing Enhanced Document Upload ===")
        
        if not self.user_token:
            self.log_result("file_upload_system", "no_user_token", False, "No user token available")
            return False

        try:
            # Create a test file
            test_content = "Це тестовий документ для системи ТИС КІС\nВміст документа для тестування workflow\nДата створення: " + datetime.now().isoformat()
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
                f.write(test_content)
                temp_file_path = f.name
            
            # Prepare form data for multipart upload
            files = {
                'file': ('test_document.txt', open(temp_file_path, 'rb'), 'text/plain')
            }
            data = {
                'title': 'Тестовий документ для workflow',
                'description': 'Документ для тестування системи документообігу з повним workflow'
            }
            
            # Use user token for upload
            headers = {"Authorization": f"Bearer {self.user_token}"}
            
            # Make request without Content-Type header for multipart
            url = f"{self.base_url}/documents/upload"
            response = requests.post(url, files=files, data=data, headers=headers, timeout=30)
            
            # Clean up temp file
            files['file'][1].close()
            os.unlink(temp_file_path)
            
            if response and response.status_code == 200:
                result = response.json()
                if 'document' in result and 'id' in result['document']:
                    self.test_document_id = result['document']['id']
                    doc = result['document']
                    self.log_result("file_upload_system", "document_upload", True, 
                                  f"Document uploaded successfully: {doc['title']} (Status: {doc['status']})")
                    
                    # Verify document structure
                    required_fields = ['id', 'title', 'description', 'filename', 'fileSize', 'status', 'createdBy', 'createdAt']
                    missing_fields = [field for field in required_fields if field not in doc]
                    
                    if not missing_fields:
                        self.log_result("file_upload_system", "document_structure", True, "Document structure is correct")
                    else:
                        self.log_result("file_upload_system", "document_structure", False, f"Missing fields: {missing_fields}")
                    
                    # Verify initial status is draft
                    if doc.get('status') == 'draft':
                        self.log_result("file_upload_system", "initial_status", True, "Document initial status is draft")
                    else:
                        self.log_result("file_upload_system", "initial_status", False, f"Wrong initial status: {doc.get('status')}")
                    
                    return True
                else:
                    self.log_result("file_upload_system", "document_upload", False, f"Invalid upload response: {result}")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                self.log_result("file_upload_system", "document_upload", False, f"Upload failed: {status} - {error_msg}")
                
        except Exception as e:
            self.log_result("file_upload_system", "document_upload", False, f"Upload error: {str(e)}")
            
        return False

    def test_document_filters(self):
        """Test document retrieval with status filters"""
        print("\n=== Testing Document Status Filters ===")
        
        if not self.user_token:
            self.log_result("enhanced_document_workflow", "no_user_token", False, "No user token available")
            return False

        # Test getting all documents
        old_token = self.auth_token
        self.auth_token = self.user_token
        
        response = self.make_request("GET", "/documents")
        if response and response.status_code == 200:
            documents = response.json()
            self.log_result("enhanced_document_workflow", "get_all_documents", True, f"Retrieved {len(documents)} documents")
        else:
            status = response.status_code if response else "No response"
            self.log_result("enhanced_document_workflow", "get_all_documents", False, f"Failed to get documents: {status}")

        # Test status filters
        for status_filter in ['draft', 'review', 'approved', 'rejected']:
            response = self.make_request("GET", f"/documents?status={status_filter}")
            if response and response.status_code == 200:
                filtered_docs = response.json()
                self.log_result("enhanced_document_workflow", f"filter_{status_filter}", True, 
                              f"Status filter '{status_filter}' returned {len(filtered_docs)} documents")
            else:
                status = response.status_code if response else "No response"
                self.log_result("enhanced_document_workflow", f"filter_{status_filter}", False, 
                              f"Status filter '{status_filter}' failed: {status}")

        # Test myDocuments filter
        response = self.make_request("GET", "/documents?myDocuments=true")
        if response and response.status_code == 200:
            my_docs = response.json()
            self.log_result("enhanced_document_workflow", "my_documents_filter", True, 
                          f"My documents filter returned {len(my_docs)} documents")
        else:
            status = response.status_code if response else "No response"
            self.log_result("enhanced_document_workflow", "my_documents_filter", False, f"My documents filter failed: {status}")

        self.auth_token = old_token
        return True

    def test_send_for_review(self):
        """Test sending document for review"""
        print("\n=== Testing Send Document for Review ===")
        
        if not self.test_document_id or not self.user_token:
            self.log_result("enhanced_document_workflow", "send_review_prereq", False, "Missing document ID or user token")
            return False

        old_token = self.auth_token
        self.auth_token = self.user_token
        
        data = {
            "comment": "Прошу перевірити документ на відповідність вимогам"
        }
        
        response = self.make_request("PUT", f"/documents/{self.test_document_id}/send-for-review", data)
        
        if response and response.status_code == 200:
            result = response.json()
            self.log_result("enhanced_document_workflow", "send_for_review", True, f"Document sent for review: {result.get('message')}")
            self.auth_token = old_token
            return True
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("enhanced_document_workflow", "send_for_review", False, f"Send for review failed: {status} - {error_msg}")
            
        self.auth_token = old_token
        return False

    def test_approve_document(self):
        """Test document approval by manager"""
        print("\n=== Testing Document Approval ===")
        
        if not self.test_document_id or not self.manager_token:
            self.log_result("enhanced_document_workflow", "approve_prereq", False, "Missing document ID or manager token")
            return False

        old_token = self.auth_token
        self.auth_token = self.manager_token
        
        data = {
            "comment": "Документ затверджено після ретельної перевірки"
        }
        
        response = self.make_request("PUT", f"/documents/{self.test_document_id}/approve", data)
        
        if response and response.status_code == 200:
            result = response.json()
            self.log_result("enhanced_document_workflow", "approve_document", True, f"Document approved: {result.get('message')}")
            self.auth_token = old_token
            return True
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("enhanced_document_workflow", "approve_document", False, f"Document approval failed: {status} - {error_msg}")
            
        self.auth_token = old_token
        return False

    def test_reject_document(self):
        """Test document rejection by admin"""
        print("\n=== Testing Document Rejection ===")
        
        # First create another document to reject
        if not self.user_token:
            self.log_result("enhanced_document_workflow", "reject_prereq", False, "No user token available")
            return False

        try:
            # Create document for rejection
            test_content = "Документ для тестування відхилення в системі ТИС КІС"
            
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
                f.write(test_content)
                temp_file_path = f.name
            
            files = {
                'file': ('reject_test.txt', open(temp_file_path, 'rb'), 'text/plain')
            }
            data = {
                'title': 'Документ для відхилення',
                'description': 'Тестовий документ для перевірки функції відхилення'
            }
            
            headers = {"Authorization": f"Bearer {self.user_token}"}
            url = f"{self.base_url}/documents/upload"
            response = requests.post(url, files=files, data=data, headers=headers, timeout=30)
            
            files['file'][1].close()
            os.unlink(temp_file_path)
            
            if not (response and response.status_code == 200):
                self.log_result("enhanced_document_workflow", "create_reject_doc", False, "Failed to create document for rejection test")
                return False
            
            reject_doc_id = response.json()['document']['id']
            
            # Send for review first
            old_token = self.auth_token
            self.auth_token = self.user_token
            
            review_data = {"comment": "Відправляю на перевірку для подальшого відхилення"}
            response = self.make_request("PUT", f"/documents/{reject_doc_id}/send-for-review", review_data)
            
            if not (response and response.status_code == 200):
                self.log_result("enhanced_document_workflow", "send_for_review_reject", False, "Failed to send document for review before rejection")
                self.auth_token = old_token
                return False
            
            # Now reject with admin token
            self.auth_token = self.auth_token  # Use admin token (current auth_token should be admin)
            
            reject_data = {
                "comment": "Документ не відповідає встановленим вимогам та стандартам"
            }
            
            response = self.make_request("PUT", f"/documents/{reject_doc_id}/reject", reject_data)
            
            if response and response.status_code == 200:
                result = response.json()
                self.log_result("enhanced_document_workflow", "reject_document", True, f"Document rejected: {result.get('message')}")
                self.auth_token = old_token
                return True
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                self.log_result("enhanced_document_workflow", "reject_document", False, f"Document rejection failed: {status} - {error_msg}")
                
        except Exception as e:
            self.log_result("enhanced_document_workflow", "reject_document", False, f"Rejection test error: {str(e)}")
            
        self.auth_token = old_token
        return False

    def test_workflow_history(self):
        """Test document workflow history tracking"""
        print("\n=== Testing Workflow History ===")
        
        if not self.test_document_id or not self.user_token:
            self.log_result("workflow_history", "history_prereq", False, "Missing document ID or user token")
            return False

        old_token = self.auth_token
        self.auth_token = self.user_token
        
        response = self.make_request("GET", f"/documents/{self.test_document_id}/history")
        
        if response and response.status_code == 200:
            history = response.json()
            if isinstance(history, list) and len(history) > 0:
                self.log_result("workflow_history", "get_history", True, f"Retrieved {len(history)} history entries")
                
                # Verify history structure
                entry = history[0]
                required_fields = ['id', 'documentId', 'action', 'status', 'performedBy', 'comment', 'timestamp']
                missing_fields = [field for field in required_fields if field not in entry]
                
                if not missing_fields:
                    self.log_result("workflow_history", "history_structure", True, "History entry structure is correct")
                else:
                    self.log_result("workflow_history", "history_structure", False, f"Missing fields in history: {missing_fields}")
                
                # Check if user info is enriched
                if 'performedByUser' in entry and entry['performedByUser']:
                    self.log_result("workflow_history", "user_enrichment", True, "History entries include user information")
                else:
                    self.log_result("workflow_history", "user_enrichment", False, "History entries missing user information")
                
                self.auth_token = old_token
                return True
            else:
                self.log_result("workflow_history", "get_history", False, f"Invalid history response: {history}")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("workflow_history", "get_history", False, f"Get history failed: {status} - {error_msg}")
            
        self.auth_token = old_token
        return False

    def test_permission_restrictions(self):
        """Test role-based permission restrictions for workflow actions"""
        print("\n=== Testing Workflow Permission Restrictions ===")
        
        if not self.test_document_id or not self.user_token:
            self.log_result("enhanced_document_workflow", "permission_prereq", False, "Missing document ID or user token")
            return False

        # Test regular user trying to approve (should fail)
        old_token = self.auth_token
        self.auth_token = self.user_token
        
        data = {"comment": "Trying to approve as regular user"}
        response = self.make_request("PUT", f"/documents/{self.test_document_id}/approve", data)
        
        if response and response.status_code == 403:
            self.log_result("enhanced_document_workflow", "user_approve_denied", True, "Regular user correctly denied approval permission")
        else:
            status = response.status_code if response else "No response"
            self.log_result("enhanced_document_workflow", "user_approve_denied", False, f"User approval permission test failed: {status}")

        # Test regular user trying to reject (should fail)
        response = self.make_request("PUT", f"/documents/{self.test_document_id}/reject", data)
        
        if response and response.status_code == 403:
            self.log_result("enhanced_document_workflow", "user_reject_denied", True, "Regular user correctly denied rejection permission")
        else:
            status = response.status_code if response else "No response"
            self.log_result("enhanced_document_workflow", "user_reject_denied", False, f"User rejection permission test failed: {status}")

        self.auth_token = old_token
        return True

    def test_file_validation(self):
        """Test file upload validation"""
        print("\n=== Testing File Upload Validation ===")
        
        if not self.user_token:
            self.log_result("file_upload_system", "validation_prereq", False, "No user token available")
            return False

        headers = {"Authorization": f"Bearer {self.user_token}"}
        
        # Test upload without file
        data = {
            'title': 'Test without file',
            'description': 'Should fail validation'
        }
        
        url = f"{self.base_url}/documents/upload"
        response = requests.post(url, data=data, headers=headers, timeout=30)
        
        if response and response.status_code == 400:
            self.log_result("file_upload_system", "no_file_validation", True, "Upload without file correctly rejected")
        else:
            status = response.status_code if response else "No response"
            self.log_result("file_upload_system", "no_file_validation", False, f"No file validation failed: {status}")

        # Test upload without title
        try:
            test_content = "Test content for validation"
            with tempfile.NamedTemporaryFile(mode='w', suffix='.txt', delete=False, encoding='utf-8') as f:
                f.write(test_content)
                temp_file_path = f.name
            
            files = {
                'file': ('test.txt', open(temp_file_path, 'rb'), 'text/plain')
            }
            data = {
                'description': 'No title provided - should fail'
            }
            
            response = requests.post(url, files=files, data=data, headers=headers, timeout=30)
            files['file'][1].close()
            os.unlink(temp_file_path)
            
            if response and response.status_code == 400:
                self.log_result("file_upload_system", "no_title_validation", True, "Upload without title correctly rejected")
                return True
            else:
                status = response.status_code if response else "No response"
                self.log_result("file_upload_system", "no_title_validation", False, f"No title validation failed: {status}")
                
        except Exception as e:
            self.log_result("file_upload_system", "no_title_validation", False, f"Title validation test error: {str(e)}")
            
        return False

    def test_calendar_events_api(self):
        """Test Calendar Events API functionality"""
        print("\n=== Testing Calendar Events API ===")
        
        if not self.auth_token:
            self.log_result("calendar_events_api", "no_token", False, "No auth token available")
            return False

        # Test 1: Create calendar event (POST /api/calendar/events)
        print("Creating calendar events with different types...")
        
        # Test events with different types
        test_events_data = [
            {
                "title": "Нарада керівництва",
                "description": "Щотижнева нарада керівного складу компанії",
                "startDate": (datetime.now() + timedelta(days=1)).isoformat(),
                "endDate": (datetime.now() + timedelta(days=1, hours=2)).isoformat(),
                "type": "meeting",
                "location": "Конференц-зал А",
                "attendees": []
            },
            {
                "title": "Дедлайн подачі звітів",
                "description": "Останній день подачі місячних звітів",
                "startDate": (datetime.now() + timedelta(days=7)).isoformat(),
                "type": "deadline",
                "location": ""
            },
            {
                "title": "Нагадування про презентацію",
                "description": "Підготувати презентацію для клієнта",
                "startDate": (datetime.now() + timedelta(days=3)).isoformat(),
                "type": "reminder"
            },
            {
                "title": "День Незалежності України",
                "description": "Державне свято",
                "startDate": "2024-08-24T00:00:00.000Z",
                "type": "holiday"
            }
        ]
        
        created_events = 0
        for event_data in test_events_data:
            response = self.make_request("POST", "/calendar/events", event_data)
            if response and response.status_code == 200:
                event = response.json().get("event")
                if event:
                    self.test_events.append(event)
                    created_events += 1
                    self.log_result("calendar_events_api", f"create_event_{event_data['type']}", True, 
                                  f"Created {event_data['type']} event: {event_data['title']}")
                else:
                    self.log_result("calendar_events_api", f"create_event_{event_data['type']}", False, 
                                  f"Event created but no event data returned")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                self.log_result("calendar_events_api", f"create_event_{event_data['type']}", False, 
                              f"Failed to create event: {status} - {error_msg}")
                
        # Test 2: Get all events (GET /api/calendar/events)
        response = self.make_request("GET", "/calendar/events")
        if response and response.status_code == 200:
            events = response.json()
            if isinstance(events, list):
                self.log_result("calendar_events_api", "get_all_events", True, 
                              f"Retrieved {len(events)} events successfully")
                
                # Verify event structure
                if events:
                    event = events[0]
                    required_fields = ["id", "title", "startDate", "type", "createdBy", "createdAt"]
                    missing_fields = [field for field in required_fields if field not in event]
                    if not missing_fields:
                        self.log_result("calendar_events_api", "event_structure", True, "Event structure validation passed")
                    else:
                        self.log_result("calendar_events_api", "event_structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("calendar_events_api", "get_all_events", False, f"Invalid events response: {events}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("calendar_events_api", "get_all_events", False, f"Failed to retrieve events: {status}")
            
        # Test 3: Get events with date filtering
        start_date = datetime.now().isoformat()
        end_date = (datetime.now() + timedelta(days=30)).isoformat()
        
        response = self.make_request("GET", f"/calendar/events?startDate={start_date}&endDate={end_date}")
        if response and response.status_code == 200:
            filtered_events = response.json()
            if isinstance(filtered_events, list):
                self.log_result("calendar_events_api", "date_filtering", True, 
                              f"Date filtering working: {len(filtered_events)} events in range")
            else:
                self.log_result("calendar_events_api", "date_filtering", False, f"Invalid filtered response: {filtered_events}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("calendar_events_api", "date_filtering", False, f"Date filtering failed: {status}")
            
        # Test 4: Test different event types
        event_types = ["meeting", "deadline", "reminder", "holiday"]
        for event_type in event_types:
            matching_events = [e for e in self.test_events if e.get("type") == event_type]
            if matching_events:
                self.log_result("calendar_events_api", f"event_type_{event_type}", True, f"Event type '{event_type}' created successfully")
            else:
                self.log_result("calendar_events_api", f"event_type_{event_type}", False, f"No events found for type '{event_type}'")
                
        return created_events > 0

    def test_tasks_management_api(self):
        """Test Tasks Management API functionality"""
        print("\n=== Testing Tasks Management API ===")
        
        if not self.auth_token or not self.user_token:
            self.log_result("tasks_management_api", "no_tokens", False, "Missing auth tokens")
            return False

        # Test 1: Create tasks (POST /api/tasks)
        print("Creating tasks with different priorities and statuses...")
        
        test_tasks_data = [
            {
                "title": "Розробка нового модуля системи",
                "description": "Створити модуль управління користувачами з повним функціоналом",
                "dueDate": (datetime.now() + timedelta(days=14)).isoformat(),
                "priority": "high",
                "status": "todo",
                "category": "development"
            },
            {
                "title": "Перевірка документації",
                "description": "Перевірити та оновити технічну документацію проекту",
                "dueDate": (datetime.now() + timedelta(days=7)).isoformat(),
                "priority": "medium",
                "status": "in_progress",
                "category": "documentation"
            },
            {
                "title": "ТЕРМІНОВЕ: Виправлення критичної помилки",
                "description": "Виправити помилку в системі авторизації",
                "dueDate": (datetime.now() + timedelta(days=1)).isoformat(),
                "priority": "urgent",
                "status": "todo",
                "category": "bugfix"
            },
            {
                "title": "Планування наступного спринту",
                "description": "Підготувати план завдань на наступний спринт",
                "dueDate": (datetime.now() + timedelta(days=21)).isoformat(),
                "priority": "low",
                "status": "todo",
                "category": "planning"
            }
        ]
        
        created_tasks = 0
        for task_data in test_tasks_data:
            response = self.make_request("POST", "/tasks", task_data)
            if response and response.status_code == 200:
                task = response.json().get("task")
                if task:
                    self.test_tasks.append(task)
                    created_tasks += 1
                    self.log_result("tasks_management_api", f"create_task_{task_data['priority']}", True, 
                                  f"Created {task_data['priority']} priority task: {task_data['title']}")
                else:
                    self.log_result("tasks_management_api", f"create_task_{task_data['priority']}", False, 
                                  f"Task created but no task data returned")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                self.log_result("tasks_management_api", f"create_task_{task_data['priority']}", False, 
                              f"Failed to create task: {status} - {error_msg}")
                
        # Test 2: Get all tasks (GET /api/tasks)
        response = self.make_request("GET", "/tasks")
        if response and response.status_code == 200:
            tasks = response.json()
            if isinstance(tasks, list):
                self.log_result("tasks_management_api", "get_all_tasks", True, 
                              f"Retrieved {len(tasks)} tasks successfully")
                
                # Verify task structure
                if tasks:
                    task = tasks[0]
                    required_fields = ["id", "title", "priority", "status", "createdBy", "assignedTo", "createdAt"]
                    missing_fields = [field for field in required_fields if field not in task]
                    if not missing_fields:
                        self.log_result("tasks_management_api", "task_structure", True, "Task structure validation passed")
                    else:
                        self.log_result("tasks_management_api", "task_structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("tasks_management_api", "get_all_tasks", False, f"Invalid tasks response: {tasks}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("tasks_management_api", "get_all_tasks", False, f"Failed to retrieve tasks: {status}")
            
        # Test 3: Test task filtering
        # Filter by status
        response = self.make_request("GET", "/tasks?status=todo")
        if response and response.status_code == 200:
            todo_tasks = response.json()
            if isinstance(todo_tasks, list):
                self.log_result("tasks_management_api", "status_filtering", True, 
                              f"Status filtering working: {len(todo_tasks)} todo tasks")
            else:
                self.log_result("tasks_management_api", "status_filtering", False, f"Invalid filtered response: {todo_tasks}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("tasks_management_api", "status_filtering", False, f"Status filtering failed: {status}")
            
        # Test 4: Update task status (PUT /api/tasks/:id/status)
        if self.test_tasks:
            task_id = self.test_tasks[0]["id"]
            status_updates = [
                {"status": "in_progress", "comment": "Розпочато роботу над завданням"},
                {"status": "review", "comment": "Завдання готове до перевірки"},
                {"status": "completed", "comment": "Завдання успішно завершено"}
            ]
            
            for update_data in status_updates:
                response = self.make_request("PUT", f"/tasks/{task_id}/status", update_data)
                if response and response.status_code == 200:
                    self.log_result("tasks_management_api", f"update_status_{update_data['status']}", True, 
                                  f"Status updated to '{update_data['status']}'")
                else:
                    status = response.status_code if response else "No response"
                    error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                    self.log_result("tasks_management_api", f"update_status_{update_data['status']}", False, 
                                  f"Failed to update status: {status} - {error_msg}")
                    
        return created_tasks > 0

    def test_notifications_api(self):
        """Test Notifications API functionality"""
        print("\n=== Testing Notifications API ===")
        
        if not self.auth_token or not self.user_token:
            self.log_result("notifications_api", "no_tokens", False, "Missing auth tokens")
            return False

        # Test 1: Create task with assignment to generate notification
        print("Creating task assignment to generate notification...")
        
        # Get user ID from user token by decoding or making a request
        old_token = self.auth_token
        self.auth_token = self.user_token
        
        # Get current user to get user ID
        response = self.make_request("GET", "/users/me")
        if not (response and response.status_code == 200):
            self.log_result("notifications_api", "get_user_id", False, "Failed to get user ID")
            self.auth_token = old_token
            return False
            
        user_id = response.json().get("id")
        self.auth_token = old_token
        
        task_data = {
            "title": "Тестове завдання для перевірки сповіщень",
            "description": "Це завдання створено для тестування системи сповіщень",
            "dueDate": (datetime.now() + timedelta(days=5)).isoformat(),
            "priority": "medium",
            "assignedTo": user_id
        }
        
        response = self.make_request("POST", "/tasks", task_data)
        if response and response.status_code == 200:
            task = response.json().get("task")
            self.log_result("notifications_api", "create_assigned_task", True, 
                          f"Task created with assignment: {task_data['title']}")
            
            # Wait a moment for notification to be created
            time.sleep(2)
            
            # Test 2: Get notifications (GET /api/notifications)
            old_token = self.auth_token
            self.auth_token = self.user_token
            
            response = self.make_request("GET", "/notifications")
            if response and response.status_code == 200:
                notifications = response.json()
                if isinstance(notifications, list):
                    self.log_result("notifications_api", "get_notifications", True, 
                                  f"Retrieved {len(notifications)} notifications")
                    
                    # Find the notification for our task
                    task_notifications = [n for n in notifications if n.get("relatedId") == task["id"]]
                    if task_notifications:
                        notification = task_notifications[0]
                        self.test_notifications.append(notification)
                        self.log_result("notifications_api", "task_notification_created", True, 
                                      "Task assignment notification found")
                        
                        # Verify notification structure
                        required_fields = ["id", "userId", "type", "title", "message", "read", "createdAt"]
                        missing_fields = [field for field in required_fields if field not in notification]
                        if not missing_fields:
                            self.log_result("notifications_api", "notification_structure", True, 
                                          "Notification structure validation passed")
                        else:
                            self.log_result("notifications_api", "notification_structure", False, 
                                          f"Missing fields: {missing_fields}")
                            
                        # Test 3: Mark notification as read (PUT /api/notifications/:id/read)
                        notification_id = notification["id"]
                        response = self.make_request("PUT", f"/notifications/{notification_id}/read", {})
                        if response and response.status_code == 200:
                            self.log_result("notifications_api", "mark_as_read", True, 
                                          "Notification marked as read successfully")
                            
                            # Verify notification is marked as read
                            response = self.make_request("GET", "/notifications")
                            if response and response.status_code == 200:
                                updated_notifications = response.json()
                                updated_notification = next((n for n in updated_notifications if n["id"] == notification_id), None)
                                if updated_notification and updated_notification.get("read"):
                                    self.log_result("notifications_api", "read_status_verified", True, 
                                                  "Notification read status verified")
                                else:
                                    self.log_result("notifications_api", "read_status_verified", False, 
                                                  "Notification read status not updated")
                        else:
                            status = response.status_code if response else "No response"
                            self.log_result("notifications_api", "mark_as_read", False, f"Failed to mark as read: {status}")
                    else:
                        self.log_result("notifications_api", "task_notification_created", False, 
                                      "Task assignment notification not found")
                else:
                    self.log_result("notifications_api", "get_notifications", False, 
                                  f"Invalid notifications response: {notifications}")
            else:
                status = response.status_code if response else "No response"
                self.log_result("notifications_api", "get_notifications", False, f"Failed to get notifications: {status}")
                
            self.auth_token = old_token
            return True
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("notifications_api", "create_assigned_task", False, f"Failed to create task: {status} - {error_msg}")
            return False

    def test_complete_workflow_integration(self):
        """Test complete task workflow integration"""
        print("\n=== Testing Complete Task Workflow Integration ===")
        
        if not self.auth_token or not self.manager_token or not self.user_token:
            self.log_result("complete_workflow", "missing_tokens", False, "Missing required tokens")
            return False

        # Get user ID for assignment
        old_token = self.auth_token
        self.auth_token = self.user_token
        
        response = self.make_request("GET", "/users/me")
        if not (response and response.status_code == 200):
            self.log_result("complete_workflow", "get_user_id", False, "Failed to get user ID")
            self.auth_token = old_token
            return False
            
        user_id = response.json().get("id")
        self.auth_token = self.manager_token
        
        # Step 1: Manager creates task and assigns to user
        task_data = {
            "title": "Інтеграційний тест робочого процесу",
            "description": "Повний тест робочого процесу від створення до завершення завдання",
            "dueDate": (datetime.now() + timedelta(days=10)).isoformat(),
            "priority": "high",
            "assignedTo": user_id
        }
        
        response = self.make_request("POST", "/tasks", task_data)
        if response and response.status_code == 200:
            workflow_task = response.json().get("task")
            self.log_result("complete_workflow", "manager_create_task", True, "Manager created and assigned task")
            
            # Step 2: Check notification was created for assigned user
            time.sleep(2)
            self.auth_token = self.user_token
            
            response = self.make_request("GET", "/notifications")
            if response and response.status_code == 200:
                notifications = response.json()
                task_notification = next((n for n in notifications if n.get("relatedId") == workflow_task["id"]), None)
                if task_notification:
                    self.log_result("complete_workflow", "notification_created", True, "Notification created for assigned user")
                    
                    # Step 3: User accepts task (updates status)
                    response = self.make_request("PUT", f"/tasks/{workflow_task['id']}/status", 
                                               {"status": "in_progress", "comment": "Розпочинаю роботу"})
                    if response and response.status_code == 200:
                        self.log_result("complete_workflow", "user_start_task", True, "User updated task status to in_progress")
                        
                        # Step 4: User completes task
                        response = self.make_request("PUT", f"/tasks/{workflow_task['id']}/status", 
                                                   {"status": "completed", "comment": "Завдання виконано"})
                        if response and response.status_code == 200:
                            self.log_result("complete_workflow", "user_complete_task", True, "User completed task")
                            
                            # Step 5: Verify final task state
                            self.auth_token = self.manager_token
                            response = self.make_request("GET", "/tasks")
                            if response and response.status_code == 200:
                                tasks = response.json()
                                completed_task = next((t for t in tasks if t["id"] == workflow_task["id"]), None)
                                if completed_task and completed_task.get("status") == "completed":
                                    self.log_result("complete_workflow", "verify_completion", True, 
                                                  "Complete workflow verified - task marked as completed")
                                    self.log_result("complete_workflow", "full_workflow_test", True, 
                                                  "🎉 COMPLETE WORKFLOW TEST PASSED")
                                    self.auth_token = old_token
                                    return True
                                else:
                                    self.log_result("complete_workflow", "verify_completion", False, 
                                                  "Task status not properly updated")
                            else:
                                self.log_result("complete_workflow", "verify_completion", False, 
                                              "Failed to verify final task state")
                        else:
                            self.log_result("complete_workflow", "user_complete_task", False, "Failed to complete task")
                    else:
                        self.log_result("complete_workflow", "user_start_task", False, "Failed to update task status")
                else:
                    self.log_result("complete_workflow", "notification_created", False, "Notification not created")
            else:
                self.log_result("complete_workflow", "notification_created", False, "Failed to check notifications")
        else:
            status = response.status_code if response else "No response"
            self.log_result("complete_workflow", "manager_create_task", False, f"Failed to create workflow task: {status}")
            
        self.auth_token = old_token
        return False

    def test_authentication_requirements_new_apis(self):
        """Test that new Calendar and Tasks APIs require proper authentication"""
        print("\n=== Testing Authentication Requirements for New APIs ===")
        
        endpoints_to_test = [
            ("GET", "/calendar/events"),
            ("POST", "/calendar/events"),
            ("GET", "/tasks"),
            ("POST", "/tasks"),
            ("GET", "/notifications")
        ]
        
        for method, endpoint in endpoints_to_test:
            # Test without token
            old_token = self.auth_token
            self.auth_token = None
            
            test_data = {} if method == "POST" else None
            response = self.make_request(method, endpoint, test_data)
            
            if response and response.status_code == 401:
                self.log_result("authentication", f"auth_required_{method.lower()}_{endpoint.replace('/', '_')}", True, 
                              f"{method} {endpoint}: Properly requires authentication")
            else:
                status = response.status_code if response else "No response"
                self.log_result("authentication", f"auth_required_{method.lower()}_{endpoint.replace('/', '_')}", False, 
                              f"{method} {endpoint}: Authentication not enforced - {status}")
                
            self.auth_token = old_token

    def run_all_tests(self):
        """Run all backend tests in priority order"""
        print(f"\n🚀 Starting ТИС КІС Enhanced Backend API Tests with Calendar and Tasks")
        print(f"Base URL: {self.base_url}")
        print("=" * 80)
        
        # HIGH PRIORITY TESTS
        print("\n🔥 HIGH PRIORITY TESTS")
        
        # Authentication Flow Tests
        self.test_api_root()
        self.test_cors_headers()
        self.test_user_registration()
        self.test_user_login()
        self.test_jwt_verification()
        
        # User Management Tests
        self.test_user_management()
        self.test_role_based_access()
        
        # Login additional users for workflow testing
        self.login_additional_users()
        
        # NEW CALENDAR AND TASKS API TESTS (HIGH PRIORITY)
        print("\n📅 CALENDAR AND TASKS API TESTS")
        
        # Test authentication requirements for new APIs
        self.test_authentication_requirements_new_apis()
        
        # Calendar Events API Tests
        self.test_calendar_events_api()
        
        # Tasks Management API Tests
        self.test_tasks_management_api()
        
        # Notifications API Tests
        self.test_notifications_api()
        
        # Complete Workflow Integration Test
        self.test_complete_workflow_integration()
        
        # ENHANCED DOCUMENT WORKFLOW TESTS (HIGH PRIORITY)
        print("\n📄 ENHANCED DOCUMENT WORKFLOW TESTS")
        
        # File Upload System Tests
        self.test_document_upload()
        self.test_file_validation()
        
        # Document Management with Workflow
        self.test_document_filters()
        self.test_send_for_review()
        self.test_approve_document()
        self.test_reject_document()
        
        # Workflow History Tests
        self.test_workflow_history()
        
        # Permission Tests
        self.test_permission_restrictions()
        
        # MEDIUM PRIORITY TESTS
        print("\n📊 MEDIUM PRIORITY TESTS")
        
        # Original Document Management Tests (for compatibility)
        self.test_document_management()
        
        # Dashboard Stats Tests
        self.test_dashboard_stats()
        
        # Print final summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("🏁 TEST SUMMARY")
        print("=" * 60)
        
        total_tests = self.results["summary"]["passed"] + self.results["summary"]["failed"]
        pass_rate = (self.results["summary"]["passed"] / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {self.results['summary']['passed']} ✅")
        print(f"Failed: {self.results['summary']['failed']} ❌")
        print(f"Pass Rate: {pass_rate:.1f}%")
        
        if self.results["summary"]["errors"]:
            print(f"\n❌ FAILED TESTS:")
            for error in self.results["summary"]["errors"]:
                print(f"  • {error}")
        
        print("\n📋 DETAILED RESULTS BY CATEGORY:")
        for category, tests in self.results.items():
            if category != "summary":
                print(f"\n{category.upper().replace('_', ' ')}:")
                for test_name, result in tests.items():
                    status = "✅" if result["success"] else "❌"
                    print(f"  {status} {test_name}: {result['message']}")

if __name__ == "__main__":
    tester = TISKISBackendTester()
    tester.run_all_tests()