# Phase 2: Interactive Wizard

**Phase ID:** F-UIL-P02  
**Feature:** UserInterfaceLayer  
**Duration:** 1.5 weeks  
**Status:** ⬜ Not Started  
**Depends On:** Phase 1 (CLI Foundation)

---

## 🎯 Phase Objectives

Deze phase implementeert de **Interactive Wizard** met Ink/React TUI:
- Multi-step requirement gathering
- Scenario selection met uitleg
- Technology stack configuration
- Agent pre-selection
- Validation en preview

---

## 📦 Deliverables

### 1. Wizard Package Structure

```
packages/cli/src/
├── wizard/
│   ├── index.tsx                   # Wizard entry point
│   ├── WizardApp.tsx               # Main wizard component
│   ├── context/
│   │   ├── WizardContext.tsx       # State management
│   │   └── NavigationContext.tsx   # Step navigation
│   ├── steps/
│   │   ├── WelcomeStep.tsx         # Welcome screen
│   │   ├── ScenarioStep.tsx        # Scenario selection
│   │   ├── RequirementsStep.tsx    # Requirements input
│   │   ├── TechnologyStep.tsx      # Tech stack selection
│   │   ├── AgentsStep.tsx          # Agent configuration
│   │   ├── ReviewStep.tsx          # Review before start
│   │   └── ConfirmStep.tsx         # Final confirmation
│   ├── components/
│   │   ├── Header.tsx              # Consistent header
│   │   ├── Footer.tsx              # Navigation hints
│   │   ├── SelectList.tsx          # Single/multi select
│   │   ├── TextInput.tsx           # Text input field
│   │   ├── Checkbox.tsx            # Checkbox component
│   │   ├── ProgressBar.tsx         # Step progress
│   │   ├── InfoBox.tsx             # Information display
│   │   └── Spinner.tsx             # Loading states
│   └── hooks/
│       ├── useNavigation.ts        # Step navigation
│       ├── useValidation.ts        # Input validation
│       └── useKeyBindings.ts       # Keyboard shortcuts
```

### 2. Dependencies

```json
{
  "dependencies": {
    "ink": "^4.4.0",
    "ink-select-input": "^5.0.0",
    "ink-text-input": "^5.0.0",
    "ink-spinner": "^5.0.0",
    "react": "^18.2.0",
    "zod": "^3.22.0",
    "zustand": "^4.5.0"
  },
  "devDependencies": {
    "@types/react": "^18.2.0",
    "ink-testing-library": "^3.0.0"
  }
}
```

---

## 🔧 Implementation Details

### 2.1 Wizard Entry Point (`src/wizard/index.tsx`)

```tsx
import React from 'react';
import { render } from 'ink';
import { WizardApp } from './WizardApp';
import { WizardProvider } from './context/WizardContext';

export interface WizardOptions {
  projectPath: string;
  scenario?: string;
  resume?: boolean;
  outputFormat?: 'json' | 'yaml';
}

export async function launchWizard(options: WizardOptions): Promise<WizardResult> {
  return new Promise((resolve, reject) => {
    const { waitUntilExit } = render(
      <WizardProvider initialOptions={options}>
        <WizardApp 
          onComplete={(result) => resolve(result)}
          onCancel={() => reject(new Error('Wizard cancelled'))}
        />
      </WizardProvider>
    );

    waitUntilExit().catch(reject);
  });
}

export interface WizardResult {
  projectName: string;
  scenario: string;
  requirements: RequirementData;
  technology: TechnologyStack;
  agents: AgentSelection[];
  metadata: {
    completedAt: string;
    wizardVersion: string;
  };
}
```

### 2.2 Main Wizard Component (`src/wizard/WizardApp.tsx`)

