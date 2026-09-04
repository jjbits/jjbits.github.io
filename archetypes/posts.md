---
title: "{{ replace .Name "-" " " | title }}"
date: {{ .Date }}
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
