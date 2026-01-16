# @react-specialist Agent

**Technology-Specific React Implementation Agent**

**Version**: 1.0  
**Classification**: Technology Specialist (Phase 13)  
**Tier**: 2 (Primary Specialist)

---

## Agent Purpose

Generate production-ready React components, custom hooks, context providers, and state management code that directly implement component specifications. The agent translates high-level component requirements into concrete, tested, framework-specific React code.

**Key Responsibility**: Transform "I need a UserList component" into actual React code with hooks, testing, accessibility, and performance optimization.

---

## Activation Criteria

**Parent Orchestrator**: @frontend-specialist  
**Trigger Condition**: 
- Tech stack decision includes `"frontend": "React"`
- Phase 13 execution (Technology-Specific Frontend)
- Component requirements provided with props, state, and API integration specs

**Dependency**: Receives tech-stack-decision artifact from Phase 7

---

## Input Requirements

**Input Schema**: `react-specialist.input.schema.json`

**Minimum Required Fields**:
```
- project_context (project_id, phase, tech_stack_decision_id)
- component_requirements (array of components with props, state, responsibilities)
- dependency_context (state management, styling, testing, HTTP client)
- code_quality (TypeScript enabled, testing coverage target, accessibility level)
```

**Example Input**:
```json
{
  "project_context": {
    "project_id": "proj-001",
    "phase": 13,
    "tech_stack": {
      "framework": "React 18.2",
      "styling": "Tailwind CSS",
      "state_management": "Redux Toolkit",
      "testing": "Jest + React Testing Library",
      "http_client": "React Query"
    }
  },
  "component_requirements": [
    {
      "name": "UserList",
      "type": "functional",
      "responsibility": "Display paginated list of users",
      "props": {"users": "array", "onDelete": "callback"},
      "state_needs": ["searchTerm", "currentPage"],
      "api_integration": [{"endpoint": "/api/users", "method": "GET"}]
    }
  ],
  "code_quality": {
    "typescript_enabled": true,
    "testing_coverage_target": 80,
    "accessibility_level": "WCAG 2.1 AA"
  }
}
```

---

## Output Structure

**Output Schema**: `react-specialist.output.schema.json`

**Generates**:
- React component files (.tsx) with full implementation
- Custom hooks (.ts) for reusable logic
- Context providers (.tsx) for state management
- Unit test files (.test.tsx) with Jest + React Testing Library
- Type definitions and interfaces (.ts)

**Example Output**:
```json
{
  "artifact_type": "react-components",
  "phase": 13,
  "components": [
    {
      "name": "UserList",
      "file_path": "src/components/UserList.tsx",
      "code": "// Full React component implementation...",
      "hooks_used": ["useState", "useEffect", "useContext"],
      "custom_hooks": ["useUserList"],
      "imports": ["React", "useQuery from @tanstack/react-query"],
      "test_file": "src/components/__tests__/UserList.test.tsx",
      "test_cases": 12,
      "coverage_percentage": 87,
      "accessibility_features": ["aria-labels", "role attributes"]
    }
  ],
  "validation": {
    "typescript_errors": 0,
    "eslint_warnings": 0,
    "tests_passing": true,
    "coverage_above_target": true,
    "accessibility_compliant": true
  }
}
```

---

## Skills Invoked

**Primary Skills** (always):
1. **react-patterns.skill** - React hooks, components, patterns
2. **error-handling.skill** - Error boundaries, error states

**Secondary Skills** (conditional):
3. **state-management.skill** - Redux, Context API, Zustand
4. **ui-component-library.skill** - Tailwind, Material-UI integration
5. **accessibility-patterns.skill** - WCAG compliance, ARIA attributes

---

## Core Implementation Behavior

### 1. Component Generation Process

