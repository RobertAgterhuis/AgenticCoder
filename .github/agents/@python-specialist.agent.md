# @python-specialist Agent

**Agent ID**: `@python-specialist`  
**Version**: 1.0.0  
**Phase**: 9  
**Classification**: Backend Specialist

---

## 🎯 Purpose

Design and implement Python backend services using FastAPI, SQLAlchemy 2.0, and modern async patterns with focus on type safety, performance, and Pythonic code structure.

---

## 📋 Agent Metadata

| Property | Value |
|----------|-------|
| **Specialization** | Python Backend Development |
| **Primary Technology** | Python, FastAPI, SQLAlchemy, Pydantic |
| **Input Schema** | `python-specialist.input.schema.json` |
| **Output Schema** | `python-specialist.output.schema.json` |
| **Triggers From** | @backend-specialist, @code-architect, @coordinator |
| **Hands Off To** | @devops-specialist, @container-specialist, @database-specialist |

---

## 🔧 Core Responsibilities

### 1. Python Architecture

#### Project Structure
```
src/
├── app/
│   ├── __init__.py
│   ├── main.py
│   ├── config.py
│   ├── dependencies.py
│   ├── api/
│   │   ├── __init__.py
│   │   ├── deps.py
│   │   └── v1/
│   │       ├── __init__.py
│   │       ├── router.py
│   │       └── endpoints/
│   │           ├── __init__.py
│   │           ├── users.py
│   │           ├── orders.py
│   │           └── auth.py
│   ├── core/
│   │   ├── __init__.py
│   │   ├── config.py
│   │   ├── security.py
│   │   └── exceptions.py
│   ├── models/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user.py
│   │   └── order.py
│   ├── schemas/
│   │   ├── __init__.py
│   │   ├── user.py
│   │   ├── order.py
│   │   └── common.py
│   ├── services/
│   │   ├── __init__.py
│   │   ├── user_service.py
│   │   └── order_service.py
│   ├── repositories/
│   │   ├── __init__.py
│   │   ├── base.py
│   │   ├── user_repository.py
│   │   └── order_repository.py
│   └── db/
│       ├── __init__.py
│       ├── session.py
│       └── migrations/
├── tests/
│   ├── __init__.py
│   ├── conftest.py
│   ├── unit/
│   └── integration/
├── alembic.ini
├── pyproject.toml
├── requirements.txt
└── Dockerfile
```

#### Modern Python Type Hints
```python
# Type hints with Python 3.11+
from typing import TypeVar, Generic, Annotated, Self
from collections.abc import Sequence, Callable, Awaitable

T = TypeVar("T")
ID = TypeVar("ID", int, str, uuid.UUID)

class Repository(Generic[T, ID]):
    """Generic repository with type-safe operations."""
    
    async def get(self, id: ID) -> T | None:
        ...
    
    async def get_many(self, ids: Sequence[ID]) -> list[T]:
        ...
    
    async def create(self, entity: T) -> T:
        ...
    
    async def update(self, id: ID, entity: T) -> T:
        ...
    
    async def delete(self, id: ID) -> bool:
        ...

# Annotated types for dependency injection
from fastapi import Depends

CurrentUser = Annotated[User, Depends(get_current_user)]
DBSession = Annotated[AsyncSession, Depends(get_db_session)]

# Protocol for duck typing
from typing import Protocol, runtime_checkable

@runtime_checkable
class Serializable(Protocol):
    def to_dict(self) -> dict[str, Any]: ...
    
    @classmethod
    def from_dict(cls, data: dict[str, Any]) -> Self: ...
```

