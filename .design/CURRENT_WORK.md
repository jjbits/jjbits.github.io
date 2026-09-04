# Current Work

_Last updated: 2026-09-04_

## Status

Site pipeline is built and verified locally. Migrated from the legacy
GitHub-Pages Jekyll stub to Hugo + Blowfish, deployed by GitHub Actions.

## Next

- **Real content.** Joon supplies what the posts say; the placeholder post
  `content/posts/hello-hugo/` should be replaced or deleted once real entries
  land.
- Optional, only if wanted: profile avatar image (`assets/img/`), custom domain,
  favicon replacing the Blowfish default.

## What exists

- `config/_default/` — site config, tuned for long technical posts: TOC,
  reading progress, code copy button, tags shown, 10 posts per page.
- `content/posts/hello-hugo/` — placeholder post that doubles as a live check
  of code highlighting, KaTeX math, and page-bundle images.
- `archetypes/posts.md` — new-post front matter plus the markup gotchas.
- `.github/workflows/deploy.yml` — build + deploy, Hugo pinned to 0.165.0.

## Key context

- Two markup failure modes are **silent** and cost real debugging time; both are
  documented in CLAUDE.md: KaTeX needs the `katex` shortcode on the page, and
  Chroma has no `cuda`/`ptx` lexer (use `cpp`).
- Hugo and Blowfish versions are coupled and must be bumped together — see
  `.design/operations.md`.
- Record how-it-was-built with `ii commit`; the SessionEnd hook auto-distills
  each session into the recipe.
