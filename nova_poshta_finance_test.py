#!/usr/bin/env python3
"""
Nova Poshta ERP Financial Accounting Backend APIs Testing
Testing Chart of Accounts, Counterparties, Journal Entries, and Bank Accounts APIs
with Ukrainian localization and role-based access control
"""

import requests
import json
import time
from datetime import datetime, timedelta
import uuid

# Configuration
BASE_URL = "http://localhost:3000/api"

class NovaPoshtaFinanceTester:
    def __init__(self):
        self.base_url = BASE_URL
        self.session = requests.Session()
        self.auth_token = None
        
        # Nova Poshta test users (admin and hr_manager have finance access)
        self.admin_user = {
            "email": "admin@novaposhta.ua",
            "password": "AdminPass123!"
        }
        self.hr_manager_user = {
            "email": "hr@novaposhta.ua", 
            "password": "HRPass123!"
        }
        self.warehouse_user = {
            "email": "warehouse@novaposhta.ua",
            "password": "WarehousePass123!"
        }
        
        self.results = {
            "authentication": {},
            "chart_of_accounts": {},
            "counterparties": {},
            "journal_entries": {},
            "bank_accounts": {},
            "role_based_access": {},
            "ukrainian_localization": {},
            "summary": {"passed": 0, "failed": 0, "errors": []}
        }
        
        self.hr_manager_token = None
        self.warehouse_token = None

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
        endpoint = endpoint.rstrip('/')
        url = f"{self.base_url}{endpoint}"
        
        default_headers = {"Content-Type": "application/json"}
        if headers:
            default_headers.update(headers)
        
        if self.auth_token:
            default_headers["Authorization"] = f"Bearer {self.auth_token}"
        
        try:
            if method.upper() == "GET":
                response = self.session.get(url, headers=default_headers, timeout=15)
            elif method.upper() == "POST":
                response = self.session.post(url, json=data, headers=default_headers, timeout=15)
            elif method.upper() == "PUT":
                response = self.session.put(url, json=data, headers=default_headers, timeout=15)
            elif method.upper() == "DELETE":
                response = self.session.delete(url, headers=default_headers, timeout=15)
            else:
                raise ValueError(f"Unsupported method: {method}")
            
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request error for {method} {url}: {str(e)}")
            return None

    def test_nova_poshta_sso_login(self):
        """Test Nova Poshta SSO authentication"""
        print("\n=== Testing Nova Poshta SSO Authentication ===")
        
        # Test admin login
        response = self.make_request("POST", "/sso/auth/login", self.admin_user)
        if response and response.status_code == 200:
            data = response.json()
            if "token" in data and "user" in data:
                self.auth_token = data["token"]
                user = data["user"]
                self.log_result("authentication", "admin_login", True, 
                              f"Admin login successful: {user.get('fullName')} ({user.get('role')})")
                
                # Verify Nova Poshta tenant
                if user.get('tenant') == 'nova_poshta':
                    self.log_result("authentication", "nova_poshta_tenant", True, "Nova Poshta tenant verified")
                else:
                    self.log_result("authentication", "nova_poshta_tenant", False, f"Wrong tenant: {user.get('tenant')}")
            else:
                self.log_result("authentication", "admin_login", False, f"Missing token or user in response")
        else:
            status = response.status_code if response else "No response"
            error_msg = response.json().get("error", "Unknown error") if response else "No response"
            self.log_result("authentication", "admin_login", False, f"Admin login failed: {status} - {error_msg}")
            return False

        # Test HR manager login
        response = self.make_request("POST", "/sso/auth/login", self.hr_manager_user)
        if response and response.status_code == 200:
            data = response.json()
            self.hr_manager_token = data.get("token")
            self.log_result("authentication", "hr_manager_login", True, "HR manager login successful")
        else:
            self.log_result("authentication", "hr_manager_login", False, "HR manager login failed")

        # Test warehouse user login (should have limited access)
        response = self.make_request("POST", "/sso/auth/login", self.warehouse_user)
        if response and response.status_code == 200:
            data = response.json()
            self.warehouse_token = data.get("token")
            self.log_result("authentication", "warehouse_login", True, "Warehouse user login successful")
        else:
            self.log_result("authentication", "warehouse_login", False, "Warehouse user login failed")

        return True

    def test_chart_of_accounts_api(self):
        """Test Chart of Accounts API with Ukrainian classification"""
        print("\n=== Testing Chart of Accounts API ===")
        
        if not self.auth_token:
            self.log_result("chart_of_accounts", "no_token", False, "No auth token available")
            return False

        # Ukrainian Chart of Accounts according to Ukrainian accounting standards
        ukrainian_accounts = [
            {
                "code": "10",
                "name": "Основні засоби",
                "type": "asset",
                "level": 1,
                "currency": "UAH",
                "description": "Основні засоби підприємства згідно П(С)БО 7"
            },
            {
                "code": "30",
                "name": "Каса",
                "type": "asset", 
                "level": 1,
                "currency": "UAH",
                "description": "Готівкові кошти в касі підприємства"
            },
            {
                "code": "31",
                "name": "Рахунки в банках",
                "type": "asset",
                "level": 1,
                "currency": "UAH", 
                "description": "Безготівкові кошти на рахунках у банках"
            },
            {
                "code": "63",
                "name": "Розрахунки з постачальниками та підрядниками",
                "type": "liability",
                "level": 1,
                "currency": "UAH",
                "description": "Кредиторська заборгованість перед постачальниками"
            },
            {
                "code": "40",
                "name": "Статутний капітал",
                "type": "equity",
                "level": 1,
                "currency": "UAH",
                "description": "Зареєстрований статутний капітал підприємства"
            },
            {
                "code": "70",
                "name": "Доходи від реалізації",
                "type": "revenue",
                "level": 1,
                "currency": "UAH",
                "description": "Доходи від реалізації товарів, робіт, послуг"
            },
            {
                "code": "92",
                "name": "Адміністративні витрати",
                "type": "expense",
                "level": 1,
                "currency": "UAH",
                "description": "Загальногосподарські витрати підприємства"
            }
        ]
        
        created_accounts = 0
        for account_data in ukrainian_accounts:
            response = self.make_request("POST", "/finance/accounts", account_data)
            if response and response.status_code == 200:
                result = response.json()
                if "account" in result:
                    account = result["account"]
                    created_accounts += 1
                    self.log_result("chart_of_accounts", f"create_account_{account_data['code']}", True, 
                                  f"Створено рахунок {account_data['code']} - {account_data['name']}")
                else:
                    self.log_result("chart_of_accounts", f"create_account_{account_data['code']}", False, 
                                  "Account created but no account data returned")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response else "No error details"
                self.log_result("chart_of_accounts", f"create_account_{account_data['code']}", False, 
                              f"Failed to create account {account_data['code']}: {status} - {error_msg}")

        # Test GET /api/finance/accounts
        response = self.make_request("GET", "/finance/accounts")
        if response and response.status_code == 200:
            accounts = response.json()
            if isinstance(accounts, list) and len(accounts) > 0:
                self.log_result("chart_of_accounts", "get_accounts", True, 
                              f"Отримано {len(accounts)} рахунків з плану рахунків")
                
                # Verify Ukrainian account structure
                account = accounts[0]
                required_fields = ["id", "code", "name", "type", "balance", "currency", "createdAt"]
                missing_fields = [field for field in required_fields if field not in account]
                if not missing_fields:
                    self.log_result("chart_of_accounts", "account_structure", True, "Структура рахунку відповідає вимогам")
                else:
                    self.log_result("chart_of_accounts", "account_structure", False, f"Відсутні поля: {missing_fields}")
                    
                # Check Ukrainian account codes
                account_codes = [acc.get("code") for acc in accounts]
                ukrainian_codes = ["10", "30", "31", "63", "40", "70", "92"]
                found_codes = [code for code in ukrainian_codes if code in account_codes]
                if len(found_codes) >= 5:
                    self.log_result("chart_of_accounts", "ukrainian_classification", True, 
                                  f"Українська класифікація рахунків підтримується ({len(found_codes)} кодів)")
                else:
                    self.log_result("chart_of_accounts", "ukrainian_classification", False, 
                                  f"Недостатньо українських кодів рахунків: {found_codes}")
            else:
                self.log_result("chart_of_accounts", "get_accounts", False, "Порожній список рахунків")
        else:
            status = response.status_code if response else "No response"
            self.log_result("chart_of_accounts", "get_accounts", False, f"Помилка отримання рахунків: {status}")

        return created_accounts > 0

    def test_counterparties_api(self):
        """Test Counterparties API with Ukrainian business entities"""
        print("\n=== Testing Counterparties API ===")
        
        if not self.auth_token:
            self.log_result("counterparties", "no_token", False, "No auth token available")
            return False

        # Ukrainian counterparties with proper legal forms
        ukrainian_counterparties = [
            {
                "name": "ТОВ 'Укрпошта'",
                "type": "company",
                "taxId": "12345678",
                "address": "м. Київ, вул. Хрещатик, 1",
                "phone": "+380441234567",
                "email": "info@ukrposhta.ua",
                "contactPerson": "Іванов Іван Іванович",
                "isSupplier": True,
                "isCustomer": False,
                "creditLimit": 100000
            },
            {
                "name": "ПП 'Логістик Експрес'",
                "type": "individual",
                "taxId": "87654321",
                "address": "м. Дніпро, пр. Гагаріна, 15",
                "phone": "+380561234567", 
                "email": "contact@logistic.ua",
                "contactPerson": "Петренко Петро Петрович",
                "isSupplier": False,
                "isCustomer": True,
                "creditLimit": 50000
            },
            {
                "name": "АТ 'Нова Пошта Глобал'",
                "type": "company",
                "taxId": "11223344",
                "address": "м. Київ, вул. Столичне шосе, 103",
                "phone": "+380800500609",
                "email": "global@novaposhta.ua",
                "contactPerson": "Сидоренко Олена Миколаївна",
                "isSupplier": True,
                "isCustomer": True,
                "creditLimit": 500000
            }
        ]
        
        created_counterparties = 0
        for counterparty_data in ukrainian_counterparties:
            response = self.make_request("POST", "/finance/counterparties", counterparty_data)
            if response and response.status_code == 200:
                result = response.json()
                if "counterparty" in result:
                    counterparty = result["counterparty"]
                    created_counterparties += 1
                    self.log_result("counterparties", f"create_{counterparty_data['type']}", True, 
                                  f"Створено контрагента: {counterparty_data['name']}")
                else:
                    self.log_result("counterparties", f"create_{counterparty_data['type']}", False, 
                                  "Counterparty created but no data returned")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response else "No error details"
                self.log_result("counterparties", f"create_{counterparty_data['type']}", False, 
                              f"Failed to create counterparty: {status} - {error_msg}")

        # Test GET /api/finance/counterparties
        response = self.make_request("GET", "/finance/counterparties")
        if response and response.status_code == 200:
            counterparties = response.json()
            if isinstance(counterparties, list) and len(counterparties) > 0:
                self.log_result("counterparties", "get_all", True, 
                              f"Отримано {len(counterparties)} контрагентів")
                
                # Verify counterparty structure
                counterparty = counterparties[0]
                required_fields = ["id", "name", "type", "taxId", "contactPerson", "creditLimit", "createdAt"]
                missing_fields = [field for field in required_fields if field not in counterparty]
                if not missing_fields:
                    self.log_result("counterparties", "counterparty_structure", True, "Структура контрагента правильна")
                else:
                    self.log_result("counterparties", "counterparty_structure", False, f"Відсутні поля: {missing_fields}")
            else:
                self.log_result("counterparties", "get_all", False, "Порожній список контрагентів")
        else:
            status = response.status_code if response else "No response"
            self.log_result("counterparties", "get_all", False, f"Помилка отримання контрагентів: {status}")

        # Test filtering by type
        for filter_type in ['customer', 'supplier', 'both']:
            response = self.make_request("GET", f"/finance/counterparties?type={filter_type}")
            if response and response.status_code == 200:
                filtered = response.json()
                self.log_result("counterparties", f"filter_{filter_type}", True, 
                              f"Фільтрація по типу '{filter_type}': {len(filtered)} контрагентів")
            else:
                status = response.status_code if response else "No response"
                self.log_result("counterparties", f"filter_{filter_type}", False, 
                              f"Помилка фільтрації по типу '{filter_type}': {status}")

        return created_counterparties > 0

    def test_journal_entries_api(self):
        """Test Journal Entries API with double-entry bookkeeping"""
        print("\n=== Testing Journal Entries API (Проводки) ===")
        
        if not self.auth_token:
            self.log_result("journal_entries", "no_token", False, "No auth token available")
            return False

        # Ukrainian accounting journal entries
        journal_entries = [
            {
                "date": "2024-01-15",
                "description": "Надходження готівки в касу від реалізації послуг",
                "reference": "ПКО-001",
                "lines": [
                    {
                        "accountId": "30", # Каса
                        "debit": 15000,
                        "credit": 0,
                        "description": "Надходження готівки"
                    },
                    {
                        "accountId": "70", # Доходи від реалізації
                        "debit": 0,
                        "credit": 15000,
                        "description": "Доходи від послуг доставки"
                    }
                ]
            },
            {
                "date": "2024-01-16", 
                "description": "Оплата адміністративних витрат",
                "reference": "РКО-002",
                "lines": [
                    {
                        "accountId": "92", # Адміністративні витрати
                        "debit": 8000,
                        "credit": 0,
                        "description": "Адміністративні витрати"
                    },
                    {
                        "accountId": "31", # Рахунки в банках
                        "debit": 0,
                        "credit": 8000,
                        "description": "Списання з банківського рахунку"
                    }
                ]
            }
        ]
        
        created_entries = 0
        for entry_data in journal_entries:
            response = self.make_request("POST", "/finance/journal-entries", entry_data)
            if response and response.status_code == 200:
                result = response.json()
                if "journalEntry" in result:
                    entry = result["journalEntry"]
                    created_entries += 1
                    self.log_result("journal_entries", f"create_entry_{created_entries}", True, 
                                  f"Створено проводку: {entry_data['description']}")
                    
                    # Verify double-entry bookkeeping
                    total_debit = sum(line.get("debit", 0) for line in entry.get("lines", []))
                    total_credit = sum(line.get("credit", 0) for line in entry.get("lines", []))
                    if abs(total_debit - total_credit) < 0.01:
                        self.log_result("journal_entries", f"double_entry_{created_entries}", True, 
                                      f"Подвійний запис дотримано: Дт={total_debit}, Кт={total_credit}")
                    else:
                        self.log_result("journal_entries", f"double_entry_{created_entries}", False, 
                                      f"Порушення подвійного запису: Дт={total_debit}, Кт={total_credit}")
                else:
                    self.log_result("journal_entries", f"create_entry_{created_entries+1}", False, 
                                  "Journal entry created but no data returned")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response else "No error details"
                self.log_result("journal_entries", f"create_entry_{created_entries+1}", False, 
                              f"Failed to create journal entry: {status} - {error_msg}")

        # Test GET /api/finance/journal-entries
        response = self.make_request("GET", "/finance/journal-entries")
        if response and response.status_code == 200:
            entries = response.json()
            if isinstance(entries, list) and len(entries) > 0:
                self.log_result("journal_entries", "get_entries", True, 
                              f"Отримано {len(entries)} проводок")
                
                # Test date filtering
                date_from = "2024-01-01"
                date_to = "2024-01-31"
                response = self.make_request("GET", f"/finance/journal-entries?dateFrom={date_from}&dateTo={date_to}")
                if response and response.status_code == 200:
                    filtered_entries = response.json()
                    self.log_result("journal_entries", "date_filtering", True, 
                                  f"Фільтрація по датах: {len(filtered_entries)} проводок за період")
                else:
                    self.log_result("journal_entries", "date_filtering", False, "Помилка фільтрації по датах")
            else:
                self.log_result("journal_entries", "get_entries", False, "Порожній список проводок")
        else:
            status = response.status_code if response else "No response"
            self.log_result("journal_entries", "get_entries", False, f"Помилка отримання проводок: {status}")

        return created_entries > 0

    def test_bank_accounts_api(self):
        """Test Bank Accounts API with Ukrainian banks and currencies"""
        print("\n=== Testing Bank Accounts API ===")
        
        if not self.auth_token:
            self.log_result("bank_accounts", "no_token", False, "No auth token available")
            return False

        # Ukrainian bank accounts with different currencies and types
        ukrainian_bank_accounts = [
            {
                "accountNumber": "UA213223130000026007233566001",
                "bankName": "АТ КБ 'ПриватБанк'",
                "bankCode": "305299",
                "currency": "UAH",
                "accountType": "current",
                "balance": 250000,
                "isActive": True,
                "description": "Основний поточний рахунок в гривнях"
            },
            {
                "accountNumber": "UA213223130000026007233566002", 
                "bankName": "АТ 'Ощадбанк'",
                "bankCode": "300528",
                "currency": "USD",
                "accountType": "current",
                "balance": 15000,
                "isActive": True,
                "description": "Валютний рахунок в доларах США"
            },
            {
                "accountNumber": "UA213223130000026007233566003",
                "bankName": "АТ 'Укрексімбанк'", 
                "bankCode": "322313",
                "currency": "EUR",
                "accountType": "deposit",
                "balance": 8000,
                "isActive": True,
                "description": "Депозитний рахунок в євро"
            },
            {
                "accountNumber": "UA213223130000026007233566004",
                "bankName": "АТ КБ 'ПриватБанк'",
                "bankCode": "305299", 
                "currency": "UAH",
                "accountType": "salary",
                "balance": 120000,
                "isActive": True,
                "description": "Зарплатний рахунок для співробітників"
            }
        ]
        
        created_accounts = 0
        for account_data in ukrainian_bank_accounts:
            response = self.make_request("POST", "/finance/bank-accounts", account_data)
            if response and response.status_code == 200:
                result = response.json()
                if "bankAccount" in result:
                    account = result["bankAccount"]
                    created_accounts += 1
                    self.log_result("bank_accounts", f"create_{account_data['currency']}_{account_data['accountType']}", True, 
                                  f"Створено банківський рахунок: {account_data['bankName']} ({account_data['currency']})")
                else:
                    self.log_result("bank_accounts", f"create_{account_data['currency']}_{account_data['accountType']}", False, 
                                  "Bank account created but no data returned")
            else:
                status = response.status_code if response else "No response"
                error_msg = response.json().get("error", "Unknown error") if response else "No error details"
                self.log_result("bank_accounts", f"create_{account_data['currency']}_{account_data['accountType']}", False, 
                              f"Failed to create bank account: {status} - {error_msg}")

        # Test GET /api/finance/bank-accounts
        response = self.make_request("GET", "/finance/bank-accounts")
        if response and response.status_code == 200:
            accounts = response.json()
            if isinstance(accounts, list) and len(accounts) > 0:
                self.log_result("bank_accounts", "get_accounts", True, 
                              f"Отримано {len(accounts)} банківських рахунків")
                
                # Verify multi-currency support
                currencies = set(acc.get("currency") for acc in accounts)
                expected_currencies = {"UAH", "USD", "EUR"}
                if expected_currencies.issubset(currencies):
                    self.log_result("bank_accounts", "multi_currency", True, 
                                  f"Підтримка мультивалютності: {currencies}")
                else:
                    missing_currencies = expected_currencies - currencies
                    self.log_result("bank_accounts", "multi_currency", False, 
                                  f"Відсутні валюти: {missing_currencies}")
                
                # Verify account types
                account_types = set(acc.get("accountType") for acc in accounts)
                expected_types = {"current", "deposit", "salary"}
                if expected_types.issubset(account_types):
                    self.log_result("bank_accounts", "account_types", True, 
                                  f"Підтримка типів рахунків: {account_types}")
                else:
                    missing_types = expected_types - account_types
                    self.log_result("bank_accounts", "account_types", False, 
                                  f"Відсутні типи рахунків: {missing_types}")
                    
                # Verify Ukrainian banks
                bank_names = [acc.get("bankName", "") for acc in accounts]
                ukrainian_banks = ["ПриватБанк", "Ощадбанк", "Укрексімбанк"]
                found_banks = [bank for bank in ukrainian_banks if any(bank in name for name in bank_names)]
                if len(found_banks) >= 2:
                    self.log_result("bank_accounts", "ukrainian_banks", True, 
                                  f"Українські банки підтримуються: {found_banks}")
                else:
                    self.log_result("bank_accounts", "ukrainian_banks", False, 
                                  f"Недостатньо українських банків: {found_banks}")
            else:
                self.log_result("bank_accounts", "get_accounts", False, "Порожній список банківських рахунків")
        else:
            status = response.status_code if response else "No response"
            self.log_result("bank_accounts", "get_accounts", False, f"Помилка отримання банківських рахунків: {status}")

        return created_accounts > 0

    def test_role_based_access_control(self):
        """Test role-based access control for Financial APIs"""
        print("\n=== Testing Role-Based Access Control ===")
        
        # Test admin/manager access (should work)
        if self.hr_manager_token:
            old_token = self.auth_token
            self.auth_token = self.hr_manager_token
            
            test_account = {
                "code": "TEST001",
                "name": "Тестовий рахунок HR менеджера",
                "type": "asset",
                "currency": "UAH"
            }
            
            response = self.make_request("POST", "/finance/accounts", test_account)
            if response and response.status_code == 200:
                self.log_result("role_based_access", "hr_manager_create", True, 
                              "HR менеджер може створювати рахунки")
            else:
                status = response.status_code if response else "No response"
                self.log_result("role_based_access", "hr_manager_create", False, 
                              f"HR менеджер не може створювати рахунки: {status}")
            
            self.auth_token = old_token

        # Test warehouse user access (should be denied)
        if self.warehouse_token:
            old_token = self.auth_token
            self.auth_token = self.warehouse_token
            
            test_account = {
                "code": "TEST002",
                "name": "Тестовий рахунок складського працівника",
                "type": "asset",
                "currency": "UAH"
            }
            
            response = self.make_request("POST", "/finance/accounts", test_account)
            if response and response.status_code == 403:
                self.log_result("role_based_access", "warehouse_denied", True, 
                              "Складський працівник правильно заборонений доступ до фінансів")
            else:
                status = response.status_code if response else "No response"
                self.log_result("role_based_access", "warehouse_denied", False, 
                              f"RBAC не працює для складського працівника: {status}")
            
            # Test read access for warehouse user
            response = self.make_request("GET", "/finance/accounts")
            if response and response.status_code in [200, 403]:
                if response.status_code == 200:
                    self.log_result("role_based_access", "warehouse_read", True, 
                                  "Складський працівник може читати рахунки")
                else:
                    self.log_result("role_based_access", "warehouse_read_denied", True, 
                                  "Складський працівник заборонений читати рахунки")
            else:
                status = response.status_code if response else "No response"
                self.log_result("role_based_access", "warehouse_read", False, 
                              f"Помилка перевірки читання для складського працівника: {status}")
            
            self.auth_token = old_token

    def test_ukrainian_localization(self):
        """Test Ukrainian localization in API responses"""
        print("\n=== Testing Ukrainian Localization ===")
        
        if not self.auth_token:
            self.log_result("ukrainian_localization", "no_token", False, "No auth token available")
            return

        # Test error messages in Ukrainian
        invalid_account = {
            "code": "",  # Missing required field
            "name": "",
            "type": ""
        }
        
        response = self.make_request("POST", "/finance/accounts", invalid_account)
        if response and response.status_code == 400:
            error_msg = response.json().get("error", "")
            ukrainian_keywords = ["обов'язкові", "потрібна", "помилка", "код", "назва", "тип"]
            has_ukrainian = any(keyword in error_msg.lower() for keyword in ukrainian_keywords)
            if has_ukrainian:
                self.log_result("ukrainian_localization", "error_messages", True, 
                              f"Повідомлення про помилки українською: {error_msg}")
            else:
                self.log_result("ukrainian_localization", "error_messages", False, 
                              f"Повідомлення про помилки не українською: {error_msg}")
        else:
            self.log_result("ukrainian_localization", "error_messages", False, 
                          "Не вдалося перевірити українські повідомлення про помилки")

        # Test success messages in Ukrainian
        test_counterparty = {
            "name": "Тестовий контрагент для локалізації",
            "type": "company",
            "isCustomer": True
        }
        
        response = self.make_request("POST", "/finance/counterparties", test_counterparty)
        if response and response.status_code == 200:
            success_msg = response.json().get("message", "")
            ukrainian_success_keywords = ["успішно", "створено", "додано"]
            has_ukrainian_success = any(keyword in success_msg.lower() for keyword in ukrainian_success_keywords)
            if has_ukrainian_success:
                self.log_result("ukrainian_localization", "success_messages", True, 
                              f"Повідомлення про успіх українською: {success_msg}")
            else:
                self.log_result("ukrainian_localization", "success_messages", False, 
                              f"Повідомлення про успіх не українською: {success_msg}")
        else:
            self.log_result("ukrainian_localization", "success_messages", False, 
                          "Не вдалося перевірити українські повідомлення про успіх")

    def run_financial_tests(self):
        """Run all Financial Accounting API tests"""
        print("🏦 NOVA POSHTA ERP - FINANCIAL ACCOUNTING BACKEND APIs TESTING")
        print("=" * 80)
        print(f"Base URL: {self.base_url}")
        print(f"Test Time: {datetime.now().strftime('%Y-%m-%d %H:%M:%S')}")
        print("=" * 80)
        
        # Authentication
        if not self.test_nova_poshta_sso_login():
            print("❌ Authentication failed, stopping tests")
            return
        
        # Financial Accounting APIs
        print("\n💰 FINANCIAL ACCOUNTING APIs")
        self.test_chart_of_accounts_api()
        self.test_counterparties_api()
        self.test_journal_entries_api()
        self.test_bank_accounts_api()
        
        # Access Control and Localization
        print("\n🔐 SECURITY AND LOCALIZATION")
        self.test_role_based_access_control()
        self.test_ukrainian_localization()
        
        # Print summary
        self.print_summary()

    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 80)
        print("🏁 NOVA POSHTA FINANCIAL ACCOUNTING TEST SUMMARY")
        print("=" * 80)
        
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
            if category != "summary" and tests:
                print(f"\n{category.upper().replace('_', ' ')}:")
                for test_name, result in tests.items():
                    status = "✅" if result["success"] else "❌"
                    print(f"  {status} {test_name}: {result['message']}")

if __name__ == "__main__":
    tester = NovaPoshtaFinanceTester()
    tester.run_financial_tests()