# AXIOM Presentation Assets

## 📹 Video Presentation Script (3 Minutes)

**0:00 - 0:30 | The Hook & Problem**
*(Visual: Developer waking up at 3 AM to an alert, switching to the AXIOM Dashboard showing a sea of red incidents).*
"Modern microservices are too complex to debug under pressure. When an alert fires, SREs waste 40 minutes finding the root cause. Existing AI tools just give suggestions. AXIOM actually fixes it."

**0:30 - 1:45 | The Action (Demo)**
*(Visual: Screen recording of AXIOM running the Cascading DB Failure scenario).*
"Here is AXIOM in action. It detects a database failure. Watch the Reasoning Trace: it uses **SRE-RAG** to query our historical incident memory for the proven fix. 
It hypothesizes a connection pool exhaustion and then performs a **Pre-flight Syntax Validation** on the fix to ensure zero regressions. 
Watch the dashboard—a **Safety Guardrail** pops up. Every dangerous action requires a single-click human approval. AXIOM uses its Terminal and GitHub MCP tools to rewrite the code and push a PR. From alert to resolution in 47 seconds."

**1:45 - 2:30 | The Tech Stack & AMD Hardware**
*(Visual: Architecture Diagram with AMD MI300X logos).*
"How does it do this? Standard RAG bots fail because they lose context. AXIOM is powered by Llama-3.1-70B running on **AMD MI300X via vLLM and ROCm**. The MI300X’s massive 192GB VRAM allows us to hold the *entire* microservice codebase and the 70B model in a single context window natively. No splitting overhead, no inter-card latency. Zero compromises."

**2:30 - 3:00 | Business Value & Outro**
*(Visual: Evaluation Metrics Table).*
"AXIOM reduced our time-to-resolution from 2 hours to 90 seconds, saving an average of $6,500 per incident. It’s an **Enterprise-Ready, Human-in-the-Loop** autonomous SRE. AXIOM: Execution over Suggestion. Thank you."

---

## 📊 Slide Deck Outline (5 Slides)

1. **Title Slide**: AXIOM: Autonomous Infrastructure Repair Agent. (Include your names, Hackathon logo, Track).
2. **The Problem**: Alert fatigue. Passive AI (chatbots) can't solve infrastructure outages. We need execution.
3. **The Solution**: AXIOM's Agentic OODA Loop. **SRE-RAG** for memory, **Pre-flight Validation** for diligence, and **HITL Guardrails** for enterprise safety.
4. **The AMD MI300X Advantage**: 192GB VRAM enables the 'Global Context' pattern—holding 70B models and the entire codebase in one context window.
5. **Impact & Results**: 40 mins vs 47 seconds. Real revenue saved. Safe, autonomous, and hardware-accelerated.