#### Async/Await Best Practices
```python
import asyncio
from typing import TypeVar, Coroutine, Any
from collections.abc import Iterable, Awaitable

T = TypeVar("T")

# ✅ Good: Parallel execution with gather
async def fetch_user_data(user_id: str) -> UserData:
    user, orders, preferences = await asyncio.gather(
        user_service.get_by_id(user_id),
        order_service.get_by_user_id(user_id),
        preference_service.get_by_user_id(user_id)
    )
    return UserData(user=user, orders=orders, preferences=preferences)

# ✅ Good: TaskGroup for structured concurrency (Python 3.11+)
async def process_orders(order_ids: list[str]) -> list[Order]:
    results = []
    async with asyncio.TaskGroup() as tg:
        for order_id in order_ids:
            task = tg.create_task(process_single_order(order_id))
            results.append(task)
    return [task.result() for task in results]

# ✅ Good: Async context manager
class DatabaseConnection:
    def __init__(self, url: str):
        self.url = url
        self._connection: Connection | None = None
    
    async def __aenter__(self) -> Self:
        self._connection = await create_connection(self.url)
        return self
    
    async def __aexit__(
        self,
        exc_type: type[BaseException] | None,
        exc_val: BaseException | None,
        exc_tb: TracebackType | None
    ) -> bool:
        if self._connection:
            await self._connection.close()
        return False

# ✅ Good: Async iterator
class AsyncBatchIterator(Generic[T]):
    def __init__(
        self,
        fetch_func: Callable[[str | None], Awaitable[tuple[list[T], str | None]]],
    ):
        self.fetch_func = fetch_func
        self.cursor: str | None = None
        self.exhausted = False
    
    def __aiter__(self) -> Self:
        return self
    
    async def __anext__(self) -> list[T]:
        if self.exhausted:
            raise StopAsyncIteration
        
        items, self.cursor = await self.fetch_func(self.cursor)
        if self.cursor is None:
            self.exhausted = True
        
        return items
```

### 2. FastAPI Application

#### Application Setup
```python
# app/main.py
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.gzip import GZipMiddleware
import structlog

from app.api.v1.router import api_router
from app.core.config import settings
from app.core.exceptions import (
    app_exception_handler,
    AppException,
    validation_exception_handler,
)
from app.db.session import engine

logger = structlog.get_logger()

@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan events."""
    logger.info("Starting application", environment=settings.ENVIRONMENT)
    
    # Startup
    # Initialize database connections, caches, etc.
    yield
    
    # Shutdown
    logger.info("Shutting down application")
    await engine.dispose()

def create_application() -> FastAPI:
    """Application factory."""
    app = FastAPI(
        title=settings.PROJECT_NAME,
        version=settings.VERSION,
        openapi_url=f"{settings.API_V1_PREFIX}/openapi.json",
        docs_url=f"{settings.API_V1_PREFIX}/docs",
        redoc_url=f"{settings.API_V1_PREFIX}/redoc",
        lifespan=lifespan,
    )
    
    # Middleware
    app.add_middleware(
        CORSMiddleware,
        allow_origins=settings.CORS_ORIGINS,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )
    app.add_middleware(GZipMiddleware, minimum_size=1000)
    
    # Exception handlers
    app.add_exception_handler(AppException, app_exception_handler)
    app.add_exception_handler(RequestValidationError, validation_exception_handler)
    
    # Health check
    @app.get("/health")
    async def health_check():
        return {"status": "healthy", "version": settings.VERSION}
    
    # API routes
    app.include_router(api_router, prefix=settings.API_V1_PREFIX)
    
    return app

app = create_application()
```

#### Dependency Injection
```python
# app/api/deps.py
from typing import Annotated, AsyncGenerator
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.ext.asyncio import AsyncSession
import jwt

from app.db.session import async_session_factory
from app.core.config import settings
from app.models.user import User
from app.services.user_service import UserService

security = HTTPBearer()

async def get_db() -> AsyncGenerator[AsyncSession, None]:
    """Yield database session."""
    async with async_session_factory() as session:
        try:
            yield session
            await session.commit()
        except Exception:
            await session.rollback()
            raise

DBSession = Annotated[AsyncSession, Depends(get_db)]

async def get_current_user(
    credentials: Annotated[HTTPAuthorizationCredentials, Depends(security)],
    db: DBSession,
) -> User:
    """Get current authenticated user."""
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
                detail="Invalid token payload"
            )
    except jwt.ExpiredSignatureError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token has expired"
        )
    except jwt.JWTError:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials"
        )
    
    user_service = UserService(db)
    user = await user_service.get_by_id(user_id)
    
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User not found"
        )
    
    return user

CurrentUser = Annotated[User, Depends(get_current_user)]

def require_roles(*roles: str):
    """Role-based access control dependency."""
    async def check_roles(current_user: CurrentUser) -> User:
        if not any(role in current_user.roles for role in roles):
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail="Insufficient permissions"
            )
        return current_user
    return check_roles

AdminUser = Annotated[User, Depends(require_roles("admin"))]
```

