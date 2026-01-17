# Angular Patterns Skill

**Angular 17+ Signals, Standalone Components, and Modern Patterns**

**Version**: 1.0  
**Category**: Frontend Framework  
**Related Agents**: @angular-specialist, @frontend-specialist

---

## Skill Overview

This skill covers Angular 17+ patterns including Signals for reactivity, standalone components, modern control flow syntax, functional guards/interceptors, and dependency injection patterns.

---

## Core Concepts

### 1. Signals Fundamentals

#### Basic Signals
```typescript
import { signal, computed, effect } from '@angular/core';

// Writable signal
const count = signal(0);

// Read value
console.log(count()); // 0

// Update value
count.set(5);
count.update(n => n + 1);

// Computed signal (read-only, derived)
const doubled = computed(() => count() * 2);

// Effect (side effects on signal changes)
effect(() => {
  console.log(`Count changed to: ${count()}`);
});
```

#### Signals in Components
```typescript
import { Component, signal, computed, effect, inject } from '@angular/core';

@Component({
  selector: 'app-counter',
  standalone: true,
  template: `
    <div>
      <p>Count: {{ count() }}</p>
      <p>Doubled: {{ doubled() }}</p>
      <button (click)="increment()">Increment</button>
      <button (click)="reset()">Reset</button>
    </div>
  `
})
export class CounterComponent {
  count = signal(0);
  doubled = computed(() => this.count() * 2);

  constructor() {
    // Log changes
    effect(() => {
      console.log('Count is now:', this.count());
    });
  }

  increment() {
    this.count.update(n => n + 1);
  }

  reset() {
    this.count.set(0);
  }
}
```

### 2. Signal Inputs and Outputs

#### New Input/Output API (Angular 17.1+)
```typescript
import { 
  Component, 
  input, 
  output, 
  computed,
  model 
} from '@angular/core';

@Component({
  selector: 'app-user-card',
  standalone: true,
  template: `
    <div class="card">
      <h2>{{ fullName() }}</h2>
      <p>{{ user().email }}</p>
      
      @if (editable()) {
        <input 
          [ngModel]="name()" 
          (ngModelChange)="name.set($event)"
        />
        <button (click)="save.emit(user())">Save</button>
        <button (click)="delete.emit(user().id)">Delete</button>
      }
    </div>
  `
})
export class UserCardComponent {
  // Required input
  user = input.required<User>();
  
  // Optional input with default
  editable = input(false);
  
  // Input with alias
  showAvatar = input(true, { alias: 'avatar' });
  
  // Input with transform
  size = input('medium', {
    transform: (value: string) => value.toLowerCase()
  });
  
  // Two-way binding with model()
  name = model('');
  
  // Typed outputs
  save = output<User>();
  delete = output<string>();
  
  // Computed from inputs
  fullName = computed(() => {
    const u = this.user();
    return `${u.firstName} ${u.lastName}`;
  });
}
```

### 3. Standalone Components

#### Standalone Component with Imports
```typescript
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { ButtonComponent } from '@shared/button.component';
import { InputComponent } from '@shared/input.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    ButtonComponent,
    InputComponent
  ],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <app-input 
        label="Email" 
        formControlName="email"
        type="email"
      />
      <app-input 
        label="Password" 
        formControlName="password"
        type="password"
      />
      <app-button type="submit" [disabled]="form.invalid">
        Login
      </app-button>
    </form>
  `
})
export class LoginComponent {
  // ...
}
```

### 4. Modern Control Flow

#### @if / @else
```html
@if (loading()) {
  <app-spinner />
} @else if (error()) {
  <app-error [message]="error()" />
} @else if (data(); as item) {
  <app-item [data]="item" />
} @else {
  <p>No data available</p>
}
```

#### @for with track
```html
<!-- track is REQUIRED in @for -->
@for (item of items(); track item.id) {
  <app-item [item]="item" />
} @empty {
  <p>No items found</p>
}

<!-- Track by index (use sparingly) -->
@for (item of items(); track $index) {
  <span>{{ item }}</span>
}

