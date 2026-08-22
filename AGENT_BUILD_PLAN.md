# Building an AI Agent — 5-Phase Implementation Plan

Based on OpenAI's *"A Practical Guide to Building Agents"*. Covers every concept in the
guide: model selection, tool definitions, instructions/prompt templates, single- and
multi-agent orchestration (manager + decentralized/handoff patterns), guardrails
(relevance, safety, PII, moderation, rules-based, tool safeguards, output validation),
and human-in-the-loop escalation.

Stack assumption: Python + OpenAI Agents SDK (swap for your own framework if needed).

---

## Phase 1 — Foundations: Core Agent Skeleton

Goal: get one working agent with the three core building blocks — Model, Tools, Instructions.

1. **Project setup**
   - Initialize repo, virtualenv, dependencies (`openai-agents`, `pydantic`, `python-dotenv`).
   - Config module for API keys, environment variables.
2. **Model selection strategy**
   - Build with the most capable model first to set a performance baseline.
   - Add a config flag to swap models per-task later (small/fast vs. large/capable).
   - Stub out an evals harness (even a simple pass/fail script) to compare models later.
3. **Define your first agent**
   - Create a single `Agent` with `name`, `instructions`, `tools=[]`.
   - Verify it responds to a basic prompt end-to-end.
4. **Instructions v1**
   - Write baseline instructions from an existing doc/policy/support script.
   - Break instructions into a numbered list of explicit steps (one action per step).
   - Add a prompt template with variables (e.g. `{{user_first_name}}`, `{{user_tenure}}`)
     instead of hardcoding — enables reuse across contexts.
   - (Optional) Use an advanced model to auto-generate instructions from a source
     document using the "expert instruction writer" prompt pattern from the guide.

**Deliverable:** a single agent that takes a user message and returns a sensible reply
using a templated instruction set.

---

## Phase 2 — Tools Layer

Goal: give the agent the ability to fetch context and take action.