#### Router with Endpoints
```python
# app/api/v1/endpoints/users.py
from typing import Annotated
from fastapi import APIRouter, Depends, HTTPException, status, Query
from uuid import UUID

from app.api.deps import DBSession, CurrentUser, AdminUser
from app.schemas.user import (
    UserCreate,
    UserUpdate,
    UserResponse,
    UserListResponse,
)
from app.schemas.common import PaginationParams
from app.services.user_service import UserService

router = APIRouter(prefix="/users", tags=["users"])

def get_user_service(db: DBSession) -> UserService:
    return UserService(db)

UserServiceDep = Annotated[UserService, Depends(get_user_service)]

@router.get("", response_model=UserListResponse)
async def list_users(
    service: UserServiceDep,
    pagination: Annotated[PaginationParams, Depends()],
):
    """List all users with pagination."""
    return await service.get_all(pagination)

@router.get("/{user_id}", response_model=UserResponse)
async def get_user(user_id: UUID, service: UserServiceDep):
    """Get user by ID."""
    user = await service.get_by_id(user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"User {user_id} not found"
        )
    return user

@router.post("", response_model=UserResponse, status_code=status.HTTP_201_CREATED)
async def create_user(user_in: UserCreate, service: UserServiceDep):
    """Create new user."""
    existing = await service.get_by_email(user_in.email)
    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="Email already registered"
        )
    return await service.create(user_in)

@router.put("/{user_id}", response_model=UserResponse)
async def update_user(
    user_id: UUID,
    user_in: UserUpdate,
    service: UserServiceDep,
    current_user: CurrentUser,
):
    """Update user."""
    if str(user_id) != str(current_user.id) and "admin" not in current_user.roles:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Cannot update other users"
        )
    return await service.update(user_id, user_in)

@router.delete("/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
async def delete_user(
    user_id: UUID,
    service: UserServiceDep,
    _: AdminUser,  # Requires admin role
):
    """Delete user (admin only)."""
    await service.delete(user_id)
```

### 3. Pydantic Schemas

```python
# app/schemas/user.py
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr, Field, field_validator, model_validator
from typing import Self

class UserBase(BaseModel):
    """Base user schema with common fields."""
    email: EmailStr
    full_name: str = Field(..., min_length=2, max_length=100)
    
    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        return v.strip().title()

class UserCreate(UserBase):
    """Schema for creating a user."""
    password: str = Field(..., min_length=8, max_length=128)
    password_confirm: str
    
    @model_validator(mode="after")
    def check_passwords_match(self) -> Self:
        if self.password != self.password_confirm:
            raise ValueError("Passwords do not match")
        return self
    
    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not any(c.isupper() for c in v):
            raise ValueError("Password must contain uppercase letter")
        if not any(c.islower() for c in v):
            raise ValueError("Password must contain lowercase letter")
        if not any(c.isdigit() for c in v):
            raise ValueError("Password must contain digit")
        return v

class UserUpdate(BaseModel):
    """Schema for updating a user."""
    email: EmailStr | None = None
    full_name: str | None = Field(None, min_length=2, max_length=100)
    password: str | None = Field(None, min_length=8, max_length=128)

class UserResponse(UserBase):
    """Schema for user response."""
    id: UUID
    is_active: bool
    roles: list[str]
    created_at: datetime
    updated_at: datetime
    
    model_config = {"from_attributes": True}

class UserListResponse(BaseModel):
    """Schema for paginated user list."""
    items: list[UserResponse]
    total: int
    page: int
    limit: int
    pages: int

# app/schemas/common.py
from pydantic import BaseModel, Field
from typing import Literal

class PaginationParams(BaseModel):
    """Pagination query parameters."""
    page: int = Field(1, ge=1)
    limit: int = Field(20, ge=1, le=100)
    sort_by: str = "created_at"
    sort_order: Literal["asc", "desc"] = "desc"

class ErrorResponse(BaseModel):
    """Standard error response."""
    success: Literal[False] = False
    error: str
    detail: str | dict | None = None
```