<!-- Available context variables -->
@for (item of items(); track item.id; let i = $index, first = $first, last = $last, even = $even, odd = $odd, count = $count) {
  <div [class.first]="first" [class.last]="last">
    {{ i + 1 }} of {{ count }}: {{ item.name }}
  </div>
}
```

#### @switch
```html
@switch (status()) {
  @case ('pending') {
    <app-pending-badge />
  }
  @case ('active') {
    <app-active-badge />
  }
  @case ('completed') {
    <app-completed-badge />
  }
  @default {
    <app-unknown-badge />
  }
}
```

#### @defer (Lazy Loading)
```html
<!-- Load when viewport visible -->
@defer (on viewport) {
  <app-heavy-chart />
} @placeholder {
  <div class="chart-placeholder">Chart loading area</div>
} @loading (minimum 500ms) {
  <app-spinner />
} @error {
  <p>Failed to load chart</p>
}

<!-- Other triggers -->
@defer (on idle) { ... }           <!-- When browser is idle -->
@defer (on timer(5s)) { ... }      <!-- After 5 seconds -->
@defer (on interaction) { ... }    <!-- On user interaction -->
@defer (on hover) { ... }          <!-- On hover -->
@defer (when condition()) { ... }  <!-- When condition is true -->

<!-- Prefetching -->
@defer (on viewport; prefetch on idle) {
  <app-heavy-component />
}
```

### 5. Dependency Injection Patterns

#### inject() Function
```typescript
import { Component, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ActivatedRoute, Router } from '@angular/router';
import { UserService } from '@services/user.service';

@Component({
  selector: 'app-user-detail',
  standalone: true,
  template: `...`
})
export class UserDetailComponent {
  // Modern inject() - preferred in standalone components
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private userService = inject(UserService);

  // Inject with options
  private optionalService = inject(OptionalService, { optional: true });
  
  // Self-only injection
  private selfService = inject(SelfService, { self: true });
  
  // Skip self
  private parentService = inject(ParentService, { skipSelf: true });
}
```

#### Injection Tokens
```typescript
import { InjectionToken, inject } from '@angular/core';

// Define token
export const API_URL = new InjectionToken<string>('API_URL');
export const FEATURE_FLAGS = new InjectionToken<FeatureFlags>('FEATURE_FLAGS');

// Provide in config
export const appConfig: ApplicationConfig = {
  providers: [
    { provide: API_URL, useValue: 'https://api.example.com' },
    { 
      provide: FEATURE_FLAGS, 
      useFactory: () => ({
        darkMode: true,
        betaFeatures: false
      })
    }
  ]
};

// Inject and use
@Component({ ... })
export class MyComponent {
  private apiUrl = inject(API_URL);
  private features = inject(FEATURE_FLAGS);
}
```

### 6. Functional Guards and Resolvers

#### Functional Auth Guard
```typescript
// guards/auth.guard.ts
import { inject } from '@angular/core';
import { Router, CanActivateFn, ActivatedRouteSnapshot } from '@angular/router';
import { AuthService } from '@services/auth.service';

export const authGuard: CanActivateFn = (route: ActivatedRouteSnapshot) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login'], {
      queryParams: { returnUrl: route.url.join('/') }
    });
    return false;
  }

  // Role-based access
  const requiredRoles = route.data['roles'] as string[] | undefined;
  if (requiredRoles?.length) {
    const hasRole = requiredRoles.some(role => 
      authService.hasRole(role)
    );
    if (!hasRole) {
      router.navigate(['/forbidden']);
      return false;
    }
  }

  return true;
};
```

#### Functional Resolver
```typescript
// resolvers/user.resolver.ts
import { inject } from '@angular/core';
import { ResolveFn, ActivatedRouteSnapshot } from '@angular/router';
import { UserService } from '@services/user.service';
import { User } from '@models/user.model';

export const userResolver: ResolveFn<User> = (
  route: ActivatedRouteSnapshot
) => {
  const userService = inject(UserService);
  const userId = route.params['id'];
  return userService.getUser(userId);
};
```

### 7. Functional Interceptors

#### Auth Interceptor
```typescript
// interceptors/auth.interceptor.ts
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '@services/auth.service';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  
  // Add auth header
  const token = authService.getToken();
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      return throwError(() => error);
    })
  );
};

