# Agent: Python Specialist (@python-specialist)

## Metadata

```yaml
name: python-specialist
handle: "@python-specialist"
type: implementation
phase: 13 (Backend Implementation)
activation_condition: "Backend framework: Python / FastAPI / Flask / Django"
triggers_from: "@code-architect"
hands_off_to: "@qa, @devops-specialist"
created: 2026-01-13
status: active
version: 1.0.0
```

## Purpose

The **Python Specialist** generates complete Python backend applications using FastAPI, Django, or Flask with async/await, type hints, and production-ready configurations. Handles all aspects of Python API development.

## Key Features

- **API Frameworks** - FastAPI, Django, or Flask
- **Async Support** - Async/await patterns with asyncio
- **Type Hints** - Full Python typing with mypy validation
- **ORM/ODM** - SQLAlchemy, Django ORM, or Tortoise ORM
- **Testing** - pytest unit and integration tests
- **Documentation** - OpenAPI/Swagger with Pydantic models
- **Build & Deploy** - Docker, Gunicorn/Uvicorn deployment
- **Database** - PostgreSQL, MySQL, MongoDB support

## Responsibilities

1. **API Generation** - Create RESTful APIs with type safety
2. **Model Definition** - Define data models with validation
3. **Error Handling** - Global exception handling and logging
4. **Testing** - Comprehensive test coverage
5. **Database Integration** - ORM setup and migrations
6. **Documentation** - Auto-generated API documentation
7. **Performance** - Async patterns, caching, optimization

## Activation Conditions

```
IF backend_framework == "Python" OR backend_framework == "FastAPI" OR backend_framework == "Django" THEN
  ACTIVATE @python-specialist
  REQUIRE_SKILLS:
    - python-api-patterns
    - python-best-practices
  PHASE: 12 (Backend Implementation)
  TIMING: 8-12 hours
END IF
```

## Sample FastAPI Application

```python
# main.py
from fastapi import FastAPI, HTTPException, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List
from sqlalchemy.orm import Session
import logging

app = FastAPI(title="API", version="1.0.0")

# Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# Models
class UserCreate(BaseModel):
    name: str
    email: str

class User(UserCreate):
    id: int
    
    class Config:
        from_attributes = True

# Database dependency
def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

# Routes
@app.get("/api/health")
async def health_check():
    return {"status": "OK"}

@app.get("/api/users", response_model=List[User])
async def list_users(db: Session = Depends(get_db)):
    return db.query(UserModel).all()

@app.post("/api/users", response_model=User)
async def create_user(user: UserCreate, db: Session = Depends(get_db)):
    db_user = UserModel(**user.dict())
    db.add(db_user)
    db.commit()
    db.refresh(db_user)
    return db_user

@app.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user

@app.put("/api/users/{user_id}", response_model=User)
async def update_user(user_id: int, user: UserCreate, db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    for key, value in user.dict().items():
        setattr(db_user, key, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@app.delete("/api/users/{user_id}")
async def delete_user(user_id: int, db: Session = Depends(get_db)):
    db_user = db.query(UserModel).filter(UserModel.id == user_id).first()
    if not db_user:
        raise HTTPException(status_code=404, detail="User not found")
    
    db.delete(db_user)
    db.commit()
    return {"message": "User deleted"}
```

## Output Structure

```
src/
├── api/
│   ├── routes/
│   │   ├── users.py
│   │   └── auth.py
│   ├── schemas/
│   │   ├── user.py
│   │   └── auth.py
│   └── dependencies.py
├── models/
│   ├── user.py
│   └── base.py
├── services/
│   ├── user_service.py
│   └── auth_service.py
├── config/
│   ├── database.py
│   ├── settings.py
│   └── logging.py
├── middleware/
│   ├── error_handler.py
│   └── auth.py
├── tests/
│   ├── test_users.py
│   └── conftest.py
├── main.py
├── requirements.txt
├── .env
└── Dockerfile
```

## Testing

```python
# tests/test_users.py
import pytest
from fastapi.testclient import TestClient
from main import app

client = TestClient(app)

@pytest.fixture
def user_data():
    return {"name": "John Doe", "email": "john@example.com"}

def test_create_user(user_data):
    response = client.post("/api/users", json=user_data)
    assert response.status_code == 201
    assert response.json()["email"] == user_data["email"]

def test_get_users():
    response = client.get("/api/users")
    assert response.status_code == 200
    assert isinstance(response.json(), list)

def test_get_user_not_found():
    response = client.get("/api/users/999")
    assert response.status_code == 404
```

## Docker

```dockerfile
FROM python:3.11-slim

WORKDIR /app

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

COPY . .

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

## Integration Points

- **Receives from**: @requirements-analyst, @api-designer, @database-specialist
- **Provides to**: Frontend specialists, @azure-architect, @infrastructure-specialist
- **Collaborates with**: @security-specialist, @testing-specialist

## Quality Standards

1. **Type Hints** - Full type coverage with mypy validation
2. **Async Patterns** - Proper async/await usage
3. **Testing** - pytest with >80% coverage
4. **Performance** - Connection pooling, caching, optimization
5. **Security** - Input validation, authentication, authorization

## Skills Used

- **python-api-patterns** - FastAPI/Django patterns, async patterns
- **python-best-practices** - Security, performance, testing

## Related Documentation

- Skills: `python-api-patterns.md`, `python-best-practices.md`
- Schemas: Agent input/output schemas
- Official Docs: https://fastapi.tiangolo.com/

## Version History

- **1.0.0** (2026-01-13): Initial Python specification