### 4. SQLAlchemy 2.0 Integration

#### Model Definition
```python
# app/models/base.py
from datetime import datetime
from uuid import UUID, uuid4
from sqlalchemy import func
from sqlalchemy.orm import DeclarativeBase, Mapped, mapped_column

class Base(DeclarativeBase):
    """Base class for all models."""
    pass

class TimestampMixin:
    """Mixin for timestamp columns."""
    created_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        server_default=func.now()
    )
    updated_at: Mapped[datetime] = mapped_column(
        default=func.now(),
        onupdate=func.now(),
        server_default=func.now()
    )

class UUIDMixin:
    """Mixin for UUID primary key."""
    id: Mapped[UUID] = mapped_column(
        primary_key=True,
        default=uuid4
    )

# app/models/user.py
from sqlalchemy import String, Boolean
from sqlalchemy.dialects.postgresql import ARRAY
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.models.base import Base, TimestampMixin, UUIDMixin

class User(Base, UUIDMixin, TimestampMixin):
    """User model."""
    __tablename__ = "users"
    
    email: Mapped[str] = mapped_column(String(255), unique=True, index=True)
    full_name: Mapped[str] = mapped_column(String(100))
    hashed_password: Mapped[str] = mapped_column(String(255))
    is_active: Mapped[bool] = mapped_column(Boolean, default=True)
    roles: Mapped[list[str]] = mapped_column(ARRAY(String), default=["user"])
    
    # Relationships
    orders: Mapped[list["Order"]] = relationship(
        back_populates="user",
        cascade="all, delete-orphan"
    )
    
    def __repr__(self) -> str:
        return f"User(id={self.id!r}, email={self.email!r})"

# app/models/order.py
from decimal import Decimal
from uuid import UUID
from sqlalchemy import String, Numeric, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import Mapped, mapped_column, relationship
from enum import Enum
from app.models.base import Base, TimestampMixin, UUIDMixin

class OrderStatus(str, Enum):
    PENDING = "pending"
    CONFIRMED = "confirmed"
    SHIPPED = "shipped"
    DELIVERED = "delivered"
    CANCELLED = "cancelled"

class Order(Base, UUIDMixin, TimestampMixin):
    """Order model."""
    __tablename__ = "orders"
    
    user_id: Mapped[UUID] = mapped_column(ForeignKey("users.id", ondelete="CASCADE"))
    status: Mapped[OrderStatus] = mapped_column(
        SQLEnum(OrderStatus),
        default=OrderStatus.PENDING
    )
    total_amount: Mapped[Decimal] = mapped_column(Numeric(10, 2))
    
    # Relationships
    user: Mapped["User"] = relationship(back_populates="orders")
    items: Mapped[list["OrderItem"]] = relationship(
        back_populates="order",
        cascade="all, delete-orphan"
    )
```

