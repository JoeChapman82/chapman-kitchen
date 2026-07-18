const params = new URLSearchParams(window.location.search);
const id = params.get('id');

if (!id) {
  document.getElementById('recipe-error').hidden = false;
} else {
  fetch('../data/recipes/index.json')
    .then(res => res.json())
    .then(index => {
      const entry = index[id];
      if (!entry) {
        document.getElementById('recipe-error').hidden = false;
        return;
      }
      return fetch('../data/recipes/' + entry.path);
    })
    .then(res => res ? res.json() : null)
    .then(recipe => {
      if (recipe) renderRecipe(recipe);
    })
    .catch(() => {
      document.getElementById('recipe-error').hidden = false;
    });
}

function resolve(obj, path) {
  return path.split('.').reduce((o, key) => o && o[key], obj);
}

function renderRecipe(recipe) {
  document.title = recipe.title + ' - Recipe';
  document.getElementById('recipe-content').hidden = false;

  // Text fields
  document.querySelectorAll('[data-field]').forEach(el => {
    const value = resolve(recipe, el.dataset.field);
    if (value !== undefined && value !== null && value !== '') {
      const prefix = el.dataset.prefix || '';
      const suffix = el.dataset.suffix || '';
      if (typeof value === 'boolean') {
        el.textContent = prefix + (value ? 'Yes' : 'No') + suffix;
      } else {
        el.textContent = prefix + value + suffix;
      }
    }
  });

  // List fields
  const template = document.getElementById('list-item-template');
  document.querySelectorAll('[data-list]').forEach(list => {
    let items = resolve(recipe, list.dataset.list);
    if (!items) return;
    if (!Array.isArray(items)) items = [items];
    if (!items.length) return;
    items.forEach(item => {
      const clone = template.content.cloneNode(true);
      clone.querySelector('li').textContent = item;
      list.appendChild(clone);
    });
  });

  // Show sections that have content
  document.querySelectorAll('[data-show-if]').forEach(section => {
    const value = resolve(recipe, section.dataset.showIf);
    if (value && (!Array.isArray(value) || value.length)) {
      section.hidden = false;
    }
  });

  // History (array of {date, note} objects)
  if (recipe.history && recipe.history.length) {
    const list = document.getElementById('recipe-history');
    const template = document.getElementById('list-item-template');
    recipe.history.forEach(entry => {
      if (!entry.date && !entry.note) return;
      const clone = template.content.cloneNode(true);
      clone.querySelector('li').textContent = (entry.date || 'No date') + ' — ' + (entry.note || '');
      list.appendChild(clone);
    });
  }

  // Initialise learn overlay
  initLearn(recipe);
}