```tsx
import React, { useState } from 'react';
import { Box, Text, useInput, useApp } from 'ink';
import { useWizard } from './context/WizardContext';
import { Header } from './components/Header';
import { Footer } from './components/Footer';
import { ProgressBar } from './components/ProgressBar';

// Steps
import { WelcomeStep } from './steps/WelcomeStep';
import { ScenarioStep } from './steps/ScenarioStep';
import { RequirementsStep } from './steps/RequirementsStep';
import { TechnologyStep } from './steps/TechnologyStep';
import { AgentsStep } from './steps/AgentsStep';
import { ReviewStep } from './steps/ReviewStep';
import { ConfirmStep } from './steps/ConfirmStep';

interface WizardAppProps {
  onComplete: (result: WizardResult) => void;
  onCancel: () => void;
}

const STEPS = [
  { id: 'welcome', component: WelcomeStep, title: 'Welcome' },
  { id: 'scenario', component: ScenarioStep, title: 'Scenario' },
  { id: 'requirements', component: RequirementsStep, title: 'Requirements' },
  { id: 'technology', component: TechnologyStep, title: 'Technology' },
  { id: 'agents', component: AgentsStep, title: 'Agents' },
  { id: 'review', component: ReviewStep, title: 'Review' },
  { id: 'confirm', component: ConfirmStep, title: 'Confirm' },
];

export function WizardApp({ onComplete, onCancel }: WizardAppProps) {
  const { exit } = useApp();
  const { state, currentStep, goNext, goBack, canGoBack } = useWizard();
  
  // Global key bindings
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
      exit();
    }
    if (key.ctrl && input === 'c') {
      onCancel();
      exit();
    }
  });

  const StepComponent = STEPS[currentStep].component;

  return (
    <Box flexDirection="column" padding={1}>
      <Header title="AgenticCoder Setup Wizard" />
      
      <ProgressBar 
        current={currentStep} 
        total={STEPS.length} 
        steps={STEPS.map(s => s.title)}
      />

      <Box marginY={1} flexDirection="column">
        <StepComponent 
          onNext={goNext}
          onBack={goBack}
          onComplete={onComplete}
        />
      </Box>

      <Footer 
        canGoBack={canGoBack}
        hints={[
          { key: 'Enter', action: 'Select' },
          { key: '↑↓', action: 'Navigate' },
          { key: 'Esc', action: 'Cancel' },
        ]}
      />
    </Box>
  );
}
```

### 2.3 Wizard Context (`src/wizard/context/WizardContext.tsx`)

```tsx
import React, { createContext, useContext, useReducer, useMemo } from 'react';

interface WizardState {
  currentStep: number;
  projectName: string;
  scenario: string | null;
  requirements: RequirementData;
  technology: TechnologyStack;
  agents: AgentSelection[];
  errors: Record<string, string>;
}

type WizardAction =
  | { type: 'SET_STEP'; step: number }
  | { type: 'GO_NEXT' }
  | { type: 'GO_BACK' }
  | { type: 'SET_PROJECT_NAME'; name: string }
  | { type: 'SET_SCENARIO'; scenario: string }
  | { type: 'SET_REQUIREMENTS'; requirements: Partial<RequirementData> }
  | { type: 'SET_TECHNOLOGY'; technology: Partial<TechnologyStack> }
  | { type: 'SET_AGENTS'; agents: AgentSelection[] }
  | { type: 'SET_ERROR'; field: string; error: string }
  | { type: 'CLEAR_ERRORS' };

const initialState: WizardState = {
  currentStep: 0,
  projectName: '',
  scenario: null,
  requirements: {
    description: '',
    features: [],
    constraints: [],
  },
  technology: {
    frontend: null,
    backend: null,
    database: null,
    cloud: 'azure',
  },
  agents: [],
  errors: {},
};

function wizardReducer(state: WizardState, action: WizardAction): WizardState {
  switch (action.type) {
    case 'SET_STEP':
      return { ...state, currentStep: action.step };
    case 'GO_NEXT':
      return { ...state, currentStep: Math.min(state.currentStep + 1, 6) };
    case 'GO_BACK':
      return { ...state, currentStep: Math.max(state.currentStep - 1, 0) };
    case 'SET_PROJECT_NAME':
      return { ...state, projectName: action.name };
    case 'SET_SCENARIO':
      return { ...state, scenario: action.scenario };
    case 'SET_REQUIREMENTS':
      return { ...state, requirements: { ...state.requirements, ...action.requirements } };
    case 'SET_TECHNOLOGY':
      return { ...state, technology: { ...state.technology, ...action.technology } };
    case 'SET_AGENTS':
      return { ...state, agents: action.agents };
    case 'SET_ERROR':
      return { ...state, errors: { ...state.errors, [action.field]: action.error } };
    case 'CLEAR_ERRORS':
      return { ...state, errors: {} };
    default:
      return state;
  }
}

interface WizardContextType {
  state: WizardState;
  dispatch: React.Dispatch<WizardAction>;
  currentStep: number;
  goNext: () => void;
  goBack: () => void;
  canGoBack: boolean;
  canGoNext: boolean;
}

const WizardContext = createContext<WizardContextType | null>(null);

export function WizardProvider({ children, initialOptions }: { 
  children: React.ReactNode;
  initialOptions?: { scenario?: string };
}) {
  const [state, dispatch] = useReducer(wizardReducer, {
    ...initialState,
    scenario: initialOptions?.scenario || null,
  });

  const value = useMemo(() => ({
    state,
    dispatch,
    currentStep: state.currentStep,
    goNext: () => dispatch({ type: 'GO_NEXT' }),
    goBack: () => dispatch({ type: 'GO_BACK' }),
    canGoBack: state.currentStep > 0,
    canGoNext: state.currentStep < 6,
  }), [state]);

  return (
    <WizardContext.Provider value={value}>
      {children}
    </WizardContext.Provider>
  );
}

export function useWizard() {
  const context = useContext(WizardContext);
  if (!context) {
    throw new Error('useWizard must be used within WizardProvider');
  }
  return context;
}
```

