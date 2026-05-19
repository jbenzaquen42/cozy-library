# Agent Rules

- Follow the staged implementation plan in order.
- Keep the app runnable after every stage.
- Do not add database models, Docker, scanning, metadata lookup, 2D house, or 3D house before their stages.
- Prefer simple working implementation over clever abstractions.
- Do not hardcode secrets.
- Keep server-only code out of client components.
- Use scene keys as stable identifiers when location and visual browsing stages begin.
- Update `docs/current-stage.md` before and after each stage.