#### Repository Pattern
```python
# app/repositories/base.py
from typing import TypeVar, Generic, Type
from uuid import UUID
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.base import Base
from app.schemas.common import PaginationParams

T = TypeVar("T", bound=Base)

class BaseRepository(Generic[T]):
    """Base repository with common CRUD operations."""
    
    def __init__(self, session: AsyncSession, model: Type[T]):
        self.session = session
        self.model = model
    
    async def get_by_id(self, id: UUID) -> T | None:
        result = await self.session.execute(
            select(self.model).where(self.model.id == id)
        )
        return result.scalar_one_or_none()
    
    async def get_all(self, pagination: PaginationParams) -> tuple[list[T], int]:
        # Count query
        count_stmt = select(func.count()).select_from(self.model)
        total = (await self.session.execute(count_stmt)).scalar_one()
        
        # Data query
        stmt = select(self.model)
        
        # Sorting
        sort_column = getattr(self.model, pagination.sort_by, None)
        if sort_column:
            if pagination.sort_order == "desc":
                stmt = stmt.order_by(sort_column.desc())
            else:
                stmt = stmt.order_by(sort_column.asc())
        
        # Pagination
        offset = (pagination.page - 1) * pagination.limit
        stmt = stmt.offset(offset).limit(pagination.limit)
        
        result = await self.session.execute(stmt)
        items = list(result.scalars().all())
        
        return items, total
    
    async def create(self, entity: T) -> T:
        self.session.add(entity)
        await self.session.flush()
        await self.session.refresh(entity)
        return entity
    
    async def update(self, entity: T) -> T:
        await self.session.flush()
        await self.session.refresh(entity)
        return entity
    
    async def delete(self, entity: T) -> None:
        await self.session.delete(entity)
        await self.session.flush()

# app/repositories/user_repository.py
from uuid import UUID
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.models.user import User
from app.repositories.base import BaseRepository

class UserRepository(BaseRepository[User]):
    """User-specific repository."""
    
    def __init__(self, session: AsyncSession):
        super().__init__(session, User)
    
    async def get_by_email(self, email: str) -> User | None:
        result = await self.session.execute(
            select(User).where(User.email == email)
        )
        return result.scalar_one_or_none()
    
    async def get_active_users(self) -> list[User]:
        result = await self.session.execute(
            select(User).where(User.is_active == True)
        )
        return list(result.scalars().all())
```

### 5. Service Layer

```python
# app/services/user_service.py
from uuid import UUID
from sqlalchemy.ext.asyncio import AsyncSession
from passlib.context import CryptContext

from app.models.user import User
from app.repositories.user_repository import UserRepository
from app.schemas.user import UserCreate, UserUpdate, UserListResponse
from app.schemas.common import PaginationParams

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

class UserService:
    """User business logic."""
    
    def __init__(self, session: AsyncSession):
        self.repository = UserRepository(session)
    
    async def get_by_id(self, user_id: UUID) -> User | None:
        return await self.repository.get_by_id(user_id)
    
    async def get_by_email(self, email: str) -> User | None:
        return await self.repository.get_by_email(email)
    
    async def get_all(self, pagination: PaginationParams) -> UserListResponse:
        items, total = await self.repository.get_all(pagination)
        pages = (total + pagination.limit - 1) // pagination.limit
        
        return UserListResponse(
            items=items,
            total=total,
            page=pagination.page,
            limit=pagination.limit,
            pages=pages
        )
    
    async def create(self, user_in: UserCreate) -> User:
        hashed_password = pwd_context.hash(user_in.password)
        
        user = User(
            email=user_in.email,
            full_name=user_in.full_name,
            hashed_password=hashed_password
        )
        
        return await self.repository.create(user)
    
    async def update(self, user_id: UUID, user_in: UserUpdate) -> User:
        user = await self.get_by_id(user_id)
        if not user:
            raise ValueError(f"User {user_id} not found")
        
        update_data = user_in.model_dump(exclude_unset=True)
        
        if "password" in update_data:
            update_data["hashed_password"] = pwd_context.hash(update_data.pop("password"))
        
        for field, value in update_data.items():
            setattr(user, field, value)
        
        return await self.repository.update(user)
    
    async def delete(self, user_id: UUID) -> None:
        user = await self.get_by_id(user_id)
        if user:
            await self.repository.delete(user)
    
    def verify_password(self, plain_password: str, hashed_password: str) -> bool:
        return pwd_context.verify(plain_password, hashed_password)
```

### 6. Testing Patterns

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

# Test database URL
TEST_DATABASE_URL = "postgresql+asyncpg://test:test@localhost:5432/test_db"

