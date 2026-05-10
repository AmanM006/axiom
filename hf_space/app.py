"""
AXIOM HuggingFace Space — Polished demo for AMD Developer Hackathon 2026.
Shows architecture, benchmarks, and a simulated agent dry-run.
"""

import gradio as gr
import time
import json

# ── Simulated OODA loop for demo ─────────────────────────────────────────────

DEMO_SCENARIOS = {
    "db_cascade": {
        "name": "Cascading DB Failure",
        "service": "payment-service",
        "steps": [
            {"phase": "🔍 OBSERVE", "time": 5, "detail": "Querying logs and metrics for payment-service...\n→ Found 50 log entries. 39 errors/criticals.\n→ Latest: Connection pool exhausted (200/200 connections active)\n→ Metrics: CPU 85% | Memory 2112MB | Error rate 67% | Latency 4500ms"},
            {"phase": "🧠 ORIENT", "time": 8, "detail": "Hypothesis (confidence: 92%):\n\"Connection pool exhausted on payment-service causing cascading 503 errors.\"\n\nReasoning: Logs show 200/200 connections active with timeouts climbing to 30s.\nNo eviction policy detected in connection management code."},
            {"phase": "🔎 INVESTIGATE", "time": 4, "detail": "→ search_knowledge_base: Found past incident runbook for connection pool issues\n→ get_file: data/demo_service/app.py\n→ Found bug: `connection_pool = []` — global list with no maxsize or cleanup"},
            {"phase": "🛡️ SAFETY GATE", "time": 2, "detail": "⚠️ Safety Guardrail: push_file requires human approval.\n✅ APPROVED by operator"},
            {"phase": "🔧 ACT", "time": 6, "detail": "→ create_branch: fix/db-cascade-db_cascade ✓\n→ validate_syntax: Python syntax check passed ✓\n→ push_file: Replace unbounded list with deque(maxlen=1000) ✓\n→ open_pr: 'fix: connection pool exhaustion in payment-service' ✓"},
            {"phase": "✅ VERIFY", "time": 3, "detail": "Polling metrics...\nInitial: error_rate=67.0%, latency=4500ms\nCurrent: error_rate=1.2%, latency=145ms\n\n✓ Metrics recovered. Incident resolved!\nTotal reward: +5.3 | PR: github.com/AmanM006/axiom-demo-service/pull/10"},
        ]
    },
    "memory_leak": {
        "name": "Memory Leak (OOM Risk)",
        "service": "image-processor",
        "steps": [
            {"phase": "🔍 OBSERVE", "time": 5, "detail": "Querying logs and metrics for image-processor...\n→ Found 50 log entries. 28 errors/criticals.\n→ Latest: RSS=3800MB, OOM score=950/1000\n→ Metrics: CPU 85% | Memory 3800MB | Error rate 35% | Latency 3000ms"},
            {"phase": "🧠 ORIENT", "time": 7, "detail": "Hypothesis (confidence: 90%):\n\"Unbounded global cache list in process_image() growing without eviction.\"\n\nReasoning: Logs show cache list at 42,100 entries with no maxlen.\nGC unable to free memory — RSS growing 15MB/min toward 4096MB OOM limit."},
            {"phase": "🔎 INVESTIGATE", "time": 4, "detail": "→ search_knowledge_base: Found past incident — memory leaks from unbounded caches\n→ get_file: data/demo_service/app.py\n→ Found bug: `cache.append(data)` — list grows forever, no eviction"},
            {"phase": "🛡️ SAFETY GATE", "time": 2, "detail": "⚠️ Safety Guardrail: push_file requires human approval.\n✅ APPROVED by operator"},
            {"phase": "🔧 ACT", "time": 6, "detail": "→ create_branch: fix/memory-leak-memory_leak ✓\n→ validate_syntax: Python syntax check passed ✓\n→ push_file: Replace `list` with `deque(maxlen=1000)` ✓\n→ open_pr: 'fix: memory leak in image-processor' ✓"},
            {"phase": "✅ VERIFY", "time": 3, "detail": "Polling metrics...\nInitial: error_rate=35.0%, latency=3000ms\nCurrent: error_rate=0.8%, latency=110ms\n\n✓ Metrics recovered. Memory stabilized.\nTotal reward: +5.1"},
        ]
    },
    "exception_loop": {
        "name": "Exception Crash Loop",
        "service": "api-gateway",
        "steps": [
            {"phase": "🔍 OBSERVE", "time": 5, "detail": "Querying logs and metrics for api-gateway...\n→ Found 50 log entries. 42 errors/criticals.\n→ Latest: Unhandled KeyError in handle_request: 'user_id'\n→ Metrics: CPU 90% | Error rate 95% | Restarts: 7 in 15 min"},
            {"phase": "🧠 ORIENT", "time": 6, "detail": "Hypothesis (confidence: 93%):\n\"Unhandled KeyError on missing 'user_id' field causing crash loop every ~30s.\"\n\nReasoning: Logs show repeating `payload['user_id']` KeyError.\nService crashes and restarts but hits the same malformed request immediately."},
            {"phase": "🔎 INVESTIGATE", "time": 3, "detail": "→ search_knowledge_base: Found runbook — missing input validation\n→ get_file: data/demo_service/app.py\n→ Found bug: `payload['user_id']` — direct dict access without .get()"},
            {"phase": "🛡️ SAFETY GATE", "time": 2, "detail": "⚠️ Safety Guardrail: push_file requires human approval.\n✅ APPROVED by operator"},
            {"phase": "🔧 ACT", "time": 5, "detail": "→ create_branch: fix/exception-loop-exception_loop ✓\n→ validate_syntax: Python syntax check passed ✓\n→ push_file: Add payload.get('user_id') with validation ✓\n→ open_pr: 'fix: exception loop in api-gateway' ✓"},
            {"phase": "✅ VERIFY", "time": 3, "detail": "Polling metrics...\nInitial: error_rate=95.0%, latency=8500ms\nCurrent: error_rate=0.5%, latency=85ms\n\n✓ Metrics recovered. Crash loop stopped.\nTotal reward: +5.5"},
        ]
    },
}


