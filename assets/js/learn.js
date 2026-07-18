// Country name to ISO 3166-1 alpha-2 code mapping
const countryCodes = {
  'south korea': 'KR', 'japan': 'JP', 'china': 'CN', 'india': 'IN',
  'italy': 'IT', 'france': 'FR', 'mexico': 'MX', 'thailand': 'TH',
  'greece': 'GR', 'spain': 'ES', 'morocco': 'MA', 'turkey': 'TR',
  'vietnam': 'VN', 'united kingdom': 'GB', 'usa': 'US', 'united states': 'US',
  'lebanon': 'LB', 'ethiopia': 'ET', 'jamaica': 'JM', 'brazil': 'BR',
  'nigeria': 'NG', 'germany': 'DE', 'portugal': 'PT', 'peru': 'PE',
  'argentina': 'AR', 'egypt': 'EG', 'kenya': 'KE', 'australia': 'AU',
  'indonesia': 'ID', 'malaysia': 'MY', 'pakistan': 'PK', 'sweden': 'SE',
  'norway': 'NO', 'poland': 'PL', 'russia': 'RU', 'new zealand': 'NZ',
  'philippines': 'PH', 'sri lanka': 'LK', 'bangladesh': 'BD', 'nepal': 'NP',
  'iran': 'IR', 'iraq': 'IQ', 'colombia': 'CO', 'chile': 'CL',
  'cuba': 'CU', 'singapore': 'SG', 'taiwan': 'TW', 'cambodia': 'KH',
  'hungary': 'HU', 'austria': 'AT', 'switzerland': 'CH', 'netherlands': 'NL',
  'belgium': 'BE', 'ireland': 'IE', 'denmark': 'DK', 'finland': 'FI'
};

// Continent to country code mappings
const continentCodes = {
  'africa': ['DZ','AO','BJ','BW','BF','BI','CM','CV','CF','TD','KM','CG','CD','CI','DJ','EG','GQ','ER','ET','GA','GM','GH','GN','GW','KE','LS','LR','LY','MG','MW','ML','MR','MU','MA','MZ','NA','NE','NG','RW','ST','SN','SC','SL','SO','ZA','SS','SD','SZ','TZ','TG','TN','UG','ZM','ZW'],
  'europe': ['AL','AD','AT','BY','BE','BA','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IS','IE','IT','LV','LI','LT','LU','MT','MD','MC','ME','NL','MK','NO','PL','PT','RO','RU','SM','RS','SK','SI','ES','SE','CH','UA','GB'],
  'asia': ['AF','AM','AZ','BH','BD','BT','BN','KH','CN','GE','IN','ID','IR','IQ','IL','JP','JO','KZ','KW','KG','LA','LB','MY','MV','MN','MM','NP','KP','OM','PK','PH','QA','SA','SG','KR','LK','SY','TW','TJ','TH','TL','TR','TM','AE','UZ','VN','YE'],
  'north america': ['AG','BS','BB','BZ','CA','CR','CU','DM','DO','SV','GD','GT','HT','HN','JM','MX','NI','PA','KN','LC','VC','TT','US'],
  'south america': ['AR','BO','BR','CL','CO','EC','GY','PY','PE','SR','UY','VE'],
  'oceania': ['AU','FJ','KI','MH','FM','NR','NZ','PW','PG','WS','SB','TO','TV','VU']
};

let recipeData = null;

function initLearn(recipe) {
  recipeData = recipe;
  if (recipe.learning || recipe.notes) {
    document.getElementById('learn-button').hidden = false;
  }
}

const learnOverlay = setupOverlay('learn-overlay', 'learn-close', function() {
  speechSynthesis.cancel();
});

document.getElementById('learn-button').addEventListener('click', function() {
  buildLearnContent();
  learnOverlay.open();
});

