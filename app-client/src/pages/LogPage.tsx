import { useState, useEffect } from 'react';

interface ConversationEvent {
  id: string;
  thread_id: string;
  user_id: string;
  created_at: string;
  type: string;
  payload: Record<string, unknown>;
  agent_id: string | null;
  agent_hash: string | null;
}

function LogPage() {
  const [threadIds, setThreadIds] = useState<string[]>([]);
  const [selectedThreadId, setSelectedThreadId] = useState<string>('');
  const [events, setEvents] = useState<ConversationEvent[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(function fetchThreadIds() {
    setLoading(true);
    setError(null);
    fetch('/api/log/threads')
      .then((res) => res.json())
      .then((data: { threadIds: string[] }) => {
        setThreadIds(data.threadIds ?? []);
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to load threads');
        setLoading(false);
      });
  }, []);

  useEffect(
    function fetchEvents() {
      if (!selectedThreadId) {
        setEvents([]);
        return;
      }
      setLoading(true);
      setError(null);
      fetch(`/api/log/events/${encodeURIComponent(selectedThreadId)}`)
        .then((res) => res.json())
        .then((data: { events: ConversationEvent[] }) => {
          setEvents(data.events ?? []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load events');
          setLoading(false);
        });
    },
    [selectedThreadId],
  );

  return (
    <div className="log-page">
      <div className="log-header">
        <h2>Event Log</h2>
        <div className="thread-selector">
          <label htmlFor="thread-select">Thread:</label>
          <select
            id="thread-select"
            value={selectedThreadId}
            onChange={(e) => setSelectedThreadId(e.target.value)}
            disabled={loading}
          >
            <option value="">-- Select thread --</option>
            {threadIds.map((tid) => (
              <option key={tid} value={tid}>
                {tid}
              </option>
            ))}
          </select>
        </div>
      </div>
      {error && <div className="log-error">{error}</div>}
      <div className="log-events">
        {events.length === 0 && !loading && selectedThreadId && (
          <div className="placeholder">No events for this thread</div>
        )}
        {events.map((evt) => (
          <div key={evt.id} className="log-event">
            <div className="log-event-meta">
              <span className="log-event-type">{evt.type}</span>
              <span className="log-event-time">{evt.created_at}</span>
            </div>
            <pre className="log-event-payload">
              {JSON.stringify(evt, null, 2)}
            </pre>
          </div>
        ))}
      </div>
    </div>
  );
}

export default LogPage;
