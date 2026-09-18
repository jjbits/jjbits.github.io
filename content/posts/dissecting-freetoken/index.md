---
title: "Dissecting FreeToken"
date: 2026-09-04T16:22:46-07:00
draft: false
description: "The problems FreeToken solves and how, plus the memory map and speed of running DeepSeek-V4-Flash on a single RTX 4090."
summary: "The problems FreeToken solves and how, plus the memory map and speed of running DeepSeek-V4-Flash on a single RTX 4090."
tags: ["FreeToken", "DeepSeek-V4-Flash", "MoE"]
categories: ["LLM Serving"]
showTableOfContents: true
---

[FreeToken](https://github.com/FlashML-org/FreeToken) has quickly attracted a lot of people's attention since its release. I got curious and wanted to understand it better. The following table summarizes the problems it is trying to solve, with the proposed solutions.

| # | Phase | Problem | Solution | About |
|---|---|---|---|---|
| 1 | Prefill | Whole expert pool must cross PCIe each prefill; GPU idles waiting | Full-layer double buffering: load layer *l+1* while computing layer *l* | experts |
| 2 | Prefill | Agent context edits invalidate checkpoints → long re-prefill | Semantic anchors: place recurrent-state checkpoints at special-token boundaries (turns, tool calls, thinking blocks) | attention state |
| 3 | Decode | Static expert placement misses most routed traffic | LRU expert cache that follows the router's picks token by token | experts |
| 4 | Decode | Misses go to the CPU, whose RAM bandwidth is too slow | Split misses between PCIe fill (GPU) and in-place CPU execution, run concurrently | experts |
| 5 | Decode | The right PCIe/CPU split differs per machine | Closed-form ratio q* = m · B_P / B_H from two bandwidths measured on the actual machine | experts |
| 6 | Runtime | VRAM budget and KV-vs-expert split change mid-session | Rebuild the expert cache at any scheduler safe point without restart | GPU memory |
| 7 | Runtime | Engine startup is slow and frequent | Load disk → final host layout then pin; skip GPU warmup (first request runs cold) | startup |

I have an Ubuntu machine with about 250 GB of DDR4 memory and a solo RTX 4090 card with 24 GB VRAM. Using FreeToken, I ran DeepSeek-V4-Flash, which is a 284-billion-parameter model with a file size of 156 GB.

| Memory | Capacity | What goes there | Size | Notes |
|---|---|---|---|---|
| Host RAM | 251 GB | All routed experts, 43 layers × 256, in pinned banks | 147 GB | The source of truth. Never changes. The CPU computes misses directly from here |
| Host RAM | | Embedding table, pinned | 1 GB | Gathered over PCIe per token, moved off the GPU |
| Host RAM | | Engine process, API process, oracle when testing | a few GB | |
| VRAM | 24 GB | Non-expert weights: attention, dense MLP, router, output head | 9.6 GB | Resident for the whole run |
| VRAM | | Expert cache, 512 to 578 slots of one full expert each | 6.4 GB | 5 percent of the pool. LRU, refilled over PCIe as tokens route. Also serves as the two prefill buffers |
| VRAM | | KV cache pages for the context window | 1 to 2 GB | Paged, radix-shared across turns |
| VRAM | | Captured CUDA graphs, one per batch size | under 1 GB | Replayed each decode step |
| VRAM | | Prefill activations for one chunk | 1 to 3 GB | Sized to what is left after the above |
| VRAM | | Free headroom | 2.7 to 4.7 GB | |

Impressively, the DeepSeek-V4-Flash model runs about 19 tok/s with a 131k context window for a single stream on this machine. The majority of the performance gain comes from the following:

| # | Feature | What it does | Without it | With it |
|---|---|---|---|---|
| 1 | CUDA-graph decode step | Records the 12,000 GPU operations of one token once, then replays them as a single command per token, so the CPU never has to step in between layers | 126 to 328 ms/step | 59 ms/step |
| 2 | CPU co-execution of misses | Misses are split by measured bandwidth between a PCIe copy into the cache and direct CPU compute from RAM, both running at once | 114 ms/step | 59 ms/step |
| 3 | Global LRU expert cache | Recently routed experts stay in the 512-slot VRAM cache across all layers | 77 ms/step | 59 ms/step |
