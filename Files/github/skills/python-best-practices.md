# Skill: Python Best Practices (@python-best-practices)

## Metadata

```yaml
name: python-best-practices
agents: ["@python-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **Python Best Practices** skill provides comprehensive guidance on building production-ready Python applications with emphasis on security, performance, testing, deployment, and code quality.

## Scope

**Included**:
- Performance optimization and profiling
- Security best practices
- Testing strategies (unit, integration, E2E)
- Type hints and mypy validation
- Code quality and linting
- Dependency management
- Docker and deployment
- Monitoring and logging

**Excluded**:
- Specific framework tutorials (see framework-specific skills)
- Data science and ML patterns
- Advanced concurrency (see asyncio docs)

## Core Pattern 1: Performance Optimization

```python
# Connection pooling for database
from sqlalchemy.ext.asyncio import create_async_engine, AsyncSession
from sqlalchemy.pool import NullPool, QueuePool

# Production: Use connection pooling
engine = create_async_engine(
    "mysql+aiomysql://user:pass@localhost/db",
    poolclass=QueuePool,
    pool_size=20,
    max_overflow=10,
    pool_recycle=3600,  # Recycle connections every hour
    pool_pre_ping=True,  # Verify connections before use
    echo=False  # Disable SQL echo in production
)

# Query optimization with select
from sqlalchemy import select, func

# GOOD: Load only needed columns
async def get_user_summary(user_id: int):
    query = select(User.id, User.name, User.email)
    result = await session.execute(query)
    return result.first()

# GOOD: Use joinedload to prevent N+1
from sqlalchemy.orm import joinedload

async def get_user_with_posts(user_id: int):
    query = (
        select(User)
        .where(User.id == user_id)
        .options(joinedload(User.posts))
    )
    result = await session.execute(query)
    return result.unique().scalar_one()

# GOOD: Batch operations
async def bulk_create_users(users_data: list):
    users = [User(**data) for data in users_data]
    session.add_all(users)  # Single SQL INSERT with multiple rows
    await session.commit()
    return users

# Caching with Redis
from redis.asyncio import Redis
import json

class CacheManager:
    def __init__(self, redis: Redis):
        self.redis = redis
    
    async def get_or_load(self, key: str, loader, expire: int = 3600):
        """Get from cache or load and cache."""
        # Try cache first
        cached = await self.redis.get(key)
        if cached:
            return json.loads(cached)
        
        # Load data
        data = await loader()
        
        # Cache it
        await self.redis.setex(key, expire, json.dumps(data, default=str))
        return data
    
    async def invalidate(self, *keys):
        """Invalidate multiple cache keys."""
        await self.redis.delete(*keys)

# Profiling
import cProfile
import pstats
from io import StringIO

def profile_function(func):
    """Decorator to profile function execution."""
    def wrapper(*args, **kwargs):
        profiler = cProfile.Profile()
        profiler.enable()
        
        result = func(*args, **kwargs)
        
        profiler.disable()
        stats = pstats.Stats(profiler, stream=StringIO())
        stats.sort_stats('cumulative')
        stats.print_stats(10)  # Print top 10
        
        return result
    return wrapper
```

## Core Pattern 2: Security Best Practices

```python
# Input validation and sanitization
from pydantic import BaseModel, Field, validator
from html import escape

