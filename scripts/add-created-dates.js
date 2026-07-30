import { readFileSync, writeFileSync, readdirSync } from 'node:fs';
import { join, relative } from 'node:path';

// Populate metadata.created-by with this value where the field is empty
const CREATED_BY = 'Daddy';

const recipesDir = new URL('../data/recipes', import.meta.url).pathname;

function uuidv7ToDate(id) {
  const hex = id.replace(/-/g, '').slice(0, 12);
  const ms = parseInt(hex, 16);
  return new Date(ms).toISOString().slice(0, 10); // YYYY-MM-DD
}

function scanRecipes(dir) {
  const entries = readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = join(dir, entry.name);

    if (entry.isDirectory()) {
      scanRecipes(fullPath);
      continue;
    }

    if (!entry.name.endsWith('.json') || entry.name === 'index.json') continue;

    const recipe = JSON.parse(readFileSync(fullPath, 'utf-8'));
    const rel = relative(recipesDir, fullPath);

    if (!recipe.id) {
      console.warn(`Skipped (no id): ${rel}`);
      continue;
    }

    let changed = false;

    if (!recipe.metadata) recipe.metadata = {};

    if (!recipe.metadata.created) {
      recipe.metadata.created = uuidv7ToDate(recipe.id);
      changed = true;
    }

    if (!recipe.metadata['created-by']) {
      recipe.metadata['created-by'] = CREATED_BY;
      changed = true;
    }

    if (changed) {
      writeFileSync(fullPath, JSON.stringify(recipe, null, 4) + '\n');
      console.log(`Updated: ${rel}  →  created: ${recipe.metadata.created}`);
    } else {
      console.log(`Skipped (already set): ${rel}`);
    }
  }
}

scanRecipes(recipesDir);
