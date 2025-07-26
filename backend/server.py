from fastapi import FastAPI, APIRouter, HTTPException, Depends, UploadFile, File
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from dotenv import load_dotenv
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
import os
import logging
from pathlib import Path
from pydantic import BaseModel, Field
from typing import List, Optional
import uuid
from datetime import datetime, timedelta
import jwt
import bcrypt
import base64

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

# MongoDB connection
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

# JWT configuration
JWT_SECRET = os.environ.get('JWT_SECRET', 'your-secret-key-change-in-production')
JWT_ALGORITHM = 'HS256'
JWT_EXPIRATION_HOURS = 24

# Create the main app without a prefix
app = FastAPI(title="Construction Management System")

# Create a router with the /api prefix
api_router = APIRouter(prefix="/api")

# Security
security = HTTPBearer()

# Models
class User(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    full_name: str
    phone_number: str
    email: Optional[str] = None
    company_name: str
    company_number: str
    username: str
    password_hash: str
    created_at: datetime = Field(default_factory=datetime.utcnow)

class UserCreate(BaseModel):
    full_name: str
    phone_number: str
    email: Optional[str] = None
    company_name: str
    company_number: str
    username: str
    password: str

class UserLogin(BaseModel):
    username_or_email: str
    password: str

class WorkSection(BaseModel):
    name: str
    percentage: float  # Percentage of total work this section represents

class Project(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    type: str  # "building" or "street"
    work_sections: List[WorkSection] = []  # Sections of work with percentages
    floors_count: int  # Number of floors
    address: str
    contact_phone1: str
    contact_phone2: Optional[str] = None
    total_amount: float
    progress_percentage: float = 0.0
    building_config: Optional[dict] = None  # For building projects
    street_config: Optional[dict] = None    # For street projects
    status: str = "active"  # "active", "completed", "cancelled"
    created_at: datetime = Field(default_factory=datetime.utcnow)

class ProjectCreate(BaseModel):
    name: str
    type: str
    work_sections: List[WorkSection] = []
    floors_count: int
    address: str
    contact_phone1: str
    contact_phone2: Optional[str] = None
    total_amount: float
    building_config: Optional[dict] = None
    street_config: Optional[dict] = None

class Worker(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    name: str
    id_number: Optional[str] = None
    id_image: Optional[str] = None  # Base64 encoded image
    payment_type: str  # "hourly", "daily", "monthly"
    payment_amount: float
    created_at: datetime = Field(default_factory=datetime.utcnow)

class WorkerCreate(BaseModel):
    name: str
    id_number: Optional[str] = None
    id_image: Optional[str] = None
    payment_type: str
    payment_amount: float

class Expense(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    project_id: Optional[str] = None
    type: str  # "equipment", "fuel", "gifts", "vehicle", "office"
    amount: float
    description: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)

class ExpenseCreate(BaseModel):
    project_id: Optional[str] = None
    type: str
    amount: float
    description: Optional[str] = None

class Income(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    project_id: str
    amount_before_tax: float
    description: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)

class IncomeCreate(BaseModel):
    project_id: str
    amount_before_tax: float
    description: Optional[str] = None

class WorkDay(BaseModel):
    id: str = Field(default_factory=lambda: str(uuid.uuid4()))
    user_id: str
    project_id: str
    work_section: str  # Section name that was worked on
    floor_number: int  # Floor number worked on
    work_percentage: float  # Percentage of work completed in this section
    workers: List[str]  # List of worker IDs
    vehicle_used: Optional[str] = None
    notes: Optional[str] = None
    date: datetime = Field(default_factory=datetime.utcnow)

class WorkDayCreate(BaseModel):
    project_id: str
    work_section: str
    floor_number: int
    work_percentage: float
    workers: List[str]
    vehicle_used: Optional[str] = None
    notes: Optional[str] = None

# Utility functions
def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

def verify_password(password: str, hashed: str) -> bool:
    return bcrypt.checkpw(password.encode('utf-8'), hashed.encode('utf-8'))

def create_access_token(data: dict):
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(hours=JWT_EXPIRATION_HOURS)
    to_encode.update({"exp": expire})
    encoded_jwt = jwt.encode(to_encode, JWT_SECRET, algorithm=JWT_ALGORITHM)
    return encoded_jwt

def decode_token(token: str):
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        return payload
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.JWTError:
        raise HTTPException(status_code=401, detail="Invalid token")

async def get_current_user(credentials: HTTPAuthorizationCredentials = Depends(security)):
    token = credentials.credentials
    payload = decode_token(token)
    user_id = payload.get("user_id")
    if user_id is None:
        raise HTTPException(status_code=401, detail="Invalid token")
    
    user = await db.users.find_one({"id": user_id})
    if user is None:
        raise HTTPException(status_code=401, detail="User not found")
    
    return user

# Authentication routes
@api_router.post("/auth/register")
async def register(user_data: UserCreate):
    # Check if username or email already exists
    existing_user = await db.users.find_one({
        "$or": [
            {"username": user_data.username},
            {"email": user_data.email} if user_data.email else {"username": user_data.username}
        ]
    })
    
    if existing_user:
        raise HTTPException(status_code=400, detail="Username or email already exists")
    
    # Create new user
    user = User(
        **user_data.dict(exclude={"password"}),
        password_hash=hash_password(user_data.password)
    )
    
    await db.users.insert_one(user.dict())
    
    # Create access token
    access_token = create_access_token({"user_id": user.id})
    
    return {"access_token": access_token, "token_type": "bearer", "user": user.dict()}

@api_router.post("/auth/login")
async def login(credentials: UserLogin):
    # Find user by username or email
    user = await db.users.find_one({
        "$or": [
            {"username": credentials.username_or_email},
            {"email": credentials.username_or_email}
        ]
    })
    
    if not user or not verify_password(credentials.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid credentials")
    
    # Create access token
    access_token = create_access_token({"user_id": user["id"]})
    
    return {"access_token": access_token, "token_type": "bearer", "user": user}

# Project routes
@api_router.post("/projects", response_model=Project)
async def create_project(project_data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    project = Project(**project_data.dict(), user_id=current_user["id"])
    await db.projects.insert_one(project.dict())
    return project

@api_router.get("/projects", response_model=List[Project])
async def get_projects(current_user: dict = Depends(get_current_user)):
    projects = await db.projects.find({"user_id": current_user["id"]}).to_list(1000)
    return [Project(**project) for project in projects]

@api_router.get("/projects/{project_id}", response_model=Project)
async def get_project(project_id: str, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id, "user_id": current_user["id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    return Project(**project)

@api_router.put("/projects/{project_id}", response_model=Project)
async def update_project(project_id: str, project_data: ProjectCreate, current_user: dict = Depends(get_current_user)):
    project = await db.projects.find_one({"id": project_id, "user_id": current_user["id"]})
    if not project:
        raise HTTPException(status_code=404, detail="Project not found")
    
    updated_project = Project(**project_data.dict(), id=project_id, user_id=current_user["id"])
    await db.projects.replace_one({"id": project_id}, updated_project.dict())
    return updated_project

# Worker routes
@api_router.post("/workers", response_model=Worker)
async def create_worker(worker_data: WorkerCreate, current_user: dict = Depends(get_current_user)):
    worker = Worker(**worker_data.dict(), user_id=current_user["id"])
    await db.workers.insert_one(worker.dict())
    return worker

@api_router.get("/workers", response_model=List[Worker])
async def get_workers(current_user: dict = Depends(get_current_user)):
    workers = await db.workers.find({"user_id": current_user["id"]}).to_list(1000)
    return [Worker(**worker) for worker in workers]

# Expense routes
@api_router.post("/expenses", response_model=Expense)
async def create_expense(expense_data: ExpenseCreate, current_user: dict = Depends(get_current_user)):
    expense = Expense(**expense_data.dict(), user_id=current_user["id"])
    await db.expenses.insert_one(expense.dict())
    return expense

@api_router.get("/expenses", response_model=List[Expense])
async def get_expenses(current_user: dict = Depends(get_current_user)):
    expenses = await db.expenses.find({"user_id": current_user["id"]}).to_list(1000)
    return [Expense(**expense) for expense in expenses]

# Income routes
@api_router.post("/incomes", response_model=Income)
async def create_income(income_data: IncomeCreate, current_user: dict = Depends(get_current_user)):
    income = Income(**income_data.dict(), user_id=current_user["id"])
    await db.incomes.insert_one(income.dict())
    return income

@api_router.get("/incomes", response_model=List[Income])
async def get_incomes(current_user: dict = Depends(get_current_user)):
    incomes = await db.incomes.find({"user_id": current_user["id"]}).to_list(1000)
    return [Income(**income) for income in incomes]

# Work day routes
@api_router.post("/workdays", response_model=WorkDay)
async def create_workday(workday_data: WorkDayCreate, current_user: dict = Depends(get_current_user)):
    workday = WorkDay(**workday_data.dict(), user_id=current_user["id"])
    await db.workdays.insert_one(workday.dict())
    return workday

@api_router.get("/workdays", response_model=List[WorkDay])
async def get_workdays(current_user: dict = Depends(get_current_user)):
    workdays = await db.workdays.find({"user_id": current_user["id"]}).to_list(1000)
    return [WorkDay(**workday) for workday in workdays]

# Reports routes
@api_router.get("/reports/financial")
async def get_financial_report(
    period: Optional[str] = None,  # "monthly", "yearly", or None for all time
    project_id: Optional[str] = None,  # Filter by specific project
    current_user: dict = Depends(get_current_user)
):
    # Build date filter
    date_filter = {}
    if period == "monthly":
        # Current month
        now = datetime.utcnow()
        start_date = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)
        date_filter = {"date": {"$gte": start_date}}
    elif period == "yearly":
        # Current year
        now = datetime.utcnow()
        start_date = now.replace(month=1, day=1, hour=0, minute=0, second=0, microsecond=0)
        date_filter = {"date": {"$gte": start_date}}
    
    # Build project filter
    project_filter = {}
    if project_id:
        project_filter = {"project_id": project_id}
    
    # Combine filters
    expense_filter = {"user_id": current_user["id"], **date_filter, **project_filter}
    income_filter = {"user_id": current_user["id"], **date_filter, **project_filter}
    workday_filter = {"user_id": current_user["id"], **date_filter, **project_filter}
    
    # Get filtered data
    expenses = await db.expenses.find(expense_filter).to_list(1000)
    incomes = await db.incomes.find(income_filter).to_list(1000)
    workdays = await db.workdays.find(workday_filter).to_list(1000)
    workers = await db.workers.find({"user_id": current_user["id"]}).to_list(1000)
    
    total_expenses = sum(expense["amount"] for expense in expenses)
    total_incomes = sum(income["amount_before_tax"] for income in incomes)
    
    # Calculate worker payments (simplified)
    worker_payments = 0
    for workday in workdays:
        for worker_id in workday["workers"]:
            worker = next((w for w in workers if w["id"] == worker_id), None)
            if worker:
                if worker["payment_type"] == "daily":
                    worker_payments += worker["payment_amount"]
    
    profit = total_incomes - total_expenses - worker_payments
    
    return {
        "total_incomes": total_incomes,
        "total_expenses": total_expenses,
        "worker_payments": worker_payments,
        "profit": profit,
        "period": period,
        "project_id": project_id
    }

@api_router.get("/reports/projects")
async def get_projects_financial_summary(current_user: dict = Depends(get_current_user)):
    """Get financial summary for each project"""
    projects = await db.projects.find({"user_id": current_user["id"]}).to_list(1000)
    
    project_summaries = []
    for project in projects:
        # Get expenses for this project
        project_expenses = await db.expenses.find({
            "user_id": current_user["id"],
            "project_id": project["id"]
        }).to_list(1000)
        
        # Get incomes for this project
        project_incomes = await db.incomes.find({
            "user_id": current_user["id"],
            "project_id": project["id"]
        }).to_list(1000)
        
        # Get workdays for this project
        project_workdays = await db.workdays.find({
            "user_id": current_user["id"],
            "project_id": project["id"]
        }).to_list(1000)
        
        # Calculate worker payments for this project
        workers = await db.workers.find({"user_id": current_user["id"]}).to_list(1000)
        worker_payments = 0
        for workday in project_workdays:
            for worker_id in workday["workers"]:
                worker = next((w for w in workers if w["id"] == worker_id), None)
                if worker:
                    if worker["payment_type"] == "daily":
                        worker_payments += worker["payment_amount"]
        
        total_expenses = sum(expense["amount"] for expense in project_expenses)
        total_incomes = sum(income["amount_before_tax"] for income in project_incomes)
        profit = total_incomes - total_expenses - worker_payments
        
        # Calculate progress based on work sections
        total_work_done = 0
        if project.get("work_sections"):
            for workday in project_workdays:
                section_name = workday.get("work_section", "")
                section = next((s for s in project["work_sections"] if s["name"] == section_name), None)
                if section:
                    # Simple progress calculation
                    total_work_done += (workday.get("work_percentage", 0) * section["percentage"] / 100)
        
        project_summaries.append({
            "project_id": project["id"],
            "project_name": project["name"],
            "total_amount": project["total_amount"],
            "total_expenses": total_expenses,
            "total_incomes": total_incomes,
            "worker_payments": worker_payments,
            "profit": profit,
            "progress_percentage": min(total_work_done, 100),  # Cap at 100%
            "status": project["status"]
        })
    
    return project_summaries

# Include the router in the main app
app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(name)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()