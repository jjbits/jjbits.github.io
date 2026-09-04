# Design

Settled high-level design. Day-to-day status lives in CURRENT_WORK.md; this
file changes only when a decision settles.

## Vision

A personal journal on computation in AI. Joon writes all content;
the repo exists to publish it with as little friction and as little ongoing
maintenance as possible. The site must handle code, math, and images well,
since those are what the posts contain.

## Architecture

Static site, no backend.

```
content/posts/<slug>/index.md   post + its figures, as a page bundle
config/_default/*.toml          site config (edited copies of Blowfish stock)
archetypes/posts.md             front matter + markup reminders for new posts
.github/workflows/deploy.yml    build on push to main, deploy to Pages
```

Blowfish is consumed as a Hugo Module rather than a git submodule or vendored
copy, so the theme version is pinned in `go.mod`/`go.sum` and updated with an
explicit `hugo mod get -u`.

## Stack

- Hugo extended 0.165.0 (pinned in the deploy workflow).
- Blowfish v3.6.0 (Hugo Module).
- GitHub Actions → GitHub Pages, Pages build type `workflow`.
- Go toolchain, required only to resolve the theme module.

### Decisions

- **Hugo over Jekyll.** The site previously used GitHub's legacy Jekyll builder
  with `jekyll-theme-minimal`. Hugo is a single static binary with no Ruby or
  npm dependency tree to rot, and builds the whole site in ~100 ms.
- **Blowfish over PaperMod.** Chosen for its image-forward list layouts and
  built-in math and figure support, which suit posts carrying plots and
  diagrams.
- **Page bundles over a shared static/ folder.** A post and its figures move,
  rename, and delete together.

## Roadmap

1. ~~Stand up the Hugo + Blowfish pipeline and deploy it.~~
2. Real journal entries, content supplied by Joon.
3. Revisit only if a need appears: custom domain, comments, analytics,
   series/landing pages.
