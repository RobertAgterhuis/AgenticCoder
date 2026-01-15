# Skill: Python API Patterns (@python-api-patterns)

## Metadata

```yaml
name: python-api-patterns
agents: ["@python-specialist"]
created: 2026-01-13
version: 1.0.0
```

## Purpose

The **Python API Patterns** skill provides comprehensive patterns, best practices, and implementations for building robust RESTful APIs using FastAPI, Django, and Flask. Covers async/await, dependency injection, validation, error handling, and common architectural patterns.

## Scope

**Included**:
- FastAPI with async/await patterns
- Django REST Framework setup
- Flask with Blueprints
- Pydantic validation models
- Dependency injection patterns
- Error handling and status codes
- Request/response serialization
- Middleware implementation
- Authentication patterns
- Rate limiting and throttling

**Excluded**:
- GraphQL APIs (separate skill)
- gRPC implementations
- WebSocket specifics
- Message queues (see infrastructure)

## Core Pattern 1: FastAPI Async API

```python
# Async handlers with proper typing and validation
from fastapi import FastAPI, HTTPException, Depends, status
from pydantic import BaseModel, Field, EmailStr
from sqlalchemy.ext.asyncio import AsyncSession

app = FastAPI(title="User API", version="1.0.0")

# Models
class UserCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(..., min_length=8)
    
    class Config:
        json_schema_extra = {
            "example": {
                "name": "John Doe",
                "email": "john@example.com",
                "password": "SecurePass123!"
            }
        }

class User(UserCreate):
    id: int
    
    class Config:
        from_attributes = True

# Async database dependency
async def get_db() -> AsyncSession:
    async with AsyncSessionLocal() as session:
        try:
            yield session
        finally:
            await session.close()

# Async handlers
@app.post("/api/users", response_model=User, status_code=status.HTTP_201_CREATED)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    """Create a new user with async database operations."""
    # Check if user exists
    existing = await db.execute(
        select(UserModel).where(UserModel.email == user.email)
    )
    if existing.scalar():
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    
    # Create new user
    db_user = UserModel(
        name=user.name,
        email=user.email,
        password=hash_password(user.password)
    )
    db.add(db_user)
    await db.commit()
    await db.refresh(db_user)
    return db_user

@app.get("/api/users/{user_id}", response_model=User)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Get user by ID."""
    user = await db.get(UserModel, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )
    return user

@app.get("/api/users", response_model=List[User])
async def list_users(
    skip: int = Query(0, ge=0),
    limit: int = Query(10, ge=1, le=100),
    db: AsyncSession = Depends(get_db)
):
    """List users with pagination."""
    query = select(UserModel).offset(skip).limit(limit)
    result = await db.execute(query)
    return result.scalars().all()
```

## Core Pattern 2: Pydantic Validation

```python
# Advanced Pydantic models with custom validation
from pydantic import BaseModel, Field, validator, root_validator
from datetime import datetime
from typing import Optional

class Address(BaseModel):
    street: str
    city: str
    state: str = Field(..., regex="^[A-Z]{2}$")
    zip_code: str = Field(..., regex="^\\d{5}$")

class UserProfile(BaseModel):
    first_name: str = Field(..., min_length=1, max_length=50)
    last_name: str = Field(..., min_length=1, max_length=50)
    birth_date: Optional[datetime] = None
    address: Optional[Address] = None
    
    @validator('first_name', 'last_name')
    def names_must_not_be_number(cls, v):
        if v.isdigit():
            raise ValueError('must not be all numbers')
        return v.title()
    
    @root_validator
    def validate_age(cls, values):
        birth_date = values.get('birth_date')
        if birth_date:
            age = (datetime.now() - birth_date).days // 365
            if age < 18:
                raise ValueError('Must be at least 18 years old')
        return values
    
    @property
    def full_name(self) -> str:
        return f"{self.first_name} {self.last_name}"

# Usage in handler
@app.post("/api/profiles")
async def create_profile(profile: UserProfile):
    # Validation happens automatically
    return {"status": "created", "profile": profile}
```

## Core Pattern 3: Dependency Injection

