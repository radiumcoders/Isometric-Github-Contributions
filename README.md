<p align="center">
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/header/graph.svg?title=Isometric+GitHub+Contributions&subtitle=Visualize+contribution+history+as+3D+terrain&logo=github&theme=emerald&mode=dark" />
    <img alt="Isometric GitHub Contributions" src="https://shieldcn.dev/header/graph.svg?title=Isometric+GitHub+Contributions&subtitle=Visualize+contribution+history+as+3D+terrain&logo=github&theme=emerald&mode=light" />
  </picture>
</p>

<p align="center">
  Turn any GitHub profile into an interactive 3D isometric terrain — each day is a block, height scales with contributions, and the scene is ready to share or export.
</p>

<p align="center">
  <a href="https://github.com/radiumcoders/Isometric-Github-Contributions">
    <img alt="GitHub stars" src="https://shieldcn.dev/github/stars/radiumcoders/Isometric-Github-Contributions.svg?variant=secondary&theme=emerald" />
  </a>
  <a href="https://github.com/radiumcoders/Isometric-Github-Contributions/commits/main">
    <img alt="Last commit" src="https://shieldcn.dev/github/last-commit/radiumcoders/Isometric-Github-Contributions.svg?variant=secondary&theme=emerald" />
  </a>
  <a href="https://github.com/radiumcoders/Isometric-Github-Contributions/graphs/contributors">
    <img alt="Contributors" src="https://shieldcn.dev/github/contributors/radiumcoders/Isometric-Github-Contributions.svg?variant=secondary&theme=emerald" />
  </a>
  <a href="https://github.com/radiumcoders/Isometric-Github-Contributions/blob/main/README.md">
    <img alt="License" src="https://shieldcn.dev/github/license/radiumcoders/Isometric-Github-Contributions.svg?variant=secondary&theme=emerald" />
  </a>
</p>

<p align="center">
  <a href="https://nextjs.org">
    <img alt="Next.js 16" src="https://shieldcn.dev/badge/Next.js-16-000000.svg?logo=nextdotjs&logoColor=ffffff&variant=branded&size=sm" />
  </a>
  <a href="https://react.dev">
    <img alt="React 19" src="https://shieldcn.dev/badge/React-19-61DAFB.svg?logo=react&logoColor=000000&variant=branded&size=sm" />
  </a>
  <a href="https://www.typescriptlang.org">
    <img alt="TypeScript" src="https://shieldcn.dev/badge/TypeScript-3178C6.svg?logo=typescript&logoColor=ffffff&variant=branded&size=sm" />
  </a>
  <a href="https://threejs.org">
    <img alt="Three.js" src="https://shieldcn.dev/badge/Three.js-000000.svg?logo=threedotjs&logoColor=ffffff&variant=branded&size=sm" />
  </a>
  <a href="https://ui.shadcn.com">
    <img alt="shadcn/ui" src="https://shieldcn.dev/badge/shadcn%2Fui-000000.svg?logo=shadcnui&logoColor=ffffff&variant=branded&size=sm" />
  </a>
</p>

---

## Overview

**Isometric GitHub Contributions** is a Next.js app that fetches a user's public contribution calendar and renders it as a living 3D landscape. Bar height maps directly to daily activity, colors follow GitHub's contribution palette, and the camera can be orbited and zoomed for exploration.

Paste a username, open a shareable profile URL like `/octocat`, inspect streaks and peak days in the sidebar, then export a PNG snapshot — with optional analytics baked in.

## Features

- **3D isometric terrain** — Contribution days become extruded blocks with grow animations, GitHub-accurate colors, and orbit controls.
- **Instant profile lookup** — Accepts usernames or full `github.com/...` profile links.
- **Shareable routes** — Every profile gets a clean URL at `/{username}` for easy sharing.
- **Profile analytics** — Total contributions, active-day rate, streaks, peak day, busiest weekday, and most active month.
- **Image export** — Capture the scene as PNG; optionally overlay analytics in the export.
- **Responsive sidebar** — Collapsible panel on desktop and mobile with search, stats, and actions.
- **Dark-first UI** — Emerald-accented interface built with shadcn/ui and Tailwind CSS.

## Quick start

### Prerequisites

