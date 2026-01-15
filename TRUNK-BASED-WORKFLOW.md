# Trunk-based development workflow

This repo uses **trunk-based development**.

## The rules

- **`main` is the trunk** and always deployable.
- Work happens on **short-lived branches** created off `main`.
- Merge via **Pull Request** back into `main`.
- Keep branches small and short (hours/days, not weeks).
- Prefer **squash merge** for a clean history.

## Branch naming

Use one of:

- `feature/<short-topic>`
- `fix/<short-topic>`
- `chore/<short-topic>`
- `docs/<short-topic>`

Examples:

- `feature/mcp-stdio-validation-agent`
- `fix/pricing-filter-escaping`
- `docs/mcp-transport-guide`

## Suggested GitHub branch protection for `main`

In GitHub: Settings → Branches → Add rule for `main`:

- Require a pull request before merging
- Require status checks to pass
- Require conversation resolution
- Restrict who can push directly to `main` (optional)

## Local commands (quick reference)

- Create a branch: `git checkout -b feature/my-change`
- Push branch: `git push -u origin feature/my-change`
- Update from trunk: `git checkout main` then `git pull --ff-only`