### 2.4 Scenario Step (`src/wizard/steps/ScenarioStep.tsx`)

```tsx
import React, { useState } from 'react';
import { Box, Text } from 'ink';
import SelectInput from 'ink-select-input';
import { useWizard } from '../context/WizardContext';
import { InfoBox } from '../components/InfoBox';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const SCENARIOS = [
  {
    value: 'S01',
    label: 'S01: Full Stack Application',
    description: 'Complete application with frontend, backend, database, and infrastructure',
    phases: ['Requirements', 'Design', 'Backend', 'Frontend', 'Integration', 'Deployment'],
  },
  {
    value: 'S02',
    label: 'S02: API-Only Backend',
    description: 'REST/GraphQL API with database and cloud deployment',
    phases: ['Requirements', 'Design', 'Backend', 'Integration', 'Deployment'],
  },
  {
    value: 'S03',
    label: 'S03: Frontend Application',
    description: 'Modern frontend with existing backend integration',
    phases: ['Requirements', 'Design', 'Frontend', 'Integration', 'Deployment'],
  },
  {
    value: 'S04',
    label: 'S04: Infrastructure Only',
    description: 'Cloud infrastructure setup with IaC (Bicep)',
    phases: ['Requirements', 'Design', 'Infrastructure', 'Deployment'],
  },
  {
    value: 'S05',
    label: 'S05: Migration Project',
    description: 'Migrate existing application to new technology/cloud',
    phases: ['Analysis', 'Planning', 'Migration', 'Validation', 'Deployment'],
  },
];

export function ScenarioStep({ onNext, onBack }: StepProps) {
  const { state, dispatch } = useWizard();
  const [selectedScenario, setSelectedScenario] = useState(
    SCENARIOS.find(s => s.value === state.scenario) || null
  );

  const handleSelect = (item: { value: string }) => {
    const scenario = SCENARIOS.find(s => s.value === item.value)!;
    setSelectedScenario(scenario);
    dispatch({ type: 'SET_SCENARIO', scenario: item.value });
  };

  const handleSubmit = () => {
    if (selectedScenario) {
      onNext();
    }
  };

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Select a Scenario</Text>
      <Text color="gray" dimColor>
        Choose the type of project you want to build
      </Text>

      <Box marginY={1}>
        <SelectInput
          items={SCENARIOS.map(s => ({ value: s.value, label: s.label }))}
          initialIndex={SCENARIOS.findIndex(s => s.value === state.scenario)}
          onSelect={handleSelect}
          onHighlight={(item) => {
            const scenario = SCENARIOS.find(s => s.value === item.value);
            if (scenario) setSelectedScenario(scenario);
          }}
        />
      </Box>

      {selectedScenario && (
        <InfoBox title={selectedScenario.label}>
          <Text>{selectedScenario.description}</Text>
          <Box marginTop={1}>
            <Text color="cyan">Phases: </Text>
            <Text>{selectedScenario.phases.join(' → ')}</Text>
          </Box>
        </InfoBox>
      )}

      <Box marginTop={1}>
        <Text color="gray">
          Press <Text color="green">Enter</Text> to continue, 
          <Text color="yellow"> Backspace</Text> to go back
        </Text>
      </Box>
    </Box>
  );
}
```

