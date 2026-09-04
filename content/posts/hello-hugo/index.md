---
title: "This Journal, and How It Is Built"
date: 2026-09-04
draft: false
description: "What this site is for, and the Hugo + Blowfish pipeline behind it."
summary: "A short note on what this journal covers and the machinery that publishes it."
tags: ["meta", "hugo"]
categories: ["notes"]
showTableOfContents: false
---

{{< katex >}}

This is a journal about **computation** in AI and graphics — inference engines,
kernels, renderers, and the measurements that decide whether any of it was
worth doing. Posts are working notes rather than tutorials.

## The pipeline

The site is [Hugo](https://gohugo.io/) with the
[Blowfish](https://blowfish.page/) theme, pulled in as a Hugo Module. Pushing to
`main` triggers a GitHub Actions run that builds the site and deploys it to
GitHub Pages.

```bash
hugo new content posts/my-post/index.md   # new page bundle
hugo server -D                            # preview, drafts included
git push                                  # Actions builds and deploys
```

## What it has to handle

Three things, since they show up in nearly every post here.

**Code**, with syntax highlighting and a copy button:

```cpp
__global__ void saxpy(int n, float a, const float *x, float *y) {
    int i = blockIdx.x * blockDim.x + threadIdx.x;
    if (i < n) y[i] = a * x[i] + y[i];
}
```

**Math**, rendered by KaTeX — scaled dot-product attention, since it turns up
constantly:

$$
\mathrm{Attention}(Q, K, V) = \mathrm{softmax}\!\left(\frac{QK^{\top}}{\sqrt{d_k}}\right)V
$$

Inline works too: a head of dimension \(d_k = 128\) over a context of
\(n = 8192\) tokens.

**Images**, which live next to the post as a page bundle so a post and its
figures move together.

First real entries to follow.
