"""
AXIOM Baseline Evaluation — runs all 3 incident scenarios and reports metrics.
"""

import asyncio
import httpx
import json
import time
import sys


API_URL = "http://localhost:8080"
INCIDENTS = ["db_cascade", "memory_leak", "exception_loop"]


async def run_incident(incident_id: str) -> dict:
    """Run a single incident and collect all events."""
    events = []
    start = time.monotonic()

    async with httpx.AsyncClient(timeout=120.0) as client:
        async with client.stream("POST", f"{API_URL}/run/{incident_id}") as resp:
            async for line in resp.aiter_lines():
                if line.startswith("data: "):
                    try:
                        event = json.loads(line[6:])
                        events.append(event)
                        event_type = event.get("type", "unknown")
                        content_preview = event.get("content", "")[:80]
                        print(f"  [{event_type}] {content_preview}")
                    except json.JSONDecodeError:
                        pass

    elapsed = time.monotonic() - start
    resolved = any(e.get("type") == "resolved" for e in events)
    has_pr = any(
        e.get("type") == "result" and e.get("metadata", {}).get("pr_url")
        for e in events
    )
    total_reward = sum(e.get("metadata", {}).get("reward", 0) for e in events)
    total_steps = max((e.get("step", 0) for e in events), default=0)

    return {
        "incident_id": incident_id,
        "elapsed_seconds": round(elapsed, 1),
        "resolved": resolved,
        "has_pr": has_pr,
        "total_reward": round(total_reward, 1),
        "total_steps": total_steps,
        "event_count": len(events),
    }


async def main():
    print("=" * 60)
    print("AXIOM Baseline Evaluation")
    print("=" * 60)

    # Health check
    try:
        async with httpx.AsyncClient(timeout=5.0) as client:
            resp = await client.get(f"{API_URL}/health")
            resp.raise_for_status()
            print(f"Backend health: {resp.json()}")
    except Exception as exc:
        print(f"Backend not reachable: {exc}")
        print("Start AXIOM first: ./run_demo.sh")
        sys.exit(1)

    results = []
    for incident_id in INCIDENTS:
        print(f"\n--- Running: {incident_id} ---")
        result = await run_incident(incident_id)
        results.append(result)
        print(f"  → {result}")

    print("\n" + "=" * 60)
    print("SUMMARY")
    print("=" * 60)
    print(f"{'Incident':<20} {'Time':>8} {'Resolved':>10} {'PR':>5} {'Reward':>8} {'Steps':>7}")
    print("-" * 60)
    for r in results:
        print(
            f"{r['incident_id']:<20} "
            f"{r['elapsed_seconds']:>6.1f}s "
            f"{'✓' if r['resolved'] else '✗':>10} "
            f"{'✓' if r['has_pr'] else '✗':>5} "
            f"{r['total_reward']:>+7.1f} "
            f"{r['total_steps']:>7}"
        )

    all_resolved = all(r["resolved"] for r in results)
    avg_time = sum(r["elapsed_seconds"] for r in results) / len(results)
    print(f"\nAll resolved: {'✓' if all_resolved else '✗'}")
    print(f"Average time: {avg_time:.1f}s")


if __name__ == "__main__":
    asyncio.run(main())