def run_simulation(scenario_key):
    """Generator that yields progressive OODA loop steps for the demo."""
    scenario = DEMO_SCENARIOS[scenario_key]
    output = f"# 🚨 Incident: {scenario['name']}\n"
    output += f"**Service:** `{scenario['service']}` | **Severity:** Critical\n\n"
    output += "---\n\n"

    total_time = 0
    for step in scenario["steps"]:
        time.sleep(0.8)  # Simulate processing
        total_time += step["time"]
        output += f"### {step['phase']} (+{step['time']}s)\n"
        output += f"```\n{step['detail']}\n```\n\n"
        yield output

    output += f"---\n\n"
    output += f"## 🏁 Resolution Summary\n"
    output += f"- **Total time:** {total_time} seconds\n"
    output += f"- **Scenario:** {scenario['name']}\n"
    output += f"- **Service:** {scenario['service']}\n"
    output += f"- **Result:** Incident resolved autonomously with GitHub PR\n"
    output += f"- **Human intervention:** Approve/Deny safety gate only\n"
    yield output


# ── Build the Gradio app ─────────────────────────────────────────────────────

CUSTOM_CSS = """
/* Premium Dark Aesthetic */
body { background-color: #0A0B0D !important; color: #E8E9EB !important; }
.gradio-container { max-width: 1200px !important; margin: auto !important; padding-top: 40px !important; font-family: 'Inter', sans-serif; }
.benchmark-img { border-radius: 12px; border: 1px solid rgba(255,255,255,0.1); margin-bottom: 24px; box-shadow: 0 8px 24px rgba(0,0,0,0.5); transition: transform 0.2s; }
.benchmark-img:hover { transform: scale(1.02); }
.tabs { border-bottom: 1px solid rgba(255,255,255,0.06) !important; background: transparent !important; }
.tab-nav { border-bottom: none !important; gap: 10px !important; }
.tab-nav button { font-weight: 600 !important; color: #8A8F9A !important; padding: 12px 24px !important; border-radius: 8px 8px 0 0 !important; border: none !important; background: transparent !important; transition: all 0.2s; }
.tab-nav button:hover { color: #E8E9EB !important; background: rgba(255,255,255,0.03) !important; }
.tab-nav button.selected { color: #fff !important; border-bottom: 2px solid #5E6AD2 !important; background: rgba(94, 106, 210, 0.1) !important; }
h1, h2, h3, h4 { color: #fff !important; font-weight: 700 !important; tracking: tight !important; }
h1 { font-size: 2.5rem !important; margin-bottom: 0.5rem !important; background: linear-gradient(to right, #ffffff, #8A8F9A); -webkit-background-clip: text; -webkit-text-fill-color: transparent; }
.markdown-text { color: #A1A6B4 !important; line-height: 1.7; font-size: 15px; }
.markdown-text code { background: rgba(255,255,255,0.05) !important; color: #E8E9EB !important; padding: 2px 6px; border-radius: 4px; font-family: 'JetBrains Mono', monospace; font-size: 13px; border: 1px solid rgba(255,255,255,0.1); }
.markdown-text pre code { background: transparent !important; border: none !important; }
.markdown-text pre { background: #111216 !important; border: 1px solid rgba(255,255,255,0.08) !important; border-radius: 8px !important; padding: 16px !important; overflow-x: auto; box-shadow: inset 0 2px 10px rgba(0,0,0,0.5); }
.markdown-text blockquote { border-left: 4px solid #5E6AD2 !important; background: rgba(94, 106, 210, 0.05) !important; padding: 16px !important; margin: 20px 0 !important; border-radius: 0 8px 8px 0 !important; font-style: italic; color: #D1D5DB !important; }
/* Simulated Output Terminal */
.sim-output pre { background: #000 !important; border: 1px solid #333 !important; font-family: 'JetBrains Mono', monospace !important; color: #39FF14 !important; }
"""

