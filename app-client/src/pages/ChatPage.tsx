import { useState, useEffect, useCallback, useRef } from 'react';
import { useStateWithLocalStorage } from '../hooks/useStateWithLocalStorage';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
}

interface Agent {
  id: string;
  name: string;
}

interface ChatPageProps {
  username: string;
}

function ChatPage(props: ChatPageProps): JSX.Element {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [threadId, setThreadId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [agentsLoading, setAgentsLoading] = useState(true);
  const [selectedAgentId, setSelectedAgentId] = useStateWithLocalStorage<string | null>(
    'dextr-agent-id',
    null,
  );
  const streamedContentRef = useRef('');

  useEffect(
    function fetchAgents() {
      setAgentsLoading(true);
      fetch('/api/agents')
        .then((res) => res.json())
        .then((data: Agent[]) => setAgents(Array.isArray(data) ? data : []))
        .catch(() => setAgents([]))
        .finally(() => setAgentsLoading(false));
    },
    [],
  );

  useEffect(
    function defaultToFirstAgent() {
      if (!agentsLoading && agents.length > 0 && selectedAgentId === null) {
        setSelectedAgentId(agents[0].id);
      }
    },
    [agentsLoading, agents, selectedAgentId],
  );

  const agentId = selectedAgentId ?? undefined;

  function handleNewChat(): void {
    setThreadId(null);
    setMessages([]);
  }

  const sendMessage = useCallback(async () => {
    const text = input.trim();
    if (!text || !props.username || loading) return;

    const userMessage: Message = {
      id: crypto.randomUUID(),
      role: 'user',
      content: text,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setLoading(true);

    const assistantId = crypto.randomUUID();
    const assistantMessage: Message = {
      id: assistantId,
      role: 'assistant',
      content: '',
    };
    setMessages((prev) => [...prev, assistantMessage]);

    streamedContentRef.current = '';

    try {
      const res = await fetch('/api/chat/stream', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userId: props.username,
          ...(threadId && { threadId }),
          message: text,
          agentId: agentId ?? undefined,
        }),
      });
      if (!res.ok || !res.body) {
        throw new Error(res.statusText || 'Stream failed');
      }
      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let buffer = '';
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split('\n');
        buffer = lines.pop() ?? '';
        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const payload = line.slice(6);
            if (payload === '[DONE]') continue;
            try {
              const parsed = JSON.parse(payload) as {
                chunk?: string;
                threadId?: string;
                error?: string;
              };
              if (parsed.error) throw new Error(parsed.error);
              if (parsed.threadId) setThreadId(parsed.threadId);
              if (parsed.chunk) {
                streamedContentRef.current += parsed.chunk;
                const content = streamedContentRef.current;
                setMessages((prev) =>
                  prev.map((m) =>
                    m.id === assistantId ? { ...m, content } : m,
                  ),
                );
              }
            } catch (parseErr) {
              if (parseErr instanceof SyntaxError) continue;
              throw parseErr;
            }
          }
        }
      }
    } catch (err) {
      const errorContent = `Error: ${err instanceof Error ? err.message : 'Failed to send'}`;
      setMessages((prev) =>
        prev.map((m) =>
          m.id === assistantId ? { ...m, content: errorContent } : m,
        ),
      );
    } finally {
      setLoading(false);
    }
  }, [input, props.username, threadId, loading, agentId]);

  return (
    <>
      <div className="chat-header">
        <button type="button" onClick={handleNewChat} className="new-chat-btn">
          New chat
        </button>
        <div className="chat-header-agent-selector">
          <label htmlFor="chat-agent-select">Agent:</label>
          <select
            id="chat-agent-select"
            value={selectedAgentId ?? ''}
            onChange={(e) => {
              const v = e.target.value;
              setSelectedAgentId(v === '' ? null : v);
            }}
            disabled={agentsLoading}
          >
            {agents.length === 0 && <option value="">Default</option>}
            {agents.map((a) => (
              <option key={a.id} value={a.id}>
                {a.name}
              </option>
            ))}
          </select>
        </div>
      </div>
      <div className="messages">
        {messages.length === 0 && (
          <div className="placeholder">Start a conversation</div>
        )}
        {messages.map((m) => (
          <div key={m.id} className={`message message-${m.role}`}>
            <span className="message-role">{m.role}</span>
            <span className="message-content">{m.content}</span>
          </div>
        ))}
      </div>
      <form
        className="input-area"
        onSubmit={(e) => {
          e.preventDefault();
          sendMessage();
        }}
      >
        <input
          type="text"
          placeholder="Type a message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={loading || agentsLoading}
        />
        <button type="submit" disabled={loading || agentsLoading}>
          {loading ? '...' : 'Send'}
        </button>
      </form>
    </>
  );
}

export default ChatPage;