### 2.5 Requirements Step (`src/wizard/steps/RequirementsStep.tsx`)

```tsx
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';
import { useWizard } from '../context/WizardContext';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

type InputField = 'description' | 'features' | 'constraints';

export function RequirementsStep({ onNext, onBack }: StepProps) {
  const { state, dispatch } = useWizard();
  const [activeField, setActiveField] = useState<InputField>('description');
  const [description, setDescription] = useState(state.requirements.description);
  const [featureInput, setFeatureInput] = useState('');
  const [constraintInput, setConstraintInput] = useState('');
  const [features, setFeatures] = useState<string[]>(state.requirements.features);
  const [constraints, setConstraints] = useState<string[]>(state.requirements.constraints);

  useInput((input, key) => {
    if (key.tab) {
      // Cycle through fields
      const fields: InputField[] = ['description', 'features', 'constraints'];
      const currentIndex = fields.indexOf(activeField);
      setActiveField(fields[(currentIndex + 1) % fields.length]);
    }
    
    if (key.return && activeField !== 'description') {
      // Add feature or constraint
      if (activeField === 'features' && featureInput.trim()) {
        setFeatures([...features, featureInput.trim()]);
        setFeatureInput('');
      }
      if (activeField === 'constraints' && constraintInput.trim()) {
        setConstraints([...constraints, constraintInput.trim()]);
        setConstraintInput('');
      }
    }

    if (key.ctrl && input === 'n') {
      // Save and continue
      dispatch({
        type: 'SET_REQUIREMENTS',
        requirements: { description, features, constraints },
      });
      onNext();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Project Requirements</Text>
      <Text color="gray" dimColor>
        Describe what you want to build (Tab to switch fields, Ctrl+N to continue)
      </Text>

      {/* Description */}
      <Box marginTop={1} flexDirection="column">
        <Text color={activeField === 'description' ? 'green' : 'white'}>
          Description:
        </Text>
        {activeField === 'description' ? (
          <Box borderStyle="single" borderColor="green" paddingX={1}>
            <TextInput
              value={description}
              onChange={setDescription}
              placeholder="Describe your project in detail..."
            />
          </Box>
        ) : (
          <Box paddingX={1}>
            <Text color="gray">{description || '(empty)'}</Text>
          </Box>
        )}
      </Box>

      {/* Features */}
      <Box marginTop={1} flexDirection="column">
        <Text color={activeField === 'features' ? 'green' : 'white'}>
          Features ({features.length}):
        </Text>
        {features.map((feature, i) => (
          <Text key={i} color="gray">  • {feature}</Text>
        ))}
        {activeField === 'features' && (
          <Box borderStyle="single" borderColor="green" paddingX={1}>
            <TextInput
              value={featureInput}
              onChange={setFeatureInput}
              placeholder="Add a feature and press Enter..."
            />
          </Box>
        )}
      </Box>

      {/* Constraints */}
      <Box marginTop={1} flexDirection="column">
        <Text color={activeField === 'constraints' ? 'green' : 'white'}>
          Constraints ({constraints.length}):
        </Text>
        {constraints.map((constraint, i) => (
          <Text key={i} color="gray">  • {constraint}</Text>
        ))}
        {activeField === 'constraints' && (
          <Box borderStyle="single" borderColor="green" paddingX={1}>
            <TextInput
              value={constraintInput}
              onChange={setConstraintInput}
              placeholder="Add a constraint and press Enter..."
            />
          </Box>
        )}
      </Box>
    </Box>
  );
}
```

