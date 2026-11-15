// Touchline — match engine (plain code) + game flow. Rival managers and the dressing room run on SERV.
const $ = (s, el = document) => el.querySelector(s);
const esc = (s) => String(s ?? '').replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SPEED = typeof location !== "undefined" && location.search.includes("fast") ? 0.05 : 1;
const sleep = (ms) => new Promise((r) => setTimeout(r, ms * SPEED));

// ---------- seeded RNG ----------
function rng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6d2b79f5) >>> 0; let t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

// ---------- data ----------
const FORMS = {
  '4-4-2': { DF: 4, MF: 4, FW: 2 }, '4-3-3': { DF: 4, MF: 3, FW: 3 }, '3-5-2': { DF: 3, MF: 5, FW: 2 },
  '5-3-2': { DF: 5, MF: 3, FW: 2 }, '4-2-3-1': { DF: 4, MF: 5, FW: 1 },
};
const TRAITS = ['Leader', 'Hothead', 'Nervous youngster', 'Veteran', 'Flair player', 'Workhorse', 'Quiet professional', 'Joker'];
const FIRST = ['Luca', 'Mateo', 'Jonas', 'Arlo', 'Kai', 'Theo', 'Rafa', 'Nils', 'Owen', 'Elias', 'Sami', 'Ivo', 'Leon', 'Milo', 'Hugo', 'Tomas', 'Felix', 'Remy', 'Ezra', 'Bram', 'Caio', 'Dario', 'Emil', 'Finn'];
const LAST = ['Varga', 'Holt', 'Brennan', 'Okafor', 'Lindqvist', 'Moreau', 'Kovac', 'Seidel', 'Duarte', 'Hayes', 'Novak', 'Castell', 'Reyes', 'Falk', 'Ibsen', 'Marchetti', 'Quinn', 'Sato', 'Vidal', 'Wren', 'Abara', 'Bakker', 'Costa', 'Dunn'];

const STORY_T = {
  'Leader': 'Wore the armband for the under-18s and never really took it off. The room goes quiet when he talks.',
  'Hothead': 'Sent off twice last season and loved by the fans for it. Plays best when someone has annoyed him.',
  'Nervous youngster': 'Still gets the bus to training. Brilliant on a Tuesday, pale on a matchday.',
  'Veteran': 'Has seen four managers come and go. Knows exactly how much running a game really needs.',
  'Flair player': 'Tries things nobody asked for. Half of them end up on the highlights, half in the stand.',
  'Workhorse': 'Covers more ground than anyone in the league and has never once complained about it.',
  'Quiet professional': 'First in, last out, says about nine words a week. Coaches adore him.',
  'Joker': 'Runs the dressing-room playlist and the fines list. Keeps the squad loose when the table gets tight.',
};
function fallbackStory(q, r) {
  const a = q.age <= 20 ? 'Came through the Ashford academy.' : q.age >= 30 ? 'On his last contract and wants one medal before he goes.' : r() < 0.5 ? 'Signed from the lower leagues three years ago.' : 'A local lad who grew up ten minutes from the ground.';
  return `${a} ${STORY_T[q.trait]}`;
}
function makeSquad(seed, bias) {
  const r = rng(seed), used = new Set(), out = [];
  const name = () => { let n; do n = `${FIRST[Math.floor(r() * FIRST.length)]} ${LAST[Math.floor(r() * LAST.length)]}`; while (used.has(n)); used.add(n); return n; };
  const plan = [['GK', 2], ['DF', 6], ['MF', 6], ['FW', 3]];
  for (const [pos, n] of plan) for (let i = 0; i < n; i++) {
    const base = 58 + Math.floor(r() * 22) + (i === 0 ? 6 : 0);
    const att = pos === 'FW' ? base + 8 : pos === 'MF' ? base : pos === 'DF' ? base - 22 : 20;
    const def = pos === 'DF' || pos === 'GK' ? base + 6 : pos === 'MF' ? base - 6 : base - 30;
    out.push({
      name: name(), pos, age: 18 + Math.floor(r() * 16), trait: TRAITS[Math.floor(r() * TRAITS.length)],
      att: Math.min(92, Math.max(20, att + (bias.att || 0))), def: Math.min(92, Math.max(15, def + (bias.def || 0))),
      sta: Math.min(95, 60 + Math.floor(r() * 30) + (bias.sta || 0)), morale: 6 + Math.floor(r() * 3), side: ['Left', 'Centre', 'Right'][i % 3],
      goals: 0,
    });
    const q = out[out.length - 1]; if (q.trait === 'Nervous youngster') q.age = 18 + (q.age % 3); if (q.trait === 'Veteran' && q.age < 30) q.age = 30 + (q.age % 4); q.ovr = Math.round(pos === 'FW' ? q.att : pos === 'MF' ? (q.att + q.def) / 2 + 6 : q.def); q.face = out.length - 1; q.story = fallbackStory(q, r);
  }
  return out;
}

