# Dextr: Agentic Operations System — Design WIP

## 1. Vision

An AI-powered operations system for brick-and-mortar businesses — an "Open Claw for brick and mortar." The system acts as an AI assistant for the business owner and uses the same agentic framework to interact with staff, customers, and external systems.

**Scope:** ICP (Ideal Customer Profile) is hospitality, but the system architecture must not be artificially constrained to hospitality. Hospitality-specific skills exist, but that is a skill layer — not an architectural constraint.

---

## 2. Core Architecture

### 2.1 Agent Service

- A chat-capable agent service that users connect to and converse with.
- **Persistence:** Conversation history across a single session and across multiple sessions.
- **Skills:** Context-sensitive, dynamically discoverable skills (e.g., web search, staff availability queries).

### 2.2 Agent Types & Personas

The same architecture/framework runs all agents. Each agent varies by **client** and **who they are facing** — and thus has different SOPs, knowledge base, and available skills.

| Persona | Description |
|---------|-------------|
| **Chief of Staff (CoS)** | Owner-facing "main agent" — the primary AI assistant for the business owner. |
| **Staff-facing** | Agents that interact with staff (same framework, different config). |
| **Guest-facing** | Agents that interact with customers (e.g., voice front-desk receptionist). |

The CoS can submit **knowledge base change requests** that, after evaluation, update how guest-facing (and other) agents behave.

### 2.3 Skill / Tool Taxonomy

| Dimension | Description |
|-----------|-------------|
| **Single-step vs multi-step** | Single-step: one tool call (e.g., user asks question → AI interprets → finds database query → returns/summarizes). Multi-step: multiple tool calls, potentially branching logic (e.g., use tool to look up X, then based on X the agent does Y). |
| **Synchronous vs asynchronous** | Sync: conversation pauses until the agent completes the task. Expected to finish quickly. (not necessarily synchronous from an engineering i/o perspective)  Async: agent accepts the task and works in the background; user does not wait (e.g., supplier callbacks over hours/days). |
| **Sub-agent delegation** | Async tasks may be delegated to sub-agents on separate infrastructure. |

### 2.4 Knowledge Base Change Flow

KB updates involve **automated evals**, **potential human approval**, and **rollbacks**. The action is best framed as "record client request to update knowledge base" — with evaluation and deployment as a separate process.

---

## 3. Business Use Cases

### 3.1 Onboarding & Configuration

- New hotel can sign up, configure, and go live without Dextr personnel (PLG) — for 80% of cases.
- Non-technical users must be able to create and configure new customers.

### 3.2 Policy & Settings

- "From now on, you need human approval before approving an upgrade for more than 1 night."
- Clients can update notification and escalation settings.

### 3.3 Content & Knowledge

- Update KB / SOPs / workflows via chat with the AI.
- User can text the AI to update website descriptions.

### 3.4 Operations

- Handling of gap nights and upsells.
- "Send a welcome email to every guest at 11am the day of their arrival."

### 3.5 Intelligence & Marketing

- "Review intelligence shows rising praise for 'quiet atmosphere'; system suggests targeting remote workers in marketing."
- "We've been full/overbooked for the next few weeks: turn down the ads."

---

## 4. Capabilities (Actions / Queries)

**Atomic actions:** Check availability, make/modify reservation, send notification (SMS, WhatsApp, etc.), post job opening, check/update knowledge base, create ad, browse the internet.

---

## 5. Edge Cases & Open Questions

### 5.1 "Not Exactly Actions"

These appear to be outcomes that may require multiple actions, workflows, or human involvement:

- "Call and interview a candidate, and send an email of the summary"
- "For a new night manager: look at competitor job offers, use as examples, write a new posting that reflects our brand, and post on relevant sites"
- "Please migrate our PMS from Mews to Cloudbeds"
- "Answer the phone"

### 5.2 Knowledge Base Updates

See §2.4 for the flow (automated evals, human approval, rollbacks).

---

## 6. Primitives / First-Class Concepts

| Category | Items |
|----------|-------|
| **Execution** | Actions, Triggers, Workflows / Logic Blocks |
| **Governance** | Pre-prompt mutation layer, Pre-action security layer / policies, Human approval |
| **Lifecycle** | Conversation lifecycle, Long-term task lifecycle |
| **Content** | SOPs (dynamic system prompts), Knowledge base |
| **Change management** | Workflow update (automation, testing, version control), SOP update (same), Client-specific test suites (management, versioning) |
| **Discovery & observability** | Context-specific action discovery for agents, Internal API cost observability |

---

## 7. Open Questions (Consolidated)

1. **Sub-agents:** Is "separate machine" a hard requirement or an implementation detail?
2. **PLG 20%:** What characterizes the 20% of cases that require Dextr personnel?
3. **Integrations:** Which systems are canonical (N8N, Vapi, PMS, etc.) for the initial scope?
4. **"Not exactly actions" (§5.1):** Are these in scope as composable workflows, or out-of-scope for the initial system?

---

*Rules read: `.cursor/rules/cursor-style.mdc`*
