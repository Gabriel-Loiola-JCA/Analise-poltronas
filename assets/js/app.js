/* ══════════════════════════════════════════════════════════════
   INTERFACE · Estudo de Poltronas · Criado por Gabriel Loiola
   ══════════════════════════════════════════════════════════════ */
(function () {
'use strict';
const S = window.Seat, OUT = window.SeatOut, DB = window.SeatStore;
const $ = (q, r) => (r || document).querySelector(q);
const $$ = (q, r) => [...(r || document).querySelectorAll(q)];
const esc = v => String(v == null ? '' : v).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
const int = n => Number(n || 0).toLocaleString('pt-BR', { maximumFractionDigits: 0 });
const num = (n, d) => n == null || !Number.isFinite(+n) ? '—' : Number(n).toLocaleString('pt-BR', { minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 2 : d });
const pct = (n, d) => n == null || !Number.isFinite(+n) ? '—' : Number(n).toLocaleString('pt-BR', { style: 'percent', minimumFractionDigits: d || 0, maximumFractionDigits: d == null ? 1 : d });
const brl = n => n == null || !Number.isFinite(+n) ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(n);
const brl0 = n => n == null || !Number.isFinite(+n) ? '—' : new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL', maximumFractionDigits: 0 }).format(n);
const dt = iso => { if (!iso) return '—'; const p = String(iso).split('-'); return `${p[2]}/${p[1]}/${p[0]}`; };
const pl = (n, a, b) => Number(n) === 1 ? a : b;
const ico = n => `<svg aria-hidden="true"><use href="#s-${n}"/></svg>`;
const DOW = ['domingo', 'segunda', 'terça', 'quarta', 'quinta', 'sexta', 'sábado'];

const st = { ds: null, an: null, metric: 'volume', rank: 'advance', seat: null, layout: '',
  pal: 'verde', sort: { k: 'avgPct', asc: true }, sim: null, hist: [],
  /* preferências visuais — ver dlgCfg */
  inv: false, gamma: false, top5: true, tint: false, glow: true, pdfColor: true };

/* ══════════════════════════════════════════════════════════════
   PALETAS DO MAPA DE CALOR
   Só o mapa recebe cor. Cada escala tem quatro paradas, do vazio
   ao valor máximo, em versão escura e clara. O usuário escolhe a
   escala, pode invertê-la e pode pedir contraste reforçado.
   ══════════════════════════════════════════════════════════════ */
const PALS = {
  verde:  { name: 'Verde',  hint: 'Padrão. Boa leitura em tela escura.',
    dark: ['#25282a', '#245c33', '#4aa05c', '#84E79C'], light: ['#dee1dd', '#bfe3c7', '#5aad70', '#146A2E'] },
  teal:   { name: 'Teal',   hint: 'Alinhada à identidade da área.',
    dark: ['#25282a', '#20585b', '#3d9296', '#6FD9D4'], light: ['#dee1dd', '#bcdedd', '#55a5a6', '#0F5B5D'] },
  calor:  { name: 'Calor',  hint: 'Amarelo → vermelho. Máximo apelo visual.',
    dark: ['#25282a', '#5c4620', '#c07a2a', '#F2564A'], light: ['#dee1dd', '#f0d7a8', '#db8c36', '#B33322'] },
  azul:   { name: 'Azul',   hint: 'Sóbria, boa para apresentação.',
    dark: ['#25282a', '#204a70', '#3a86c0', '#7FC9F5'], light: ['#dee1dd', '#c0d9ec', '#4f93c7', '#0E4674'] },
  roxo:   { name: 'Roxo',   hint: 'Alto contraste sem competir com o verde.',
    dark: ['#25282a', '#42285f', '#7a4fb0', '#C39CF0'], light: ['#dee1dd', '#d7c9ea', '#9271c4', '#4F2681'] },
  ambar:  { name: 'Âmbar',  hint: 'Quente e contínua, sem virar vermelho.',
    dark: ['#25282a', '#4d3a16', '#a9772a', '#F5C766'], light: ['#dee1dd', '#f3e2b8', '#c99333', '#7A4E09'] },
  oceano: { name: 'Oceano', hint: 'Azul → verde-água. Escala perceptual suave.',
    dark: ['#25282a', '#1c4a63', '#2a8f96', '#7BE6C4'], light: ['#dee1dd', '#c2dfe4', '#3d94a0', '#0B4A55'] },
  magma:  { name: 'Magma',  hint: 'Roxo → laranja. Destaca bem o topo.',
    dark: ['#25282a', '#4a2044', '#a84148', '#F79E4F'], light: ['#dee1dd', '#e2cbdb', '#b25260', '#5B1B3F'] },
  cinza:  { name: 'Cinza',  hint: 'Sem cor. Ideal para imprimir em P&B.',
    dark: ['#25282a', '#454545', '#828282', '#E4E4E4'], light: ['#e6e6e3', '#c6c6c3', '#878783', '#262624'] }
};
const dark = () => document.documentElement.dataset.theme !== 'light';
/* paradas da escala já na ordem de desenho: invertida quando o usuário pede */
function stops() {
  const a = PALS[st.pal][dark() ? 'dark' : 'light'].map(hex);
  return st.inv ? a.slice().reverse() : a;
}
function hex(h) { let x = h.replace('#', ''); if (x.length === 3) x = x.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(x.slice(i, i + 2), 16)); }
/* curva opcional: puxa o meio para baixo e abre a diferença entre valores próximos */
const curve = t => st.gamma ? Math.pow(t, 1.7) : t;
function ramp(t, sp) {
  const v = curve(Math.max(0, Math.min(1, t))), p = v * (sp.length - 1), i = Math.min(sp.length - 2, Math.floor(p)), f = p - i;
  return sp[i].map((c, j) => Math.round(c + (sp[i + 1][j] - c) * f));
}
const rgb = a => `rgb(${a[0]},${a[1]},${a[2]})`;
const ink = a => (0.2126 * a[0] + 0.7152 * a[1] + 0.0722 * a[2]) > 148 ? '#0b0d0d' : '#f2f5f3';
const hexOf = a => a.map(v => v.toString(16).padStart(2, '0')).join('');

/* ── ajuda ──────────────────────────────────────────── */
const INFO = {
  rank: ['Rank médio', 'Rank médio significa a posição típica em que a poltrona é comprada dentro de uma viagem: 1 é a primeira vendida, 2 a segunda. É a média dessas posições em todas as viagens em que ela apareceu. Menor = vende antes.', 'rank médio = Σ posições ÷ viagens com a poltrona'],
  pct: ['Percentil de ordem', 'Normaliza o rank para comparar viagens cheias e vazias: 0% é a primeira poltrona vendida da viagem, 100% é a última.', 'percentil = (rank médio − 1) ÷ (poltronas vendidas − 1)'],
  advance: ['Antecedência', 'Dias entre a primeira compra da poltrona e a partida. Média e mediana aparecem juntas porque poucas compras muito antecipadas distorcem a média.', 'antecedência = (partida − 1ª compra) ÷ 86.400.000 ms'],
  coverage: ['Cobertura', 'Proporção das viagens do recorte em que a poltrona vendeu ao menos uma vez. Cada poltrona conta uma vez por viagem.', 'cobertura = viagens com a poltrona ÷ viagens'],
  heat: ['Mapa de calor', 'A cor mede a métrica escolhida. A escala é ancorada no maior valor do recorte: a poltrona líder fica na cor cheia e as outras ficam proporcionalmente mais fracas até desaparecer. As bolinhas ao lado trocam a escala; “Inverter” faz o oposto — quem vende mais fica quase transparente e a atenção vai para as poltronas fracas. Mais opções na engrenagem.', 'intensidade = valor ÷ maior valor do recorte'],
  score: ['Índice de oportunidade', 'Prioriza testes, não prevê receita: 50% cobertura + 35% precocidade + 15% frequência de primeira escolha.', 'índice = 0,50·cobertura + 0,35·(1 − percentil) + 0,15·1ª escolha'],
  sample: ['Amostra mínima', 'Viagens mínimas para a poltrona entrar nos rankings. Evita que uma venda isolada vire padrão. Abaixo do corte a poltrona ganha um ponto de alerta no mapa.', ''],
  layout: ['Planta do veículo', 'Detectada pelos números de poltrona e pela coluna classe: acima de 46 indica leito-cama, “DD” indica dois andares, o resto vira piso único. Trocar aqui recalcula tudo.', ''],
  days: ['Dias do período', 'Dias corridos do primeiro ao último dia de viagem, inclusive. Dias com viagem contam só as datas com saída válida.', ''],
  trips: ['Viagens', 'Um veículo, um dia, um horário. Com ID de viagem no CSV, ele manda; sem ele a chave é serviço + linha + data + hora + origem + destino.', ''],
  volume: ['Ocorrências', 'Cada poltrona conta uma vez por viagem. Revendas não inflam o volume.', ''],
  revenue: ['Receita', 'Soma dos valores válidos do recorte. Não entra em ranking algum — é contexto e base da simulação.', ''],
  ticket: ['Ticket médio', 'Receita dividida pelo número de bilhetes válidos do recorte.', ''],
  conf: ['Confiança', 'Alta: passou do corte e aparece em mais da metade das viagens. Adequada: passou do corte. Baixa: metade do corte. Insuficiente: não sustenta decisão.', ''],
  chartLead: ['Ritmo de compra', 'Cada barra é uma faixa de dias antes da partida. A clara mostra todas as compras; a destacada mostra só o top 5 ativo. Destaque à direita = essas poltronas saem antes.', ''],
  chartScatter: ['Cobertura × precocidade', 'Horizontal: em quantas viagens vendeu. Vertical: quão cedo sai na fila. O quadrante superior direito reúne as candidatas fortes.', ''],
  sim: ['Simulação de valores', 'Aplica um aumento percentual sobre a receita observada das poltronas escolhidas e mostra o ganho no período, por viagem e projetado em 12 meses — com a perda de vendas que o aumento suportaria.', 'nova receita = receita × (1 + aumento) × retenção'],
  simRank: ['Critério do top', 'Define quais poltronas entram no cenário: as de maior receita, as que vendem primeiro, as de maior antecedência ou as de maior índice.', ''],
  simRet: ['Retenção de demanda', 'Quanto da demanda atual permanece após o aumento. 100% é o cenário otimista (ninguém desiste). Como não há teste A/B nos dados, esse número é uma premissa sua — por isso ele fica explícito.', 'retenção = vendas após o aumento ÷ vendas atuais']
};
const tip = $('#tip'); let tipOwner = null;
function showTip(el) {
  const d = INFO[el.dataset.info]; if (!d) return;
  tipOwner = el;
  tip.innerHTML = `<b>${esc(d[0])}</b>${esc(d[1])}${d[2] ? `<code>${esc(d[2])}</code>` : ''}`;
  tip.hidden = false;
  const r = el.getBoundingClientRect(), m = 12;
  requestAnimationFrame(() => {
    const b = tip.getBoundingClientRect();
    let left = r.left + r.width / 2 - b.width / 2, top = r.bottom + 8;
    if (left + b.width > innerWidth - m) left = innerWidth - m - b.width;
    if (top + b.height > innerHeight - m) top = r.top - b.height - 8;
    tip.style.left = Math.max(m, left) + 'px'; tip.style.top = Math.max(m, top) + 'px';
    tip.classList.add('on');
  });
}
function hideTip() { tip.classList.remove('on'); tip.hidden = true; tipOwner = null; }
document.addEventListener('pointerover', e => { const b = e.target.closest('[data-info]'); if (b && b !== tipOwner) showTip(b); });
document.addEventListener('pointerout', e => { const b = e.target.closest('[data-info]'); if (b && !b.contains(e.relatedTarget)) hideTip(); });
document.addEventListener('focusin', e => { const b = e.target.closest('[data-info]'); if (b) showTip(b); });
document.addEventListener('focusout', e => { if (e.target.closest('[data-info]')) hideTip(); });
document.addEventListener('keydown', e => { if (e.key === 'Escape') hideTip(); });
addEventListener('scroll', () => { if (tipOwner) hideTip(); }, { passive: true });

/* ── tema e paleta (cache) ──────────────────────────── */
function setTheme(t, silent) {
  document.documentElement.dataset.theme = t;
  $('#themeIcon').innerHTML = `<use href="#s-${t === 'dark' ? 'sun' : 'moon'}"/>`;
  if (!silent) DB.setPref('tema', t);
  if (st.an) { paintSeats(); drawCharts(); renderTable(); renderMethod(); if ($('#dlgSim').open) renderSim(); }
}
/* A cor da paleta é publicada em --heat-*, sempre. A interface só a
   adota se o usuário ligar "tingir a interface" (data-tint=on). */
function applyAccent() {
  const sp = PALS[st.pal][dark() ? 'dark' : 'light'];
  /* para tingir a interface vale sempre a parada mais saturada,
     mesmo com a escala invertida — senão o tema ficaria lavado */
  const hi = sp[3];
  const r = document.documentElement.style;
  r.setProperty('--heat-hi', hi);
  r.setProperty('--heat-ink', ink(hex(hi)));
  r.setProperty('--heat-dim', hexToRgba(hi, dark() ? .16 : .14));
  r.setProperty('--heat-soft', hexToRgba(hi, dark() ? .07 : .05));
  document.documentElement.dataset.tint = st.tint ? 'on' : 'off';
  document.documentElement.dataset.glow = st.glow ? 'on' : 'off';
}
function hexToRgba(h, a) { const c = hex(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }
/* redesenha tudo que depende da escala */
function repaint() {
  if (!st.an) return;
  paintSeats(); drawCharts(); renderTable(); renderPodium(); renderMethod();
  if ($('#dlgSim').open) renderSim();
}
function setPal(p, silent) {
  st.pal = PALS[p] ? p : 'verde';
  if (!silent) DB.setPref('paleta', st.pal);
  applyAccent();
  syncPalUI();
  repaint();
}
function setInvert(v, silent) {
  st.inv = !!v;
  if (!silent) DB.setPref('inverter', st.inv);
  applyAccent();
  syncPalUI();
  repaint();
}
/* mantém em sincronia os dois lugares que escolhem paleta:
   as bolinhas na barra do mapa e os cartões dentro de Ajustes */
function syncPalUI() {
  $$('#palPick button[data-pal]').forEach(b => b.classList.toggle('on', b.dataset.pal === st.pal));
  $$('#cfgPal .palcard').forEach(b => b.classList.toggle('on', b.dataset.pal === st.pal));
  const inv = $('#btnInvert');
  if (inv) { inv.classList.toggle('on', st.inv); inv.setAttribute('aria-pressed', String(st.inv)); }
  const c = $('#cfgInvert'); if (c) c.setAttribute('aria-pressed', String(st.inv));
  renderCfgPreview();
}
function buildPal() {
  const host = $('#palPick');
  $$('#palPick button[data-pal]', host).forEach(b => b.remove());
  const first = host.querySelector('[data-fixed]');
  Object.entries(PALS).forEach(([k, v]) => {
    const sp = v[dark() ? 'dark' : 'light'];
    const b = document.createElement('button');
    b.type = 'button'; b.dataset.pal = k;
    b.title = `Escala do mapa: ${v.name}`;
    b.setAttribute('aria-label', `Paleta ${v.name}`);
    b.style.background = `linear-gradient(135deg,${sp[1]},${sp[3]})`;
    host.insertBefore(b, first);
  });
  buildCfgPal();
  syncPalUI();
}
(function boot() {
  const p = DB.prefs();
  st.pal = PALS[p.paleta] ? p.paleta : 'verde';
  st.inv = p.inverter === true;
  st.gamma = p.contraste === true;
  st.top5 = p.marcarTop5 !== false;
  st.tint = p.tingir === true;
  st.glow = p.brilho !== false;
  st.pdfColor = p.pdfCor !== false;
  applyAccent();
  setTheme(p.tema === 'light' ? 'light' : 'dark', true);
  st.metric = p.metric || 'volume';
  st.rank = p.rank || 'advance';
})();
$('#btnTheme').addEventListener('click', () => { setTheme(dark() ? 'light' : 'dark'); applyAccent(); buildPal(); syncCfg(); });

/* ══════════════════════════════════════════════════════════════
   AJUSTES · tudo persistido em localStorage via SeatStore
   ══════════════════════════════════════════════════════════════ */
function buildCfgPal() {
  const host = $('#cfgPal'); if (!host) return;
  host.innerHTML = Object.entries(PALS).map(([k, v]) => {
    const sp = v[dark() ? 'dark' : 'light'];
    const g = st.inv ? [...sp].reverse() : sp;
    return `<button class="palcard" type="button" data-pal="${k}">
      <i class="swatch" style="background:linear-gradient(90deg,${g.join(',')})"></i>
      <span>${esc(v.name)}<em>${k === st.pal ? 'em uso' : ''}</em></span>
      <em style="font-weight:500">${esc(v.hint)}</em>
    </button>`;
  }).join('');
}
function renderCfgPreview() {
  const host = $('#cfgPreview'); if (!host) return;
  const sp = stops();
  host.innerHTML = Array.from({ length: 10 }, (_, i) => {
    const c = ramp(i / 9, sp);
    return `<i style="background:${rgb(c)}"></i>`;
  }).join('');
  const h = $('#cfgScaleHint');
  if (h) h.textContent = st.inv
    ? 'Invertido: a poltrona que mais vende fica quase transparente e as fracas ganham a cor cheia — útil para caçar ociosidade.'
    : 'Normal: a poltrona líder do recorte recebe a cor cheia e as demais desbotam proporcionalmente.';
  const cards = $('#cfgPal');
  if (cards) $$('.palcard .swatch', cards).forEach((el, i) => {
    const v = Object.values(PALS)[i], s = v[dark() ? 'dark' : 'light'];
    el.style.background = `linear-gradient(90deg,${(st.inv ? [...s].reverse() : s).join(',')})`;
  });
}
/* espelha o estado nos interruptores */
function syncCfg() {
  const set = (id, v) => { const el = $(id); if (el) el.setAttribute('aria-pressed', String(!!v)); };
  set('#cfgInvert', st.inv); set('#cfgGamma', st.gamma); set('#cfgTop5', st.top5);
  set('#cfgTint', st.tint); set('#cfgLight', !dark()); set('#cfgGlow', st.glow);
  set('#cfgPdfColor', st.pdfColor);
  document.documentElement.dataset.top5 = st.top5 ? 'on' : 'off';
  const s = $('#cfgStorage');
  if (s) s.textContent = `${st.hist.length} ${pl(st.hist.length, 'estudo salvo', 'estudos salvos')} neste navegador · preferências em localStorage.`;
  buildCfgPal(); renderCfgPreview();
}
function openCfg() { syncCfg(); $('#dlgCfg').showModal(); }
$('#btnCfg').addEventListener('click', openCfg);
$('#btnMapCfg').addEventListener('click', openCfg);
$('#btnInvert').addEventListener('click', () => setInvert(!st.inv));
$('#cfgPal').addEventListener('click', e => {
  const b = e.target.closest('[data-pal]'); if (b) { setPal(b.dataset.pal); buildCfgPal(); syncPalUI(); }
});
$('#cfgInvert').addEventListener('click', () => { setInvert(!st.inv); syncCfg(); });
$('#cfgGamma').addEventListener('click', () => {
  st.gamma = !st.gamma; DB.setPref('contraste', st.gamma); syncCfg(); repaint();
});
$('#cfgTop5').addEventListener('click', () => {
  st.top5 = !st.top5; DB.setPref('marcarTop5', st.top5); syncCfg();
});
$('#cfgTint').addEventListener('click', () => {
  st.tint = !st.tint; DB.setPref('tingir', st.tint); applyAccent(); syncCfg();
});
$('#cfgLight').addEventListener('click', () => { setTheme(dark() ? 'light' : 'dark'); applyAccent(); buildPal(); syncCfg(); });
$('#cfgGlow').addEventListener('click', () => {
  st.glow = !st.glow; DB.setPref('brilho', st.glow); applyAccent(); syncCfg();
});
$('#cfgPdfColor').addEventListener('click', () => {
  st.pdfColor = !st.pdfColor; DB.setPref('pdfCor', st.pdfColor); syncCfg();
});
$('#cfgClear').addEventListener('click', () => {
  try { localStorage.removeItem('poltronas:prefs:v4'); } catch (e) {}
  toast('Preferências limpas', 'Os estudos salvos continuam no histórico. Recarregue para ver o padrão.');
});

/* ── overlay / avisos ───────────────────────────────── */
function load(t, d, p, phase) {
  $('#load').hidden = false; $('#loadTitle').textContent = t || 'Processando…';
  $('#loadDetail').textContent = d || ''; if (phase) $('#loadPhase').textContent = phase;
  prog(p == null ? 0 : p);
}
function prog(p, d) {
  const v = Math.max(0, Math.min(1, +p || 0));
  $('#loadBar').style.width = (v * 100) + '%'; $('#loadPct').textContent = Math.round(v * 100) + '%';
  if (d != null) $('#loadDetail').textContent = d;
}
const unload = () => { $('#load').hidden = true; };
function toast(t, m, err) {
  const el = document.createElement('div');
  el.className = 'toast' + (err ? ' err' : '');
  el.innerHTML = `<div><b>${esc(t)}</b><span>${esc(m || '')}</span></div>`;
  $('#toasts').appendChild(el);
  setTimeout(() => { el.style.transition = 'opacity .3s'; el.style.opacity = '0'; setTimeout(() => el.remove(), 320); }, 4800);
}

/* ── animação de número ─────────────────────────────── */
function countUp(el, to, fmt, ms) {
  const from = Number(el.dataset.v || 0), t0 = performance.now(), dur = ms || 700;
  el.dataset.v = to;
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) { el.textContent = fmt(to); return; }
  function step(t) {
    const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 3);
    el.textContent = fmt(from + (to - from) * e);
    if (k < 1) requestAnimationFrame(step);
  }
  requestAnimationFrame(step);
}

