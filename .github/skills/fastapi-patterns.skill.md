# FastAPI Patterns Skill

**Skill ID**: `fastapi-patterns`  
**Version**: 1.0.0  
**Category**: Backend Patterns

---

## 📋 Overview

Comprehensive patterns for building production-ready FastAPI applications including dependency injection, Pydantic models, async patterns, routers, and middleware.

---

## 🔧 Dependency Injection Patterns

### 1. Dependency Injection Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                FastAPI Dependency Injection                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│   Request ──►                                                   │
│              ┌───────────────┐                                  │
│              │   Path Deps   │  Parameter-level dependencies    │
│              └───────┬───────┘                                  │
│                      ▼                                          │
│              ┌───────────────┐                                  │
│              │  Router Deps  │  Router-level shared deps        │
│              └───────┬───────┘                                  │
│                      ▼                                          │
│              ┌───────────────┐                                  │
│              │   App Deps    │  Application-wide dependencies   │
│              └───────┬───────┘                                  │
│                      ▼                                          │
│              ┌───────────────┐                                  │
│              │   Endpoint    │  Handler with injected deps      │
│              └───────────────┘                                  │
│                                                                  │
│   Dependency Resolution:                                        │
│   • Cached per-request (default)                                │
│   • Fresh each call (use_cache=False)                           │
│   • Yield deps with cleanup                                     │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### 2. Database Session Dependency

```python
# app/api/deps.py
from typing import AsyncGenerator, Annotated
from fastapi import Depends
from sqlalchemy.ext.asyncio import AsyncSession
from app.db.session import async_session_factory

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """
    Yield database session with automatic commit/rollback.
    Uses yield to ensure proper cleanup.
    """
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

# Annotated type for cleaner signatures
DBSession = Annotated[AsyncSession, Depends(get_db)]

# Usage in endpoint
@router.get("/{user_id}")
async def get_user(user_id: UUID, db: DBSession) -> UserResponse:
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
    return user
```

### 3. Service Dependency Pattern

```python
# app/api/deps.py
from typing import Annotated
from fastapi import Depends
from app.services.user_service import UserService
from app.services.order_service import OrderService
from app.repositories.user_repository import UserRepository
from app.repositories.order_repository import OrderRepository

def get_user_repository(db: DBSession) -> UserRepository:
    return UserRepository(db)

def get_user_service(
    repo: Annotated[UserRepository, Depends(get_user_repository)]
) -> UserService:
    return UserService(repo)

# Annotated types for services
UserServiceDep = Annotated[UserService, Depends(get_user_service)]
OrderServiceDep = Annotated[OrderService, Depends(get_order_service)]

# Usage with clean signatures
@router.post("", status_code=201)
async def create_user(
    user_in: UserCreate,
    service: UserServiceDep
) -> UserResponse:
    return await service.create(user_in)
```

### 4. Authentication Dependencies

```python
# app/api/deps.py
from typing import Annotated
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
import jwt

from app.core.config import settings
from app.models.user import User

security = HTTPBearer()

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: DBSession
) -> User:
    """Extract and validate user from JWT token."""
    token = credentials.credentials
    
    try:
        payload = jwt.decode(
            token,
            settings.JWT_SECRET_KEY,
            algorithms=[settings.JWT_ALGORITHM]
        )
        user_id = payload.get("sub")
        if not user_id:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid token: missing subject"
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError as e:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail=f"Could not validate token: {e}"
        )
    
    user = await db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User is inactive"
        )
    
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]

# Role-based authorization
def require_roles(*roles: str):
    """Dependency factory for role-based access control."""
    async def check_roles(current_user: CurrentUser) -> User:
        if not any(role in current_user.roles for role in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return check_roles

AdminUser = Annotated[User, Depends(require_roles("admin"))]
ModeratorUser = Annotated[User, Depends(require_roles("admin", "moderator"))]
```

### 5. Optional Authentication

```python
# app/api/deps.py
from typing import Annotated

async def get_current_user_optional(
    credentials: Annotated[
        HTTPAuthorizationCredentials | None,
        Depends(HTTPBearer(auto_error=False))
    ],
    db: DBSession
) -> User | None:
    """Get current user if token provided, otherwise None."""
    if not credentials:
        return None
    
    try:
        return await get_current_user(credentials, db)
    except HTTPException:
        return None

OptionalUser = Annotated[User | None, Depends(get_current_user_optional)]

# Usage: endpoint accessible with or without auth
@router.get("/posts")
async def get_posts(
    current_user: OptionalUser,
    service: PostServiceDep
) -> list[PostResponse]:
    if current_user:
        # Return personalized content
        return await service.get_for_user(current_user.id)
    # Return public content
    return await service.get_public()
```

---

