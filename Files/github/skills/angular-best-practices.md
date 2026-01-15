# Skill: Angular Best Practices

## Metadata

```yaml
name: angular-best-practices
category: code
type: quality
framework: Angular
created: 2026-01-13
version: 1.0.0
```

## Purpose

Provides comprehensive best practices for Angular development including performance optimization, RxJS patterns, security, testing, state management with NgRx, and production deployment guidelines.

## Core Best Practices

### 1. Performance Optimization

**Lazy Loading Routes:**

```typescript
// app.routes.ts
const routes: Routes = [
  {
    path: 'dashboard',
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent)
  },
  {
    path: 'admin',
    loadChildren: () => import('./admin/admin.module')
      .then(m => m.AdminModule)
  }
];
```

**OnPush Change Detection:**

```typescript
@Component({
  selector: 'app-list',
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ListComponent {
  // Only checks when:
  // - Input properties change
  // - Events fire
  // - Observables emit (async pipe)
}
```

**TrackBy Function:**

```typescript
@Component({
  template: `
    <div *ngFor="let item of items; trackBy: trackByFn">
      {{ item.name }}
    </div>
  `
})
export class ListComponent {
  items: Item[] = [];

  trackByFn(index: number, item: Item): number {
    return item.id; // Use unique identifier
  }
}
```

**Unsubscribe Management:**

```typescript
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

@Component({})
export class MyComponent {
  private data$ = this.apiService.getData();

  constructor() {
    this.data$
      .pipe(takeUntilDestroyed())
      .subscribe(data => console.log(data));
  }
}
```

**Async Pipe:**

```typescript
@Component({
  template: `<div>{{ data$ | async }}</div>`
})
export class DataComponent {
  data$ = this.apiService.getData();
}
```

### 2. RxJS Patterns

**Proper Subscription Cleanup:**

```typescript
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

export class MyComponent implements OnDestroy {
  private destroy$ = new Subject<void>();

  constructor(private apiService: ApiService) {
    this.apiService.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe(data => {
        // Handle data
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

**Combining Observables:**

```typescript
import { combineLatest, merge, forkJoin } from 'rxjs';

// combineLatest - emits when any input changes
const combined$ = combineLatest([
  this.userService.getUser(),
  this.settingsService.getSettings()
]);

// merge - emits from any source
const merged$ = merge(
  this.userService.userChanged$,
  this.settingsService.settingsChanged$
);

// forkJoin - waits for all to complete (like Promise.all)
const forked$ = forkJoin([
  this.api.getUsers(),
  this.api.getPosts()
]);
```

**Error Handling:**

```typescript
import { catchError } from 'rxjs/operators';
import { throwError } from 'rxjs';

export class DataComponent {
  data$ = this.apiService.getData().pipe(
    catchError(error => {
      console.error('Error:', error);
      return throwError(() => new Error('Failed to load data'));
    })
  );
}
```

**Retry Logic:**

```typescript
import { retry, retryWhen, delay } from 'rxjs/operators';
import { take } from 'rxjs';

export class DataComponent {
  data$ = this.apiService.getData().pipe(
    retry(3), // Simple retry
    retryWhen(errors =>
      errors.pipe(
        delay(1000), // Wait 1 second before retry
        take(3) // Only retry 3 times
      )
    )
  );
}
```

### 3. State Management with NgRx

**Store Structure:**

```typescript
// store/app.state.ts
export interface AppState {
  users: UsersState;
  posts: PostsState;
  ui: UiState;
}

// store/users/users.state.ts
export interface UsersState {
  entities: User[];
  loading: boolean;
  error: string | null;
  selectedId: number | null;
}

// store/users/users.actions.ts
export const loadUsers = createAction('[Users Page] Load Users');
export const loadUsersSuccess = createAction(
  '[Users API] Load Users Success',
  props<{ users: User[] }>()
);
export const loadUsersFailure = createAction(
  '[Users API] Load Users Failure',
  props<{ error: string }>()
);