/* ── leitura de arquivos ────────────────────────────── */
async function handle(files) {
  const list = [...(files || [])].filter(f => /\.(csv|txt)$/i.test(f.name));
  if (!list.length) { toast('Arquivo não reconhecido', 'Selecione um CSV ou TXT.', true); return; }
  load('Lendo o arquivo…', 'Conferindo o cabeçalho', 0, 'Importação local');
  try {
    const parts = [];
    for (let i = 0; i < list.length; i++) {
      $('#loadTitle').textContent = list.length > 1 ? `Lendo ${i + 1} de ${list.length}` : `Lendo ${list[i].name}`;
      parts.push(await S.parseFile(list[i], { onProgress: u => {
        const w = u.total ? u.loaded / u.total : 0;
        prog((i + w) / list.length * .85, `${int(u.rows)} linhas · ${Math.round(w * 100)}%`);
      } }));
    }
    prog(.9, 'Consolidando viagens…');
    st.ds = parts.length === 1 ? parts[0] : S.merge(parts, `${parts.length} arquivos`);
    st.layout = ''; st.sim = null;
    run(true);
    prog(1, 'Pronto'); setTimeout(unload, 180);
    toast('Análise concluída', `${int(st.an.summary.events)} eventos em ${int(st.an.period.tripCount)} viagens.`);
  } catch (e) { unload(); toast('Não consegui analisar', e && e.message ? e.message : String(e), true); }
  finally { $('#file').value = ''; }
}

