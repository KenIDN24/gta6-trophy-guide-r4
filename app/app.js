'use strict';
/* Leonida Legend — tracker logic. Plain script, no modules, no network
   beyond the one local fetch of data/trophies.json beside this file. */

const STORE_KEY = 'leonida-legend-r4-progress';
const GRADE_ORDER = { platinum: 0, gold: 1, silver: 2, bronze: 3 };
const KIND_LABEL = {
  story: 'Story', missable: 'Missable', collectibles: 'Collectibles',
  activities: 'Activities', partner: 'Partner', platinum: 'Platinum',
};

let DATA = null;            // parsed trophies.json
let TROPHIES = [];          // DATA.trophies
let byId = new Map();       // id -> trophy
let earned = new Set();     // ids the player has earned
let selectedId = null;      // trophy shown in the detail panel
let filter = { kind: 'all', grade: 'all', query: '', sort: 'roadmap', hideEarned: false };
let spoilerShield = false;

function loadProgress() {
  try {
    const raw = localStorage.getItem(STORE_KEY);
    if (!raw) return;
    const saved = JSON.parse(raw);
    if (Array.isArray(saved.earned)) earned = new Set(saved.earned.filter((id) => byId.has(id)));
    spoilerShield = !!saved.spoilerShield;
    filter.hideEarned = !!saved.hideEarned;
  } catch (err) { /* a corrupt save is ignored; the tracker starts clean */ }
}

function saveProgress() {
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify({
      earned: [...earned], spoilerShield, hideEarned: filter.hideEarned,
    }));
  } catch (err) { /* storage full/blocked: the session still works in memory */ }
}

function totalHours() { return TROPHIES.reduce((sum, t) => sum + t.hours, 0); }
function remainingHours() {
  return TROPHIES.filter((t) => !earned.has(t.id)).reduce((sum, t) => sum + t.hours, 0);
}

function renderProgress() {
  const n = earned.size;
  document.getElementById('earned-count').textContent = String(n);
  document.getElementById('progress-pct').textContent = `${Math.round((n / TROPHIES.length) * 100)}%`;
  document.getElementById('progress-fill').style.width = `${(n / TROPHIES.length) * 100}%`;
  const eta = document.getElementById('eta-line');
  if (n === TROPHIES.length) eta.textContent = 'Platinum earned — Leonida Legend';
  else eta.textContent = `Platinum ETA ≈ ${Math.round(remainingHours())}h of play remaining`;
}

function renderAudit() {
  const cited = TROPHIES.reduce((sum, t) => sum + t.steps.length, 0);
  const missables = TROPHIES.filter((t) => t.missable).length;
  document.getElementById('audit-strip').innerHTML =
    `<span><b>${cited}</b> cited steps</span>` +
    `<span><b>${DATA.sources.length}</b> named sources</span>` +
    `<span><b>${DATA.disputes.length}</b> disputes resolved</span>` +
    `<span><b>${missables}</b> missable trophies flagged</span>` +
    `<span><b>${Math.round(totalHours())}h</b> full platinum route</span>`;
}

/* ---------- checklist ---------- */

function isShielded(t) { return spoilerShield && t.kind === 'story' && !earned.has(t.id); }

function citeHtml(text) {
  return text.replace(/\[S(\d+)\]/g, '<span class="cite">[S$1]</span>');
}
function esc(text) {
  return text.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;');
}
function cite(text) { return citeHtml(esc(text)); }

