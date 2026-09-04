---
title: "Dissecting FreeToken"
date: 2026-09-04T16:22:46-07:00
draft: true
description: ""
summary: ""
tags: []
categories: []
showTableOfContents: true
---

<!--
Delete this block before publishing.

MATH: the page must contain the katex shortcode before any $$...$$ or \(...\),
otherwise KaTeX never loads and the math renders as raw text with no error.

CODE: there is no `cuda` or `ptx` highlighter -- use `cpp` for CUDA.
`glsl`, `hlsl`, `wgsl`, `metal`, `nasm` and `gas` all work.

IMAGES: keep them in this folder next to index.md and link them relatively,
e.g. ![caption](render.png).

Both markup failure modes above are silent -- see CLAUDE.md, "Markup rules that
bite", and check the built HTML if unsure.
-->

[FreeToken](https://github.com/FlashML-org/FreeToken) has quickly attracted a lot of people's attention since its release. I got curious and wanted to understand it better. The following table summarizes the problems it is trying to solve, with the proposed solutions.

| # | Phase | Problem (§2) | Solution (§3) | About |
|---|---|---|---|---|
| 1 | Prefill | Whole expert pool must cross PCIe each prefill; GPU idles waiting | Full-layer double buffering: load layer *l+1* while computing layer *l* | experts |
| 2 | Prefill | Agent context edits invalidate checkpoints → long re-prefill | Semantic anchors: place recurrent-state checkpoints at special-token boundaries (turns, tool calls, thinking blocks) | attention state |
| 3 | Decode | Static expert placement misses most routed traffic | LRU expert cache that follows the router's picks token by token | experts |
| 4 | Decode | Misses go to the CPU, whose RAM bandwidth is too slow | Split misses between PCIe fill (GPU) and in-place CPU execution, run concurrently | experts |
| 5 | Decode | The right PCIe/CPU split differs per machine | Closed-form ratio q* = m · B_P / B_H from two bandwidths measured on the actual machine | experts |
| 6 | Runtime | VRAM budget and KV-vs-expert split change mid-session | Rebuild the expert cache at any scheduler safe point without restart | GPU memory |
| 7 | Runtime | Engine startup is slow and frequent | Load disk → final host layout then pin; skip GPU warmup (first request runs cold) | startup |
