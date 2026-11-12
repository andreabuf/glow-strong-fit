# Glow Strong Fit — Development Copy

This package preserves the original repository files and adds a new `/dev/` directory copied **without modifications** from `/beta/`.

## Publish
1. Unzip this package.
2. In your GitHub repository, add the two files inside `dev/` at the repository root under a folder named `dev`.
3. Commit the changes to the branch that GitHub Pages deploys.
4. Visit `https://glowfitstrong.com/dev/` after GitHub Pages deploys.

Do not replace `beta/index.html`, `index.html`, or `CNAME`. The beta testers' current URL remains unchanged.

## Caution: shared backend and browser storage
The dev copy is byte-for-byte identical to beta and therefore uses the same Supabase project and authentication. The code also uses localStorage keys that may be shared between `/beta/` and `/dev/` on the same origin. **This is not an isolated test environment.** Changes to account data or workouts in dev may affect the same user's beta data. Use a dedicated test account and avoid destructive tests until separate dev storage and backend safeguards are configured.

## Next
Create shared UI styles and assets based on the approved Home design, then implement My Plan incrementally.
