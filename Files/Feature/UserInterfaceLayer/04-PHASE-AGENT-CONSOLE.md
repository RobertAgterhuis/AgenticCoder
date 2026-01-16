# Phase 4: Agent Console

**Phase ID:** F-UIL-P04  
**Feature:** UserInterfaceLayer  
**Duration:** 1 week  
**Status:** ⬜ Not Started  
**Depends On:** Phase 3 (Progress Dashboard)

---

## 🎯 Phase Objectives

Deze phase implementeert de **Agent Console** voor directe agent interactie:
- Direct agent invocation via CLI
- Interactive chat-style interface
- Agent chaining en handoffs
- Context passing tussen agents
- Response streaming

---

## 📦 Deliverables

### 1. Console Package Structure

```
packages/cli/src/
├── console/
│   ├── index.tsx                   # Console entry point
│   ├── ConsoleApp.tsx              # Main console component
│   ├── context/
│   │   ├── AgentContext.tsx        # Agent registry
│   │   └── SessionContext.tsx      # Chat session state
│   ├── components/
│   │   ├── ChatInput.tsx           # User input field
│   │   ├── MessageBubble.tsx       # Chat messages
│   │   ├── AgentSelector.tsx       # Agent picker
│   │   ├── ResponseStream.tsx      # Streaming output
│   │   ├── ContextViewer.tsx       # Show current context
│   │   └── HandoffIndicator.tsx    # Agent handoff display
│   ├── hooks/
│   │   ├── useAgent.ts             # Agent invocation
│   │   ├── useStreaming.ts         # Response streaming
│   │   └── useHistory.ts           # Command history
│   └── utils/
│       ├── parser.ts               # Input parsing
│       └── formatter.ts            # Output formatting
```

### 2. Dependencies

```json
{
  "dependencies": {
    "ink": "^4.4.0",
    "ink-text-input": "^5.0.0",
    "react": "^18.2.0",
    "zustand": "^4.5.0"
  }
}
```

---

## 🔧 Implementation Details

### 4.1 Console Entry Point (`src/console/index.tsx`)

```tsx
import React from 'react';
import { render } from 'ink';
import { ConsoleApp } from './ConsoleApp';
import { AgentProvider } from './context/AgentContext';
import { SessionProvider } from './context/SessionContext';

export interface ConsoleOptions {
  agent?: string;           // Pre-select agent
  projectPath: string;
  serverUrl?: string;
  context?: Record<string, any>;  // Initial context
}

export async function launchConsole(options: ConsoleOptions): Promise<void> {
  const { waitUntilExit } = render(
    <AgentProvider serverUrl={options.serverUrl || 'http://localhost:3001'}>
      <SessionProvider initialContext={options.context}>
        <ConsoleApp initialAgent={options.agent} />
      </SessionProvider>
    </AgentProvider>
  );

  await waitUntilExit();
}
```

### 4.2 Main Console Component (`src/console/ConsoleApp.tsx`)