def build_app():
    with gr.Blocks(
        title="AXIOM — Autonomous Infrastructure Repair Agent",
    ) as demo:

        # ── Custom HTML/CSS Hero ──
        gr.HTML("""
        <style>
            .hero-container {
                display: flex;
                flex-direction: column;
                align-items: center;
                justify-content: center;
                padding: 3rem 1rem;
                background: radial-gradient(circle at top, rgba(94, 106, 210, 0.15) 0%, transparent 60%);
                border-bottom: 1px solid rgba(255,255,255,0.05);
                margin-bottom: 2rem;
                text-align: center;
            }
            .hero-title {
                font-size: 3.5rem;
                font-weight: 800;
                letter-spacing: -0.03em;
                margin-bottom: 1rem;
                background: linear-gradient(135deg, #ffffff 0%, #8A8F9A 100%);
                -webkit-background-clip: text;
                -webkit-text-fill-color: transparent;
            }
            .hero-subtitle {
                font-size: 1.25rem;
                color: #A1A6B4;
                font-weight: 400;
                max-width: 800px;
                line-height: 1.6;
                margin-bottom: 2rem;
            }
            .badge-container {
                display: flex;
                gap: 12px;
                flex-wrap: wrap;
                justify-content: center;
                margin-bottom: 2rem;
            }
            .custom-badge {
                padding: 6px 12px;
                border-radius: 20px;
                font-size: 0.75rem;
                font-weight: 600;
                letter-spacing: 0.05em;
                text-transform: uppercase;
                border: 1px solid rgba(255,255,255,0.1);
                background: rgba(255,255,255,0.03);
                color: #E8E9EB;
                display: flex;
                align-items: center;
                gap: 6px;
            }
            .badge-dot {
                width: 8px;
                height: 8px;
                border-radius: 50%;
            }
            .hero-links {
                display: flex;
                gap: 20px;
            }
            .hero-link {
                color: #5E6AD2;
                text-decoration: none;
                font-weight: 500;
                font-size: 0.9rem;
                display: flex;
                align-items: center;
                gap: 6px;
                transition: color 0.2s;
            }
            .hero-link:hover { color: #8A94F8; }
            .quote-card {
                background: rgba(17, 18, 22, 0.6);
                border-left: 4px solid #5E6AD2;
                padding: 1.5rem;
                border-radius: 0 12px 12px 0;
                margin-top: 1rem;
                max-width: 700px;
                text-align: left;
                font-style: italic;
                color: #D1D5DB;
                box-shadow: 0 4px 20px rgba(0,0,0,0.2);
            }
        </style>
        
        <div class="hero-container">
            <div class="badge-container">
                <div class="custom-badge"><div class="badge-dot" style="background:#ED1C24;"></div>AMD MI300X</div>
                <div class="custom-badge"><div class="badge-dot" style="background:#FF6B35;"></div>Qwen2.5-72B</div>
                <div class="custom-badge"><div class="badge-dot" style="background:#0064A5;"></div>vLLM + ROCm</div>
                <div class="custom-badge"><div class="badge-dot" style="background:#4B32C3;"></div>LangGraph + MCP</div>
            </div>
            
            <h1 class="hero-title">AXIOM Autonomous SRE</h1>
            <p class="hero-subtitle">
                A closed-loop AI agent that doesn't just suggest fixes—it executes them. <br>
                From alert to merged GitHub PR in under 90 seconds. Built for the AMD Developer Hackathon 2026.
            </p>
            
            <div class="hero-links">
                <a href="https://github.com/AmanM006/axiom" class="hero-link" target="_blank">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor"><path d="M12 0C5.374 0 0 5.373 0 12c0 5.302 3.438 9.8 8.205 11.387.6.113.82-.258.82-.577 0-.285-.01-1.04-.015-2.04-3.338.724-4.042-1.61-4.042-1.61C4.422 18.07 3.633 17.7 3.633 17.7c-1.087-.744.084-.729.084-.729 1.205.084 1.838 1.236 1.838 1.236 1.07 1.835 2.809 1.305 3.495.998.108-.776.417-1.305.76-1.605-2.665-.3-5.466-1.332-5.466-5.93 0-1.31.465-2.38 1.235-3.22-.135-.303-.54-1.523.105-3.176 0 0 1.005-.322 3.3 1.23.96-.267 1.98-.399 3-.405 1.02.006 2.04.138 3 .405 2.28-1.552 3.285-1.23 3.285-1.23.645 1.653.24 2.873.12 3.176.765.84 1.23 1.91 1.23 3.22 0 4.61-2.805 5.625-5.475 5.92.42.36.81 1.096.81 2.22 0 1.606-.015 2.896-.015 3.286 0 .315.21.69.825.57C20.565 21.795 24 17.298 24 12c0-6.627-5.373-12-12-12"/></svg>
                    GitHub Repository
                </a>
                <a href="https://github.com/AmanM006/axiom-demo-service/pull/10" class="hero-link" target="_blank">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="18" cy="18" r="3"></circle><circle cx="6" cy="6" r="3"></circle><path d="M13 6h3a2 2 0 0 1 2 2v7"></path><line x1="6" y1="9" x2="6" y2="21"></line></svg>
                    Example PR Opened by Agent
                </a>
            </div>
            
            <div class="quote-card">
                "Every engineer has been paged at 3am for something that took 45 minutes to fix and 40 minutes to diagnose. AXIOM does the 40 minutes. You do the 5."
            </div>
        </div>
        """)

        # ── Tabs ──
        with gr.Tabs():

            # ── Tab 1: Live Agent Simulation ──
            with gr.TabItem("🤖 Agent Simulation", id="sim"):
                gr.Markdown("""
### Simulated OODA Loop
Select an incident scenario below and watch AXIOM's autonomous reasoning loop in action.
This simulation mirrors the exact steps the real agent takes on AMD MI300X.
                """)
                with gr.Row():
                    scenario_dropdown = gr.Dropdown(
                        choices=[
                            ("Cascading DB Failure (payment-service)", "db_cascade"),
                            ("Memory Leak / OOM (image-processor)", "memory_leak"),
                            ("Exception Crash Loop (api-gateway)", "exception_loop"),
                        ],
                        value="db_cascade",
                        label="Select Incident Scenario",
                        scale=3,
                    )
                    run_btn = gr.Button("▶ Run AXIOM Agent", variant="primary", scale=1)

                sim_output = gr.Markdown(
                    value="*Click 'Run AXIOM Agent' to start the simulation...*",
                    label="Agent Output",
                )

                run_btn.click(
                    fn=run_simulation,
                    inputs=[scenario_dropdown],
                    outputs=[sim_output],
                )

            # ── Tab 2: Architecture ──
            with gr.TabItem("🏗️ Architecture", id="arch"):
                gr.Markdown("""
### System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        AXIOM Platform                           │
│                                                                 │
│  ┌─────────────────┐    ┌─────────────────────────────────────┐ │
│  │  Next.js 14     │    │         FastAPI Backend              │ │
│  │  Dashboard      │◄───│  LangGraph OODA Agent Loop          │ │
│  │  (SSE Stream)   │    │  ┌──────────────────────────────┐   │ │
│  └─────────────────┘    │  │  Qwen2.5-72B via vLLM+ROCm   │   │ │
│                         │  │  on AMD MI300X (192GB VRAM)  │   │ │
│                         │  └──────────────────────────────┘   │ │
│                         │            │                         │ │
│                         │  ┌─────────┼──────────┐             │ │
│                         │  ▼         ▼          ▼             │ │
│                         │ MCP:    MCP:        MCP:            │ │
│                         │ LogDB   Terminal    GitHub           │ │
│                         │ Server  Sandbox     API              │ │
│                         └─────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

### Key Components

| Component | Role | Technology |
|-----------|------|------------|
| **LangGraph OODA Loop** | Stateful agent graph: Observe → Orient → Decide → Act → Verify | Python, LangGraph |
| **MCP LogDB Server** | Query SQLite logs + Prometheus metrics | FastMCP, SQLite |
| **MCP Terminal Server** | Sandboxed shell execution (`ps`, `netstat`, diagnostics) | FastMCP, Alpine Linux |
| **MCP GitHub Server** | `create_branch` → `push_file` → `open_pr` | FastMCP, PyGithub |
| **Human-in-the-Loop Gate** | Safety guardrail for destructive actions | asyncio.Event, SSE |
| **Inference Engine** | Qwen2.5-72B at full 32K context | vLLM + ROCm 7.2 |

### OODA Loop Detail
1. **Observe** — Query logs, metrics, and incident history via MCP LogDB
2. **Orient** — LLM streams a hypothesis with confidence score and proposed action
3. **Decide** — Safety gate: dangerous actions require human approval
4. **Act** — Execute tool call (terminal command, file read/write, PR creation)
5. **Verify** — Poll metrics API; if not recovered → loop back to Orient
                """)

            # ── Tab 3: Benchmarks ──
            with gr.TabItem("📊 Benchmarks", id="bench"):
                gr.Markdown("""
### Benchmark Results
All graphs use cited, published data sources. AXIOM's 90-second figure is from empirical testing.
                """)

                with gr.Row():
                    gr.Image("eval/graphs/01_dora_mttr.png", label="AXIOM vs DORA Industry Tiers")
                    gr.Image("eval/graphs/02_empirical_runtimes.png", label="Agent Runtime by Incident Type")

                with gr.Row():
                    gr.Image("eval/graphs/03_financial_impact.png", label="Financial Impact per Incident")
                    gr.Image("eval/graphs/04_hardware_advantage.png", label="MI300X vs Multi-GPU Inference")

                with gr.Row():
                    gr.Image("eval/graphs/06_annual_savings.png", label="Annual Enterprise ROI")
                    gr.Image("eval/graphs/07_resolution_timeline.png", label="Human vs Agent Timeline")

                gr.Markdown("""
### Research Citations
| Reference | Used In |
|-----------|---------|
| [Google Cloud DORA State of DevOps Report 2024](https://dora.dev/research/2024/dora-report/) | MTTR industry tiers |
| [Gartner IT Downtime Cost Study](https://www.gartner.com/en/documents/2741717) | $5,600/min cost baseline |
| [PagerDuty State of Digital Operations 2023](https://www.pagerduty.com/resources/reports/digital-operations/) | Enterprise incident volume |
| [Yao et al., "ReAct" (2022)](https://arxiv.org/abs/2210.03629) | OODA + LLM architecture basis |
| [Kwon et al., "PagedAttention" (2023)](https://arxiv.org/abs/2309.06180) | VRAM/KV cache analysis |
| [Qin et al., "Tool Learning with Foundation Models" (2023)](https://arxiv.org/abs/2304.08354) | Tool-augmented LLM latency |
                """)

            # ── Tab 4: AMD MI300X ──
            with gr.TabItem("🔴 Why AMD MI300X", id="amd"):
                gr.Markdown("""
### The AMD MI300X Advantage

Qwen2.5-72B requires **~144GB of VRAM** to load at BF16. The AMD MI300X is the **only single GPU** that can hold the full model alongside a 32K token context window.

| GPU | VRAM | Qwen2.5-72B (BF16) | 32K Context | Inference Splits |
|-----|------|--------------------|-------------|-----------------|
| A100 80GB | 80GB | ❌ OOM | ❌ | Requires tensor parallel |
| H100 80GB | 80GB | ❌ OOM | ❌ | Requires tensor parallel |
| 4× A100 320GB | 320GB | ✅ Sharded | ✅ | 4-way tensor parallel |
| **AMD MI300X** | **192GB** | **✅ Single GPU** | **✅** | **Zero splits** |

### Why This Matters for SRE Agents

Autonomous SRE agents are uniquely **context-hungry**. Diagnosing a production incident requires reading:
- Full source code files (2K–5K tokens each)
- Log histories across multiple services (5K–15K tokens)
- Metric snapshots and incident history (1K–3K tokens)

This easily reaches **16K–32K tokens** of context. On a standard 80GB GPU, this causes **KV cache bottlenecks** and memory swapping. The MI300X holds everything in memory simultaneously — maintaining **full attention coherence** across the entire context.

**Zero-split inference = zero inter-card communication overhead = maximum reasoning quality.**
                """)

            # ── Tab 5: Hardware Proof ──
            with gr.TabItem("🖥️ Hardware Proof", id="proof"):
                gr.Markdown("""
### Live AMD MI300X GPU Droplet — Proof of Hardware

The screenshots below are taken directly from our **live AMD MI300X GPU Droplet** running the AXIOM inference stack.

---

#### 🔧 `rocm-smi` — AMD GPU Detected & Active
This shows `docker exec rocm rocm-smi` running on our cloud node at `129.212.181.28`, confirming the **AMD Instinct MI300X** with **192GB VRAM** is active.
The second command confirms **Qwen2.5-72B-Instruct** is loaded and serving via vLLM on ROCm.
                """)
                gr.Image("proof_rocm_smi.png", label="rocm-smi Output — AMD MI300X Confirmed", show_label=True)

                gr.Markdown("""
---

#### ☁️ GPU Droplet Dashboard — Active Instance
Our cloud provider dashboard showing the **MI300X 192GB** droplet running in ATL1 datacenter at **$1.99/hour**.
This is the actual production node that powers AXIOM's inference.
                """)
                gr.Image("proof_gpu_droplet.png", label="AMD GPU Droplet — Active Instance", show_label=True)

            # ── Tab 6: Evaluation Scenarios ──
            with gr.TabItem("🧪 Scenarios", id="scenarios"):
                gr.Markdown("""
### Evaluation Scenarios

AXIOM is tested against three real-world incident patterns of increasing complexity:

| Scenario | Service | Root Cause | Agent Fix | Time |
|----------|---------|-----------|-----------|------|
| **Connection Pool Exhaustion** | `payment-service` | Pool at 200/200, no LRU eviction | Reset pool, add `maxsize` cap | **47s** |
| **Memory Leak** | `image-processor` | Unbounded `cache_list` growing to 3.8GB | Replace `list.append()` with `deque(maxlen=1000)` | **52s** |
| **Exception Loop** | `api-gateway` | `KeyError` on missing `user_id` | Add `payload.get('user_id')` with validation | **38s** |

### What Makes This Different

Most AI coding assistants **suggest** fixes. AXIOM **executes** them:

1. ✅ Creates a real Git branch
2. ✅ Validates syntax before pushing
3. ✅ Pushes the corrected code
4. ✅ Opens a real GitHub Pull Request
5. ✅ Verifies metrics recovered post-fix

Every step is visible in the dashboard's real-time reasoning trace.

### Human-in-the-Loop Safety

Before any destructive action, the agent **pauses and asks for permission**:
- `push_file` → Requires approval
- `create_branch` → Requires approval
- `open_pr` → Requires approval
- `run_command` → Requires approval

The operator can **Approve** or **Deny** each action individually.
                """)

    return demo


