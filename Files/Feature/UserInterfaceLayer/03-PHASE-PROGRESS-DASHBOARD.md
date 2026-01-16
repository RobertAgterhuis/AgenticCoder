# Phase 3: Progress Dashboard

**Phase ID:** F-UIL-P03  
**Feature:** UserInterfaceLayer  
**Duration:** 1.5 weeks  
**Status:** ⬜ Not Started  
**Depends On:** Phase 2 (Interactive Wizard)

---

## 🎯 Phase Objectives

Deze phase implementeert het **Real-time Progress Dashboard**:
- Live execution status van scenarios en agents
- Real-time log streaming
- Phase progress visualization
- Error/warning highlighting
- Artifact generation tracking

---

## 📦 Deliverables

### 1. Dashboard Package Structure

```
packages/cli/src/
├── dashboard/
│   ├── index.tsx                   # Dashboard entry point
│   ├── DashboardApp.tsx            # Main dashboard component
│   ├── context/
│   │   └── ExecutionContext.tsx    # Execution state management
│   ├── panels/
│   │   ├── HeaderPanel.tsx         # Project/scenario info
│   │   ├── PhasePanel.tsx          # Phase progress
│   │   ├── AgentPanel.tsx          # Active agents
│   │   ├── LogPanel.tsx            # Log output
│   │   ├── ArtifactPanel.tsx       # Generated artifacts
│   │   └── StatusBar.tsx           # Bottom status
│   ├── components/
│   │   ├── PhaseProgress.tsx       # Phase progress bars
│   │   ├── AgentCard.tsx           # Agent status card
│   │   ├── LogEntry.tsx            # Single log entry
│   │   ├── ArtifactItem.tsx        # Artifact display
│   │   ├── Spinner.tsx             # Loading spinner
│   │   └── Timer.tsx               # Elapsed time
│   ├── hooks/
│   │   ├── useEventSource.ts       # SSE connection
│   │   ├── useWebSocket.ts         # WebSocket connection
│   │   ├── useExecutionState.ts    # Execution state
│   │   └── useKeyBindings.ts       # Dashboard shortcuts
│   └── types/
│       ├── events.ts               # Event types
│       └── state.ts                # State types
```

### 2. Dependencies

```json
{
  "dependencies": {
    "ink": "^4.4.0",
    "ink-big-text": "^2.0.0",
    "react": "^18.2.0",
    "zustand": "^4.5.0",
    "date-fns": "^3.0.0",
    "ws": "^8.16.0",
    "eventsource": "^2.0.0"
  }
}
```

---

## 🔧 Implementation Details

### 3.1 Dashboard Entry Point (`src/dashboard/index.tsx`)

```tsx
import React from 'react';
import { render } from 'ink';
import { DashboardApp } from './DashboardApp';
import { ExecutionProvider } from './context/ExecutionContext';

export interface DashboardOptions {
  executionId: string;
  projectPath: string;
  serverUrl?: string;
  mode?: 'full' | 'compact' | 'logs-only';
}

export async function launchDashboard(options: DashboardOptions): Promise<void> {
  const { waitUntilExit } = render(
    <ExecutionProvider 
      executionId={options.executionId}
      serverUrl={options.serverUrl || 'ws://localhost:3001'}
    >
      <DashboardApp mode={options.mode || 'full'} />
    </ExecutionProvider>
  );

  await waitUntilExit();
}
```

### 3.2 Main Dashboard Component (`src/dashboard/DashboardApp.tsx`)