```tsx
import React, { useState, useEffect } from 'react';
import { Box, Text, useApp, useInput, useStdout } from 'ink';
import { useAgents } from './context/AgentContext';
import { useSession } from './context/SessionContext';
import { ChatInput } from './components/ChatInput';
import { MessageBubble } from './components/MessageBubble';
import { AgentSelector } from './components/AgentSelector';
import { ResponseStream } from './components/ResponseStream';
import { ContextViewer } from './components/ContextViewer';

interface ConsoleAppProps {
  initialAgent?: string;
}

export function ConsoleApp({ initialAgent }: ConsoleAppProps) {
  const { exit } = useApp();
  const { stdout } = useStdout();
  const { agents, invokeAgent, isLoading } = useAgents();
  const { 
    messages, 
    currentAgent, 
    setCurrentAgent,
    addMessage,
    context,
    updateContext 
  } = useSession();
  
  const [showAgentSelector, setShowAgentSelector] = useState(!initialAgent);
  const [showContext, setShowContext] = useState(false);
  const [streamingResponse, setStreamingResponse] = useState<string | null>(null);

  // Set initial agent
  useEffect(() => {
    if (initialAgent) {
      setCurrentAgent(initialAgent);
    }
  }, [initialAgent]);

  // Global key bindings
  useInput((input, key) => {
    if (key.escape) {
      if (showAgentSelector) {
        setShowAgentSelector(false);
      } else if (showContext) {
        setShowContext(false);
      } else {
        exit();
      }
    }
    if (key.ctrl && input === 'a') {
      setShowAgentSelector(true);
    }
    if (key.ctrl && input === 'k') {
      setShowContext(!showContext);
    }
  });

  const handleSubmit = async (input: string) => {
    // Parse special commands
    if (input.startsWith('/')) {
      await handleCommand(input);
      return;
    }

    // Check for agent mention (@agent)
    const agentMention = input.match(/^@(\w+)\s*/);
    let targetAgent = currentAgent;
    let message = input;

    if (agentMention) {
      targetAgent = agentMention[1];
      message = input.slice(agentMention[0].length);
    }

    if (!targetAgent) {
      addMessage({
        type: 'system',
        content: 'No agent selected. Use Ctrl+A to select an agent or mention with @agent',
      });
      return;
    }

    // Add user message
    addMessage({
      type: 'user',
      content: message,
      agent: targetAgent,
    });

    // Invoke agent
    try {
      const response = await invokeAgent(targetAgent, message, context, {
        onStream: (chunk) => {
          setStreamingResponse(prev => (prev || '') + chunk);
        },
      });

      setStreamingResponse(null);

      // Add agent response
      addMessage({
        type: 'agent',
        content: response.content,
        agent: targetAgent,
        metadata: response.metadata,
      });

      // Handle handoff
      if (response.handoff) {
        addMessage({
          type: 'handoff',
          content: `Handing off to @${response.handoff.agent}`,
          from: targetAgent,
          to: response.handoff.agent,
        });
        setCurrentAgent(response.handoff.agent);
        
        // Auto-invoke next agent with context
        if (response.handoff.autoInvoke) {
          handleSubmit(`@${response.handoff.agent} ${response.handoff.message}`);
        }
      }

      // Update context if agent provides updates
      if (response.contextUpdates) {
        updateContext(response.contextUpdates);
      }

    } catch (error) {
      addMessage({
        type: 'error',
        content: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  };

  const handleCommand = async (input: string) => {
    const [command, ...args] = input.slice(1).split(' ');

    switch (command) {
      case 'help':
        addMessage({
          type: 'system',
          content: `Available commands:
  /help          - Show this help
  /agents        - List available agents
  /agent <name>  - Switch to agent
  /context       - Show current context
  /clear         - Clear messages
  /exit          - Exit console`,
        });
        break;

      case 'agents':
        addMessage({
          type: 'system',
          content: `Available agents:\n${agents.map(a => `  @${a.name} - ${a.description}`).join('\n')}`,
        });
        break;

      case 'agent':
        if (args[0]) {
          setCurrentAgent(args[0]);
          addMessage({
            type: 'system',
            content: `Switched to @${args[0]}`,
          });
        }
        break;

      case 'context':
        setShowContext(true);
        break;

      case 'clear':
        // Clear messages (keep context)
        addMessage({ type: 'clear' });
        break;

      case 'exit':
        exit();
        break;

      default:
        addMessage({
          type: 'system',
          content: `Unknown command: ${command}. Type /help for available commands.`,
        });
    }
  };

  // Calculate layout
  const terminalHeight = stdout?.rows || 30;
  const messagesHeight = terminalHeight - 8; // Leave room for input and status

  return (
    <Box flexDirection="column" height={terminalHeight}>
      {/* Header */}
      <Box paddingX={1} borderStyle="single" borderColor="cyan">
        <Text bold color="cyan">🤖 AgenticCoder Console</Text>
        <Box marginLeft={2}>
          <Text color="gray">Agent: </Text>
          <Text color={currentAgent ? 'green' : 'yellow'}>
            {currentAgent ? `@${currentAgent}` : '(none selected)'}
          </Text>
        </Box>
      </Box>

      {/* Agent Selector Overlay */}
      {showAgentSelector && (
        <AgentSelector
          agents={agents}
          onSelect={(agent) => {
            setCurrentAgent(agent);
            setShowAgentSelector(false);
          }}
          onCancel={() => setShowAgentSelector(false)}
        />
      )}

      {/* Context Viewer Overlay */}
      {showContext && (
        <ContextViewer 
          context={context}
          onClose={() => setShowContext(false)}
        />
      )}

      {/* Messages */}
      <Box 
        flexDirection="column" 
        height={messagesHeight}
        paddingX={1}
        overflowY="hidden"
      >
        {messages.slice(-20).map((msg, index) => (
          <MessageBubble key={index} message={msg} />
        ))}
        
        {/* Streaming response */}
        {streamingResponse && (
          <ResponseStream 
            content={streamingResponse} 
            agent={currentAgent!}
          />
        )}
        
        {/* Loading indicator */}
        {isLoading && !streamingResponse && (
          <Text color="gray">
            <Text color="cyan">●</Text> {currentAgent} is thinking...
          </Text>
        )}
      </Box>

      {/* Input */}
      <ChatInput 
        onSubmit={handleSubmit}
        disabled={isLoading}
        placeholder={currentAgent 
          ? `Ask @${currentAgent} something...` 
          : 'Select an agent with Ctrl+A or @mention'
        }
      />

      {/* Footer */}
      <Box paddingX={1}>
        <Text color="gray">
          Ctrl+A: Agents | Ctrl+K: Context | /help: Commands | Esc: Exit
        </Text>
      </Box>
    </Box>
  );
}
```

