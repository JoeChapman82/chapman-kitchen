let recipes = {};

fetch('../data/recipes/index.json')
  .then(res => res.json())
  .then(index => {
    recipes = index;
    const datalist = document.getElementById('recipe-list');

    Object.entries(index).forEach(([id, entry]) => {
      const option = document.createElement('option');
      option.value = entry.title;
      option.dataset.id = id;
      datalist.appendChild(option);
    });
  });

document.getElementById('search-input').addEventListener('change', function() {
  const selected = this.value;
  const match = Object.entries(recipes).find(([id, entry]) => entry.title === selected);
  if (match) {
    window.location.href = 'recipe.html?id=' + match[0];
  }
});