```tsx
import React, { useEffect } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { useExecution } from './context/ExecutionContext';
import { HeaderPanel } from './panels/HeaderPanel';
import { PhasePanel } from './panels/PhasePanel';
import { AgentPanel } from './panels/AgentPanel';
import { LogPanel } from './panels/LogPanel';
import { ArtifactPanel } from './panels/ArtifactPanel';
import { StatusBar } from './panels/StatusBar';

interface DashboardAppProps {
  mode: 'full' | 'compact' | 'logs-only';
}

export function DashboardApp({ mode }: DashboardAppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { 
    execution, 
    isConnected, 
    connect, 
    disconnect,
    pauseExecution,
    resumeExecution,
    cancelExecution
  } = useExecution();

  // Connect on mount
  useEffect(() => {
    connect();
    return () => disconnect();
  }, []);

  // Global key bindings
  useInput((input, key) => {
    if (key.escape || (key.ctrl && input === 'c')) {
      disconnect();
      exit();
    }
    if (input === 'p' && execution?.status === 'running') {
      pauseExecution();
    }
    if (input === 'r' && execution?.status === 'paused') {
      resumeExecution();
    }
    if (key.ctrl && input === 'x') {
      cancelExecution();
    }
  });

  // Calculate panel heights based on terminal size
  const terminalHeight = stdout?.rows || 40;
  const headerHeight = 4;
  const statusBarHeight = 3;
  const contentHeight = terminalHeight - headerHeight - statusBarHeight;

  if (!isConnected) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="yellow">⏳ Connecting to execution server...</Text>
      </Box>
    );
  }

  if (!execution) {
    return (
      <Box flexDirection="column" padding={1}>
        <Text color="red">❌ No active execution found</Text>
        <Text color="gray">Run "agentic run" to start a scenario</Text>
      </Box>
    );
  }

  if (mode === 'logs-only') {
    return (
      <Box flexDirection="column" height={terminalHeight}>
        <HeaderPanel execution={execution} compact />
        <LogPanel logs={execution.logs} height={contentHeight} fullWidth />
        <StatusBar execution={execution} />
      </Box>
    );
  }

  if (mode === 'compact') {
    return (
      <Box flexDirection="column" height={terminalHeight}>
        <HeaderPanel execution={execution} compact />
        <Box flexDirection="row" height={contentHeight}>
          <PhasePanel phases={execution.phases} width="40%" />
          <LogPanel logs={execution.logs} width="60%" />
        </Box>
        <StatusBar execution={execution} />
      </Box>
    );
  }

  // Full mode - 4-panel layout
  return (
    <Box flexDirection="column" height={terminalHeight}>
      <HeaderPanel execution={execution} />
      
      <Box flexDirection="row" height={contentHeight}>
        {/* Left column */}
        <Box flexDirection="column" width="35%">
          <PhasePanel phases={execution.phases} height="50%" />
          <AgentPanel agents={execution.activeAgents} height="50%" />
        </Box>
        
        {/* Right column */}
        <Box flexDirection="column" width="65%">
          <LogPanel logs={execution.logs} height="70%" />
          <ArtifactPanel artifacts={execution.artifacts} height="30%" />
        </Box>
      </Box>
      
      <StatusBar execution={execution} />
    </Box>
  );
}
```

### 3.3 Execution Context (`src/dashboard/context/ExecutionContext.tsx`)