```python
# Reusable dependencies for authentication, caching, logging
from fastapi import Depends, HTTPException
from typing import Optional
import jwt

class JWTBearer:
    def __init__(self, auto_error: bool = True):
        self.auto_error = auto_error
    
    async def __call__(self, request: Request) -> str:
        credentials = request.headers.get("Authorization")
        if not credentials:
            if self.auto_error:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Not authenticated"
                )
            return None
        
        try:
            scheme, token = credentials.split()
            if scheme.lower() != "bearer":
                raise ValueError("Invalid authentication scheme")
            
            payload = jwt.decode(token, SECRET_KEY, algorithms=["HS256"])
            user_id: int = payload.get("sub")
            if user_id is None:
                raise ValueError("Invalid token")
            return user_id
        except Exception:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token"
            )

security = JWTBearer()

class PermissionChecker:
    def __init__(self, required_role: str):
        self.required_role = required_role
    
    async def __call__(self, user_id: int = Depends(security), db: AsyncSession = Depends(get_db)):
        user = await db.get(UserModel, user_id)
        if not user or user.role != self.required_role:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return user

# Usage
@app.delete("/api/users/{user_id}")
async def delete_user(
    user_id: int,
    admin: User = Depends(PermissionChecker("admin"))
):
    """Only admins can delete users."""
    # Handler code
    pass
```

## Core Pattern 4: Error Handling

```python
# Global exception handling with custom exceptions
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
import logging

logger = logging.getLogger(__name__)

class APIException(Exception):
    def __init__(self, status_code: int, detail: str, error_code: str = None):
        self.status_code = status_code
        self.detail = detail
        self.error_code = error_code or "INTERNAL_ERROR"

@app.exception_handler(APIException)
async def api_exception_handler(request: Request, exc: APIException):
    logger.error(f"API Error: {exc.error_code} - {exc.detail}")
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "error": {
                "code": exc.error_code,
                "message": exc.detail,
                "path": str(request.url)
            }
        }
    )

@app.exception_handler(RequestValidationError)
async def validation_exception_handler(request: Request, exc: RequestValidationError):
    errors = []
    for error in exc.errors():
        errors.append({
            "field": ".".join(str(x) for x in error["loc"][1:]),
            "message": error["msg"],
            "type": error["type"]
        })
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Request validation failed",
                "details": errors
            }
        }
    )

# Custom exceptions
class UserNotFoundError(APIException):
    def __init__(self, user_id: int):
        super().__init__(
            status_code=404,
            detail=f"User {user_id} not found",
            error_code="USER_NOT_FOUND"
        )

class EmailAlreadyRegisteredError(APIException):
    def __init__(self, email: str):
        super().__init__(
            status_code=409,
            detail=f"Email {email} is already registered",
            error_code="EMAIL_REGISTERED"
        )
```

## Core Pattern 5: Middleware Implementation

```python
# Custom middleware for logging, timing, and security
from fastapi import FastAPI
from starlette.middleware.base import BaseHTTPMiddleware
from starlette.requests import Request
import time
import uuid
from typing import Callable

class RequestContextMiddleware(BaseHTTPMiddleware):
    """Add request ID and timing to all requests."""
    
    async def dispatch(self, request: Request, call_next: Callable):
        request_id = str(uuid.uuid4())
        request.state.request_id = request_id
        
        start_time = time.time()
        
        response = await call_next(request)
        
        process_time = time.time() - start_time
        response.headers["X-Request-ID"] = request_id
        response.headers["X-Process-Time"] = str(process_time)
        
        logger.info(
            f"Request {request_id}: {request.method} {request.url.path} - {response.status_code} ({process_time:.3f}s)"
        )
        
        return response

class RateLimitMiddleware(BaseHTTPMiddleware):
    """Simple in-memory rate limiting."""
    
    def __init__(self, app, requests_per_minute: int = 60):
        super().__init__(app)
        self.requests_per_minute = requests_per_minute
        self.requests = {}
    
    async def dispatch(self, request: Request, call_next: Callable):
        client_ip = request.client.host
        now = time.time()
        
        if client_ip not in self.requests:
            self.requests[client_ip] = []
        
        # Clean old requests
        self.requests[client_ip] = [
            req_time for req_time in self.requests[client_ip]
            if now - req_time < 60
        ]
        
        if len(self.requests[client_ip]) >= self.requests_per_minute:
            return JSONResponse(
                status_code=429,
                content={"error": "Rate limit exceeded"}
            )
        
        self.requests[client_ip].append(now)
        return await call_next(request)

# Register middleware
app.add_middleware(RateLimitMiddleware, requests_per_minute=100)
app.add_middleware(RequestContextMiddleware)
```