### 4.3 Agent Context (`src/console/context/AgentContext.tsx`)

```tsx
import React, { createContext, useContext, useState, useCallback } from 'react';

interface Agent {
  id: string;
  name: string;
  description: string;
  capabilities: string[];
  skills: string[];
}

interface InvokeOptions {
  onStream?: (chunk: string) => void;
  timeout?: number;
}

interface AgentResponse {
  content: string;
  metadata?: Record<string, any>;
  handoff?: {
    agent: string;
    message: string;
    autoInvoke: boolean;
  };
  contextUpdates?: Record<string, any>;
}

interface AgentContextType {
  agents: Agent[];
  isLoading: boolean;
  invokeAgent: (
    agentName: string, 
    message: string, 
    context: Record<string, any>,
    options?: InvokeOptions
  ) => Promise<AgentResponse>;
  getAgent: (name: string) => Agent | undefined;
}

const AgentContext = createContext<AgentContextType | null>(null);

export function AgentProvider({ 
  children,
  serverUrl 
}: { 
  children: React.ReactNode;
  serverUrl: string;
}) {
  const [agents, setAgents] = useState<Agent[]>([
    // Core agents
    { id: 'plan', name: 'plan', description: 'Generate project plans', capabilities: ['planning'], skills: ['project-planning'] },
    { id: 'doc', name: 'doc', description: 'Generate documentation', capabilities: ['documentation'], skills: ['markdown', 'diagrams'] },
    { id: 'backlog', name: 'backlog', description: 'Create backlog items', capabilities: ['backlog'], skills: ['user-stories'] },
    { id: 'coordinator', name: 'coordinator', description: 'Coordinate workflows', capabilities: ['orchestration'], skills: ['routing'] },
    // Tech agents
    { id: 'react', name: 'react', description: 'React components', capabilities: ['frontend'], skills: ['react', 'typescript'] },
    { id: 'dotnet', name: 'dotnet', description: '.NET code generation', capabilities: ['backend'], skills: ['csharp', 'aspnet'] },
    { id: 'bicep', name: 'bicep', description: 'Azure Bicep templates', capabilities: ['infrastructure'], skills: ['bicep', 'arm'] },
    { id: 'test', name: 'test', description: 'Generate tests', capabilities: ['testing'], skills: ['unit-tests', 'e2e'] },
  ]);
  const [isLoading, setIsLoading] = useState(false);

  const invokeAgent = useCallback(async (
    agentName: string,
    message: string,
    context: Record<string, any>,
    options?: InvokeOptions
  ): Promise<AgentResponse> => {
    setIsLoading(true);

    try {
      const response = await fetch(`${serverUrl}/agents/${agentName}/invoke`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message, context }),
      });

      if (!response.ok) {
        throw new Error(`Agent invocation failed: ${response.statusText}`);
      }

      // Handle streaming response
      if (options?.onStream && response.body) {
        const reader = response.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          fullContent += chunk;
          options.onStream(chunk);
        }

        return { content: fullContent };
      }

      return await response.json();

    } finally {
      setIsLoading(false);
    }
  }, [serverUrl]);

  const getAgent = useCallback((name: string) => {
    return agents.find(a => a.name === name);
  }, [agents]);

  return (
    <AgentContext.Provider value={{ agents, isLoading, invokeAgent, getAgent }}>
      {children}
    </AgentContext.Provider>
  );
}

export function useAgents() {
  const context = useContext(AgentContext);
  if (!context) {
    throw new Error('useAgents must be used within AgentProvider');
  }
  return context;
}
```