function opts(reset) {
  if (reset) return { layout: st.layout || null };
  return {
    layout: st.layout || null,
    start: $('#from').value || null, end: $('#to').value || null,
    minTrips: Math.max(1, Number($('#minN').value) || 1),
    service: $('#fService').value || null, channel: $('#fChannel').value || null,
    klass: $('#fClass').value || null, route: $('#fRoute').value || null,
    dow: $('#fWeek').value === '' ? null : Number($('#fWeek').value),
    minOcc: Number($('#fOcc').value) || 0, lead: $('#fLead').value || 'all'
  };
}
function run(reset) {
  const an = S.analyze(st.ds, opts(reset));
  st.an = an;
  if (!st.layout) st.layout = an.layout;
  $('#enter').hidden = true; $('#dash').hidden = false;
  $$('.dash').forEach(b => b.hidden = false);
  $('#hstatus').textContent = '· ' + (an.sourceName || '');
  if (reset) {
    $('#from').value = an.period.start || ''; $('#to').value = an.period.end || '';
    $('#from').min = $('#to').min = an.period.start || '';
    $('#from').max = $('#to').max = an.period.end || '';
    $('#minN').value = an.minN;
    fillLayouts(); fillFacets();
  }
  const t = activeTop();
  st.seat = t[0] ? t[0].seat : ((an.seats.find(s => s.appear) || an.seats[0]).seat);
  renderAll();
  if (reset) scrollTo({ top: 0, behavior: 'smooth' });
}
function fillLayouts() {
  $('#layout').innerHTML = Object.values(S.LAYOUTS).map(l =>
    `<option value="${l.id}"${l.id === st.layout ? ' selected' : ''}>${esc(l.name)}</option>`).join('');
}
function fillFacets() {
  const f = st.ds.facets || {};
  const opt = (o, lbl, fmt) => `<option value="">${lbl}</option>` + Object.entries(o || {})
    .sort((a, b) => b[1] - a[1]).filter(([k]) => k).slice(0, 200)
    .map(([k, n]) => `<option value="${esc(k)}">${esc(fmt ? fmt(k) : k)} (${int(n)})</option>`).join('');
  $('#fService').innerHTML = opt(f.services, 'Todos os serviços');
  $('#fChannel').innerHTML = opt(f.channels, 'Todos os canais');
  $('#fClass').innerHTML = opt(f.classes, 'Todas as classes');
  $('#fRoute').innerHTML = opt(f.routes, 'Todos os trechos');
  $('#fWeek').innerHTML = '<option value="">Todos os dias</option>' + DOW.map((d, i) => `<option value="${i}">${d}</option>`).join('');
  $('#fOcc').innerHTML = '<option value="0">Qualquer ocupação</option>' + [5, 10, 15, 20, 30].map(n => `<option value="${n}">a partir de ${n} poltronas</option>`).join('');
  $('#fLead').innerHTML = '<option value="all">Todas as compras</option><option value="w0">até 3 dias antes</option>' +
    '<option value="w1">3 a 7 dias antes</option><option value="w2">7 a 30 dias antes</option><option value="w3">30 dias ou mais</option>';
}
function activeTop() { return activeList().slice(0, 5); }
function activeList() {
  const a = st.an;
  return st.rank === 'advance' ? a.topLead10 : st.rank === 'first' ? a.top10 : a.topVolume10;
}

/* ── render ─────────────────────────────────────────── */
function renderAll() {
  renderSource(); renderNarrative(); renderKpis(); renderPodium();
  renderMap(); drawCharts(); renderTable(); renderMethod(); renderQuality(); reveal();
}
function renderSource() {
  const a = st.an;
  $('#srcName').textContent = a.sourceName || 'Base';
  $('#srcMeta').textContent = `${dt(a.period.start)} a ${dt(a.period.end)} · ${int(a.period.tripCount)} viagens`;
  $('#ver').textContent = `v${a.version} · ${S.LAYOUTS[a.layout].badge}`;
  $('#deckBadge').textContent = S.LAYOUTS[a.layout].badge;
}
function renderNarrative() {
  const a = st.an, p = a.period, c = a.champFirst, l = a.leadTop, m = a.mostSold;
  if (!c || !c.first) {
    $('#narr').textContent = 'Sem amostra suficiente neste recorte.'; $('#narrSub').textContent = ''; return;
  }
  $('#narr').innerHTML = `Nesse período de <b>${int(p.calendarDays)} ${pl(p.calendarDays, 'dia', 'dias')}</b>, com <b>${int(p.tripCount)} ${pl(p.tripCount, 'viagem', 'viagens')}</b>, a poltrona <b>${c.seat}</b> foi comprada primeiro <b>${int(c.first)} ${pl(c.first, 'vez', 'vezes')}</b> — ${pct(p.tripCount ? c.first / p.tripCount : 0, 1)} das viagens.`;
  const bits = [];
  if (l) bits.push(`Maior antecedência: poltrona ${l.seat}, ${num(l.avgLead, 1)} dias (mediana ${num(l.medLead, 1)}).`);
  if (m) bits.push(`Mais vendida: ${m.seat}, em ${int(m.appear)} viagens (${pct(m.coverage, 0)}) e ${brl0(m.revenue)} de receita.`);
  bits.push(`Receita do recorte: ${brl0(a.summary.revenue)} · ticket médio ${brl(a.summary.avgTicket)}.`);
  $('#narrSub').textContent = bits.join(' ');
}
function renderKpis() {
  const a = st.an, p = a.period, s = a.summary, l = a.leadTop;
  const K = [
    { l: 'Período', i: 'days', v: `${int(p.calendarDays)} dias`, c: `${int(p.serviceDays)} dias com viagem` },
    { l: 'Viagens', i: 'trips', v: int(p.tripCount), c: `${num(s.perTrip, 1)} poltronas por viagem` },
    { l: 'Ocupação', i: 'coverage', v: pct(s.occupancy, 0), c: `${int(s.soldSeats)}/${int(s.layoutSeats)} poltronas vendidas` },
    { l: 'Receita', i: 'revenue', sm: 1, v: brl0(s.revenue), c: `${brl(s.revPerTrip)} por viagem` },
    { l: 'Ticket médio', i: 'ticket', sm: 1, v: brl(s.avgTicket), c: `${int(s.events)} bilhetes` },
    { l: 'Maior antecedência', i: 'advance', hi: 1, v: l ? 'Poltrona ' + l.seat : '—', c: l ? `${num(l.avgLead, 1)} dias antes` : 'amostra insuficiente' }
  ];
  $('#kpis').innerHTML = K.map(k => `<article class="kpi${k.hi ? ' hi' : ''}${k.sm ? ' sm' : ''}">
    <div class="k"><span class="lbl">${esc(k.l)}</span><button class="i" data-info="${k.i}" type="button" aria-label="Explicar">i</button></div>
    <div class="v">${k.v}</div><div class="c">${esc(k.c)}</div></article>`).join('');
}
function renderPodium() {
  const a = st.an, mode = st.rank, top = activeTop();
  $$('#rankSwitch button').forEach(b => { const on = b.dataset.rank === mode; b.classList.toggle('on', on); b.setAttribute('aria-selected', on); });
  const T = { advance: ['Top 5 · maior antecedência', 'compradas com <b>mais antecedência</b>', 'Média de dias entre a primeira compra e a partida.'],
    first: ['Top 5 · vendem primeiro', 'que <b>saem primeiro na fila</b>', 'Menor percentil médio de ordem de compra dentro da viagem.'],
    volume: ['Top 5 · mais vendidas', 'com <b>maior volume</b>', 'Presença em mais viagens distintas do recorte.'] }[mode];
  $('#topKicker').textContent = T[0];
  $('#topTitle').innerHTML = 'As cinco poltronas ' + T[1];
  $('#topLead').textContent = `${T[2]} Exige ao menos ${int(a.minN)} viagens por poltrona.`;
  $('#chRankTitle').textContent = { advance: 'Top 10 · antecedência média', first: 'Top 10 · precocidade', volume: 'Top 10 · volume' }[mode];
  $('#chRankHint').textContent = { advance: 'Barra proporcional aos dias antes da partida.', first: 'Barra proporcional a 1 − percentil médio.', volume: 'Barra proporcional às viagens com venda.' }[mode];
  $('#legTop5').textContent = T[0];
  if (!top.length) { $('#podium').innerHTML = '<div class="pod"><p style="color:var(--muted);font-size:12px">Nenhuma poltrona atingiu a amostra mínima. Reduza o corte ou amplie o período.</p></div>'; return; }
  const best = mode === 'advance' ? Math.max(...top.map(s => s.avgLead || 0)) : mode === 'volume' ? Math.max(...top.map(s => s.appear || 0)) : 1;
  $('#podium').innerHTML = top.map((s, i) => {
    const low = s.conf === 'Baixa' || s.conf === 'Insuficiente';
    const w = mode === 'advance' ? (best ? s.avgLead / best * 100 : 0) : mode === 'volume' ? (best ? s.appear / best * 100 : 0) : (1 - s.avgPct) * 100;
    const big = mode === 'advance' ? [num(s.avgLead, 1), 'dias', 'antes da partida']
      : mode === 'volume' ? [int(s.appear), 'viagens', pct(s.coverage, 0) + ' de cobertura']
      : [pct(1 - s.avgPct, 0), 'precocidade', 'percentil ' + pct(s.avgPct, 1)];
    return `<article class="pod${i === 0 ? ' first' : ''}" data-seat-go="${s.seat}">
      <span class="pos">${String(i + 1).padStart(2, '0')}</span>
      <div class="num">${s.seat}</div>
      <div class="loc">${ico(s.position === 'Janela' ? 'window' : 'aisle')}${esc(s.position)}</div>
      <div class="locsub">${esc(s.side)} · fileira ${s.col}</div>
      <div class="big">${big[0]}<span>${big[1]}</span></div>
      <div class="cap">${esc(big[2])}</div>
      <div class="bar"><i style="width:${Math.max(2, Math.min(100, w))}%"></i></div>
      <div class="mini">
        <div><small>Viagens</small><b>${int(s.appear)}</b></div>
        <div><small>${mode === 'advance' ? 'Mediana' : 'Rank médio'}</small><b>${mode === 'advance' ? num(s.medLead, 1) + ' d' : num(s.avgRank, 2)}</b></div>
        <div><small>Receita</small><b>${brl0(s.revenue)}</b></div>
        <div><small>Ticket médio</small><b>${brl(s.avgRev)}</b></div>
      </div>
      <span class="flag${low ? ' low' : ''}">${esc(s.conf)}</span>
    </article>`;
  }).join('');
}