class UserInput(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str
    bio: str = Field("", max_length=1000)
    
    @validator('name', 'bio')
    def sanitize_input(cls, v):
        """Remove HTML and dangerous characters."""
        if v:
            v = escape(v)  # Convert <, >, & to entities
            v = v.strip()
        return v

# Password hashing
from passlib.context import CryptContext

pwd_context = CryptContext(
    schemes=["bcrypt"],
    deprecated="auto",
    bcrypt__rounds=12  # Increase cost factor
)

def hash_password(password: str) -> str:
    """Hash password securely."""
    return pwd_context.hash(password)

def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify password."""
    return pwd_context.verify(plain_password, hashed_password)

# JWT token handling
import jwt
from datetime import datetime, timedelta
from typing import Optional

class TokenManager:
    def __init__(self, secret_key: str, algorithm: str = "HS256"):
        self.secret_key = secret_key
        self.algorithm = algorithm
    
    def create_token(self, data: dict, expires_in_minutes: int = 30) -> str:
        """Create JWT token with expiration."""
        payload = data.copy()
        expire = datetime.utcnow() + timedelta(minutes=expires_in_minutes)
        payload.update({"exp": expire})
        
        return jwt.encode(payload, self.secret_key, algorithm=self.algorithm)
    
    def verify_token(self, token: str) -> Optional[dict]:
        """Verify and decode JWT token."""
        try:
            payload = jwt.decode(token, self.secret_key, algorithms=[self.algorithm])
            return payload
        except jwt.ExpiredSignatureError:
            return None
        except jwt.InvalidTokenError:
            return None

# CORS configuration
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["https://example.com"],  # Specific origins, not "*"
    allow_credentials=True,
    allow_methods=["GET", "POST", "PUT", "DELETE"],
    allow_headers=["Authorization", "Content-Type"],
    expose_headers=["X-Total-Count"],
    max_age=600  # Cache preflight for 10 minutes
)

# SQL injection prevention (use ORM or parameterized queries)
# GOOD: ORM prevents SQL injection
user = await session.execute(
    select(User).where(User.email == email)
)

# Environment variables
import os
from functools import lru_cache

class Settings:
    DATABASE_URL: str = os.getenv("DATABASE_URL")
    SECRET_KEY: str = os.getenv("SECRET_KEY")
    ENVIRONMENT: str = os.getenv("ENVIRONMENT", "development")
    DEBUG: bool = ENVIRONMENT == "development"
    
    def __init__(self):
        if not self.SECRET_KEY:
            raise ValueError("SECRET_KEY must be set")
        if not self.DATABASE_URL:
            raise ValueError("DATABASE_URL must be set")

@lru_cache
def get_settings() -> Settings:
    return Settings()

# Headers for security
from starlette.middleware.base import BaseHTTPMiddleware

class SecurityHeadersMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request, call_next):
        response = await call_next(request)
        
        # Prevent clickjacking
        response.headers["X-Frame-Options"] = "DENY"
        
        # Prevent MIME sniffing
        response.headers["X-Content-Type-Options"] = "nosniff"
        
        # Enable XSS protection
        response.headers["X-XSS-Protection"] = "1; mode=block"
        
        # Content Security Policy
        response.headers["Content-Security-Policy"] = "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline'"
        
        return response
```

## Core Pattern 3: Testing Strategy

```python
# Unit tests with pytest
import pytest
from fastapi.testclient import TestClient
from unittest.mock import AsyncMock, patch

@pytest.fixture
def client():
    """Provide test client."""
    return TestClient(app)

@pytest.fixture
async def db():
    """Provide test database session."""
    async with test_db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    
    async with AsyncSession(test_db_engine) as session:
        yield session
    
    async with test_db_engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)

@pytest.mark.asyncio
async def test_create_user(db):
    """Test user creation."""
    user_data = {
        "name": "John Doe",
        "email": "john@example.com",
        "password": "SecurePass123"
    }
    
    response = client.post("/api/users", json=user_data)
    
    assert response.status_code == 201
    assert response.json()["email"] == user_data["email"]

@pytest.mark.asyncio
async def test_get_user_not_found(db):
    """Test getting non-existent user."""
    response = client.get("/api/users/999")
    
    assert response.status_code == 404
    assert "not found" in response.json()["error"]["message"].lower()

# Integration tests
@pytest.mark.asyncio
async def test_user_flow(db):
    """Test complete user flow."""
    # Create
    create_resp = client.post("/api/users", json={
        "name": "John",
        "email": "john@example.com",
        "password": "Pass123"
    })
    assert create_resp.status_code == 201
    user_id = create_resp.json()["id"]
    
    # Get
    get_resp = client.get(f"/api/users/{user_id}")
    assert get_resp.status_code == 200
    
    # Update
    update_resp = client.put(f"/api/users/{user_id}", json={
        "name": "Jane"
    })
    assert update_resp.status_code == 200
    
    # Delete
    delete_resp = client.delete(f"/api/users/{user_id}")
    assert delete_resp.status_code == 204

# Mocking external services
@pytest.mark.asyncio
async def test_send_email_on_user_created(db):
    """Test email sending on user creation."""
    with patch('services.email.send_email', new_callable=AsyncMock) as mock_email:
        mock_email.return_value = True
        
        response = client.post("/api/users", json={
            "name": "John",
            "email": "john@example.com",
            "password": "Pass123"
        })
        
        assert response.status_code == 201
        mock_email.assert_called_once()
        args = mock_email.call_args
        assert "john@example.com" in str(args)

# Fixtures for common test data
@pytest.fixture
def user_factory(db):
    """Factory for creating test users."""
    async def create_user(
        name="Test User",
        email="test@example.com",
        password="TestPass123"
    ):
        user = User(
            name=name,
            email=email,
            password=hash_password(password)
        )
        db.add(user)
        await db.commit()
        return user
    
    return create_user
```

## Core Pattern 4: Type Hints and Validation

```python
# Complete type hints usage
from typing import Optional, List, Dict, Union, Callable
from enum import Enum
from datetime import datetime

class UserRole(str, Enum):
    USER = "user"
    ADMIN = "admin"
    MODERATOR = "moderator"

class UserResponse(BaseModel):
    id: int
    name: str
    email: str
    role: UserRole
    created_at: datetime
    is_active: bool

async def get_users(
    skip: int = 0,
    limit: int = 10,
    role: Optional[UserRole] = None,
    db: AsyncSession = Depends(get_db)
) -> List[UserResponse]:
    """Get users with optional role filter."""
    query = select(User).offset(skip).limit(limit)
    
    if role:
        query = query.where(User.role == role)
    
    result = await db.execute(query)
    return result.scalars().all()

# Mypy validation
def process_user_data(user: Dict[str, Union[str, int]]) -> Optional[UserResponse]:
    """Process user data with type checking."""
    if "email" not in user or "name" not in user:
        return None
    
    return UserResponse(
        id=user.get("id", 0),
        name=user["name"],
        email=user["email"],
        role=user.get("role", UserRole.USER),
        created_at=datetime.utcnow(),
        is_active=True
    )

# Generic types
T = TypeVar('T')

class Repository(Generic[T]):
    """Generic repository pattern."""
    
    def __init__(self, model: Type[T]):
        self.model = model
    
    async def get_by_id(self, id: int, db: AsyncSession) -> Optional[T]:
        return await db.get(self.model, id)
    
    async def get_all(self, db: AsyncSession) -> List[T]:
        result = await db.execute(select(self.model))
        return result.scalars().all()

# Usage
user_repo = Repository(User)
admin_repo = Repository(Admin)
```

## Core Pattern 5: Logging and Monitoring

```python
# Structured logging
import logging
from pythonjsonlogger import jsonlogger

# Configure JSON logging
logHandler = logging.StreamHandler()
formatter = jsonlogger.JsonFormatter()
logHandler.setFormatter(formatter)

logger = logging.getLogger(__name__)
logger.addHandler(logHandler)
logger.setLevel(logging.INFO)

# Contextual logging
from contextvars import ContextVar
import uuid

request_id: ContextVar[str] = ContextVar('request_id', default=str(uuid.uuid4()))

class LoggingMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        req_id = str(uuid.uuid4())
        request_id.set(req_id)
        
        logger.info(
            "request_started",
            extra={
                "request_id": req_id,
                "method": request.method,
                "path": request.url.path
            }
        )
        
        response = await call_next(request)
        
        logger.info(
            "request_completed",
            extra={
                "request_id": req_id,
                "status_code": response.status_code
            }
        )
        
        return response

# Monitoring with Prometheus
from prometheus_client import Counter, Histogram

request_count = Counter(
    'request_total',
    'Total requests',
    ['method', 'endpoint', 'status']
)

request_duration = Histogram(
    'request_duration_seconds',
    'Request duration',
    ['method', 'endpoint']
)

class MetricsMiddleware(BaseHTTPMiddleware):
    async def dispatch(self, request: Request, call_next):
        start = time.time()
        
        response = await call_next(request)
        
        duration = time.time() - start
        
        request_count.labels(
            method=request.method,
            endpoint=request.url.path,
            status=response.status_code
        ).inc()
        
        request_duration.labels(
            method=request.method,
            endpoint=request.url.path
        ).observe(duration)
        
        return response
```

## Core Pattern 6: Error Handling and Debugging

```python
# Comprehensive error handling
import traceback
from pythonjsonlogger import jsonlogger

class APIError(Exception):
    """Base API error."""
    def __init__(self, code: str, message: str, status_code: int = 400):
        self.code = code
        self.message = message
        self.status_code = status_code
        super().__init__(message)

class ValidationError(APIError):
    def __init__(self, message: str):
        super().__init__("VALIDATION_ERROR", message, 422)

class NotFoundError(APIError):
    def __init__(self, resource: str, resource_id: int):
        message = f"{resource} {resource_id} not found"
        super().__init__("NOT_FOUND", message, 404)

@app.exception_handler(APIError)
async def api_error_handler(request: Request, exc: APIError):
    logger.error(
        "api_error",
        extra={
            "error_code": exc.code,
            "message": exc.message,
            "status_code": exc.status_code,
            "traceback": traceback.format_exc()
        }
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.code,
                "message": exc.message
            }
        }
    )

# Retry with exponential backoff
import asyncio
from tenacity import retry, stop_after_attempt, wait_exponential

@retry(
    stop=stop_after_attempt(3),
    wait=wait_exponential(multiplier=1, min=2, max=10)
)
async def call_external_api(url: str):
    """Call external API with automatic retries."""
    async with httpx.AsyncClient() as client:
        response = await client.get(url)
        response.raise_for_status()
        return response.json()
```

## Core Pattern 7: Deployment Configuration

```python
# Docker multi-stage build
# Dockerfile
FROM python:3.11-slim as base

WORKDIR /app
RUN apt-get update && apt-get install -y \
    gcc \
    && rm -rf /var/lib/apt/lists/*

COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

FROM base as runtime

COPY --from=base /usr/local/lib/python3.11/site-packages /usr/local/lib/python3.11/site-packages
COPY . .

EXPOSE 8000

# Health check
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s \
    CMD python -c "import requests; requests.get('http://localhost:8000/health')"

CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]

# Production environment variables
# .env.production
ENVIRONMENT=production
DEBUG=false
LOG_LEVEL=info
DATABASE_URL=mysql+aiomysql://user:pass@prod-db:3306/app_db
REDIS_URL=redis://redis:6379
SECRET_KEY=<long-random-key>
```

## Core Pattern 8: Dependency Management

```python
# requirements.txt with pinned versions
fastapi==0.104.1
uvicorn==0.24.0
sqlalchemy==2.0.23
aiomysql==0.2.0
pydantic==2.5.0
pydantic-settings==2.1.0
python-jose[cryptography]==3.3.0
passlib[bcrypt]==1.7.4
python-multipart==0.0.6
pydantic-extra-types==2.4.1
redis==5.0.1
httpx==0.25.2
tenacity==8.2.3
prometheus-client==0.19.0
python-json-logger==2.0.7

# requirements-dev.txt
pytest==7.4.3
pytest-asyncio==0.21.1
pytest-cov==4.1.0
mypy==1.7.1
black==23.12.0
isort==5.13.2
flake8==6.1.0
pylint==3.0.3

# Development setup
python -m venv venv
source venv/bin/activate  # Linux/Mac
pip install -r requirements-dev.txt

# Code quality checks
mypy src/
black src/
isort src/
flake8 src/
pylint src/
```

## Anti-Patterns

### ❌ Hardcoded Secrets

```python
# BAD
SECRET_KEY = "my-super-secret-key"
DATABASE_URL = "mysql://user:password@localhost/db"

# GOOD
SECRET_KEY = os.getenv("SECRET_KEY")
DATABASE_URL = os.getenv("DATABASE_URL")
```

### ❌ Unhandled Exceptions

```python
# BAD
@app.post("/api/users")
async def create_user(user: UserCreate):
    return await db.create(user)  # Could raise any exception

# GOOD
@app.post("/api/users")
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        return await db.create(user)
    except IntegrityError:
        raise HTTPException(status_code=409, detail="User already exists")
    except Exception as e:
        logger.error(f"Unexpected error: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")
```

### ❌ Missing Type Hints

```python
# BAD
async def get_user(id):
    return db.query(id)

# GOOD
async def get_user(id: int, db: AsyncSession = Depends(get_db)) -> Optional[User]:
    return await db.get(User, id)
```

## Schema Reference

- `python-specialist.input.schema.json` - Agent input requirements
- `python-specialist.output.schema.json` - Generated file structure

## Related Documentation

- Skill: `python-api-patterns.md` - API design patterns
- Agent: `python-specialist.md`

## Version History

- **1.0.0** (2026-01-13): Initial Python best practices