### 4.4 Session Context (`src/console/context/SessionContext.tsx`)

```tsx
import React, { createContext, useContext, useReducer, useMemo } from 'react';

interface Message {
  type: 'user' | 'agent' | 'system' | 'error' | 'handoff' | 'clear';
  content: string;
  agent?: string;
  from?: string;
  to?: string;
  metadata?: Record<string, any>;
  timestamp?: string;
}

interface SessionState {
  messages: Message[];
  currentAgent: string | null;
  context: Record<string, any>;
  history: string[];
}

type SessionAction =
  | { type: 'ADD_MESSAGE'; message: Message }
  | { type: 'SET_AGENT'; agent: string }
  | { type: 'UPDATE_CONTEXT'; updates: Record<string, any> }
  | { type: 'CLEAR_MESSAGES' }
  | { type: 'ADD_HISTORY'; input: string };

function sessionReducer(state: SessionState, action: SessionAction): SessionState {
  switch (action.type) {
    case 'ADD_MESSAGE':
      if (action.message.type === 'clear') {
        return { ...state, messages: [] };
      }
      return {
        ...state,
        messages: [
          ...state.messages,
          { ...action.message, timestamp: new Date().toISOString() },
        ],
      };
    case 'SET_AGENT':
      return { ...state, currentAgent: action.agent };
    case 'UPDATE_CONTEXT':
      return { 
        ...state, 
        context: { ...state.context, ...action.updates } 
      };
    case 'CLEAR_MESSAGES':
      return { ...state, messages: [] };
    case 'ADD_HISTORY':
      return {
        ...state,
        history: [...state.history.slice(-50), action.input],
      };
    default:
      return state;
  }
}

interface SessionContextType {
  messages: Message[];
  currentAgent: string | null;
  context: Record<string, any>;
  history: string[];
  setCurrentAgent: (agent: string) => void;
  addMessage: (message: Message) => void;
  updateContext: (updates: Record<string, any>) => void;
  clearMessages: () => void;
}

const SessionContext = createContext<SessionContextType | null>(null);

export function SessionProvider({ 
  children,
  initialContext = {} 
}: { 
  children: React.ReactNode;
  initialContext?: Record<string, any>;
}) {
  const [state, dispatch] = useReducer(sessionReducer, {
    messages: [{
      type: 'system',
      content: 'Welcome to AgenticCoder Console! Type /help for available commands.',
    }],
    currentAgent: null,
    context: initialContext,
    history: [],
  });

  const value = useMemo(() => ({
    ...state,
    setCurrentAgent: (agent: string) => dispatch({ type: 'SET_AGENT', agent }),
    addMessage: (message: Message) => dispatch({ type: 'ADD_MESSAGE', message }),
    updateContext: (updates: Record<string, any>) => dispatch({ type: 'UPDATE_CONTEXT', updates }),
    clearMessages: () => dispatch({ type: 'CLEAR_MESSAGES' }),
  }), [state]);

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
}

export function useSession() {
  const context = useContext(SessionContext);
  if (!context) {
    throw new Error('useSession must be used within SessionProvider');
  }
  return context;
}
```

### 4.5 Chat Input Component (`src/console/components/ChatInput.tsx`)

```tsx
import React, { useState } from 'react';
import { Box, Text, useInput } from 'ink';
import TextInput from 'ink-text-input';

interface ChatInputProps {
  onSubmit: (input: string) => void;
  disabled?: boolean;
  placeholder?: string;
}

export function ChatInput({ onSubmit, disabled, placeholder }: ChatInputProps) {
  const [value, setValue] = useState('');
  const [historyIndex, setHistoryIndex] = useState(-1);

  const handleSubmit = () => {
    if (value.trim() && !disabled) {
      onSubmit(value.trim());
      setValue('');
      setHistoryIndex(-1);
    }
  };

  return (
    <Box 
      borderStyle="single" 
      borderColor={disabled ? 'gray' : 'green'}
      paddingX={1}
    >
      <Text color="green">❯ </Text>
      <TextInput
        value={value}
        onChange={setValue}
        onSubmit={handleSubmit}
        placeholder={placeholder}
      />
    </Box>
  );
}
```