/* ── métricas do mapa ───────────────────────────────── */
const METRICS = {
  volume: { label: 'Volume de vendas', rel: true, get: s => s.appear,
    desc: 'Viagens distintas com aquela poltrona vendida. Quanto mais vendida, mais intensa a cor.',
    low: () => 'sem venda', high: a => `${int(mx(a, 'volume'))} viagens`,
    show: s => s.appear ? `${int(s.appear)} de ${int(st.an.period.tripCount)} viagens · ${pct(s.coverage, 1)}` : 'Sem venda' },
  early: { label: 'Vende primeiro', rel: false, get: s => s.avgPct == null ? null : 1 - s.avgPct,
    desc: 'Posição média na fila de vendas da viagem. Mais intensa = sai mais cedo.',
    low: () => 'vende por último', high: () => 'vende primeiro',
    show: s => s.avgPct == null ? 'Sem ordem' : `precocidade ${pct(1 - s.avgPct, 1)} · percentil ${pct(s.avgPct, 1)}` },
  lead: { label: 'Antecedência', rel: true, get: s => s.avgLead,
    desc: 'Média de dias entre a primeira compra e a partida.',
    low: () => '0 dias', high: a => `${num(mx(a, 'lead'), 1)} dias`,
    show: s => s.avgLead == null ? 'Sem partida válida' : `${num(s.avgLead, 1)} dias · mediana ${num(s.medLead, 1)}` },
  first: { label: '1ª escolha', rel: true, get: s => s.firstRate,
    desc: 'Frequência com que foi a primeira compra da viagem, com empates rateados.',
    low: () => 'nunca', high: a => pct(mx(a, 'first'), 1) + ' das viagens',
    show: s => `${int(s.first)} ${pl(s.first, 'vez', 'vezes')} em 1º · ${num(s.firstCredit, 2)} créditos` },
  revenue: { label: 'Receita', rel: true, get: s => s.revenue,
    desc: 'Receita acumulada da poltrona no recorte — base da simulação de preço.',
    low: () => 'R$ 0', high: a => brl0(mx(a, 'revenue')),
    show: s => `${brl(s.revenue)} · ticket ${brl(s.avgRev)}` },
  score: { label: 'Índice', rel: true, get: s => s.score,
    desc: 'Cobertura, precocidade e primeira escolha combinadas para priorizar testes.',
    low: () => 'índice 0', high: a => 'índice ' + num(mx(a, 'score') * 100, 0),
    show: s => s.score == null ? 'Sem índice' : `índice ${num(s.scorePct, 1)}/100` }
};
const mx = (a, m) => Math.max(0, ...a.seats.map(s => METRICS[m].get(s) || 0));

function renderMap() {
  const a = st.an, L = S.LAYOUTS[a.layout];
  $$('#metricSwitch button').forEach(b => b.classList.toggle('on', b.dataset.metric === st.metric));
  $('#mapDesc').textContent = METRICS[st.metric].desc + ' ' + a.detected.why;
  $('#orientTop').textContent = L.topSide;
  $('#rear').innerHTML = L.rear.map(r => `<div>${esc(r)}</div>`).join('');
  $('#rail').innerHTML = [1, 2, 0, 3, 4].map(l => l === 0
    ? '<div class="band" style="background:none;border:0"></div>'
    : `<div title="${l === 1 || l === 4 ? 'Janela' : 'Corredor'}">${ico(l === 1 || l === 4 ? 'window' : 'aisle')}</div>`).join('');
  const g = $('#seatGrid');
  g.style.gridTemplateColumns = `repeat(${L.columns}, minmax(0,1fr))`;
  let extra = `<div class="band">${esc(L.band)}</div>`;
  if (L.stairCol) extra += `<div class="stair" style="grid-column:${L.stairCol}" title="Escada">${ico('stairs')}<span>ESCADA</span></div>`;
  if (L.wcCol) extra += `<div class="wc" style="grid-row:1;grid-column:${L.wcCol}" title="Sanitário">${ico('wc')}</div>`;
  g.innerHTML = extra;
  a.seats.forEach(s => {
    const b = document.createElement('button');
    b.type = 'button'; b.className = 'seat'; b.dataset.seat = s.seat;
    b.style.gridRow = s.gridRow; b.style.gridColumn = s.col;
    b.innerHTML = `${s.seat}<svg class="ico" aria-hidden="true"><use href="#s-${s.position === 'Janela' ? 'window' : 'aisle'}"/></svg>`;
    b.addEventListener('click', () => { st.seat = s.seat; paintSeats(); });
    g.appendChild(b);
  });
  paintSeats();
}
function paintSeats() {
  const a = st.an, M = METRICS[st.metric], sp = stops();
  const top = new Set(activeTop().map(s => s.seat));
  const max = M.rel ? Math.max(...a.seats.map(s => M.get(s) || 0), 0) : 1;
  $('#legLow').textContent = M.low(a);
  $('#legHigh').textContent = M.high(a);
  $('#legTrack').style.background = `linear-gradient(90deg,${sp.map((c, i) => `${rgb(c)} ${(i / (sp.length - 1) * 100).toFixed(0)}%`).join(',')})`;
  a.seats.forEach(s => {
    const el = $(`.seat[data-seat="${s.seat}"]`); if (!el) return;
    const raw = M.get(s), has = s.appear > 0 && raw != null;
    const t = has ? (M.rel ? (max ? raw / max : 0) : raw) : null;
    if (has) { const c = ramp(t, sp); el.style.background = rgb(c); el.style.color = ink(c); }
    else { el.style.background = 'var(--seat-empty)'; el.style.color = 'var(--seat-empty-ink)'; }
    el.classList.toggle('top5', top.has(s.seat));
    el.classList.toggle('note', !!s.note);
    el.classList.toggle('sel', st.seat === s.seat);
    const warn = s.appear > 0 && s.appear < a.minN;
    const old = el.querySelector('.pin'); if (old) old.remove();
    if (warn) { const i = document.createElement('span'); i.className = 'pin'; i.textContent = '!'; el.appendChild(i); }
    el.setAttribute('aria-label', `Poltrona ${s.seat}, ${s.position}, ${s.side}. ${M.show(s)}`);
    el.title = `Poltrona ${s.seat} · ${s.position} · ${s.side}\n${M.show(s)}\n${brl(s.revenue)} de receita${s.note ? '\n' + s.note : ''}`;
  });
  renderInspector();
}
function renderInspector() {
  const a = st.an, s = a.seats.find(x => x.seat === st.seat) || a.seats[0], el = $('#insp');
  if (!s || !s.appear) { el.innerHTML = `<div class="empty"><span class="lbl">Poltrona ${s ? s.seat : '—'}</span><p>Sem venda no recorte.</p></div>`; return; }
  const okc = s.conf === 'Alta' || s.conf === 'Adequada';
  el.innerHTML = `
    <div class="hd"><span class="n">${s.seat}</span><div><small>Poltrona</small>
      <b>${ico(s.position === 'Janela' ? 'window' : 'aisle')}${esc(s.position)}</b>
      <small style="text-transform:none;letter-spacing:0;font-size:10px">${esc(s.side)} · fileira ${s.col}</small></div></div>
    ${s.note ? `<div class="nt"><span>${esc(s.note)}</span></div>` : ''}
    <div class="hero"><small>${esc(METRICS[st.metric].label)}</small><b>${esc(METRICS[st.metric].show(s))}</b></div>
    <div class="gr">
      <div><small>Viagens</small><b>${int(s.appear)} de ${int(a.period.tripCount)}</b></div>
      <div><small>Cobertura</small><b>${pct(s.coverage, 1)}</b></div>
      <div><small>Rank médio</small><b>${num(s.avgRank, 2)}</b></div>
      <div><small>Percentil</small><b>${pct(s.avgPct, 1)}</b></div>
      <div><small>Antecedência</small><b>${num(s.avgLead, 1)} dias</b></div>
      <div><small>Mediana</small><b>${num(s.medLead, 1)} dias</b></div>
      <div><small>1ª ou empate</small><b>${int(s.first)}×</b></div>
      <div><small>Índice</small><b>${num(s.scorePct, 1)}/100</b></div>
      <div><small>Receita</small><b>${brl0(s.revenue)}</b></div>
      <div><small>Ticket médio</small><b>${brl(s.avgRev)}</b></div>
      <div><small>Bilhetes</small><b>${int(s.revN)}</b></div>
      <div><small>Canal</small><b>${esc(s.channel || '—')}</b></div>
    </div>
    <span class="conf${okc ? ' ok' : ''}" data-info="conf">Confiança ${esc(s.conf)}</span>
    <button class="gh solid simbtn" id="inspSim" type="button">${ico('sim')}Simular só a ${s.seat}</button>`;
  const b = $('#inspSim');
  if (b) b.addEventListener('click', () => openSim({ scope: 'one', seat: s.seat }));
}

