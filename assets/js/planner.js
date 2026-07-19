// Planner cycle start date (Monday 00:00) — week-01 begins on this date
const PLANNER_START = new Date('2026-07-20T00:00:00');

const plannerParams = new URLSearchParams(window.location.search);
const plannerFileParam = plannerParams.get('file');

if (plannerFileParam) {
  const allowedPrefixes = ['../data/planners/', '../data/previous-planners/'];
  const isAllowed = allowedPrefixes.some(p => plannerFileParam.startsWith(p)) && !plannerFileParam.includes('/../');
  if (isAllowed) {
    loadPlanner(plannerFileParam);
  }
} else {
  fetch('../data/planners/index.json')
    .then(res => res.json())
    .then(weeks => {
      const now = new Date();
      const msPerWeek = 7 * 24 * 60 * 60 * 1000;
      const elapsed = now - PLANNER_START;
      const weekIndex = Math.floor(elapsed / msPerWeek) % weeks.length;
      const currentWeek = weeks[weekIndex < 0 ? 0 : weekIndex];
      loadPlanner('../data/planners/' + currentWeek);
    })
    .catch(() => {
      loadPlanner('../data/planners/week-01.json');
    });
}

function loadPlanner(url) {
  Promise.all([
    fetch(url)
      .then(res => {
        if (!res.ok) throw new Error('Failed to load planner');
        return res.json();
      }),
    fetch('../data/recipes/index.json').then(res => res.json())
  ])
  .then(([plannerData, recipeIndex]) => {
    if (plannerData.week) {
      const label = document.getElementById('week-label');
      label.textContent = 'Week ' + plannerData.week;
      label.setAttribute('aria-label', 'Home - Week ' + plannerData.week);
    }
    positionGrid();
    populateMeals(plannerData.days);
    if (plannerData['nursery-week']) applyNurseryOverlay();
    setupMealOverlay(recipeIndex);
  })
  .catch(() => {
    document.querySelector('.planner-grid').innerHTML = '<div class="cell" style="grid-column:1/-1;grid-row:1/-1;font-size:1.5rem;">Unable to load planner</div>';
  });
}

function positionGrid() {
  const cells = document.querySelectorAll('.planner-grid .cell');
  cells.forEach((cell, i) => {
    const col = (i % 6) + 1;
    const row = Math.floor(i / 6) + 1;
    cell.style.gridColumn = col;
    cell.style.gridRow = row;
  });
}

function populateMeals(days) {
  for (const [day, meals] of Object.entries(days)) {
    for (const [slot, info] of Object.entries(meals)) {
      const cell = document.querySelector('[data-day="' + day + '"][data-slot="' + slot + '"]');
      if (!cell) continue;
      cell.setAttribute('role', 'button');
      cell.setAttribute('tabindex', '0');
      if (info.meal) {
        cell.innerHTML = info.meal.join('<br>-<br>');
        cell.setAttribute('aria-label', info.meal.join(', ') + ' - ' + day + ' ' + slot);
      }
      if (info.recipes && info.recipes.length > 0) {
        cell.dataset.recipes = JSON.stringify(info.recipes);
      }
    }
  }
}

function applyNurseryOverlay() {
  const nurseryDays = ['tuesday', 'wednesday', 'thursday'];
  const nurserySlots = ['morning-snack', 'lunch', 'afternoon-snack'];

  nurseryDays.forEach(day => {
    nurserySlots.forEach(slot => {
      const cell = document.querySelector('[data-day="' + day + '"][data-slot="' + slot + '"]');
      if (cell) cell.style.display = 'none';
    });
  });

  const grid = document.querySelector('.planner-grid');
  const nursery = document.createElement('div');
  nursery.className = 'cell nursery';
  nursery.style.gridColumn = '3 / 6';
  nursery.style.gridRow = '3 / 6';
  const img = document.createElement('img');
  img.src = '../assets/images/nursery.svg';
  img.alt = 'At nursery';
  nursery.appendChild(img);
  grid.appendChild(nursery);
}

function setupMealOverlay(recipeIndex) {
  const mealOverlay = setupOverlay('meal-overlay', 'overlay-close');
  const overlayTitle = document.getElementById('overlay-title');
  const overlayRecipes = document.getElementById('overlay-recipes');
  const template = document.getElementById('recipe-link-template');

  function openOverlay(cell) {
    const mealText = cell.innerText.replace(/\n-\n/g, ', ');
    overlayTitle.textContent = mealText || 'No meal';
    overlayRecipes.innerHTML = '';

    const recipes = cell.dataset.recipes ? JSON.parse(cell.dataset.recipes) : [];

    if (recipes.length === 0) {
      overlayRecipes.innerHTML = '<li class="no-recipes">No recipes linked</li>';
    } else {
      recipes.forEach(function(id) {
        const clone = template.content.cloneNode(true);
        clone.querySelector('a').href = 'recipe.html?id=' + id;
        clone.querySelector('a').textContent = recipeIndex[id].title;
        overlayRecipes.appendChild(clone);
      });
    }

    mealOverlay.open();
  }

  document.querySelectorAll('.planner-grid .meal').forEach(function(cell) {
    cell.addEventListener('click', function() { openOverlay(cell); });
    cell.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' || e.key === ' ') {
        e.preventDefault();
        openOverlay(cell);
      }
    });
  });
}