function visibleTrophies() {
  const q = filter.query.trim().toLowerCase();
  let list = TROPHIES.filter((t) => {
    if (filter.kind === 'missable' && !t.missable) return false;
    if (filter.kind !== 'all' && filter.kind !== 'missable' && t.kind !== filter.kind) return false;
    if (filter.grade !== 'all' && t.grade !== filter.grade) return false;
    if (filter.hideEarned && earned.has(t.id)) return false;
    if (q) {
      const hay = `${t.name} ${t.description} ${t.guide} ${t.kind}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  const by = {
    roadmap: (a, b) => a.stage - b.stage || a.id - b.id,
    grade: (a, b) => GRADE_ORDER[a.grade] - GRADE_ORDER[b.grade] || a.id - b.id,
    name: (a, b) => a.name.localeCompare(b.name),
    time: (a, b) => a.hours - b.hours || a.id - b.id,
    difficulty: (a, b) => a.difficulty - b.difficulty || a.id - b.id,
  }[filter.sort];
  return list.sort(by);
}

function tagRow(t) {
  const tags = [`<span class="tag grade-${t.grade}">${t.grade}</span>`];
  tags.push(`<span class="tag">${KIND_LABEL[t.kind] || t.kind}</span>`);
  if (t.missable) tags.push('<span class="tag missable">Missable</span>');
  if (t.hidden) tags.push('<span class="tag">Hidden on PSN</span>');
  tags.push(`<span class="tag stage">Stage ${t.stage}</span>`);
  tags.push(`<span class="tag">≈${t.hours}h</span>`);
  tags.push(`<span class="tag">Diff ${t.difficulty}/10</span>`);
  if (t.count) tags.push(`<span class="tag">${t.count.toLocaleString('en-US')} tracked</span>`);
  return tags.join('');
}

function renderList() {
  const list = visibleTrophies();
  const ul = document.getElementById('trophy-list');
  document.getElementById('result-line').textContent =
    `Showing ${list.length} of ${TROPHIES.length} trophies` +
    (filter.kind === 'missable' ? ' — every missable, in roadmap order of danger' : '');
  ul.innerHTML = list.map((t) => {
    const shield = isShielded(t);
    const name = shield ? '<span class="spoiler-name">Hidden story trophy</span>' : esc(t.name);
    const desc = shield ? 'Name and description hidden by the spoiler shield until earned.' : esc(t.description);
    return `<li class="trophy-card${earned.has(t.id) ? ' earned' : ''}${t.id === selectedId ? ' selected' : ''}" data-id="${t.id}">
      <input type="checkbox" data-earn="${t.id}" ${earned.has(t.id) ? 'checked' : ''} aria-label="Mark ${esc(t.name)} earned">
      <div class="card-main"><div class="card-name">${name}</div>
      <div class="card-desc">${desc}</div>
      <div class="card-tags">${tagRow(t)}</div></div></li>`;
  }).join('');
  ul.querySelectorAll('.trophy-card').forEach((card) => {
    card.addEventListener('click', (ev) => {
      if (ev.target.matches('input[type="checkbox"]')) return;
      selectTrophy(Number(card.dataset.id), true);
    });
  });
  ul.querySelectorAll('input[data-earn]').forEach((box) => {
    box.addEventListener('change', () => toggleEarned(Number(box.dataset.earn), box.checked));
  });
}

function renderDetail() {
  const panel = document.getElementById('detail');
  const t = byId.get(selectedId);
  if (!t) { panel.innerHTML = '<p class="empty-note">Pick a trophy from the list to read its cited guide.</p>'; return; }
  if (isShielded(t)) {
    panel.innerHTML = `<h2><span class="spoiler-name">Hidden story trophy</span></h2>
      <p class="official-desc">The spoiler shield is on: this story trophy's name, description and guide stay hidden until you mark it earned.</p>
      <div class="meta-row">${tagRow(t)}</div>
      <button class="earn-btn" data-earn-btn="${t.id}">Mark as earned</button>`;
  } else {
    const sources = t.sources.map((sid) => {
      const s = DATA.sources.find((x) => x.id === sid);
      return s ? `<li><span class="cite">[S${s.id}]</span> ${esc(s.name)}</li>` : '';
    }).join('');
    panel.innerHTML = `<h2>${esc(t.name)}</h2>
      <p class="official-desc">“${esc(t.description)}”</p>
      <div class="meta-row">${tagRow(t)}</div>
      ${t.missable ? `<p class="ponr"><b>Point of no return:</b> ${esc(t.ponr || '')}</p>` : ''}
      <h3>The guide</h3><p>${cite(t.guide)}</p>
      <h3>Steps</h3><ol class="step-list">${t.steps.map((s) => `<li>${cite(s)}</li>`).join('')}</ol>
      <h3>Cited from</h3><ul class="step-list">${sources}</ul>
      <button class="earn-btn${earned.has(t.id) ? ' earned' : ''}" data-earn-btn="${t.id}">${earned.has(t.id) ? 'Earned ✓ — tap to undo' : 'Mark as earned'}</button>`;
  }
  const btn = panel.querySelector('[data-earn-btn]');
  if (btn) btn.addEventListener('click', () => toggleEarned(t.id, !earned.has(t.id)));
}

function selectTrophy(id, pushHash) {
  selectedId = id;
  if (pushHash) history.replaceState(null, '', `#trophy-${id}`);
  renderList(); renderDetail();
}

function toggleEarned(id, on) {
  if (on) earned.add(id); else earned.delete(id);
  saveProgress(); renderProgress(); renderList(); renderDetail(); renderRoadmap();
}

/* ---------- roadmap / sources / disputes ---------- */

function renderRoadmap() {
  const wrap = document.getElementById('roadmap-list');
  wrap.innerHTML = DATA.roadmap.map((stage) => {
    const doneCount = stage.ids.filter((id) => earned.has(id)).length;
    const rows = stage.ids.map((id) => {
      const t = byId.get(id);
      if (!t) return '';
      const done = earned.has(id);
      return `<li><a href="#trophy-${id}" data-goto="${id}" class="${done ? 'done' : ''}">${esc(t.name)}</a>
        <span class="tag grade-${t.grade}">${t.grade}</span>${t.missable ? ' <span class="tag missable">Missable</span>' : ''}
        <span class="cite">${t.steps.map((s) => (s.match(/\[S\d+\]/g) || []).length).reduce((a, b) => a + b, 0)} citations</span></li>`;
    }).join('');
    return `<div class="stage-block"><h3><span class="stage-no">Stage ${stage.stage}</span> — ${esc(stage.title)} <span class="stage-progress">(${doneCount}/${stage.ids.length} earned)</span></h3>
      <p class="stage-note">${esc(stage.note)}</p><ul>${rows}</ul></div>`;
  }).join('');
  wrap.querySelectorAll('[data-goto]').forEach((a) => {
    a.addEventListener('click', (ev) => {
      ev.preventDefault();
      switchView('checklist');
      selectTrophy(Number(a.dataset.goto), true);
      document.getElementById('detail').scrollIntoView({ behavior: 'smooth', block: 'start' });
    });
  });
}

function renderSources() {
  document.getElementById('source-list').innerHTML = DATA.sources.map((s) =>
    `<li><span class="src-id">S${s.id}</span> · <span class="src-kind">${esc(s.kind)}</span><br>
     <b>${esc(s.name)}</b><div class="src-note">${esc(s.note)}</div></li>`).join('');
}

function renderDisputes() {
  document.getElementById('dispute-list').innerHTML = DATA.disputes.map((d) =>
    `<div class="dispute"><h3><span class="d-id">D${d.id}</span> — ${esc(d.title)}</h3>
     <p><b>The clash:</b> ${esc(d.clash)}</p>
     <p class="ruling"><b>Ruling:</b> ${cite(d.ruling)}</p></div>`).join('');
}

/* ---------- chrome: tabs, toolbar, import/export ---------- */

function switchView(name) {
  document.querySelectorAll('.tab').forEach((tab) => tab.classList.toggle('active', tab.dataset.view === name));
  document.querySelectorAll('.view').forEach((v) => v.classList.toggle('active', v.id === `view-${name}`));
}

function wireChrome() {
  document.querySelectorAll('.tab').forEach((tab) =>
    tab.addEventListener('click', () => switchView(tab.dataset.view)));
  document.getElementById('search').addEventListener('input', (ev) => { filter.query = ev.target.value; renderList(); });
  document.querySelectorAll('#kind-chips .chip').forEach((chip) =>
    chip.addEventListener('click', () => {
      document.querySelectorAll('#kind-chips .chip').forEach((c) => c.classList.toggle('active', c === chip));
      filter.kind = chip.dataset.kind; renderList();
    }));
  document.querySelectorAll('#grade-chips .chip').forEach((chip) =>
    chip.addEventListener('click', () => {
      document.querySelectorAll('#grade-chips .chip').forEach((c) => c.classList.toggle('active', c === chip));
      filter.grade = chip.dataset.grade; renderList();
    }));
  document.getElementById('sort').addEventListener('change', (ev) => { filter.sort = ev.target.value; renderList(); });
  document.getElementById('spoiler-toggle').addEventListener('change', (ev) => {
    spoilerShield = ev.target.checked; saveProgress(); renderList(); renderDetail();
  });
  document.getElementById('hide-earned').addEventListener('change', (ev) => {
    filter.hideEarned = ev.target.checked; saveProgress(); renderList();
  });
  document.getElementById('export-btn').addEventListener('click', () => {
    const blob = new Blob([JSON.stringify({ app: 'leonida-legend', earned: [...earned] }, null, 2)], { type: 'application/json' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'leonida-legend-progress.json';
    a.click();
    URL.revokeObjectURL(a.href);
  });
  document.getElementById('import-file').addEventListener('change', (ev) => {
    const file = ev.target.files[0];
    if (!file) return;
    file.text().then((text) => {
      try {
        const parsed = JSON.parse(text);
        const ids = Array.isArray(parsed) ? parsed : parsed.earned;
        if (!Array.isArray(ids)) throw new Error('no earned list');
        earned = new Set(ids.filter((id) => byId.has(id)));
        saveProgress(); renderProgress(); renderList(); renderDetail(); renderRoadmap();
      } catch (err) { alert('That file is not a Leonida Legend progress export.'); }
      ev.target.value = '';
    });
  });
  document.getElementById('reset-btn').addEventListener('click', () => {
    if (!confirm('Reset all tracked progress?')) return;
    earned = new Set(); saveProgress(); renderProgress(); renderList(); renderDetail(); renderRoadmap();
  });
  window.addEventListener('hashchange', () => {
    const m = location.hash.match(/^#trophy-(\d+)$/);
    if (m && byId.has(Number(m[1]))) { switchView('checklist'); selectTrophy(Number(m[1]), false); }
  });
}

/* ---------- boot ---------- */

fetch('data/trophies.json')
  .then((res) => res.json())
  .then((data) => {
    DATA = data;
    TROPHIES = data.trophies;
    byId = new Map(TROPHIES.map((t) => [t.id, t]));
    loadProgress();
    document.getElementById('spoiler-toggle').checked = spoilerShield;
    document.getElementById('hide-earned').checked = filter.hideEarned;
    const m = location.hash.match(/^#trophy-(\d+)$/);
    selectedId = m && byId.has(Number(m[1])) ? Number(m[1]) : TROPHIES[0].id;
    wireChrome();
    renderAudit(); renderProgress(); renderList(); renderDetail();
    renderRoadmap(); renderSources(); renderDisputes();
  })
  .catch((err) => {
    document.getElementById('detail').innerHTML =
      `<p class="empty-note">Could not load data/trophies.json (${esc(String(err))}). Serve the app/ folder over HTTP — file:// blocks the data fetch.</p>`;
  });
