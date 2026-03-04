// script.js
// Handles generating titles, thumbnails, and keywords on the client side.
// No external API required. Uses template-based generation and clipboard API.

// DOM elements
const topicInput = document.getElementById('topicInput');
const generateBtn = document.getElementById('generateBtn');
const loadingOverlay = document.getElementById('loadingOverlay');

const titlesList = document.getElementById('titlesList');
const thumbnailsList = document.getElementById('thumbnailsList');
const keywordsList = document.getElementById('keywordsList');
const copyAllBtn = document.getElementById('copyAllTitles');

// New selects for category, tone, style
const categorySelect = document.getElementById('categorySelect');
const toneSelect = document.getElementById('toneSelect');
const styleSelect = document.getElementById('styleSelect');

// Utility: sanitize input and collapse whitespace
function cleanTopic(raw) {
  return (raw || '').trim().replace(/\s+/g, ' ');
}

// Utility: limit a title to <= 60 chars while keeping it readable.
// If topic makes it too long, attempt to shorten the topic by truncating words.
function enforceTitleLength(title, topic) {
  const max = 60;
  if (title.length <= max) return title;

  // Try to shorten the topic inside the title
  const shortTopic = shortenTopic(topic, Math.max(8, Math.floor(topic.length / 2)));
  let attempt = title.replace(new RegExp(escapeRegExp(topic), 'gi'), shortTopic);
  if (attempt.length <= max) return attempt;

  // As a last resort, truncate and add ellipsis
  attempt = attempt.slice(0, max - 1).trim();
  attempt = attempt.replace(/\s+\S*$/, ''); // remove broken word
  return attempt + '…';
}