### 2.6 Technology Step (`src/wizard/steps/TechnologyStep.tsx`)

```tsx
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';
import { useWizard } from '../context/WizardContext';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

const TECH_OPTIONS = {
  frontend: [
    { value: 'react', label: 'React (TypeScript)' },
    { value: 'vue', label: 'Vue.js 3 (TypeScript)' },
    { value: 'angular', label: 'Angular' },
    { value: 'nextjs', label: 'Next.js' },
    { value: 'none', label: 'No Frontend' },
  ],
  backend: [
    { value: 'dotnet', label: '.NET 8 (C#)' },
    { value: 'nodejs', label: 'Node.js (TypeScript)' },
    { value: 'python', label: 'Python (FastAPI)' },
    { value: 'java', label: 'Java (Spring Boot)' },
    { value: 'none', label: 'No Backend' },
  ],
  database: [
    { value: 'sqlserver', label: 'Azure SQL Server' },
    { value: 'postgresql', label: 'PostgreSQL' },
    { value: 'mongodb', label: 'MongoDB (Cosmos DB)' },
    { value: 'sqlite', label: 'SQLite (Development)' },
    { value: 'none', label: 'No Database' },
  ],
  cloud: [
    { value: 'azure', label: 'Microsoft Azure' },
    { value: 'aws', label: 'Amazon Web Services' },
    { value: 'gcp', label: 'Google Cloud Platform' },
    { value: 'local', label: 'Local Only (No Cloud)' },
  ],
};

type TechCategory = keyof typeof TECH_OPTIONS;

export function TechnologyStep({ onNext, onBack }: StepProps) {
  const { state, dispatch } = useWizard();
  const [activeCategory, setActiveCategory] = useState<TechCategory>('frontend');
  const [selections, setSelections] = useState({
    frontend: state.technology.frontend || 'react',
    backend: state.technology.backend || 'dotnet',
    database: state.technology.database || 'sqlserver',
    cloud: state.technology.cloud || 'azure',
  });

  const categories: TechCategory[] = ['frontend', 'backend', 'database', 'cloud'];

  useInput((input, key) => {
    if (key.tab) {
      const currentIndex = categories.indexOf(activeCategory);
      setActiveCategory(categories[(currentIndex + 1) % categories.length]);
    }

    if (key.ctrl && input === 'n') {
      dispatch({ type: 'SET_TECHNOLOGY', technology: selections });
      onNext();
    }
  });

  const handleSelect = (item: { value: string }) => {
    setSelections({ ...selections, [activeCategory]: item.value });
  };

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Technology Stack</Text>
      <Text color="gray" dimColor>
        Select your preferred technologies (Tab to switch, Ctrl+N to continue)
      </Text>

      <Box marginTop={1} flexDirection="row" flexWrap="wrap">
        {categories.map((category) => (
          <Box 
            key={category}
            flexDirection="column" 
            marginRight={2}
            borderStyle={activeCategory === category ? 'single' : undefined}
            borderColor={activeCategory === category ? 'green' : undefined}
            paddingX={1}
          >
            <Text bold color={activeCategory === category ? 'green' : 'white'}>
              {category.charAt(0).toUpperCase() + category.slice(1)}
            </Text>
            
            {activeCategory === category ? (
              <SelectInput
                items={TECH_OPTIONS[category]}
                initialIndex={TECH_OPTIONS[category].findIndex(
                  opt => opt.value === selections[category]
                )}
                onSelect={handleSelect}
              />
            ) : (
              <Text color="gray">
                {TECH_OPTIONS[category].find(
                  opt => opt.value === selections[category]
                )?.label || 'Not selected'}
              </Text>
            )}
          </Box>
        ))}
      </Box>

      {/* Summary */}
      <Box marginTop={2} flexDirection="column">
        <Text bold>Selected Stack:</Text>
        <Text color="cyan">
          {selections.frontend !== 'none' && `${TECH_OPTIONS.frontend.find(o => o.value === selections.frontend)?.label}`}
          {selections.frontend !== 'none' && selections.backend !== 'none' && ' + '}
          {selections.backend !== 'none' && `${TECH_OPTIONS.backend.find(o => o.value === selections.backend)?.label}`}
          {selections.database !== 'none' && ` + ${TECH_OPTIONS.database.find(o => o.value === selections.database)?.label}`}
          {' → '}
          {TECH_OPTIONS.cloud.find(o => o.value === selections.cloud)?.label}
        </Text>
      </Box>
    </Box>
  );
}
```