// store/users/users.reducer.ts
export const usersReducer = createReducer(
  initialState,
  on(loadUsers, state => ({ ...state, loading: true })),
  on(loadUsersSuccess, (state, { users }) => ({
    ...state,
    entities: users,
    loading: false
  })),
  on(loadUsersFailure, (state, { error }) => ({
    ...state,
    error,
    loading: false
  }))
);

// store/users/users.effects.ts
@Injectable()
export class UsersEffects {
  loadUsers$ = createEffect(() =>
    this.actions$.pipe(
      ofType(loadUsers),
      switchMap(() =>
        this.apiService.getUsers().pipe(
          map(users => loadUsersSuccess({ users })),
          catchError(error => of(loadUsersFailure({ error: error.message })))
        )
      )
    )
  );

  constructor(
    private actions$: Actions,
    private apiService: ApiService
  ) {}
}

// store/users/users.selectors.ts
export const selectUsersFeature = (state: AppState) => state.users;

export const selectAllUsers = createSelector(
  selectUsersFeature,
  (state: UsersState) => state.entities
);

export const selectUsersLoading = createSelector(
  selectUsersFeature,
  (state: UsersState) => state.loading
);

export const selectSelectedUser = createSelector(
  selectUsersFeature,
  (state: UsersState) => {
    return state.selectedId
      ? state.entities.find(u => u.id === state.selectedId)
      : null;
  }
);
```

**Using Selectors in Components:**

```typescript
@Component({})
export class UsersListComponent {
  users$ = this.store.select(selectAllUsers);
  loading$ = this.store.select(selectUsersLoading);

  constructor(private store: Store<AppState>) {}

  ngOnInit() {
    this.store.dispatch(loadUsers());
  }
}
```

### 4. Security Best Practices

**Sanitizing User Input:**

```typescript
import { DomSanitizer } from '@angular/platform-browser';

@Component({
  template: `<div [innerHTML]="sanitizedHtml"></div>`
})
export class SafeHtmlComponent {
  sanitizedHtml: SafeHtml;

  constructor(private sanitizer: DomSanitizer) {
    this.sanitizedHtml = this.sanitizer.sanitize(SecurityContext.HTML, userInput);
  }
}
```

**Secure HTTP Headers:**

```typescript
import { HttpClient, HttpHeaders } from '@angular/common/http';

@Injectable()
export class ApiService {
  constructor(private http: HttpClient) {}

  getData() {
    const headers = new HttpHeaders({
      'X-Requested-With': 'XMLHttpRequest',
      'Content-Type': 'application/json'
    });

    return this.http.get('/api/data', { headers });
  }
}
```

**CSRF Token:**

```typescript
import { HttpInterceptor, HttpRequest, HttpHandler, HttpEvent } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';

@Injectable()
export class CsrfInterceptor implements HttpInterceptor {
  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.getCsrfToken();
    
    if (req.method !== 'GET' && token) {
      req = req.clone({
        setHeaders: {
          'X-CSRF-Token': token
        }
      });
    }
    
    return next.handle(req);
  }

  private getCsrfToken(): string {
    return document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';
  }
}
```

**Authentication Interceptor:**

```typescript
@Injectable()
export class AuthInterceptor implements HttpInterceptor {
  constructor(private authService: AuthService, private router: Router) {}

  intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
    const token = this.authService.getToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
    }

    return next.handle(req).pipe(
      catchError(error => {
        if (error.status === 401) {
          this.authService.logout();
          this.router.navigate(['/login']);
        }
        return throwError(() => error);
      })
    );
  }
}
```

### 5. Testing Best Practices

**Component Testing:**

```typescript
import { ComponentFixture, TestBed } from '@angular/core/testing';
import { ButtonComponent } from './button.component';