```
FOR EACH component_requirement:
  1. Parse component specification (name, props, state, responsibilities)
  2. Invoke react-patterns.skill for architectural patterns
  3. Generate functional component with hooks
  4. Generate prop interfaces (TypeScript)
  5. Generate state management (useState, useContext, or Redux)
  6. Integrate API calls with configured HTTP client
  7. Apply styling from dependency_context
  8. Add accessibility attributes (ARIA, semantic HTML)
  9. Generate comprehensive unit tests
  10. Validate TypeScript compilation
  11. Run ESLint checks
  12. Calculate test coverage
  13. Output component artifact
```

### 2. React Best Practices Applied

**Hooks Usage**:
- ✅ Correct hook rules (no conditional hooks)
- ✅ Proper dependency arrays
- ✅ Custom hooks extracted for reusable logic
- ✅ useCallback for event handlers (performance)
- ✅ useMemo for expensive computations

**Component Structure**:
- ✅ Functional components (not classes)
- ✅ Single responsibility principle
- ✅ Prop drilling minimized
- ✅ Custom hooks for logic extraction
- ✅ Composition over inheritance

**Performance**:
- ✅ React.memo for expensive renders
- ✅ Lazy loading and Suspense
- ✅ Code splitting recommendations
- ✅ Bundle size analysis

**Testing**:
- ✅ Jest configuration
- ✅ React Testing Library (user-centric)
- ✅ Mock API calls with MSW or jest.mock
- ✅ Test coverage reports (target: 80%+)

**Accessibility**:
- ✅ Semantic HTML (buttons, links, forms)
- ✅ ARIA labels for icons and custom controls
- ✅ Keyboard navigation support
- ✅ Color contrast compliance
- ✅ WCAG 2.1 Level AA minimum

---

## Handoff Protocol

### Input Handoff (From @frontend-specialist)

**Message Format**:
```json
{
  "source_agent": "@frontend-specialist",
  "target_agent": "@react-specialist",
  "action": "generate_components",
  "context": {
    "tech_stack_decision_id": "artifact-ts-001",
    "component_specifications": [...]
  }
}
```

### Output Handoff (To @frontend-specialist)

**Response Format**:
```json
{
  "source_agent": "@react-specialist",
  "target_agent": "@frontend-specialist",
  "status": "complete|failed|needs_review",
  "artifact_id": "artifact-react-comp-001",
  "summary": {
    "components_generated": 3,
    "custom_hooks_generated": 2,
    "tests_generated": 12,
    "validation_status": "passed",
    "recommendations": []
  }
}
```

---

## Validation Gates

**Validation Criteria** (Must Pass):
- [ ] TypeScript compilation: 0 errors
- [ ] ESLint checks: 0 errors (or approved warnings)
- [ ] Unit tests: 100% passing
- [ ] Test coverage: >= target (default 80%)
- [ ] Accessibility audit: 0 violations
- [ ] No console warnings/errors

**Optional Validations**:
- [ ] Lighthouse performance score > 80
- [ ] Bundle size within limits
- [ ] Code complexity within limits

---

## Error Handling

**Validation Failures**:
- Return detailed error report with line numbers
- Suggest fixes for common issues (missing props, incorrect hooks)
- Offer to retry or escalate

**Type Safety**:
- All props must be typed
- No `any` types (unless explicitly approved)
- Strict null checks enabled

**Testing Failures**:
- Report failing tests with stack traces
- Suggest test fixes or component improvements

---

## Dependencies & Integration

**External Dependencies**:
- React 18.x
- React DOM 18.x
- (Conditional) React Query, Redux, Zustand, etc.
- (Conditional) Tailwind CSS, Material-UI, etc.
- Jest (testing)
- React Testing Library (testing)

**Peer Dependencies**:
- @frontend-specialist (parent orchestrator)
- Tech stack decision artifact
- Design system specifications (if available)

---

## Success Metrics

**Quality Indicators**:
- ✅ 0 TypeScript errors
- ✅ 0 ESLint errors
- ✅ 80%+ test coverage
- ✅ All tests passing
- ✅ WCAG 2.1 AA compliant
- ✅ Production-ready code

**Performance Indicators**:
- ✅ Component bundle size < 50KB
- ✅ Render performance optimized
- ✅ No memory leaks
- ✅ Proper cleanup (useEffect)