const CLUBS = {
  you: { id: 'you', name: 'Ashford Town', short: 'ASH', color: '#F4EFE2', ink: '#111', squad: makeSquad(11, { att: 2 }) },
  blank: { id: 'blank', name: 'Harrow Vale', short: 'HAR', color: '#58B4E8', ink: '#111', manager: 'Teodor Blank', tag: 'The Wall', line: 'Pragmatic. Hates conceding. Will sit deep and hit you on the break.', squad: makeSquad(23, { def: 5, att: -2 }) },
  ortega: { id: 'ortega', name: 'Port Arden', short: 'PAR', color: '#E0362C', ink: '#fff', manager: 'Marisol Ortega', tag: 'Heavy Metal', line: 'Presses like her life depends on it. Takes risks, chases every game.', squad: makeSquad(37, { sta: 8, att: 2 }) },
  ferrier: { id: 'ferrier', name: 'Kingsmere', short: 'KIN', color: '#E6B325', ink: '#111', manager: 'Duncan Ferrier', tag: 'The Professor', line: 'Studies your habits, then changes shape to punish them.', squad: makeSquad(51, { att: 3, def: 3 }) },
};
const OTHERS = [['Calder Rovers', 62, '#7A3FF2'], ['Westmoor United', 60, '#0E8F6E'], ['Thornbury City', 58, '#F26B21'], ['Saltwick Athletic', 55, '#15181D'], ['Dunmere', 53, '#C2185B'], ['Brackley Wanderers', 51, '#1E63D6'], ['Lowfield Town', 49, '#8A5A2B'], ['Hartsea Albion', 47, '#0FA3B1'], ['Northgate', 46, '#5B6470'], ['Ravenscar', 44, '#3B1F6B'], ['Millbrook County', 42, '#B8860B'], ['Eastleigh Park', 40, '#D7263D'], ['Corran Borough', 37, '#2E7D32'], ['Stoneham', 33, '#455A64'], ['Whitby Marsh', 29, '#6D4C41'], ['Aldercross', 24, '#9E9D24']]
  .map(([name, pts, color], i) => ({ id: 'o' + i, name, short: name.replace(/[^A-Za-z]/g, '').slice(0, 3).toUpperCase(), color, ink: '#fff', base: pts }));
const BASEPTS = { blank: 74, ortega: 73, ferrier: 72, you: 71 };
const ALL = {}; Object.values(CLUBS).forEach((c) => { c.base = BASEPTS[c.id]; ALL[c.id] = c; }); OTHERS.forEach((c) => (ALL[c.id] = c));
function simOthers(md) {
  const r = rng(4000 + md * 31), ids = OTHERS.map((c) => c.id), rot = ids.slice(md * 3).concat(ids.slice(0, md * 3)), out = [];
  for (let i = 0; i < rot.length; i += 2) out.push([rot[i], rot[i + 1], Math.floor(r() * 3.3), Math.floor(r() * 2.8)]);
  return out;
}
const MARKET = makeSquad(777, { att: 5, def: 5 }).filter((p, i) => [0, 2, 4, 8, 10, 11, 14, 15, 16].includes(i)).filter((p) => !CLUBS.you.squad.some((q) => q.name === p.name)).map((p, k) => { const from = OTHERS[(k * 3) % 16].name; return { ...p, face: 18 + k, from, story: p.story.replace('the Ashford academy', `the ${from} academy`).replace('ten minutes from the ground', 'a long way from Ashford') }; });
const val = (p) => Math.max(1, Math.round((p.ovr - 58) * 0.55 + (30 - p.age) * 0.3));
const FIXTURES = [
  { opp: 'blank', home: true, other: ['ortega', 'ferrier'] },
  { opp: 'ortega', home: false, other: ['blank', 'ferrier'] },
  { opp: 'ferrier', home: true, other: ['blank', 'ortega'] },
];

