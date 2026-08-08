/* ---- gesture vocabulary (kriyā) ---- */
const GEST = {
  clap: { icon:'👏', name:'Thattu', sub:'palm strikes down', tag:'clap',   pose:'clap contact' },
  wave: { icon:'👋', name:'Veechu', sub:'palm turns up',     tag:'wave',   pose:'wave' },
  c1:   { icon:'👆', name:'Count 1', sub:'little finger',     tag:'little', pose:'count count-1 contact' },
  c2:   { icon:'👆', name:'Count 2', sub:'ring finger',       tag:'ring',   pose:'count count-2 contact' },
  c3:   { icon:'👆', name:'Count 3', sub:'middle finger',     tag:'middle', pose:'count count-3 contact' },
  rest: { icon:'·',  name:'Rest',    sub:'silent — keep the pulse', tag:'—', pose:'rest' },
};

/* ---- the tālas ----
   Sapta tālas (Ādi, Rūpaka) have a kriyā on every beat.
   Chāpu tālas mark only the sub‑group starts; the other beats are silent
   rests (the pulse still ticks so it stays a usable metronome). */
const talas = {
  adi: {
    name:'Ādi Tāḷa', short:'Ādi',
    detail:'Laghu (4) + Drutam (2) + Drutam (2) · 8 beats',
    groups:[4,2,2],
    beats:[
      {g:'clap',accent:true,anga:'Laghu'}, {g:'c1',anga:'Laghu'}, {g:'c2',anga:'Laghu'}, {g:'c3',anga:'Laghu'},
      {g:'clap',accent:true,anga:'Drutam'}, {g:'wave',anga:'Drutam'},
      {g:'clap',accent:true,anga:'Drutam'}, {g:'wave',anga:'Drutam'},
    ],
  },
  adi16: {
    name:'Ādi Tāḷa · 16', short:'Ādi 16',
    detail:'Chauka kāla (2 kaḷai) — 2 beats per kriyā · 16 beats',
    groups:[8,4,4],
    beats:[
      {g:'clap',accent:true,anga:'Laghu'}, {g:'clap',anga:'Laghu'},
      {g:'c1',anga:'Laghu'}, {g:'c1',anga:'Laghu'},
      {g:'c2',anga:'Laghu'}, {g:'c2',anga:'Laghu'},
      {g:'c3',anga:'Laghu'}, {g:'c3',anga:'Laghu'},
      {g:'clap',accent:true,anga:'Drutam'}, {g:'clap',anga:'Drutam'},
      {g:'wave',anga:'Drutam'}, {g:'wave',anga:'Drutam'},
      {g:'clap',accent:true,anga:'Drutam'}, {g:'clap',anga:'Drutam'},
      {g:'wave',anga:'Drutam'}, {g:'wave',anga:'Drutam'},
    ],
  },
  rupaka3: {
    name:'Rūpaka Tāḷa · 3', short:'Rūpaka 3',
    detail:'Clap · Clap · Turn · 3 beats',
    groups:[3],
    beats:[
      {g:'clap',accent:true,anga:'Rūpaka'}, {g:'clap',anga:'Rūpaka'}, {g:'wave',anga:'Rūpaka'},
    ],
  },
  rupaka6: {
    name:'Rūpaka Tāḷa · 6', short:'Rūpaka 6',
    detail:'Drutam (2) + Laghu (4) · 6 beats',
    groups:[2,4],
    beats:[
      {g:'clap',accent:true,anga:'Drutam'}, {g:'wave',anga:'Drutam'},
      {g:'clap',accent:true,anga:'Laghu'}, {g:'c1',anga:'Laghu'}, {g:'c2',anga:'Laghu'}, {g:'c3',anga:'Laghu'},
    ],
  },
  mishra: {
    name:'Miśra Chāpu', short:'Miśra',
    detail:'3 + 2 + 2 · 7 beats',
    groups:[3,2,2],
    beats:[
      {g:'clap',accent:true,anga:'Chāpu'}, {g:'rest',anga:'Chāpu'}, {g:'rest',anga:'Chāpu'},
      {g:'clap',accent:true,anga:'Chāpu'}, {g:'rest',anga:'Chāpu'},
      {g:'wave',accent:true,anga:'Chāpu'}, {g:'rest',anga:'Chāpu'},
    ],
  },
  khanda: {
    name:'Khaṇḍa Chāpu', short:'Khaṇḍa',
    detail:'2 + 3 · 5 beats',
    groups:[2,3],
    beats:[
      {g:'clap',accent:true,anga:'Chāpu'}, {g:'rest',anga:'Chāpu'},
      {g:'clap',accent:true,anga:'Chāpu'}, {g:'rest',anga:'Chāpu'}, {g:'rest',anga:'Chāpu'},
    ],
  },
};