## 📦 Pydantic Schema Patterns

### 1. Base Schema Configuration

```python
# app/schemas/base.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, ConfigDict

class BaseSchema(BaseModel):
    """Base schema with common configuration."""
    model_config = ConfigDict(
        from_attributes=True,
        populate_by_name=True,
        str_strip_whitespace=True
    )

class TimestampSchema(BaseSchema):
    """Schema mixin for timestamp fields."""
    created_at: datetime
    updated_at: datetime

class IDSchema(BaseSchema):
    """Schema mixin for ID field."""
    id: UUID
```

### 2. Request/Response Schemas

```python
# app/schemas/user.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Self

from app.schemas.base import BaseSchema, TimestampSchema, IDSchema

# Create schema (input)
class UserCreate(BaseModel):
    """Schema for creating a new user."""
    email: EmailStr
    password: str = Field(..., min_length=8, max_length=128)
    password_confirm: str
    full_name: str = Field(..., min_length=2, max_length=100)
    
    @field_validator("full_name")
    @classmethod
    def normalize_name(cls, v: str) -> str:
        return v.strip().title()
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain at least one uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain at least one lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain at least one digit")
        return v
    
    @model_validator(mode="after")
    def check_passwords_match(self) -> Self:
        if self.password != self.password_confirm:
            raise ValueError("Passwords do not match")
        return self

# Update schema (input, partial)
class UserUpdate(BaseModel):
    """Schema for updating a user. All fields optional."""
    email: EmailStr | None = None
    full_name: str | None = Field(None, min_length=2, max_length=100)
    password: str | None = Field(None, min_length=8, max_length=128)
    is_active: bool | None = None

# Response schema (output)
class UserResponse(IDSchema, TimestampSchema):
    """Schema for user response."""
    email: EmailStr
    full_name: str
    is_active: bool
    roles: list[str]
    
    # Exclude sensitive fields automatically
    model_config = ConfigDict(
        from_attributes=True,
        json_schema_extra={
            "example": {
                "id": "123e4567-e89b-12d3-a456-426614174000",
                "email": "user@example.com",
                "full_name": "John Doe",
                "is_active": True,
                "roles": ["user"],
                "created_at": "2024-01-01T00:00:00Z",
                "updated_at": "2024-01-01T00:00:00Z"
            }
        }
    )

# Internal schema (includes sensitive data)
class UserInternal(UserResponse):
    """Internal schema with sensitive fields."""
    hashed_password: str
```

### 3. Pagination Schemas

```python
# app/schemas/common.py
from typing import Generic, TypeVar, Literal
from pydantic import BaseModel, Field

T = TypeVar("T")

class PaginationParams(BaseModel):
    """Query parameters for pagination."""
    page: int = Field(1, ge=1, description="Page number")
    limit: int = Field(20, ge=1, le=100, description="Items per page")
    sort_by: str = Field("created_at", description="Field to sort by")
    sort_order: Literal["asc", "desc"] = Field("desc", description="Sort order")

class PaginatedResponse(BaseModel, Generic[T]):
    """Generic paginated response."""
    items: list[T]
    total: int
    page: int
    limit: int
    pages: int
    
    @property
    def has_next(self) -> bool:
        return self.page < self.pages
    
    @property
    def has_prev(self) -> bool:
        return self.page > 1

# Cursor-based pagination
class CursorParams(BaseModel):
    """Query parameters for cursor pagination."""
    cursor: str | None = None
    limit: int = Field(20, ge=1, le=100)
    direction: Literal["forward", "backward"] = "forward"

class CursorResponse(BaseModel, Generic[T]):
    """Cursor-based paginated response."""
    items: list[T]
    next_cursor: str | None
    prev_cursor: str | None
    has_more: bool
```

### 4. Complex Nested Schemas

```python
# app/schemas/order.py
from decimal import Decimal
from uuid import UUID
from pydantic import BaseModel, Field, field_validator
from enum import Enum

from app.schemas.base import IDSchema, TimestampSchema

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class OrderItemCreate(BaseModel):
    """Schema for creating an order item."""
    product_id: UUID
    quantity: int = Field(..., ge=1)
    
class OrderItemResponse(IDSchema):
    """Schema for order item response."""
    product_id: UUID
    product_name: str
    quantity: int
    unit_price: Decimal
    total_price: Decimal

class OrderCreate(BaseModel):
    """Schema for creating an order."""
    items: list[OrderItemCreate] = Field(..., min_length=1)
    shipping_address_id: UUID
    notes: str | None = None
    
    @field_validator("items")
    @classmethod
    def validate_unique_products(cls, v: list[OrderItemCreate]) -> list[OrderItemCreate]:
        product_ids = [item.product_id for item in v]
        if len(product_ids) != len(set(product_ids)):
            raise ValueError("Duplicate products in order")
        return v

class OrderResponse(IDSchema, TimestampSchema):
    """Schema for order response."""
    user_id: UUID
    status: OrderStatus
    items: list[OrderItemResponse]
    subtotal: Decimal
    tax: Decimal
    total: Decimal
    shipping_address: "AddressResponse"
    notes: str | None
```