/* ── gráficos ───────────────────────────────────────── */
const SHORT = ['≤1d', '1–2d', '2–3d', '3–5d', '5–7d', '1–2sem', '2–4sem', '1–2mês', '2mês+'];
function drawCharts() { chartLead(); chartScatter(); chartRank(); }
function chartLead() {
  const a = st.an, all = a.dayBuckets, n = all.length;
  const top = new Array(n).fill(0);
  activeTop().forEach(s => s.buckets.forEach((v, i) => top[i] += v));
  const sA = all.reduce((x, y) => x + y, 0) || 1, sT = top.reduce((x, y) => x + y, 0) || 1;
  const A = all.map(v => v / sA), T = top.map(v => v / sT);
  const raw = Math.max(...A, ...T, .05), max = Math.min(1, Math.ceil(raw * 10) / 10);
  const ticks = []; for (let v = 0; v <= max + 1e-9; v += max > .2 ? .1 : .05) ticks.push(v / max);
  const W = 640, H = 330, L = 42, R = 8, Tp = 10, B = 48, iw = W - L - R, ih = H - Tp - B;
  const gw = iw / n, bw = Math.min(19, gw * .32);
  let g = '';
  ticks.forEach(v => { const y = Tp + ih - v * ih;
    g += `<line class="gl" x1="${L}" y1="${y}" x2="${W - R}" y2="${y}"/><text x="${L - 7}" y="${y + 3}" text-anchor="end">${Math.round(v * max * 100)}%</text>`; });
  for (let i = 0; i < n; i++) {
    const cx = L + gw * (i + .5), hA = A[i] / max * ih, hT = T[i] / max * ih;
    g += `<g><title>${esc(a.bucketLabels[i])} — todas: ${pct(A[i], 1)} · top 5: ${pct(T[i], 1)}</title>` +
      `<rect class="barB" x="${cx - bw - 2}" y="${Tp + ih - hA}" width="${bw}" height="${Math.max(0, hA)}"/>` +
      `<rect class="barA" x="${cx + 2}" y="${Tp + ih - hT}" width="${bw}" height="${Math.max(0, hT)}"/></g>` +
      `<text x="${cx}" y="${Tp + ih + 17}" text-anchor="middle">${SHORT[i]}</text>`;
  }
  g += `<line class="ax" x1="${L}" y1="${Tp + ih}" x2="${W - R}" y2="${Tp + ih}"/>`;
  g += `<text x="${L + iw / 2}" y="${H - 8}" text-anchor="middle">dias entre a compra e a partida</text>`;
  $('#chLead').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Compras por antecedência">${g}</svg>`;
}
function chartScatter() {
  const a = st.an, pts = a.seats.filter(s => s.appear && s.avgPct != null);
  const top = new Set(activeTop().map(s => s.seat));
  const W = 640, H = 400, L = 48, R = 12, T = 12, B = 52, iw = W - L - R, ih = H - T - B;
  const x = v => L + v * iw, y = v => T + (1 - v) * ih;
  let g = `<rect class="qd" x="${x(.5)}" y="${y(1)}" width="${iw / 2}" height="${ih / 2}"/>`;
  [0, .25, .5, .75, 1].forEach(v => {
    g += `<line class="gl" x1="${x(v)}" y1="${T}" x2="${x(v)}" y2="${T + ih}"/><text x="${x(v)}" y="${H - 30}" text-anchor="middle">${Math.round(v * 100)}%</text>`;
    g += `<line class="gl" x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}"/><text x="${L - 8}" y="${y(v) + 3}" text-anchor="end">${Math.round(v * 100)}%</text>`;
  });
  g += `<line class="ax" x1="${L}" y1="${T + ih}" x2="${W - R}" y2="${T + ih}"/><line class="ax" x1="${L}" y1="${T}" x2="${L}" y2="${T + ih}"/>`;
  g += `<text x="${L + iw / 2}" y="${H - 8}" text-anchor="middle">cobertura</text>`;
  g += `<text transform="translate(13 ${T + ih / 2}) rotate(-90)" text-anchor="middle">precocidade</text>`;
  const cs = getComputedStyle(document.documentElement);
  const acc = cs.getPropertyValue('--acc').trim(), dim = cs.getPropertyValue('--dim').trim();
  pts.forEach(s => {
    const hot = top.has(s.seat), r = 4 + Math.sqrt(s.appear) * .5;
    g += `<circle class="bub" cx="${x(s.coverage).toFixed(1)}" cy="${y(1 - s.avgPct).toFixed(1)}" r="${r.toFixed(1)}" fill="${hot ? acc : dim}" fill-opacity="${hot ? .92 : .33}" stroke="${hot ? acc : dim}"><title>Poltrona ${s.seat}: ${pct(s.coverage, 1)} das viagens · precocidade ${pct(1 - s.avgPct, 1)} · ${brl0(s.revenue)}</title></circle>`;
    if (hot) g += `<text x="${x(s.coverage).toFixed(1)}" y="${(y(1 - s.avgPct) + 3).toFixed(1)}" text-anchor="middle" style="font-size:8.5px;font-weight:800;fill:var(--acc-ink);pointer-events:none">${s.seat}</text>`;
  });
  $('#chScatter').innerHTML = `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Cobertura por precocidade">${g}</svg>`;
}
function chartRank() {
  const mode = st.rank, list = activeList();
  if (!list.length) { $('#chRank').innerHTML = '<p style="color:var(--muted);font-size:11.5px">Sem poltronas acima da amostra mínima.</p>'; return; }
  const max = mode === 'advance' ? Math.max(...list.map(s => s.avgLead || 0)) : mode === 'volume' ? Math.max(...list.map(s => s.appear || 0)) : 1;
  $('#chRank').innerHTML = list.map((s, i) => {
    const v = mode === 'advance' ? s.avgLead : mode === 'volume' ? s.appear : 1 - s.avgPct;
    const w = mode === 'first' ? v * 100 : (max ? v / max * 100 : 0);
    const lab = mode === 'advance' ? num(s.avgLead, 1) + ' d' : mode === 'volume' ? int(s.appear) : pct(1 - s.avgPct, 0);
    return `<div class="rowbar${i < 5 ? ' top' : ''}" data-seat-go="${s.seat}"><span class="rk">${i + 1}º</span><span class="sn">${s.seat}</span>
      <div class="tk"><i style="width:${Math.max(2, Math.min(100, w))}%"></i></div><span class="vv">${lab}</span></div>`;
  }).join('');
}

/* ── tabela ─────────────────────────────────────────── */
const COLS = [
  { k: 'seat', t: 'Poltrona' }, { k: 'position', t: 'Posição' }, { k: 'appear', t: 'Viagens' },
  { k: 'avgLead', t: 'Antec.' }, { k: 'avgPct', t: 'Percentil' }, { k: 'first', t: '1ª escolha' },
  { k: 'revenue', t: 'Receita' }, { k: 'scorePct', t: 'Índice' }
];
function renderTable() {
  const a = st.an, q = ($('#seatSearch').value || '').trim(), sp = stops();
  const max = Math.max(...a.seats.map(s => s.appear), 1);
  const { k, asc } = st.sort;
  const rows = a.seats.filter(s => s.appear && (!q || String(s.seat).includes(q))).sort((x, y) => {
    const A = x[k], B = y[k];
    if (A == null && B == null) return 0; if (A == null) return 1; if (B == null) return -1;
    if (typeof A === 'string') return asc ? A.localeCompare(B) : B.localeCompare(A);
    return asc ? A - B : B - A;
  });
  $('#table').innerHTML = `<div class="head">${COLS.map(c => `<span data-sort="${c.k}" class="${k === c.k ? 's' + (asc ? ' asc' : '') : ''}">${c.t}</span>`).join('')}</div>` +
    (rows.length ? rows.map(s => {
      const c = ramp(s.appear / max, sp), low = s.conf === 'Baixa' || s.conf === 'Insuficiente';
      return `<div class="row" data-seat-go="${s.seat}">
        <span class="c n"><i style="background:${rgb(c)}"></i>${s.seat}</span>
        <span class="c">${ico(s.position === 'Janela' ? 'window' : 'aisle')}${esc(s.position)} · ${esc(s.side)}</span>
        <span class="c">${int(s.appear)} <em style="font-style:normal;color:${low ? 'var(--warn)' : 'var(--dim)'}">· ${esc(s.conf)}</em></span>
        <span class="c">${num(s.avgLead, 1)} d</span>
        <span class="c">${pct(s.avgPct, 1)}</span>
        <span class="c">${int(s.first)} / ${num(s.firstCredit, 2)}</span>
        <span class="c">${brl0(s.revenue)}</span>
        <span class="c">${num(s.scorePct, 1)}</span></div>`;
    }).join('') : '<div class="row"><span class="c">Nada encontrado.</span></div>');
}

/* ── método e qualidade ─────────────────────────────── */
function renderMethod() {
  const a = st.an, l = a.leadTop, f = a.top10[0], m = a.mostSold, sp = stops();
  const boxes = [0, .25, .5, .75, 1].map(t => { const c = ramp(t, sp); return `<span style="background:${rgb(c)};color:${ink(c)}">${Math.round(t * 100)}</span>`; }).join('');
  const cards = [
    ['01', 'Viagem e primeira compra', `<p>As vendas são agrupadas por viagem — um veículo, um dia, um horário — pelo ID quando existe, senão por serviço, linha, data, hora, origem e destino. A poltrona conta uma vez por viagem, pela primeira compra; revendas ficam à parte.</p><code>chave = serviço | linha | data | hora | origem | destino</code><p>Recorte atual: <b>${int(a.period.tripCount)} viagens</b>.</p>`],
    ['02', 'Rank e percentil', `<p>Dentro da viagem, as poltronas são ordenadas pelo instante da primeira compra. O rank médio é a média dessas posições. O percentil normaliza viagens cheias e vazias.</p><code>percentil = (rank médio − 1) ÷ (vendidas − 1)</code>${f ? `<p>Ex.: poltrona ${f.seat} · rank médio ${num(f.avgRank, 2)} em ${int(f.appear)} viagens → percentil ${pct(f.avgPct, 1)}.</p>` : ''}`],
    ['03', 'Antecedência e empates', `<p>Antecedência é a distância de calendário até a partida; média e mediana andam juntas porque compras muito antecipadas distorcem a média.</p><code>antecedência = (partida − 1ª compra) ÷ 86.400.000</code><p>Horários iguais recebem rank médio e o crédito de primeira escolha é rateado. Aqui foram <b>${int(a.summary.tiesFirst)} viagens</b> com empate na primeira posição.${l ? ` Ex.: poltrona ${l.seat}, média ${num(l.avgLead, 1)} d e mediana ${num(l.medLead, 1)} d.` : ''}</p>`],
    ['04', 'Mapa de calor', `<p>A cor traduz a métrica escolhida, ancorada no maior valor do recorte: a líder recebe a cor cheia e as demais vão perdendo cor proporcionalmente.</p><code>intensidade = valor ÷ maior valor</code><div class="scaleboxes">${boxes}</div><p style="margin-top:8px">${m ? `Âncora atual: poltrona <b>${m.seat}</b>, ${int(m.appear)} viagens.` : ''} A paleta é sua escolha e fica salva no navegador.</p>`],
    ['05', 'Índice e simulação', `<p>O índice prioriza testes; a simulação estima o efeito financeiro de um reajuste sobre a receita observada.</p>
      <div class="weights"><div class="wrow"><span>Cobertura</span><div class="tk"><i style="width:50%"></i></div><span class="vv">50%</span></div>
      <div class="wrow"><span>Precocidade</span><div class="tk"><i style="width:35%"></i></div><span class="vv">35%</span></div>
      <div class="wrow"><span>1ª escolha</span><div class="tk"><i style="width:15%"></i></div><span class="vv">15%</span></div></div>
      <code>nova receita = receita × (1 + aumento) × retenção</code><p>A perda de vendas tolerável é 1 − 1/(1+aumento): acima disso o reajuste destrói receita.</p>`],
    ['06', 'Limites', `<p>Estudo observacional com amostra mínima de <b>${int(a.minN)} viagens</b> por poltrona. Uma poltrona pode vender cedo por conforto, por aparecer primeiro na tela de venda ou por regra de canal.</p><p>${esc(S.LAYOUTS[a.layout].ctx)}</p><p>Use como hipótese para um teste controlado — nunca como justificativa isolada de reajuste.</p>`]
  ];
  $('#method').innerHTML = cards.map(c => `<article class="mcard"><span class="st">${c[0]}</span><h3>${esc(c[1])}</h3>${c[2]}</article>`).join('');
}
function renderQuality() {
  const a = st.an, q = a.quality || {};
  const cards = [
    { v: q.rawRows, l: 'linhas lidas' }, { v: q.valid, l: 'eventos válidos' },
    { v: (q.codeSeat || 0) + (q.badSeat || 0), l: 'poltronas não numéricas', w: (q.codeSeat + q.badSeat) > 0 },
    { v: q.offLayout, l: 'fora da planta', w: q.offLayout > 0 },
    { v: q.afterDeparture, l: 'vendas após a partida', w: q.afterDeparture > 0 },
    { v: q.noSaleTime, l: 'sem data de venda', w: q.noSaleTime > 0 },
    { v: q.dup, l: 'duplicados' }, { v: q.tiesFirst, l: 'empates na 1ª' }
  ];
  $('#qual').innerHTML = cards.map(c => `<article class="qcard${c.w ? ' w' : ''}"><span class="lbl">${esc(c.l)}</span><b>${int(c.v || 0)}</b></article>`).join('');
  const n = [];
  if (q.coarse / Math.max(1, q.valid) > .8) n.push('Mais de 80% das vendas têm horário de hora cheia: empates são esperados e foram rateados.');
  if (q.offLayout) n.push(`${int(q.offLayout)} ocorrências citam poltronas fora da planta “${S.LAYOUTS[a.layout].badge}”. Se o número for alto, troque a planta.`);
  if (q.afterDeparture) n.push(`${int(q.afterDeparture)} vendas após o horário de partida foram isoladas.`);
  if (a.summary.singles) n.push(`${int(a.summary.singles)} viagens com uma única poltrona vendida entram no volume, mas não no percentil.`);
  if (a.summary.droppedTrips) n.push(`${int(a.summary.droppedTrips)} viagens ficaram fora pelo filtro de ocupação mínima.`);
  if (a.period.depMissing) n.push(`${int(a.period.depMissing)} viagens sem hora de partida não entram na antecedência.`);
  if (q.noRevenue) n.push(`${int(q.noRevenue)} registros sem valor: eles contam no volume, mas não na receita nem na simulação.`);
  n.push(`Recorte: ${dt(a.period.start)} a ${dt(a.period.end)} · amostra mínima ${int(a.minN)} · planta ${S.LAYOUTS[a.layout].badge}.`);
  $('#qnotes').innerHTML = n.map(x => `<div><i>—</i><span>${esc(x)}</span></div>`).join('');
}

