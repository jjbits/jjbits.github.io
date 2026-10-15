# jjbits.github.io

Joon's personal journal on computation in AI. A Hugo site with the
Blowfish theme, published to GitHub Pages at <https://jjbits.github.io/>.
This repo is the machinery that publishes the site. Joon writes what it says.

## Principles

- **Never write site content. This is the rule that matters most here.**
  Joon dictates every word that a reader sees: post text, titles, summaries,
  taglines, the site description, the bio. Do not draft it, do not fill it with
  placeholders, do not "improve" his wording. If copy is missing, ask — or leave
  it empty. Formatting, markup, and fixing what he wrote are the job; authoring
  is not.
- Proper fixes only — no monkey patches. Find the root cause before writing
  code; when there are multiple viable approaches, present them and confirm
  before proceeding.
- Never trust memory or prior docs over fresh evidence — verify against the
  actual build output and the live site before asserting "X works".
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

## Header logo animation

The header mark is a wireframe tetrahedron derived from the Ultimate Machine
logo (`assets/img/ultimate-machine_logo.svg`), spinning about its own centre.

- `assets/img/tetra-logo.svg` — the mark. Blowfish inlines SVG logos verbatim
  into the header, so this file *is* the DOM the script animates. Its static
  coordinates are the original logo pose, used as the no-JS and
  reduced-motion fallback. Keep the `data-e` / `data-v` attributes.
- `assets/js/tetra-logo.js` — the animation. Loaded via `extend-head.html`.
- `assets/css/custom.css` — sizing, and lifting the vertex dots in dark mode.

Three details that are easy to break:

- **Uniform random axis.** Normalising three uniform samples is *not* uniform
  on a sphere — it clusters toward the cube's corners. The code samples
  `z ~ U(-1,1)` and the azimuth independently (Archimedes' hat-box theorem).
- **Hidden edges are computed, not fixed.** An edge is dashed when both faces
  meeting along it face away, which reduces to: both vertices the edge does
  not touch have `z >= 0`. Verified against a normal-based method over 200k
  orientations.
- **Orientation is a quaternion**, not Euler angles, so a long-running tab
  cannot drift or hit gimbal lock.

Regression tests are not in the repo; they live in the session scratchpad.
If you change this code, re-verify: rigid rotation, unit quaternion, hidden
edge count always 0/1/3, and reduced-motion still bailing out.

## GPU atlas page and the home-page button

The GPU architecture atlas is computescope's work (ml-engine,
`~/projects/computescope`, `computescope/atlas/`); this site only hosts it.

- `static/gpu-atlas/index.html` — the atlas, wrapped as a standalone page by
  `scripts/wrap-atlas.py`. **Generated: never hand-edit.** The wrapper adds
  the document skeleton, the favicon, the host's body reset, a one-line
  script that carries the blog's remembered appearance into the page, and
  points the one `<script src>` at the vendored Three.js. Update procedure
  in `.design/operations.md`.
- `static/vendor/three-0.160.0/` — Three.js UMD plus its MIT licence,
  verified against the cdnjs SRI hash when vendored. Used by the atlas page
  and the badge. The UMD build logs a deprecation warning on load; harmless.
- `assets/js/gpu-die-badge.js`, `assets/img/gpu-die-badge.png` — the
  RTX 4090 die, from the same project, running a seeded 8 s "kernel" loop
  (PCIe pulse, memory and L2 load, a wavefront across the GPCs with blocks
  flickering as warps retire, store, idle) in a fixed pose, and a PNG of
  its mid-compute pose for no-JS, no-WebGL and reduced-motion readers. `assets/js/gpu-badge-mount.js` mounts it
  into the home page and follows Blowfish's `.dark` class. Markup is the
  second edit in `layouts/partials/home/profile.html`; sizing and the
  fallback swap are in `custom.css`. Scripts load deferred, home page only.
- The badge honours `prefers-reduced-motion` (static pose) and stops its
  loop off-screen; both live inside the badge script, not here.

## Theme extension points used

Mostly supported hooks, which a theme upgrade should not conflict with:

- `layouts/partials/extend-head.html` — called by the theme if present. Note
  its context is `.Site`, not a Page (`partialCached "extend-head.html" .Site`).
- `assets/css/custom.css` — auto-appended to the theme's CSS bundle.

**One real override**, which upstream changes *can* silently break:

- `layouts/partials/home/profile.html` — a verbatim copy of the theme's file
  with two edits inside `<header>`: the tetrahedron inlined beside the
  `<h1>`, and the GPU atlas button above the heading row. On a Blowfish
  upgrade, diff it against the module copy and re-apply those two changes,
  or the home page will quietly miss upstream fixes. Command in
  `.design/operations.md`.

Note `params.logo` is deliberately unset — setting it puts a logo back in the
top-left nav, which is not where this one belongs.

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
