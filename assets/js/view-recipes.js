// let recipes = {};

// fetch('../data/recipes/index.json')
//   .then(res => res.json())
//   .then(index => {
//     recipes = index;
//     const datalist = document.getElementById('recipe-list');

//     Object.entries(index).forEach(([id, entry]) => {
//       const option = document.createElement('option');
//       option.value = entry.title;
//       option.dataset.id = id;
//       datalist.appendChild(option);
//     });
//   });

// document.getElementById('search-input').addEventListener('change', function() {
//   const selected = this.value;
//   const match = Object.entries(recipes).find(([id, entry]) => entry.title === selected);
//   if (match) {
//     window.location.href = 'recipe.html?id=' + match[0];
//   }
// });

let recipes = {};

fetch('../data/recipes/index.json')
  .then(res => res.json())
  .then(index => {
    recipes = index;

    // Populate search autocomplete
    const datalist = document.getElementById('recipe-list');
    Object.entries(index).forEach(([id, entry]) => {
      const option = document.createElement('option');
      option.value = entry.title;
      option.dataset.id = id;
      datalist.appendChild(option);
    });

    // Build folder tree from paths
    const tree = {};
    Object.entries(index).forEach(([id, entry]) => {
      const parts = entry.path.split('/');
      const filename = parts.pop();
      let node = tree;
      parts.forEach(folder => {
        if (!node[folder]) node[folder] = {};
        node = node[folder];
      });
      node['__file_' + id] = { id, title: entry.title };
    });

    // Render tree into the page
    const container = document.getElementById('recipe-tree');
    renderTree(tree, container);
  });

function renderTree(node, parent) {
  // Render folders first, then files
  const folders = [];
  const files = [];

  Object.entries(node).forEach(([key, value]) => {
    if (key.startsWith('__file_')) {
      files.push(value);
    } else {
      folders.push({ name: key, contents: value });
    }
  });

  folders.forEach(folder => {
    const details = document.createElement('details');
    details.className = 'recipe-tree'
    const summary = document.createElement('summary');
    summary.textContent = folder.name;
    details.appendChild(summary);
    renderTree(folder.contents, details);
    parent.appendChild(details);
  });

  files.forEach(file => {
    const a = document.createElement('a');
    a.href = 'recipe.html?id=' + file.id;
    a.textContent = file.title;
    a.className = 'recipe-tree-link';
    parent.appendChild(a);
  });
}

document.getElementById('search-input').addEventListener('change', function() {
  const selected = this.value;
  const match = Object.entries(recipes).find(([id, entry]) => entry.title === selected);
  if (match) {
    window.location.href = 'recipe.html?id=' + match[0];
  }
});