// ---------- engine ----------
function pickXI(squad, formation) {
  const f = FORMS[formation], by = (p) => [...squad].filter((x) => x.pos === p);
  const score = (x) => (x.pos === 'FW' ? x.att : x.pos === 'DF' || x.pos === 'GK' ? x.def : (x.att + x.def) / 2) + x.morale;
  const gk = by('GK').sort((a, b) => score(b) - score(a))[0];
  const xi = [gk];
  for (const pos of ['DF', 'MF', 'FW']) {
    let pool = by(pos).sort((a, b) => score(b) - score(a));
    let need = f[pos];
    xi.push(...pool.slice(0, need));
    if (pool.length < need) { // borrow from neighbouring lines
      const rest = squad.filter((x) => !xi.includes(x) && x.pos !== 'GK').sort((a, b) => (pos === 'FW' ? b.att - a.att : (b.att + b.def) - (a.att + a.def)));
      xi.push(...rest.slice(0, need - pool.length));
    }
  }
  return xi.map((p, i) => ({ ...p, slot: i === 0 ? 'GK' : i <= f.DF ? 'DF' : i <= f.DF + f.MF ? 'MF' : 'FW', ref: p }));
}

const avg = (a) => a.reduce((s, x) => s + x, 0) / Math.max(a.length, 1);
function strength(xi, t, fatigue, markedName) {
  const f = FORMS[t.formation];
  const mor = (p) => 1 + (p.morale - 6.5) * 0.025;
  const fat = (p) => 1 - Math.max(0, fatigue - p.sta / 100 * 0.6) * 0.35;
  const line = (slot) => xi.filter((p) => p.slot === slot);
  const attOf = (p) => p.att * mor(p) * fat(p) * (p.name === markedName ? 0.6 : 1);
  let def = avg(line('DF').map((p) => p.def * mor(p) * fat(p))) * 0.8 + avg(line('GK').map((p) => p.def)) * 0.2;
  let mid = avg(line('MF').map((p) => ((p.att + p.def) / 2) * mor(p) * fat(p))) * (1 + 0.05 * (f.MF - 4));
  let att = avg(line('FW').map(attOf)) * 0.7 + avg(line('MF').map(attOf)) * 0.3;
  att *= 1 + 0.04 * (f.FW - 2); def *= 1 + 0.04 * (f.DF - 4);
  if (t.mentality === 'Defensive') { att *= 0.86; def *= 1.12; } if (t.mentality === 'Attacking') { att *= 1.14; def *= 0.9; }
  if (t.press === 'High') { mid *= 1.1; def *= 0.95; } if (t.press === 'Low') { mid *= 0.93; def *= 1.06; }
  const lanes = {};
  for (const lane of ['Left', 'Centre', 'Right']) lanes[lane] = avg(line('DF').filter((p) => p.side === lane).map((p) => p.def)) || def;
  return { att, mid, def, lanes };
}

