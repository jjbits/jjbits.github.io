# Current Work

_Last updated: 2026-09-04_

## Status

Pipeline is built, deployed, and verified live. Migrated from the legacy
GitHub-Pages Jekyll stub to Hugo + Blowfish, deployed by GitHub Actions.

The site has **no posts**. It is waiting on Joon for content.

## Waiting on Joon

- Post content — all of it.
- Site title and description. Currently still his 2022 wording from the old
  `_config.yml` ("Joon's homepage" / "Bookmark this to keep an eye on my project
  updates!"), kept verbatim as a placeholder. Do not invent replacements.
- Optional: profile avatar (`assets/img/`), bio text, favicon.

## What exists

- `config/_default/` — site config, tuned for long technical posts: TOC,
  reading progress, code copy button, tags, 10 posts per page.
- `archetypes/posts.md` — new-post front matter plus the markup gotchas.
- `.github/workflows/deploy.yml` — build + deploy, Hugo pinned to 0.165.0.

## Key context

- Two markup failure modes are **silent** and cost real debugging time; both are
  documented in CLAUDE.md: KaTeX needs the `katex` shortcode on the page, and
  Chroma has no `cuda`/`ptx` lexer (use `cpp`).
- Hugo and Blowfish versions are coupled and must be bumped together — see
  `.design/operations.md`.
- `origin` is SSH, not HTTPS: the `gh` OAuth token lacks `workflow` scope and
  cannot push `.github/workflows/`.
- Record how-it-was-built with `ii commit`; the SessionEnd hook auto-distills
  each session into the recipe.
