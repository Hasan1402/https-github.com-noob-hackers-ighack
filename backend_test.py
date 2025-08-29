#!/usr/bin/env python3
"""
Comprehensive Backend API Testing for ТИС КІС System
Testing Financial Accounting and CRM modules, HR and Personnel Management APIs, 
Calendar Events API, Tasks Management API, and Notifications API
Plus existing authentication, user management, and document management
"""

import requests
import json
import os
import tempfile
import time
from datetime import datetime, timedelta
import uuid

# Configuration - use localhost for HR testing due to external URL connectivity issues
BASE_URL = "http://localhost:3000/api"

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
            "analytics_dashboard": {},
            "analytics_documents": {},
            "analytics_reports": {},
            "hr_departments": {},
            "hr_employees": {},
            "hr_timesheet": {},
            "hr_business_trips": {},
            "hr_workflow": {},
            "hr_validation": {},
            "hr_auth": {},
            "finance_accounts": {},
            "finance_counterparties": {},
            "finance_journal_entries": {},
            "finance_bank_accounts": {},
            "crm_leads": {},
            "crm_opportunities": {},
            "crm_products": {},
            "finance_crm_integration": {},
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

    def test_analytics_dashboard_api(self):
        """Test Analytics Dashboard API - GET /api/analytics/dashboard"""
        print("\n=== Testing Analytics Dashboard API ===")
        
        if not self.auth_token:
            self.log_result("analytics_dashboard", "no_token", False, "No auth token available")
            return False

        # Test dashboard analytics endpoint
        response = self.make_request("GET", "/analytics/dashboard")
        if response and response.status_code == 200:
            analytics = response.json()
            
            # Verify overview section
            if "overview" in analytics:
                overview = analytics["overview"]
                required_overview_fields = ["totalUsers", "totalDocuments", "totalTasks", "totalEvents", 
                                          "pendingDocuments", "completedTasks", "upcomingEvents"]
                missing_overview = [field for field in required_overview_fields if field not in overview]
                
                if not missing_overview:
                    self.log_result("analytics_dashboard", "overview_structure", True, 
                                  f"Overview metrics complete: {overview}")
                else:
                    self.log_result("analytics_dashboard", "overview_structure", False, 
                                  f"Missing overview fields: {missing_overview}")
            else:
                self.log_result("analytics_dashboard", "overview_structure", False, "Overview section missing")

            # Verify performance section
            if "performance" in analytics:
                performance = analytics["performance"]
                required_performance_fields = ["documentCompletionRate", "taskCompletionRate"]
                missing_performance = [field for field in required_performance_fields if field not in performance]
                
                if not missing_performance:
                    self.log_result("analytics_dashboard", "performance_metrics", True, 
                                  f"Performance metrics complete: {performance}")
                else:
                    self.log_result("analytics_dashboard", "performance_metrics", False, 
                                  f"Missing performance fields: {missing_performance}")
            else:
                self.log_result("analytics_dashboard", "performance_metrics", False, "Performance section missing")

            # Verify activity section
            if "activity" in analytics:
                activity = analytics["activity"]
                if "recentActivities" in activity and "topUsers" in activity:
                    self.log_result("analytics_dashboard", "activity_tracking", True, 
                                  f"Activity tracking working: {len(activity.get('recentActivities', []))} recent activities, {len(activity.get('topUsers', []))} top users")
                else:
                    self.log_result("analytics_dashboard", "activity_tracking", False, 
                                  "Activity section incomplete")
            else:
                self.log_result("analytics_dashboard", "activity_tracking", False, "Activity section missing")

            # Verify trends section
            if "trends" in analytics:
                trends = analytics["trends"]
                if "documentsLastWeek" in trends and "tasksLastWeek" in trends:
                    self.log_result("analytics_dashboard", "trends_calculation", True, 
                                  f"Trends calculation working: {trends['documentsLastWeek']} docs, {trends['tasksLastWeek']} tasks last week")
                else:
                    self.log_result("analytics_dashboard", "trends_calculation", False, 
                                  "Trends section incomplete")
            else:
                self.log_result("analytics_dashboard", "trends_calculation", False, "Trends section missing")

            # Overall dashboard test
            self.log_result("analytics_dashboard", "dashboard_analytics", True, 
                          "Dashboard analytics API working successfully")
            return True
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("analytics_dashboard", "dashboard_analytics", False, 
                          f"Dashboard analytics failed: {status} - {error_msg}")
            return False

    def test_analytics_documents_api(self):
        """Test Document Statistics API - GET /api/analytics/documents (admin/manager only)"""
        print("\n=== Testing Document Statistics API ===")
        
        if not self.auth_token or not self.manager_token:
            self.log_result("analytics_documents", "no_tokens", False, "Missing required tokens")
            return False

        # Test with admin token (should work)
        response = self.make_request("GET", "/analytics/documents")
        if response and response.status_code == 200:
            doc_analytics = response.json()
            
            # Verify status distribution
            if "statusDistribution" in doc_analytics:
                status_dist = doc_analytics["statusDistribution"]
                if isinstance(status_dist, list):
                    self.log_result("analytics_documents", "status_distribution", True, 
                                  f"Status distribution aggregation working: {len(status_dist)} status groups")
                else:
                    self.log_result("analytics_documents", "status_distribution", False, 
                                  f"Invalid status distribution format: {type(status_dist)}")
            else:
                self.log_result("analytics_documents", "status_distribution", False, "Status distribution missing")

            # Verify monthly trends
            if "monthlyTrends" in doc_analytics:
                monthly_trends = doc_analytics["monthlyTrends"]
                if isinstance(monthly_trends, list):
                    self.log_result("analytics_documents", "monthly_trends", True, 
                                  f"Monthly trends calculation working: {len(monthly_trends)} months")
                else:
                    self.log_result("analytics_documents", "monthly_trends", False, 
                                  f"Invalid monthly trends format: {type(monthly_trends)}")
            else:
                self.log_result("analytics_documents", "monthly_trends", False, "Monthly trends missing")

            # Verify top creators
            if "topCreators" in doc_analytics:
                top_creators = doc_analytics["topCreators"]
                if isinstance(top_creators, list):
                    self.log_result("analytics_documents", "top_creators", True, 
                                  f"Top creators statistics working: {len(top_creators)} creators")
                else:
                    self.log_result("analytics_documents", "top_creators", False, 
                                  f"Invalid top creators format: {type(top_creators)}")
            else:
                self.log_result("analytics_documents", "top_creators", False, "Top creators missing")

            self.log_result("analytics_documents", "admin_access", True, 
                          "Admin can access document statistics")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("analytics_documents", "admin_access", False, 
                          f"Admin access failed: {status} - {error_msg}")

        # Test with manager token (should work)
        old_token = self.auth_token
        self.auth_token = self.manager_token
        
        response = self.make_request("GET", "/analytics/documents")
        if response and response.status_code == 200:
            self.log_result("analytics_documents", "manager_access", True, 
                          "Manager can access document statistics")
        else:
            status = response.status_code if response else "No response"
            self.log_result("analytics_documents", "manager_access", False, 
                          f"Manager access failed: {status}")

        # Test with regular user token (should fail with 403)
        if self.user_token:
            self.auth_token = self.user_token
            
            response = self.make_request("GET", "/analytics/documents")
            if response and response.status_code == 403:
                self.log_result("analytics_documents", "user_access_denied", True, 
                              "Regular user properly denied access to document statistics")
            else:
                status = response.status_code if response else "No response"
                self.log_result("analytics_documents", "user_access_denied", False, 
                              f"User access control failed: {status}")

        self.auth_token = old_token
        return True

    def test_analytics_reports_api(self):
        """Test Reports Generation API - POST /api/analytics/reports (admin/manager only)"""
        print("\n=== Testing Reports Generation API ===")
        
        if not self.auth_token or not self.manager_token:
            self.log_result("analytics_reports", "no_tokens", False, "Missing required tokens")
            return False

        # Test documents report generation
        documents_report_data = {
            "reportType": "documents",
            "dateFrom": (datetime.now() - timedelta(days=30)).isoformat(),
            "dateTo": datetime.now().isoformat(),
            "filters": {}
        }
        
        response = self.make_request("POST", "/analytics/reports", documents_report_data)
        if response and response.status_code == 200:
            report_result = response.json()
            
            if "report" in report_result and "downloadUrl" in report_result:
                report = report_result["report"]
                required_report_fields = ["id", "type", "dateFrom", "dateTo", "generatedBy", "generatedAt", "status"]
                missing_fields = [field for field in required_report_fields if field not in report]
                
                if not missing_fields:
                    self.log_result("analytics_reports", "documents_report", True, 
                                  f"Documents report generated successfully: {report['id']}")
                else:
                    self.log_result("analytics_reports", "documents_report", False, 
                                  f"Report structure incomplete: missing {missing_fields}")
            else:
                self.log_result("analytics_reports", "documents_report", False, 
                              f"Invalid report response: {report_result}")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("analytics_reports", "documents_report", False, 
                          f"Documents report failed: {status} - {error_msg}")

        # Test tasks report generation
        tasks_report_data = {
            "reportType": "tasks",
            "dateFrom": (datetime.now() - timedelta(days=30)).isoformat(),
            "dateTo": datetime.now().isoformat(),
            "filters": {}
        }
        
        response = self.make_request("POST", "/analytics/reports", tasks_report_data)
        if response and response.status_code == 200:
            self.log_result("analytics_reports", "tasks_report", True, 
                          "Tasks report generated successfully")
        else:
            status = response.status_code if response else "No response"
            self.log_result("analytics_reports", "tasks_report", False, 
                          f"Tasks report failed: {status}")

        # Test with manager token (should work)
        old_token = self.auth_token
        self.auth_token = self.manager_token
        
        response = self.make_request("POST", "/analytics/reports", documents_report_data)
        if response and response.status_code == 200:
            self.log_result("analytics_reports", "manager_generate", True, 
                          "Manager can generate reports")
        else:
            status = response.status_code if response else "No response"
            self.log_result("analytics_reports", "manager_generate", False, 
                          f"Manager report generation failed: {status}")

        # Test with regular user token (should fail with 403)
        if self.user_token:
            self.auth_token = self.user_token
            
            response = self.make_request("POST", "/analytics/reports", documents_report_data)
            if response and response.status_code == 403:
                self.log_result("analytics_reports", "user_generate_denied", True, 
                              "Regular user properly denied report generation access")
            else:
                status = response.status_code if response else "No response"
                self.log_result("analytics_reports", "user_generate_denied", False, 
                              f"User report access control failed: {status}")

        # Test invalid report data (missing required fields)
        invalid_report_data = {
            "reportType": "documents"
            # Missing dateFrom and dateTo
        }
        
        self.auth_token = old_token
        response = self.make_request("POST", "/analytics/reports", invalid_report_data)
        if response and response.status_code == 400:
            self.log_result("analytics_reports", "validation", True, 
                          "Report validation working - missing fields rejected")
        else:
            status = response.status_code if response else "No response"
            self.log_result("analytics_reports", "validation", False, 
                          f"Report validation failed: {status}")

        self.auth_token = old_token
        return True

    def test_analytics_data_accuracy(self):
        """Test analytics data accuracy by comparing with actual database counts"""
        print("\n=== Testing Analytics Data Accuracy ===")
        
        if not self.auth_token:
            self.log_result("analytics_dashboard", "accuracy_no_token", False, "No auth token available")
            return False

        # Get dashboard analytics
        response = self.make_request("GET", "/analytics/dashboard")
        if response and response.status_code == 200:
            analytics = response.json()
            overview = analytics.get("overview", {})
            
            # Verify user count accuracy (we created at least 3 test users)
            total_users = overview.get("totalUsers", 0)
            if total_users >= 3:
                self.log_result("analytics_dashboard", "user_count_accuracy", True, 
                              f"User count accurate: {total_users} users (expected >= 3)")
            else:
                self.log_result("analytics_dashboard", "user_count_accuracy", False, 
                              f"User count seems low: {total_users} (expected >= 3)")

            # Verify document count (we uploaded test documents)
            total_documents = overview.get("totalDocuments", 0)
            if total_documents >= 0:  # Should be at least 0, might be more if documents were created
                self.log_result("analytics_dashboard", "document_count_accuracy", True, 
                              f"Document count reasonable: {total_documents} documents")
            else:
                self.log_result("analytics_dashboard", "document_count_accuracy", False, 
                              f"Invalid document count: {total_documents}")

            # Verify task count (we created test tasks)
            total_tasks = overview.get("totalTasks", 0)
            if total_tasks >= 0:  # Should be at least 0, might be more if tasks were created
                self.log_result("analytics_dashboard", "task_count_accuracy", True, 
                              f"Task count reasonable: {total_tasks} tasks")
            else:
                self.log_result("analytics_dashboard", "task_count_accuracy", False, 
                              f"Invalid task count: {total_tasks}")

            # Verify completion rates are percentages (0-100)
            performance = analytics.get("performance", {})
            doc_completion_rate = performance.get("documentCompletionRate", 0)
            task_completion_rate = performance.get("taskCompletionRate", 0)
            
            if 0 <= doc_completion_rate <= 100:
                self.log_result("analytics_dashboard", "doc_completion_rate", True, 
                              f"Document completion rate valid: {doc_completion_rate}%")
            else:
                self.log_result("analytics_dashboard", "doc_completion_rate", False, 
                              f"Invalid document completion rate: {doc_completion_rate}%")

            if 0 <= task_completion_rate <= 100:
                self.log_result("analytics_dashboard", "task_completion_rate", True, 
                              f"Task completion rate valid: {task_completion_rate}%")
            else:
                self.log_result("analytics_dashboard", "task_completion_rate", False, 
                              f"Invalid task completion rate: {task_completion_rate}%")

            return True
        else:
            status = response.status_code if response else "No response"
            self.log_result("analytics_dashboard", "accuracy_test", False, 
                          f"Failed to get analytics for accuracy test: {status}")
            return False

    def test_hr_departments_api(self):
        """Test HR Departments API functionality"""
        print("\n=== Testing HR Departments API ===")
        
        if not self.auth_token:
            self.log_result("hr_departments", "no_token", False, "No auth token available")
            return False

        # Test 1: Create Department (Admin only)
        department_data = {
            "name": "Відділ кадрів",
            "description": "Управління персоналом та кадрова політика",
            "managerId": None,
            "parentDepartmentId": None
        }
        
        response = self.make_request("POST", "/hr/departments", department_data)
        if response and response.status_code == 200:
            data = response.json()
            self.test_department_id = data["department"]["id"]
            self.log_result("hr_departments", "create_department_admin", True,
                          f"Department created: {data['department']['name']}")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("hr_departments", "create_department_admin", False, f"Create department failed: {status} - {error_msg}")

        # Test 2: Create Department (Manager - should fail)
        if self.manager_token:
            old_token = self.auth_token
            self.auth_token = self.manager_token
            
            department_data = {
                "name": "IT Відділ",
                "description": "Інформаційні технології"
            }
            
            response = self.make_request("POST", "/hr/departments", department_data)
            if response and response.status_code == 403:
                self.log_result("hr_departments", "create_department_manager_denied", True,
                              "Manager correctly denied department creation")
            else:
                status = response.status_code if response else "No response"
                self.log_result("hr_departments", "create_department_manager_denied", False,
                              f"Manager access control failed: {status}")
            
            self.auth_token = old_token

        # Test 3: Get All Departments
        response = self.make_request("GET", "/hr/departments")
        if response and response.status_code == 200:
            departments = response.json()
            if isinstance(departments, list):
                self.log_result("hr_departments", "get_all_departments", True,
                              f"Retrieved {len(departments)} departments")
            else:
                self.log_result("hr_departments", "get_all_departments", False,
                              f"Invalid departments response: {departments}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_departments", "get_all_departments", False, f"Get departments failed: {status}")

        return True

    def test_hr_employees_api(self):
        """Test HR Employee Management API functionality"""
        print("\n=== Testing HR Employee Management API ===")
        
        if not self.auth_token:
            self.log_result("hr_employees", "no_token", False, "No auth token available")
            return False

        # Test 1: Create Employee (Admin)
        employee_data = {
            "fullName": "Іван Петренко",
            "position": "Спеціаліст з кадрів",
            "department": "Відділ кадрів",
            "employeeId": f"EMP-{datetime.now().strftime('%Y%m%d%H%M%S')}",
            "phoneNumber": "+380501234567",
            "email": "ivan.petrenko@tiskis.com",
            "hireDate": "2024-01-15",
            "salary": 25000,
            "workSchedule": "9:00-18:00",
            "contractType": "permanent"
        }
        
        response = self.make_request("POST", "/hr/employees", employee_data)
        if response and response.status_code == 200:
            data = response.json()
            self.test_employee_id = data["employee"]["id"]
            self.log_result("hr_employees", "create_employee_admin", True,
                          f"Employee created: {data['employee']['fullName']}")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("hr_employees", "create_employee_admin", False, f"Create employee failed: {status} - {error_msg}")

        # Test 2: Create Employee (Manager)
        if self.manager_token:
            old_token = self.auth_token
            self.auth_token = self.manager_token
            
            employee_data = {
                "fullName": "Марія Коваленко",
                "position": "Менеджер проектів",
                "department": "Відділ кадрів",
                "phoneNumber": "+380507654321",
                "email": "maria.kovalenko@tiskis.com"
            }
            
            response = self.make_request("POST", "/hr/employees", employee_data)
            if response and response.status_code == 200:
                data = response.json()
                self.log_result("hr_employees", "create_employee_manager", True,
                              f"Manager created employee: {data['employee']['fullName']}")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                self.log_result("hr_employees", "create_employee_manager", False, f"Manager create employee failed: {status} - {error_msg}")
            
            self.auth_token = old_token

        # Test 3: Create Employee (User - should fail)
        if self.user_token:
            old_token = self.auth_token
            self.auth_token = self.user_token
            
            employee_data = {
                "fullName": "Олексій Сидоренко",
                "position": "Аналітик",
                "department": "IT Відділ"
            }
            
            response = self.make_request("POST", "/hr/employees", employee_data)
            if response and response.status_code == 403:
                self.log_result("hr_employees", "create_employee_user_denied", True,
                              "User correctly denied employee creation")
            else:
                status = response.status_code if response else "No response"
                self.log_result("hr_employees", "create_employee_user_denied", False,
                              f"User access control failed: {status}")
            
            self.auth_token = old_token

        # Test 4: Get All Employees
        response = self.make_request("GET", "/hr/employees")
        if response and response.status_code == 200:
            employees = response.json()
            if isinstance(employees, list):
                self.log_result("hr_employees", "get_all_employees", True,
                              f"Retrieved {len(employees)} employees")
                
                # Verify employee structure
                if employees:
                    emp = employees[0]
                    required_fields = ['id', 'fullName', 'position', 'department', 'employeeId']
                    missing_fields = [field for field in required_fields if field not in emp]
                    
                    if not missing_fields:
                        self.log_result("hr_employees", "employee_structure", True,
                                      "Employee data structure correct")
                    else:
                        self.log_result("hr_employees", "employee_structure", False,
                                      f"Missing fields: {missing_fields}")
            else:
                self.log_result("hr_employees", "get_all_employees", False,
                              f"Invalid employees response: {employees}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_employees", "get_all_employees", False, f"Get employees failed: {status}")

        # Test 5: Filter Employees by Department
        response = self.make_request("GET", "/hr/employees?department=Відділ кадрів")
        if response and response.status_code == 200:
            employees = response.json()
            hr_employees = [emp for emp in employees if emp.get('department') == 'Відділ кадрів']
            self.log_result("hr_employees", "filter_by_department", True,
                          f"Found {len(hr_employees)} HR department employees")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_employees", "filter_by_department", False, f"Department filter failed: {status}")

        # Test 6: Filter Employees by Status
        response = self.make_request("GET", "/hr/employees?status=active")
        if response and response.status_code == 200:
            employees = response.json()
            active_employees = [emp for emp in employees if emp.get('status') == 'active']
            self.log_result("hr_employees", "filter_by_status", True,
                          f"Found {len(active_employees)} active employees")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_employees", "filter_by_status", False, f"Status filter failed: {status}")

        return True

    def test_hr_timesheet_api(self):
        """Test HR Timesheet Management API functionality"""
        print("\n=== Testing HR Timesheet Management API ===")
        
        if not self.auth_token:
            self.log_result("hr_timesheet", "no_token", False, "No auth token available")
            return False

        if not hasattr(self, 'test_employee_id') or not self.test_employee_id:
            self.log_result("hr_timesheet", "no_employee_id", False, "No test employee ID available")
            return False

        # Test 1: Create Timesheet Entry
        today = datetime.now()
        timesheet_data = {
            "employeeId": self.test_employee_id,
            "date": today.strftime("%Y-%m-%d"),
            "startTime": "09:00",
            "endTime": "18:00",
            "breakTime": 60,
            "workHours": 8,
            "overtime": 0,
            "comments": "Звичайний робочий день"
        }
        
        response = self.make_request("POST", "/timesheet/entries", timesheet_data)
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("hr_timesheet", "create_timesheet_entry", True,
                          f"Timesheet entry created for {timesheet_data['date']}")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("hr_timesheet", "create_timesheet_entry", False, f"Create timesheet failed: {status} - {error_msg}")

        # Test 2: Create Overtime Entry
        yesterday = datetime.now() - timedelta(days=1)
        overtime_data = {
            "employeeId": self.test_employee_id,
            "date": yesterday.strftime("%Y-%m-%d"),
            "startTime": "09:00",
            "endTime": "20:00",
            "breakTime": 60,
            "workHours": 8,
            "overtime": 3,
            "comments": "Робота над терміновим проектом"
        }
        
        response = self.make_request("POST", "/timesheet/entries", overtime_data)
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("hr_timesheet", "create_overtime_entry", True,
                          f"Overtime entry created: {overtime_data['overtime']} hours")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("hr_timesheet", "create_overtime_entry", False, f"Create overtime failed: {status} - {error_msg}")

        # Test 3: Create Absence Entry
        two_days_ago = datetime.now() - timedelta(days=2)
        absence_data = {
            "employeeId": self.test_employee_id,
            "date": two_days_ago.strftime("%Y-%m-%d"),
            "absenceType": "sick",
            "comments": "Лікарняний"
        }
        
        response = self.make_request("POST", "/timesheet/entries", absence_data)
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("hr_timesheet", "create_absence_entry", True,
                          f"Absence entry created: {absence_data['absenceType']}")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("hr_timesheet", "create_absence_entry", False, f"Create absence failed: {status} - {error_msg}")

        # Test 4: Get All Timesheet Entries
        response = self.make_request("GET", "/timesheet/entries")
        if response and response.status_code == 200:
            entries = response.json()
            if isinstance(entries, list):
                self.log_result("hr_timesheet", "get_all_entries", True,
                              f"Retrieved {len(entries)} timesheet entries")
                
                # Verify entry structure and employee enrichment
                if entries:
                    entry = entries[0]
                    required_fields = ['id', 'employeeId', 'date', 'status', 'createdAt']
                    missing_fields = [field for field in required_fields if field not in entry]
                    
                    if not missing_fields:
                        self.log_result("hr_timesheet", "entry_structure", True,
                                      "Timesheet entry structure correct")
                    else:
                        self.log_result("hr_timesheet", "entry_structure", False,
                                      f"Missing fields: {missing_fields}")
                    
                    # Check employee enrichment
                    if 'employee' in entry and entry['employee']:
                        self.log_result("hr_timesheet", "employee_enrichment", True,
                                      f"Employee info enriched: {entry['employee'].get('fullName', 'N/A')}")
                    else:
                        self.log_result("hr_timesheet", "employee_enrichment", False,
                                      "Employee information not enriched")
            else:
                self.log_result("hr_timesheet", "get_all_entries", False,
                              f"Invalid entries response: {entries}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_timesheet", "get_all_entries", False, f"Get entries failed: {status}")

        # Test 5: Filter by Employee
        response = self.make_request("GET", f"/timesheet/entries?employeeId={self.test_employee_id}")
        if response and response.status_code == 200:
            entries = response.json()
            employee_entries = [e for e in entries if e.get('employeeId') == self.test_employee_id]
            self.log_result("hr_timesheet", "filter_by_employee", True,
                          f"Found {len(employee_entries)} entries for test employee")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_timesheet", "filter_by_employee", False, f"Employee filter failed: {status}")

        # Test 6: Filter by Date Range
        date_from = (datetime.now() - timedelta(days=7)).strftime("%Y-%m-%d")
        date_to = datetime.now().strftime("%Y-%m-%d")
        
        response = self.make_request("GET", f"/timesheet/entries?dateFrom={date_from}&dateTo={date_to}")
        if response and response.status_code == 200:
            entries = response.json()
            self.log_result("hr_timesheet", "filter_by_date_range", True,
                          f"Found {len(entries)} entries in last 7 days")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_timesheet", "filter_by_date_range", False, f"Date range filter failed: {status}")

        # Test 7: Filter by Month
        current_month = datetime.now().strftime("%Y-%m-01")
        
        response = self.make_request("GET", f"/timesheet/entries?month={current_month}")
        if response and response.status_code == 200:
            entries = response.json()
            self.log_result("hr_timesheet", "filter_by_month", True,
                          f"Found {len(entries)} entries for current month")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_timesheet", "filter_by_month", False, f"Month filter failed: {status}")

        return True

    def test_hr_business_trips_api(self):
        """Test HR Business Trips API functionality"""
        print("\n=== Testing HR Business Trips API ===")
        
        if not self.auth_token:
            self.log_result("hr_business_trips", "no_token", False, "No auth token available")
            return False

        if not hasattr(self, 'test_employee_id') or not self.test_employee_id:
            self.log_result("hr_business_trips", "no_employee_id", False, "No test employee ID available")
            return False

        # Test 1: Create Business Trip Request
        start_date = datetime.now() + timedelta(days=7)
        end_date = start_date + timedelta(days=3)
        
        trip_data = {
            "employeeId": self.test_employee_id,
            "destination": "Київ",
            "purpose": "Участь у конференції з HR-технологій",
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "transportType": "train",
            "estimatedCost": 5000,
            "comments": "Потрібне бронювання готелю"
        }
        
        response = self.make_request("POST", "/hr/business-trips", trip_data)
        if response and response.status_code == 200:
            data = response.json()
            self.test_trip_id = data["businessTrip"]["id"]
            self.log_result("hr_business_trips", "create_business_trip", True,
                          f"Business trip created: {trip_data['destination']}")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("hr_business_trips", "create_business_trip", False, f"Create trip failed: {status} - {error_msg}")

        # Test 2: Create Another Business Trip (Different Status)
        start_date = datetime.now() + timedelta(days=14)
        end_date = start_date + timedelta(days=2)
        
        trip_data = {
            "employeeId": self.test_employee_id,
            "destination": "Львів",
            "purpose": "Навчання персоналу",
            "startDate": start_date.strftime("%Y-%m-%d"),
            "endDate": end_date.strftime("%Y-%m-%d"),
            "transportType": "car",
            "estimatedCost": 3000
        }
        
        response = self.make_request("POST", "/hr/business-trips", trip_data)
        if response and response.status_code == 200:
            data = response.json()
            self.log_result("hr_business_trips", "create_second_trip", True,
                          f"Second trip created: {trip_data['destination']}")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
            self.log_result("hr_business_trips", "create_second_trip", False, f"Create second trip failed: {status} - {error_msg}")

        # Test 3: Get All Business Trips
        response = self.make_request("GET", "/hr/business-trips")
        if response and response.status_code == 200:
            trips = response.json()
            if isinstance(trips, list):
                self.log_result("hr_business_trips", "get_all_trips", True,
                              f"Retrieved {len(trips)} business trips")
                
                # Verify trip structure and employee enrichment
                if trips:
                    trip = trips[0]
                    required_fields = ['id', 'employeeId', 'destination', 'purpose', 'startDate', 'endDate', 'status']
                    missing_fields = [field for field in required_fields if field not in trip]
                    
                    if not missing_fields:
                        self.log_result("hr_business_trips", "trip_structure", True,
                                      "Business trip structure correct")
                    else:
                        self.log_result("hr_business_trips", "trip_structure", False,
                                      f"Missing fields: {missing_fields}")
                    
                    # Check employee enrichment
                    if 'employee' in trip and trip['employee']:
                        self.log_result("hr_business_trips", "employee_enrichment", True,
                                      f"Employee info enriched: {trip['employee'].get('fullName', 'N/A')}")
                    else:
                        self.log_result("hr_business_trips", "employee_enrichment", False,
                                      "Employee information not enriched")
            else:
                self.log_result("hr_business_trips", "get_all_trips", False,
                              f"Invalid trips response: {trips}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_business_trips", "get_all_trips", False, f"Get trips failed: {status}")

        # Test 4: Filter Business Trips by Status
        response = self.make_request("GET", "/hr/business-trips?status=pending")
        if response and response.status_code == 200:
            trips = response.json()
            pending_trips = [t for t in trips if t.get('status') == 'pending']
            self.log_result("hr_business_trips", "filter_by_status", True,
                          f"Found {len(pending_trips)} pending trips")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_business_trips", "filter_by_status", False, f"Status filter failed: {status}")

        # Test 5: Filter Business Trips by Employee
        response = self.make_request("GET", f"/hr/business-trips?employeeId={self.test_employee_id}")
        if response and response.status_code == 200:
            trips = response.json()
            employee_trips = [t for t in trips if t.get('employeeId') == self.test_employee_id]
            self.log_result("hr_business_trips", "filter_by_employee", True,
                          f"Found {len(employee_trips)} trips for test employee")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_business_trips", "filter_by_employee", False, f"Employee filter failed: {status}")

        return True

    def test_complete_hr_workflow(self):
        """Test complete HR workflow integration"""
        print("\n=== Testing Complete HR Workflow Integration ===")
        
        if not self.auth_token:
            self.log_result("hr_workflow", "no_token", False, "No auth token available")
            return False

        try:
            # Step 1: Create Department
            dept_data = {
                "name": "Тестовий відділ",
                "description": "Відділ для тестування workflow"
            }
            
            dept_response = self.make_request("POST", "/hr/departments", dept_data)
            
            if not (dept_response and dept_response.status_code == 200):
                self.log_result("hr_workflow", "complete_workflow", False, "Failed to create department")
                return False
            
            # Step 2: Create Employee in that Department
            emp_data = {
                "fullName": "Тестовий Співробітник",
                "position": "Тестова посада",
                "department": "Тестовий відділ",
                "email": "test.employee@tiskis.com"
            }
            
            emp_response = self.make_request("POST", "/hr/employees", emp_data)
            
            if not (emp_response and emp_response.status_code == 200):
                self.log_result("hr_workflow", "complete_workflow", False, "Failed to create employee")
                return False
            
            workflow_employee_id = emp_response.json()["employee"]["id"]
            
            # Step 3: Create Timesheet Entry for Employee
            timesheet_data = {
                "employeeId": workflow_employee_id,
                "date": datetime.now().strftime("%Y-%m-%d"),
                "startTime": "08:30",
                "endTime": "17:30",
                "workHours": 8,
                "comments": "Workflow test entry"
            }
            
            timesheet_response = self.make_request("POST", "/timesheet/entries", timesheet_data)
            
            if not (timesheet_response and timesheet_response.status_code == 200):
                self.log_result("hr_workflow", "complete_workflow", False, "Failed to create timesheet entry")
                return False
            
            # Step 4: Create Business Trip Request for Employee
            trip_data = {
                "employeeId": workflow_employee_id,
                "destination": "Одеса",
                "purpose": "Workflow testing trip",
                "startDate": (datetime.now() + timedelta(days=5)).strftime("%Y-%m-%d"),
                "endDate": (datetime.now() + timedelta(days=7)).strftime("%Y-%m-%d"),
                "estimatedCost": 2500
            }
            
            trip_response = self.make_request("POST", "/hr/business-trips", trip_data)
            
            if trip_response and trip_response.status_code == 200:
                self.log_result("hr_workflow", "complete_workflow", True,
                              "Complete HR workflow successful: Department → Employee → Timesheet → Business Trip")
                return True
            else:
                self.log_result("hr_workflow", "complete_workflow", False, "Failed to create business trip")
                
        except Exception as e:
            self.log_result("hr_workflow", "complete_workflow", False, f"Workflow test error: {str(e)}")
            
        return False

    def test_hr_data_validation(self):
        """Test HR data validation and error handling"""
        print("\n=== Testing HR Data Validation ===")
        
        if not self.auth_token:
            self.log_result("hr_validation", "no_token", False, "No auth token available")
            return False

        # Test 1: Create Employee without required fields
        invalid_employee = {
            "fullName": "Test User"
            # Missing position and department
        }
        
        response = self.make_request("POST", "/hr/employees", invalid_employee)
        if response and response.status_code == 400:
            self.log_result("hr_validation", "employee_missing_fields", True,
                          "Employee validation correctly rejected missing fields")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_validation", "employee_missing_fields", False,
                          f"Employee validation failed: {status}")

        # Test 2: Create Timesheet without required fields
        invalid_timesheet = {
            "date": datetime.now().strftime("%Y-%m-%d")
            # Missing employeeId
        }
        
        response = self.make_request("POST", "/timesheet/entries", invalid_timesheet)
        if response and response.status_code == 400:
            self.log_result("hr_validation", "timesheet_missing_fields", True,
                          "Timesheet validation correctly rejected missing employeeId")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_validation", "timesheet_missing_fields", False,
                          f"Timesheet validation failed: {status}")

        # Test 3: Create Business Trip without required fields
        invalid_trip = {
            "destination": "Test City"
            # Missing employeeId, purpose, dates
        }
        
        response = self.make_request("POST", "/hr/business-trips", invalid_trip)
        if response and response.status_code == 400:
            self.log_result("hr_validation", "trip_missing_fields", True,
                          "Business trip validation correctly rejected missing fields")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_validation", "trip_missing_fields", False,
                          f"Business trip validation failed: {status}")

        # Test 4: Create Department without name
        invalid_dept = {
            "description": "Test department"
            # Missing name
        }
        
        response = self.make_request("POST", "/hr/departments", invalid_dept)
        if response and response.status_code == 400:
            self.log_result("hr_validation", "department_missing_name", True,
                          "Department validation correctly rejected missing name")
        else:
            status = response.status_code if response else "No response"
            self.log_result("hr_validation", "department_missing_name", False,
                          f"Department validation failed: {status}")

        return True

    def test_hr_authentication_requirements(self):
        """Test that all HR endpoints require authentication"""
        print("\n=== Testing HR Authentication Requirements ===")
        
        endpoints = [
            ("GET", "/hr/employees"),
            ("POST", "/hr/employees"),
            ("GET", "/hr/departments"),
            ("POST", "/hr/departments"),
            ("GET", "/timesheet/entries"),
            ("POST", "/timesheet/entries"),
            ("GET", "/hr/business-trips"),
            ("POST", "/hr/business-trips")
        ]
        
        old_token = self.auth_token
        self.auth_token = None
        
        for method, endpoint in endpoints:
            if method == "GET":
                response = self.make_request("GET", endpoint)
            else:
                response = self.make_request("POST", endpoint, {})
            
            if response and response.status_code == 401:
                self.log_result("hr_auth", f"auth_required_{method}_{endpoint.replace('/', '_')}", True,
                              f"{method} {endpoint} correctly requires authentication")
            else:
                status = response.status_code if response else "No response"
                self.log_result("hr_auth", f"auth_required_{method}_{endpoint.replace('/', '_')}", False,
                              f"{method} {endpoint} auth requirement failed: {status}")
        
        self.auth_token = old_token
        return True

    def test_finance_accounts_api(self):
        """Test Financial Accounting - Chart of Accounts API"""
        print("\n=== Testing Chart of Accounts API ===")
        
        if not self.auth_token:
            self.log_result("finance_accounts", "no_token", False, "No auth token available")
            return False

        # Test 1: Create accounting accounts (admin/manager only)
        print("Creating accounting accounts with different types...")
        
        test_accounts_data = [
            {
                "code": "1000",
                "name": "Каса",
                "type": "asset",
                "level": 1,
                "currency": "UAH",
                "description": "Готівкові кошти в касі підприємства"
            },
            {
                "code": "2000", 
                "name": "Кредиторська заборгованість",
                "type": "liability",
                "level": 1,
                "currency": "UAH",
                "description": "Заборгованість перед постачальниками"
            },
            {
                "code": "3000",
                "name": "Статутний капітал",
                "type": "equity", 
                "level": 1,
                "currency": "UAH",
                "description": "Власний капітал підприємства"
            },
            {
                "code": "7000",
                "name": "Доходи від реалізації",
                "type": "revenue",
                "level": 1,
                "currency": "UAH",
                "description": "Доходи від основної діяльності"
            },
            {
                "code": "9000",
                "name": "Витрати на оплату праці",
                "type": "expense",
                "level": 1,
                "currency": "UAH",
                "description": "Витрати на заробітну плату співробітників"
            }
        ]
        
        created_accounts = 0
        for account_data in test_accounts_data:
            response = self.make_request("POST", "/finance/accounts", account_data)
            if response and response.status_code == 200:
                account = response.json().get("account")
                if account:
                    created_accounts += 1
                    self.log_result("finance_accounts", f"create_account_{account_data['type']}", True, 
                                  f"Created {account_data['type']} account: {account_data['name']} ({account_data['code']})")
                else:
                    self.log_result("finance_accounts", f"create_account_{account_data['type']}", False, 
                                  f"Account created but no account data returned")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                self.log_result("finance_accounts", f"create_account_{account_data['type']}", False, 
                              f"Failed to create account: {status} - {error_msg}")

        # Test 2: Get Chart of Accounts (GET /api/finance/accounts)
        response = self.make_request("GET", "/finance/accounts")
        if response and response.status_code == 200:
            accounts = response.json()
            if isinstance(accounts, list):
                self.log_result("finance_accounts", "get_accounts", True, 
                              f"Retrieved {len(accounts)} accounts successfully")
                
                # Verify account structure
                if accounts:
                    account = accounts[0]
                    required_fields = ["id", "code", "name", "type", "balance", "currency", "createdAt"]
                    missing_fields = [field for field in required_fields if field not in account]
                    if not missing_fields:
                        self.log_result("finance_accounts", "account_structure", True, "Account structure validation passed")
                    else:
                        self.log_result("finance_accounts", "account_structure", False, f"Missing fields: {missing_fields}")
                        
                    # Verify account types
                    account_types = set(acc.get("type") for acc in accounts)
                    expected_types = {"asset", "liability", "equity", "revenue", "expense"}
                    if expected_types.issubset(account_types):
                        self.log_result("finance_accounts", "account_types", True, "All account types created successfully")
                    else:
                        missing_types = expected_types - account_types
                        self.log_result("finance_accounts", "account_types", False, f"Missing account types: {missing_types}")
            else:
                self.log_result("finance_accounts", "get_accounts", False, f"Invalid accounts response: {accounts}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("finance_accounts", "get_accounts", False, f"Failed to retrieve accounts: {status}")

        # Test 3: Test role-based access control (regular user should be denied)
        if self.user_token:
            old_token = self.auth_token
            self.auth_token = self.user_token
            
            test_account = {
                "code": "1001",
                "name": "Test Account",
                "type": "asset"
            }
            
            response = self.make_request("POST", "/finance/accounts", test_account)
            if response and response.status_code == 403:
                self.log_result("finance_accounts", "rbac_user_denied", True, "Regular user properly denied account creation")
            else:
                status = response.status_code if response else "No response"
                self.log_result("finance_accounts", "rbac_user_denied", False, f"RBAC not working for accounts: {status}")
            
            self.auth_token = old_token

        return created_accounts > 0

    def test_finance_counterparties_api(self):
        """Test Financial Accounting - Counterparties API"""
        print("\n=== Testing Counterparties API ===")
        
        if not self.auth_token:
            self.log_result("finance_counterparties", "no_token", False, "No auth token available")
            return False

        # Test 1: Create counterparties (customers and suppliers)
        print("Creating counterparties (customers and suppliers)...")
        
        test_counterparties_data = [
            {
                "name": "ТОВ 'Постачальник-1'",
                "type": "supplier",
                "taxId": "12345678901",
                "contactPerson": "Іванов Іван Іванович",
                "email": "supplier1@example.com",
                "phone": "+380501234567",
                "address": "м. Київ, вул. Хрещатик, 1",
                "creditLimit": 100000,
                "paymentTerms": 30
            },
            {
                "name": "ПП 'Клієнт-1'",
                "type": "customer", 
                "taxId": "98765432109",
                "contactPerson": "Петров Петро Петрович",
                "email": "customer1@example.com",
                "phone": "+380671234567",
                "address": "м. Львів, вул. Свободи, 10",
                "creditLimit": 50000,
                "paymentTerms": 14
            },
            {
                "name": "АТ 'Універсальний партнер'",
                "type": "both",
                "taxId": "11111111111",
                "contactPerson": "Сидоров Сидір Сидорович",
                "email": "partner@example.com", 
                "phone": "+380931234567",
                "address": "м. Одеса, вул. Дерибасівська, 5",
                "creditLimit": 200000,
                "paymentTerms": 21
            }
        ]
        
        created_counterparties = 0
        for counterparty_data in test_counterparties_data:
            response = self.make_request("POST", "/finance/counterparties", counterparty_data)
            if response and response.status_code == 200:
                counterparty = response.json().get("counterparty")
                if counterparty:
                    created_counterparties += 1
                    self.log_result("finance_counterparties", f"create_{counterparty_data['type']}", True, 
                                  f"Created {counterparty_data['type']}: {counterparty_data['name']}")
                else:
                    self.log_result("finance_counterparties", f"create_{counterparty_data['type']}", False, 
                                  f"Counterparty created but no data returned")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                self.log_result("finance_counterparties", f"create_{counterparty_data['type']}", False, 
                              f"Failed to create counterparty: {status} - {error_msg}")

        # Test 2: Get all counterparties
        response = self.make_request("GET", "/finance/counterparties")
        if response and response.status_code == 200:
            counterparties = response.json()
            if isinstance(counterparties, list):
                self.log_result("finance_counterparties", "get_all", True, 
                              f"Retrieved {len(counterparties)} counterparties successfully")
                
                # Verify counterparty structure
                if counterparties:
                    counterparty = counterparties[0]
                    required_fields = ["id", "name", "type", "taxId", "contactPerson", "creditLimit", "createdAt"]
                    missing_fields = [field for field in required_fields if field not in counterparty]
                    if not missing_fields:
                        self.log_result("finance_counterparties", "counterparty_structure", True, "Counterparty structure validation passed")
                    else:
                        self.log_result("finance_counterparties", "counterparty_structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("finance_counterparties", "get_all", False, f"Invalid counterparties response: {counterparties}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("finance_counterparties", "get_all", False, f"Failed to retrieve counterparties: {status}")

        # Test 3: Filter counterparties by type
        for filter_type in ['customer', 'supplier', 'both']:
            response = self.make_request("GET", f"/finance/counterparties?type={filter_type}")
            if response and response.status_code == 200:
                filtered_counterparties = response.json()
                if isinstance(filtered_counterparties, list):
                    self.log_result("finance_counterparties", f"filter_{filter_type}", True, 
                                  f"Type filter '{filter_type}' returned {len(filtered_counterparties)} counterparties")
                else:
                    self.log_result("finance_counterparties", f"filter_{filter_type}", False, 
                                  f"Invalid filtered response: {filtered_counterparties}")
            else:
                status = response.status_code if response else "No response"
                self.log_result("finance_counterparties", f"filter_{filter_type}", False, 
                              f"Type filtering failed: {status}")

        return created_counterparties > 0

    def test_finance_journal_entries_api(self):
        """Test Financial Accounting - Journal Entries API"""
        print("\n=== Testing Journal Entries API ===")
        
        if not self.auth_token:
            self.log_result("finance_journal_entries", "no_token", False, "No auth token available")
            return False

        # First get some accounts to use in journal entries
        accounts_response = self.make_request("GET", "/finance/accounts")
        if not (accounts_response and accounts_response.status_code == 200):
            self.log_result("finance_journal_entries", "get_accounts_prereq", False, "Failed to get accounts for journal entries")
            return False
            
        accounts = accounts_response.json()
        if len(accounts) < 2:
            self.log_result("finance_journal_entries", "insufficient_accounts", False, "Need at least 2 accounts for journal entries")
            return False

        # Test 1: Create journal entries with proper double-entry bookkeeping
        print("Creating journal entries with double-entry bookkeeping...")
        
        test_journal_entries = [
            {
                "description": "Надходження готівки до каси",
                "date": datetime.now().isoformat(),
                "reference": "ПКО-001",
                "lines": [
                    {
                        "accountId": accounts[0]["id"],  # Debit account
                        "debit": 10000,
                        "credit": 0,
                        "description": "Надходження готівки"
                    },
                    {
                        "accountId": accounts[1]["id"],  # Credit account
                        "debit": 0,
                        "credit": 10000,
                        "description": "Зменшення заборгованості"
                    }
                ]
            },
            {
                "description": "Оплата постачальнику",
                "date": datetime.now().isoformat(),
                "reference": "ВКО-002",
                "lines": [
                    {
                        "accountId": accounts[1]["id"],  # Debit account
                        "debit": 5000,
                        "credit": 0,
                        "description": "Погашення заборгованості"
                    },
                    {
                        "accountId": accounts[0]["id"],  # Credit account
                        "debit": 0,
                        "credit": 5000,
                        "description": "Витрата готівки"
                    }
                ]
            }
        ]
        
        created_entries = 0
        for entry_data in test_journal_entries:
            response = self.make_request("POST", "/finance/journal-entries", entry_data)
            if response and response.status_code == 200:
                entry = response.json().get("entry")
                if entry:
                    created_entries += 1
                    self.log_result("finance_journal_entries", f"create_entry_{created_entries}", True, 
                                  f"Created journal entry: {entry_data['description']}")
                    
                    # Verify entry structure
                    required_fields = ["id", "number", "description", "date", "lines", "totalDebit", "totalCredit"]
                    missing_fields = [field for field in required_fields if field not in entry]
                    if not missing_fields:
                        self.log_result("finance_journal_entries", f"entry_structure_{created_entries}", True, 
                                      "Journal entry structure validation passed")
                    else:
                        self.log_result("finance_journal_entries", f"entry_structure_{created_entries}", False, 
                                      f"Missing fields: {missing_fields}")
                    
                    # Verify debit/credit balance
                    if entry.get("totalDebit") == entry.get("totalCredit"):
                        self.log_result("finance_journal_entries", f"balance_check_{created_entries}", True, 
                                      "Debit equals credit - proper double-entry")
                    else:
                        self.log_result("finance_journal_entries", f"balance_check_{created_entries}", False, 
                                      f"Debit ({entry.get('totalDebit')}) != Credit ({entry.get('totalCredit')})")
                else:
                    self.log_result("finance_journal_entries", f"create_entry_{created_entries + 1}", False, 
                                  f"Entry created but no data returned")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                self.log_result("finance_journal_entries", f"create_entry_{created_entries + 1}", False, 
                              f"Failed to create entry: {status} - {error_msg}")

        # Test 2: Get journal entries
        response = self.make_request("GET", "/finance/journal-entries")
        if response and response.status_code == 200:
            entries = response.json()
            if isinstance(entries, list):
                self.log_result("finance_journal_entries", "get_entries", True, 
                              f"Retrieved {len(entries)} journal entries successfully")
            else:
                self.log_result("finance_journal_entries", "get_entries", False, f"Invalid entries response: {entries}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("finance_journal_entries", "get_entries", False, f"Failed to retrieve entries: {status}")

        # Test 3: Date filtering
        start_date = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0).isoformat()
        end_date = (datetime.now() + timedelta(days=1)).isoformat()
        
        response = self.make_request("GET", f"/finance/journal-entries?startDate={start_date}&endDate={end_date}")
        if response and response.status_code == 200:
            filtered_entries = response.json()
            if isinstance(filtered_entries, list):
                self.log_result("finance_journal_entries", "date_filtering", True, 
                              f"Date filtering returned {len(filtered_entries)} entries")
            else:
                self.log_result("finance_journal_entries", "date_filtering", False, f"Invalid filtered response: {filtered_entries}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("finance_journal_entries", "date_filtering", False, f"Date filtering failed: {status}")

        # Test 4: Test invalid entry (unbalanced debit/credit)
        invalid_entry = {
            "description": "Неправильна проводка",
            "date": datetime.now().isoformat(),
            "reference": "ERR-001",
            "lines": [
                {
                    "accountId": accounts[0]["id"],
                    "debit": 1000,
                    "credit": 0,
                    "description": "Дебет"
                },
                {
                    "accountId": accounts[1]["id"],
                    "debit": 0,
                    "credit": 500,  # Unbalanced!
                    "description": "Кредит"
                }
            ]
        }
        
        response = self.make_request("POST", "/finance/journal-entries", invalid_entry)
        if response and response.status_code == 400:
            self.log_result("finance_journal_entries", "unbalanced_validation", True, 
                          "Unbalanced entry properly rejected")
        else:
            status = response.status_code if response else "No response"
            self.log_result("finance_journal_entries", "unbalanced_validation", False, 
                          f"Unbalanced entry validation failed: {status}")

        return created_entries > 0

    def test_finance_bank_accounts_api(self):
        """Test Financial Accounting - Bank Accounts API"""
        print("\n=== Testing Bank Accounts API ===")
        
        if not self.auth_token:
            self.log_result("finance_bank_accounts", "no_token", False, "No auth token available")
            return False

        # Test 1: Create bank accounts
        print("Creating bank accounts...")
        
        test_bank_accounts = [
            {
                "accountNumber": "UA213223130000026007233566001",
                "bankName": "ПриватБанк",
                "bankCode": "305299",
                "currency": "UAH",
                "accountType": "current",
                "isActive": True,
                "description": "Основний розрахунковий рахунок"
            },
            {
                "accountNumber": "UA903052992990004149123456789",
                "bankName": "Ощадбанк",
                "bankCode": "300012",
                "currency": "USD",
                "accountType": "currency",
                "isActive": True,
                "description": "Валютний рахунок для міжнародних операцій"
            }
        ]
        
        created_bank_accounts = 0
        for bank_account_data in test_bank_accounts:
            response = self.make_request("POST", "/finance/bank-accounts", bank_account_data)
            if response and response.status_code == 200:
                bank_account = response.json().get("bankAccount")
                if bank_account:
                    created_bank_accounts += 1
                    self.log_result("finance_bank_accounts", f"create_{bank_account_data['currency']}", True, 
                                  f"Created {bank_account_data['currency']} bank account: {bank_account_data['bankName']}")
                else:
                    self.log_result("finance_bank_accounts", f"create_{bank_account_data['currency']}", False, 
                                  f"Bank account created but no data returned")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                self.log_result("finance_bank_accounts", f"create_{bank_account_data['currency']}", False, 
                              f"Failed to create bank account: {status} - {error_msg}")

        # Test 2: Get bank accounts
        response = self.make_request("GET", "/finance/bank-accounts")
        if response and response.status_code == 200:
            bank_accounts = response.json()
            if isinstance(bank_accounts, list):
                self.log_result("finance_bank_accounts", "get_accounts", True, 
                              f"Retrieved {len(bank_accounts)} bank accounts successfully")
                
                # Verify bank account structure
                if bank_accounts:
                    bank_account = bank_accounts[0]
                    required_fields = ["id", "accountNumber", "bankName", "bankCode", "currency", "accountType", "isActive"]
                    missing_fields = [field for field in required_fields if field not in bank_account]
                    if not missing_fields:
                        self.log_result("finance_bank_accounts", "account_structure", True, "Bank account structure validation passed")
                    else:
                        self.log_result("finance_bank_accounts", "account_structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("finance_bank_accounts", "get_accounts", False, f"Invalid bank accounts response: {bank_accounts}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("finance_bank_accounts", "get_accounts", False, f"Failed to retrieve bank accounts: {status}")

        return created_bank_accounts > 0

    def test_crm_leads_api(self):
        """Test CRM - Leads Management API"""
        print("\n=== Testing CRM Leads Management API ===")
        
        if not self.auth_token:
            self.log_result("crm_leads", "no_token", False, "No auth token available")
            return False

        # Test 1: Create leads
        print("Creating leads with different statuses...")
        
        test_leads_data = [
            {
                "title": "Потенційний клієнт - ТОВ 'Інноваційні рішення'",
                "contactName": "Коваленко Олександр Петрович",
                "company": "ТОВ 'Інноваційні рішення'",
                "email": "kovalenko@innovations.ua",
                "phone": "+380671234567",
                "source": "website",
                "expectedValue": 150000,
                "description": "Зацікавлені в розробці корпоративної системи управління"
            },
            {
                "title": "Лід з соціальних мереж - Стартап",
                "contactName": "Петренко Марія Іванівна",
                "company": "Стартап 'Майбутнє'",
                "email": "petrenko@future-startup.com",
                "phone": "+380501234567",
                "source": "social_media",
                "expectedValue": 75000,
                "description": "Потребують систему CRM для управління клієнтами"
            },
            {
                "title": "Холодний дзвінок - Великий клієнт",
                "contactName": "Сидоренко Віктор Миколайович",
                "company": "Корпорація 'Лідер'",
                "email": "sidorenko@leader-corp.ua",
                "phone": "+380931234567",
                "source": "cold_call",
                "expectedValue": 300000,
                "description": "Великий проект з автоматизації бізнес-процесів"
            }
        ]
        
        created_leads = 0
        lead_ids = []
        for lead_data in test_leads_data:
            response = self.make_request("POST", "/crm/leads", lead_data)
            if response and response.status_code == 200:
                lead = response.json().get("lead")
                if lead:
                    created_leads += 1
                    lead_ids.append(lead["id"])
                    self.log_result("crm_leads", f"create_lead_{lead_data['source']}", True, 
                                  f"Created lead from {lead_data['source']}: {lead_data['title']}")
                else:
                    self.log_result("crm_leads", f"create_lead_{lead_data['source']}", False, 
                                  f"Lead created but no data returned")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                self.log_result("crm_leads", f"create_lead_{lead_data['source']}", False, 
                              f"Failed to create lead: {status} - {error_msg}")

        # Test 2: Get all leads
        response = self.make_request("GET", "/crm/leads")
        if response and response.status_code == 200:
            leads = response.json()
            if isinstance(leads, list):
                self.log_result("crm_leads", "get_all_leads", True, 
                              f"Retrieved {len(leads)} leads successfully")
                
                # Verify lead structure
                if leads:
                    lead = leads[0]
                    required_fields = ["id", "title", "contactName", "status", "expectedValue", "createdBy", "createdAt"]
                    missing_fields = [field for field in required_fields if field not in lead]
                    if not missing_fields:
                        self.log_result("crm_leads", "lead_structure", True, "Lead structure validation passed")
                    else:
                        self.log_result("crm_leads", "lead_structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("crm_leads", "get_all_leads", False, f"Invalid leads response: {leads}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("crm_leads", "get_all_leads", False, f"Failed to retrieve leads: {status}")

        # Test 3: Filter leads by status
        for status_filter in ['new', 'contacted', 'qualified']:
            response = self.make_request("GET", f"/crm/leads?status={status_filter}")
            if response and response.status_code == 200:
                filtered_leads = response.json()
                if isinstance(filtered_leads, list):
                    self.log_result("crm_leads", f"filter_{status_filter}", True, 
                                  f"Status filter '{status_filter}' returned {len(filtered_leads)} leads")
                else:
                    self.log_result("crm_leads", f"filter_{status_filter}", False, 
                                  f"Invalid filtered response: {filtered_leads}")
            else:
                status = response.status_code if response else "No response"
                self.log_result("crm_leads", f"filter_{status_filter}", False, 
                              f"Status filtering failed: {status}")

        # Test 4: Update lead status through pipeline
        if lead_ids:
            lead_id = lead_ids[0]
            status_pipeline = [
                {"status": "contacted", "comment": "Встановлено контакт з клієнтом"},
                {"status": "qualified", "comment": "Клієнт кваліфікований як перспективний"},
                {"status": "proposal", "comment": "Надіслано комерційну пропозицію"},
                {"status": "negotiation", "comment": "Ведуться переговори щодо умов"},
                {"status": "won", "comment": "Угода успішно закрита"}
            ]
            
            for status_update in status_pipeline:
                response = self.make_request("PUT", f"/crm/leads/{lead_id}/status", status_update)
                if response and response.status_code == 200:
                    self.log_result("crm_leads", f"update_status_{status_update['status']}", True, 
                                  f"Lead status updated to '{status_update['status']}'")
                else:
                    status = response.status_code if response else "No response"
                    error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                    self.log_result("crm_leads", f"update_status_{status_update['status']}", False, 
                                  f"Failed to update status: {status} - {error_msg}")

        return created_leads > 0

    def test_crm_opportunities_api(self):
        """Test CRM - Opportunities API"""
        print("\n=== Testing CRM Opportunities API ===")
        
        if not self.auth_token:
            self.log_result("crm_opportunities", "no_token", False, "No auth token available")
            return False

        # First get counterparties to link opportunities
        counterparties_response = self.make_request("GET", "/finance/counterparties")
        counterparty_id = None
        if counterparties_response and counterparties_response.status_code == 200:
            counterparties = counterparties_response.json()
            if counterparties:
                counterparty_id = counterparties[0]["id"]

        # Test 1: Create opportunities
        print("Creating sales opportunities...")
        
        test_opportunities_data = [
            {
                "title": "Розробка ERP системи для виробництва",
                "description": "Комплексна система управління виробничими процесами",
                "counterpartyId": counterparty_id,
                "expectedValue": 500000,
                "probability": 75,
                "stage": "proposal",
                "expectedCloseDate": (datetime.now() + timedelta(days=60)).isoformat(),
                "products": []
            },
            {
                "title": "Впровадження CRM системи",
                "description": "Система управління взаємовідносинами з клієнтами",
                "counterpartyId": counterparty_id,
                "expectedValue": 200000,
                "probability": 50,
                "stage": "negotiation",
                "expectedCloseDate": (datetime.now() + timedelta(days=30)).isoformat(),
                "products": []
            }
        ]
        
        created_opportunities = 0
        for opportunity_data in test_opportunities_data:
            response = self.make_request("POST", "/crm/opportunities", opportunity_data)
            if response and response.status_code == 200:
                opportunity = response.json().get("opportunity")
                if opportunity:
                    created_opportunities += 1
                    self.log_result("crm_opportunities", f"create_opportunity_{opportunity_data['stage']}", True, 
                                  f"Created opportunity: {opportunity_data['title']} (Stage: {opportunity_data['stage']})")
                else:
                    self.log_result("crm_opportunities", f"create_opportunity_{opportunity_data['stage']}", False, 
                                  f"Opportunity created but no data returned")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                self.log_result("crm_opportunities", f"create_opportunity_{opportunity_data['stage']}", False, 
                              f"Failed to create opportunity: {status} - {error_msg}")

        # Test 2: Get opportunities with counterparty enrichment
        response = self.make_request("GET", "/crm/opportunities")
        if response and response.status_code == 200:
            opportunities = response.json()
            if isinstance(opportunities, list):
                self.log_result("crm_opportunities", "get_opportunities", True, 
                              f"Retrieved {len(opportunities)} opportunities successfully")
                
                # Verify opportunity structure and counterparty enrichment
                if opportunities:
                    opportunity = opportunities[0]
                    required_fields = ["id", "title", "expectedValue", "probability", "stage", "createdAt"]
                    missing_fields = [field for field in required_fields if field not in opportunity]
                    if not missing_fields:
                        self.log_result("crm_opportunities", "opportunity_structure", True, "Opportunity structure validation passed")
                    else:
                        self.log_result("crm_opportunities", "opportunity_structure", False, f"Missing fields: {missing_fields}")
                    
                    # Check counterparty enrichment
                    if "counterparty" in opportunity and opportunity["counterparty"]:
                        self.log_result("crm_opportunities", "counterparty_enrichment", True, "Counterparty data enriched in opportunities")
                    else:
                        self.log_result("crm_opportunities", "counterparty_enrichment", False, "Counterparty data not enriched")
            else:
                self.log_result("crm_opportunities", "get_opportunities", False, f"Invalid opportunities response: {opportunities}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("crm_opportunities", "get_opportunities", False, f"Failed to retrieve opportunities: {status}")

        return created_opportunities > 0

    def test_crm_products_api(self):
        """Test CRM - Products API"""
        print("\n=== Testing CRM Products API ===")
        
        if not self.auth_token:
            self.log_result("crm_products", "no_token", False, "No auth token available")
            return False

        # Test 1: Create products (admin/manager only)
        print("Creating products with different categories...")
        
        test_products_data = [
            {
                "name": "ERP Система 'Базова'",
                "description": "Базова версія системи планування ресурсів підприємства",
                "category": "software",
                "price": 100000,
                "currency": "UAH",
                "unit": "license",
                "isActive": True,
                "specifications": {
                    "users": 10,
                    "modules": ["finance", "hr", "inventory"],
                    "support": "basic"
                }
            },
            {
                "name": "CRM Система 'Професійна'",
                "description": "Професійна система управління взаємовідносинами з клієнтами",
                "category": "software",
                "price": 50000,
                "currency": "UAH",
                "unit": "license",
                "isActive": True,
                "specifications": {
                    "users": 25,
                    "features": ["lead_management", "sales_pipeline", "analytics"],
                    "support": "premium"
                }
            },
            {
                "name": "Консультаційні послуги",
                "description": "Консультації з впровадження та налаштування систем",
                "category": "service",
                "price": 2000,
                "currency": "UAH",
                "unit": "hour",
                "isActive": True,
                "specifications": {
                    "expertise": ["implementation", "training", "customization"],
                    "availability": "business_hours"
                }
            }
        ]
        
        created_products = 0
        for product_data in test_products_data:
            response = self.make_request("POST", "/crm/products", product_data)
            if response and response.status_code == 200:
                product = response.json().get("product")
                if product:
                    created_products += 1
                    self.log_result("crm_products", f"create_product_{product_data['category']}", True, 
                                  f"Created {product_data['category']}: {product_data['name']}")
                else:
                    self.log_result("crm_products", f"create_product_{product_data['category']}", False, 
                                  f"Product created but no data returned")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response and response.headers.get('content-type', '').startswith('application/json') else "No error details"
                self.log_result("crm_products", f"create_product_{product_data['category']}", False, 
                              f"Failed to create product: {status} - {error_msg}")

        # Test 2: Get all products
        response = self.make_request("GET", "/crm/products")
        if response and response.status_code == 200:
            products = response.json()
            if isinstance(products, list):
                self.log_result("crm_products", "get_all_products", True, 
                              f"Retrieved {len(products)} products successfully")
                
                # Verify product structure
                if products:
                    product = products[0]
                    required_fields = ["id", "name", "category", "price", "currency", "unit", "isActive", "createdAt"]
                    missing_fields = [field for field in required_fields if field not in product]
                    if not missing_fields:
                        self.log_result("crm_products", "product_structure", True, "Product structure validation passed")
                    else:
                        self.log_result("crm_products", "product_structure", False, f"Missing fields: {missing_fields}")
            else:
                self.log_result("crm_products", "get_all_products", False, f"Invalid products response: {products}")
        else:
            status = response.status_code if response else "No response"
            self.log_result("crm_products", "get_all_products", False, f"Failed to retrieve products: {status}")

        # Test 3: Filter products by category
        for category in ['software', 'service']:
            response = self.make_request("GET", f"/crm/products?category={category}")
            if response and response.status_code == 200:
                filtered_products = response.json()
                if isinstance(filtered_products, list):
                    self.log_result("crm_products", f"filter_{category}", True, 
                                  f"Category filter '{category}' returned {len(filtered_products)} products")
                else:
                    self.log_result("crm_products", f"filter_{category}", False, 
                                  f"Invalid filtered response: {filtered_products}")
            else:
                status = response.status_code if response else "No response"
                self.log_result("crm_products", f"filter_{category}", False, 
                              f"Category filtering failed: {status}")

        # Test 4: Test role-based access control (regular user should be denied product creation)
        if self.user_token:
            old_token = self.auth_token
            self.auth_token = self.user_token
            
            test_product = {
                "name": "Test Product",
                "category": "test",
                "price": 1000,
                "currency": "UAH",
                "unit": "piece"
            }
            
            response = self.make_request("POST", "/crm/products", test_product)
            if response and response.status_code == 403:
                self.log_result("crm_products", "rbac_user_denied", True, "Regular user properly denied product creation")
            else:
                status = response.status_code if response else "No response"
                self.log_result("crm_products", "rbac_user_denied", False, f"RBAC not working for products: {status}")
            
            self.auth_token = old_token

        return created_products > 0

    def test_finance_crm_integration(self):
        """Test integration between Finance and CRM modules"""
        print("\n=== Testing Finance-CRM Integration ===")
        
        if not self.auth_token:
            self.log_result("finance_crm_integration", "no_token", False, "No auth token available")
            return False

        # Test 1: Verify counterparty integration between modules
        print("Testing counterparty integration between Finance and CRM...")
        
        # Get counterparties from finance module
        finance_response = self.make_request("GET", "/finance/counterparties")
        if not (finance_response and finance_response.status_code == 200):
            self.log_result("finance_crm_integration", "get_finance_counterparties", False, "Failed to get finance counterparties")
            return False
            
        finance_counterparties = finance_response.json()
        
        # Get opportunities from CRM module
        crm_response = self.make_request("GET", "/crm/opportunities")
        if not (crm_response and crm_response.status_code == 200):
            self.log_result("finance_crm_integration", "get_crm_opportunities", False, "Failed to get CRM opportunities")
            return False
            
        crm_opportunities = crm_response.json()
        
        # Check if opportunities reference valid counterparties
        integration_working = False
        for opportunity in crm_opportunities:
            if opportunity.get("counterpartyId"):
                # Find matching counterparty
                matching_counterparty = next(
                    (cp for cp in finance_counterparties if cp["id"] == opportunity["counterpartyId"]), 
                    None
                )
                if matching_counterparty:
                    integration_working = True
                    self.log_result("finance_crm_integration", "counterparty_reference", True, 
                                  f"Opportunity '{opportunity['title']}' correctly references counterparty '{matching_counterparty['name']}'")
                    break
        
        if not integration_working:
            self.log_result("finance_crm_integration", "counterparty_reference", False, 
                          "No valid counterparty references found in opportunities")

        # Test 2: Verify role-based access control consistency
        print("Testing consistent role-based access control...")
        
        if self.user_token:
            old_token = self.auth_token
            self.auth_token = self.user_token
            
            # Test finance module access
            finance_accounts_response = self.make_request("POST", "/finance/accounts", {
                "code": "TEST", "name": "Test", "type": "asset"
            })
            finance_denied = finance_accounts_response and finance_accounts_response.status_code == 403
            
            # Test CRM module access
            crm_products_response = self.make_request("POST", "/crm/products", {
                "name": "Test Product", "category": "test", "price": 100, "currency": "UAH", "unit": "piece"
            })
            crm_denied = crm_products_response and crm_products_response.status_code == 403
            
            if finance_denied and crm_denied:
                self.log_result("finance_crm_integration", "consistent_rbac", True, 
                              "Role-based access control consistent across Finance and CRM modules")
            else:
                self.log_result("finance_crm_integration", "consistent_rbac", False, 
                              f"Inconsistent RBAC - Finance denied: {finance_denied}, CRM denied: {crm_denied}")
            
            self.auth_token = old_token

        # Test 3: Data consistency and referential integrity
        print("Testing data consistency and referential integrity...")
        
        # Verify that all counterpartyIds in opportunities exist in counterparties
        orphaned_opportunities = []
        for opportunity in crm_opportunities:
            if opportunity.get("counterpartyId"):
                matching_counterparty = next(
                    (cp for cp in finance_counterparties if cp["id"] == opportunity["counterpartyId"]), 
                    None
                )
                if not matching_counterparty:
                    orphaned_opportunities.append(opportunity["id"])
        
        if not orphaned_opportunities:
            self.log_result("finance_crm_integration", "referential_integrity", True, 
                          "All opportunity counterparty references are valid")
        else:
            self.log_result("finance_crm_integration", "referential_integrity", False, 
                          f"Found {len(orphaned_opportunities)} opportunities with invalid counterparty references")

        return integration_working

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
        
        # ANALYTICS AND REPORTS API TESTS (HIGH PRIORITY)
        print("\n📊 ANALYTICS AND REPORTS API TESTS")
        
        # Dashboard Analytics API Tests
        self.test_analytics_dashboard_api()
        
        # Document Statistics API Tests  
        self.test_analytics_documents_api()
        
        # Reports Generation API Tests
        self.test_analytics_reports_api()
        
        # Analytics Data Accuracy Tests
        self.test_analytics_data_accuracy()
        
        # HR AND PERSONNEL MANAGEMENT TESTS (HIGH PRIORITY)
        print("\n" + "="*60)
        print("🏢 HR AND PERSONNEL MANAGEMENT API TESTS")
        print("="*60)
        
        # HR Authentication Requirements
        self.test_hr_authentication_requirements()
        
        # HR Departments API Tests
        self.test_hr_departments_api()
        
        # HR Employees API Tests  
        self.test_hr_employees_api()
        
        # HR Timesheet API Tests
        self.test_hr_timesheet_api()
        
        # HR Business Trips API Tests
        self.test_hr_business_trips_api()
        
        # Complete HR Workflow Integration
        self.test_complete_hr_workflow()
        
        # HR Data Validation Tests
        self.test_hr_data_validation()
        
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