```tsx
import React, { createContext, useContext, useReducer, useCallback, useRef } from 'react';
import { ExecutionState, ExecutionEvent } from '../types';

interface ExecutionContextType {
  execution: ExecutionState | null;
  isConnected: boolean;
  error: string | null;
  connect: () => void;
  disconnect: () => void;
  pauseExecution: () => void;
  resumeExecution: () => void;
  cancelExecution: () => void;
}

const ExecutionContext = createContext<ExecutionContextType | null>(null);

type Action =
  | { type: 'CONNECTED' }
  | { type: 'DISCONNECTED' }
  | { type: 'ERROR'; error: string }
  | { type: 'EXECUTION_UPDATE'; execution: ExecutionState }
  | { type: 'PHASE_START'; phaseId: string }
  | { type: 'PHASE_COMPLETE'; phaseId: string }
  | { type: 'AGENT_START'; agentId: string; task: string }
  | { type: 'AGENT_COMPLETE'; agentId: string; result: any }
  | { type: 'LOG_ENTRY'; entry: LogEntry }
  | { type: 'ARTIFACT_CREATED'; artifact: Artifact };

interface State {
  execution: ExecutionState | null;
  isConnected: boolean;
  error: string | null;
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case 'CONNECTED':
      return { ...state, isConnected: true, error: null };
    case 'DISCONNECTED':
      return { ...state, isConnected: false };
    case 'ERROR':
      return { ...state, error: action.error };
    case 'EXECUTION_UPDATE':
      return { ...state, execution: action.execution };
    case 'LOG_ENTRY':
      if (!state.execution) return state;
      return {
        ...state,
        execution: {
          ...state.execution,
          logs: [...state.execution.logs.slice(-200), action.entry], // Keep last 200
        },
      };
    case 'ARTIFACT_CREATED':
      if (!state.execution) return state;
      return {
        ...state,
        execution: {
          ...state.execution,
          artifacts: [...state.execution.artifacts, action.artifact],
        },
      };
    // ... handle other actions
    default:
      return state;
  }
}

export function ExecutionProvider({ 
  children, 
  executionId,
  serverUrl 
}: { 
  children: React.ReactNode;
  executionId: string;
  serverUrl: string;
}) {
  const [state, dispatch] = useReducer(reducer, {
    execution: null,
    isConnected: false,
    error: null,
  });

  const wsRef = useRef<WebSocket | null>(null);

  const connect = useCallback(() => {
    const ws = new WebSocket(`${serverUrl}/executions/${executionId}/stream`);
    
    ws.onopen = () => {
      dispatch({ type: 'CONNECTED' });
    };

    ws.onmessage = (event) => {
      const data: ExecutionEvent = JSON.parse(event.data);
      
      switch (data.type) {
        case 'execution:state':
          dispatch({ type: 'EXECUTION_UPDATE', execution: data.payload });
          break;
        case 'execution:log':
          dispatch({ type: 'LOG_ENTRY', entry: data.payload });
          break;
        case 'execution:artifact':
          dispatch({ type: 'ARTIFACT_CREATED', artifact: data.payload });
          break;
        case 'phase:start':
          dispatch({ type: 'PHASE_START', phaseId: data.payload.phaseId });
          break;
        case 'phase:complete':
          dispatch({ type: 'PHASE_COMPLETE', phaseId: data.payload.phaseId });
          break;
        case 'agent:start':
          dispatch({ type: 'AGENT_START', agentId: data.payload.agentId, task: data.payload.task });
          break;
        case 'agent:complete':
          dispatch({ type: 'AGENT_COMPLETE', agentId: data.payload.agentId, result: data.payload.result });
          break;
      }
    };

    ws.onerror = (error) => {
      dispatch({ type: 'ERROR', error: 'WebSocket connection error' });
    };

    ws.onclose = () => {
      dispatch({ type: 'DISCONNECTED' });
    };

    wsRef.current = ws;
  }, [executionId, serverUrl]);

  const disconnect = useCallback(() => {
    wsRef.current?.close();
  }, []);

  const sendCommand = useCallback((command: string, payload?: any) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ command, payload }));
    }
  }, []);

  const pauseExecution = useCallback(() => sendCommand('pause'), [sendCommand]);
  const resumeExecution = useCallback(() => sendCommand('resume'), [sendCommand]);
  const cancelExecution = useCallback(() => sendCommand('cancel'), [sendCommand]);

  return (
    <ExecutionContext.Provider value={{
      ...state,
      connect,
      disconnect,
      pauseExecution,
      resumeExecution,
      cancelExecution,
    }}>
      {children}
    </ExecutionContext.Provider>
  );
}

export function useExecution() {
  const context = useContext(ExecutionContext);
  if (!context) {
    throw new Error('useExecution must be used within ExecutionProvider');
  }
  return context;
}
```

### 3.4 Phase Panel (`src/dashboard/panels/PhasePanel.tsx`)

```tsx
import React from 'react';
import { Box, Text } from 'ink';
import { Phase } from '../types';

interface PhasePanelProps {
  phases: Phase[];
  width?: string;
  height?: string;
}

export function PhasePanel({ phases, width = '100%', height }: PhasePanelProps) {
  const currentPhase = phases.find(p => p.status === 'running');
  const completedCount = phases.filter(p => p.status === 'completed').length;

  return (
    <Box 
      flexDirection="column" 
      width={width}
      height={height}
      borderStyle="single"
      borderColor="blue"
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text bold color="blue">📋 Phases </Text>
        <Text color="gray">({completedCount}/{phases.length})</Text>
      </Box>

      {phases.map((phase, index) => (
        <PhaseItem key={phase.id} phase={phase} index={index} />
      ))}
    </Box>
  );
}

function PhaseItem({ phase, index }: { phase: Phase; index: number }) {
  const statusIcons = {
    pending: '○',
    running: '●',
    completed: '✓',
    failed: '✗',
    skipped: '◌',
  };

  const statusColors: Record<string, string> = {
    pending: 'gray',
    running: 'cyan',
    completed: 'green',
    failed: 'red',
    skipped: 'gray',
  };

  return (
    <Box flexDirection="row">
      <Text color={statusColors[phase.status]}>
        {statusIcons[phase.status]} 
      </Text>
      <Box marginLeft={1} flexDirection="column">
        <Text 
          color={phase.status === 'running' ? 'white' : statusColors[phase.status]}
          bold={phase.status === 'running'}
        >
          P{index + 1}: {phase.name}
        </Text>
        
        {phase.status === 'running' && phase.progress !== undefined && (
          <Box>
            <Text color="gray">[</Text>
            <Text color="cyan">{'█'.repeat(Math.floor(phase.progress / 5))}</Text>
            <Text color="gray">{'░'.repeat(20 - Math.floor(phase.progress / 5))}</Text>
            <Text color="gray">] </Text>
            <Text color="cyan">{phase.progress}%</Text>
          </Box>
        )}

        {phase.status === 'running' && phase.currentTask && (
          <Text color="gray" dimColor>
            └─ {phase.currentTask}
          </Text>
        )}

        {phase.duration && (
          <Text color="gray" dimColor>
            {formatDuration(phase.duration)}
          </Text>
        )}
      </Box>
    </Box>
  );
}

function formatDuration(ms: number): string {
  const seconds = Math.floor(ms / 1000);
  const minutes = Math.floor(seconds / 60);
  if (minutes > 0) {
    return `${minutes}m ${seconds % 60}s`;
  }
  return `${seconds}s`;
}
```

