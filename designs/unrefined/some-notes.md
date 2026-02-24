We're building an "Agentic Operation System" that helps brick-and-mortar businesses run their businesses.

An "Open Claw for brick and mortar businesses".

It's an AI assistant for the business-owner, but the same "Agentic Framework" should handle communicating with the businesses' staff, customers, etc.

We need:

A service running an "agent" that users can connect to and chat with.  It needs to persist the conversation history over the course of a single, and multiple conversations.  It should have a dynamically, context-sensitive set of skills available / discoverable  (allow it to ex: search something online, query the business' database about staff availability, etc...)

We've broken the types of "skills / tool calls" into a couple categories:

Single Step vs Multi-step
Synchronous vs Asynchronous (meaning the conversation pauses while the agent is gettings something done, vs the agent takes note of a task and commits to "getting it done in the background" and the user does not expect to sit there and wait for it.  (ex it might involve calling a supplier and we don't expect to get an answer for a few hours / days))...

Asynchronous tasks can be kicked off to "sub-agents" running on a separate machine.


We also provide AI-Agents that are customer-facing (the customers of the business) ex a voice front desk receptionist.  One of the things the "main" agent needs to do is submit a "change knowledge base" request, which, after passing evaluation, will deploy a change to how the ai desk receptionist behaves / responds...



## Business Use Cases / Requirements
New hotel can sign up, configure, and go live without Dextr personnel involvement (PLG motion) - for 80% of cases 
Non -tech user must be able to create and configure new customers 
"From now on, you need human approval before approving an upgrade for more than 1 night"
Client can update their notification / escalation settings
Update the KB / SOPs / Workflows by chatting with the AI
Handling of gap nights, upsells 
User can text AI to update description of the website 
"Review intelligence shows rising praise for “quiet atmosphere”; system suggests targeting remote workers in marketing."
"We’ve been full / overbooked for the next few weeks:  turn down the ads.."
"Send a welcome email to every guest at 11am the day of their arrival"


##  Actions / Queries (tools / skills / capability)
Check hotel availablility
Make a reservation
modify a reservation
Send a notification (sms, whatsapp, etc)
Post a new job opening
Check Knowledge Base
Update Knowledge Base
Create an Ad
Browse the internet to find out X



##  "Not Exactly Actions"
"Call and Interview a candidate, and send an email of the summary"
For a new night manager: look at competitor job offers.  Use these as examples, and write a new one that also demonstrates our brand and values, and post on whatever relevant sites you can...
"Please migrate our PMS from Mews to Cloudbeds"
Answer the phone
"Update Knowledge Base" -> does this envoke testing / versioning / deployment?   (perhaps  "record client request to update knowledge base" is a better concept for the action)

## Primitives / First Class Citizens
Actions
Triggers
Workflow / Logic Blocks
Workflow update: automate, testing, version control
SOPs  (ie dynamic System Prompts)
SOPs update: automate, testing, version control
Client-specific / Hotel-specific Test Suites  (management / versioning thereof)
Context-Specific Action-Discovery for Agents
Pre-Prompt Mutation Layer
Pre-Action Security Layer / Policies
Human-approval
Conversation / Longterm Task Lifecycle
Internal Api cost observability