### 2.7 Review Step (`src/wizard/steps/ReviewStep.tsx`)

```tsx
import React from 'react';
import { Box, Text, useInput } from 'ink';
import { useWizard } from '../context/WizardContext';

interface StepProps {
  onNext: () => void;
  onBack: () => void;
}

export function ReviewStep({ onNext, onBack }: StepProps) {
  const { state } = useWizard();

  useInput((input, key) => {
    if (key.return) {
      onNext();
    }
    if (key.backspace || key.delete) {
      onBack();
    }
  });

  return (
    <Box flexDirection="column">
      <Text bold color="cyan">Review Configuration</Text>
      <Text color="gray" dimColor>
        Please review your selections before starting
      </Text>

      <Box marginY={1} flexDirection="column">
        {/* Project */}
        <Box marginBottom={1}>
          <Text bold color="yellow">Project: </Text>
          <Text>{state.projectName || '(unnamed)'}</Text>
        </Box>

        {/* Scenario */}
        <Box marginBottom={1}>
          <Text bold color="yellow">Scenario: </Text>
          <Text>{state.scenario}</Text>
        </Box>

        {/* Requirements */}
        <Box marginBottom={1} flexDirection="column">
          <Text bold color="yellow">Requirements:</Text>
          <Box paddingLeft={2} flexDirection="column">
            <Text color="gray">Description: {state.requirements.description || '(none)'}</Text>
            <Text color="gray">Features: {state.requirements.features.length} items</Text>
            <Text color="gray">Constraints: {state.requirements.constraints.length} items</Text>
          </Box>
        </Box>

        {/* Technology */}
        <Box marginBottom={1} flexDirection="column">
          <Text bold color="yellow">Technology Stack:</Text>
          <Box paddingLeft={2} flexDirection="column">
            <Text color="gray">Frontend: {state.technology.frontend || 'None'}</Text>
            <Text color="gray">Backend: {state.technology.backend || 'None'}</Text>
            <Text color="gray">Database: {state.technology.database || 'None'}</Text>
            <Text color="gray">Cloud: {state.technology.cloud || 'None'}</Text>
          </Box>
        </Box>

        {/* Agents */}
        <Box marginBottom={1} flexDirection="column">
          <Text bold color="yellow">Selected Agents: </Text>
          <Text color="gray">{state.agents.length > 0 ? state.agents.join(', ') : 'Auto-select based on scenario'}</Text>
        </Box>
      </Box>

      <Box marginTop={1}>
        <Text color="green" bold>Press Enter to confirm and start</Text>
        <Text color="gray"> or Backspace to edit</Text>
      </Box>
    </Box>
  );
}
```

---

## 🧰 Reusable Components

### ProgressBar Component

```tsx
// src/wizard/components/ProgressBar.tsx
import React from 'react';
import { Box, Text } from 'ink';

interface ProgressBarProps {
  current: number;
  total: number;
  steps: string[];
}

export function ProgressBar({ current, total, steps }: ProgressBarProps) {
  const percentage = Math.round((current / (total - 1)) * 100);

  return (
    <Box flexDirection="column" marginY={1}>
      {/* Step indicators */}
      <Box>
        {steps.map((step, index) => (
          <React.Fragment key={step}>
            <Text
              color={index < current ? 'green' : index === current ? 'cyan' : 'gray'}
              bold={index === current}
            >
              {index < current ? '✓' : index === current ? '●' : '○'} {step}
            </Text>
            {index < steps.length - 1 && (
              <Text color="gray"> → </Text>
            )}
          </React.Fragment>
        ))}
      </Box>

      {/* Progress bar */}
      <Box marginTop={1}>
        <Text color="gray">[</Text>
        <Text color="green">{'█'.repeat(Math.floor(percentage / 5))}</Text>
        <Text color="gray">{'░'.repeat(20 - Math.floor(percentage / 5))}</Text>
        <Text color="gray">] </Text>
        <Text color="cyan">{percentage}%</Text>
      </Box>
    </Box>
  );
}
```