### 3.5 Agent Panel (`src/dashboard/panels/AgentPanel.tsx`)

```tsx
import React from 'react';
import { Box, Text } from 'ink';
import Spinner from 'ink-spinner';
import { Agent } from '../types';

interface AgentPanelProps {
  agents: Agent[];
  width?: string;
  height?: string;
}

export function AgentPanel({ agents, width = '100%', height }: AgentPanelProps) {
  const activeAgents = agents.filter(a => a.status === 'active');
  const idleAgents = agents.filter(a => a.status === 'idle');

  return (
    <Box 
      flexDirection="column" 
      width={width}
      height={height}
      borderStyle="single"
      borderColor="magenta"
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text bold color="magenta">🤖 Agents </Text>
        <Text color="green">{activeAgents.length} active</Text>
        <Text color="gray"> / {agents.length} total</Text>
      </Box>

      {activeAgents.map(agent => (
        <AgentCard key={agent.id} agent={agent} active />
      ))}

      {idleAgents.length > 0 && (
        <Box marginTop={1}>
          <Text color="gray" dimColor>
            Idle: {idleAgents.map(a => a.name).join(', ')}
          </Text>
        </Box>
      )}
    </Box>
  );
}

function AgentCard({ agent, active }: { agent: Agent; active?: boolean }) {
  return (
    <Box flexDirection="row" marginBottom={1}>
      {active && (
        <Text color="green">
          <Spinner type="dots" />
        </Text>
      )}
      <Box marginLeft={active ? 1 : 0} flexDirection="column">
        <Text color={active ? 'white' : 'gray'} bold={active}>
          @{agent.name}
        </Text>
        {agent.currentTask && (
          <Text color="gray" dimColor wrap="truncate">
            └─ {agent.currentTask}
          </Text>
        )}
        {agent.progress !== undefined && (
          <Box>
            <Text color="gray">[</Text>
            <Text color="magenta">{'█'.repeat(Math.floor(agent.progress / 10))}</Text>
            <Text color="gray">{'░'.repeat(10 - Math.floor(agent.progress / 10))}</Text>
            <Text color="gray">] </Text>
            <Text color="magenta">{agent.progress}%</Text>
          </Box>
        )}
      </Box>
    </Box>
  );
}
```

### 3.6 Log Panel (`src/dashboard/panels/LogPanel.tsx`)

```tsx
import React, { useRef, useEffect } from 'react';
import { Box, Text, useStdout } from 'ink';
import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
  width?: string;
  height?: string;
  fullWidth?: boolean;
}

export function LogPanel({ logs, width = '100%', height, fullWidth }: LogPanelProps) {
  const { stdout } = useStdout();
  const maxLines = height ? parseInt(height) - 4 : 15;
  const visibleLogs = logs.slice(-maxLines);

  return (
    <Box 
      flexDirection="column" 
      width={fullWidth ? '100%' : width}
      height={height}
      borderStyle="single"
      borderColor="yellow"
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text bold color="yellow">📜 Logs </Text>
        <Text color="gray">({logs.length} entries)</Text>
      </Box>

      {visibleLogs.map((log, index) => (
        <LogEntryRow key={`${log.timestamp}-${index}`} entry={log} />
      ))}

      {logs.length > maxLines && (
        <Text color="gray" dimColor>
          ... {logs.length - maxLines} earlier entries
        </Text>
      )}
    </Box>
  );
}

function LogEntryRow({ entry }: { entry: LogEntry }) {
  const levelColors: Record<string, string> = {
    debug: 'gray',
    info: 'white',
    warn: 'yellow',
    error: 'red',
    success: 'green',
  };

  const levelIcons: Record<string, string> = {
    debug: '🔍',
    info: 'ℹ️',
    warn: '⚠️',
    error: '❌',
    success: '✅',
  };

  const time = new Date(entry.timestamp).toLocaleTimeString('en-US', {
    hour12: false,
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
  });

  return (
    <Box>
      <Text color="gray" dimColor>{time} </Text>
      <Text color={levelColors[entry.level]}>
        {levelIcons[entry.level] || '•'} 
      </Text>
      {entry.source && (
        <Text color="cyan">[{entry.source}] </Text>
      )}
      <Text color={levelColors[entry.level]} wrap="truncate">
        {entry.message}
      </Text>
    </Box>
  );
}
```