function escapeRegExp(string) {
  return string.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

// Shorten topic by keeping whole words until char limit
function shortenTopic(topic, charLimit) {
  if (!topic) return '';
  const words = topic.split(' ');
  let out = '';
  for (const w of words) {
    if ((out + ' ' + w).trim().length <= charLimit) {
      out = (out + ' ' + w).trim();
    } else break;
  }
  if (!out) out = topic.slice(0, charLimit);
  return out;
}

// Base title templates (used for Any)
const baseTitleTemplates = [
  "I Tried __TOPIC__ for 30 Days (Shocking Results)",
  "Nobody Talks About This __TOPIC__ Trick",
  "The Truth About __TOPIC__ You Need to Know",
  "__TOPIC__: 5 Things I Wish I Knew",
  "How __TOPIC__ Broke My Expectations",
  "Don't Do __TOPIC__ Until You Watch This",
  "__TOPIC__ Hacks That Actually Work",
  "I Failed at __TOPIC__ — Here's Why",
  "__TOPIC__ Secrets Influencers Use",
  "This __TOPIC__ Changed Everything for Me"
];

// Title templates by style to better match the selected Title Style
const styleTemplates = {
  "Any": baseTitleTemplates,
  "How-to": [
    "How to __TOPIC__ in 10 Minutes",
    "Learn __TOPIC__: A Simple Step-by-Step Guide",
    "How I __TOPIC__ and Saved Time",
    "Master __TOPIC__: Beginner to Pro"
  ],
  "Mistakes": [
    "Top 5 Mistakes in __TOPIC__ (Avoid These)",
    "Are You Making These __TOPIC__ Mistakes?",
    "I Made These __TOPIC__ Mistakes with __TOPIC__"
  ],
  "Secrets": [
    "__TOPIC__ Secrets Nobody Tells You",
    "The Hidden Secrets of __TOPIC__",
    "Secrets To Mastering __TOPIC__"
  ],
  "List": [
    "7 __TOPIC__ Tips That Actually Work",
    "10 Best __TOPIC__ Tools You Need",
    "5 __TOPIC__ Tricks You Didn't Know"
  ],
  "Story": [
    "How __TOPIC__ Changed My Life",
    "The Day I Tried __TOPIC__ and Failed",
    "What Happened When I Started __TOPIC__"
  ]
};

// Thumbnail visuals per category to make them feel tailored
const categoryVisualMap = {
  "Any": [
    "Shocked face holding a phone",
    "Before/after split-screen",
    "Close-up of eyes with dramatic lighting",
    "Person pointing at a big bold text",
    "Hands holding an object related to the topic"
  ],
  "Tech": [
    "Close-up of gadget with glowing screen",
    "Person holding a laptop with surprised face",
    "Circuit board macro with dramatic lighting",
    "Before/after software UI split-screen",
    "Hand pointing at an app on a phone"
  ],
  "Gaming": [
    "Player mid-celebration holding controller",
    "Gameplay split-screen with reaction cam",
    "Controller and dramatic neon lighting",
    "Leaderboard screenshot with shocked reaction",
    "Character silhouette with bold text"
  ],
  "Education": [
    "Teacher pointing to a whiteboard",
    "Notebook with highlighted notes and surprised face",
    "Animated diagram with spotlight",
    "Student reacting to an exam score",
    "Step-by-step checklist on screen"
  ],
  "Lifestyle": [
    "Person enjoying a lifestyle moment outdoors",
    "Before/after lifestyle transformation",
    "Flatlay of everyday items with bold text",
    "Close-up of smiling face with product",
    "Cozy home scene with dramatic lighting"
  ],
  "Health": [
    "Before/after health transformation photo",
    "Close-up of meal/fitness equipment",
    "Person mid-workout with intense expression",
    "Doctor-style clipboard with text",
    "Healthy food flatlay with bold overlay"
  ],
  "Finance": [
    "Stack of cash or upward chart",
    "Person shocked at bank statement",
    "Calculator and receipts with bold text",
    "Phone showing investment app",
    "Before/after investment graph"
  ],
  "Food": [
    "Close-up of plated food with steam",
    "Before/after recipe transformation",
    "Chef-style hands garnishing dish",
    "Top-down cooking process with utensils",
    "Person tasting with surprised expression"
  ],
  "Travel": [
    "Scenic destination with person pointing",
    "Packing spread with map and passport",
    "Before/after destination comparison",
    "Sunset silhouette with bold text",
    "Traveler looking amazed at view"
  ]
};

// Generic thumbnail text variations and emotional hooks
const thumbnailTexts = [
  "YOU WON'T BELIEVE THIS",
  "DON'T TRY THIS",
  "30 DAYS LATER",
  "I WAS WRONG",
  "MUST SEE",
  "TOP SECRET",
  "STOP DOING THIS"
];
const emotionalHooks = [
  "surprise",
  "curiosity",
  "fear of missing out",
  "amusement",
  "awe"
];

// Generate keywords by combining variations; ensures SEO-friendly lowercased terms
function generateKeywords(topic, category, style, tone) {
  const base = topic.toLowerCase();
  const variations = [
    `${base} tips`,
    `${base} tutorial`,
    `${base} for beginners`,
    `how to ${base}`,
    `${base} hacks`,
    `${base} ideas`,
    `${base} 2026`,
    `${base} guide`,
    `${base} review`,
    `${base} best`,
    `${base} thumbnail`,
    `${base} title`,
    `${base} seo`,
    `${base} viral`,
    `${base} tricks`
  ];

  // Add category/style/tone specific keywords
  if (category && category !== 'Any') {
    variations.unshift(`${category.toLowerCase()} ${base}`);
    variations.push(`${base} ${category.toLowerCase()}`);
  }
  if (style && style !== 'Any') {
    variations.push(`${style.toLowerCase()} ${base}`);
  }
  if (tone && tone !== 'Any') {
    variations.push(`${base} ${tone.toLowerCase()}`);
  }

  // Make unique and return first 15
  return Array.from(new Set(variations)).slice(0, 15);
}

// Random helper
function randChoice(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

// Build titles influenced by style and tone
function buildTitles(topic, category, tone, style) {
  const cleanedTopic = topic.trim();
  const templates = styleTemplates[style] || styleTemplates["Any"];
  const titles = [];

  for (let i = 0; i < 10; i++) {
    // Pick a template and replace placeholder
    let template = templates[i % templates.length];
    let title = template.replace(/__TOPIC__/g, cleanedTopic);

    // Tone-based modifiers
    if (tone === 'Shocking') {
      if (Math.random() > 0.5) title = "Shocking: " + title;
      else if (Math.random() > 0.6) title = title.replace(/^/, "You won't believe ");
    } else if (tone === 'Curious') {
      if (Math.random() > 0.5) title = "What Happens If You " + title.replace(/^How to /i, "");
      if (Math.random() > 0.8) title = title + " — You Might Be Surprised";
    } else if (tone === 'Funny') {
      if (Math.random() > 0.5) title = "I Tried " + cleanedTopic + " (Didn't Expect This)";
      else if (Math.random() > 0.7) title = "Confessions About " + cleanedTopic;
    } else if (tone === 'Inspirational') {
      if (Math.random() > 0.5) title = "How " + cleanedTopic + " Can Change Your Life";
    } else if (tone === 'Urgent') {
      if (Math.random() > 0.5) title = "Don't Watch This " + cleanedTopic + " Unless...";
    } else {
      // Any/default: small random variety
      if (Math.random() > 0.85) title = "Wait — " + title;
    }

    // Category injection sometimes for specificity (keeps SEO relevance)
    if (category && category !== 'Any' && Math.random() > 0.7) {
      title = title + ` (${category})`;
    }

    // Ensure length limit; prefer to keep wording readable
    title = enforceTitleLength(title, cleanedTopic);

    // Possibly uppercase the topic for emphasis
    if (Math.random() > 0.9) {
      title = title.replace(new RegExp(escapeRegExp(cleanedTopic), 'gi'), cleanedTopic.toUpperCase());
      title = enforceTitleLength(title, cleanedTopic);
    }

    titles.push(title);
  }

  return titles;
}

// Build thumbnail ideas influenced by category and tone
function buildThumbnails(topic, category, tone, style) {
  const thumbnails = [];
  const visualPool = categoryVisualMap[category] || categoryVisualMap["Any"];

  for (let i = 0; i < 5; i++) {
    const visual = randChoice(visualPool);
    let text = randChoice(thumbnailTexts);
    const emotion = randChoice(emotionalHooks);

    // Tone adjusts text style
    if (tone === 'Shocking') {
      if (Math.random() > 0.4) text = "SHOCKING";
      if (Math.random() > 0.6) text += " • " + topic;
    } else if (tone === 'Curious') {
      text = "WHAT IF?";
      if (Math.random() > 0.5) text += " • " + topic;
    } else if (tone === 'Funny') {
      text = randChoice(["LOL", "NO WAY", "I CAN'T BELIEVE IT"]) + (Math.random() > 0.6 ? " • " + topic : "");
    } else if (tone === 'Urgent') {
      text = "MUST WATCH";
    } else if (tone === 'Inspirational') {
      text = "THIS WORKS";
    } else {
      if (Math.random() > 0.7) text += " • " + topic;
    }

    // Style hint can add overlay suggestions
    let styleHint = '';
    if (style === 'How-to') styleHint = 'step-by-step';
    if (style === 'Mistakes') styleHint = 'avoid these mistakes';
    if (style === 'Secrets') styleHint = 'hidden tip';
    if (styleHint && Math.random() > 0.5) text += ` • ${styleHint}`;

    // Tailor visual to include topic sometimes (simple textual hint)
    const tailoredVisual = visual.replace(/\b(topic|object)\b/gi, topic);

    thumbnails.push({
      visual: tailoredVisual,
      text,
      emotion
    });
  }

  return thumbnails;
}

// Main generator that returns titles, thumbnails, keywords
function generateAll(topic, category, tone, style) {
  const titles = buildTitles(topic, category, tone, style);
  const thumbnails = buildThumbnails(topic, category, tone, style);
  const keywords = generateKeywords(topic, category, style, tone);
  return { titles, thumbnails, keywords };
}

// Render helpers to the DOM
function clearResults() {
  titlesList.innerHTML = '';
  thumbnailsList.innerHTML = '';
  keywordsList.innerHTML = '';
}

// Show a temporary feedback message on a button
function flashButton(btn, text = "Copied!") {
  const orig = btn.textContent;
  btn.textContent = text;
  btn.disabled = true;
  setTimeout(() => {
    btn.textContent = orig;
    btn.disabled = false;
  }, 1200);
}

// Build the list items and attach copy handlers
function renderTitles(titles) {
  titlesList.innerHTML = '';
  titles.forEach((t, idx) => {
    const li = document.createElement('li');

    const span = document.createElement('span');
    span.textContent = t;
    span.style.flex = '1';

    const copyBtn = document.createElement('button');
    copyBtn.className = 'copy-btn';
    copyBtn.textContent = 'Copy';
    copyBtn.title = 'Copy title';
    copyBtn.addEventListener('click', async () => {
      try {
        await navigator.clipboard.writeText(t);
        flashButton(copyBtn, 'Copied!');
      } catch (e) {
        // fallback for older browsers
        fallbackCopyTextToClipboard(t);
        flashButton(copyBtn, 'Copied!');
      }
    });

    li.appendChild(span);
    li.appendChild(copyBtn);
    titlesList.appendChild(li);
  });
}

// Render thumbnail ideas (visual, text, emotion)
function renderThumbnails(thumbnails) {
  thumbnailsList.innerHTML = '';
  thumbnails.forEach((th) => {
    const li = document.createElement('li');

    const inner = document.createElement('div');
    inner.style.display = 'grid';
    inner.style.gridTemplateColumns = '1fr';
    inner.style.gap = '6px';

    const v = document.createElement('div');
    v.innerHTML = `<strong>Visual:</strong> ${th.visual}`;

    const tx = document.createElement('div');
    tx.innerHTML = `<strong>Text:</strong> ${th.text}`;

    const em = document.createElement('div');
    em.innerHTML = `<strong>Emotional hook:</strong> ${th.emotion}`;

    inner.appendChild(v);
    inner.appendChild(tx);
    inner.appendChild(em);

    li.appendChild(inner);
    thumbnailsList.appendChild(li);
  });
}

// Render keywords
function renderKeywords(keywords) {
  keywordsList.innerHTML = '';
  keywords.forEach(k => {
    const li = document.createElement('li');
    li.textContent = k;
    keywordsList.appendChild(li);
  });
}

// Clipboard fallback for very old browsers
function fallbackCopyTextToClipboard(text) {
  const textArea = document.createElement("textarea");
  textArea.value = text;
  // Avoid scrolling to bottom
  textArea.style.position = "fixed";
  textArea.style.top = "-1000px";
  document.body.appendChild(textArea);
  textArea.focus();
  textArea.select();
  try {
    document.execCommand('copy');
  } catch (err) {
    console.warn('Fallback: Oops, unable to copy', err);
  }
  document.body.removeChild(textArea);
}

// Event: copy all titles
copyAllBtn.addEventListener('click', async () => {
  const items = Array.from(titlesList.querySelectorAll('li span')).map(s => s.textContent).join('\n');
  if (!items) return;
  try {
    await navigator.clipboard.writeText(items);
    flashButton(copyAllBtn, 'Copied!');
  } catch (e) {
    fallbackCopyTextToClipboard(items);
    flashButton(copyAllBtn, 'Copied!');
  }
});

// Generate button handler
generateBtn.addEventListener('click', () => {
  const rawTopic = cleanTopic(topicInput.value);
  if (!rawTopic) {
    // brief UX feedback
    topicInput.focus();
    topicInput.style.boxShadow = '0 0 0 4px rgba(124,58,237,0.12)';
    setTimeout(() => topicInput.style.boxShadow = '', 900);
    return;
  }

  // read options from selects
  const category = categorySelect.value || 'Any';
  const tone = toneSelect.value || 'Any';
  const style = styleSelect.value || 'Any';

  // show loading state
  showLoading(true);

  // Simulate generation time; in real app this could be an API call
  setTimeout(() => {
    const { titles, thumbnails, keywords } = generateAll(rawTopic, category, tone, style);

    clearResults();
    renderTitles(titles);
    renderThumbnails(thumbnails);
    renderKeywords(keywords);

    showLoading(false);
  }, 900 + Math.random() * 400); // short randomized delay for realism
});

// Manage loading overlay and disable button/inputs while generating
function showLoading(on) {
  if (on) {
    loadingOverlay.classList.remove('hidden');
    loadingOverlay.setAttribute('aria-hidden', 'false');
    generateBtn.disabled = true;
    topicInput.disabled = true;
    categorySelect.disabled = true;
    toneSelect.disabled = true;
    styleSelect.disabled = true;
  } else {
    loadingOverlay.classList.add('hidden');
    loadingOverlay.setAttribute('aria-hidden', 'true');
    generateBtn.disabled = false;
    topicInput.disabled = false;
    categorySelect.disabled = false;
    toneSelect.disabled = false;
    styleSelect.disabled = false;
  }
}

// Support pressing Enter in the input to trigger generation
topicInput.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    generateBtn.click();
  }
});