## Core Pattern 6: Database Transactions

```python
# Transaction management with rollback handling
from sqlalchemy.ext.asyncio import AsyncSession
from contextlib import asynccontextmanager

@asynccontextmanager
async def transaction(db: AsyncSession):
    """Context manager for database transactions."""
    try:
        yield db
        await db.commit()
    except Exception:
        await db.rollback()
        raise

@app.post("/api/transfer")
async def transfer_money(
    transfer: TransferRequest,
    db: AsyncSession = Depends(get_db)
):
    """Transfer money with transaction rollback on failure."""
    async with transaction(db) as session:
        # Get accounts
        from_account = await session.get(Account, transfer.from_id)
        to_account = await session.get(Account, transfer.to_id)
        
        if not from_account or not to_account:
            raise HTTPException(status_code=404, detail="Account not found")
        
        if from_account.balance < transfer.amount:
            raise HTTPException(status_code=400, detail="Insufficient balance")
        
        # Update accounts
        from_account.balance -= transfer.amount
        to_account.balance += transfer.amount
        
        # Log transaction
        transaction_log = TransactionLog(
            from_id=transfer.from_id,
            to_id=transfer.to_id,
            amount=transfer.amount
        )
        session.add(transaction_log)
        
        # If any update fails, all changes rollback
    
    return {"status": "success"}
```

## Core Pattern 7: Caching Strategy

```python
# Redis caching with invalidation
from redis.asyncio import Redis
import json
from functools import wraps

redis_client = Redis(host='localhost', port=6379)

def cache(expire_seconds: int = 3600):
    """Decorator for caching handler responses."""
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            # Generate cache key
            cache_key = f"{func.__name__}:{str(args)}:{str(kwargs)}"
            
            # Try to get from cache
            cached = await redis_client.get(cache_key)
            if cached:
                return json.loads(cached)
            
            # Call handler
            result = await func(*args, **kwargs)
            
            # Store in cache
            await redis_client.setex(
                cache_key,
                expire_seconds,
                json.dumps(result, default=str)
            )
            
            return result
        return wrapper
    return decorator

@app.get("/api/users/{user_id}", response_model=User)
@cache(expire_seconds=300)
async def get_user(user_id: int, db: AsyncSession = Depends(get_db)):
    """Get user with 5-minute cache."""
    return await db.get(UserModel, user_id)

@app.put("/api/users/{user_id}", response_model=User)
async def update_user(user_id: int, update: UserUpdate, db: AsyncSession = Depends(get_db)):
    """Update user and invalidate cache."""
    user = await db.get(UserModel, user_id)
    # ... update logic ...
    
    # Invalidate cache
    await redis_client.delete(f"get_user:{user_id}")
    
    return user
```

## Core Pattern 8: Pagination

```python
# Pagination pattern for list endpoints
from pydantic import BaseModel
from typing import Generic, TypeVar, List

T = TypeVar("T")

class PaginationParams(BaseModel):
    skip: int = 0
    limit: int = 10
    sort_by: str = "created_at"
    sort_order: str = "desc"

class PaginatedResponse(BaseModel, Generic[T]):
    items: List[T]
    total: int
    skip: int
    limit: int
    has_more: bool
    
    @property
    def total_pages(self) -> int:
        return (self.total + self.limit - 1) // self.limit

@app.get("/api/users", response_model=PaginatedResponse[User])
async def list_users(
    pagination: PaginationParams = Depends(),
    db: AsyncSession = Depends(get_db)
):
    """List users with pagination."""
    # Get total count
    total_result = await db.execute(select(func.count(UserModel.id)))
    total = total_result.scalar()
    
    # Get paginated results
    query = select(UserModel).offset(pagination.skip).limit(pagination.limit)
    if pagination.sort_order.lower() == "desc":
        query = query.order_by(getattr(UserModel, pagination.sort_by).desc())
    else:
        query = query.order_by(getattr(UserModel, pagination.sort_by).asc())
    
    result = await db.execute(query)
    items = result.scalars().all()
    
    return PaginatedResponse(
        items=items,
        total=total,
        skip=pagination.skip,
        limit=pagination.limit,
        has_more=(pagination.skip + pagination.limit) < total
    )
```

