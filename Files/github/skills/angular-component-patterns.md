# Skill: Angular Component Patterns

## Metadata

```yaml
name: angular-component-patterns
category: code
type: implementation
framework: Angular
created: 2026-01-13
version: 1.0.0
```

## Purpose

Provides comprehensive patterns for building Angular components using decorators, lifecycle hooks, change detection strategies, input/output binding, and component composition. Covers standalone components (Angular 14+) and traditional NgModule-based components.

## Scope

### Included

- Component decorators and metadata
- Input/Output properties and two-way binding
- Lifecycle hooks (OnInit, OnDestroy, etc.)
- Change detection strategies (Default vs OnPush)
- Content projection and templates
- Component communication patterns
- Dependency injection
- Standalone components
- Smart/Container components vs Presentational components

### Excluded

- Directives (covered separately)
- Services (covered in best practices)
- Testing (separate skill)
- RxJS patterns (separate topic)

## Core Patterns

### 1. Component Basics

**Standalone Component (Angular 14+):**

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-button',
  standalone: true,
  imports: [CommonModule],
  template: `<button (click)="onClick()">{{ label }}</button>`,
  styles: [`button { padding: 8px 16px; }`]
})
export class ButtonComponent {
  @Input() label = 'Click me';
  @Output() clicked = new EventEmitter<void>();

  onClick() {
    this.clicked.emit();
  }
}
```

**Traditional NgModule Component:**

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-button',
  template: `<button (click)="onClick()">{{ label }}</button>`,
  styles: [`button { padding: 8px 16px; }`]
})
export class ButtonComponent {
  @Input() label = 'Click me';
  @Output() clicked = new EventEmitter<void>();

  onClick() {
    this.clicked.emit();
  }
}

// In app.module.ts
import { NgModule } from '@angular/core';
import { ButtonComponent } from './button.component';

@NgModule({
  declarations: [ButtonComponent],
  exports: [ButtonComponent]
})
export class SharedModule { }
```

### 2. Input/Output Binding

**Typed Inputs:**

```typescript
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

export interface User {
  id: number;
  name: string;
  email: string;
}

@Component({
  selector: 'app-user-card',
  template: `
    <div class="card">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCardComponent {
  @Input() user!: User;
  @Input() showActions = true;
  @Input() theme: 'light' | 'dark' = 'light';
}
```

**Typed Outputs:**

```typescript
import { Component, Output, EventEmitter } from '@angular/core';

export interface UserAction {
  type: 'edit' | 'delete' | 'view';
  userId: number;
}

@Component({
  selector: 'app-user-actions',
  template: `
    <button (click)="onEdit()">Edit</button>
    <button (click)="onDelete()">Delete</button>
    <button (click)="onView()">View</button>
  `
})
export class UserActionsComponent {
  @Output() action = new EventEmitter<UserAction>();

  onEdit() {
    this.action.emit({ type: 'edit', userId: 1 });
  }

  onDelete() {
    this.action.emit({ type: 'delete', userId: 1 });
  }

  onView() {
    this.action.emit({ type: 'view', userId: 1 });
  }
}
```

**Two-Way Binding with ngModel:**

```typescript
import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-search',
  standalone: true,
  imports: [FormsModule],
  template: `
    <input [(ngModel)]="searchTerm" placeholder="Search...">
    <p>Searching for: {{ searchTerm }}</p>
  `
})
export class SearchComponent {
  searchTerm = '';
}
```

**Custom Two-Way Binding:**

```typescript
import { Component, Input, Output, EventEmitter } from '@angular/core';

@Component({
  selector: 'app-counter',
  template: `
    <button (click)="decrement()">-</button>
    <span>{{ value }}</span>
    <button (click)="increment()">+</button>
  `
})
export class CounterComponent {
  @Input() value = 0;
  @Output() valueChange = new EventEmitter<number>();

  increment() {
    this.value++;
    this.valueChange.emit(this.value);
  }

  decrement() {
    this.value--;
    this.valueChange.emit(this.value);
  }
}

// Usage: <app-counter [(value)]="count"></app-counter>
```

### 3. Lifecycle Hooks

**All Lifecycle Hooks:**

```typescript
import {
  Component,
  OnInit,
  OnChanges,
  DoCheck,
  AfterContentInit,
  AfterContentChecked,
  AfterViewInit,
  AfterViewChecked,
  OnDestroy,
  SimpleChanges,
  Input,
  ViewChild
} from '@angular/core';

