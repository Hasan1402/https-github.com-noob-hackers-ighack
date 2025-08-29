#!/usr/bin/env python3
"""
Backend API Testing for CRM Opportunities and Products APIs
Testing Priority: HIGH - These APIs were experiencing timeout issues due to database connection problems
"""

import requests
import json
import time
import os
from datetime import datetime, timedelta

# Configuration - Use localhost for testing due to external URL connectivity issues
BASE_URL = "http://localhost:3000"
API_BASE = f"{BASE_URL}/api"

class CRMAPITester:
    def __init__(self):
        self.session = requests.Session()
        self.admin_token = None
        self.manager_token = None
        self.user_token = None
        self.test_results = []
        self.counterparty_ids = []
        self.opportunity_ids = []
        self.product_ids = []
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'timestamp': datetime.now().isoformat(),
            'details': details
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details and not success:
            print(f"   Details: {details}")
    
    def setup_authentication(self):
        """Setup authentication tokens for different roles"""
        print("\n=== SETTING UP AUTHENTICATION ===")
        
        # Create test users with different roles
        users = [
            {
                'email': 'admin.crm@tiskis.com',
                'password': 'AdminCRM2024!',
                'fullName': 'CRM Admin User',
                'role': 'admin'
            },
            {
                'email': 'manager.crm@tiskis.com', 
                'password': 'ManagerCRM2024!',
                'fullName': 'CRM Manager User',
                'role': 'manager'
            },
            {
                'email': 'user.crm@tiskis.com',
                'password': 'UserCRM2024!', 
                'fullName': 'CRM Regular User',
                'role': 'user'
            }
        ]
        
        tokens = {}
        
        for user in users:
            try:
                # Try to register user
                register_response = self.session.post(
                    f"{API_BASE}/auth/register",
                    json=user,
                    timeout=30
                )
                
                # Login to get token
                login_response = self.session.post(
                    f"{API_BASE}/auth/login",
                    json={
                        'email': user['email'],
                        'password': user['password']
                    },
                    timeout=30
                )
                
                if login_response.status_code == 200:
                    token_data = login_response.json()
                    tokens[user['role']] = token_data.get('token')
                    self.log_result(
                        f"Authentication Setup - {user['role']}",
                        True,
                        f"Successfully authenticated {user['role']} user"
                    )
                else:
                    self.log_result(
                        f"Authentication Setup - {user['role']}",
                        False,
                        f"Failed to authenticate {user['role']} user",
                        login_response.text
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Authentication Setup - {user['role']}",
                    False,
                    f"Authentication error for {user['role']}",
                    str(e)
                )
        
        self.admin_token = tokens.get('admin')
        self.manager_token = tokens.get('manager') 
        self.user_token = tokens.get('user')
        
        return bool(self.admin_token and self.manager_token and self.user_token)
    
    def setup_test_data(self):
        """Setup test counterparties for CRM testing"""
        print("\n=== SETTING UP TEST COUNTERPARTIES ===")
        
        if not self.admin_token:
            self.log_result("Setup Test Data", False, "No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Create test counterparties for opportunities
        counterparties = [
            {
                'name': 'ТОВ "Перспективний Клієнт"',
                'type': 'company',
                'taxId': '12345678901',
                'address': 'м. Київ, вул. Хрещатик, 1',
                'phone': '+380441234567',
                'email': 'info@client1.ua',
                'contactPerson': 'Іванов Іван Іванович',
                'isCustomer': True,
                'isSupplier': False,
                'creditLimit': 100000
            },
            {
                'name': 'ПП "Великий Замовник"',
                'type': 'company', 
                'taxId': '98765432109',
                'address': 'м. Львів, пл. Ринок, 5',
                'phone': '+380322345678',
                'email': 'orders@bigclient.ua',
                'contactPerson': 'Петренко Петро Петрович',
                'isCustomer': True,
                'isSupplier': False,
                'creditLimit': 250000
            },
            {
                'name': 'АТ "Стратегічний Партнер"',
                'type': 'company',
                'taxId': '11223344556',
                'address': 'м. Одеса, вул. Дерибасівська, 10',
                'phone': '+380487654321',
                'email': 'partnership@strategic.ua',
                'contactPerson': 'Сидоренко Сидір Сидорович',
                'isCustomer': True,
                'isSupplier': True,
                'creditLimit': 500000
            }
        ]
        
        for counterparty in counterparties:
            try:
                response = self.session.post(
                    f"{API_BASE}/finance/counterparties",
                    json=counterparty,
                    headers=headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'counterparty' in data and 'id' in data['counterparty']:
                        self.counterparty_ids.append(data['counterparty']['id'])
                        self.log_result(
                            f"Create Counterparty - {counterparty['name']}",
                            True,
                            "Counterparty created successfully"
                        )
                    else:
                        self.log_result(
                            f"Create Counterparty - {counterparty['name']}",
                            False,
                            "Invalid response structure",
                            response.text
                        )
                else:
                    self.log_result(
                        f"Create Counterparty - {counterparty['name']}",
                        False,
                        f"HTTP {response.status_code}",
                        response.text
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Create Counterparty - {counterparty['name']}",
                    False,
                    "Request failed",
                    str(e)
                )
        
        return len(self.counterparty_ids) > 0
    
    def test_opportunities_api(self):
        """Test CRM Opportunities API - HIGH PRIORITY"""
        print("\n=== TESTING CRM OPPORTUNITIES API ===")
        
        if not self.admin_token or not self.counterparty_ids:
            self.log_result("Opportunities API Test", False, "Missing prerequisites")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test 1: Create Opportunities (POST /api/crm/opportunities)
        opportunities = [
            {
                'name': 'Продаж ERP системи - Великий проект',
                'counterpartyId': self.counterparty_ids[0] if self.counterparty_ids else None,
                'expectedValue': 150000,
                'probability': 75,
                'expectedCloseDate': (datetime.now() + timedelta(days=30)).isoformat(),
                'stage': 'qualification',
                'description': 'Впровадження повної ERP системи для великого підприємства',
                'products': ['erp-system', 'consulting', 'training']
            },
            {
                'name': 'Консалтингові послуги - Оптимізація процесів',
                'counterpartyId': self.counterparty_ids[1] if len(self.counterparty_ids) > 1 else self.counterparty_ids[0],
                'expectedValue': 75000,
                'probability': 60,
                'expectedCloseDate': (datetime.now() + timedelta(days=45)).isoformat(),
                'stage': 'proposal',
                'description': 'Аналіз та оптимізація бізнес-процесів клієнта',
                'products': ['consulting', 'analysis']
            },
            {
                'name': 'Технічна підтримка - Річний контракт',
                'counterpartyId': self.counterparty_ids[2] if len(self.counterparty_ids) > 2 else self.counterparty_ids[0],
                'expectedValue': 50000,
                'probability': 90,
                'expectedCloseDate': (datetime.now() + timedelta(days=15)).isoformat(),
                'stage': 'negotiation',
                'description': 'Річний контракт на технічну підтримку системи',
                'products': ['support', 'maintenance']
            }
        ]
        
        for i, opportunity in enumerate(opportunities):
            try:
                response = self.session.post(
                    f"{API_BASE}/crm/opportunities",
                    json=opportunity,
                    headers=headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'opportunity' in data and 'id' in data['opportunity']:
                        self.opportunity_ids.append(data['opportunity']['id'])
                        self.log_result(
                            f"Create Opportunity {i+1}",
                            True,
                            f"Opportunity '{opportunity['name']}' created successfully"
                        )
                        
                        # Validate opportunity structure
                        opp = data['opportunity']
                        required_fields = ['id', 'name', 'counterpartyId', 'expectedValue', 'stage', 'createdBy', 'createdAt']
                        missing_fields = [field for field in required_fields if field not in opp]
                        
                        if missing_fields:
                            self.log_result(
                                f"Opportunity {i+1} Structure Validation",
                                False,
                                f"Missing fields: {missing_fields}"
                            )
                        else:
                            self.log_result(
                                f"Opportunity {i+1} Structure Validation",
                                True,
                                "All required fields present"
                            )
                    else:
                        self.log_result(
                            f"Create Opportunity {i+1}",
                            False,
                            "Invalid response structure",
                            response.text
                        )
                else:
                    self.log_result(
                        f"Create Opportunity {i+1}",
                        False,
                        f"HTTP {response.status_code} - Database timeout issue resolved?",
                        response.text
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Create Opportunity {i+1}",
                    False,
                    "Request failed - Network/timeout issue",
                    str(e)
                )
        
        # Test 2: Get All Opportunities (GET /api/crm/opportunities)
        try:
            response = self.session.get(
                f"{API_BASE}/crm/opportunities",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                opportunities_data = response.json()
                if isinstance(opportunities_data, list):
                    self.log_result(
                        "Get All Opportunities",
                        True,
                        f"Retrieved {len(opportunities_data)} opportunities successfully"
                    )
                    
                    # Validate counterparty integration
                    if opportunities_data:
                        first_opp = opportunities_data[0]
                        if 'counterparty' in first_opp and first_opp['counterparty']:
                            self.log_result(
                                "Counterparty Integration",
                                True,
                                "Opportunities properly enriched with counterparty data"
                            )
                        else:
                            self.log_result(
                                "Counterparty Integration",
                                False,
                                "Counterparty data not properly integrated"
                            )
                else:
                    self.log_result(
                        "Get All Opportunities",
                        False,
                        "Invalid response format",
                        response.text
                    )
            else:
                self.log_result(
                    "Get All Opportunities",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "Get All Opportunities",
                False,
                "Request failed",
                str(e)
            )
        
        # Test 3: Filter Opportunities by Stage
        try:
            response = self.session.get(
                f"{API_BASE}/crm/opportunities?stage=qualification",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                filtered_opportunities = response.json()
                qualification_count = len([opp for opp in filtered_opportunities if opp.get('stage') == 'qualification'])
                self.log_result(
                    "Filter Opportunities by Stage",
                    True,
                    f"Stage filtering working - {qualification_count} qualification opportunities"
                )
            else:
                self.log_result(
                    "Filter Opportunities by Stage",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "Filter Opportunities by Stage",
                False,
                "Request failed",
                str(e)
            )
        
        # Test 4: Role-based Access Control
        if self.user_token:
            user_headers = {'Authorization': f'Bearer {self.user_token}'}
            try:
                response = self.session.get(
                    f"{API_BASE}/crm/opportunities",
                    headers=user_headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    self.log_result(
                        "Opportunities RBAC - User Access",
                        True,
                        "Regular users can access opportunities (read-only)"
                    )
                else:
                    self.log_result(
                        "Opportunities RBAC - User Access",
                        False,
                        f"Unexpected access restriction: HTTP {response.status_code}",
                        response.text
                    )
                    
            except Exception as e:
                self.log_result(
                    "Opportunities RBAC - User Access",
                    False,
                    "Request failed",
                    str(e)
                )
        
        return len(self.opportunity_ids) > 0
    
    def test_products_api(self):
        """Test CRM Products API - HIGH PRIORITY"""
        print("\n=== TESTING CRM PRODUCTS API ===")
        
        if not self.admin_token:
            self.log_result("Products API Test", False, "No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test 1: Create Products (POST /api/crm/products) - Admin/Manager only
        products = [
            {
                'name': 'ERP Система "ТИС КІС"',
                'sku': 'ERP-TIS-KIS-001',
                'category': 'software',
                'basePrice': 50000,
                'cost': 25000,
                'unit': 'ліцензія',
                'description': 'Повнофункціональна ERP система для управління підприємством',
                'isActive': True
            },
            {
                'name': 'Консалтингові послуги',
                'sku': 'CONS-SERV-001',
                'category': 'services',
                'basePrice': 1500,
                'cost': 800,
                'unit': 'година',
                'description': 'Професійні консалтингові послуги з впровадження та оптимізації',
                'isActive': True
            },
            {
                'name': 'Технічна підтримка',
                'sku': 'TECH-SUPP-001',
                'category': 'support',
                'basePrice': 5000,
                'cost': 2000,
                'unit': 'місяць',
                'description': 'Цілодобова технічна підтримка системи',
                'isActive': True
            },
            {
                'name': 'Навчання користувачів',
                'sku': 'TRAIN-USR-001',
                'category': 'training',
                'basePrice': 3000,
                'cost': 1200,
                'unit': 'курс',
                'description': 'Комплексне навчання користувачів роботі з системою',
                'isActive': True
            }
        ]
        
        for i, product in enumerate(products):
            try:
                response = self.session.post(
                    f"{API_BASE}/crm/products",
                    json=product,
                    headers=headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    data = response.json()
                    if 'product' in data and 'id' in data['product']:
                        self.product_ids.append(data['product']['id'])
                        self.log_result(
                            f"Create Product {i+1}",
                            True,
                            f"Product '{product['name']}' created successfully"
                        )
                        
                        # Validate product structure
                        prod = data['product']
                        required_fields = ['id', 'name', 'sku', 'category', 'basePrice', 'unit', 'createdBy', 'createdAt']
                        missing_fields = [field for field in required_fields if field not in prod]
                        
                        if missing_fields:
                            self.log_result(
                                f"Product {i+1} Structure Validation",
                                False,
                                f"Missing fields: {missing_fields}"
                            )
                        else:
                            self.log_result(
                                f"Product {i+1} Structure Validation",
                                True,
                                "All required fields present"
                            )
                    else:
                        self.log_result(
                            f"Create Product {i+1}",
                            False,
                            "Invalid response structure",
                            response.text
                        )
                elif response.status_code == 403:
                    self.log_result(
                        f"Create Product {i+1}",
                        False,
                        "Access denied - RBAC working correctly",
                        response.text
                    )
                else:
                    self.log_result(
                        f"Create Product {i+1}",
                        False,
                        f"HTTP {response.status_code} - Database timeout issue resolved?",
                        response.text
                    )
                    
            except Exception as e:
                self.log_result(
                    f"Create Product {i+1}",
                    False,
                    "Request failed - Network/timeout issue",
                    str(e)
                )
        
        # Test 2: Get All Products (GET /api/crm/products)
        try:
            response = self.session.get(
                f"{API_BASE}/crm/products",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                products_data = response.json()
                if isinstance(products_data, list):
                    self.log_result(
                        "Get All Products",
                        True,
                        f"Retrieved {len(products_data)} products successfully"
                    )
                else:
                    self.log_result(
                        "Get All Products",
                        False,
                        "Invalid response format",
                        response.text
                    )
            else:
                self.log_result(
                    "Get All Products",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "Get All Products",
                False,
                "Request failed",
                str(e)
            )
        
        # Test 3: Filter Products by Category
        try:
            response = self.session.get(
                f"{API_BASE}/crm/products?category=software",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                filtered_products = response.json()
                software_count = len([prod for prod in filtered_products if prod.get('category') == 'software'])
                self.log_result(
                    "Filter Products by Category",
                    True,
                    f"Category filtering working - {software_count} software products"
                )
            else:
                self.log_result(
                    "Filter Products by Category",
                    False,
                    f"HTTP {response.status_code}",
                    response.text
                )
                
        except Exception as e:
            self.log_result(
                "Filter Products by Category",
                False,
                "Request failed",
                str(e)
            )
        
        # Test 4: Role-based Access Control - Manager can create products
        if self.manager_token:
            manager_headers = {'Authorization': f'Bearer {self.manager_token}'}
            test_product = {
                'name': 'Manager Test Product',
                'sku': 'MGR-TEST-001',
                'category': 'test',
                'basePrice': 1000,
                'cost': 500,
                'unit': 'шт',
                'description': 'Test product created by manager',
                'isActive': True
            }
            
            try:
                response = self.session.post(
                    f"{API_BASE}/crm/products",
                    json=test_product,
                    headers=manager_headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    self.log_result(
                        "Products RBAC - Manager Create",
                        True,
                        "Manager can create products"
                    )
                else:
                    self.log_result(
                        "Products RBAC - Manager Create",
                        False,
                        f"Manager access denied: HTTP {response.status_code}",
                        response.text
                    )
                    
            except Exception as e:
                self.log_result(
                    "Products RBAC - Manager Create",
                    False,
                    "Request failed",
                    str(e)
                )
        
        # Test 5: Role-based Access Control - User cannot create products
        if self.user_token:
            user_headers = {'Authorization': f'Bearer {self.user_token}'}
            test_product = {
                'name': 'User Test Product',
                'sku': 'USR-TEST-001',
                'category': 'test',
                'basePrice': 1000,
                'unit': 'шт'
            }
            
            try:
                response = self.session.post(
                    f"{API_BASE}/crm/products",
                    json=test_product,
                    headers=user_headers,
                    timeout=30
                )
                
                if response.status_code == 403:
                    self.log_result(
                        "Products RBAC - User Create Denied",
                        True,
                        "Regular users properly denied product creation"
                    )
                elif response.status_code == 200:
                    self.log_result(
                        "Products RBAC - User Create Denied",
                        False,
                        "Security issue: Regular user can create products"
                    )
                else:
                    self.log_result(
                        "Products RBAC - User Create Denied",
                        False,
                        f"Unexpected response: HTTP {response.status_code}",
                        response.text
                    )
                    
            except Exception as e:
                self.log_result(
                    "Products RBAC - User Create Denied",
                    False,
                    "Request failed",
                    str(e)
                )
            
            # Test user can read products
            try:
                response = self.session.get(
                    f"{API_BASE}/crm/products",
                    headers=user_headers,
                    timeout=30
                )
                
                if response.status_code == 200:
                    self.log_result(
                        "Products RBAC - User Read Access",
                        True,
                        "Regular users can read products"
                    )
                else:
                    self.log_result(
                        "Products RBAC - User Read Access",
                        False,
                        f"User read access denied: HTTP {response.status_code}",
                        response.text
                    )
                    
            except Exception as e:
                self.log_result(
                    "Products RBAC - User Read Access",
                    False,
                    "Request failed",
                    str(e)
                )
        
        return len(self.product_ids) > 0
    
    def test_database_connectivity(self):
        """Test database connectivity and timeout resolution"""
        print("\n=== TESTING DATABASE CONNECTIVITY ===")
        
        if not self.admin_token:
            self.log_result("Database Connectivity Test", False, "No admin token available")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test multiple rapid requests to check for timeout issues
        start_time = time.time()
        successful_requests = 0
        
        for i in range(5):
            try:
                response = self.session.get(
                    f"{API_BASE}/crm/opportunities",
                    headers=headers,
                    timeout=10  # Shorter timeout to detect issues
                )
                
                if response.status_code == 200:
                    successful_requests += 1
                    
            except Exception as e:
                self.log_result(
                    f"Database Connectivity Test {i+1}",
                    False,
                    "Request failed",
                    str(e)
                )
        
        end_time = time.time()
        total_time = end_time - start_time
        
        if successful_requests == 5:
            self.log_result(
                "Database Connectivity - Rapid Requests",
                True,
                f"All 5 requests successful in {total_time:.2f}s - No timeout issues"
            )
        else:
            self.log_result(
                "Database Connectivity - Rapid Requests",
                False,
                f"Only {successful_requests}/5 requests successful - Potential timeout issues remain"
            )
        
        return successful_requests >= 4  # Allow 1 failure
    
    def test_crm_integration(self):
        """Test integration between Finance counterparties and CRM opportunities"""
        print("\n=== TESTING FINANCE-CRM INTEGRATION ===")
        
        if not self.admin_token or not self.counterparty_ids or not self.opportunity_ids:
            self.log_result("CRM Integration Test", False, "Missing prerequisites")
            return False
            
        headers = {'Authorization': f'Bearer {self.admin_token}'}
        
        # Test 1: Verify counterparty references in opportunities
        try:
            response = self.session.get(
                f"{API_BASE}/crm/opportunities",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                opportunities = response.json()
                valid_references = 0
                
                for opp in opportunities:
                    if opp.get('counterpartyId') in self.counterparty_ids:
                        valid_references += 1
                
                if valid_references > 0:
                    self.log_result(
                        "Finance-CRM Integration - Counterparty References",
                        True,
                        f"{valid_references} opportunities have valid counterparty references"
                    )
                else:
                    self.log_result(
                        "Finance-CRM Integration - Counterparty References",
                        False,
                        "No valid counterparty references found in opportunities"
                    )
                    
        except Exception as e:
            self.log_result(
                "Finance-CRM Integration - Counterparty References",
                False,
                "Request failed",
                str(e)
            )
        
        # Test 2: Verify counterparty data enrichment
        try:
            response = self.session.get(
                f"{API_BASE}/crm/opportunities",
                headers=headers,
                timeout=30
            )
            
            if response.status_code == 200:
                opportunities = response.json()
                enriched_count = 0
                
                for opp in opportunities:
                    if 'counterparty' in opp and opp['counterparty'] and 'name' in opp['counterparty']:
                        enriched_count += 1
                
                if enriched_count > 0:
                    self.log_result(
                        "Finance-CRM Integration - Data Enrichment",
                        True,
                        f"{enriched_count} opportunities properly enriched with counterparty data"
                    )
                else:
                    self.log_result(
                        "Finance-CRM Integration - Data Enrichment",
                        False,
                        "Counterparty data not properly enriched in opportunities"
                    )
                    
        except Exception as e:
            self.log_result(
                "Finance-CRM Integration - Data Enrichment",
                False,
                "Request failed",
                str(e)
            )
        
        return True
    
    def run_all_tests(self):
        """Run all CRM API tests"""
        print("🚀 STARTING CRM OPPORTUNITIES AND PRODUCTS API TESTING")
        print("=" * 60)
        
        # Setup phase
        auth_success = self.setup_authentication()
        if not auth_success:
            print("❌ Authentication setup failed - cannot proceed with testing")
            return False
        
        data_success = self.setup_test_data()
        if not data_success:
            print("❌ Test data setup failed - limited testing possible")
        
        # Core testing
        opportunities_success = self.test_opportunities_api()
        products_success = self.test_products_api()
        connectivity_success = self.test_database_connectivity()
        integration_success = self.test_crm_integration()
        
        # Results summary
        print("\n" + "=" * 60)
        print("🎯 TEST RESULTS SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        
        print(f"Total Tests: {total_tests}")
        print(f"✅ Passed: {passed_tests}")
        print(f"❌ Failed: {failed_tests}")
        print(f"📊 Pass Rate: {(passed_tests/total_tests*100):.1f}%")
        
        # Critical issues
        critical_failures = []
        for result in self.test_results:
            if not result['success'] and any(keyword in result['test'].lower() for keyword in ['create', 'database', 'timeout']):
                critical_failures.append(result['test'])
        
        if critical_failures:
            print(f"\n🚨 CRITICAL FAILURES:")
            for failure in critical_failures:
                print(f"   - {failure}")
        
        # Success indicators
        success_indicators = {
            'Opportunities API': opportunities_success,
            'Products API': products_success,
            'Database Connectivity': connectivity_success,
            'Finance-CRM Integration': integration_success
        }
        
        print(f"\n📈 COMPONENT STATUS:")
        for component, status in success_indicators.items():
            status_icon = "✅" if status else "❌"
            print(f"   {status_icon} {component}")
        
        overall_success = all(success_indicators.values())
        
        if overall_success:
            print(f"\n🎉 OVERALL RESULT: ✅ ALL CRITICAL COMPONENTS WORKING")
            print("   Database timeout issues appear to be resolved!")
        else:
            print(f"\n⚠️  OVERALL RESULT: ❌ SOME CRITICAL ISSUES REMAIN")
            print("   Database connection fixes may need additional work")
        
        return overall_success

def main():
    """Main test execution"""
    tester = CRMAPITester()
    success = tester.run_all_tests()
    
    # Save detailed results
    with open('/app/crm_test_results.json', 'w', encoding='utf-8') as f:
        json.dump(tester.test_results, f, indent=2, ensure_ascii=False)
    
    print(f"\n📄 Detailed results saved to: /app/crm_test_results.json")
    
    return success

if __name__ == "__main__":
    success = main()
    exit(0 if success else 1)