## Advanced Pattern 1: Event-Driven Architecture

```python
# Event system for decoupled components
from typing import Callable, List
from enum import Enum

class Event(Enum):
    USER_CREATED = "user.created"
    USER_UPDATED = "user.updated"
    USER_DELETED = "user.deleted"

class EventBus:
    def __init__(self):
        self.subscribers: dict[Event, List[Callable]] = {}
    
    def subscribe(self, event: Event, handler: Callable):
        if event not in self.subscribers:
            self.subscribers[event] = []
        self.subscribers[event].append(handler)
    
    async def publish(self, event: Event, data: dict):
        if event in self.subscribers:
            for handler in self.subscribers[event]:
                await handler(data)

event_bus = EventBus()

# Register handlers
async def on_user_created(data: dict):
    """Send welcome email when user created."""
    await send_email(data['email'], "Welcome!")

event_bus.subscribe(Event.USER_CREATED, on_user_created)

# Publish events
@app.post("/api/users", response_model=User)
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    db_user = UserModel(**user.dict())
    db.add(db_user)
    await db.commit()
    
    # Publish event
    await event_bus.publish(Event.USER_CREATED, {
        "user_id": db_user.id,
        "email": db_user.email
    })
    
    return db_user
```

## Advanced Pattern 2: Versioning

```python
# API versioning strategies
from fastapi import APIRouter, Header
from typing import Optional

# Version 1
v1_router = APIRouter(prefix="/api/v1")

@v1_router.get("/users/{user_id}")
async def get_user_v1(user_id: int, db: AsyncSession = Depends(get_db)):
    """Older API response format."""
    user = await db.get(UserModel, user_id)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email
    }

# Version 2
v2_router = APIRouter(prefix="/api/v2")

@v2_router.get("/users/{user_id}")
async def get_user_v2(user_id: int, db: AsyncSession = Depends(get_db)):
    """Newer API with more fields."""
    user = await db.get(UserModel, user_id)
    return {
        "id": user.id,
        "name": user.name,
        "email": user.email,
        "created_at": user.created_at,
        "roles": [r.name for r in user.roles]
    }

app.include_router(v1_router)
app.include_router(v2_router)
```

## Anti-Patterns

### ❌ N+1 Queries

```python
# BAD: N+1 query problem
users = await db.execute(select(UserModel))
for user in users.scalars():
    posts = await db.execute(select(Post).where(Post.user_id == user.id))
    # This queries database for each user!

# GOOD: Single JOIN query
users = await db.execute(
    select(UserModel).options(joinedload(UserModel.posts))
)
```

### ❌ Blocking Operations in Async Code

```python
# BAD: Blocking I/O in async handler
@app.get("/api/data")
async def get_data():
    time.sleep(5)  # Blocks entire event loop!
    return {"data": "value"}

# GOOD: Use async operations
@app.get("/api/data")
async def get_data():
    await asyncio.sleep(5)  # Non-blocking
    return {"data": "value"}
```

### ❌ Exposing Database Errors

```python
# BAD: Leaking implementation details
@app.post("/api/users")
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    db_user = UserModel(**user.dict())
    db.add(db_user)
    await db.commit()  # Could raise SQLAlchemy exceptions
    return db_user

# GOOD: Catch and normalize errors
@app.post("/api/users")
async def create_user(user: UserCreate, db: AsyncSession = Depends(get_db)):
    try:
        db_user = UserModel(**user.dict())
        db.add(db_user)
        await db.commit()
    except IntegrityError:
        raise HTTPException(
            status_code=409,
            detail="Email already registered"
        )
    return db_user
```

## Schema Reference

- `python-specialist.input.schema.json` - Agent input requirements
- `python-specialist.output.schema.json` - Generated file structure

## Related Documentation

- Skill: `python-best-practices.md` - Performance and security patterns
- Agent: `python-specialist.md`

## Version History

- **1.0.0** (2026-01-13): Initial Python API patterns
