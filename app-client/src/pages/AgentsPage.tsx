import { useState, useEffect } from 'react';

interface Agent {
  id: string;
  hash: string;
  name: string;
  config: { systemPrompt: string; toolIds: string[] };
}

type Mode = 'list' | 'add' | 'edit';

function AgentsPage() {
  const [agents, setAgents] = useState<Agent[]>([]);
  const [mode, setMode] = useState<Mode>('list');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [name, setName] = useState('');
  const [configJson, setConfigJson] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(
    function fetchAgents() {
      setLoading(true);
      fetch('/api/agents')
        .then((res) => res.json())
        .then((data: Agent[]) => {
          setAgents(Array.isArray(data) ? data : []);
          setLoading(false);
        })
        .catch((err) => {
          setError(err instanceof Error ? err.message : 'Failed to load agents');
          setLoading(false);
        });
    },
    [mode],
  );

  function validateConfig(): boolean {
    try {
      JSON.parse(configJson);
      return true;
    } catch {
      setError('Invalid JSON in config');
      return false;
    }
  }

  const [agentId, setAgentId] = useState('');

  function handleAdd() {
    setMode('add');
    setEditingId(null);
    setAgentId('');
    setName('');
    setConfigJson('{"systemPrompt":"","toolIds":["get_current_time","word_of_the_day"]}');
    setError(null);
  }

  function handleEdit(agent: Agent) {
    setMode('edit');
    setEditingId(agent.id);
    setAgentId(agent.id);
    setName(agent.name);
    setConfigJson(JSON.stringify(agent.config, null, 2));
    setError(null);
  }

  function handleCancel() {
    setMode('list');
    setEditingId(null);
    setAgentId('');
    setName('');
    setConfigJson('');
    setError(null);
  }

  function handleSaveAdd() {
    if (!validateConfig()) return;
    const idTrimmed = agentId.trim();
    if (!idTrimmed) {
      setError('Agent ID is required');
      return;
    }
    setLoading(true);
    setError(null);
    fetch('/api/agents', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: idTrimmed, name, config: configJson }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d: { message?: string | string[] }) => {
            const msg = Array.isArray(d.message) ? d.message.join(', ') : d.message;
            return Promise.reject(new Error(msg ?? res.statusText));
          });
        }
        setMode('list');
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to create agent');
        setLoading(false);
      });
  }

  function handleSaveEdit() {
    if (!editingId || !validateConfig()) return;
    setLoading(true);
    setError(null);
    fetch(`/api/agents/${encodeURIComponent(editingId)}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, config: configJson }),
    })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d: { message?: string | string[] }) => {
            const msg = Array.isArray(d.message) ? d.message.join(', ') : d.message;
            return Promise.reject(new Error(msg ?? res.statusText));
          });
        }
        setMode('list');
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to update agent');
        setLoading(false);
      });
  }

  function handleDelete(id: string) {
    if (!window.confirm('Delete this agent?')) return;
    setLoading(true);
    setError(null);
    fetch(`/api/agents/${encodeURIComponent(id)}`, { method: 'DELETE' })
      .then((res) => {
        if (!res.ok) {
          return res.json().then((d: { message?: string | string[] }) => {
            const msg = Array.isArray(d.message) ? d.message.join(', ') : d.message;
            return Promise.reject(new Error(msg ?? res.statusText));
          });
        }
        setAgents((prev) => prev.filter((a) => a.id !== id));
        setLoading(false);
      })
      .catch((err) => {
        setError(err instanceof Error ? err.message : 'Failed to delete agent');
        setLoading(false);
      });
  }

  if (mode === 'add' || mode === 'edit') {
    return (
      <div className="agents-page">
        <div className="agents-header">
          <h2>{mode === 'add' ? 'Add Agent' : 'Edit Agent'}</h2>
          <button type="button" onClick={handleCancel} className="agents-cancel-btn">
            Cancel
          </button>
        </div>
        {error && <div className="log-error">{error}</div>}
        <div className="agents-form">
          <div className="agents-form-row">
            <label htmlFor="agent-id">ID</label>
            <input
              id="agent-id"
              type="text"
              value={agentId}
              onChange={(e) => setAgentId(e.target.value)}
              placeholder="e.g. pirate, butler"
              readOnly={mode === 'edit'}
              disabled={mode === 'edit'}
            />
          </div>
          <div className="agents-form-row">
            <label htmlFor="agent-name">Name</label>
            <input
              id="agent-name"
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Agent name"
            />
          </div>
          <div className="agents-form-row">
            <label htmlFor="agent-config">Config (JSON)</label>
            <textarea
              id="agent-config"
              value={configJson}
              onChange={(e) => setConfigJson(e.target.value)}
              rows={12}
              placeholder='{"systemPrompt":"","toolIds":[]}'
            />
          </div>
          <button
            type="button"
            onClick={mode === 'add' ? handleSaveAdd : handleSaveEdit}
            disabled={loading}
            className="agents-save-btn"
          >
            {loading ? 'Saving...' : 'Save'}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="agents-page">
      <div className="agents-header">
        <h2>Agent Registry</h2>
        <button type="button" onClick={handleAdd} className="agents-add-btn" disabled={loading}>
          Add agent
        </button>
      </div>
      {error && <div className="log-error">{error}</div>}
      <div className="agents-list">
        {agents.length === 0 && !loading && (
          <div className="placeholder">No agents. Add one to get started.</div>
        )}
        {agents.map((a) => (
          <div key={a.id} className="agents-list-item">
            <div className="agents-list-info">
              <span className="agents-list-id">{a.id}</span>
              <span className="agents-list-name">{a.name}</span>
            </div>
            <div className="agents-list-actions">
              <button type="button" onClick={() => handleEdit(a)} className="agents-edit-btn">
                Edit
              </button>
              <button type="button" onClick={() => handleDelete(a.id)} className="agents-delete-btn">
                Delete
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default AgentsPage;
