// Current planners
fetch('../data/planners/index.json')
  .then(res => res.json())
  .then(weeks => {
    const container = document.getElementById('current-planners');

    const h2 = document.createElement('h2');
    h2.textContent = 'Current Planners';
    container.appendChild(h2);

    const ul = document.createElement('ul');
    weeks.forEach(file => {
      const weekNum = file.replace('week-', '').replace('.json', '');
      const li = document.createElement('li');
      const a = document.createElement('a');
      a.href = 'planner.html?file=../data/planners/' + file;
      a.textContent = 'Week ' + parseInt(weekNum, 10);
      li.appendChild(a);
      ul.appendChild(li);
    });
    container.appendChild(ul);
  });

// Previous planners
fetch('../data/previous-planners/index.json')
  .then(res => res.json())
  .then(index => {
    const container = document.getElementById('planner-groups');

    Object.entries(index).forEach(([groupName, weeks]) => {
      const section = document.createElement('section');
      section.className = 'planner-group';

      const h2 = document.createElement('h2');
      h2.textContent = groupName;
      section.appendChild(h2);

      const ul = document.createElement('ul');
      weeks.forEach(week => {
        const li = document.createElement('li');
        const a = document.createElement('a');
        a.href = 'planner.html?file=../data/previous-planners/' + week.file;
        a.textContent = 'Week ' + week.week;
        li.appendChild(a);
        ul.appendChild(li);
      });
      section.appendChild(ul);

      container.appendChild(section);
    });
  });