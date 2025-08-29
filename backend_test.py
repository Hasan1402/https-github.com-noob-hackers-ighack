#!/usr/bin/env python3
"""
Comprehensive Backend API Tests for ТИС КІС System
Tests all authentication, user management, document management, and dashboard endpoints
"""

import requests
import json
import os
import tempfile
from datetime import datetime

# Get base URL from environment - use production URL
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
            "summary": {"passed": 0, "failed": 0, "errors": []}
        }
        self.test_document_id = None
        self.manager_token = None
        self.user_token = None

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

    def run_all_tests(self):
        """Run all backend tests in priority order"""
        print(f"\n🚀 Starting ТИС КІС Backend API Tests")
        print(f"Base URL: {self.base_url}")
        print("=" * 60)
        
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
        
        # MEDIUM PRIORITY TESTS
        print("\n📊 MEDIUM PRIORITY TESTS")
        
        # Document Management Tests
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