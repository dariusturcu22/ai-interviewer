# CLAUDE.md

Guidance for Claude Code when working in this repository.

## Commit style
- Conventional commits: `feat:`, `fix:`, `chore:`, `docs:`, `test:`.
- Commit incrementally as work progresses — no single giant commit covering the whole app.
- Every commit made with Claude Code's help keeps a `Co-authored-by: Claude` trailer.

## Branching
- Never commit directly to `main`. Every change goes through a feature branch merged via a
  pull request (self-merged is fine on this solo project). `main` stays protected and clean.

## Secrets
- Never commit secrets. `ANTHROPIC_API_KEY` and `DATABASE_URL` live only in `.env` files,
  which are gitignored. `.env.example` files hold placeholder values only.