function buildLearnContent() {
  const cards = document.getElementById('learn-cards');
  const mapContainer = document.getElementById('learn-map');

  if (cards.children.length > 0) return;

  document.getElementById('learn-title').textContent = recipeData.title || '';

  const country = (recipeData.overview && recipeData.overview.country) ? recipeData.overview.country : '';
  const countryLower = country.toLowerCase();
  const code = countryCodes[countryLower];
  const isContinent = continentCodes[countryLower];

  if (country) {
    document.getElementById('learn-origin').textContent = 'From ' + country;

    // Flag — only for countries, not continents
    if (code) {
      const flag = document.getElementById('learn-flag');
      flag.textContent = countryCodeToEmoji(code);
      flag.hidden = false;
    }
  }

  // "Say it" section — only for countries, not continents
  if (code) {
    const sayit = document.getElementById('learn-sayit');
    sayit.hidden = false;
    sayit.innerHTML = '';
    const btn = document.createElement('button');
    btn.className = 'sayit-button';
    btn.textContent = '🗣️ Say "' + recipeData.title + '"';
    btn.addEventListener('click', function() {
      speak(recipeData.title);
    });
    sayit.appendChild(btn);
  }

  // Map
  if (code || isContinent) {
    mapContainer.hidden = false;
    fetch('../assets/images/world-map.svg')
      .then(res => res.text())
      .then(svg => {
        mapContainer.innerHTML = svg;
        if (isContinent) {
          isContinent.forEach(c => {
            const el = mapContainer.querySelector('#' + c);
            if (el) el.classList.add('highlighted');
          });
        } else {
          const byId = mapContainer.querySelector('#' + code);
          if (byId) byId.classList.add('highlighted');
          const byClass = mapContainer.querySelectorAll('.' + country);
          byClass.forEach(el => el.classList.add('highlighted'));
        }
      });
  }

  // Learning sections
  if (recipeData.learning) {
    if (recipeData.learning['did-you-know']) {
      addCard(cards, 'Did you know?', recipeData.learning['did-you-know'], 'fact');
    }
    if (recipeData.learning['what-you-will-learn']) {
      addCard(cards, 'What you will learn', recipeData.learning['what-you-will-learn'], 'fact');
    }
    if (recipeData.learning.skills && recipeData.learning.skills.length) {
      addListCard(cards, 'Skills', recipeData.learning.skills, 'skill');
    }
  }

  // Notes sections
  if (recipeData.notes) {
    if (recipeData.notes['why-its-in-the-chapman-kitchen']) {
      addCard(cards, 'Why we cook this', recipeData.notes['why-its-in-the-chapman-kitchen'], 'tip');
    }
    if (recipeData.notes['chapman-tips']) {
      const tips = recipeData.notes['chapman-tips'];
      if (Array.isArray(tips)) {
        addListCard(cards, 'Tips', tips, 'tip');
      } else {
        addCard(cards, 'Tips', tips, 'tip');
      }
    }
    if (recipeData.notes['batch-cooking']) {
      addCard(cards, 'Batch cooking', recipeData.notes['batch-cooking'], 'tip');
    }
    if (recipeData.notes['leftovers']) {
      addCard(cards, 'Leftovers', recipeData.notes['leftovers'], 'tip');
    }
  }
}

function addCard(container, title, text, category) {
  const card = document.createElement('div');
  card.className = 'learn-card learn-card--' + category;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', title + '. Tap to hear.');

  const h3 = document.createElement('h3');
  h3.textContent = title;
  card.appendChild(h3);

  const p = document.createElement('p');
  p.textContent = text;
  card.appendChild(p);

  card.addEventListener('click', function() { speak(title + '. ' + text); });
  card.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      speak(title + '. ' + text);
    }
  });
  container.appendChild(card);
}

function addListCard(container, title, items, category) {
  const card = document.createElement('div');
  card.className = 'learn-card learn-card--' + category;
  card.setAttribute('role', 'button');
  card.setAttribute('tabindex', '0');
  card.setAttribute('aria-label', title + '. Tap to hear.');

  const h3 = document.createElement('h3');
  h3.textContent = title;
  card.appendChild(h3);

  const ul = document.createElement('ul');
  items.forEach(item => {
    const li = document.createElement('li');
    li.textContent = item;
    ul.appendChild(li);
  });
  card.appendChild(ul);

  const fullText = title + '. ' + items.join('. ');
  card.addEventListener('click', function() { speak(fullText); });
  card.addEventListener('keydown', function(e) {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      speak(fullText);
    }
  });
  container.appendChild(card);
}

function speak(text) {
  speechSynthesis.cancel();
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.rate = 0.85;
  utterance.pitch = 1.0;
  utterance.volume = 0.7;

  const voices = speechSynthesis.getVoices();
  const preferred = ['Samantha', 'Karen', 'Moira', 'Fiona', 'Google UK English Female', 'Microsoft Hazel'];
  const match = voices.find(v => preferred.some(name => v.name.includes(name)));
  if (match) utterance.voice = match;

  speechSynthesis.speak(utterance);
}

// Pre-load voices (some browsers need this before first speak call)
speechSynthesis.getVoices();

// Convert ISO country code to flag emoji
function countryCodeToEmoji(code) {
  return code.toUpperCase().split('').map(
    c => String.fromCodePoint(0x1F1E6 + c.charCodeAt(0) - 65)
  ).join('');
}