### 3.7 Artifact Panel (`src/dashboard/panels/ArtifactPanel.tsx`)

```tsx
import React from 'react';
import { Box, Text } from 'ink';
import { Artifact } from '../types';

interface ArtifactPanelProps {
  artifacts: Artifact[];
  width?: string;
  height?: string;
}

export function ArtifactPanel({ artifacts, width = '100%', height }: ArtifactPanelProps) {
  const recentArtifacts = artifacts.slice(-10);

  const typeIcons: Record<string, string> = {
    file: '📄',
    document: '📋',
    code: '💻',
    config: '⚙️',
    test: '🧪',
    schema: '📊',
  };

  return (
    <Box 
      flexDirection="column" 
      width={width}
      height={height}
      borderStyle="single"
      borderColor="green"
      paddingX={1}
    >
      <Box marginBottom={1}>
        <Text bold color="green">📦 Artifacts </Text>
        <Text color="gray">({artifacts.length} generated)</Text>
      </Box>

      {recentArtifacts.map((artifact, index) => (
        <Box key={artifact.id} flexDirection="row">
          <Text color="green">{typeIcons[artifact.type] || '📄'} </Text>
          <Text color="white">{artifact.name}</Text>
          <Text color="gray" dimColor> - {artifact.path}</Text>
        </Box>
      ))}

      {artifacts.length === 0 && (
        <Text color="gray" dimColor>No artifacts generated yet...</Text>
      )}
    </Box>
  );
}
```

### 3.8 Status Bar (`src/dashboard/panels/StatusBar.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import { Box, Text } from 'ink';
import { ExecutionState } from '../types';

interface StatusBarProps {
  execution: ExecutionState;
}