function newMatch(home, away, seed) {
  return { home, away, seed, r: rng(seed), min: 0, score: [0, 0], shots: [0, 0], xg: [0, 0], poss: [0, 0], lanes: [{ Left: 0, Centre: 0, Right: 0 }, { Left: 0, Centre: 0, Right: 0 }], events: [], scorers: [] };
}
// One minute of football. Returns events for the feed.
function tick(m) {
  const r = m.r; m.min++;
  const fatigue = m.min / 90;
  const sides = [m.home, m.away].map((s, i) => ({ s, st: strength(s.xi, s.t, fatigue * (s.t.press === 'High' ? 1.4 : s.t.press === 'Low' ? 0.8 : 1), [m.away, m.home][i].t.mark) }));
  const p0 = sides[0].st.mid / (sides[0].st.mid + sides[1].st.mid);
  const a = r() < p0 ? 0 : 1, d = 1 - a;
  m.poss[a]++;
  const A = sides[a], D = sides[d];
  const ratio = A.st.att / D.st.def;
  let chance = 0.135 * Math.pow(ratio, 1.6);
  // A high press leaves space behind once legs go.
  if (D.s.t.press === 'High' && m.min > 55) chance *= 1.25;
  if (r() > chance) return [];
  const lane = r() < 0.55 ? A.s.t.attack_lane : ['Left', 'Centre', 'Right'][Math.floor(r() * 3)];
  m.lanes[a][lane]++;
  const laneDef = D.st.lanes[lane];
  const weak = laneDef < D.st.def * 0.97 ? 1.2 : 1;
  const xg = Math.min(0.55, Math.max(0.03, 0.11 * ratio * weak * (0.45 + r() * 1.25)));
  m.shots[a]++; m.xg[a] += xg;
  const shooter = weightedPick(A.s.xi.filter((p) => p.slot === 'FW' || p.slot === 'MF'), (p) => (p.slot === 'FW' ? 2.2 : 1) * p.att * (p.name === D.s.t.mark ? 0.5 : 1), r);
  if (r() < xg) {
    m.score[a]++; shooter.ref.goals++; m.scorers.push({ side: a, name: shooter.name, min: m.min });
    shooter.rating = (shooter.rating || 6.5) + 1.2;
    A.s.xi.forEach((p) => (p.rating = (p.rating || 6.5) + 0.15)); D.s.xi.filter((p) => p.slot === 'DF' || p.slot === 'GK').forEach((p) => (p.rating = (p.rating || 6.5) - 0.3));
    return [{ type: 'goal', side: a, lane, shooter: shooter.name, text: `GOAL. ${shooter.name} finishes down the ${lane.toLowerCase()} for ${A.s.club.name}.`, xg }];
  }
  shooter.rating = (shooter.rating || 6.5) + 0.05;
  const how = xg > 0.25 ? 'Huge chance' : xg > 0.12 ? 'Chance' : 'Half-chance';
  const end = r() < 0.5 ? 'saved' : r() < 0.6 ? 'wide' : 'blocked';
  if (end === 'saved') D.s.xi[0].rating = (D.s.xi[0].rating || 6.5) + 0.15;
  return [{ type: 'chance', side: a, lane, shooter: shooter.name, end, text: `${how} for ${A.s.club.short}: ${shooter.name} from the ${lane.toLowerCase()}, ${end}.`, xg }];
}
function weightedPick(arr, w, r) { const ws = arr.map(w), t = ws.reduce((a, b) => a + b, 0); let x = r() * t; for (let i = 0; i < arr.length; i++) { x -= ws[i]; if (x <= 0) return arr[i]; } return arr[arr.length - 1]; }

function quickSim(hId, aId, seed) {
  const mk = (id) => { const t = { formation: '4-4-2', mentality: 'Balanced', press: 'Mid', attack_lane: 'Centre', mark: 'None' }; return { club: CLUBS[id], t, xi: pickXI(CLUBS[id].squad, t.formation) }; };
  const m = newMatch(mk(hId), mk(aId), seed);
  while (m.min < 90) tick(m);
  return m.score;
}

// ---------- SERV ----------
const ledger = { calls: 0, cost: 0, ms: 0, blocked: 0 };
async function serv(body) {
  const r = await fetch('/api/serv', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) });
  const j = await r.json();
  if (!r.ok) throw new Error(j.error || 'SERV request failed');
  if (j.meta) { ledger.calls++; ledger.cost += j.meta.cost; ledger.ms += j.meta.ms; }
  if (j.blocked) ledger.blocked++;
  return j;
}
const FALLBACK = { formation: '4-4-2', mentality: 'Balanced', press: 'Mid', attack_lane: 'Centre', mark: 'None', notes: [{ saw: 'Could not reach the analysts in time.', decided: 'Stick with a balanced 4-4-2.' }], quote: 'We play our game.' };

