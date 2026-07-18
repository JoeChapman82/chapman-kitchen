const fs = require('fs');
const path = require('path');

const errors = [];

// --- Recipe Index ---
const recipesDir = path.join(__dirname, '..', 'data', 'recipes');
const recipeOutput = path.join(recipesDir, 'index.json');
const recipeIndex = {};

function scanRecipes(dir) {
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      scanRecipes(fullPath);
    } else if (entry.name.endsWith('.json') && entry.name !== 'index.json') {
      const relativePath = path.relative(recipesDir, fullPath);
      const content = JSON.parse(fs.readFileSync(fullPath, 'utf-8'));

      if (!content.id) {
        errors.push('Recipe missing id: ' + relativePath);
        continue;
      }

      if (recipeIndex[content.id]) {
        errors.push('Duplicate recipe id "' + content.id + '" in ' + relativePath + ' (already in ' + recipeIndex[content.id].path + ')');
        continue;
      }

      recipeIndex[content.id] = {
        path: relativePath,
        title: content.title || 'Untitled'
      };
    }
  }
}

scanRecipes(recipesDir);

// --- Planner Index ---
const previousDir = path.join(__dirname, '..', 'data', 'previous-planners');
const plannerOutput = path.join(previousDir, 'index.json');
const plannerIndex = {};

if (fs.existsSync(previousDir)) {
  const groups = fs.readdirSync(previousDir, { withFileTypes: true });

  for (const group of groups) {
    if (!group.isDirectory()) continue;

    const groupPath = path.join(previousDir, group.name);
    const files = fs.readdirSync(groupPath).filter(f => f.endsWith('.json'));

    plannerIndex[group.name] = files.map(f => {
      const content = JSON.parse(fs.readFileSync(path.join(groupPath, f), 'utf-8'));
      return {
        file: group.name + '/' + f,
        week: content.week || f.replace('.json', '')
      };
    });
  }
}

// --- Output ---
if (errors.length > 0) {
  console.error('Errors found:');
  errors.forEach(err => console.error('  - ' + err));
  process.exit(1);
}

fs.writeFileSync(recipeOutput, JSON.stringify(recipeIndex, null, 4) + '\n');
console.log('Built recipe index: ' + Object.keys(recipeIndex).length + ' recipes');

fs.writeFileSync(plannerOutput, JSON.stringify(plannerIndex, null, 4) + '\n');
console.log('Built previous planner index: ' + Object.keys(plannerIndex).length + ' groups');

// --- Current Planner Index ---
const plannersDir = path.join(__dirname, '..', 'data', 'planners');
const currentPlannerOutput = path.join(plannersDir, 'index.json');
const weekFiles = fs.readdirSync(plannersDir)
  .filter(f => f.startsWith('week-') && f.endsWith('.json'))
  .sort();

fs.writeFileSync(currentPlannerOutput, JSON.stringify(weekFiles, null, 4) + '\n');
console.log('Built current planner index: ' + weekFiles.length + ' weeks');