/* ══════ SIMULADOR ══════ */
const sim = { scope: '3', seat: null, rank: 'volume', pct: 10, ret: 100, from: '', to: '' };
function openSim(pre) {
  if (!st.an) return;
  if (pre && pre.scope) { sim.scope = pre.scope; if (pre.seat) sim.seat = pre.seat; }
  if (pre && pre.rank) sim.rank = pre.rank;
  if (!sim.from) { sim.from = $('#from').value || st.an.period.start || ''; sim.to = $('#to').value || st.an.period.end || ''; }
  $('#simFrom').value = sim.from; $('#simTo').value = sim.to;
  $('#simSeat').innerHTML = st.an.seats.filter(s => s.appear).map(s =>
    `<option value="${s.seat}"${s.seat === (sim.seat || st.seat) ? ' selected' : ''}>Poltrona ${s.seat} · ${esc(s.position)} · ${brl0(s.revenue)}</option>`).join('');
  if (!sim.seat) sim.seat = st.seat;
  $('#simRank').value = sim.rank;
  $('#simPct').value = sim.pct; $('#simPctTxt').textContent = '+' + sim.pct + '%';
  $('#simRet').value = sim.ret; $('#simRetTxt').textContent = sim.ret + '%';
  $$('#simScope .chip').forEach(c => c.classList.toggle('on', c.dataset.scope === sim.scope));
  $$('#simPreset .chip').forEach(c => c.classList.toggle('on', Number(c.dataset.pct) === sim.pct));
  $$('#simScen .chip').forEach(c => c.classList.toggle('on', Number(c.dataset.ret) === sim.ret));
  $('#simSeatWrap').hidden = sim.scope !== 'one';
  $('#dlgSim').showModal();
  renderSim();
}
function simBase() {
  const o = Object.assign({}, opts(false), { start: sim.from || null, end: sim.to || null });
  return S.analyze(st.ds, o);
}
function simSeats(an) {
  if (sim.scope === 'one') { const s = an.seats.find(x => x.seat === Number(sim.seat)); return s ? [s] : []; }
  const n = Number(sim.scope) || 5;
  const list = sim.rank === 'volume' ? an.topRevenue10 : sim.rank === 'first' ? an.top10 : sim.rank === 'advance' ? an.topLead10 : an.byScore;
  const out = list.slice(0, n);
  return out.length ? out : an.seats.filter(s => s.appear).sort((a, b) => b.revenue - a.revenue).slice(0, n);
}
function renderSim() {
  const an = simBase();
  const seats = simSeats(an);
  const r = S.simulate(an, { pct: sim.pct, ret: sim.ret, seats });
  st.sim = { r, an, seats };
  $('#simSub').textContent = `${dt(an.period.start)} a ${dt(an.period.end)} · ${int(an.period.tripCount)} viagens · ${seats.length} ${pl(seats.length, 'poltrona', 'poltronas')} no cenário`;
  const maxBar = Math.max(r.base, r.novo, 1);
  const curveMax = Math.max(...r.curve.map(c => Math.abs(c.v)), 1);
  $('#simOut').innerHTML = `
    <div class="bigres">
      <div><small>Receita atual</small><b id="rBase">—</b><span>${int(r.tickets)} bilhetes na seleção</span></div>
      <div><small>Com +${sim.pct}%</small><b class="acc" id="rNovo">—</b><span>retenção de ${sim.ret}% da demanda</span></div>
      <div><small>Ganho no período</small><b class="${r.delta >= 0 ? 'up' : 'dn'}" id="rDelta">—</b><span>${pct(r.deltaPct, 1)} sobre a seleção</span></div>
      <div><small>Projeção 12 meses</small><b class="${r.perYear >= 0 ? 'up' : 'dn'}" id="rYear">—</b><span>${brl(r.perDay)} por dia</span></div>
    </div>
    <div class="simchart">
      <h4>Receita da seleção · antes e depois</h4>
      <div class="cmp">
        <div class="cmprow"><span>Hoje</span><div class="tk"><i class="a" data-w="${(r.base / maxBar * 100).toFixed(1)}"></i></div><span class="vv">${brl0(r.base)}</span></div>
        <div class="cmprow"><span>Simulado</span><div class="tk"><i class="b" data-w="${(r.novo / maxBar * 100).toFixed(1)}"></i></div><span class="vv" style="color:var(--acc)">${brl0(r.novo)}</span></div>
      </div>
      <h4 style="margin-top:16px">Sensibilidade — ganho por percentual de aumento</h4>
      <div class="cmp">${r.curve.filter(c => c.p > 0).map(c => `<div class="cmprow"><span>+${c.p}%</span>
        <div class="tk"><i class="${c.p === sim.pct ? 'b' : 'a'}" data-w="${(Math.abs(c.v) / curveMax * 100).toFixed(1)}"></i></div>
        <span class="vv"${c.p === sim.pct ? ' style="color:var(--acc)"' : ''}>${brl0(c.v)}</span></div>`).join('')}</div>
    </div>
    <div class="simtbl">
      <div class="r h"><span>Nº</span><span>Posição</span><span>Viagens</span><span>Ticket médio</span><span>Receita hoje</span><span>Ganho</span></div>
      ${r.seats.map((x, i) => `<div class="r${i < 3 ? ' t' : ''}"><span>${x.seat}</span><span>${esc(x.position)} · ${esc(x.side)}</span>
        <span>${int(x.appear)}</span><span>${brl(x.avgRev)}</span><span>${brl0(x.base)}</span>
        <span style="color:var(--acc);font-weight:800">+${brl0(x.delta)}</span></div>`).join('')}
    </div>
    <div class="simnote">A seleção representa <b>${pct(r.share, 1)}</b> da receita do recorte, então o impacto no total é de <b>${pct(r.totalDeltaPct, 2)}</b> (${brl0(r.totalBase)} → ${brl0(r.totalNovo)}).
      Com +${sim.pct}% a operação suporta perder até <b>${pct(r.breakEven, 1)}</b> das vendas dessas poltronas antes de empatar com a receita de hoje.
      Cenário determinístico sobre dados observados: não estima elasticidade nem reação da concorrência.</div>`;
  countUp($('#rBase'), r.base, v => brl0(v));
  countUp($('#rNovo'), r.novo, v => brl0(v), 900);
  countUp($('#rDelta'), r.delta, v => (v >= 0 ? '+' : '') + brl0(v), 900);
  countUp($('#rYear'), r.perYear, v => (v >= 0 ? '+' : '') + brl0(v), 1000);
  requestAnimationFrame(() => $$('#simOut .tk i').forEach(i => { i.style.width = i.dataset.w + '%'; }));
}

