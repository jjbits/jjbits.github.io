# Status / History

Archive of superseded CURRENT_WORK.md snapshots and detailed project history.
Newest entries first.

## 2026-09-04 — Migrated to Hugo + Blowfish

The repo held a two-commit GitHub Pages stub from September 2022: a README and a
`_config.yml` selecting `jekyll-theme-minimal`, served by the legacy Pages Jekyll
builder.

Rebuilt as a Hugo site for AI/graphics-computation journals:

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
