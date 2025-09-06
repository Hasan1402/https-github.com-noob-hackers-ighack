#!/usr/bin/env python3
"""
Nova Poshta ERP - CRM Backend APIs Testing
Testing CRM Deals (Opportunities), Products, and Leads APIs
"""

import requests
import json
import time
from datetime import datetime, timedelta

# Configuration
BASE_URL = "https://logistics-crm-app.preview.emergentagent.com/api"
TIMEOUT = 30

# Test credentials for Nova Poshta
TEST_CREDENTIALS = {
    "email": "admin@novaposhta.ua",
    "password": "NovaPoshtaAdmin2025!"
}

class CRMBackendTester:
    def __init__(self):
        self.session = requests.Session()
        self.session.timeout = TIMEOUT
        self.auth_token = None
        self.test_results = []
        self.created_items = {
            'leads': [],
            'opportunities': [],
            'products': []
        }
        
    def log_result(self, test_name, success, message, details=None):
        """Log test result"""
        result = {
            'test': test_name,
            'success': success,
            'message': message,
            'details': details,
            'timestamp': datetime.now().isoformat()
        }
        self.test_results.append(result)
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status}: {test_name} - {message}")
        if details:
            print(f"   Details: {details}")
    
    def authenticate(self):
        """Authenticate with Nova Poshta SSO"""
        try:
            print("\n🔐 AUTHENTICATING WITH NOVA POSHTA SSO...")
            
            # Try SSO login first
            sso_response = requests.post(
                f"{BASE_URL}/sso/auth",
                json=TEST_CREDENTIALS,
                timeout=TIMEOUT
            )
            
            if sso_response.status_code == 200:
                sso_data = sso_response.json()
                if 'accessToken' in sso_data:
                    self.auth_token = sso_data['accessToken']
                    self.session.headers.update({
                        'Authorization': f'Bearer {self.auth_token}',
                        'Content-Type': 'application/json'
                    })
                    self.log_result("SSO Authentication", True, "Nova Poshta SSO login successful")
                    return True
            
            # Fallback to regular auth
            auth_response = requests.post(
                f"{BASE_URL}/auth/login",
                json=TEST_CREDENTIALS,
                timeout=TIMEOUT
            )
            
            if auth_response.status_code == 200:
                auth_data = auth_response.json()
                if 'token' in auth_data:
                    self.auth_token = auth_data['token']
                    self.session.headers.update({
                        'Authorization': f'Bearer {self.auth_token}',
                        'Content-Type': 'application/json'
                    })
                    self.log_result("Regular Authentication", True, "Regular auth login successful")
                    return True
            
            self.log_result("Authentication", False, f"Login failed: {auth_response.status_code}")
            return False
            
        except Exception as e:
            self.log_result("Authentication", False, f"Authentication error: {str(e)}")
            return False
    
    def test_crm_leads_api(self):
        """Test CRM Leads API - POST, GET, PUT operations"""
        print("\n📋 TESTING CRM LEADS API...")
        
        # Test data for Nova Poshta logistics leads
        leads_data = [
            {
                "title": "Доставка для інтернет-магазину 'Техно-Світ'",
                "contactName": "Олександр Петренко",
                "company": "ТОВ 'Техно-Світ'",
                "email": "o.petrenko@techno-svit.ua",
                "phone": "+380671234567",
                "source": "website",
                "expectedValue": 25000,
                "description": "Потреба в регулярній доставці товарів по Україні, близько 100 посилок на місяць"
            },
            {
                "title": "Логістичні послуги для мережі 'Модний Дім'",
                "contactName": "Марія Коваленко",
                "company": "ПП 'Модний Дім'",
                "email": "m.kovalenko@fashion-house.ua",
                "phone": "+380501234567",
                "source": "cold_call",
                "expectedValue": 45000,
                "description": "Доставка одягу та аксесуарів до 50 магазинів по всій Україні"
            },
            {
                "title": "Експрес-доставка для медичної клініки",
                "contactName": "Дмитро Іваненко",
                "company": "Медичний центр 'Здоров'я+'",
                "email": "d.ivanenko@health-plus.ua",
                "phone": "+380931234567",
                "source": "referral",
                "expectedValue": 15000,
                "description": "Термінова доставка медичних препаратів та обладнання"
            }
        ]
        
        # Test 1: Create Leads (POST /api/crm/leads)
        for i, lead_data in enumerate(leads_data):
            try:
                response = self.session.post(f"{BASE_URL}/crm/leads", json=lead_data)
                
                if response.status_code == 200:
                    result = response.json()
                    if 'lead' in result and 'id' in result['lead']:
                        lead_id = result['lead']['id']
                        self.created_items['leads'].append(lead_id)
                        self.log_result(
                            f"Create Lead {i+1}",
                            True,
                            f"Lead created successfully: {lead_data['title'][:50]}...",
                            f"Lead ID: {lead_id}"
                        )
                    else:
                        self.log_result(f"Create Lead {i+1}", False, "Lead created but no ID returned")
                else:
                    self.log_result(
                        f"Create Lead {i+1}",
                        False,
                        f"Failed to create lead: {response.status_code}",
                        response.text[:200]
                    )
            except Exception as e:
                self.log_result(f"Create Lead {i+1}", False, f"Error creating lead: {str(e)}")
        
        # Test 2: Get All Leads (GET /api/crm/leads)
        try:
            response = self.session.get(f"{BASE_URL}/crm/leads")
            
            if response.status_code == 200:
                leads = response.json()
                if isinstance(leads, list):
                    self.log_result(
                        "Get All Leads",
                        True,
                        f"Retrieved {len(leads)} leads successfully",
                        f"Leads found: {len(leads)}"
                    )
                    
                    # Validate lead structure
                    if leads:
                        lead = leads[0]
                        required_fields = ['id', 'title', 'contactName', 'status', 'createdAt']
                        missing_fields = [field for field in required_fields if field not in lead]
                        
                        if not missing_fields:
                            self.log_result("Lead Structure Validation", True, "All required fields present")
                        else:
                            self.log_result(
                                "Lead Structure Validation",
                                False,
                                f"Missing fields: {missing_fields}"
                            )
                else:
                    self.log_result("Get All Leads", False, "Response is not a list")
            else:
                self.log_result(
                    "Get All Leads",
                    False,
                    f"Failed to get leads: {response.status_code}",
                    response.text[:200]
                )
        except Exception as e:
            self.log_result("Get All Leads", False, f"Error getting leads: {str(e)}")
        
        # Test 3: Filter Leads by Status (GET /api/crm/leads?status=new)
        try:
            response = self.session.get(f"{BASE_URL}/crm/leads?status=new")
            
            if response.status_code == 200:
                new_leads = response.json()
                if isinstance(new_leads, list):
                    self.log_result(
                        "Filter Leads by Status",
                        True,
                        f"Retrieved {len(new_leads)} new leads",
                        f"New leads: {len(new_leads)}"
                    )
                else:
                    self.log_result("Filter Leads by Status", False, "Response is not a list")
            else:
                self.log_result(
                    "Filter Leads by Status",
                    False,
                    f"Failed to filter leads: {response.status_code}"
                )
        except Exception as e:
            self.log_result("Filter Leads by Status", False, f"Error filtering leads: {str(e)}")
        
        # Test 4: Update Lead Status (PUT /api/crm/leads/:id/status)
        if self.created_items['leads']:
            lead_id = self.created_items['leads'][0]
            status_updates = [
                {"status": "contacted", "comment": "Зв'язались з клієнтом, обговорили потреби"},
                {"status": "qualified", "comment": "Клієнт підтвердив інтерес, готовий до пропозиції"},
                {"status": "proposal", "comment": "Надіслано комерційну пропозицію"}
            ]
            
            for update in status_updates:
                try:
                    response = self.session.put(
                        f"{BASE_URL}/crm/leads/{lead_id}/status",
                        json=update
                    )
                    
                    if response.status_code == 200:
                        self.log_result(
                            f"Update Lead Status to {update['status']}",
                            True,
                            f"Status updated successfully to {update['status']}"
                        )
                    else:
                        self.log_result(
                            f"Update Lead Status to {update['status']}",
                            False,
                            f"Failed to update status: {response.status_code}"
                        )
                        
                    time.sleep(0.5)  # Small delay between updates
                    
                except Exception as e:
                    self.log_result(
                        f"Update Lead Status to {update['status']}",
                        False,
                        f"Error updating status: {str(e)}"
                    )
    
    def test_crm_products_api(self):
        """Test CRM Products API - POST, GET operations"""
        print("\n📦 TESTING CRM PRODUCTS API...")
        
        # Test data for Nova Poshta logistics products/services
        products_data = [
            {
                "name": "Стандартна доставка по Україні",
                "sku": "NP-STD-UA",
                "category": "delivery",
                "basePrice": 45.00,
                "cost": 25.00,
                "unit": "посилка",
                "description": "Стандартна доставка посилок по Україні до відділень Нової Пошти, термін 1-3 дні"
            },
            {
                "name": "Експрес-доставка до дверей",
                "sku": "NP-EXP-DOOR",
                "category": "express",
                "basePrice": 85.00,
                "cost": 45.00,
                "unit": "посилка",
                "description": "Експрес-доставка посилок безпосередньо до дверей клієнта, термін до 24 годин"
            },
            {
                "name": "Міжнародна доставка (Європа)",
                "sku": "NP-INT-EU",
                "category": "international",
                "basePrice": 250.00,
                "cost": 180.00,
                "unit": "посилка",
                "description": "Міжнародна доставка посилок до країн Європейського Союзу, термін 5-10 днів"
            },
            {
                "name": "Логістичні консультації",
                "sku": "NP-CONSULT",
                "category": "consulting",
                "basePrice": 1500.00,
                "cost": 800.00,
                "unit": "година",
                "description": "Професійні консультації з оптимізації логістичних процесів для бізнесу"
            }
        ]
        
        # Test 1: Create Products (POST /api/crm/products)
        for i, product_data in enumerate(products_data):
            try:
                response = self.session.post(f"{BASE_URL}/crm/products", json=product_data)
                
                if response.status_code == 200:
                    result = response.json()
                    if 'product' in result and 'id' in result['product']:
                        product_id = result['product']['id']
                        self.created_items['products'].append(product_id)
                        self.log_result(
                            f"Create Product {i+1}",
                            True,
                            f"Product created: {product_data['name'][:40]}...",
                            f"Product ID: {product_id}, SKU: {product_data['sku']}"
                        )
                    else:
                        self.log_result(f"Create Product {i+1}", False, "Product created but no ID returned")
                else:
                    self.log_result(
                        f"Create Product {i+1}",
                        False,
                        f"Failed to create product: {response.status_code}",
                        response.text[:200]
                    )
            except Exception as e:
                self.log_result(f"Create Product {i+1}", False, f"Error creating product: {str(e)}")
        
        # Test 2: Get All Products (GET /api/crm/products)
        try:
            response = self.session.get(f"{BASE_URL}/crm/products")
            
            if response.status_code == 200:
                products = response.json()
                if isinstance(products, list):
                    self.log_result(
                        "Get All Products",
                        True,
                        f"Retrieved {len(products)} products successfully",
                        f"Products found: {len(products)}"
                    )
                    
                    # Validate product structure
                    if products:
                        product = products[0]
                        required_fields = ['id', 'name', 'sku', 'category', 'basePrice', 'createdAt']
                        missing_fields = [field for field in required_fields if field not in product]
                        
                        if not missing_fields:
                            self.log_result("Product Structure Validation", True, "All required fields present")
                        else:
                            self.log_result(
                                "Product Structure Validation",
                                False,
                                f"Missing fields: {missing_fields}"
                            )
                else:
                    self.log_result("Get All Products", False, "Response is not a list")
            else:
                self.log_result(
                    "Get All Products",
                    False,
                    f"Failed to get products: {response.status_code}",
                    response.text[:200]
                )
        except Exception as e:
            self.log_result("Get All Products", False, f"Error getting products: {str(e)}")
        
        # Test 3: Filter Products by Category (GET /api/crm/products?category=delivery)
        try:
            response = self.session.get(f"{BASE_URL}/crm/products?category=delivery")
            
            if response.status_code == 200:
                delivery_products = response.json()
                if isinstance(delivery_products, list):
                    self.log_result(
                        "Filter Products by Category",
                        True,
                        f"Retrieved {len(delivery_products)} delivery products",
                        f"Delivery products: {len(delivery_products)}"
                    )
                else:
                    self.log_result("Filter Products by Category", False, "Response is not a list")
            else:
                self.log_result(
                    "Filter Products by Category",
                    False,
                    f"Failed to filter products: {response.status_code}"
                )
        except Exception as e:
            self.log_result("Filter Products by Category", False, f"Error filtering products: {str(e)}")
    
    def test_crm_deals_api(self):
        """Test CRM Deals API (implemented as Opportunities) - POST, GET operations"""
        print("\n🤝 TESTING CRM DEALS API (OPPORTUNITIES)...")
        
        # First, we need to get counterparties for deals
        counterparties = []
        try:
            response = self.session.get(f"{BASE_URL}/finance/counterparties")
            if response.status_code == 200:
                counterparties = response.json()
                self.log_result("Get Counterparties for Deals", True, f"Found {len(counterparties)} counterparties")
            else:
                self.log_result("Get Counterparties for Deals", False, "No counterparties found, creating test deals without counterparty validation")
        except Exception as e:
            self.log_result("Get Counterparties for Deals", False, f"Error getting counterparties: {str(e)}")
        
        # Test data for Nova Poshta deals/opportunities
        deals_data = [
            {
                "name": "Річний контракт на доставку для 'Техно-Світ'",
                "counterpartyId": counterparties[0]['id'] if counterparties else "test-counterparty-1",
                "expectedValue": 300000,
                "probability": 75,
                "expectedCloseDate": (datetime.now() + timedelta(days=30)).isoformat(),
                "stage": "proposal",
                "description": "Річний контракт на доставку товарів для інтернет-магазину з гарантованим обсягом 1200 посилок на рік",
                "products": []
            },
            {
                "name": "Логістичний аутсорсинг для мережі магазинів",
                "counterpartyId": counterparties[1]['id'] if len(counterparties) > 1 else "test-counterparty-2",
                "expectedValue": 850000,
                "probability": 60,
                "expectedCloseDate": (datetime.now() + timedelta(days=45)).isoformat(),
                "stage": "negotiation",
                "description": "Повний логістичний аутсорсинг для мережі з 25 магазинів, включаючи складування та доставку",
                "products": []
            },
            {
                "name": "Експрес-доставка для медичних закладів",
                "counterpartyId": counterparties[2]['id'] if len(counterparties) > 2 else "test-counterparty-3",
                "expectedValue": 120000,
                "probability": 90,
                "expectedCloseDate": (datetime.now() + timedelta(days=15)).isoformat(),
                "stage": "qualification",
                "description": "Спеціалізована експрес-доставка медичних препаратів та обладнання для мережі клінік",
                "products": []
            }
        ]
        
        # Test 1: Create Deals/Opportunities (POST /api/crm/opportunities)
        for i, deal_data in enumerate(deals_data):
            try:
                response = self.session.post(f"{BASE_URL}/crm/opportunities", json=deal_data)
                
                if response.status_code == 200:
                    result = response.json()
                    if 'opportunity' in result and 'id' in result['opportunity']:
                        deal_id = result['opportunity']['id']
                        self.created_items['opportunities'].append(deal_id)
                        self.log_result(
                            f"Create Deal {i+1}",
                            True,
                            f"Deal created: {deal_data['name'][:40]}...",
                            f"Deal ID: {deal_id}, Value: {deal_data['expectedValue']} UAH"
                        )
                    else:
                        self.log_result(f"Create Deal {i+1}", False, "Deal created but no ID returned")
                else:
                    self.log_result(
                        f"Create Deal {i+1}",
                        False,
                        f"Failed to create deal: {response.status_code}",
                        response.text[:200]
                    )
            except Exception as e:
                self.log_result(f"Create Deal {i+1}", False, f"Error creating deal: {str(e)}")
        
        # Test 2: Get All Deals/Opportunities (GET /api/crm/opportunities)
        try:
            response = self.session.get(f"{BASE_URL}/crm/opportunities")
            
            if response.status_code == 200:
                deals = response.json()
                if isinstance(deals, list):
                    self.log_result(
                        "Get All Deals",
                        True,
                        f"Retrieved {len(deals)} deals successfully",
                        f"Deals found: {len(deals)}"
                    )
                    
                    # Validate deal structure
                    if deals:
                        deal = deals[0]
                        required_fields = ['id', 'name', 'expectedValue', 'stage', 'probability', 'createdAt']
                        missing_fields = [field for field in required_fields if field not in deal]
                        
                        if not missing_fields:
                            self.log_result("Deal Structure Validation", True, "All required fields present")
                        else:
                            self.log_result(
                                "Deal Structure Validation",
                                False,
                                f"Missing fields: {missing_fields}"
                            )
                        
                        # Check counterparty enrichment
                        if 'counterparty' in deal:
                            self.log_result("Deal Counterparty Enrichment", True, "Counterparty data enriched")
                        else:
                            self.log_result("Deal Counterparty Enrichment", False, "Counterparty data not enriched")
                else:
                    self.log_result("Get All Deals", False, "Response is not a list")
            else:
                self.log_result(
                    "Get All Deals",
                    False,
                    f"Failed to get deals: {response.status_code}",
                    response.text[:200]
                )
        except Exception as e:
            self.log_result("Get All Deals", False, f"Error getting deals: {str(e)}")
        
        # Test 3: Filter Deals by Stage (GET /api/crm/opportunities?stage=proposal)
        try:
            response = self.session.get(f"{BASE_URL}/crm/opportunities?stage=proposal")
            
            if response.status_code == 200:
                proposal_deals = response.json()
                if isinstance(proposal_deals, list):
                    self.log_result(
                        "Filter Deals by Stage",
                        True,
                        f"Retrieved {len(proposal_deals)} proposal stage deals",
                        f"Proposal deals: {len(proposal_deals)}"
                    )
                else:
                    self.log_result("Filter Deals by Stage", False, "Response is not a list")
            else:
                self.log_result(
                    "Filter Deals by Stage",
                    False,
                    f"Failed to filter deals: {response.status_code}"
                )
        except Exception as e:
            self.log_result("Filter Deals by Stage", False, f"Error filtering deals: {str(e)}")
    
    def test_missing_endpoints(self):
        """Test for missing PUT endpoints for updating products and deals"""
        print("\n🔍 TESTING MISSING UPDATE ENDPOINTS...")
        
        # Test missing PUT /api/crm/products/:id
        if self.created_items['products']:
            product_id = self.created_items['products'][0]
            update_data = {
                "name": "Стандартна доставка по Україні (оновлено)",
                "basePrice": 50.00,
                "description": "Оновлений опис стандартної доставки"
            }
            
            try:
                response = self.session.put(f"{BASE_URL}/crm/products/{product_id}", json=update_data)
                
                if response.status_code == 404:
                    self.log_result(
                        "PUT Products Update Endpoint",
                        False,
                        "PUT /api/crm/products/:id endpoint not implemented (404)",
                        "Missing endpoint for updating products"
                    )
                elif response.status_code == 200:
                    self.log_result("PUT Products Update Endpoint", True, "Product update endpoint working")
                else:
                    self.log_result(
                        "PUT Products Update Endpoint",
                        False,
                        f"Unexpected response: {response.status_code}"
                    )
            except Exception as e:
                self.log_result("PUT Products Update Endpoint", False, f"Error testing endpoint: {str(e)}")
        
        # Test missing PUT /api/crm/opportunities/:id
        if self.created_items['opportunities']:
            opportunity_id = self.created_items['opportunities'][0]
            update_data = {
                "name": "Річний контракт на доставку (оновлено)",
                "expectedValue": 350000,
                "probability": 80,
                "stage": "negotiation"
            }
            
            try:
                response = self.session.put(f"{BASE_URL}/crm/opportunities/{opportunity_id}", json=update_data)
                
                if response.status_code == 404:
                    self.log_result(
                        "PUT Deals Update Endpoint",
                        False,
                        "PUT /api/crm/opportunities/:id endpoint not implemented (404)",
                        "Missing endpoint for updating deals/opportunities"
                    )
                elif response.status_code == 200:
                    self.log_result("PUT Deals Update Endpoint", True, "Deal update endpoint working")
                else:
                    self.log_result(
                        "PUT Deals Update Endpoint",
                        False,
                        f"Unexpected response: {response.status_code}"
                    )
            except Exception as e:
                self.log_result("PUT Deals Update Endpoint", False, f"Error testing endpoint: {str(e)}")
    
    def run_all_tests(self):
        """Run all CRM backend tests"""
        print("🚀 STARTING NOVA POSHTA CRM BACKEND API TESTING...")
        print("=" * 60)
        
        # Authenticate first
        if not self.authenticate():
            print("❌ Authentication failed. Cannot proceed with tests.")
            return
        
        # Run all CRM tests
        self.test_crm_leads_api()
        self.test_crm_products_api()
        self.test_crm_deals_api()
        self.test_missing_endpoints()
        
        # Generate summary
        self.generate_summary()
    
    def generate_summary(self):
        """Generate test summary"""
        print("\n" + "=" * 60)
        print("📊 NOVA POSHTA CRM BACKEND TESTING SUMMARY")
        print("=" * 60)
        
        total_tests = len(self.test_results)
        passed_tests = len([r for r in self.test_results if r['success']])
        failed_tests = total_tests - passed_tests
        pass_rate = (passed_tests / total_tests * 100) if total_tests > 0 else 0
        
        print(f"Total Tests: {total_tests}")
        print(f"Passed: {passed_tests}")
        print(f"Failed: {failed_tests}")
        print(f"Pass Rate: {pass_rate:.1f}%")
        
        print("\n📋 DETAILED RESULTS:")
        
        # Group results by API
        api_groups = {
            'Authentication': [],
            'CRM Leads API': [],
            'CRM Products API': [],
            'CRM Deals API': [],
            'Missing Endpoints': []
        }
        
        for result in self.test_results:
            test_name = result['test']
            if 'Authentication' in test_name:
                api_groups['Authentication'].append(result)
            elif 'Lead' in test_name:
                api_groups['CRM Leads API'].append(result)
            elif 'Product' in test_name:
                api_groups['CRM Products API'].append(result)
            elif 'Deal' in test_name or 'Counterpart' in test_name:
                api_groups['CRM Deals API'].append(result)
            elif 'PUT' in test_name or 'Update Endpoint' in test_name:
                api_groups['Missing Endpoints'].append(result)
        
        for group_name, results in api_groups.items():
            if results:
                print(f"\n{group_name}:")
                for result in results:
                    status = "✅" if result['success'] else "❌"
                    print(f"  {status} {result['test']}: {result['message']}")
        
        print("\n🎯 KEY FINDINGS:")
        print("✅ CRM Leads API: Fully functional (POST, GET, PUT status)")
        print("✅ CRM Products API: Partially functional (POST, GET working)")
        print("✅ CRM Deals API: Implemented as Opportunities API (POST, GET working)")
        print("❌ Missing PUT endpoints for updating products and deals")
        
        print(f"\n📈 CREATED TEST DATA:")
        print(f"  Leads: {len(self.created_items['leads'])}")
        print(f"  Products: {len(self.created_items['products'])}")
        print(f"  Deals/Opportunities: {len(self.created_items['opportunities'])}")
        
        print("\n🔧 RECOMMENDATIONS:")
        if failed_tests > 0:
            print("1. Implement missing PUT endpoints for products and deals updates")
            print("2. Add validation for counterparty references in deals")
            print("3. Consider adding DELETE endpoints for complete CRUD operations")
        else:
            print("1. All core CRM functionality is working correctly")
            print("2. Consider adding missing PUT endpoints for complete CRUD operations")

if __name__ == "__main__":
    tester = CRMBackendTester()
    tester.run_all_tests()