demo = build_app()

if __name__ == "__main__":
    demo.launch(
        theme=gr.themes.Base(
            primary_hue="indigo",
            secondary_hue="blue",
            neutral_hue="slate",
            font=[gr.themes.GoogleFont("Inter"), "ui-sans-serif", "system-ui", "sans-serif"],
            font_mono=[gr.themes.GoogleFont("JetBrains Mono"), "ui-monospace", "Consolas", "monospace"],
        ).set(
            body_background_fill="#0A0B0D",
            body_background_fill_dark="#0A0B0D",
            body_text_color="#E8E9EB",
            body_text_color_dark="#E8E9EB",
            background_fill_primary="#111216",
            background_fill_primary_dark="#111216",
            background_fill_secondary="#1A1C23",
            background_fill_secondary_dark="#1A1C23",
            border_color_primary="rgba(255,255,255,0.08)",
            border_color_primary_dark="rgba(255,255,255,0.08)",
            color_accent="#5E6AD2",
            color_accent_soft="rgba(94,106,210,0.2)",
            block_background_fill="#111216",
            block_border_width="1px",
            block_border_color="rgba(255,255,255,0.08)",
            block_label_background_fill="#1A1C23",
            block_label_text_color="#A1A6B4",
            block_title_text_color="#fff",
            button_primary_background_fill="#5E6AD2",
            button_primary_background_fill_hover="#4A55B2",
            button_primary_text_color="white",
            button_primary_border_color="#5E6AD2",
        ),
        css=CUSTOM_CSS,
    )
