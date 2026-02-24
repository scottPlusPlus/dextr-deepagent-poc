import { useState, useEffect } from 'react';

interface ConversationMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
}

function HistoryPage() {
  const [threadIds, setThreadIds] = useState<string[]>([]);
  const [threadId, setThreadId] = useState<string>('');
  const [threadIdInput, setThreadIdInput] = useState<string>('');
  const [messages, setMessages] = useState<ConversationMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(function fetchThreadIds() {
    fetch('/api/log/threads')
      .then((res) => res.json())
      .then((data: { threadIds: string[] }) => {
        setThreadIds(data.threadIds ?? []);
      })
      .catch(() => {});
  }, []);

  function handleLoad() {
    const tid = threadIdInput.trim();
    if (!tid) return;
    setThreadId(tid);
  }

  function handleSelectThread(tid: string) {
    setThreadId(tid);
    setThreadIdInput(tid);
  }

  useEffect(
    function fetchHistory() {
      if (!threadId) {
        setMessages([]);
        return;
      }
      setLoading(true);
      setError(null);
      fetch(`/api/history/${encodeURIComponent(threadId)}`)
        .then((res) => res.json())
        .then((data: { messages: ConversationMessage[] }) => {
          setMessages(data.messages ?? []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load history');
          setLoading(false);
        });
    },
    [threadId],
  );

  return (
    <div className="history-page">
      <div className="history-header">
        <h2>Conversation History</h2>
        <div className="history-input">
          <select
            value=""
            onChange={(e) => {
              const v = e.target.value;
              if (v) handleSelectThread(v);
            }}
          >
            <option value="">-- Select thread --</option>
            {threadIds.map((tid) => (
              <option key={tid} value={tid}>
                {tid}
              </option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Or enter thread_id"
            value={threadIdInput}
            onChange={(e) => setThreadIdInput(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && handleLoad()}
          />
          <button type="button" onClick={handleLoad} disabled={loading}>
            Load
          </button>
        </div>
      </div>
      {error && <div className="history-error">{error}</div>}
      <div className="history-messages">
        {messages.length === 0 && !loading && threadId && (
          <div className="placeholder">No messages for this thread</div>
        )}
        {messages.map((msg, idx) => (
          <div
            key={idx}
            className={`message message-${msg.role}`}
          >
            <span className="message-role">{msg.role}</span>
            <span className="message-content">{msg.content}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export default HistoryPage;