---

## 🛣️ Router Patterns

### 1. Router Organization

```python
# app/api/v1/router.py
from fastapi import APIRouter
from app.api.v1.endpoints import users, orders, products, auth

api_router = APIRouter()

# Include all endpoint routers
api_router.include_router(
    auth.router,
    prefix="/auth",
    tags=["Authentication"]
)
api_router.include_router(
    users.router,
    prefix="/users",
    tags=["Users"]
)
api_router.include_router(
    orders.router,
    prefix="/orders",
    tags=["Orders"]
)
api_router.include_router(
    products.router,
    prefix="/products",
    tags=["Products"]
)
```

### 2. Endpoint Router Pattern

```python
# app/api/v1/endpoints/users.py
from typing import Annotated
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query

from app.api.deps import DBSession, CurrentUser, AdminUser, UserServiceDep
from app.schemas.user import UserCreate, UserUpdate, UserResponse
from app.schemas.common import PaginationParams, PaginatedResponse

router = APIRouter()

@router.get("", response_model=PaginatedResponse[UserResponse])
async def list_users(
    pagination: Annotated[PaginationParams, Depends()],
    service: UserServiceDep,
    search: str | None = Query(None, description="Search by name or email")
) -> PaginatedResponse[UserResponse]:
    """
    List all users with pagination.
    
    - **page**: Page number (default: 1)
    - **limit**: Items per page (default: 20, max: 100)
    - **search**: Optional search term
    """
    return await service.get_all(pagination, search=search)

@router.get("/me", response_model=UserResponse)
async def get_current_user_profile(
    current_user: CurrentUser
) -> UserResponse:
    """Get the current authenticated user's profile."""
    return current_user

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(
    user_id: UUID,
    service: UserServiceDep
) -> UserResponse:
    """Get a specific user by ID."""
    user = await service.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User with ID {user_id} not found"
        )
    return user

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(
    user_in: UserCreate,
    service: UserServiceDep
) -> UserResponse:
    """Create a new user."""
    existing = await service.get_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    return await service.create(user_in)

@router.patch("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    service: UserServiceDep,
    current_user: CurrentUser
) -> UserResponse:
    """Update a user. Users can only update their own profile."""
    if user_id != current_user.id and "admin" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update other users"
        )
    return await service.update(user_id, user_in)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    service: UserServiceDep,
    _: AdminUser  # Require admin role
) -> None:
    """Delete a user. Admin only."""
    await service.delete(user_id)
```

### 3. Router with Dependencies

```python
# app/api/v1/endpoints/admin.py
from fastapi import APIRouter, Depends
from app.api.deps import AdminUser

# All endpoints in this router require admin role
router = APIRouter(
    dependencies=[Depends(lambda u: AdminUser)]
)

@router.get("/stats")
async def get_stats():
    """Admin-only endpoint."""
    pass
```

---

## 🔌 Middleware Patterns

### 1. Custom Middleware

```python
# app/middleware/logging.py
import time
import structlog
from fastapi import Request, Response
from starlette.middleware.base import BaseHTTPMiddleware

logger = structlog.get_logger()

class LoggingMiddleware(BaseHTTPMiddleware):
    """Log all requests with timing."""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        request_id = request.headers.get("X-Request-ID", str(uuid4()))
        start_time = time.perf_counter()
        
        # Add request ID to response headers
        response = await call_next(request)
        response.headers["X-Request-ID"] = request_id
        
        # Calculate duration
        duration = time.perf_counter() - start_time
        
        # Log request
        logger.info(
            "request_completed",
            request_id=request_id,
            method=request.method,
            path=request.url.path,
            status_code=response.status_code,
            duration_ms=round(duration * 1000, 2),
            client_ip=request.client.host if request.client else None
        )
        
        return response

# app/middleware/timing.py
class TimingMiddleware(BaseHTTPMiddleware):
    """Add server timing headers."""
    
    async def dispatch(self, request: Request, call_next) -> Response:
        start = time.perf_counter()
        response = await call_next(request)
        duration = time.perf_counter() - start
        
        response.headers["Server-Timing"] = f"total;dur={duration * 1000:.2f}"
        return response
```

### 2. Exception Handlers

