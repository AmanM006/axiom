# AXIOM — Hackathon Readiness Checklist

## ✅ AMD Hardware Proof
- [x] Qwen2.5-72B running on AMD MI300X (192GB VRAM)
- [x] vLLM 0.17.1 with ROCm 7.2.0 — confirmed healthy
- [x] Model endpoint verified: /v1/models returns Qwen/Qwen2.5-72B-Instruct
- [x] GPU utilization 90% during inference

## ✅ Technical Completeness
- [x] 3 MCP servers running (terminal:8001, logdb:8002, github:8003)
- [x] LangGraph OODA loop: Observe→Hypothesize→Act→Verify
- [x] Real GitHub PR opened autonomously: AmanM006/axiom-demo-service/pull/10
- [x] SSE streaming working end-to-end
- [x] Human-in-the-Loop guardrail implemented
- [x] Supabase RAG for past incident knowledge
- [x] 21 pytest tests passing

## ✅ All 3 Scenarios Working
- [x] db_cascade: resolved in ~87 seconds, PR opened
- [x] memory_leak: RSS unbounded cache identified and fixed
- [x] exception_loop: KeyError validation added and pushed

## ✅ Submission Assets
- [x] GitHub repo: github.com/AmanM006/axiom
- [ ] HF Space deployed under AMD org
- [ ] Demo video recorded (90 seconds)
- [ ] Social posts done (@AIatAMD, @lablab tagged)

## Key Differentiator
Every competitor in this track SUGGESTS fixes.
AXIOM EXECUTES them. Alert → Diagnose → Fix → Commit → PR → Verified.
Zero humans. Under 90 seconds.

## Benchmark Results
| Metric | Human SRE | AXIOM |
|--------|-----------|-------|
| Time to diagnose | 40 min avg | 23 seconds |
| Time to open PR | 2 hours avg | 87 seconds |
| 3am pages needed | Yes | No |
| Model | — | Qwen2.5-72B on AMD MI300X |