### InfoBox Component

```tsx
// src/wizard/components/InfoBox.tsx
import React from 'react';
import { Box, Text } from 'ink';

interface InfoBoxProps {
  title: string;
  children: React.ReactNode;
  type?: 'info' | 'warning' | 'success' | 'error';
}

export function InfoBox({ title, children, type = 'info' }: InfoBoxProps) {
  const colors = {
    info: 'cyan',
    warning: 'yellow',
    success: 'green',
    error: 'red',
  };

  const icons = {
    info: 'ℹ',
    warning: '⚠',
    success: '✓',
    error: '✗',
  };

  return (
    <Box 
      flexDirection="column" 
      borderStyle="round" 
      borderColor={colors[type]}
      paddingX={1}
      marginY={1}
    >
      <Text bold color={colors[type]}>
        {icons[type]} {title}
      </Text>
      <Box paddingLeft={2}>
        {children}
      </Box>
    </Box>
  );
}
```

---

## 🧪 Testing Strategy

### Component Tests

```tsx
// tests/wizard/ScenarioStep.test.tsx
import React from 'react';
import { render } from 'ink-testing-library';
import { WizardProvider } from '../../src/wizard/context/WizardContext';
import { ScenarioStep } from '../../src/wizard/steps/ScenarioStep';

describe('ScenarioStep', () => {
  it('should render all scenarios', () => {
    const { lastFrame } = render(
      <WizardProvider>
        <ScenarioStep onNext={jest.fn()} onBack={jest.fn()} />
      </WizardProvider>
    );

    expect(lastFrame()).toContain('S01: Full Stack Application');
    expect(lastFrame()).toContain('S02: API-Only Backend');
    expect(lastFrame()).toContain('S03: Frontend Application');
  });

  it('should show scenario details on highlight', async () => {
    const { lastFrame, stdin } = render(
      <WizardProvider>
        <ScenarioStep onNext={jest.fn()} onBack={jest.fn()} />
      </WizardProvider>
    );

    // Navigate down
    stdin.write('\u001B[B'); // Arrow down

    expect(lastFrame()).toContain('REST/GraphQL API');
  });
});
```

---

## 📋 Acceptance Criteria

- [ ] `agentic run --interactive` launches the wizard
- [ ] Wizard shows progress through all steps
- [ ] Each scenario shows detailed description
- [ ] Requirements can be entered with multiple features/constraints
- [ ] Technology selection shows all options
- [ ] Review step shows complete configuration
- [ ] Navigation with Tab, Enter, Backspace, Escape works
- [ ] Wizard state persists between steps
- [ ] Wizard can be cancelled with Escape/Ctrl+C
- [ ] Completed wizard returns structured WizardResult

---

## 🔗 MCP Integration Points

- **Memory MCP**: Cache previous wizard sessions for quick re-run
- **Filesystem MCP**: Save wizard results to `.agenticcoder/wizard-result.json`

```typescript
// Save wizard result for agent consumption
async function saveWizardResult(result: WizardResult, projectPath: string) {
  const fsClient = await connectToFilesystemMCP();
  
  await fsClient.callTool('write_file', {
    path: `${projectPath}/.agenticcoder/wizard-result.json`,
    content: JSON.stringify(result, null, 2)
  });
  
  // Also store in Memory MCP for quick access
  const memoryClient = await connectToMemoryMCP();
  await memoryClient.callTool('store', {
    key: `wizard:${result.projectName}`,
    value: result
  });
}
```

---

## 🔗 Navigation

← [01-PHASE-CLI-FOUNDATION.md](01-PHASE-CLI-FOUNDATION.md) | [03-PHASE-PROGRESS-DASHBOARD.md](03-PHASE-PROGRESS-DASHBOARD.md) →