1. **Design the tool taxonomy** (per the guide's 3 types):
   - **Data tools** — read-only retrieval (DB queries, CRM lookups, PDF/doc search, web search).
   - **Action tools** — mutating operations (send email/SMS, update CRM record, create ticket).
   - **Orchestration tools** — other agents exposed `as_tool()` (used in Phase 3).
2. **Implement tools with `@function_tool`**
   - Standardized signature: typed inputs, clear docstring/description, deterministic return value.
   - Start with 1 data tool (e.g. `search_web`) and 1 action tool (e.g. `save_results` /
     `send_email`).
3. **Tool hygiene**
   - Keep tool names/descriptions unambiguous — this matters more than raw tool count.
   - Track a tool registry so tools are reusable and discoverable across agents (avoid
     redundant re-definitions).
   - Write a unit test per tool (mock the external system).
4. **Attach tools to the agent**
   - Wire tools into the Phase 1 agent; confirm it selects the correct tool per input.

**Deliverable:** the agent can look things up and take at least one real action, with
each tool independently tested.

---

## Phase 3 — Orchestration Patterns

Goal: scale from one agent to the right level of multi-agent complexity — no further.

1. **Single-agent loop (`Runner.run`)**
   - Implement the run loop: continue until a final-output tool fires, the model replies
     with no tool calls, an error occurs, or max turns is hit.
   - Add turn/step limits as a safety net.
2. **Decide if you actually need multiple agents**
   - Use the guide's two triggers to justify splitting:
     - **Complex logic** — prompt has many if/then/else branches, template is unmanageable.
     - **Tool overload** — many overlapping/similar tools confuse selection even after
       improving names/params/descriptions.
   - If neither applies, stop here and harden the single agent instead.
3. **Manager pattern (agents-as-tools)**
   - Build a central "manager" agent that exposes specialist agents via `.as_tool()`
     (e.g. `spanish_agent`, `french_agent`, `italian_agent` style — translate to your
     domain: e.g. `refund_agent`, `research_agent`, `writing_agent`).
   - Manager retains control and synthesizes specialist outputs into one reply.
4. **Decentralized pattern (agent handoffs)**
   - Build peer agents (e.g. `triage_agent`, `technical_support_agent`,
     `sales_assistant_agent`, `order_management_agent`).
   - Implement handoffs as first-class transfer functions — full control (and
     conversation state) passes to the new agent.
   - Optionally add a handoff back to the originating agent.
5. **Choose per-workflow**: use Manager when one agent must keep talking to the user;
   use Decentralized when specialists should fully take over.

**Deliverable:** a working multi-agent system (manager or decentralized, or both,
depending on your use case) layered on top of the Phase 1–2 single agent.

---

## Phase 4 — Guardrails

Goal: layered defense — no single guardrail is sufficient on its own.

1. **Rules-based protections** (cheapest, do first)
   - Input character limits, blocklist/regex filters for known-bad patterns
     (e.g. prompt-injection strings, SQL injection attempts).
2. **Classifier guardrails** (LLM- or model-based, run as input guardrails)
   - **Relevance classifier** — flag off-topic input.
   - **Safety classifier** — detect jailbreaks / prompt-injection attempts.
   - **Moderation** — call a moderation API for hate speech/harassment/violence.
   - Implement using `@input_guardrail` + `GuardrailFunctionOutput` +
     `tripwire_triggered`, following the `ChurnDetectionOutput`-style pattern from the guide
     (structured `output_type` + boolean flag + reasoning).
3. **PII filter**
   - Vet model *output* before it reaches the user; redact/block unnecessary PII exposure.
4. **Output validation**
   - Brand/tone/content checks on generated responses before sending.
5. **Tool safeguards**
   - Rate every tool low/medium/high risk (read vs. write, reversibility, account
     permissions, financial impact).
   - High-risk tools pause for an extra guardrail check or require human approval
     (wire this into Phase 5).
6. **Wire guardrails into the run loop**
   - Run guardrails concurrently with optimistic execution (agent proceeds; exception
     raised via `GuardrailTripwireTriggered` if a check fails mid-flight).
   - On trip: return a safe fallback message instead of the raw output.
7. **Iterate**
   - Start with data-privacy + content-safety guardrails only.
   - Add new guardrails as real-world edge cases/failures surface.
   - Continuously tune the security ↔ user-experience tradeoff.

**Deliverable:** every input and output path passes through at least one rules-based and
one classifier-based check; high-risk tools are flagged and gated.

---

## Phase 5 — Human-in-the-Loop, Evaluation & Production Readiness

Goal: make the agent safe and measurable to actually ship.

1. **Human intervention triggers**
   - **Failure threshold** — cap retries/attempts; escalate to a human after N failed
     understanding attempts.
   - **High-risk actions** — force human approval for irreversible/sensitive actions
     (cancellations, large refunds, payments) regardless of confidence.
   - Implement an escalation path: pause execution, hand context to a human queue/UI,
     resume or terminate based on human input.
2. **Evaluation harness**
   - Build eval sets per task (retrieval, classification, tool selection, refund
     decisions, etc.).
   - Re-run evals whenever swapping models (validate smaller/cheaper models against the
     capable-model baseline from Phase 1).
   - Track accuracy, cost, and latency together — optimize cost/latency only after
     accuracy targets are met.
3. **Observability & logging**
   - Log every tool call, guardrail trip, handoff, and human escalation for audit and
     debugging.
   - Capture conversation state at each handoff boundary for replay/debugging.
4. **Security hardening beyond guardrails**
   - Authentication/authorization on every tool call.
   - Least-privilege access controls per agent/tool.
   - Standard app-security review (secrets management, dependency scanning).
5. **Staged rollout**
   - Start with a single agent + minimal tools in a limited/shadow environment.
   - Validate with real users, expand tool access and agent count only as confidence grows.
   - Formalize the model-swap and guardrail-tuning loop as an ongoing process, not a
     one-time setup.

**Deliverable:** a production-ready agent with measurable accuracy/cost/latency,
human escalation paths for risky/failed cases, and full audit logging.

---

## Feature Checklist (cross-reference)

- [x] Model selection & baseline-then-optimize strategy (Phase 1, 5)
- [x] Tool definitions: data / action / orchestration types (Phase 2)
- [x] Instructions from existing docs, broken into steps, with edge cases (Phase 1)
- [x] Prompt templates with variables (Phase 1)
- [x] Single-agent run loop (Phase 3)
- [x] Manager (agents-as-tools) pattern (Phase 3)
- [x] Decentralized (handoff) pattern (Phase 3)
- [x] Relevance classifier guardrail (Phase 4)
- [x] Safety classifier guardrail (Phase 4)
- [x] PII filter (Phase 4)
- [x] Moderation guardrail (Phase 4)
- [x] Rules-based protections (regex/blocklist/length limits) (Phase 4)
- [x] Output validation (Phase 4)
- [x] Tool risk ratings & safeguards (Phase 4)
- [x] Human intervention: failure-threshold escalation (Phase 5)
- [x] Human intervention: high-risk action escalation (Phase 5)
- [x] Evals baseline + model swap validation (Phase 1, 5)
- [x] Logging/observability & staged rollout (Phase 5)