### 4.6 Message Bubble Component (`src/console/components/MessageBubble.tsx`)

```tsx
import React from 'react';
import { Box, Text } from 'ink';

interface Message {
  type: 'user' | 'agent' | 'system' | 'error' | 'handoff';
  content: string;
  agent?: string;
  from?: string;
  to?: string;
  timestamp?: string;
}

interface MessageBubbleProps {
  message: Message;
}

export function MessageBubble({ message }: MessageBubbleProps) {
  const formatTime = (timestamp?: string) => {
    if (!timestamp) return '';
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  switch (message.type) {
    case 'user':
      return (
        <Box marginBottom={1}>
          <Text color="gray">{formatTime(message.timestamp)} </Text>
          <Text color="cyan" bold>You</Text>
          {message.agent && <Text color="gray"> → @{message.agent}</Text>}
          <Text>: {message.content}</Text>
        </Box>
      );

    case 'agent':
      return (
        <Box marginBottom={1} flexDirection="column">
          <Box>
            <Text color="gray">{formatTime(message.timestamp)} </Text>
            <Text color="green" bold>@{message.agent}</Text>
            <Text>:</Text>
          </Box>
          <Box paddingLeft={2}>
            <Text wrap="wrap">{message.content}</Text>
          </Box>
        </Box>
      );

    case 'system':
      return (
        <Box marginBottom={1}>
          <Text color="yellow">ℹ {message.content}</Text>
        </Box>
      );

    case 'error':
      return (
        <Box marginBottom={1}>
          <Text color="red">❌ {message.content}</Text>
        </Box>
      );

    case 'handoff':
      return (
        <Box marginBottom={1}>
          <Text color="magenta">
            🔄 Handoff: @{message.from} → @{message.to}
          </Text>
          <Text color="gray"> ({message.content})</Text>
        </Box>
      );

    default:
      return null;
  }
}
```

### 4.7 Agent Selector Component (`src/console/components/AgentSelector.tsx`)

```tsx
import React from 'react';
import { Box, Text, useInput } from 'ink';
import SelectInput from 'ink-select-input';

interface Agent {
  id: string;
  name: string;
  description: string;
}

interface AgentSelectorProps {
  agents: Agent[];
  onSelect: (agent: string) => void;
  onCancel: () => void;
}

export function AgentSelector({ agents, onSelect, onCancel }: AgentSelectorProps) {
  useInput((input, key) => {
    if (key.escape) {
      onCancel();
    }
  });

  const items = agents.map(a => ({
    value: a.name,
    label: `@${a.name}`,
    description: a.description,
  }));

  return (
    <Box
      position="absolute"
      flexDirection="column"
      borderStyle="double"
      borderColor="cyan"
      paddingX={2}
      paddingY={1}
      marginTop={2}
      marginLeft={2}
    >
      <Text bold color="cyan">Select Agent</Text>
      <Text color="gray" dimColor>Press Esc to cancel</Text>
      <Box marginTop={1}>
        <SelectInput
          items={items}
          onSelect={(item) => onSelect(item.value)}
          itemComponent={({ isSelected, label, description }) => (
            <Box>
              <Text color={isSelected ? 'green' : 'white'}>
                {isSelected ? '▸ ' : '  '}
                {label}
              </Text>
              <Text color="gray" dimColor> - {description}</Text>
            </Box>
          )}
        />
      </Box>
    </Box>
  );
}
```

### 4.8 Context Viewer Component (`src/console/components/ContextViewer.tsx`)