const PRESETS = [60,72,80,100,120,160,200];

let selected = 'adi', current = 0, running = false, timer = null;
const $ = s => document.querySelector(s);
const stage = () => $('.stage');

/* ---- per‑beat mute, persisted per tāla ---- */
let muted = load();
function load(){ try{ return JSON.parse(localStorage.getItem('talam-muted')) || {}; }catch(e){ return {}; } }
function save(){ localStorage.setItem('talam-muted', JSON.stringify(muted)); }
const mutedSet = key => new Set(muted[key] || []);
const isMuted = (key,i) => mutedSet(key).has(i);
function toggleMute(key,i){
  const s = mutedSet(key);
  s.has(i) ? s.delete(i) : s.add(i);
  muted[key] = [...s]; save();
}

/* group boundaries → which beat indices start a new anga */
function groupStarts(t){ const set=new Set(); let a=0; for(const g of t.groups){ set.add(a); a+=g; } return set; }

/* ---- rendering ---- */
function renderTalas(){
  $('#tala-grid').innerHTML = Object.entries(talas).map(([key,t])=>
    `<button class="tala-choice ${key===selected?'selected':''}" data-tala="${key}">${t.short}
       <span>${t.groups.join(' + ')}</span></button>`).join('');
  document.querySelectorAll('.tala-choice').forEach(b=>b.onclick=()=>selectTala(b.dataset.tala));
}

function renderPresets(){
  const bpm = Number($('#bpm').value);
  $('#tempo-presets').innerHTML = PRESETS.map(p=>
    `<button class="preset ${p===bpm?'on':''}" data-bpm="${p}">${p}</button>`).join('');
  document.querySelectorAll('.preset').forEach(b=>b.onclick=()=>changeTempo(b.dataset.bpm));
}

function renderSequence(){
  const t = talas[selected], starts = groupStarts(t);
  $('#sequence').innerHTML = t.beats.map((b,i)=>{
    const cls = ['beat', starts.has(i)?'group-start':'', b.accent?'accent':'', isMuted(selected,i)?'muted':''].join(' ').trim();
    return `<div class="${cls}" data-beat="${i}">
       <button class="num" data-beat="${i}">${i+1}<small>${GEST[b.g].tag}</small></button>
       <button class="mute-btn" data-mute="${i}" title="Mute this beat">${isMuted(selected,i)?'🔇':'🔊'}</button>
     </div>`;
  }).join('');
  document.querySelectorAll('.num').forEach(b=>b.onclick=()=>{ current=Number(b.dataset.beat); displayBeat(); });
  document.querySelectorAll('.mute-btn').forEach(b=>b.onclick=e=>{
    e.stopPropagation();
    const i = Number(b.dataset.mute);
    toggleMute(selected,i);
    renderSequence(); displayBeat();
  });
}

function selectTala(key){
  selected = key; current = 0;
  const t = talas[key];
  $('#talam-name').textContent = t.name;
  $('#talam-detail').textContent = t.detail;
  renderTalas(); renderSequence(); displayBeat();
}