export function StatusBar({ execution }: StatusBarProps) {
  const [elapsed, setElapsed] = useState(0);

  useEffect(() => {
    const startTime = new Date(execution.startedAt).getTime();
    const timer = setInterval(() => {
      setElapsed(Date.now() - startTime);
    }, 1000);

    return () => clearInterval(timer);
  }, [execution.startedAt]);

  const formatElapsed = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m ${seconds % 60}s`;
    }
    if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    }
    return `${seconds}s`;
  };

  const statusColors: Record<string, string> = {
    running: 'green',
    paused: 'yellow',
    completed: 'cyan',
    failed: 'red',
    cancelled: 'gray',
  };

  return (
    <Box 
      flexDirection="row" 
      justifyContent="space-between"
      borderStyle="single"
      borderColor="gray"
      paddingX={1}
    >
      {/* Left: Status */}
      <Box>
        <Text color={statusColors[execution.status]}>
          ● {execution.status.toUpperCase()}
        </Text>
        <Text color="gray"> | </Text>
        <Text color="white">{execution.scenario}</Text>
      </Box>

      {/* Center: Time */}
      <Box>
        <Text color="gray">⏱ </Text>
        <Text color="white">{formatElapsed(elapsed)}</Text>
      </Box>

      {/* Right: Key hints */}
      <Box>
        <Text color="gray">
          {execution.status === 'running' && '[P]ause '}
          {execution.status === 'paused' && '[R]esume '}
          [Ctrl+X] Cancel [Esc] Exit
        </Text>
      </Box>
    </Box>
  );
}
```

---

## 🔗 Event Types (`src/dashboard/types/events.ts`)

```typescript
export interface ExecutionEvent {
  type: string;
  timestamp: string;
  payload: any;
}

export interface ExecutionState {
  id: string;
  scenario: string;
  status: 'pending' | 'running' | 'paused' | 'completed' | 'failed' | 'cancelled';
  startedAt: string;
  completedAt?: string;
  phases: Phase[];
  activeAgents: Agent[];
  logs: LogEntry[];
  artifacts: Artifact[];
  errors: ExecutionError[];
}

export interface Phase {
  id: string;
  name: string;
  status: 'pending' | 'running' | 'completed' | 'failed' | 'skipped';
  progress?: number;
  currentTask?: string;
  duration?: number;
  startedAt?: string;
  completedAt?: string;
}

export interface Agent {
  id: string;
  name: string;
  status: 'idle' | 'active' | 'completed' | 'error';
  currentTask?: string;
  progress?: number;
}

export interface LogEntry {
  timestamp: string;
  level: 'debug' | 'info' | 'warn' | 'error' | 'success';
  source?: string;
  message: string;
  data?: any;
}

export interface Artifact {
  id: string;
  type: 'file' | 'document' | 'code' | 'config' | 'test' | 'schema';
  name: string;
  path: string;
  createdAt: string;
  size?: number;
}

export interface ExecutionError {
  timestamp: string;
  phase?: string;
  agent?: string;
  message: string;
  stack?: string;
  recoverable: boolean;
}
```

---

## 🧪 Testing Strategy

```tsx
// tests/dashboard/DashboardApp.test.tsx
import React from 'react';
import { render } from 'ink-testing-library';
import { DashboardApp } from '../../src/dashboard/DashboardApp';
import { ExecutionProvider } from '../../src/dashboard/context/ExecutionContext';

// Mock WebSocket
jest.mock('ws');

describe('DashboardApp', () => {
  const mockExecution = {
    id: 'exec-123',
    scenario: 'S01',
    status: 'running',
    startedAt: new Date().toISOString(),
    phases: [
      { id: 'p1', name: 'Requirements', status: 'completed' },
      { id: 'p2', name: 'Design', status: 'running', progress: 45 },
    ],
    activeAgents: [
      { id: 'a1', name: 'doc', status: 'active', currentTask: 'Generating specs' },
    ],
    logs: [],
    artifacts: [],
    errors: [],
  };

  it('should render all panels in full mode', () => {
    const { lastFrame } = render(
      <ExecutionProvider executionId="exec-123" serverUrl="ws://test">
        <DashboardApp mode="full" />
      </ExecutionProvider>
    );

    expect(lastFrame()).toContain('Phases');
    expect(lastFrame()).toContain('Agents');
    expect(lastFrame()).toContain('Logs');
    expect(lastFrame()).toContain('Artifacts');
  });

  it('should show compact layout when mode is compact', () => {
    const { lastFrame } = render(
      <ExecutionProvider executionId="exec-123" serverUrl="ws://test">
        <DashboardApp mode="compact" />
      </ExecutionProvider>
    );

    expect(lastFrame()).toContain('Phases');
    expect(lastFrame()).toContain('Logs');
    expect(lastFrame()).not.toContain('Artifacts');
  });
});
```

---

## 📋 Acceptance Criteria

- [ ] `agentic status --watch` launches dashboard
- [ ] Dashboard connects to execution server via WebSocket
- [ ] Phase progress updates in real-time
- [ ] Agent activity shows current tasks
- [ ] Logs scroll automatically with new entries
- [ ] Artifacts appear as they are generated
- [ ] Status bar shows elapsed time
- [ ] [P] pauses execution, [R] resumes
- [ ] Ctrl+X cancels with confirmation
- [ ] Escape exits dashboard cleanly
- [ ] Dashboard handles connection loss gracefully
- [ ] Compact mode works on smaller terminals

---

## 🔗 MCP Integration Points

Dit dashboard zal events ontvangen die mogelijk van MCP servers komen:

```typescript
// Event sources kunnen MCP-gebaseerd zijn
interface MCPEventSource {
  // Git MCP events
  'git:commit': { hash: string; message: string };
  'git:push': { branch: string; commits: number };
  
  // Filesystem MCP events
  'file:created': { path: string; size: number };
  'file:modified': { path: string };
  
  // Memory MCP events
  'memory:stored': { key: string };
}

// Dashboard kan MCP events weergeven
function handleMCPEvent(event: MCPEventSource) {
  dispatch({
    type: 'LOG_ENTRY',
    entry: {
      timestamp: new Date().toISOString(),
      level: 'info',
      source: 'MCP',
      message: formatMCPEvent(event),
    },
  });
}
```

---

## 🔗 Navigation

← [02-PHASE-INTERACTIVE-WIZARD.md](02-PHASE-INTERACTIVE-WIZARD.md) | [04-PHASE-AGENT-CONSOLE.md](04-PHASE-AGENT-CONSOLE.md) →