function scoutReport(oppId, md) {
  const me = CLUBS.you, last = state.history[state.history.length - 1];
  const xi = pickXI(me.squad, state.tactics.formation);
  const top = [...me.squad].sort((a, b) => b.goals - a.goals || b.att - a.att).slice(0, 3);
  const lanes = ['Left', 'Centre', 'Right'].map((l) => ({ l, d: avg(xi.filter((p) => p.slot === 'DF' && p.side === l).map((p) => p.def)) || 0 })).filter((x) => x.d).sort((a, b) => a.d - b.d);
  const stand = table().slice(0, 6).map((t, i) => `${i + 1}. ${t.name} ${t.pts} pts (GD ${t.gd >= 0 ? '+' : ''}${t.gd})`).join('; ');
  const lines = [
    `MATCHDAY ${md + 1} of 38, the opening weeks of a new season. You are ${CLUBS[oppId].name}. Opponent: Ashford Town (${FIXTURES[md].home ? 'they are at home' : 'you are at home'}).`,
    `LEAGUE TABLE: ${stand}.`,
    last
      ? `ASHFORD'S LAST MATCH: ${last.score[0]}-${last.score[1]} vs ${last.opp}. They played ${last.t.formation}, ${last.t.mentality}, ${last.t.press} press, attacking mostly down the ${last.t.attack_lane}. ${last.lanePct}. Possession ${last.poss}%. Shots ${last.shots}, xG ${last.xg}.`
      : `NO MATCH FOOTAGE YET: this is Ashford's first game. Their new manager is unknown.`,
    `ASHFORD THREATS: ${top.map((p) => `${p.name} (${p.pos}, attack ${p.att}, ${p.goals} goal${p.goals === 1 ? "" : "s"} this season)`).join('; ')}.`,
    `ASHFORD WEAKEST FLANK: their ${lanes[0]?.l || 'Left'} side defender rates ${Math.round(lanes[0]?.d || 60)} (strongest flank ${Math.round(lanes[lanes.length - 1]?.d || 70)}).`,
    `ASHFORD SQUAD STAMINA: average ${Math.round(avg(xi.map((p) => p.sta)))}/100. YOUR SQUAD STAMINA: average ${Math.round(avg(CLUBS[oppId].squad.map((p) => p.sta)))}/100.`,
  ];
  return lines.join('\n');
}
function halftimeReport(m, oppIdx) {
  const me = oppIdx === 0 ? 1 : 0; // index of Ashford in match arrays
  const tot = m.poss[0] + m.poss[1] || 1;
  const L = m.lanes[me], lt = L.Left + L.Centre + L.Right || 1;
  return [
    `HALF-TIME. Score: ${m.home.club.name} ${m.score[0]} - ${m.score[1]} ${m.away.club.name}. You manage ${[m.home, m.away][oppIdx].club.name}.`,
    `Possession: you ${Math.round((m.poss[oppIdx] / tot) * 100)}%, Ashford ${Math.round((m.poss[me] / tot) * 100)}%.`,
    `Shots: you ${m.shots[oppIdx]} (xG ${m.xg[oppIdx].toFixed(2)}), Ashford ${m.shots[me]} (xG ${m.xg[me].toFixed(2)}).`,
    `Ashford's attacks came ${Math.round((L.Left / lt) * 100)}% down their left, ${Math.round((L.Centre / lt) * 100)}% through the centre, ${Math.round((L.Right / lt) * 100)}% down their right.`,
    `Ashford are playing ${[m.home, m.away][me].t.formation}, ${[m.home, m.away][me].t.mentality}, ${[m.home, m.away][me].t.press} press.`,
    `Your current plan: ${[m.home, m.away][oppIdx].t.formation}, ${[m.home, m.away][oppIdx].t.mentality}, ${[m.home, m.away][oppIdx].t.press} press, attacking ${[m.home, m.away][oppIdx].t.attack_lane}.`,
    `Ashford scorers so far: ${m.scorers.filter((s) => s.side === me).map((s) => `${s.name} ${s.min}'`).join(', ') || 'none'}.`,
  ].join('\n');
}

// ---------- state ----------
const state = { budget: 12, md: 0, tactics: { formation: '4-3-3', mentality: 'Balanced', press: 'Mid', attack_lane: 'Centre', mark: 'None' }, history: [], results: [], notes: [] };
function table() {
  const t = Object.values(ALL).map((c) => ({ id: c.id, name: c.name, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0, seed: c.base }));
  const get = (id) => t.find((x) => x.id === id);
  for (const [h, a, sh, sa] of state.results) {
    const H = get(h), A = get(a); H.p++; A.p++; H.gf += sh; H.ga += sa; A.gf += sa; A.ga += sh;
    if (sh > sa) { H.w++; H.pts += 3; A.l++; } else if (sh < sa) { A.w++; A.pts += 3; H.l++; } else { H.d++; A.d++; H.pts++; A.pts++; }
  }
  t.forEach((x) => (x.gd = x.gf - x.ga));
  return t.sort((a, b) => b.pts - a.pts || b.gd - a.gd || b.gf - a.gf || b.seed - a.seed);
}

window.Touchline = { CLUBS, FIXTURES, FORMS, pickXI, newMatch, tick, quickSim, serv, ledger, state, table, scoutReport, halftimeReport, FALLBACK, sleep, esc, $ };
