#!/usr/bin/env python3
"""
Nova Poshta SSO Authentication System Backend Testing
Tests all SSO endpoints with proper authentication flow and role-based access control
"""

import requests
import json
import time
import os
from datetime import datetime

# Configuration
BASE_URL = "https://tys-kis-erp.preview.emergentagent.com"
SSO_BASE = f"{BASE_URL}/api/sso"

# Test credentials from Nova Poshta initialization
TEST_CREDENTIALS = {
    "admin": {
        "email": "admin@novaposhta.ua",
        "password": "NovaPoshtaAdmin2025!",
        "expected_role": "admin",
        "expected_access_level": "admin"
    },
    "hr_manager": {
        "email": "hr@novaposhta.ua", 
        "password": "NovaPoshtaHR2025!",
        "expected_role": "hr_manager",
        "expected_access_level": "branch"
    },
    "warehouse_manager": {
        "email": "warehouse@novaposhta.ua",
        "password": "NovaPoshtaWH2025!",
        "expected_role": "warehouse_manager", 
        "expected_access_level": "warehouse"
    },
    "courier": {
        "email": "courier@novaposhta.ua",
        "password": "NovaPoshta2025!",
        "expected_role": "courier",
        "expected_access_level": "basic"
    }
}

class NovaPoshtaSSOTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.headers.update({
            'Content-Type': 'application/json',
            'User-Agent': 'Nova-Poshta-SSO-Tester/1.0'
        })
        self.tokens = {}
        self.test_results = []
        
    def log_test(self, test_name, success, details="", error=""):
        """Log test results"""
        result = {
            "test": test_name,
            "success": success,
            "details": details,
            "error": error,
            "timestamp": datetime.now().isoformat()
        }
        self.test_results.append(result)
        
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name}")
        if details:
            print(f"   Details: {details}")
        if error:
            print(f"   Error: {error}")
        print()

    def test_system_initialization(self):
        """Test SSO system initialization"""
        print("🔧 Testing Nova Poshta SSO System Initialization...")
        
        try:
            # Test GET /api/sso/init
            response = self.session.get(f"{SSO_BASE}/init")
            
            if response.status_code == 200:
                data = response.json()
                if data.get('success') and 'users' in data:
                    users = data['users']
                    expected_users = ['admin@novaposhta.ua', 'hr@novaposhta.ua', 'warehouse@novaposhta.ua', 'courier@novaposhta.ua']
                    found_users = [user['email'] for user in users]
                    
                    if all(email in found_users for email in expected_users):
                        self.log_test(
                            "SSO System Initialization", 
                            True, 
                            f"System initialized with {len(users)} demo users: {', '.join(found_users)}"
                        )
                        return True
                    else:
                        self.log_test(
                            "SSO System Initialization", 
                            False, 
                            f"Missing expected users. Found: {found_users}"
                        )
                else:
                    self.log_test("SSO System Initialization", False, f"Invalid response structure: {data}")
            elif response.status_code == 403:
                # Expected in production mode
                self.log_test(
                    "SSO System Initialization", 
                    True, 
                    "Initialization blocked in production mode (expected behavior)"
                )
                return True
            else:
                self.log_test(
                    "SSO System Initialization", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test("SSO System Initialization", False, error=str(e))
            
        return False

    def test_sso_authentication(self, user_type, credentials):
        """Test SSO authentication for a specific user type"""
        print(f"🔐 Testing SSO Authentication for {user_type}...")
        
        try:
            # Test POST /api/sso/auth - Login
            login_data = {
                "email": credentials["email"],
                "password": credentials["password"],
                "tenantSlug": "nova-poshta"
            }
            
            response = self.session.post(f"{SSO_BASE}/auth", json=login_data)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success') and 'user' in data and 'tenant' in data:
                    user = data['user']
                    tenant = data['tenant']
                    
                    # Verify user data structure
                    required_fields = ['id', 'email', 'fullName', 'firstName', 'lastName', 'roles', 'accessLevel', 'tenantId']
                    missing_fields = [field for field in required_fields if field not in user]
                    
                    if missing_fields:
                        self.log_test(
                            f"SSO Login - {user_type}", 
                            False, 
                            f"Missing user fields: {missing_fields}"
                        )
                        return False
                    
                    # Verify role and access level
                    user_roles = user.get('roles', [])
                    user_access_level = user.get('accessLevel')
                    
                    expected_role = credentials["expected_role"]
                    expected_access_level = credentials["expected_access_level"]
                    
                    if expected_role not in user_roles:
                        self.log_test(
                            f"SSO Login - {user_type}", 
                            False, 
                            f"Expected role '{expected_role}' not found in user roles: {user_roles}"
                        )
                        return False
                    
                    if user_access_level != expected_access_level:
                        self.log_test(
                            f"SSO Login - {user_type}", 
                            False, 
                            f"Expected access level '{expected_access_level}', got '{user_access_level}'"
                        )
                        return False
                    
                    # Verify tenant data
                    if tenant.get('slug') != 'nova-poshta':
                        self.log_test(
                            f"SSO Login - {user_type}", 
                            False, 
                            f"Expected tenant slug 'nova-poshta', got '{tenant.get('slug')}'"
                        )
                        return False
                    
                    # Store cookies for subsequent requests
                    self.tokens[user_type] = {
                        'cookies': response.cookies,
                        'user': user,
                        'tenant': tenant
                    }
                    
                    self.log_test(
                        f"SSO Login - {user_type}", 
                        True, 
                        f"User: {user['fullName']}, Role: {user_roles}, Access: {user_access_level}, Tenant: {tenant['name']}"
                    )
                    return True
                else:
                    self.log_test(
                        f"SSO Login - {user_type}", 
                        False, 
                        f"Invalid response structure: {data}"
                    )
            else:
                self.log_test(
                    f"SSO Login - {user_type}", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test(f"SSO Login - {user_type}", False, error=str(e))
            
        return False

    def test_token_verification(self, user_type):
        """Test GET /api/sso/auth - Token verification"""
        print(f"🔍 Testing Token Verification for {user_type}...")
        
        if user_type not in self.tokens:
            self.log_test(f"Token Verification - {user_type}", False, "No token available for user")
            return False
            
        try:
            # Use cookies from login
            cookies = self.tokens[user_type]['cookies']
            response = self.session.get(f"{SSO_BASE}/auth", cookies=cookies)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success') and 'user' in data:
                    user = data['user']
                    original_user = self.tokens[user_type]['user']
                    
                    # Verify user data consistency
                    if user['id'] == original_user['id'] and user['email'] == original_user['email']:
                        self.log_test(
                            f"Token Verification - {user_type}", 
                            True, 
                            f"Token valid for user: {user['fullName']} ({user['email']})"
                        )
                        return True
                    else:
                        self.log_test(
                            f"Token Verification - {user_type}", 
                            False, 
                            "User data mismatch between login and verification"
                        )
                else:
                    self.log_test(
                        f"Token Verification - {user_type}", 
                        False, 
                        f"Invalid response structure: {data}"
                    )
            else:
                self.log_test(
                    f"Token Verification - {user_type}", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test(f"Token Verification - {user_type}", False, error=str(e))
            
        return False

    def test_hr_dashboard_access(self, user_type):
        """Test GET /api/sso/hr - HR dashboard access"""
        print(f"👥 Testing HR Dashboard Access for {user_type}...")
        
        if user_type not in self.tokens:
            self.log_test(f"HR Dashboard Access - {user_type}", False, "No token available for user")
            return False
            
        try:
            cookies = self.tokens[user_type]['cookies']
            response = self.session.get(f"{SSO_BASE}/hr?action=dashboard", cookies=cookies)
            
            user_roles = self.tokens[user_type]['user']['roles']
            user_access_level = self.tokens[user_type]['user']['accessLevel']
            
            # Check if user should have access
            should_have_access = ('hr_manager' in user_roles or 'admin' in user_roles or 
                                user_access_level in ['branch', 'regional', 'admin'])
            
            if should_have_access:
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and 'data' in data:
                        dashboard_data = data['data']
                        required_fields = ['totalEmployees', 'newEmployeesThisMonth', 'employeesByDepartment', 'employeesByAccessLevel']
                        
                        if all(field in dashboard_data for field in required_fields):
                            self.log_test(
                                f"HR Dashboard Access - {user_type}", 
                                True, 
                                f"Dashboard data: {dashboard_data['totalEmployees']} employees, {len(dashboard_data['employeesByDepartment'])} departments"
                            )
                            return True
                        else:
                            self.log_test(
                                f"HR Dashboard Access - {user_type}", 
                                False, 
                                f"Missing dashboard fields: {dashboard_data}"
                            )
                    else:
                        self.log_test(
                            f"HR Dashboard Access - {user_type}", 
                            False, 
                            f"Invalid response structure: {data}"
                        )
                else:
                    self.log_test(
                        f"HR Dashboard Access - {user_type}", 
                        False, 
                        f"HTTP {response.status_code}: {response.text}"
                    )
            else:
                # User should not have access
                if response.status_code == 403:
                    self.log_test(
                        f"HR Dashboard Access - {user_type}", 
                        True, 
                        "Access correctly denied (403 Forbidden)"
                    )
                    return True
                else:
                    self.log_test(
                        f"HR Dashboard Access - {user_type}", 
                        False, 
                        f"Expected 403 Forbidden, got HTTP {response.status_code}"
                    )
                    
        except Exception as e:
            self.log_test(f"HR Dashboard Access - {user_type}", False, error=str(e))
            
        return False

    def test_hr_employees_list(self, user_type):
        """Test GET /api/sso/hr?action=employees - Employee listing"""
        print(f"📋 Testing HR Employee Listing for {user_type}...")
        
        if user_type not in self.tokens:
            self.log_test(f"HR Employee Listing - {user_type}", False, "No token available for user")
            return False
            
        try:
            cookies = self.tokens[user_type]['cookies']
            response = self.session.get(f"{SSO_BASE}/hr?action=employees&page=1&limit=10", cookies=cookies)
            
            user_roles = self.tokens[user_type]['user']['roles']
            user_access_level = self.tokens[user_type]['user']['accessLevel']
            
            # Check if user should have access
            should_have_access = ('hr_manager' in user_roles or 'admin' in user_roles or 
                                user_access_level in ['branch', 'regional', 'admin'])
            
            if should_have_access:
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and 'data' in data:
                        employees_data = data['data']
                        
                        if 'employees' in employees_data and 'pagination' in employees_data:
                            employees = employees_data['employees']
                            pagination = employees_data['pagination']
                            
                            self.log_test(
                                f"HR Employee Listing - {user_type}", 
                                True, 
                                f"Retrieved {len(employees)} employees, total: {pagination.get('total', 0)}"
                            )
                            return True
                        else:
                            self.log_test(
                                f"HR Employee Listing - {user_type}", 
                                False, 
                                f"Missing employees or pagination data: {employees_data}"
                            )
                    else:
                        self.log_test(
                            f"HR Employee Listing - {user_type}", 
                            False, 
                            f"Invalid response structure: {data}"
                        )
                else:
                    self.log_test(
                        f"HR Employee Listing - {user_type}", 
                        False, 
                        f"HTTP {response.status_code}: {response.text}"
                    )
            else:
                # User should not have access
                if response.status_code == 403:
                    self.log_test(
                        f"HR Employee Listing - {user_type}", 
                        True, 
                        "Access correctly denied (403 Forbidden)"
                    )
                    return True
                else:
                    self.log_test(
                        f"HR Employee Listing - {user_type}", 
                        False, 
                        f"Expected 403 Forbidden, got HTTP {response.status_code}"
                    )
                    
        except Exception as e:
            self.log_test(f"HR Employee Listing - {user_type}", False, error=str(e))
            
        return False

    def test_hr_departments_list(self, user_type):
        """Test GET /api/sso/hr?action=departments - Department listing"""
        print(f"🏢 Testing HR Department Listing for {user_type}...")
        
        if user_type not in self.tokens:
            self.log_test(f"HR Department Listing - {user_type}", False, "No token available for user")
            return False
            
        try:
            cookies = self.tokens[user_type]['cookies']
            response = self.session.get(f"{SSO_BASE}/hr?action=departments", cookies=cookies)
            
            user_roles = self.tokens[user_type]['user']['roles']
            user_access_level = self.tokens[user_type]['user']['accessLevel']
            
            # Check if user should have access
            should_have_access = ('hr_manager' in user_roles or 'admin' in user_roles or 
                                user_access_level in ['branch', 'regional', 'admin'])
            
            if should_have_access:
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and 'data' in data:
                        departments_data = data['data']
                        
                        if 'departments' in departments_data:
                            departments = departments_data['departments']
                            
                            self.log_test(
                                f"HR Department Listing - {user_type}", 
                                True, 
                                f"Retrieved {len(departments)} departments: {', '.join(departments) if departments else 'None'}"
                            )
                            return True
                        else:
                            self.log_test(
                                f"HR Department Listing - {user_type}", 
                                False, 
                                f"Missing departments data: {departments_data}"
                            )
                    else:
                        self.log_test(
                            f"HR Department Listing - {user_type}", 
                            False, 
                            f"Invalid response structure: {data}"
                        )
                else:
                    self.log_test(
                        f"HR Department Listing - {user_type}", 
                        False, 
                        f"HTTP {response.status_code}: {response.text}"
                    )
            else:
                # User should not have access
                if response.status_code == 403:
                    self.log_test(
                        f"HR Department Listing - {user_type}", 
                        True, 
                        "Access correctly denied (403 Forbidden)"
                    )
                    return True
                else:
                    self.log_test(
                        f"HR Department Listing - {user_type}", 
                        False, 
                        f"Expected 403 Forbidden, got HTTP {response.status_code}"
                    )
                    
        except Exception as e:
            self.log_test(f"HR Department Listing - {user_type}", False, error=str(e))
            
        return False

    def test_hr_employee_creation(self, user_type):
        """Test POST /api/sso/hr - Employee creation"""
        print(f"➕ Testing HR Employee Creation for {user_type}...")
        
        if user_type not in self.tokens:
            self.log_test(f"HR Employee Creation - {user_type}", False, "No token available for user")
            return False
            
        try:
            cookies = self.tokens[user_type]['cookies']
            
            # Test employee data
            employee_data = {
                "action": "create",
                "employeeData": {
                    "firstName": "Тест",
                    "lastName": "Користувач",
                    "email": f"test.user.{int(time.time())}@novaposhta.ua",
                    "department": "IT",
                    "position": "Тестовий співробітник",
                    "accessLevel": "basic",
                    "roles": ["employee"],
                    "employeeId": f"NP-TEST-{int(time.time())}",
                    "workLocation": "Тестове відділення"
                }
            }
            
            response = self.session.post(f"{SSO_BASE}/hr", json=employee_data, cookies=cookies)
            
            user_roles = self.tokens[user_type]['user']['roles']
            
            # Check if user should have access (only HR managers and admins)
            should_have_access = ('hr_manager' in user_roles or 'admin' in user_roles)
            
            if should_have_access:
                if response.status_code == 200:
                    data = response.json()
                    if data.get('success') and 'data' in data:
                        employee_info = data['data']
                        
                        if 'employee' in employee_info:
                            created_employee = employee_info['employee']
                            
                            self.log_test(
                                f"HR Employee Creation - {user_type}", 
                                True, 
                                f"Created employee: {created_employee['fullName']} ({created_employee['email']})"
                            )
                            return True
                        else:
                            self.log_test(
                                f"HR Employee Creation - {user_type}", 
                                False, 
                                f"Missing employee data: {employee_info}"
                            )
                    else:
                        self.log_test(
                            f"HR Employee Creation - {user_type}", 
                            False, 
                            f"Invalid response structure: {data}"
                        )
                else:
                    self.log_test(
                        f"HR Employee Creation - {user_type}", 
                        False, 
                        f"HTTP {response.status_code}: {response.text}"
                    )
            else:
                # User should not have access
                if response.status_code == 403:
                    self.log_test(
                        f"HR Employee Creation - {user_type}", 
                        True, 
                        "Access correctly denied (403 Forbidden)"
                    )
                    return True
                else:
                    self.log_test(
                        f"HR Employee Creation - {user_type}", 
                        False, 
                        f"Expected 403 Forbidden, got HTTP {response.status_code}"
                    )
                    
        except Exception as e:
            self.log_test(f"HR Employee Creation - {user_type}", False, error=str(e))
            
        return False

    def test_sso_logout(self, user_type):
        """Test DELETE /api/sso/auth - Logout"""
        print(f"🚪 Testing SSO Logout for {user_type}...")
        
        if user_type not in self.tokens:
            self.log_test(f"SSO Logout - {user_type}", False, "No token available for user")
            return False
            
        try:
            cookies = self.tokens[user_type]['cookies']
            response = self.session.delete(f"{SSO_BASE}/auth", cookies=cookies)
            
            if response.status_code == 200:
                data = response.json()
                
                if data.get('success'):
                    # Verify that token is now invalid
                    verify_response = self.session.get(f"{SSO_BASE}/auth", cookies=cookies)
                    
                    if verify_response.status_code == 401:
                        self.log_test(
                            f"SSO Logout - {user_type}", 
                            True, 
                            "Logout successful, token invalidated"
                        )
                        
                        # Clear stored token
                        del self.tokens[user_type]
                        return True
                    else:
                        self.log_test(
                            f"SSO Logout - {user_type}", 
                            False, 
                            f"Token still valid after logout (HTTP {verify_response.status_code})"
                        )
                else:
                    self.log_test(
                        f"SSO Logout - {user_type}", 
                        False, 
                        f"Logout failed: {data}"
                    )
            else:
                self.log_test(
                    f"SSO Logout - {user_type}", 
                    False, 
                    f"HTTP {response.status_code}: {response.text}"
                )
                
        except Exception as e:
            self.log_test(f"SSO Logout - {user_type}", False, error=str(e))
            
        return False

    def test_password_policy_enforcement(self):
        """Test password policy enforcement"""
        print("🔒 Testing Password Policy Enforcement...")
        
        try:
            # Try to login with wrong password (should fail)
            wrong_login_data = {
                "email": "admin@novaposhta.ua",
                "password": "WrongPassword123!",
                "tenantSlug": "nova-poshta"
            }
            
            response = self.session.post(f"{SSO_BASE}/auth", json=wrong_login_data)
            
            if response.status_code == 401:
                self.log_test(
                    "Password Policy Enforcement", 
                    True, 
                    "Wrong password correctly rejected"
                )
                return True
            else:
                self.log_test(
                    "Password Policy Enforcement", 
                    False, 
                    f"Expected 401 for wrong password, got HTTP {response.status_code}"
                )
                    
        except Exception as e:
            self.log_test("Password Policy Enforcement", False, error=str(e))
            
        return False

    def test_account_lockout(self):
        """Test account lockout after failed attempts"""
        print("🔐 Testing Account Lockout Policy...")
        
        try:
            # Make multiple failed login attempts
            failed_attempts = 0
            max_attempts = 6  # Should trigger lockout
            
            for attempt in range(max_attempts):
                wrong_login_data = {
                    "email": "courier@novaposhta.ua",
                    "password": f"WrongPassword{attempt}!",
                    "tenantSlug": "nova-poshta"
                }
                
                response = self.session.post(f"{SSO_BASE}/auth", json=wrong_login_data)
                
                if response.status_code == 401:
                    failed_attempts += 1
                    
                    # Check if account is locked
                    if "заблоковано" in response.text or "locked" in response.text.lower():
                        self.log_test(
                            "Account Lockout Policy", 
                            True, 
                            f"Account locked after {failed_attempts} failed attempts"
                        )
                        return True
                        
                time.sleep(0.5)  # Small delay between attempts
            
            # If we get here, account wasn't locked
            self.log_test(
                "Account Lockout Policy", 
                False, 
                f"Account not locked after {failed_attempts} failed attempts"
            )
            
        except Exception as e:
            self.log_test("Account Lockout Policy", False, error=str(e))
            
        return False

    def run_comprehensive_test(self):
        """Run comprehensive Nova Poshta SSO test suite"""
        print("🚀 Starting Nova Poshta SSO Authentication System Testing")
        print("=" * 70)
        
        # Test 1: System Initialization
        self.test_system_initialization()
        
        # Test 2: Authentication for all user types
        for user_type, credentials in TEST_CREDENTIALS.items():
            self.test_sso_authentication(user_type, credentials)
            
        # Test 3: Token verification for authenticated users
        for user_type in self.tokens.keys():
            self.test_token_verification(user_type)
            
        # Test 4: HR Dashboard access (role-based)
        for user_type in TEST_CREDENTIALS.keys():
            self.test_hr_dashboard_access(user_type)
            
        # Test 5: HR Employee listing (role-based)
        for user_type in TEST_CREDENTIALS.keys():
            self.test_hr_employees_list(user_type)
            
        # Test 6: HR Department listing (role-based)
        for user_type in TEST_CREDENTIALS.keys():
            self.test_hr_departments_list(user_type)
            
        # Test 7: HR Employee creation (admin/hr_manager only)
        for user_type in TEST_CREDENTIALS.keys():
            self.test_hr_employee_creation(user_type)
            
        # Test 8: Security policies
        self.test_password_policy_enforcement()
        self.test_account_lockout()
        
        # Test 9: Logout for all authenticated users
        for user_type in list(self.tokens.keys()):
            self.test_sso_logout(user_type)
        
        # Generate summary
        self.generate_test_summary()

    def generate_test_summary(self):
        """Generate comprehensive test summary"""
        print("\n" + "=" * 70)
        print("📊 NOVA POSHTA SSO TESTING SUMMARY")
        print("=" * 70)
        
        total_tests = len(self.test_results)
        passed_tests = sum(1 for result in self.test_results if result['success'])
        failed_tests = total_tests - passed_tests
        
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests} ✅")
        print(f"Failed: {failed_tests} ❌")
        print(f"Pass Rate: {pass_rate:.1f}%")
        print()
        
        # Group results by category
        categories = {}
        for result in self.test_results:
            category = result['test'].split(' - ')[0] if ' - ' in result['test'] else result['test']
            if category not in categories:
                categories[category] = {'passed': 0, 'failed': 0, 'tests': []}
            
            if result['success']:
                categories[category]['passed'] += 1
            else:
                categories[category]['failed'] += 1
            categories[category]['tests'].append(result)
        
        # Print category summaries
        for category, stats in categories.items():
            total = stats['passed'] + stats['failed']
            rate = (stats['passed'] / total * 100) if total > 0 else 0
            status = "✅" if stats['failed'] == 0 else "⚠️" if rate >= 50 else "❌"
            
            print(f"{status} {category}: {stats['passed']}/{total} ({rate:.1f}%)")
        
        print()
        
        # Print failed tests details
        if failed_tests > 0:
            print("❌ FAILED TESTS:")
            for result in self.test_results:
                if not result['success']:
                    print(f"   • {result['test']}")
                    if result['error']:
                        print(f"     Error: {result['error']}")
            print()
        
        # Overall assessment
        if pass_rate >= 90:
            print("🎉 EXCELLENT: Nova Poshta SSO system is working excellently!")
        elif pass_rate >= 75:
            print("✅ GOOD: Nova Poshta SSO system is working well with minor issues.")
        elif pass_rate >= 50:
            print("⚠️ NEEDS ATTENTION: Nova Poshta SSO system has significant issues.")
        else:
            print("❌ CRITICAL: Nova Poshta SSO system has major problems.")
        
        print("=" * 70)

if __name__ == "__main__":
    tester = NovaPoshtaSSOTester()
    tester.run_comprehensive_test()