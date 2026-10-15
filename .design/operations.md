# Operations

## Hosting

- **Live site:** <https://jjbits.github.io/>
- **Repo:** `github.com/jjbits/jjbits.github.io` (public), default branch `main`.
- **Pages build type:** `workflow` (GitHub Actions). *Not* the legacy Jekyll
  builder — the site was migrated off it on 2026-09-04 and `_config.yml` was
  removed. If Pages is ever reset to "Deploy from a branch", the site will
  serve raw repo files instead of the built output.
- **Deploy:** push to `main` → `.github/workflows/deploy.yml` builds and
  publishes. No manual step. `workflow_dispatch` is enabled for re-runs.

## Local development

```bash
brew install hugo        # must be the extended build
hugo server -D           # localhost:1313, drafts included
hugo --gc --minify       # production build into public/
```

Go must be installed — Hugo needs it to resolve the Blowfish module. First
build after a clean checkout downloads the theme (~90 s); CI caches this.

## Upgrading Hugo and Blowfish

These are coupled: **Blowfish supports only a rolling window of the latest four
Hugo releases** (0.162.0–0.165.0 for v3.6.0). Bump them together:

```bash
brew upgrade hugo                 # local
hugo mod get -u                   # theme
hugo --gc --minify                # must build clean before pushing
```

Then update `HUGO_VERSION` in `.github/workflows/deploy.yml` to match the local
version, or CI and local will silently diverge.

## Favicons

Everything in `static/` is a derived asset generated from the tetrahedron mark.
Regenerate rather than editing the PNGs:

```bash
python3 scripts/make-favicons.py     # needs Pillow
```

`layouts/partials/favicons.html` is a supported Blowfish hook, so the theme's
own icons are replaced rather than shadowed.

## Theme overrides

`layouts/partials/home/profile.html` is a copy of the theme's file with a single
edit (the tetrahedron inlined beside the `<h1>`). Diff it after any theme bump
and re-apply that one change:

```bash
BF="$(hugo config | grep -m1 cachedir | cut -d\' -f2)/modules/filecache/modules/pkg/mod/github.com/nunocoracao/blowfish/v3@<version>"
diff -u "$BF/layouts/partials/home/profile.html" layouts/partials/home/profile.html
```

Blowfish's stock config files were copied into `config/_default/` and edited, so
upstream config additions do not arrive automatically. After a major theme bump,
diff against the module cache:

```bash
diff -ru "$(hugo config | grep -m1 cachedir | cut -d\' -f2)/modules/filecache/modules/pkg/mod/github.com/nunocoracao/blowfish/v3@<version>/config/_default" config/_default
```

## Access

- GitHub: `gh` CLI authenticated on the macbook as `jjbits`.
- No secrets in this repo. Pages deploys with the workflow's OIDC token; no PAT
  is stored.

## Updating the GPU atlas page

The atlas is built on ml-engine, in `~/projects/computescope`, by the
computescope session. Its public build drops the "This machine" entry (that
is ml-engine's own GPU), opens on the plain RTX 4090, and carries a header
link back to the blog:

```bash
ssh ml-engine.local 'cd ~/projects/computescope && .venv/bin/python -m computescope.atlas.build_prototype .csx/atlas/gpu-atlas.html --no-this-machine --default-product rtx_4090 --site-link "jjbits=/"'
scp ml-engine.local:~/projects/computescope/.csx/atlas/gpu-atlas.html /tmp/gpu-atlas.html
python3 -I scripts/wrap-atlas.py /tmp/gpu-atlas.html     # writes static/gpu-atlas/index.html
```

The wrapper expects exactly one cdnjs Three.js `<script src>` in the raw
page and fails loudly otherwise; a new Three.js version means vendoring it
under `static/vendor/` (verify against the cdnjs SRI hash) and updating
`LOCAL_SRC` in the script. The badge (`assets/js/gpu-die-badge.js`,
`assets/img/gpu-die-badge.png`) comes from the same project's
`.csx/atlas/`; copy both when it changes. After either update, build and
check the page renders in headless Chrome with software WebGL
(`--use-angle=swiftshader --enable-unsafe-swiftshader`), light and dark.