// Error interceptor
export const errorInterceptor: HttpInterceptorFn = (req, next) => {
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('HTTP Error:', error);
      return throwError(() => error);
    })
  );
};
```

#### Register in App Config
```typescript
// app.config.ts
import { ApplicationConfig } from '@angular/core';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { authInterceptor, errorInterceptor } from '@interceptors';

export const appConfig: ApplicationConfig = {
  providers: [
    provideHttpClient(
      withInterceptors([authInterceptor, errorInterceptor])
    )
  ]
};
```

### 8. RxJS Interop

#### toSignal and toObservable
```typescript
import { Component, inject, signal } from '@angular/core';
import { toSignal, toObservable } from '@angular/core/rxjs-interop';
import { HttpClient } from '@angular/common/http';
import { switchMap, debounceTime, distinctUntilChanged } from 'rxjs';

@Component({
  selector: 'app-search',
  standalone: true,
  template: `
    <input [ngModel]="searchTerm()" (ngModelChange)="searchTerm.set($event)">
    
    @if (results(); as items) {
      @for (item of items; track item.id) {
        <div>{{ item.name }}</div>
      }
    }
  `
})
export class SearchComponent {
  private http = inject(HttpClient);
  
  // Signal for search term
  searchTerm = signal('');
  
  // Convert signal to observable, then back to signal with results
  results = toSignal(
    toObservable(this.searchTerm).pipe(
      debounceTime(300),
      distinctUntilChanged(),
      switchMap(term => 
        term ? this.http.get<Item[]>(`/api/search?q=${term}`) : []
      )
    ),
    { initialValue: [] }
  );
}
```

#### takeUntilDestroyed
```typescript
import { Component, inject, DestroyRef, OnInit } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { interval } from 'rxjs';

@Component({
  selector: 'app-timer',
  standalone: true,
  template: `<p>{{ count }}</p>`
})
export class TimerComponent implements OnInit {
  private destroyRef = inject(DestroyRef);
  count = 0;

  ngOnInit() {
    // Automatically unsubscribes when component is destroyed
    interval(1000)
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe(() => {
        this.count++;
      });
  }
}
```

### 9. Route Configuration

#### Standalone Routes
```typescript
// app.routes.ts
import { Routes } from '@angular/router';
import { authGuard } from '@guards/auth.guard';
import { userResolver } from '@resolvers/user.resolver';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./home/home.component')
      .then(m => m.HomeComponent),
    title: 'Home'
  },
  {
    path: 'login',
    loadComponent: () => import('./login/login.component')
      .then(m => m.LoginComponent),
    title: 'Login'
  },
  {
    path: 'dashboard',
    canActivate: [authGuard],
    loadComponent: () => import('./dashboard/dashboard.component')
      .then(m => m.DashboardComponent),
    title: 'Dashboard'
  },
  {
    path: 'users/:id',
    canActivate: [authGuard],
    resolve: { user: userResolver },
    loadComponent: () => import('./user/user-detail.component')
      .then(m => m.UserDetailComponent),
    title: 'User Details'
  },
  {
    path: 'admin',
    canActivate: [authGuard],
    data: { roles: ['admin'] },
    loadChildren: () => import('./admin/admin.routes')
      .then(m => m.ADMIN_ROUTES)
  },
  {
    path: '**',
    loadComponent: () => import('./not-found/not-found.component')
      .then(m => m.NotFoundComponent)
  }
];
```

### 10. Reactive Forms with Signals

#### Typed Forms
```typescript
import { Component, signal, computed } from '@angular/core';
import { 
  FormBuilder, 
  FormGroup, 
  Validators, 
  ReactiveFormsModule 
} from '@angular/forms';

interface UserForm {
  name: string;
  email: string;
  age: number;
}

@Component({
  selector: 'app-user-form',
  standalone: true,
  imports: [ReactiveFormsModule],
  template: `
    <form [formGroup]="form" (ngSubmit)="onSubmit()">
      <input formControlName="name" placeholder="Name">
      @if (nameError()) {
        <span class="error">{{ nameError() }}</span>
      }
      
      <input formControlName="email" placeholder="Email" type="email">
      @if (emailError()) {
        <span class="error">{{ emailError() }}</span>
      }
      
      <input formControlName="age" placeholder="Age" type="number">
      
      <button type="submit" [disabled]="!form.valid || submitting()">
        {{ submitting() ? 'Saving...' : 'Save' }}
      </button>
    </form>
  `
})
export class UserFormComponent {
  private fb = inject(FormBuilder);
  