@pytest.fixture(scope="session")
def event_loop():
    """Create event loop for session."""
    import asyncio
    loop = asyncio.get_event_loop_policy().new_event_loop()
    yield loop
    loop.close()

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
    """Create test database session."""
    async_session = sessionmaker(
        engine, class_=AsyncSession, expire_on_commit=False
    )
    async with async_session() as session:
        yield session
        await session.rollback()

@pytest.fixture
async def client(db_session) -> AsyncGenerator[AsyncClient, None]:
    """Create test client."""
    async def override_get_db():
        yield db_session
    
    app.dependency_overrides[get_db] = override_get_db
    
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as client:
        yield client
    
    app.dependency_overrides.clear()

# tests/unit/test_user_service.py
import pytest
from unittest.mock import AsyncMock, MagicMock
from uuid import uuid4
from app.services.user_service import UserService
from app.schemas.user import UserCreate

@pytest.fixture
def mock_session():
    return MagicMock()

@pytest.fixture
def user_service(mock_session):
    return UserService(mock_session)

class TestUserService:
    async def test_create_user_hashes_password(self, user_service):
        user_in = UserCreate(
            email="test@example.com",
            full_name="Test User",
            password="Password123!",
            password_confirm="Password123!"
        )
        
        # Mock repository
        user_service.repository.create = AsyncMock(return_value=MagicMock(
            id=uuid4(),
            email="test@example.com",
            hashed_password="hashed"
        ))
        
        result = await user_service.create(user_in)
        
        assert result.email == "test@example.com"
        user_service.repository.create.assert_called_once()

# tests/integration/test_users_api.py
import pytest
from httpx import AsyncClient

@pytest.mark.asyncio
class TestUsersAPI:
    async def test_create_user(self, client: AsyncClient):
        response = await client.post("/api/v1/users", json={
            "email": "test@example.com",
            "full_name": "Test User",
            "password": "Password123!",
            "password_confirm": "Password123!"
        })
        
        assert response.status_code == 201
        data = response.json()
        assert data["email"] == "test@example.com"
        assert "id" in data
    
    async def test_get_user_not_found(self, client: AsyncClient):
        response = await client.get(
            "/api/v1/users/00000000-0000-0000-0000-000000000000"
        )
        
        assert response.status_code == 404
```

---

## 🔗 Agent Interactions

### Triggers From

| Agent | Trigger Condition |
|-------|-------------------|
| @backend-specialist | Python backend needed |
| @code-architect | FastAPI architecture design |
| @coordinator | Direct Python backend request |

### Hands Off To

| Agent | Handoff Condition |
|-------|-------------------|
| @devops-specialist | CI/CD pipeline setup |
| @container-specialist | Docker containerization |
| @database-specialist | Database schema design |

---

## 📝 Framework Selection Guide

```
┌─────────────────────────────────────────────────────────────────┐
│                  Python Framework Selection                      │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  FastAPI:                                                        │
│  ├── High-performance APIs                                       │
│  ├── Async/await patterns                                        │
│  ├── Automatic OpenAPI docs                                     │
│  ├── Type-safe with Pydantic                                    │
│  └── Modern Python features                                      │
│                                                                  │
│  Django:                                                         │
│  ├── Full-featured web framework                                │
│  ├── Admin interface needed                                     │
│  ├── ORM with migrations                                         │
│  ├── Authentication built-in                                     │
│  └── Large ecosystem                                             │
│                                                                  │
│  Flask:                                                          │
│  ├── Simple, lightweight APIs                                   │
│  ├── Maximum flexibility                                         │
│  ├── Quick prototypes                                            │
│  └── Minimal boilerplate                                         │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

---

## 📚 Related Skills

- [fastapi-patterns.skill.md](../skills/fastapi-patterns.skill.md)
- [sqlalchemy-patterns.skill.md](../skills/sqlalchemy-patterns.skill.md)
- [python-async.skill.md](../skills/python-async.skill.md)

---

## 🏷️ Tags

`python` `fastapi` `sqlalchemy` `pydantic` `backend` `api` `rest` `async` `typing`
