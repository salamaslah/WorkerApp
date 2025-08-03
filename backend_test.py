#!/usr/bin/env python3
"""
Backend API Testing for Construction Management System
Tests all authentication, project management, worker management, 
financial tracking, and reporting endpoints.
"""

import requests
import json
import sys
from datetime import datetime

# Backend URL from frontend/.env
BASE_URL = "https://524266a7-c33c-4396-8f1c-b7d0b8bfd59d.preview.emergentagent.com/api"

class ConstructionAPITester:
    def __init__(self):
        self.base_url = BASE_URL
        self.access_token = None
        self.user_id = None
        self.project_id = None
        self.worker_id = None
        self.test_results = []
        
    def log_test(self, test_name, success, details=""):
        """Log test results"""
        status = "✅ PASS" if success else "❌ FAIL"
        print(f"{status} {test_name}")
        if details:
            print(f"   Details: {details}")
        self.test_results.append({
            "test": test_name,
            "success": success,
            "details": details
        })
        
    def make_request(self, method, endpoint, data=None, headers=None):
        """Make HTTP request with error handling"""
        url = f"{self.base_url}{endpoint}"
        
        if headers is None:
            headers = {"Content-Type": "application/json"}
            
        if self.access_token and "Authorization" not in headers:
            headers["Authorization"] = f"Bearer {self.access_token}"
            
        try:
            if method == "GET":
                response = requests.get(url, headers=headers, timeout=30)
            elif method == "POST":
                response = requests.post(url, json=data, headers=headers, timeout=30)
            elif method == "PUT":
                response = requests.put(url, json=data, headers=headers, timeout=30)
            else:
                raise ValueError(f"Unsupported method: {method}")
                
            return response
        except requests.exceptions.RequestException as e:
            print(f"Request failed: {e}")
            return None
            
    def test_user_registration(self):
        """Test user registration endpoint"""
        print("\n=== Testing User Registration ===")
        
        # Use timestamp to ensure unique username
        import time
        timestamp = str(int(time.time()))
        
        user_data = {
            "full_name": "أحمد محمد البناء",
            "phone_number": "+972-50-123-4567",
            "email": f"ahmed.construction.{timestamp}@example.com",
            "company_name": "شركة البناء المتقدم",
            "company_number": "123456789",
            "username": f"ahmed_builder_{timestamp}",
            "password": "SecurePass123!"
        }
        
        response = self.make_request("POST", "/auth/register", user_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data and "user" in data:
                self.access_token = data["access_token"]
                self.user_id = data["user"]["id"]
                self.log_test("User Registration", True, f"User ID: {self.user_id}")
                return True
            else:
                self.log_test("User Registration", False, "Missing access_token or user in response")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("User Registration", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_user_login(self):
        """Test user login endpoint"""
        print("\n=== Testing User Login ===")
        
        # Use the same timestamp-based username from registration
        import time
        timestamp = str(int(time.time()))
        
        login_data = {
            "username_or_email": f"ahmed_builder_{timestamp}",
            "password": "SecurePass123!"
        }
        
        response = self.make_request("POST", "/auth/login", login_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "access_token" in data:
                # Update token for subsequent tests
                self.access_token = data["access_token"]
                self.log_test("User Login", True, "Login successful")
                return True
            else:
                self.log_test("User Login", False, "Missing access_token in response")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("User Login", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_create_project(self):
        """Test project creation endpoint with new structure"""
        print("\n=== Testing Project Creation ===")
        
        # Test building project with work_sections and work_additions
        project_data = {
            "name": "مشروع بناء فيلا سكنية",
            "type": "building",
            "work_sections": [
                {"name": "حفر الأساسات", "percentage": 15.0},
                {"name": "صب الأساسات", "percentage": 20.0},
                {"name": "بناء الجدران", "percentage": 35.0},
                {"name": "أعمال السقف", "percentage": 20.0}
            ],
            "work_additions": [
                {"name": "أسوار", "percentage": 5.0},
                {"name": "طبقات سفلية", "percentage": 3.0},
                {"name": "أسقف إضافية", "percentage": 2.0}
            ],
            "floors_count": 3,
            "address": "شارع الملك فيصل، مقابل مسجد النور، رام الله - حي الزهراء",
            "contact_phone1": "+972-59-876-5432",
            "contact_phone2": "+972-2-234-5678",
            "total_amount": 850000.0,
            "building_config": {
                "apartments_per_floor": 2,
                "total_apartments": 6,
                "building_area": 800
            }
        }
        
        # Verify total percentage equals 100%
        total_sections = sum(section["percentage"] for section in project_data["work_sections"])
        total_additions = sum(addition["percentage"] for addition in project_data["work_additions"])
        total_percentage = total_sections + total_additions
        
        if abs(total_percentage - 100.0) > 0.01:
            self.log_test("Project Percentage Validation", False, f"Total percentage should be 100%, got {total_percentage}%")
            return False
        else:
            self.log_test("Project Percentage Validation", True, f"Total percentage: {total_percentage}%")
        
        response = self.make_request("POST", "/projects", project_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and "work_sections" in data and "work_additions" in data and "floors_count" in data:
                self.project_id = data["id"]
                self.log_test("Building Project Creation", True, f"Project ID: {self.project_id}, Floors: {data['floors_count']}")
                
                # Verify work_sections and work_additions are preserved
                if len(data["work_sections"]) == 4 and len(data["work_additions"]) == 3:
                    self.log_test("Project Structure Validation", True, f"Sections: {len(data['work_sections'])}, Additions: {len(data['work_additions'])}")
                    return True
                else:
                    self.log_test("Project Structure Validation", False, f"Expected 4 sections and 3 additions, got {len(data['work_sections'])} and {len(data['work_additions'])}")
                    return False
            else:
                self.log_test("Building Project Creation", False, "Missing project data in response")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Building Project Creation", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_get_projects(self):
        """Test getting user's projects"""
        print("\n=== Testing Get Projects ===")
        
        response = self.make_request("GET", "/projects")
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get Projects", True, f"Retrieved {len(data)} projects")
                return True
            else:
                self.log_test("Get Projects", False, "Response is not a list")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Projects", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_get_single_project(self):
        """Test getting a specific project"""
        print("\n=== Testing Get Single Project ===")
        
        if not self.project_id:
            self.log_test("Get Single Project", False, "No project ID available")
            return False
            
        response = self.make_request("GET", f"/projects/{self.project_id}")
        
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and data["id"] == self.project_id:
                self.log_test("Get Single Project", True, f"Retrieved project: {data.get('name', 'Unknown')}")
                return True
            else:
                self.log_test("Get Single Project", False, "Project ID mismatch")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Single Project", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_update_project(self):
        """Test updating a project with new structure"""
        print("\n=== Testing Update Project ===")
        
        if not self.project_id:
            self.log_test("Update Project", False, "No project ID available")
            return False
            
        update_data = {
            "name": "مشروع بناء مجمع سكني - حي الزهراء (محدث)",
            "type": "building",
            "work_sections": [
                {"name": "حفر الأساسات", "percentage": 15.0},
                {"name": "صب الأساسات", "percentage": 20.0},
                {"name": "بناء الجدران", "percentage": 35.0},
                {"name": "أعمال السقف", "percentage": 25.0},
                {"name": "التشطيبات النهائية", "percentage": 5.0}
            ],
            "floors_count": 5,
            "address": "شارع الملك فيصل، مقابل مسجد النور، رام الله - حي الزهراء",
            "contact_phone1": "+972-59-876-5432",
            "contact_phone2": "+972-2-234-5678",
            "total_amount": 950000.0,
            "building_config": {
                "apartments_per_floor": 4,
                "total_apartments": 20,
                "building_area": 1500
            }
        }
        
        response = self.make_request("PUT", f"/projects/{self.project_id}", update_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "total_amount" in data and data["total_amount"] == 950000.0:
                self.log_test("Update Project", True, "Project updated successfully")
                return True
            else:
                self.log_test("Update Project", False, "Project not updated correctly")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Update Project", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_create_worker(self):
        """Test worker creation endpoint"""
        print("\n=== Testing Worker Creation ===")
        
        worker_data = {
            "name": "محمد أحمد العامل",
            "id_number": "123456789",
            "payment_type": "daily",
            "payment_amount": 150.0
        }
        
        response = self.make_request("POST", "/workers", worker_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data:
                self.worker_id = data["id"]
                self.log_test("Worker Creation", True, f"Worker ID: {self.worker_id}")
                return True
            else:
                self.log_test("Worker Creation", False, "Missing worker ID in response")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Worker Creation", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_get_workers(self):
        """Test getting user's workers"""
        print("\n=== Testing Get Workers ===")
        
        response = self.make_request("GET", "/workers")
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get Workers", True, f"Retrieved {len(data)} workers")
                return True
            else:
                self.log_test("Get Workers", False, "Response is not a list")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Workers", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_create_expense(self):
        """Test expense creation endpoint"""
        print("\n=== Testing Expense Creation ===")
        
        expense_data = {
            "project_id": self.project_id,
            "type": "equipment",
            "amount": 2500.0,
            "description": "شراء أدوات بناء ومعدات حفر"
        }
        
        response = self.make_request("POST", "/expenses", expense_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and "amount" in data:
                self.log_test("Expense Creation", True, f"Expense amount: {data['amount']}")
                return True
            else:
                self.log_test("Expense Creation", False, "Missing expense data in response")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Expense Creation", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_get_expenses(self):
        """Test getting user's expenses"""
        print("\n=== Testing Get Expenses ===")
        
        response = self.make_request("GET", "/expenses")
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get Expenses", True, f"Retrieved {len(data)} expenses")
                return True
            else:
                self.log_test("Get Expenses", False, "Response is not a list")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Expenses", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_create_income(self):
        """Test income creation endpoint with new tax structure"""
        print("\n=== Testing Income Creation ===")
        
        if not self.project_id:
            self.log_test("Income Creation", False, "No project ID available")
            return False
            
        # Test with 17% tax
        income_data = {
            "project_id": self.project_id,
            "amount_with_tax": 29250.0,  # Amount including 17% tax
            "tax_percentage": 17.0,
            "description": "دفعة أولى من العميل لمشروع البناء"
        }
        
        response = self.make_request("POST", "/incomes", income_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and "amount_before_tax" in data and "amount_with_tax" in data:
                # Verify calculation: amount_before_tax = amount_with_tax / (1 + tax_percentage/100)
                expected_before_tax = 29250.0 / (1 + 17.0/100)  # Should be 25000.0
                actual_before_tax = data["amount_before_tax"]
                
                if abs(actual_before_tax - expected_before_tax) < 0.01:  # Allow small floating point differences
                    self.log_test("Income Creation (17% tax)", True, f"Before tax: {actual_before_tax}, With tax: {data['amount_with_tax']}")
                else:
                    self.log_test("Income Creation (17% tax)", False, f"Tax calculation error. Expected: {expected_before_tax}, Got: {actual_before_tax}")
                    return False
            else:
                self.log_test("Income Creation (17% tax)", False, "Missing income data in response")
                return False
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Income Creation (17% tax)", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False
        
        # Test with 15% tax
        income_data_15 = {
            "project_id": self.project_id,
            "amount_with_tax": 23000.0,  # Amount including 15% tax
            "tax_percentage": 15.0,
            "description": "دفعة ثانية من العميل"
        }
        
        response = self.make_request("POST", "/incomes", income_data_15)
        
        if response and response.status_code == 200:
            data = response.json()
            expected_before_tax = 23000.0 / (1 + 15.0/100)  # Should be 20000.0
            actual_before_tax = data["amount_before_tax"]
            
            if abs(actual_before_tax - expected_before_tax) < 0.01:
                self.log_test("Income Creation (15% tax)", True, f"Before tax: {actual_before_tax}, With tax: {data['amount_with_tax']}")
            else:
                self.log_test("Income Creation (15% tax)", False, f"Tax calculation error. Expected: {expected_before_tax}, Got: {actual_before_tax}")
                return False
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Income Creation (15% tax)", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False
        
        # Test with 0% tax
        income_data_0 = {
            "project_id": self.project_id,
            "amount_with_tax": 10000.0,  # Amount with no tax
            "tax_percentage": 0.0,
            "description": "دفعة بدون ضريبة"
        }
        
        response = self.make_request("POST", "/incomes", income_data_0)
        
        if response and response.status_code == 200:
            data = response.json()
            expected_before_tax = 10000.0 / (1 + 0.0/100)  # Should be 10000.0
            actual_before_tax = data["amount_before_tax"]
            
            if abs(actual_before_tax - expected_before_tax) < 0.01:
                self.log_test("Income Creation (0% tax)", True, f"Before tax: {actual_before_tax}, With tax: {data['amount_with_tax']}")
                return True
            else:
                self.log_test("Income Creation (0% tax)", False, f"Tax calculation error. Expected: {expected_before_tax}, Got: {actual_before_tax}")
                return False
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Income Creation (0% tax)", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False
        
    def test_get_incomes(self):
        """Test getting user's incomes"""
        print("\n=== Testing Get Incomes ===")
        
        response = self.make_request("GET", "/incomes")
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get Incomes", True, f"Retrieved {len(data)} incomes")
                return True
            else:
                self.log_test("Get Incomes", False, "Response is not a list")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Incomes", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_create_workday(self):
        """Test workday creation endpoint with new structure"""
        print("\n=== Testing Workday Creation ===")
        
        if not self.project_id or not self.worker_id:
            self.log_test("Workday Creation", False, "Missing project ID or worker ID")
            return False
            
        # Test workday for building project (with floor_number)
        workday_data = {
            "project_id": self.project_id,
            "work_section": "بناء الجدران",
            "work_area": "الطابق الثاني - الغرفة الرئيسية",
            "floor_number": 2,
            "work_percentage": 25.0,
            "workers": [self.worker_id],
            "vehicle_used": "شاحنة صغيرة",
            "notes": "تم إنجاز 25% من أعمال بناء الجدران في الطابق الثاني"
        }
        
        response = self.make_request("POST", "/workdays", workday_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and "work_section" in data and "work_area" in data and "floor_number" in data:
                self.log_test("Workday Creation (Building)", True, f"Section: {data['work_section']}, Area: {data['work_area']}, Floor: {data['floor_number']}")
            else:
                self.log_test("Workday Creation (Building)", False, "Missing workday data in response")
                return False
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Workday Creation (Building)", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False
        
        return True
        
    def test_create_street_project_and_workday(self):
        """Test creating street project and workday without floor_number"""
        print("\n=== Testing Street Project and Workday ===")
        
        # Create street project
        street_project_data = {
            "name": "مشروع ترصيف شارع الملك فهد",
            "type": "street",
            "work_sections": [
                {"name": "حفر الطريق", "percentage": 20.0},
                {"name": "وضع الأساس", "percentage": 30.0},
                {"name": "الترصيف", "percentage": 40.0},
                {"name": "الخطوط والإشارات", "percentage": 10.0}
            ],
            "work_additions": [
                {"name": "أرصفة جانبية", "percentage": 15.0},
                {"name": "إنارة الشارع", "percentage": 10.0}
            ],
            "street_length": 2500.5,
            "address": "شارع الملك فهد، من دوار المنارة إلى دوار الساعة، رام الله",
            "contact_phone1": "+972-59-111-2222",
            "contact_phone2": "+972-2-333-4444",
            "total_amount": 450000.0,
            "street_config": {
                "width": 12.0,
                "lanes": 4,
                "sidewalk_width": 2.5
            }
        }
        
        response = self.make_request("POST", "/projects", street_project_data)
        
        if response and response.status_code == 200:
            data = response.json()
            if "id" in data and data["type"] == "street" and "street_length" in data:
                street_project_id = data["id"]
                self.log_test("Street Project Creation", True, f"Street length: {data['street_length']}m")
                
                # Test workday for street project (without floor_number)
                street_workday_data = {
                    "project_id": street_project_id,
                    "work_section": "الترصيف",
                    "work_area": "من الكيلومتر 1 إلى الكيلومتر 1.5",
                    "work_percentage": 30.0,
                    "workers": [self.worker_id],
                    "vehicle_used": "آلة الترصيف",
                    "notes": "تم ترصيف 500 متر من الشارع"
                }
                
                response = self.make_request("POST", "/workdays", street_workday_data)
                
                if response and response.status_code == 200:
                    data = response.json()
                    if "id" in data and "work_section" in data and "work_area" in data:
                        # Verify floor_number is None or not present for street projects
                        floor_number = data.get("floor_number")
                        if floor_number is None:
                            self.log_test("Street Workday Creation", True, f"Section: {data['work_section']}, Area: {data['work_area']}, No floor number")
                            return True
                        else:
                            self.log_test("Street Workday Creation", False, f"Street workday should not have floor_number, got: {floor_number}")
                            return False
                    else:
                        self.log_test("Street Workday Creation", False, "Missing workday data in response")
                        return False
                else:
                    error_msg = response.text if response else "No response"
                    self.log_test("Street Workday Creation", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
                    return False
            else:
                self.log_test("Street Project Creation", False, "Missing street project data in response")
                return False
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Street Project Creation", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
            return False
        
    def test_get_workdays(self):
        """Test getting user's workdays"""
        print("\n=== Testing Get Workdays ===")
        
        response = self.make_request("GET", "/workdays")
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                self.log_test("Get Workdays", True, f"Retrieved {len(data)} workdays")
                return True
            else:
                self.log_test("Get Workdays", False, "Response is not a list")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Get Workdays", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_financial_report(self):
        """Test financial reporting endpoint"""
        print("\n=== Testing Financial Report ===")
        
        response = self.make_request("GET", "/reports/financial")
        
        if response and response.status_code == 200:
            data = response.json()
            required_fields = ["total_incomes", "total_expenses", "worker_payments", "profit"]
            if all(field in data for field in required_fields):
                self.log_test("Financial Report", True, f"Profit: {data['profit']}")
                return True
            else:
                missing = [f for f in required_fields if f not in data]
                self.log_test("Financial Report", False, f"Missing fields: {missing}")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Financial Report", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_financial_report_with_filters(self):
        """Test financial reporting with period and project filters"""
        print("\n=== Testing Financial Report with Filters ===")
        
        # Test monthly filter
        response = self.make_request("GET", "/reports/financial?period=monthly")
        if response and response.status_code == 200:
            data = response.json()
            if "period" in data and data["period"] == "monthly":
                self.log_test("Financial Report (Monthly)", True, f"Monthly profit: {data.get('profit', 0)}")
            else:
                self.log_test("Financial Report (Monthly)", False, "Period filter not working")
        else:
            self.log_test("Financial Report (Monthly)", False, f"Status: {response.status_code if response else 'None'}")
        
        # Test yearly filter
        response = self.make_request("GET", "/reports/financial?period=yearly")
        if response and response.status_code == 200:
            data = response.json()
            if "period" in data and data["period"] == "yearly":
                self.log_test("Financial Report (Yearly)", True, f"Yearly profit: {data.get('profit', 0)}")
            else:
                self.log_test("Financial Report (Yearly)", False, "Period filter not working")
        else:
            self.log_test("Financial Report (Yearly)", False, f"Status: {response.status_code if response else 'None'}")
        
        # Test project filter
        if self.project_id:
            response = self.make_request("GET", f"/reports/financial?project_id={self.project_id}")
            if response and response.status_code == 200:
                data = response.json()
                if "project_id" in data and data["project_id"] == self.project_id:
                    self.log_test("Financial Report (Project Filter)", True, f"Project profit: {data.get('profit', 0)}")
                else:
                    self.log_test("Financial Report (Project Filter)", False, "Project filter not working")
            else:
                self.log_test("Financial Report (Project Filter)", False, f"Status: {response.status_code if response else 'None'}")
        
        return True
        
    def test_projects_financial_summary(self):
        """Test projects financial summary endpoint"""
        print("\n=== Testing Projects Financial Summary ===")
        
        response = self.make_request("GET", "/reports/projects")
        
        if response and response.status_code == 200:
            data = response.json()
            if isinstance(data, list):
                if len(data) > 0:
                    project = data[0]
                    required_fields = ["project_id", "project_name", "total_amount", "total_expenses", 
                                     "total_incomes", "worker_payments", "profit", "progress_percentage", "status"]
                    if all(field in project for field in required_fields):
                        self.log_test("Projects Financial Summary", True, f"Retrieved {len(data)} project summaries")
                        return True
                    else:
                        missing = [f for f in required_fields if f not in project]
                        self.log_test("Projects Financial Summary", False, f"Missing fields: {missing}")
                else:
                    self.log_test("Projects Financial Summary", True, "No projects found (empty list)")
                    return True
            else:
                self.log_test("Projects Financial Summary", False, "Response is not a list")
        else:
            error_msg = response.text if response else "No response"
            self.log_test("Projects Financial Summary", False, f"Status: {response.status_code if response else 'None'}, Error: {error_msg}")
        
        return False
        
    def test_jwt_authentication(self):
        """Test JWT token validation"""
        print("\n=== Testing JWT Authentication ===")
        
        # Test with invalid token
        old_token = self.access_token
        self.access_token = "invalid_token_123"
        
        response = self.make_request("GET", "/projects")
        
        if response and response.status_code == 401:
            self.log_test("JWT Authentication (Invalid Token)", True, "Correctly rejected invalid token")
            # Restore valid token
            self.access_token = old_token
            return True
        else:
            self.log_test("JWT Authentication (Invalid Token)", False, "Should have rejected invalid token")
            self.access_token = old_token
            return False
            
    def run_all_tests(self):
        """Run all API tests"""
        print("🚀 Starting Construction Management API Tests")
        print(f"Backend URL: {self.base_url}")
        print("=" * 60)
        
        # Authentication tests
        if not self.test_user_registration():
            print("❌ Registration failed - stopping tests")
            return False
            
        if not self.test_user_login():
            print("❌ Login failed - stopping tests")
            return False
            
        # JWT validation test
        self.test_jwt_authentication()
        
        # Project management tests
        self.test_create_project()
        self.test_get_projects()
        self.test_get_single_project()
        self.test_update_project()
        
        # Worker management tests
        self.test_create_worker()
        self.test_get_workers()
        
        # Financial tracking tests
        self.test_create_expense()
        self.test_get_expenses()
        self.test_create_income()
        self.test_get_incomes()
        
        # Work day tracking tests
        self.test_create_workday()
        self.test_get_workdays()
        
        # Reporting tests
        self.test_financial_report()
        self.test_financial_report_with_filters()
        self.test_projects_financial_summary()
        
        # Print summary
        self.print_summary()
        
        return True
        
    def print_summary(self):
        """Print test summary"""
        print("\n" + "=" * 60)
        print("📊 TEST SUMMARY")
        print("=" * 60)
        
        passed = sum(1 for result in self.test_results if result["success"])
        total = len(self.test_results)
        
        print(f"Total Tests: {total}")
        print(f"Passed: {passed}")
        print(f"Failed: {total - passed}")
        print(f"Success Rate: {(passed/total)*100:.1f}%")
        
        if total - passed > 0:
            print("\n❌ Failed Tests:")
            for result in self.test_results:
                if not result["success"]:
                    print(f"  - {result['test']}: {result['details']}")
        
        print("\n" + "=" * 60)

if __name__ == "__main__":
    tester = ConstructionAPITester()
    tester.run_all_tests()