@Component({
  selector: 'app-lifecycle',
  template: `<div>{{ data }}</div>`
})
export class LifecycleComponent implements
  OnInit,
  OnChanges,
  DoCheck,
  AfterContentInit,
  AfterContentChecked,
  AfterViewInit,
  AfterViewChecked,
  OnDestroy {

  @Input() data = '';

  // 1. Called when input properties change
  ngOnChanges(changes: SimpleChanges) {
    console.log('Input properties changed', changes);
  }

  // 2. Called on change detection
  ngDoCheck() {
    console.log('Change detection cycle');
  }

  // 3. Called after initialization and after first change detection
  ngOnInit() {
    console.log('Component initialized');
  }

  // 4. Called after projected content initialized
  ngAfterContentInit() {
    console.log('Projected content initialized');
  }

  // 5. Called after projected content checked
  ngAfterContentChecked() {
    console.log('Projected content checked');
  }

  // 6. Called after component view initialized
  ngAfterViewInit() {
    console.log('View initialized');
  }

  // 7. Called after component view checked
  ngAfterViewChecked() {
    console.log('View checked');
  }

  // 8. Called before component destroyed
  ngOnDestroy() {
    console.log('Component destroyed');
  }
}
```

**Practical Lifecycle Example:**

```typescript
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

@Component({
  selector: 'app-data-loader',
  template: `
    <div *ngIf="loading">Loading...</div>
    <div *ngIf="data">{{ data }}</div>
    <div *ngIf="error">Error: {{ error }}</div>
  `
})
export class DataLoaderComponent implements OnInit, OnDestroy {
  data: string | null = null;
  loading = false;
  error: string | null = null;
  private destroy$ = new Subject<void>();

  constructor(private dataService: DataService) {}

  ngOnInit() {
    this.loading = true;
    this.dataService.getData()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data) => {
          this.data = data;
          this.loading = false;
        },
        error: (err) => {
          this.error = err.message;
          this.loading = false;
        }
      });
  }

  ngOnDestroy() {
    this.destroy$.next();
    this.destroy$.complete();
  }
}
```

### 4. Change Detection Strategies

**Default Change Detection:**

```typescript
@Component({
  selector: 'app-default',
  template: `<div>{{ expensiveComputation() }}</div>`
  // Default: ChangeDetectionStrategy.Default
})
export class DefaultChangeDetectionComponent {
  expensiveComputation() {
    // Called on every change detection cycle
    return Math.random();
  }
}
```

**OnPush Change Detection:**

```typescript
import { Component, Input, ChangeDetectionStrategy } from '@angular/core';

