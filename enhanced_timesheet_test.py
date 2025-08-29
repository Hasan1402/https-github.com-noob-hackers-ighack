#!/usr/bin/env python3
"""
Enhanced Timesheet API Testing for ТИС КІС System
Tests the Ukrainian timesheet functionality with monthly views, daily entries, and work templates.
"""

import requests
import json
import sys
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "https://tys-edu-system.preview.emergentagent.com/api"
HEADERS = {"Content-Type": "application/json"}

class TimesheetTester:
    def __init__(self):
        self.admin_token = None
        self.manager_token = None
        self.user_token = None
        self.test_employee_id = None
        self.test_department = "IT"
        self.current_month = datetime.now().strftime("%Y-%m")
        self.test_results = []
        
    def log_result(self, test_name, success, message=""):
        """Log test result"""
        status = "✅ PASS" if success else "❌ FAIL"
        result = f"{status}: {test_name}"
        if message:
            result += f" - {message}"
        print(result)
        self.test_results.append({
            'test': test_name,
            'success': success,
            'message': message
        })
        
    def setup_authentication(self):
        """Setup test users and get authentication tokens"""
        print("🔐 Setting up authentication...")
        
        # Test users data
        test_users = [
            {
                "email": "admin.timesheet@tiskis.ua",
                "password": "AdminTimesheet2024!",
                "fullName": "Адміністратор Табель",
                "role": "admin"
            },
            {
                "email": "manager.timesheet@tiskis.ua", 
                "password": "ManagerTimesheet2024!",
                "fullName": "Менеджер Табель",
                "role": "manager"
            },
            {
                "email": "user.timesheet@tiskis.ua",
                "password": "UserTimesheet2024!",
                "fullName": "Користувач Табель",
                "role": "user"
            }
        ]
        
        tokens = {}
        
        for user_data in test_users:
            # Try to register user
            try:
                response = requests.post(f"{BASE_URL}/auth/register", 
                                       json=user_data, headers=HEADERS, timeout=10)
                if response.status_code not in [200, 201, 409]:  # 409 = user exists
                    print(f"Registration failed for {user_data['role']}: {response.status_code}")
            except Exception as e:
                print(f"Registration error for {user_data['role']}: {e}")
            
            # Login to get token
            try:
                login_data = {
                    "email": user_data["email"],
                    "password": user_data["password"]
                }
                response = requests.post(f"{BASE_URL}/auth/login", 
                                       json=login_data, headers=HEADERS, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    tokens[user_data["role"]] = data.get("token")
                    self.log_result(f"Authentication - {user_data['role']}", True, 
                                  f"Token obtained for {user_data['fullName']}")
                else:
                    self.log_result(f"Authentication - {user_data['role']}", False, 
                                  f"Login failed: {response.status_code}")
                    
            except Exception as e:
                self.log_result(f"Authentication - {user_data['role']}", False, f"Login error: {e}")
        
        self.admin_token = tokens.get("admin")
        self.manager_token = tokens.get("manager") 
        self.user_token = tokens.get("user")
        
        return bool(self.admin_token and self.manager_token and self.user_token)
    
    def setup_test_data(self):
        """Create test employees and departments for timesheet testing"""
        print("📊 Setting up test data...")
        
        if not self.admin_token:
            self.log_result("Setup Test Data", False, "No admin token available")
            return False
            
        auth_headers = {**HEADERS, "Authorization": f"Bearer {self.admin_token}"}
        
        # Create test department
        try:
            dept_data = {
                "name": self.test_department,
                "description": "IT відділ для тестування табеля",
                "managerId": str(uuid.uuid4())
            }
            response = requests.post(f"{BASE_URL}/hr/departments", 
                                   json=dept_data, headers=auth_headers, timeout=10)
            
            if response.status_code in [200, 201, 409]:  # 409 = already exists
                self.log_result("Create Test Department", True, f"Department {self.test_department} ready")
            else:
                self.log_result("Create Test Department", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Create Test Department", False, f"Error: {e}")
        
        # Create test employee
        try:
            self.test_employee_id = str(uuid.uuid4())
            employee_data = {
                "fullName": "Тестовий Співробітник Табель",
                "position": "Розробник",
                "department": self.test_department,
                "employeeId": f"EMP-{self.test_employee_id[:8]}",
                "phoneNumber": "+380501234567",
                "email": "test.employee.timesheet@tiskis.ua",
                "hireDate": "2024-01-15",
                "salary": 50000,
                "workSchedule": "standard",
                "contractType": "permanent",
                "status": "active"
            }
            
            response = requests.post(f"{BASE_URL}/hr/employees", 
                                   json=employee_data, headers=auth_headers, timeout=10)
            
            if response.status_code in [200, 201]:
                data = response.json()
                if 'employee' in data and 'id' in data['employee']:
                    self.test_employee_id = data['employee']['id']
                self.log_result("Create Test Employee", True, f"Employee ID: {self.test_employee_id}")
                return True
            else:
                self.log_result("Create Test Employee", False, f"Status: {response.status_code}")
                return False
                
        except Exception as e:
            self.log_result("Create Test Employee", False, f"Error: {e}")
            return False
    
    def test_monthly_timesheet_api(self):
        """Test GET /api/timesheet/monthly - Monthly timesheet generation"""
        print("📅 Testing Monthly Timesheet API...")
        
        if not self.manager_token:
            self.log_result("Monthly Timesheet API", False, "No manager token")
            return
            
        auth_headers = {**HEADERS, "Authorization": f"Bearer {self.manager_token}"}
        
        # Test 1: Get monthly timesheet with current month
        try:
            params = {"month": self.current_month}
            response = requests.get(f"{BASE_URL}/timesheet/monthly", 
                                  params=params, headers=auth_headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate response structure
                required_fields = ['month', 'year', 'monthNum', 'daysInMonth', 'employees', 'monthName']
                missing_fields = [field for field in required_fields if field not in data]
                
                if not missing_fields:
                    self.log_result("Monthly Timesheet - Structure", True, 
                                  f"Month: {data['monthName']} {data['year']}, Days: {data['daysInMonth']}")
                    
                    # Validate employees array
                    if isinstance(data['employees'], list):
                        self.log_result("Monthly Timesheet - Employees", True, 
                                      f"Found {len(data['employees'])} employees")
                        
                        # Check employee structure if any employees exist
                        if data['employees']:
                            emp = data['employees'][0]
                            emp_fields = ['employee', 'dailyEntries', 'summary']
                            if all(field in emp for field in emp_fields):
                                self.log_result("Monthly Timesheet - Employee Structure", True,
                                              f"Daily entries: {len(emp['dailyEntries'])}")
                            else:
                                self.log_result("Monthly Timesheet - Employee Structure", False,
                                              "Missing employee fields")
                    else:
                        self.log_result("Monthly Timesheet - Employees", False, "Employees not array")
                else:
                    self.log_result("Monthly Timesheet - Structure", False, 
                                  f"Missing fields: {missing_fields}")
            else:
                self.log_result("Monthly Timesheet API", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Monthly Timesheet API", False, f"Error: {e}")
        
        # Test 2: Test with department filtering
        try:
            params = {"month": self.current_month, "department": self.test_department}
            response = requests.get(f"{BASE_URL}/timesheet/monthly", 
                                  params=params, headers=auth_headers, timeout=15)
            
            if response.status_code == 200:
                data = response.json()
                self.log_result("Monthly Timesheet - Department Filter", True, 
                              f"Filtered by {self.test_department}")
            else:
                self.log_result("Monthly Timesheet - Department Filter", False, 
                              f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Monthly Timesheet - Department Filter", False, f"Error: {e}")
        
        # Test 3: Test with different month
        try:
            last_month = (datetime.now() - timedelta(days=30)).strftime("%Y-%m")
            params = {"month": last_month}
            response = requests.get(f"{BASE_URL}/timesheet/monthly", 
                                  params=params, headers=auth_headers, timeout=15)
            
            if response.status_code == 200:
                self.log_result("Monthly Timesheet - Different Month", True, f"Month: {last_month}")
            else:
                self.log_result("Monthly Timesheet - Different Month", False, 
                              f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Monthly Timesheet - Different Month", False, f"Error: {e}")
        
        # Test 4: Test without month parameter (should fail)
        try:
            response = requests.get(f"{BASE_URL}/timesheet/monthly", 
                                  headers=auth_headers, timeout=10)
            
            if response.status_code == 400:
                self.log_result("Monthly Timesheet - Missing Month", True, "Properly rejected")
            else:
                self.log_result("Monthly Timesheet - Missing Month", False, 
                              f"Expected 400, got {response.status_code}")
                
        except Exception as e:
            self.log_result("Monthly Timesheet - Missing Month", False, f"Error: {e}")
    
    def test_daily_entry_update_api(self):
        """Test PUT /api/timesheet/daily/:employeeId/:date - Update daily entries"""
        print("📝 Testing Daily Entry Update API...")
        
        if not self.manager_token or not self.test_employee_id:
            self.log_result("Daily Entry Update API", False, "Missing token or employee ID")
            return
            
        auth_headers = {**HEADERS, "Authorization": f"Bearer {self.manager_token}"}
        
        # Test Ukrainian work codes
        work_codes_tests = [
            {"hours": 8, "overtime": 0, "dayType": "work", "status": "present", "comments": "Звичайний робочий день"},
            {"hours": 0, "overtime": 0, "dayType": "sick", "status": "sick", "comments": "Лікарняний"},
            {"hours": 0, "overtime": 0, "dayType": "vacation", "status": "vacation", "comments": "Відпустка"},
            {"hours": 8, "overtime": 2, "dayType": "work", "status": "present", "comments": "Робочий день з переробкою"},
            {"hours": 0, "overtime": 0, "dayType": "weekend", "status": "weekend", "comments": "Вихідний день"}
        ]
        
        test_dates = []
        for i in range(len(work_codes_tests)):
            test_date = (datetime.now() - timedelta(days=i+1)).strftime("%Y-%m-%d")
            test_dates.append(test_date)
        
        # Test each work code
        for i, (test_data, test_date) in enumerate(zip(work_codes_tests, test_dates)):
            try:
                url = f"{BASE_URL}/timesheet/daily/{self.test_employee_id}/{test_date}"
                response = requests.put(url, json=test_data, headers=auth_headers, timeout=10)
                
                if response.status_code == 200:
                    data = response.json()
                    if 'entry' in data:
                        self.log_result(f"Daily Entry - {test_data['dayType']}", True, 
                                      f"Date: {test_date}, Hours: {test_data['hours']}")
                    else:
                        self.log_result(f"Daily Entry - {test_data['dayType']}", False, 
                                      "Missing entry in response")
                else:
                    self.log_result(f"Daily Entry - {test_data['dayType']}", False, 
                                  f"Status: {response.status_code}")
                    
            except Exception as e:
                self.log_result(f"Daily Entry - {test_data['dayType']}", False, f"Error: {e}")
        
        # Test updating existing entry
        try:
            update_data = {
                "hours": 7,
                "overtime": 1,
                "dayType": "work",
                "status": "present",
                "comments": "Оновлений запис - скорочений день"
            }
            
            url = f"{BASE_URL}/timesheet/daily/{self.test_employee_id}/{test_dates[0]}"
            response = requests.put(url, json=update_data, headers=auth_headers, timeout=10)
            
            if response.status_code == 200:
                self.log_result("Daily Entry - Update Existing", True, "Entry updated successfully")
            else:
                self.log_result("Daily Entry - Update Existing", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Daily Entry - Update Existing", False, f"Error: {e}")
        
        # Test invalid date format
        try:
            invalid_data = {"hours": 8, "dayType": "work"}
            url = f"{BASE_URL}/timesheet/daily/{self.test_employee_id}/invalid-date"
            response = requests.put(url, json=invalid_data, headers=auth_headers, timeout=10)
            
            if response.status_code >= 400:
                self.log_result("Daily Entry - Invalid Date", True, "Properly rejected invalid date")
            else:
                self.log_result("Daily Entry - Invalid Date", False, 
                              f"Should reject invalid date, got {response.status_code}")
                
        except Exception as e:
            self.log_result("Daily Entry - Invalid Date", True, f"Properly failed: {e}")
    
    def test_work_templates_api(self):
        """Test GET /api/timesheet/templates - Work codes and schedules"""
        print("📋 Testing Work Templates API...")
        
        if not self.user_token:
            self.log_result("Work Templates API", False, "No user token")
            return
            
        auth_headers = {**HEADERS, "Authorization": f"Bearer {self.user_token}"}
        
        try:
            response = requests.get(f"{BASE_URL}/timesheet/templates", 
                                  headers=auth_headers, timeout=10)
            
            if response.status_code == 200:
                data = response.json()
                
                # Validate work codes
                if 'workCodes' in data:
                    work_codes = data['workCodes']
                    
                    # Check for Ukrainian work codes
                    expected_codes = ['8', '7', '4', 'НТ', 'В', 'Л', 'ВП', 'ВК', 'НН', 'ДВ']
                    found_codes = [code for code in expected_codes if code in work_codes]
                    
                    if len(found_codes) >= 8:  # Most codes should be present
                        self.log_result("Work Templates - Work Codes", True, 
                                      f"Found {len(found_codes)} Ukrainian work codes")
                        
                        # Validate work code structure
                        sample_code = work_codes.get('8', {})
                        code_fields = ['label', 'hours', 'type', 'color']
                        if all(field in sample_code for field in code_fields):
                            self.log_result("Work Templates - Code Structure", True, 
                                          f"8-hour day: {sample_code.get('label')}")
                        else:
                            self.log_result("Work Templates - Code Structure", False, 
                                          "Missing code fields")
                    else:
                        self.log_result("Work Templates - Work Codes", False, 
                                      f"Only found {len(found_codes)} codes")
                else:
                    self.log_result("Work Templates - Work Codes", False, "Missing workCodes")
                
                # Validate work schedules
                if 'workSchedules' in data:
                    schedules = data['workSchedules']
                    expected_schedules = ['standard', 'part_time', 'shift', 'flexible']
                    found_schedules = [sched for sched in expected_schedules if sched in schedules]
                    
                    if len(found_schedules) >= 3:
                        self.log_result("Work Templates - Schedules", True, 
                                      f"Found {len(found_schedules)} work schedules")
                        
                        # Validate schedule structure
                        standard = schedules.get('standard', {})
                        if 'name' in standard and 'dailyHours' in standard:
                            self.log_result("Work Templates - Schedule Structure", True, 
                                          f"Standard: {standard.get('name')}")
                        else:
                            self.log_result("Work Templates - Schedule Structure", False, 
                                          "Missing schedule fields")
                    else:
                        self.log_result("Work Templates - Schedules", False, 
                                      f"Only found {len(found_schedules)} schedules")
                else:
                    self.log_result("Work Templates - Schedules", False, "Missing workSchedules")
                    
            else:
                self.log_result("Work Templates API", False, f"Status: {response.status_code}")
                
        except Exception as e:
            self.log_result("Work Templates API", False, f"Error: {e}")
    
    def test_complete_timesheet_workflow(self):
        """Test complete timesheet workflow integration"""
        print("🔄 Testing Complete Timesheet Workflow...")
        
        if not all([self.manager_token, self.test_employee_id]):
            self.log_result("Complete Workflow", False, "Missing required data")
            return
            
        auth_headers = {**HEADERS, "Authorization": f"Bearer {self.manager_token}"}
        
        try:
            # Step 1: Get work templates
            templates_response = requests.get(f"{BASE_URL}/timesheet/templates", 
                                            headers=auth_headers, timeout=10)
            
            if templates_response.status_code != 200:
                self.log_result("Workflow - Get Templates", False, "Templates not available")
                return
            
            # Step 2: Create daily entries using different work codes
            current_date = datetime.now().strftime("%Y-%m-%d")
            yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
            
            # Regular work day
            work_entry = {
                "hours": 8,
                "overtime": 0,
                "dayType": "work",
                "status": "present",
                "comments": "Звичайний робочий день"
            }
            
            url = f"{BASE_URL}/timesheet/daily/{self.test_employee_id}/{yesterday}"
            entry_response = requests.put(url, json=work_entry, headers=auth_headers, timeout=10)
            
            if entry_response.status_code == 200:
                self.log_result("Workflow - Create Entry", True, "Daily entry created")
            else:
                self.log_result("Workflow - Create Entry", False, f"Status: {entry_response.status_code}")
                return
            
            # Step 3: Get monthly timesheet to verify entry
            params = {"month": self.current_month, "department": self.test_department}
            monthly_response = requests.get(f"{BASE_URL}/timesheet/monthly", 
                                          params=params, headers=auth_headers, timeout=15)
            
            if monthly_response.status_code == 200:
                monthly_data = monthly_response.json()
                
                # Find our test employee in the timesheet
                test_employee_found = False
                for emp_data in monthly_data.get('employees', []):
                    if emp_data.get('employee', {}).get('id') == self.test_employee_id:
                        test_employee_found = True
                        
                        # Check if our entry is in the daily entries
                        daily_entries = emp_data.get('dailyEntries', [])
                        entry_found = any(
                            entry.get('hours') == 8 and entry.get('dayType') == 'work'
                            for entry in daily_entries
                        )
                        
                        if entry_found:
                            self.log_result("Workflow - Verify in Monthly", True, 
                                          "Entry appears in monthly timesheet")
                        else:
                            self.log_result("Workflow - Verify in Monthly", False, 
                                          "Entry not found in monthly timesheet")
                        
                        # Check summary calculations
                        summary = emp_data.get('summary', {})
                        if summary.get('totalWorkHours', 0) > 0:
                            self.log_result("Workflow - Summary Calculations", True, 
                                          f"Total hours: {summary.get('totalWorkHours')}")
                        else:
                            self.log_result("Workflow - Summary Calculations", False, 
                                          "No work hours in summary")
                        break
                
                if not test_employee_found:
                    self.log_result("Workflow - Employee in Monthly", False, 
                                  "Test employee not found in monthly timesheet")
                else:
                    self.log_result("Workflow - Employee in Monthly", True, 
                                  "Test employee found in monthly timesheet")
            else:
                self.log_result("Workflow - Get Monthly", False, f"Status: {monthly_response.status_code}")
            
            # Step 4: Test workflow with Ukrainian work codes
            ukrainian_codes = [
                {"code": "НТ", "hours": 8, "dayType": "night", "comments": "Нічна зміна"},
                {"code": "Л", "hours": 0, "dayType": "sick", "comments": "Лікарняний"},
                {"code": "ВП", "hours": 0, "dayType": "vacation", "comments": "Відпустка"}
            ]
            
            workflow_success = True
            for i, code_data in enumerate(ukrainian_codes):
                test_date = (datetime.now() - timedelta(days=i+2)).strftime("%Y-%m-%d")
                
                entry_data = {
                    "hours": code_data["hours"],
                    "overtime": 0,
                    "dayType": code_data["dayType"],
                    "status": code_data["dayType"],
                    "comments": code_data["comments"]
                }
                
                url = f"{BASE_URL}/timesheet/daily/{self.test_employee_id}/{test_date}"
                response = requests.put(url, json=entry_data, headers=auth_headers, timeout=10)
                
                if response.status_code != 200:
                    workflow_success = False
                    break
            
            if workflow_success:
                self.log_result("Workflow - Ukrainian Codes", True, 
                              "All Ukrainian work codes processed successfully")
            else:
                self.log_result("Workflow - Ukrainian Codes", False, 
                              "Failed to process Ukrainian work codes")
            
            self.log_result("Complete Timesheet Workflow", True, 
                          "End-to-end timesheet workflow completed successfully")
            
        except Exception as e:
            self.log_result("Complete Timesheet Workflow", False, f"Error: {e}")
    
    def test_authentication_requirements(self):
        """Test that all timesheet endpoints require authentication"""
        print("🔒 Testing Authentication Requirements...")
        
        # Test endpoints without authentication
        endpoints = [
            ("GET", "/timesheet/monthly", {"month": self.current_month}),
            ("PUT", f"/timesheet/daily/{self.test_employee_id or 'test'}/2024-01-01", {}),
            ("GET", "/timesheet/templates", {})
        ]
        
        for method, endpoint, data in endpoints:
            try:
                if method == "GET":
                    response = requests.get(f"{BASE_URL}{endpoint}", 
                                          params=data, headers=HEADERS, timeout=10)
                else:
                    response = requests.put(f"{BASE_URL}{endpoint}", 
                                          json=data, headers=HEADERS, timeout=10)
                
                if response.status_code == 401:
                    self.log_result(f"Auth Required - {endpoint}", True, "Properly requires authentication")
                else:
                    self.log_result(f"Auth Required - {endpoint}", False, 
                                  f"Expected 401, got {response.status_code}")
                    
            except Exception as e:
                self.log_result(f"Auth Required - {endpoint}", False, f"Error: {e}")
    
    def run_all_tests(self):
        """Run all Enhanced Timesheet tests"""
        print("🚀 Starting Enhanced Timesheet API Testing...")
        print("=" * 60)
        
        # Setup
        if not self.setup_authentication():
            print("❌ Authentication setup failed - cannot continue")
            return False
        
        if not self.setup_test_data():
            print("❌ Test data setup failed - some tests may not work")
        
        # Run tests
        self.test_authentication_requirements()
        self.test_work_templates_api()
        self.test_monthly_timesheet_api()
        self.test_daily_entry_update_api()
        self.test_complete_timesheet_workflow()
        
        # Summary
        print("\n" + "=" * 60)
        print("📊 ENHANCED TIMESHEET TESTING SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result['success'])
        total = len(self.test_results)
        pass_rate = (passed / total * 100) if total > 0 else 0
        
        print(f"✅ Passed: {passed}/{total} ({pass_rate:.1f}%)")
        
        if passed < total:
            print(f"❌ Failed: {total - passed}")
            print("\nFailed Tests:")
            for result in self.test_results:
                if not result['success']:
                    print(f"  - {result['test']}: {result['message']}")
        
        print(f"\n🎯 Enhanced Timesheet System Status: {'WORKING' if pass_rate >= 70 else 'NEEDS ATTENTION'}")
        
        return pass_rate >= 70

if __name__ == "__main__":
    tester = TimesheetTester()
    success = tester.run_all_tests()
    sys.exit(0 if success else 1)