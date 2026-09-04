# Current Work

_Last updated: 2026-09-04_

## Status

Site is built, styled and live at <https://jjbits.github.io/>. Migrated from
the 2022 GitHub-Pages Jekyll stub to Hugo + Blowfish, deployed by GitHub
Actions on every push to `main`.

**There are no posts.** The site is waiting on Joon for content.

## Waiting on Joon

- Post content — all of it. He dictates every reader-facing word; see the
  first principle in CLAUDE.md.
- Site title and description, still his 2022 wording from the old
  `_config.yml` ("Joon's homepage" / "Bookmark this to keep an eye on my
  project updates!"). These show in the browser tab and in search results.
- Open decision: the brand orange `#F5A623` on "AI Computations" measures
  2.03:1 against the light theme, below the 3:1 needed for large text. Fine in
  dark mode (7.47:1). `#B87400` (3.79:1) keeps the hue and passes. Left as the
  exact brand colour for now, deliberately.

## What exists

- `config/_default/` — tuned for long technical posts: TOC, reading progress,
  code copy button, tags, 10 posts per page.
- Home page: animated wireframe tetrahedron beside the heading, linking home.
  Heading in Chakra Petch Bold, "AI Computations" in brand orange.
- `archetypes/posts.md` — new-post front matter plus the markup gotchas.
- `.github/workflows/deploy.yml` — build + deploy, Hugo pinned to 0.165.0.

## Key context

- Two markup failure modes are **silent**: KaTeX needs the `katex` shortcode on
  the page, and Chroma has no `cuda`/`ptx` lexer (use `cpp`). Both in CLAUDE.md.
- Posts sort by the `date` field and `buildFuture = false`, so a future-dated
  post silently will not publish.
- `layouts/partials/home/profile.html` is the one real theme override and must
  be re-diffed on a Blowfish upgrade — see `.design/operations.md`.
- Hugo and Blowfish versions are coupled and must be bumped together.
- `origin` is SSH, not HTTPS: the `gh` OAuth token lacks `workflow` scope and
  cannot push `.github/workflows/`.
- Record how-it-was-built with `ii commit`; the SessionEnd hook auto-distills
  each session into the recipe.