/* ══════ HISTÓRICO ══════ */
function snapshot(an) {
  const keep = s => ({ seat: s.seat, position: s.position, side: s.side, col: s.col, appear: s.appear,
    coverage: s.coverage, avgLead: s.avgLead, medLead: s.medLead, leadN: s.leadN, avgRank: s.avgRank,
    avgPct: s.avgPct, first: s.first, firstCredit: s.firstCredit, revenue: s.revenue, avgRev: s.avgRev,
    revN: s.revN, scorePct: s.scorePct, conf: s.conf, buckets: s.buckets, note: s.note });
  return { version: an.version, sourceName: an.sourceName, layout: an.layout, layoutBadge: an.layoutBadge,
    generatedAt: an.generatedAt, period: an.period, summary: an.summary, minN: an.minN, filters: an.filters,
    dayBuckets: an.dayBuckets, bucketLabels: an.bucketLabels, seats: an.seats.map(keep),
    top10: an.top10.map(keep), topLead10: an.topLead10.map(keep), topVolume10: an.topVolume10.map(keep),
    champFirst: an.champFirst ? keep(an.champFirst) : null, leadTop: an.leadTop ? keep(an.leadTop) : null,
    mostSold: an.mostSold ? keep(an.mostSold) : null, quality: an.quality, detected: an.detected };
}
function askSave() {
  if (!st.an) return;
  const a = st.an;
  const guess = `${a.sourceName.replace(/\.(csv|txt)$/i, '')} · ${dt(a.period.start)} a ${dt(a.period.end)}`;
  $('#saveName').value = guess;
  $('#saveHint').textContent = `${S.LAYOUTS[a.layout].badge} · ${int(a.period.tripCount)} viagens · ${brl0(a.summary.revenue)} · amostra mínima ${int(a.minN)}`;
  $('#dlgSave').showModal();
  setTimeout(() => { $('#saveName').focus(); $('#saveName').select(); }, 60);
}
async function doSave() {
  const name = ($('#saveName').value || '').trim();
  if (!name) { toast('Dê um nome', 'O estudo precisa de um nome para ficar no histórico.', true); return; }
  const a = st.an;
  const rec = { id: 'e' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36),
    name, savedAt: new Date().toISOString(), layout: a.layout, source: a.sourceName,
    snap: snapshot(a), filters: a.filters, sim: st.sim ? st.sim.r : null };
  try {
    await DB.put(rec);
    $('#dlgSave').close();
    toast('Estudo salvo', `“${name}” está no histórico deste navegador.`);
    loadHist();
  } catch (e) { toast('Não deu para salvar', e.message || String(e), true); }
}
async function loadHist() { try { st.hist = await DB.all(); } catch (e) { st.hist = []; } }
async function openHist() {
  await loadHist();
  const layouts = [...new Set(st.hist.map(h => h.layout))];
  $('#histLayout').innerHTML = '<option value="">Todas as plantas</option>' +
    layouts.map(l => `<option value="${l}">${esc(S.LAYOUTS[l] ? S.LAYOUTS[l].badge : l)}</option>`).join('');
  $('#dlgHist').showModal();
  renderHist();
}
function histFiltered() {
  const q = ($('#histQ').value || '').trim().toLowerCase();
  const lay = $('#histLayout').value, f = $('#histFrom').value, t = $('#histTo').value, sort = $('#histSort').value;
  let list = st.hist.filter(h => {
    if (lay && h.layout !== lay) return false;
    const d = String(h.savedAt).slice(0, 10);
    if (f && d < f) return false;
    if (t && d > t) return false;
    if (q) {
      const hay = `${h.name} ${h.source} ${h.snap.layoutBadge} ${(h.filters && h.filters.service) || ''} ${(h.filters && h.filters.channel) || ''}`.toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });
  list.sort((a, b) => sort === 'name' ? a.name.localeCompare(b.name)
    : sort === 'trips' ? b.snap.period.tripCount - a.snap.period.tripCount
    : sort === 'rev' ? (b.snap.summary.revenue || 0) - (a.snap.summary.revenue || 0)
    : String(b.savedAt).localeCompare(String(a.savedAt)));
  return list;
}
function renderHist() {
  const list = histFiltered();
  $('#histSub').textContent = `${int(st.hist.length)} ${pl(st.hist.length, 'estudo salvo', 'estudos salvos')} · ${int(list.length)} no filtro`;
  if (!st.hist.length) {
    $('#histCharts').innerHTML = '';
    $('#histList').innerHTML = '<div class="histempty">Nenhum estudo salvo ainda. Analise um CSV e use <b>Salvar estudo</b>.</div>';
    return;
  }
  $('#histCharts').innerHTML = histCharts(list);
  $('#histList').innerHTML = `<div class="hrow h"><span>Estudo</span><span>Viagens</span><span>Ocupação</span><span>Receita</span><span>Líder</span><span></span></div>` +
    (list.length ? list.map(h => {
      const s = h.snap, l = s.leadTop || s.top10[0];
      return `<div class="hrow"><div><b>${esc(h.name)}</b><small>${esc(s.layoutBadge)} · ${dt(s.period.start)} a ${dt(s.period.end)} · salvo em ${new Date(h.savedAt).toLocaleDateString('pt-BR')}</small></div>
        <span class="v">${int(s.period.tripCount)}</span><span class="v">${pct(s.summary.occupancy, 0)}</span>
        <span class="v">${brl0(s.summary.revenue)}</span><span class="v">${l ? 'nº ' + l.seat : '—'}</span>
        <span class="acts"><button class="gh" data-open="${h.id}" type="button">Abrir</button><button class="gh" data-del="${h.id}" type="button">Excluir</button></span></div>`;
    }).join('') : '<div class="histempty">Nenhum estudo bate com o filtro.</div>');
  requestAnimationFrame(() => $$('#histCharts .tk i').forEach(i => { i.style.width = i.dataset.w + '%'; }));
}
function histCharts(list) {
  if (!list.length) return '';
  const rev = list.map(h => h.snap.summary.revenue || 0);
  const occ = list.map(h => h.snap.summary.occupancy || 0);
  const maxR = Math.max(...rev, 1), maxO = Math.max(...occ, .0001);
  const ordered = [...list].sort((a, b) => String(a.savedAt).localeCompare(String(b.savedAt)));
  const W = 640, H = 150, L = 8, R = 8, T = 10, B = 26, iw = W - L - R, ih = H - T - B;
  const pts = ordered.map((h, i) => {
    const x = ordered.length > 1 ? L + i / (ordered.length - 1) * iw : L + iw / 2;
    const y = T + ih - (h.snap.summary.occupancy || 0) / maxO * ih;
    return { x, y, h };
  });
  const line = pts.map((p, i) => `${i ? 'L' : 'M'}${p.x.toFixed(1)} ${p.y.toFixed(1)}`).join(' ');
  const area = `${line} L${pts[pts.length - 1].x.toFixed(1)} ${T + ih} L${pts[0].x.toFixed(1)} ${T + ih} Z`;
  const cs = getComputedStyle(document.documentElement), acc = cs.getPropertyValue('--acc').trim();
  return `<div class="charts" style="margin-bottom:14px">
    <article class="chart"><h3>Receita por estudo</h3><p class="hint">Comparação direta entre os estudos filtrados.</p>
      <div class="cmp">${list.slice(0, 8).map(h => `<div class="cmprow"><span>${esc(h.name.slice(0, 12))}</span>
        <div class="tk"><i class="b" data-w="${(h.snap.summary.revenue / maxR * 100).toFixed(1)}"></i></div>
        <span class="vv">${brl0(h.snap.summary.revenue)}</span></div>`).join('')}</div></article>
    <article class="chart"><h3>Ocupação ao longo dos estudos</h3><p class="hint">Na ordem em que foram salvos.</p>
      <svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Ocupação por estudo">
        <line class="gl" x1="${L}" y1="${T}" x2="${W - R}" y2="${T}"/><line class="ax" x1="${L}" y1="${T + ih}" x2="${W - R}" y2="${T + ih}"/>
        <path class="area" d="${area}" fill="${acc}" fill-opacity=".14"/>
        <path d="${line}" fill="none" stroke="${acc}" stroke-width="2"/>
        ${pts.map(p => `<circle class="bub" cx="${p.x.toFixed(1)}" cy="${p.y.toFixed(1)}" r="4" fill="${acc}"><title>${esc(p.h.name)}: ${pct(p.h.snap.summary.occupancy, 1)}</title></circle>`).join('')}
        <text x="${L}" y="${H - 8}">mais antigo</text><text x="${W - R}" y="${H - 8}" text-anchor="end">mais recente</text>
        <text x="${L + 2}" y="${T + 10}">máx ${pct(maxO, 0)}</text>
      </svg></article></div>`;
}
async function openStudy(id) {
  const rec = st.hist.find(h => h.id === id) || await DB.get(id);
  if (!rec) { toast('Estudo não encontrado', '', true); return; }
  const s = rec.snap;
  const an = Object.assign({}, s, {
    layoutName: (S.LAYOUTS[s.layout] || {}).name, layoutCtx: (S.LAYOUTS[s.layout] || {}).ctx,
    byScore: [...s.seats].filter(x => x.scorePct != null).sort((a, b) => b.scorePct - a.scorePct).slice(0, 10),
    topRevenue10: [...s.seats].filter(x => x.appear).sort((a, b) => b.revenue - a.revenue).slice(0, 10),
    revSeries: [], detected: s.detected || { why: 'Estudo restaurado do histórico.' }
  });
  st.an = an; st.layout = s.layout; st.ds = st.ds || null;
  $('#dlgHist').close();
  $('#enter').hidden = true; $('#dash').hidden = false;
  $$('.dash').forEach(b => b.hidden = false);
  $('#hstatus').textContent = '· ' + rec.name;
  $('#from').value = s.period.start || ''; $('#to').value = s.period.end || ''; $('#minN').value = s.minN;
  fillLayouts();
  const t = activeTop(); st.seat = t[0] ? t[0].seat : (an.seats.find(x => x.appear) || an.seats[0]).seat;
  renderAll();
  toast('Estudo aberto', `“${rec.name}” — métricas restauradas do histórico.` + (st.ds ? '' : ' Recarregue o CSV para mudar filtros.'));
  scrollTo({ top: 0, behavior: 'smooth' });
}

/* ══════ EVENTOS ══════ */
$('#btnPick').addEventListener('click', e => { e.stopPropagation(); $('#file').click(); });
$('#file').addEventListener('change', e => handle(e.target.files));
$('#drop').addEventListener('click', e => { if (!e.target.closest('button')) $('#file').click(); });
$('#drop').addEventListener('keydown', e => { if ((e.key === 'Enter' || e.key === ' ') && !e.target.closest('button')) { e.preventDefault(); $('#file').click(); } });
['dragenter', 'dragover'].forEach(t => $('#drop').addEventListener(t, e => { e.preventDefault(); $('#drop').classList.add('on'); }));
['dragleave', 'drop'].forEach(t => $('#drop').addEventListener(t, e => { e.preventDefault(); $('#drop').classList.remove('on'); }));
$('#drop').addEventListener('drop', e => handle(e.dataTransfer.files));
$('#btnDemo').addEventListener('click', () => {
  load('Gerando demonstração…', '60 viagens sintéticas', .4, 'Demonstração');
  setTimeout(() => {
    try { st.ds = S.parseText(demoCsv(), 'Demonstração.csv'); st.layout = ''; run(true); prog(1); setTimeout(unload, 160);
      toast('Demonstração carregada', 'Números fictícios, só para conhecer o painel.'); }
    catch (e) { unload(); toast('Falha', e.message, true); }
  }, 50);
});
function demoCsv() {
  const rows = ['Data Venda,Hora Venda,N° Bilhete,poltrona,Receita R$,codServico,codLinha,nomeLinha,Data Viagem,Hora Viagem,classe,Origem,Destino,Tipo Venda,canal'];
  const base = new Date(2026, 0, 5, 21, 30), fav = [19, 1, 3, 20, 2, 4, 23, 5, 43, 44];
  const chans = ['INTERNET', 'AG. PRÓPRIA', 'CLUBE GIRO', 'OUTLET'];
  for (let t = 0; t < 60; t++) {
    const dep = new Date(base.getTime() + t * 2 * 86400000);
    const di = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    const rest = Array.from({ length: 46 }, (_, i) => i + 1).filter(s => !fav.includes(s));
    for (let i = rest.length - 1; i > 0; i--) { const j = (t * 7 + i * 13) % (i + 1); const x = rest[i]; rest[i] = rest[j]; rest[j] = x; }
    [...fav, ...rest].slice(0, 16 + (t % 26)).forEach((seat, p) => {
      const lead = Math.max(.2, 26 - p * .55 + ((t + seat) % 5) * .8);
      const sold = new Date(dep.getTime() - lead * 86400000);
      const hh = String(7 + ((p + t) % 14)).padStart(2, '0');
      rows.push(`${di(sold)},1899-12-30 ${hh}:00:00,D${t + 1}-${seat},${seat},${(118 + seat * 1.6 + (p % 5) * 4).toFixed(2)},40618,4142,"SAO PAULO (SP) - RIO DE JANEIRO (RJ)",${di(dep)},21:30,SEMI LEITO - DD,SAO PAULO - SP,RIO DE JANEIRO - RJ,Venda,${chans[(t + p) % 4]}`);
    });
  }
  return rows.join('\r\n');
}
function apply() {
  if (!st.ds) { toast('Base indisponível', 'Este estudo veio do histórico. Recarregue o CSV para mudar filtros.', true); return; }
  if ($('#from').value && $('#to').value && $('#from').value > $('#to').value) { toast('Período inválido', 'A data inicial precisa vir antes da final.', true); return; }
  load('Recalculando…', 'Aplicando filtros', .35, 'Atualização');
  setTimeout(() => { try { run(false); prog(1); setTimeout(unload, 130); } catch (e) { unload(); toast('Não deu para aplicar', e.message, true); } }, 30);
}
$('#btnApply').addEventListener('click', apply);
$('#btnMore').addEventListener('click', () => {
  const h = $('#moreRow').hidden;
  $('#moreRow').hidden = !h;
  $('#btnMore').textContent = h ? '− Filtros' : '+ Filtros';
});
$('#btnClear').addEventListener('click', () => {
  ['fService', 'fChannel', 'fClass', 'fRoute', 'fWeek'].forEach(id => $('#' + id).value = '');
  $('#fOcc').value = '0'; $('#fLead').value = 'all';
  apply();
});
['from', 'to', 'minN', 'layout', 'fService', 'fChannel', 'fClass', 'fRoute', 'fWeek', 'fOcc', 'fLead'].forEach(id => {
  $('#' + id).addEventListener('change', e => { if (id === 'layout') st.layout = e.target.value; apply(); });
});
$('#rankSwitch').addEventListener('click', e => {
  const b = e.target.closest('[data-rank]'); if (!b || b.dataset.rank === st.rank) return;
  st.rank = b.dataset.rank; DB.setPref('rank', st.rank);
  const t = activeTop(); if (t[0]) st.seat = t[0].seat;
  renderPodium(); paintSeats(); drawCharts();
});
$('#metricSwitch').addEventListener('click', e => {
  const b = e.target.closest('[data-metric]'); if (!b) return;
  st.metric = b.dataset.metric; DB.setPref('metric', st.metric);
  $$('#metricSwitch button').forEach(x => x.classList.toggle('on', x === b));
  $('#mapDesc').textContent = METRICS[st.metric].desc + ' ' + st.an.detected.why;
  paintSeats();
});
$('#palPick').addEventListener('click', e => { const b = e.target.closest('[data-pal]'); if (b) setPal(b.dataset.pal); });
$('#seatSearch').addEventListener('input', renderTable);
$('#table').addEventListener('click', e => {
  const h = e.target.closest('[data-sort]');
  if (h) { const k = h.dataset.sort; st.sort = { k, asc: st.sort.k === k ? !st.sort.asc : (k === 'avgPct' || k === 'seat' || k === 'position') }; renderTable(); }
});
document.addEventListener('click', e => {
  const go = e.target.closest('[data-seat-go]');
  if (go && !e.target.closest('dialog')) {
    st.seat = Number(go.dataset.seatGo); paintSeats();
    $('#secMapa').scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  const c = e.target.closest('[data-close]');
  if (c) $('#' + c.dataset.close).close();
});
$('#btnXls').addEventListener('click', () => {
  try {
    OUT.xlsx(st.an, { title: 'Estudo de Poltronas', topSeats: activeTop(), sim: st.sim ? st.sim.r : null,
      filename: `estudo-poltronas_${st.an.period.start || 'inicio'}_a_${st.an.period.end || 'fim'}.xlsx` });
    toast('XLSX gerado', 'Resumo, poltronas, ritmo, simulação e metodologia.');
  } catch (e) { toast('Falha no XLSX', e.message || String(e), true); }
});
/* O PDF sai sempre no tema claro (papel). A escala segue as mesmas
   escolhas do painel: paleta, inversão e contraste. */
function pdfRamp() {
  const src = st.pdfColor ? PALS[st.pal] : PALS.cinza;
  const sp = st.inv ? [...src.light].reverse() : src.light;
  return sp.map(h => h.replace('#', ''));
}
$('#btnPdf').addEventListener('click', () => {
  try {
    const r = pdfRamp();
    OUT.pdf(st.an, { title: 'Estudo de Poltronas', topSeats: activeTop(), sim: st.sim ? st.sim.r : null,
      ramp: r, acc: '1A1A18', invert: st.inv, gamma: st.gamma,
      filename: `estudo-poltronas_${st.an.period.start || 'inicio'}_a_${st.an.period.end || 'fim'}.pdf` });
    toast('PDF gerado', `Resumo, mapa de calor${st.inv ? ' (escala invertida)' : ''}, base completa` + (st.sim ? ' e simulação.' : '.'));
  } catch (e) { toast('Falha no PDF', e.message || String(e), true); }
});
$('#btnReset').addEventListener('click', () => {
  st.ds = st.an = null; st.layout = ''; st.sim = null;
  $('#dash').hidden = true; $('#enter').hidden = false;
  $$('.dash').forEach(b => b.hidden = true);
  $('#hstatus').textContent = '· pronto'; $('#file').value = '';
  scrollTo({ top: 0, behavior: 'smooth' });
});
$('#btnSave').addEventListener('click', askSave);
$('#saveGo').addEventListener('click', doSave);
$('#saveName').addEventListener('keydown', e => { if (e.key === 'Enter') doSave(); });
$('#btnHist').addEventListener('click', openHist);
['histQ', 'histLayout', 'histFrom', 'histTo', 'histSort'].forEach(id => {
  $('#' + id).addEventListener('input', renderHist);
  $('#' + id).addEventListener('change', renderHist);
});
$('#histList').addEventListener('click', async e => {
  const o = e.target.closest('[data-open]'); if (o) { openStudy(o.dataset.open); return; }
  const d = e.target.closest('[data-del]');
  if (d) { await DB.del(d.dataset.del); await loadHist(); renderHist(); toast('Estudo excluído', ''); }
});
$('#histWipe').addEventListener('click', async () => {
  if (!st.hist.length) return;
  await DB.wipe(); await loadHist(); renderHist(); toast('Histórico limpo', 'Todos os estudos foram removidos.');
});
$('#histExport').addEventListener('click', () => {
  const list = histFiltered();
  if (!list.length) { toast('Nada para exportar', '', true); return; }
  OUT.xlsxHistory(list); toast('Histórico exportado', `${list.length} estudos em XLSX.`);
});
$('#btnSim').addEventListener('click', () => openSim());
$('#btnSim2').addEventListener('click', () => openSim({ rank: st.rank === 'volume' ? 'volume' : st.rank, scope: '5' }));
$('#simScope').addEventListener('click', e => {
  const b = e.target.closest('[data-scope]'); if (!b) return;
  sim.scope = b.dataset.scope;
  $$('#simScope .chip').forEach(c => c.classList.toggle('on', c === b));
  $('#simSeatWrap').hidden = sim.scope !== 'one';
  renderSim();
});
$('#simSeat').addEventListener('change', e => { sim.seat = Number(e.target.value); renderSim(); });
$('#simRank').addEventListener('change', e => { sim.rank = e.target.value; renderSim(); });
$('#simPct').addEventListener('input', e => {
  sim.pct = Number(e.target.value); $('#simPctTxt').textContent = '+' + sim.pct + '%';
  $$('#simPreset .chip').forEach(c => c.classList.toggle('on', Number(c.dataset.pct) === sim.pct));
  renderSim();
});
$('#simPreset').addEventListener('click', e => {
  const b = e.target.closest('[data-pct]'); if (!b) return;
  sim.pct = Number(b.dataset.pct); $('#simPct').value = sim.pct; $('#simPctTxt').textContent = '+' + sim.pct + '%';
  $$('#simPreset .chip').forEach(c => c.classList.toggle('on', c === b));
  renderSim();
});
$('#simRet').addEventListener('input', e => {
  sim.ret = Number(e.target.value); $('#simRetTxt').textContent = sim.ret + '%';
  $$('#simScen .chip').forEach(c => c.classList.toggle('on', Number(c.dataset.ret) === sim.ret));
  renderSim();
});
$('#simScen').addEventListener('click', e => {
  const b = e.target.closest('[data-ret]'); if (!b) return;
  sim.ret = Number(b.dataset.ret); $('#simRet').value = sim.ret; $('#simRetTxt').textContent = sim.ret + '%';
  $$('#simScen .chip').forEach(c => c.classList.toggle('on', c === b));
  renderSim();
});
$('#simFrom').addEventListener('change', e => { sim.from = e.target.value; renderSim(); });
$('#simTo').addEventListener('change', e => { sim.to = e.target.value; renderSim(); });
$('#simReset').addEventListener('click', () => {
  sim.from = $('#from').value || st.an.period.start || ''; sim.to = $('#to').value || st.an.period.end || '';
  $('#simFrom').value = sim.from; $('#simTo').value = sim.to; renderSim();
});
$('#simXls').addEventListener('click', () => {
  if (!st.sim) return;
  OUT.xlsx(st.sim.an, { title: 'Simulação de reajuste', topSeats: st.sim.seats, sim: st.sim.r,
    filename: `simulacao-poltronas_${sim.pct}pct.xlsx` });
  toast('Cenário exportado', 'Planilha com a aba Simulação.');
});

/* ── revelação e progresso ──────────────────────────── */
let io = null;
function reveal() {
  if (!io) io = new IntersectionObserver(es => es.forEach(en => { if (en.isIntersecting) { en.target.classList.add('in'); io.unobserve(en.target); } }), { threshold: .06 });
  $$('.rv:not(.in)').forEach(el => io.observe(el));
}
addEventListener('scroll', () => {
  const h = document.documentElement.scrollHeight - innerHeight;
  $('#prog').style.width = (h > 0 ? Math.min(1, scrollY / h) * 100 : 0) + '%';
  $('#totop').classList.toggle('on', scrollY > 650);
}, { passive: true });
$('#totop').addEventListener('click', () => scrollTo({ top: 0, behavior: 'smooth' }));
buildPal();
loadHist();
reveal();
})();