describe('ButtonComponent', () => {
  let component: ButtonComponent;
  let fixture: ComponentFixture<ButtonComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ButtonComponent]
    }).compileComponents();

    fixture = TestBed.createComponent(ButtonComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should render', () => {
    expect(component).toBeTruthy();
  });

  it('should emit click event', () => {
    spyOn(component.clicked, 'emit');
    component.onClick();
    expect(component.clicked.emit).toHaveBeenCalled();
  });
});
```

**Service Testing:**

```typescript
describe('UserService', () => {
  let service: UserService;
  let httpMock: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
      providers: [UserService]
    });

    service = TestBed.inject(UserService);
    httpMock = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    httpMock.verify();
  });

  it('should fetch users', () => {
    const mockUsers = [{ id: 1, name: 'John' }];

    service.getUsers().subscribe(users => {
      expect(users).toEqual(mockUsers);
    });

    const req = httpMock.expectOne('/api/users');
    expect(req.request.method).toBe('GET');
    req.flush(mockUsers);
  });
});
```

### 6. Accessibility

**ARIA Attributes:**

```typescript
@Component({
  template: `
    <button 
      [attr.aria-label]="'Close dialog'" 
      (click)="close()"
    >
      ×
    </button>
    <div role="status" aria-live="polite" aria-busy="false">
      Status message
    </div>
  `
})
export class AccessibleComponent {}
```

**Keyboard Navigation:**

```typescript
@Component({
  template: `
    <div role="listbox" (keydown)="handleKeydown($event)">
      <div 
        *ngFor="let item of items"
        role="option"
        [attr.aria-selected]="item.id === selectedId"
        tabindex="0"
      >
        {{ item.name }}
      </div>
    </div>
  `
})
export class ListboxComponent {
  selectedId: number | null = null;
  items: Item[] = [];

  handleKeydown(event: KeyboardEvent) {
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.selectNext();
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.selectPrevious();
        break;
    }
  }

  private selectNext() {
    // Implementation
  }

  private selectPrevious() {
    // Implementation
  }
}
```

### 7. Build and Deployment

**Optimized Build Configuration:**

```json
// angular.json
{
  "projects": {
    "app": {
      "architect": {
        "build": {
          "options": {
            "outputPath": "dist/app",
            "optimization": true,
            "sourceMap": false,
            "namedChunks": false,
            "aot": true,
            "vendorChunk": false,
            "buildOptimizer": true,
            "fileReplacements": [
              {
                "replace": "src/environments/environment.ts",
                "with": "src/environments/environment.prod.ts"
              }
            ]
          }
        }
      }
    }
  }
}
```

**Environment Configuration:**

```typescript
// environment.ts
export const environment = {
  production: false,
  apiUrl: 'http://localhost:5000'
};

// environment.prod.ts
export const environment = {
  production: true,
  apiUrl: 'https://api.example.com'
};
```

**Docker Deployment:**

```dockerfile
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci
COPY . .
RUN npm run build -- --configuration production

FROM nginx:alpine
COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/nginx.conf
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]
```

## Anti-Patterns to Avoid

### 1. Memory Leaks

```typescript
// ❌ Bad - subscription not unsubscribed
ngOnInit() {
  this.apiService.getData().subscribe(data => {
    this.data = data;
  }); // Never unsubscribed!
}

// ✅ Good - proper cleanup
ngOnInit() {
  this.apiService.getData()
    .pipe(takeUntil(this.destroy$))
    .subscribe(data => {
      this.data = data;
    });
}
```

### 2. Change Detection Issues

```typescript
// ❌ Bad - unnecessary change detection cycles
@Component({
  template: `<div>{{ expensiveMethod() }}</div>`
})
export class MyComponent {
  expensiveMethod() {
    return complexCalculation(); // Called on every change detection
  }
}

// ✅ Good - use computed values
@Component({
  template: `<div>{{ result }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class MyComponent {
  result = this.computeValue();
  
  private computeValue() {
    return complexCalculation();
  }
}
```

### 3. Untyped Dependencies

```typescript
// ❌ Bad - untyped
constructor(private service: any) {}

// ✅ Good - properly typed
constructor(private service: UserService) {}
```

## Schema Reference

- `docs/schemas/skills/angular-best-practices.input.schema.json`
- `docs/schemas/skills/angular-best-practices.output.schema.json`

## Version History

- **1.0.0** (2026-01-13): Initial best practices for Angular

## Related Documentation

- Agent: `angular-specialist.md`
- Related Skills: `angular-component-patterns.md`
- Official Docs: https://angular.dev/guide/styleguide
