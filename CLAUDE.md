# jjbits.github.io

Joon's personal journal on **AI and graphics computation** — inference engines,
kernels, renderers, and the measurements behind them. A Hugo site with the
Blowfish theme, published to GitHub Pages at <https://jjbits.github.io/>.
Joon decides what the posts say; this repo is the machinery that publishes them.

## Principles

- Proper fixes only — no monkey patches. Find the root cause before writing
  code; when there are multiple viable approaches, present them and confirm
  before proceeding.
- Never trust memory or prior docs over fresh evidence — verify against the
  actual build output and the live site before asserting "X works".
- Never invent journal content. Post text comes from Joon. Fixing typos,
  formatting, and markup is fine; writing claims, benchmark numbers, or
  opinions on his behalf is not.
- No AI/assistant names or signatures in git commits.

## Writing a post

```bash
hugo new content posts/<slug>/index.md   # page bundle: post + its images together
hugo server -D                           # preview at localhost:1313, drafts included
```

Posts live in `content/posts/<slug>/index.md` as **page bundles**, so figures sit
beside the post and are referenced with plain relative paths (`![alt](plot.png)`).
Set `draft: false` to publish. Push to `main` and Actions deploys.

## Markup rules that bite (verified against the build, 2026-09-04)

- **Math needs the shortcode.** KaTeX CSS/JS only load on pages containing
  `{{< katex >}}`. Add it once, then `$$...$$` (display) and `\(...\)`
  (inline) work. Without it, math renders as raw text with no error.
- **No `cuda` or `ptx` syntax highlighting.** Chroma has no lexer for either and
  falls back to unhighlighted plain text *silently*. Use ` ```cpp ` for CUDA —
  it highlights everything but the `__global__`-style qualifiers.
  `glsl`, `hlsl`, `wgsl`, `metal`, `nasm`, and `gas` all work as-is.
- After changing a fence language or adding math, rebuild and confirm the
  rendered HTML actually contains `class=chroma` / `katex` — both failure modes
  are silent.

## Stack, and what may not change casually

- Hugo **extended** (`brew install hugo`), pinned to `0.165.0` in the deploy
  workflow.
- Blowfish v3.6.0 as a Hugo Module, pinned in `go.mod`/`go.sum`. Blowfish
  supports only a rolling window of the latest 4 Hugo releases, so Hugo and
  Blowfish must be bumped together — see `.design/operations.md`.
- Config is split across `config/_default/*.toml`; these are edited copies of
  Blowfish's stock files, so upstream config changes need manual reconciliation.

## Documentation convention

- `CLAUDE.md` (this file): what the site is, and the rules for working on it.
- `.design/CURRENT_WORK.md`: live status. Read it first each session.
- `.design/status.md`: archive of superseded status and project history.
- `.design/design.md`: settled high-level design.
- `.design/operations.md`: deployment, hosting, and upgrade procedure.
- `.design/index.md`: index of `.design/`.