```tsx
import React from 'react';
import { Box, Text, useInput } from 'ink';

interface ContextViewerProps {
  context: Record<string, any>;
  onClose: () => void;
}

export function ContextViewer({ context, onClose }: ContextViewerProps) {
  useInput((input, key) => {
    if (key.escape || key.return) {
      onClose();
    }
  });

  const renderValue = (value: any, indent = 0): React.ReactNode => {
    const pad = '  '.repeat(indent);
    
    if (value === null || value === undefined) {
      return <Text color="gray">null</Text>;
    }
    
    if (typeof value === 'object' && !Array.isArray(value)) {
      return (
        <Box flexDirection="column">
          {Object.entries(value).map(([key, val]) => (
            <Box key={key}>
              <Text>{pad}</Text>
              <Text color="cyan">{key}</Text>
              <Text>: </Text>
              {renderValue(val, indent + 1)}
            </Box>
          ))}
        </Box>
      );
    }
    
    if (Array.isArray(value)) {
      return (
        <Box flexDirection="column">
          {value.map((item, index) => (
            <Box key={index}>
              <Text>{pad}</Text>
              <Text color="gray">[{index}] </Text>
              {renderValue(item, indent + 1)}
            </Box>
          ))}
        </Box>
      );
    }
    
    return <Text color="green">{JSON.stringify(value)}</Text>;
  };

  return (
    <Box
      position="absolute"
      flexDirection="column"
      borderStyle="double"
      borderColor="yellow"
      paddingX={2}
      paddingY={1}
      marginTop={2}
      marginLeft={2}
      width="80%"
    >
      <Text bold color="yellow">Current Context</Text>
      <Text color="gray" dimColor>Press Esc or Enter to close</Text>
      <Box marginTop={1} flexDirection="column">
        {Object.keys(context).length === 0 ? (
          <Text color="gray">No context data</Text>
        ) : (
          renderValue(context)
        )}
      </Box>
    </Box>
  );
}
```

---

## 🧪 Testing Strategy

```tsx
// tests/console/ConsoleApp.test.tsx
import React from 'react';
import { render } from 'ink-testing-library';
import { ConsoleApp } from '../../src/console/ConsoleApp';
import { AgentProvider } from '../../src/console/context/AgentContext';
import { SessionProvider } from '../../src/console/context/SessionContext';

describe('ConsoleApp', () => {
  it('should show welcome message', () => {
    const { lastFrame } = render(
      <AgentProvider serverUrl="http://test">
        <SessionProvider>
          <ConsoleApp />
        </SessionProvider>
      </AgentProvider>
    );

    expect(lastFrame()).toContain('Welcome to AgenticCoder Console');
  });

  it('should handle /help command', async () => {
    const { lastFrame, stdin } = render(
      <AgentProvider serverUrl="http://test">
        <SessionProvider>
          <ConsoleApp />
        </SessionProvider>
      </AgentProvider>
    );

    stdin.write('/help\r');

    await new Promise(r => setTimeout(r, 100));

    expect(lastFrame()).toContain('Available commands');
  });

  it('should switch agent with /agent command', async () => {
    const { lastFrame, stdin } = render(
      <AgentProvider serverUrl="http://test">
        <SessionProvider>
          <ConsoleApp />
        </SessionProvider>
      </AgentProvider>
    );

    stdin.write('/agent plan\r');

    await new Promise(r => setTimeout(r, 100));

    expect(lastFrame()).toContain('@plan');
  });
});
```

---

## 📋 Acceptance Criteria

- [ ] `agentic console` launches interactive console
- [ ] `agentic console --agent plan` pre-selects agent
- [ ] @agent mentions work in messages
- [ ] Ctrl+A opens agent selector
- [ ] Ctrl+K shows context viewer
- [ ] /help shows available commands
- [ ] /agents lists all agents
- [ ] Agent responses stream in real-time
- [ ] Handoffs display and auto-switch agent
- [ ] Context persists across agent switches
- [ ] Command history navigable with arrow keys
- [ ] Escape exits cleanly

---

## 🔗 MCP Integration Points

De Agent Console integreert direct met MCP servers:

```typescript
// Direct MCP agent invocation
interface MCPAgentInvocation {
  // Route to appropriate MCP server
  agent: string;
  message: string;
  context: {
    // Filesystem context
    projectPath: string;
    files: string[];
    
    // Git context
    branch: string;
    recentCommits: string[];
    
    // Memory context
    sessionHistory: Message[];
  };
}

// Example: @bicep uses Azure MCP
async function invokeBicepAgent(message: string, context: any) {
  // Connect to Azure MCP for Bicep operations
  const azureMCP = await connectToMCP('azure');
  
  // Get Bicep best practices first
  const practices = await azureMCP.callTool('bestpractices', {
    resource: 'bicep'
  });
  
  // Generate Bicep with context
  return await azureMCP.callTool('bicepschema', {
    intent: message,
    context: { ...context, practices }
  });
}
```

---

## 🔗 Navigation

← [03-PHASE-PROGRESS-DASHBOARD.md](03-PHASE-PROGRESS-DASHBOARD.md) | [05-PHASE-TESTING.md](05-PHASE-TESTING.md) →
