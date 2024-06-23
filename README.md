## PianoCheat

### Install

1. Install the Node version specified in `package.json`.
2. Install `pnpm` (e.g. `npm install -g pnpm`).
3. Run `pnpm install` in the root directory.

### Development

Window 1: `pnpm run dev`. This watches and builds packages.
Window 2: `pnpm run frontend`. This runs the Next.js frontend.
Window 3: `pnpm run app`. This runs the Electron app which connects to the Next.js app at localhost:3000.