@Component({
  selector: 'app-on-push',
  template: `<div>{{ value }}</div>`,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class OnPushComponent {
  @Input() value = 0;
  // Only checks for changes when:
  // 1. Input properties change
  // 2. Events are triggered
  // 3. Observables emit (if using async pipe)
}
```

**OnPush with Immutable Updates:**

```typescript
import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';

interface Item {
  id: number;
  name: string;
}

@Component({
  selector: 'app-item-list',
  template: `
    <button (click)="addItem()">Add Item</button>
    <ul>
      <li *ngFor="let item of items">{{ item.name }}</li>
    </ul>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class ItemListComponent {
  @Input() items: Item[] = [];
  @Output() itemsChange = new EventEmitter<Item[]>();

  addItem() {
    // Create new array (immutable update)
    const newItems = [...this.items, { id: Date.now(), name: 'New Item' }];
    this.itemsChange.emit(newItems);
  }
}
```

### 5. Content Projection

**Simple Content Projection:**

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-card',
  template: `
    <div class="card">
      <ng-content></ng-content>
    </div>
  `,
  styles: [`.card { border: 1px solid #ccc; padding: 16px; }`]
})
export class CardComponent {}

// Usage
// <app-card>
//   <h2>Card Title</h2>
//   <p>Card content</p>
// </app-card>
```

**Named Content Projection:**

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-dialog',
  template: `
    <div class="dialog">
      <div class="dialog-header">
        <ng-content select="[dialog-header]"></ng-content>
      </div>
      <div class="dialog-body">
        <ng-content></ng-content>
      </div>
      <div class="dialog-footer">
        <ng-content select="[dialog-footer]"></ng-content>
      </div>
    </div>
  `
})
export class DialogComponent {}

// Usage
// <app-dialog>
//   <div dialog-header>Dialog Title</div>
//   <p>Dialog content</p>
//   <div dialog-footer>
//     <button>Cancel</button>
//     <button>OK</button>
//   </div>
// </app-dialog>
```

### 6. Smart vs Presentational Components

**Presentational Component:**

```typescript
@Component({
  selector: 'app-user-card',
  template: `
    <div class="card">
      <h3>{{ user.name }}</h3>
      <p>{{ user.email }}</p>
      <button (click)="onEdit()">Edit</button>
    </div>
  `,
  changeDetection: ChangeDetectionStrategy.OnPush
})
export class UserCardComponent {
  @Input() user!: User;
  @Output() edit = new EventEmitter<User>();

  onEdit() {
    this.edit.emit(this.user);
  }
}
```

**Container Component:**

```typescript
@Component({
  selector: 'app-users-list',
  template: `
    <app-user-card
      *ngFor="let user of users$ | async"
      [user]="user"
      (edit)="onEditUser($event)"
    ></app-user-card>
  `
})
export class UsersListComponent implements OnInit {
  users$ = this.userService.getUsers();

  constructor(private userService: UserService) {}

  onEditUser(user: User) {
    // Handle edit
  }
}
```

### 7. Dependency Injection

**Constructor Injection:**

```typescript
import { Component } from '@angular/core';

@Component({
  selector: 'app-example',
  template: `<div>{{ message }}</div>`
})
export class ExampleComponent {
  message: string;

  constructor(private myService: MyService) {
    this.message = myService.getMessage();
  }
}
```

**Inject Function (Angular 14+):**

```typescript
import { Component, inject } from '@angular/core';

@Component({
  selector: 'app-example',
  template: `<div>{{ message }}</div>`
})
export class ExampleComponent {
  private myService = inject(MyService);
  message = this.myService.getMessage();
}
```

### 8. ViewChild and ViewChildren

**Template Reference Variables:**

```typescript
import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-focus-input',
  template: `
    <input #inputField type="text">
    <button (click)="focusInput()">Focus</button>
  `
})
export class FocusInputComponent {
  @ViewChild('inputField') inputField!: HTMLInputElement;

  focusInput() {
    this.inputField.focus();
  }
}
```

**Accessing Child Components:**

```typescript
import { Component, ViewChild } from '@angular/core';

@Component({
  selector: 'app-parent',
  template: `<app-child #child></app-child>`
})
export class ParentComponent {
  @ViewChild('child') childComponent!: ChildComponent;

  ngAfterViewInit() {
    this.childComponent.doSomething();
  }
}
```

## Advanced Patterns

### 1. Dynamic Components

```typescript
import { Component, ViewContainerRef, ComponentFactoryResolver } from '@angular/core';

@Component({
  selector: 'app-dynamic',
  template: `<div #container></div>`
})
export class DynamicComponent {
  constructor(
    private vcr: ViewContainerRef,
    private cfr: ComponentFactoryResolver
  ) {}

  loadComponent() {
    const factory = this.cfr.resolveComponentFactory(MyComponent);
    this.vcr.createComponent(factory);
  }
}
```

### 2. Attribute Directives as Inputs

```typescript
import { Component, Input, HostBinding } from '@angular/core';

@Component({
  selector: '[appHighlight]',
  template: `<ng-content></ng-content>`
})
export class HighlightDirective {
  @Input() appHighlight = 'yellow';
  @HostBinding('style.backgroundColor') backgroundColor!: string;

  ngOnInit() {
    this.backgroundColor = this.appHighlight;
  }
}

// Usage: <p appHighlight="red">Highlighted text</p>
```

## Schema Reference

- `docs/schemas/skills/angular-component-patterns.input.schema.json`
- `docs/schemas/skills/angular-component-patterns.output.schema.json`

## Version History

- **1.0.0** (2026-01-13): Initial Angular component patterns

## Related Documentation

- Agent: `angular-specialist.md`
- Related Skills: `angular-best-practices.md`
- Official Docs: https://angular.dev/guide/components
