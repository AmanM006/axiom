---
title: AXIOM — Autonomous Infrastructure Repair Agent
emoji: 🧠
colorFrom: indigo
colorTo: red
sdk: gradio
sdk_version: 6.14.0
python_version: "3.10"
app_file: app.py
pinned: true
license: mit
tags:
  - amd
  - mi300x
  - rocm
  - sre
  - agentic-ai
  - langgraph
  - qwen
  - vllm
  - hackathon
short_description: "Autonomous SRE Agent: Alert to PR in 90s on AMD MI300X"
---

# AXIOM — Autonomous Infrastructure Repair Agent

**AMD Developer Hackathon 2026 — Track 1: AI Agents & Agentic Workflows**

> Alert → Diagnose → Fix → PR → Verified. Under 90 seconds. Zero humans.

## What It Does

AXIOM is a **closed-loop autonomous SRE agent** that resolves production incidents end-to-end:

1. 🔍 **Observes** — Queries logs, metrics, and incident history
2. 🧠 **Reasons** — LLM hypothesizes root cause with confidence scoring
3. 🔧 **Acts** — Creates branches, pushes fixes, opens real GitHub PRs
4. ✅ **Verifies** — Confirms metrics recovered before closing

## Tech Stack

- **Model**: Qwen2.5-72B (full BF16, no quantization)
- **Hardware**: AMD MI300X (192GB VRAM — single GPU, zero splits)
- **Inference**: vLLM + ROCm 7.2
- **Agent Framework**: LangGraph OODA loop + MCP protocol
- **Frontend**: Next.js 14 real-time dashboard
- **Safety**: Human-in-the-Loop approval gates for destructive actions

## Links

- [GitHub Repository](https://github.com/AmanM006/axiom)
- [Example PR opened by AXIOM](https://github.com/AmanM006/axiom-demo-service/pull/10)
