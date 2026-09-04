# jjbits.github.io

One short paragraph: what this project is, what it produces, and why it
exists. Replace before the first real commit; keep it under six lines.

## Principles

- Proper fixes only — no monkey patches. Find the root cause before writing
  code; when there are multiple viable approaches, present them and confirm
  before proceeding.
- Iterative development with test verification: build in small milestones,
  each with a testing harness and a green suite before moving on.
- Every milestone gets an adversarial code-review pass (a fresh, skeptical
  reviewer); findings are verified and fixed before commit.
- Never trust memory or prior docs over fresh evidence — verify against the
  actual code and real output before asserting "X works".
- No AI/assistant names or signatures in git commits.

## Working rule — model roles & delegation

- The main agent in this session runs on the Fable model and acts as the
  architect: it designs the work, writes the specs, supervises, and reviews
  every subagent result for correctness (diff + tests) before accepting it.
- For mechanical implementations and operations (well-specified,
  low-judgment work: boilerplate, scaffolding, repetitive edits/ports, bulk
  renames, routine builds and test runs), Fable launches Opus subagents
  (model: "opus" on the Agent tool) with a precise spec rather than doing
  them itself.
- Non-mechanical work — design decisions, tricky or novel implementation,
  anything requiring judgment — Fable implements directly, never via
  subagents.
- Before any implementation task, classify it: mechanical → delegate to an
  Opus subagent, then review; non-mechanical → Fable does it.

## Documentation convention

- `CLAUDE.md` (this file): project goal, principles, global info. Keep
  short.
- `.design/CURRENT_WORK.md`: live snapshot of development status. Read it
  first each session; keep it current as work progresses.
- `.design/status.md`: archive of superseded CURRENT_WORK.md content and
  detailed project history.
- `.design/design.md`: settled high-level design (vision, architecture,
  stack, roadmap).
- `.design/operations.md`: operations info (servers, deployment, access).
- `.design/index.md`: index of `.design/` files.
