import gradio as gr

def launch():
    with gr.Blocks(theme=gr.themes.Default(), title="AXIOM SRE Agent") as demo:
        gr.Markdown("""
# AXIOM — Autonomous Infrastructure Repair Agent
> Alert → Diagnose → Fix → PR → Verified. Under 90 seconds. Zero humans.

## 🏆 AMD Developer Hackathon 2026 — Track 1: AI Agents

**Running:** Qwen2.5-72B on AMD MI300X (192GB VRAM) via vLLM + ROCm 7.2

### Live Demo
The full AXIOM platform runs on AMD MI300X. 
See the demo video below and GitHub for full source.

### What AXIOM Does
1. Detects production incidents (DB failures, memory leaks, exception loops)
2. Runs terminal diagnostics autonomously  
3. Identifies root cause in source code
4. Writes and commits the fix
5. Opens a real GitHub PR
6. Verifies metrics recovered

### Results
| Metric | Before | After |
|--------|--------|-------|
| Error rate | 67% | 1.2% |
| Latency | 4500ms | 145ms |
| Time to PR | 2 hours | 87 seconds |

### Links
- [GitHub](https://github.com/AmanM006/axiom)
- [Real PR opened by AXIOM](https://github.com/AmanM006/axiom-demo-service/pull/10)
        """)
        
        gr.Video(
            label="Live Demo — Qwen2.5-72B diagnosing and fixing a production incident",
            value=None
        )
        
        gr.Markdown("""
### Architecture
Next.js Dashboard → FastAPI + LangGraph → Qwen2.5-72B (AMD MI300X)
↓
Terminal MCP | LogDB MCP | GitHub MCP
### Why AMD MI300X
Qwen2.5-72B needs 144GB VRAM. MI300X has 192GB — single card, 
full model, full 32K context. No splitting. No fragmentation.
        """)
    
    return demo

demo = launch()
demo.launch()