```python
# app/core/exceptions.py
from fastapi import Request, status
from fastapi.responses import JSONResponse
from fastapi.exceptions import RequestValidationError
from pydantic import ValidationError
import structlog

logger = structlog.get_logger()

class AppException(Exception):
    """Base application exception."""
    def __init__(
        self,
        message: str,
        status_code: int = 500,
        code: str = "INTERNAL_ERROR",
        details: dict | None = None
    ):
        self.message = message
        self.status_code = status_code
        self.code = code
        self.details = details
        super().__init__(message)

class NotFoundError(AppException):
    def __init__(self, resource: str, id: str | None = None):
        message = f"{resource} not found" if not id else f"{resource} with ID {id} not found"
        super().__init__(message, status_code=404, code="NOT_FOUND")

class ConflictError(AppException):
    def __init__(self, message: str = "Resource already exists"):
        super().__init__(message, status_code=409, code="CONFLICT")

async def app_exception_handler(request: Request, exc: AppException) -> JSONResponse:
    """Handle application exceptions."""
    logger.warning(
        "app_exception",
        code=exc.code,
        message=exc.message,
        path=request.url.path
    )
    
    return JSONResponse(
        status_code=exc.status_code,
        content={
            "success": False,
            "error": {
                "code": exc.code,
                "message": exc.message,
                **({"details": exc.details} if exc.details else {})
            }
        }
    )

async def validation_exception_handler(
    request: Request,
    exc: RequestValidationError
) -> JSONResponse:
    """Handle validation errors with detailed messages."""
    errors = {}
    
    for error in exc.errors():
        field = ".".join(str(loc) for loc in error["loc"])
        if field not in errors:
            errors[field] = []
        errors[field].append(error["msg"])
    
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "success": False,
            "error": {
                "code": "VALIDATION_ERROR",
                "message": "Validation failed",
                "details": errors
            }
        }
    )
```

---

## ⚡ Async Patterns

### 1. Background Tasks

```python
# app/api/v1/endpoints/users.py
from fastapi import BackgroundTasks

@router.post("", response_model=UserResponse, status_code=201)
async def create_user(
    user_in: UserCreate,
    service: UserServiceDep,
    background_tasks: BackgroundTasks
) -> UserResponse:
    """Create user and send welcome email in background."""
    user = await service.create(user_in)
    
    # Add background task
    background_tasks.add_task(
        send_welcome_email,
        email=user.email,
        name=user.full_name
    )
    
    return user

async def send_welcome_email(email: str, name: str) -> None:
    """Send welcome email (runs in background)."""
    # Email sending logic
    pass
```

### 2. Concurrent Operations

```python
# app/services/dashboard_service.py
import asyncio
from typing import TypedDict

class DashboardData(TypedDict):
    user_stats: dict
    order_stats: dict
    product_stats: dict

class DashboardService:
    async def get_dashboard(self, user_id: UUID) -> DashboardData:
        """Fetch all dashboard data concurrently."""
        user_stats, order_stats, product_stats = await asyncio.gather(
            self._get_user_stats(user_id),
            self._get_order_stats(user_id),
            self._get_product_stats(user_id)
        )
        
        return {
            "user_stats": user_stats,
            "order_stats": order_stats,
            "product_stats": product_stats
        }
    
    async def get_dashboard_safe(self, user_id: UUID) -> DashboardData:
        """Fetch dashboard with error handling for each task."""
        results = await asyncio.gather(
            self._get_user_stats(user_id),
            self._get_order_stats(user_id),
            self._get_product_stats(user_id),
            return_exceptions=True
        )
        
        return {
            "user_stats": results[0] if not isinstance(results[0], Exception) else {},
            "order_stats": results[1] if not isinstance(results[1], Exception) else {},
            "product_stats": results[2] if not isinstance(results[2], Exception) else {}
        }
```

---

## 🧪 Testing Patterns

### 1. Test Client Setup

```python
# tests/conftest.py
import pytest
from typing import AsyncGenerator
from httpx import AsyncClient, ASGITransport
from sqlalchemy.ext.asyncio import AsyncSession, create_async_engine
from sqlalchemy.orm import sessionmaker

from app.main import app
from app.models.base import Base
from app.api.deps import get_db

TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test_db"

@pytest.fixture(scope="session")
async def engine():
    """Create test database engine."""
    engine = create_async_engine(TEST_DATABASE_URL)
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    yield engine
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.drop_all)
    await engine.dispose()

@pytest.fixture
async def db_session(engine) -> AsyncGenerator[AsyncSession, None]:
    """Create test database session with rollback."""
    async_session = sessionmaker(engine, class_=AsyncSession, expire_on_commit=False)
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    """Create test client with overridden dependencies."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client
    
    app.dependency_overrides.clear()
```

---

## 🏷️ Tags

`fastapi` `pydantic` `dependency-injection` `async` `validation` `routers` `middleware` `patterns`
