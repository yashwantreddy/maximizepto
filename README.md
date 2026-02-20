# maximizepto

A strategic PTO planner that helps you build longer vacations by combining leave days, weekends, and holidays.

## Stack

- React 18 + TypeScript
- Vite
- ESLint + Prettier
- Vitest + Testing Library
- Playwright (e2e scaffold)

## Run Locally

```bash
npm install
npm run dev
```

Then open `http://localhost:5173`.

## Scripts

- `npm run dev` - start local dev server
- `npm run build` - type-check and build production assets
- `npm run preview` - preview production build locally
- `npm run typecheck` - run TypeScript checks
- `npm run lint` - run ESLint
- `npm run format` - run Prettier
- `npm run test` - run unit tests
- `npm run e2e` - run Playwright tests

## Project Structure

- `index.html` - Vite HTML entry
- `src/main.tsx` - app bootstrap
- `src/App.tsx` - page composition + planner state
- `src/components/` - UI components (`ControlRail`, `StrategyStudio`, `CalendarCanvas`, `HeroMetrics`)
- `src/lib/` - typed planner/date logic
- `src/data/holidays.ts` - holiday and calendar constants
- `src/test/` - unit test setup and test files
- `legacy/` - archived pre-React static files for reference

## Notes

- Planner state persists in `localStorage` under `pto-planner-state`.
- The app currently targets the 2026 planning year.

## Contributing

See `CONTRIBUTING.md`.

## Code of Conduct

See `CODE_OF_CONDUCT.md`.

## License

MIT (`LICENSE`).