  submitting = signal(false);
  
  form = this.fb.nonNullable.group({
    name: ['', [Validators.required, Validators.minLength(2)]],
    email: ['', [Validators.required, Validators.email]],
    age: [0, [Validators.required, Validators.min(0), Validators.max(120)]]
  });

  nameError = computed(() => {
    const control = this.form.controls.name;
    if (control.touched && control.errors) {
      if (control.errors['required']) return 'Name is required';
      if (control.errors['minlength']) return 'Name must be at least 2 characters';
    }
    return null;
  });

  emailError = computed(() => {
    const control = this.form.controls.email;
    if (control.touched && control.errors) {
      if (control.errors['required']) return 'Email is required';
      if (control.errors['email']) return 'Invalid email format';
    }
    return null;
  });

  async onSubmit() {
    if (this.form.invalid) return;
    
    this.submitting.set(true);
    try {
      const values = this.form.getRawValue();
      await this.saveUser(values);
    } finally {
      this.submitting.set(false);
    }
  }
}
```

---

## Anti-Patterns

### ❌ Don't: Mix Signals and Observable Subscriptions Carelessly
```typescript
// BAD: Manual subscription without cleanup
ngOnInit() {
  this.dataService.getData().subscribe(data => {
    this.mySignal.set(data); // Memory leak if not unsubscribed
  });
}
```

### ✅ Do: Use takeUntilDestroyed or toSignal
```typescript
// GOOD: Automatic cleanup
private destroyRef = inject(DestroyRef);

ngOnInit() {
  this.dataService.getData()
    .pipe(takeUntilDestroyed(this.destroyRef))
    .subscribe(data => this.mySignal.set(data));
}

// BETTER: Use toSignal
data = toSignal(this.dataService.getData());
```

### ❌ Don't: Forget track in @for
```html
<!-- BAD: Missing track -->
@for (item of items()) {
  <div>{{ item.name }}</div>
}
```

### ✅ Do: Always Include track
```html
<!-- GOOD: Track by unique identifier -->
@for (item of items(); track item.id) {
  <div>{{ item.name }}</div>
}
```

### ❌ Don't: Use NgModules for New Standalone Components
```typescript
// BAD: Old NgModule approach
@NgModule({
  declarations: [MyComponent],
  imports: [CommonModule],
  exports: [MyComponent]
})
export class MyModule {}
```

### ✅ Do: Use Standalone Components
```typescript
// GOOD: Standalone component
@Component({
  selector: 'app-my',
  standalone: true,
  imports: [CommonModule],
  template: `...`
})
export class MyComponent {}
```

---

## Quick Reference

### Signal API
| API | Description |
|-----|-------------|
| `signal(value)` | Create writable signal |
| `computed(() => ...)` | Create derived signal |
| `effect(() => ...)` | Run side effects |
| `signal.set(value)` | Replace value |
| `signal.update(fn)` | Update based on previous |
| `toSignal(obs$)` | Observable to signal |
| `toObservable(sig)` | Signal to observable |

### Input/Output API
| API | Description |
|-----|-------------|
| `input<T>()` | Optional input |
| `input.required<T>()` | Required input |
| `input(default)` | Input with default |
| `output<T>()` | Typed output |
| `model<T>()` | Two-way binding |

### Control Flow
| Syntax | Purpose |
|--------|---------|
| `@if (cond)` | Conditional |
| `@else if (cond)` | Else-if |
| `@else` | Else branch |
| `@for (item of items; track item.id)` | Iteration |
| `@empty` | Empty state for @for |
| `@switch (value)` | Switch statement |
| `@case (value)` | Switch case |
| `@default` | Default case |
| `@defer` | Lazy loading |

---

## Version History

| Version | Date | Changes |
|---------|------|---------|
| 1.0 | 2026-01-17 | Initial release |
