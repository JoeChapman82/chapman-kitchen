# Chapman kitchen

A static meal planner site designed for always-on displays (tablets on walls), also viewable on mobile and desktop. Hosted on GitHub Pages.

## Project Structure

```
assets/css/          - Stylesheets (main.css with CSS variables for theming)
assets/js/           - Client-side JavaScript
assets/icons/        - Favicon (SVG)
assets/images/       - SVG images (nursery, world map)
data/planners/       - Current weekly planner JSON files
data/previous-planners/ - Archived planner sets, grouped by folder
data/recipes/        - Recipe JSON files (can be nested in subfolders)
views/               - HTML pages (planner, recipe, search, previous-planners)
scripts/             - Build/utility scripts
.github/workflows/   - GitHub Actions for automated index builds
```

## Building Indexes

A single script builds all indexes:

```bash
node scripts/build-indexes.js
```

This generates:
- `data/recipes/index.json` — maps recipe IDs to file paths and titles
- `data/previous-planners/index.json` — groups previous planners by folder
- `data/planners/index.json` — lists all current week files

The script validates that:
- Every recipe has an `id` field
- All recipe IDs are unique

If validation fails, the script exits with an error and no indexes are updated.

### Automatic index updates (GitHub Action)

A workflow at `.github/workflows/build-recipe-index.yml` runs automatically on push when files change in `data/recipes/`, `data/previous-planners/`, or `data/planners/` (excluding index files to avoid loops).

It runs the build script and commits the updated indexes if anything changed. If validation fails, the workflow fails and no commit is made.

## Local Development

Run a local server from the project root:

```bash
python3 -m http.server 8000
```

Then open `http://localhost:8000/views/planner.html`.

Files are served fresh on each request — no restart needed when you make changes. Refresh the browser to see updates.

## Planner Rotation

The planner page automatically cycles through the week files in `data/planners/`. The rotation works as follows:

- A start date is hardcoded in `assets/js/planner.js` (`PLANNER_START`). This is the Monday when week-01 first displays.
- The build script generates `data/planners/index.json` — a list of all `week-XX.json` files.
- On load, the JS calculates how many full weeks have passed since the start date, uses modulo against the total number of weeks, and loads the corresponding file.
- When all weeks have been used, it loops back to week-01.
- The rollover happens at midnight on Monday (based on the client's clock).

To change the start date, edit the `PLANNER_START` constant in `assets/js/planner.js`. The date should always be a Monday at 00:00.

## Themes

Three colour themes are available: Default (warm), Olive (icy blues/purples), and Rowan (earthy greens). Selected on the index page, saved to localStorage, and persists across all pages.

## Learn Overlay

Each recipe has a "Learn" button that opens a child-friendly overlay with:
- Country flag (emoji) and origin
- "Say it" button (text-to-speech for the dish name)
- World map with the country highlighted
- Colour-coded cards for facts, skills, and tips (tappable for read-aloud)

Supports both individual countries and continents.