- [Node.js](https://nodejs.org) 20+
- [pnpm](https://pnpm.io) 11+

### Install and run

```bash
git clone https://github.com/radiumcoders/Isometric-Github-Contributions.git
cd Isometric-Github-Contributions
pnpm install
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000), enter a GitHub username, and explore the terrain.

### Environment variables

Create a `.env` file in the project root:

```bash
# Optional — enables the GitHub GraphQL API with higher rate limits.
# Without it, contributions are scraped from the public profile page.
GITHUB_TOKEN=ghp_your_token_here
```

| Variable | Required | Description |
| --- | --- | --- |
| `GITHUB_TOKEN` | No | Personal access token for GitHub GraphQL. Falls back to HTML scraping when unset. |

## Usage

1. **Search** — Type a username (e.g. `torvalds`) or paste a profile URL, then submit.
2. **Navigate** — Drag to rotate the scene, scroll to zoom. Each unit of height equals one contribution.
3. **Share** — Copy the profile link (`/{username}`) from the sidebar.
4. **Export** — Download a PNG of the current view; toggle *Include analytics in image* to add stats to the export.

## shadcn registry

The 3D graph is published as a reusable [shadcn/ui](https://ui.shadcn.com) block from this repository's GitHub registry.

```bash
npx shadcn@latest add radiumcoders/Isometric-Github-Contributions/isometric-contribution-graph
```

Or with the configured namespace:

```bash
npx shadcn@latest add @isometric-github-contributions/isometric-contribution-graph
```

### Basic usage

```tsx
import {
  IsometricContributionGraph,
  generateMockContributions,
} from "@/components/isometric-contribution-graph/isometric-contribution-graph"

export function Demo() {
  const data = generateMockContributions()

  return (
    <IsometricContributionGraph
      data={data}
      showProfilePanel
      profile={{
        username: "octocat",
        name: "The Octocat",
        avatarUrl: "https://github.com/octocat.png",
      }}
    />
  )
}
```

For a lower-level canvas, import `IsometricContributionScene` and pass a `ContributionDay[]` array directly.

## Scripts

| Command | Description |
| --- | --- |
| `pnpm dev` | Start the development server |
| `pnpm build` | Create a production build |
| `pnpm start` | Serve the production build |
| `pnpm lint` | Run ESLint |
| `pnpm typecheck` | Run TypeScript checks |
| `pnpm format` | Format source files with Prettier |

## Tech stack

| Layer | Tools |
| --- | --- |
| Framework | [Next.js 16](https://nextjs.org), [React 19](https://react.dev) |
| 3D | [Three.js](https://threejs.org), [React Three Fiber](https://docs.pmnd.rs/react-three-fiber), [Drei](https://github.com/pmndrs/drei) |
| Styling | [Tailwind CSS 4](https://tailwindcss.com), [shadcn/ui](https://ui.shadcn.com) |
| Data | GitHub GraphQL API (optional) or public contribution HTML |
| State & routing | [nuqs](https://nuqs.dev) for query params, App Router dynamic `[username]` routes |

## Project structure

```text
app/
  page.tsx                  # Landing page with the contribution graph
  [username]/page.tsx       # Shareable profile routes
  api/contributions/        # Server route for fetching contribution data
registry/
  blocks/isometric-contribution-graph/  # shadcn registry source files
components/
  contribution-graph/       # App shell around the registry scene
  profile-analysis.tsx      # Sidebar analytics panel
  search-panel.tsx          # Username search form
  sidebar-menu.tsx          # Collapsible sidebar layout
lib/
  contribution-data.ts      # Colors, levels, and graph configuration
  github.ts                 # GitHub API + HTML fetching
  profile-analysis.ts       # Streak and activity calculations
  share-chart-image.ts      # PNG export composition
```

## Activity

<p align="center">
  <a href="https://github.com/radiumcoders/Isometric-Github-Contributions/issues">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/chart/github/issues/radiumcoders/Isometric-Github-Contributions.svg?theme=emerald&mode=dark&width=720&height=180&border=false&bg=transparent" />
      <img alt="GitHub issues over time" src="https://shieldcn.dev/chart/github/issues/radiumcoders/Isometric-Github-Contributions.svg?theme=emerald&mode=light&width=720&height=180&border=false&bg=transparent" />
    </picture>
  </a>
</p>

## Contributors

<p align="center">
  <a href="https://github.com/radiumcoders/Isometric-Github-Contributions/graphs/contributors">
    <picture>
      <source media="(prefers-color-scheme: dark)" srcset="https://shieldcn.dev/contributors/radiumcoders/Isometric-Github-Contributions.svg?theme=emerald&preset=surface&mode=dark&limit=12" />
      <img alt="Contributors" src="https://shieldcn.dev/contributors/radiumcoders/Isometric-Github-Contributions.svg?theme=emerald&preset=surface&mode=light&limit=12" />
    </picture>
  </a>
</p>

## Acknowledgments

- Contribution data from [GitHub](https://github.com)
- UI components from [shadcn/ui](https://ui.shadcn.com)
- README badges and charts by [shieldcn](https://shieldcn.dev)

---

<p align="center">
  <sub>Built with curiosity — explore any profile, share the terrain, celebrate the grind.</sub>
</p>