/* ---- the star of the show: place the hand + count for the current beat ---- */
function displayBeat(){
  const t = talas[selected], total = t.beats.length, beat = t.beats[current];
  const g = GEST[beat.g], mutedNow = isMuted(selected, current);

  $('#anga-tag').textContent   = beat.anga;
  $('#gesture-icon').textContent = g.icon;
  $('#gesture-name').textContent = g.name;
  $('#gesture-sub').textContent  = mutedNow ? 'muted' : g.sub;
  $('#beat-num').textContent   = current+1;
  $('#beat-total').textContent = '/ '+total;

  // active beat highlight in the strip
  document.querySelectorAll('.beat').forEach((b,i)=>b.classList.toggle('active', i===current));

  // pose the hands — rebuild the class list, then re‑fire the hit pulse
  const st = stage();
  st.className = 'stage ' + g.pose + (mutedNow ? ' muted' : '');
  void st.offsetWidth;              // reflow so the flash / pop animations restart
  st.classList.add('hit');
}

/* ---- audio: metronome click ---- */
let audio = null, masterGain = null;
let clickVol = 1.0;                                   // scaled by the beat-volume slider

function ensureAudio(){
  if(audio) return;
  audio = new (window.AudioContext||window.webkitAudioContext)();
  masterGain = audio.createGain();
  masterGain.gain.value = 1;
  // a gentle limiter keeps the loud click punchy without harsh clipping
  const comp = audio.createDynamicsCompressor();
  comp.threshold.value = -3; comp.knee.value = 6; comp.ratio.value = 12;
  comp.attack.value = 0.002; comp.release.value = 0.12;
  masterGain.connect(comp); comp.connect(audio.destination);
}

function tick(){
  const beat = talas[selected].beats[current];
  displayBeat();
  if(!isMuted(selected, current)) click(beat.accent);
  current = (current+1) % talas[selected].beats.length;
}

/* A loud, punchy click: a pitched body plus a short high transient for snap. */
function click(accent){
  ensureAudio();
  const t = audio.currentTime;
  const body = audio.createOscillator(), bg = audio.createGain();
  body.type = 'triangle';
  body.frequency.setValueAtTime(accent ? 1100 : 720, t);
  const peak = (accent ? 0.95 : 0.55) * clickVol;
  bg.gain.setValueAtTime(0.0001, t);
  bg.gain.exponentialRampToValueAtTime(Math.max(0.0002, peak), t + 0.004);
  bg.gain.exponentialRampToValueAtTime(0.0006, t + (accent ? 0.13 : 0.09));
  body.connect(bg).connect(masterGain);
  body.start(t); body.stop(t + 0.16);

  const snap = audio.createOscillator(), sg = audio.createGain();
  snap.type = 'square';
  snap.frequency.setValueAtTime(accent ? 2300 : 1700, t);
  sg.gain.setValueAtTime(0.0001, t);
  sg.gain.exponentialRampToValueAtTime(Math.max(0.0002, 0.28 * clickVol), t + 0.002);
  sg.gain.exponentialRampToValueAtTime(0.0004, t + 0.03);
  snap.connect(sg).connect(masterGain);
  snap.start(t); snap.stop(t + 0.04);
}

/* ---- transport ---- */
function setRunning(v){
  running = v; clearInterval(timer);
  $('#play').querySelector('.play-icon').textContent = v ? '■' : '▶';
  $('#play-label').textContent = v ? 'Stop' : 'Start';
  if(v){ if(audio) audio.resume(); tick(); timer = setInterval(tick, 60000/Number($('#bpm').value)); }
}
function changeTempo(v){
  const bpm = Math.max(20, Math.min(400, Number(v)||80));
  $('#bpm').value = bpm; $('#bpm-number').value = bpm;
  renderPresets();
  if(running) setRunning(true);
}

$('#play').onclick = ()=> setRunning(!running);
$('#bpm').oninput = e => changeTempo(e.target.value);
$('#bpm-number').onchange = e => changeTempo(e.target.value);
document.addEventListener('keydown', e=>{
  const skip = ['INPUT','SELECT','TEXTAREA','BUTTON'].includes(e.target.tagName);
  if(e.code==='Space' && !skip){ e.preventDefault(); setRunning(!running); }
});

/* beat volume */
const beatVol = () => { clickVol = (Number($('#beat-vol').value)/100) * 1.6; };
$('#beat-vol').oninput = beatVol; beatVol();

renderTalas(); renderPresets(); renderSequence(); displayBeat();