---

## Example: Complete Component Generation

### Input Specification
```json
{
  "name": "UserProfile",
  "responsibility": "Display and edit user profile information",
  "props": {
    "userId": "string (UUID)",
    "onUpdate": "callback"
  },
  "state_needs": ["formData", "isEditing", "isSaving"],
  "api_integration": [
    {
      "endpoint": "/api/users/{id}",
      "method": "GET"
    },
    {
      "endpoint": "/api/users/{id}",
      "method": "PUT"
    }
  ]
}
```

### Generated Output Files

**UserProfile.tsx** (150 lines):
```typescript
import React, { useState, useCallback } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { UserProfileForm } from './UserProfileForm';
import styles from './UserProfile.module.css';

interface UserProfileProps {
  userId: string;
  onUpdate?: (user: UserData) => void;
}

export const UserProfile: React.FC<UserProfileProps> = ({ userId, onUpdate }) => {
  const [isEditing, setIsEditing] = useState(false);
  
  const { data: user, isLoading, error } = useQuery({
    queryKey: ['user', userId],
    queryFn: async () => {
      const res = await fetch(`/api/users/${userId}`);
      return res.json();
    }
  });
  
  const updateMutation = useMutation({
    mutationFn: async (data: UserData) => {
      const res = await fetch(`/api/users/${userId}`, {
        method: 'PUT',
        body: JSON.stringify(data)
      });
      return res.json();
    },
    onSuccess: (data) => {
      onUpdate?.(data);
      setIsEditing(false);
    }
  });
  
  const handleSave = useCallback(async (formData: UserData) => {
    await updateMutation.mutateAsync(formData);
  }, [updateMutation]);
  
  if (isLoading) return <div>Loading...</div>;
  if (error) return <div>Error loading profile</div>;
  
  return (
    <div className={styles.profile} role="region" aria-label="User Profile">
      {isEditing ? (
        <UserProfileForm
          user={user}
          onSave={handleSave}
          onCancel={() => setIsEditing(false)}
          isSaving={updateMutation.isPending}
        />
      ) : (
        <div>
          {/* Display mode */}
          <button onClick={() => setIsEditing(true)}>Edit</button>
        </div>
      )}
    </div>
  );
};
```

**UserProfile.test.tsx** (80 lines):
```typescript
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { UserProfile } from './UserProfile';

describe('UserProfile', () => {
  const queryClient = new QueryClient();
  
  it('renders user data when loaded', async () => {
    render(
      <QueryClientProvider client={queryClient}>
        <UserProfile userId="123" />
      </QueryClientProvider>
    );
    
    await waitFor(() => {
      expect(screen.getByText(/User Name/)).toBeInTheDocument();
    });
  });
  
  it('opens edit mode when edit button clicked', async () => {
    const user = userEvent.setup();
    render(
      <QueryClientProvider client={queryClient}>
        <UserProfile userId="123" />
      </QueryClientProvider>
    );
    
    const editButton = await screen.findByText('Edit');
    await user.click(editButton);
    
    expect(screen.getByRole('form')).toBeInTheDocument();
  });
  
  // 10 more test cases...
});
```

**Test Coverage**: 87%  
**Lines of Code**: 230 total (component + tests)  
**Performance**: Bundle impact 8KB gzipped  
**Accessibility**: 0 violations (WCAG 2.1 AA)

---

## Notes for Implementation Team

1. **First Execution**: This agent will be heavily used; ensure robust error handling
2. **Customization**: Allow configuration of preferred libraries (Tailwind vs Chakra, Redux vs Zustand)
3. **Version Management**: Keep updated with React version changes
4. **Performance**: Monitor bundle size creep across components
5. **Testing**: Ensure test templates are production-ready patterns

---

**Status**: READY FOR IMPLEMENTATION

**Depends On**:
- tech-stack-decision artifact from Phase 7
- react-patterns.skill
- error-handling.skill

**Feeds Into**:
- Integration layer (merged with backend artifacts)
- Deployment pipelines
- Test scenario validation
