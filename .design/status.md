# Status / History

Archive of superseded CURRENT_WORK.md snapshots and detailed project history.
Newest entries first.

## 2026-09-18 — First post published

"Dissecting FreeToken" went live without the Draft badge. Between 2026-09-04
and 2026-09-18 the post grew from the intro paragraph and the
problems-and-solutions table to its final shape:

- A sentence on the machine (Ubuntu, ~250 GB DDR4, one RTX 4090 with 24 GB
  VRAM) and the model (DeepSeek-V4-Flash, 284B parameters, 156 GB on disk).
- The memory-map table: what lives in host RAM and VRAM, with sizes.
- A sentence on throughput (about 19 tok/s, 131k context, single stream).
- The speed-features table: three features with per-step latency with and
  without each.

The two tables were dictated as files in `~/projects/freetoken-from-scratch/temp/`
on ml-engine (`v40-memory-map.md`, `v40-speed-features.md`), fetched over SSH
and pasted verbatim. Only the sentences got spelling and grammar corrections,
each reported back. Joon had one internal milestone label ("at M16") removed
from a table note.

Published by deleting the archetype reminder comment, setting `draft: false`,
and pushing. `buildDrafts = true` stays on, so future drafts still publish
wearing the badge.

## 2026-09-04 — Migrated to Hugo + Blowfish

The repo held a two-commit GitHub Pages stub from September 2022: a README and a
`_config.yml` selecting `jekyll-theme-minimal`, served by the legacy Pages Jekyll
builder.

Rebuilt as a Hugo site for journals on computation in AI:

- Scaffolded from the ii `ii-base` template, then rebased onto the existing
  GitHub history (the template had created an unrelated root commit).
- Hugo extended 0.165.0 installed; Blowfish v3.6.0 added as a Hugo Module.
- Blowfish stock configs copied into `config/_default/` and tuned for long
  technical posts.
- GitHub Actions deploy workflow added; Pages switched from the legacy branch
  build to `workflow`; Jekyll `_config.yml` removed.
- Found and documented two silent markup failures: KaTeX only loads on pages
  containing the `katex` shortcode, and Chroma has no `cuda`/`ptx` lexer, so
  those fences render unhighlighted with no warning.

## 2026-09-04 — Project created

Scaffolded from the ii project template.
