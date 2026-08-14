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
  inv: false, top5: true, glow: true, pdfColor: true,
  sens: 45, span: 'zero', duo: false, duoA: '#123f2a', duoB: '#84e79c', onlyTop: false,
  resale: false };

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

/* Paradas da escala, já na ordem de desenho.
   Se "misturar duas cores" estiver ligado, o degradê é construído a
   partir das duas cores escolhidas, com dois pontos intermediários
   interpolados para a transição não ficar dura. */
function stops() {
  let a;
  if (st.duo) {
    const A = hex(st.duoA), B = hex(st.duoB);
    a = [0, 1 / 3, 2 / 3, 1].map(t => A.map((c, i) => Math.round(c + (B[i] - c) * t)));
  } else {
    a = PALS[st.pal][dark() ? 'dark' : 'light'].map(hex);
  }
  return st.inv ? a.slice().reverse() : a;
}
function hex(h) { let x = String(h).replace('#', ''); if (x.length === 3) x = x.split('').map(c => c + c).join(''); return [0, 2, 4].map(i => parseInt(x.slice(i, i + 2), 16)); }

/* SENSIBILIDADE
   O problema real: quando quase todas as poltronas vendem parecido,
   os valores se amontoam no topo da escala e o mapa vira um bloco de
   uma cor só. A curva abaixo redistribui a intensidade em torno do
   meio — sensibilidade alta empurra valores baixos para baixo e altos
   para cima, ampliando a diferença visual entre vizinhos.
   0 = escala linear crua; 100 = separação máxima. */
/* Ponto em que a curva é mais íngreme. Precisa ser a MEDIANA dos
   valores do recorte, não 0,5 fixo: numa operação onde toda poltrona
   vende bem, os valores se amontoam perto do topo, e uma sigmoide
   centrada no meio jogaria todos eles para a cor cheia — que é
   exatamente o mapa monocromático que se quer evitar. Centrada na
   mediana, a curva gasta a escala inteira separando o que existe. */
const SCALE = { pivot: 0.5 };
function curve(t, pivot) {
  const s = Math.max(0, Math.min(100, st.sens)) / 100;
  if (s <= 0.02) return t;
  const c = pivot == null ? SCALE.pivot : pivot;
  /* a inclinação cresce em cubo: a metade de baixo do controle regula
     fino, e a de cima chega a um degrau quase binário — que é o que
     serve quando a diferença real entre as poltronas é mínima */
  const k = 1 + s * 6 + s * s * s * 34;
  const f = x => 1 / (1 + Math.exp(-k * (x - c)));
  const lo = f(0), hi = f(1);                /* normaliza para [0,1] */
  const sig = (f(t) - lo) / (hi - lo || 1);
  /* a mistura com a linear também some no topo, para o extremo valer */
  const w = Math.min(1, s * 1.25);
  return t * (1 - w) + sig * w;
}
function ramp(t, sp) {
  const v = curve(Math.max(0, Math.min(1, t))), p = v * (sp.length - 1), i = Math.min(sp.length - 2, Math.floor(p)), f = p - i;
  return sp[i].map((c, j) => Math.round(c + (sp[i + 1][j] - c) * f));
}
const SENS_TXT = v => v < 12 ? 'linear' : v < 32 ? 'baixa' : v < 58 ? 'média' : v < 80 ? 'alta' : 'máxima';
const SPAN_TXT = {
  zero: 'Do zero até o maior valor. É a leitura mais honesta da grandeza absoluta, mas achata o mapa quando todas as poltronas vendem parecido.',
  minmax: 'Do menor até o maior valor do recorte. Estica a escala para usar todas as cores — ótimo para enxergar diferenças pequenas.',
  rank: 'Pela posição no ranking, não pelo valor. Cada poltrona ocupa uma faixa da escala; a diferença visual fica sempre distribuída por igual.'
};
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
  chartSeats: ['O salão enchendo', 'A mesma linha do tempo, agora sobre a planta. Cada poltrona acende no ponto do prazo em que metade das suas compras já tinha acontecido — a mediana da antecedência, não a média, para que duas compras muito antecipadas não a façam acender cedo demais. Arraste a barra para parar em qualquer momento. Poltronas sem venda no recorte ficam apagadas o tempo todo.', 'acende quando: dias até a partida = mediana da antecedência'],
  chartFill: ['Como o ônibus enche', 'A curva acumula as vendas da esquerda (mais de dois meses antes) até a partida, à direita. Cada ponto responde: nesta altura do prazo, que fatia das vendas daquele grupo já tinha acontecido? A linha tracejada é o total do veículo, para comparação. Se a linha cheia sobe antes da tracejada, aquelas poltronas esgotam mais cedo que a média — e é justamente nelas que um preço maior tem chance de passar.', ''],
  sim: ['Receita não cobrada', 'Pega os bilhetes que JÁ foram vendidos e os remarca por um preço maior. Não estima procura futura nem quantas pessoas desistiriam: mostra quanto teria entrado a mais se aquelas mesmas passagens tivessem saído mais caras. É a conta do que ficou na mesa.', 'não cobrado = receita observada × aumento'],
  simRank: ['Critério do top', 'Define quais poltronas entram na conta: as de maior receita, as que vendem primeiro, as de maior antecedência ou as de maior índice.', ''],

  /* ── governança: o que cada contador de qualidade significa ── */
  qRaw: ['Linhas lidas', 'Total de linhas do arquivo, incluindo cabeçalho descartado, linhas vazias e tudo o que foi recusado depois. É o denominador: compare os outros números com este para saber se o descarte foi pequeno ou preocupante.', ''],
  qValid: ['Eventos válidos', 'Linhas que passaram por todas as checagens e alimentam de fato o estudo. Se estiver muito abaixo das linhas lidas, algum contador amarelo abaixo explica para onde foi o resto.', 'aproveitamento = válidos ÷ linhas lidas'],
  qSeat: ['Poltronas não numéricas', 'Linhas cuja poltrona não é um número de 1 a 99 — códigos como “P200”, campos vazios ou textos. São descartadas porque não há como colocá-las na planta do veículo. Um punhado é normal; muitas indicam que a coluna de poltrona veio noutro formato.', ''],
  qOff: ['Fora da planta', 'Vendas de poltronas que existem no arquivo mas não na planta escolhida — por exemplo, a poltrona 53 num veículo executivo de 46 lugares. Se o número for alto, a planta detectada está errada: troque no filtro e o mapa se refaz.', ''],
  qAfter: ['Vendas após a partida', 'Linhas em que a compra foi registrada depois do horário em que o veículo já saiu. São isoladas porque quebrariam o estudo: a antecedência sairia negativa e a poltrona entraria como última na fila de compras, sujando o rank de todas as outras da viagem. Causas comuns: venda embarcada lançada depois, regularização de bilhete, ou hora de partida zerada no CSV.', ''],
  qNoDate: ['Sem data de venda', 'Linhas sem data ou hora de compra utilizável. Sem esse instante não dá para ordenar a fila da viagem nem calcular antecedência, que são o coração do estudo — por isso saem.', ''],
  qDup: ['Duplicados', 'Mesma venda aparecendo mais de uma vez: mesmo bilhete, mesma poltrona, mesma viagem e mesmo instante. Contam uma vez só. Costumam vir de exportações sobrepostas ou de carregar dois arquivos com período em comum — nesse caso é justamente o que se espera.', ''],
  qResale: ['Revendas ignoradas', 'A mesma poltrona comprada mais de uma vez na mesma viagem — tipicamente uma venda cancelada e outra pessoa comprando o lugar depois. Vale SEMPRE a primeira compra, e isso não se aplica só à ordem e à antecedência: a receita dessas repetições também fica de fora. Somá-las contaria como se o lugar tivesse sido ocupado duas vezes, inflando receita, ticket médio e a conta de receita não cobrada. O valor deixado de fora aparece na nota abaixo.', ''],
  qTies: ['Empates na 1ª', 'Viagens em que duas ou mais poltronas foram compradas no mesmo instante e disputam a primeira posição. Nesses casos ninguém leva o crédito inteiro: ele é rateado entre as empatadas. Muito comum quando o sistema grava só a hora cheia, sem minutos.', 'crédito = 1 ÷ nº de empatadas']
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
/* A paleta do mapa fica CONFINADA ao mapa. O acento da interface é
   neutro e não muda com ela — trocar de escala não deve repintar
   botões, barras e destaques. */
function applyAccent() {
  document.documentElement.dataset.glow = st.glow ? 'on' : 'off';
}
/* Redesenha o que depende da escala. Agrupado em um frame para não
   disparar vários reflows quando o usuário arrasta a sensibilidade. */
let repaintReq = 0;
function repaint() {
  if (!st.an) return;
  if (repaintReq) return;
  repaintReq = requestAnimationFrame(() => {
    repaintReq = 0;
    paintSeats(); renderTable(); renderMethod(); renderCfgPreview();
  });
}
/* redesenho completo — só quando os dados mudam, não a cada ajuste de cor */
function repaintAll() {
  if (!st.an) return;
  paintSeats(); drawCharts(); renderTable(); renderPodium(); renderMethod();
}
function setPal(p, silent) {
  st.pal = PALS[p] ? p : 'verde';
  st.duo = false;
  if (!silent) { DB.setPref('paleta', st.pal); DB.setPref('duo', false); }
  applyAccent();
  syncPalUI();
  repaintAll();
}
function setInvert(v, silent) {
  st.inv = !!v;
  if (!silent) DB.setPref('inverter', st.inv);
  applyAccent();
  syncPalUI();
  repaintAll();
}
/* mantém em sincronia os dois lugares que escolhem paleta:
   as bolinhas na barra do mapa e os cartões dentro de Ajustes */
function syncPalUI() {
  $$('#palPick button[data-pal]').forEach(b => b.classList.toggle('on', !st.duo && b.dataset.pal === st.pal));
  $$('#cfgPal .palcard').forEach(b => b.classList.toggle('on', !st.duo && b.dataset.pal === st.pal));
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
  st.top5 = p.marcarTop5 !== false;
  st.glow = p.brilho !== false;
  st.pdfColor = p.pdfCor !== false;
  st.sens = Number.isFinite(+p.sensibilidade) ? +p.sensibilidade : 45;
  st.span = ['zero', 'minmax', 'rank'].includes(p.referencia) ? p.referencia : 'zero';
  st.duo = p.duo === true;
  st.resale = p.contarRevendas === true;
  if (p.duoA) st.duoA = p.duoA;
  if (p.duoB) st.duoB = p.duoB;
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
    return `<button class="palcard${!st.duo && k === st.pal ? ' on' : ''}" type="button" data-pal="${k}" title="${esc(v.hint)}">
      <i class="swatch" style="background:linear-gradient(90deg,${g.join(',')})"></i>
      <span>${esc(v.name)}<em>${!st.duo && k === st.pal ? 'em uso' : ''}</em></span>
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
  if (h) h.textContent = (st.inv
    ? 'Invertido: a poltrona que mais vende fica quase transparente e as fracas ganham a cor cheia — útil para caçar ociosidade. '
    : 'Normal: a poltrona líder do recorte recebe a cor cheia e as demais desbotam proporcionalmente. ')
    + `Sensibilidade ${SENS_TXT(st.sens)}.`;
  const cards = $('#cfgPal');
  if (cards) $$('.palcard .swatch', cards).forEach((el, i) => {
    const v = Object.values(PALS)[i], s = v[dark() ? 'dark' : 'light'];
    el.style.background = `linear-gradient(90deg,${(st.inv ? [...s].reverse() : s).join(',')})`;
  });
}
/* espelha o estado nos interruptores */
function syncCfg() {
  const set = (id, v) => { const el = $(id); if (el) el.setAttribute('aria-pressed', String(!!v)); };
  set('#cfgInvert', st.inv); set('#cfgTop5', st.top5);
  set('#cfgLight', !dark()); set('#cfgGlow', st.glow);
  set('#cfgPdfColor', st.pdfColor); set('#cfgDuo', st.duo); set('#cfgResale', st.resale);
  const rh = $('#cfgResaleHint');
  if (rh) {
    const s = st.an && st.an.summary;
    rh.textContent = !s ? 'Carregue um arquivo para ver o efeito desta escolha.'
      : !s.resales ? 'Este recorte não tem nenhuma poltrona comprada duas vezes na mesma viagem — a escolha não muda nada aqui.'
        : st.resale
          ? `Contando revendas: ${int(s.resales)} ${pl(s.resales, 'compra repetida', 'compras repetidas')} somam ${brl0(s.resaleRev)} à receita.`
          : `Sem revendas: ${brl0(s.resaleRev)} de ${int(s.resales)} ${pl(s.resales, 'compra repetida', 'compras repetidas')} ficam de fora.`;
  }
  $('#cfgSens').value = st.sens; $('#mapSens').value = st.sens;
  $('#cfgSensTxt').textContent = SENS_TXT(st.sens);
  $('#mapSensTxt').textContent = SENS_TXT(st.sens);
  $('#cfgSpanHint').textContent = SPAN_TXT[st.span];
  $$('#cfgSpan button').forEach(b => b.classList.toggle('on', b.dataset.span === st.span));
  $('#cfgDuoRow').hidden = !st.duo;
  $('#cfgDuoA').value = st.duoA; $('#cfgDuoB').value = st.duoB;
  document.documentElement.dataset.top5 = st.top5 ? 'on' : 'off';
  const s = $('#cfgStorage');
  if (s) s.textContent = `${st.hist.length} ${pl(st.hist.length, 'estudo salvo', 'estudos salvos')} neste navegador · preferências em localStorage.`;
  buildCfgPal(); renderCfgPreview();
}
/* A gaveta abre com show(), não showModal(): sem backdrop bloqueando,
   o mapa continua interativo e visível enquanto os controles mudam.
   Com um estudo aberto, rolamos até o mapa para o efeito ficar à vista. */
function openCfg() {
  const d = $('#dlgCfg');
  if (d.open) return closeCfg();
  syncCfg();
  d.classList.remove('closing');
  d.show();
  document.body.classList.add('drawer-open');
  if (st.an) setTimeout(() => $('#secMapa').scrollIntoView({ behavior: 'smooth', block: 'start' }), 90);
}
function closeCfg() {
  const d = $('#dlgCfg');
  document.body.classList.remove('drawer-open');   /* sempre, mesmo se já fechado */
  if (!d.open) return;
  d.classList.add('closing');
  setTimeout(() => { d.close(); d.classList.remove('closing'); }, 250);
}
/* rede de segurança: qualquer fechamento do dialog solta o conteúdo */
$('#dlgCfg').addEventListener('close', () => document.body.classList.remove('drawer-open'));
$('#btnCfg').addEventListener('click', openCfg);
$('#btnMapCfg').addEventListener('click', openCfg);
$('#dlgCfg').addEventListener('cancel', e => { e.preventDefault(); closeCfg(); });
$('#btnInvert').addEventListener('click', () => setInvert(!st.inv));
/* recorte visual do top 5: as demais poltronas recuam em vez de sumir,
   para não se perder a referência de onde elas ficam no salão */
$('#btnOnlyTop').addEventListener('click', () => {
  st.onlyTop = !st.onlyTop;
  const b = $('#btnOnlyTop');
  b.classList.toggle('on', st.onlyTop);
  b.setAttribute('aria-pressed', String(st.onlyTop));
  $('#seatGrid').classList.toggle('onlytop', st.onlyTop);
  if (st.onlyTop && st.an) {
    const t = activeTop();
    if (t[0]) { st.seat = t[0].seat; paintSeats(); }
  }
});
$('#cfgPal').addEventListener('click', e => {
  const b = e.target.closest('[data-pal]'); if (b) { setPal(b.dataset.pal); buildCfgPal(); syncPalUI(); }
});
$('#cfgInvert').addEventListener('click', () => { setInvert(!st.inv); syncCfg(); });
/* sensibilidade: repinta a cada frame enquanto arrasta, grava só ao soltar.
   Os dois controles (gaveta e barra do mapa) espelham um ao outro. */
function setSens(v, done) {
  st.sens = Number(v);
  const txt = SENS_TXT(st.sens);
  $('#cfgSensTxt').textContent = txt; $('#mapSensTxt').textContent = txt;
  if ($('#cfgSens').value != st.sens) $('#cfgSens').value = st.sens;
  if ($('#mapSens').value != st.sens) $('#mapSens').value = st.sens;
  if (done) { DB.setPref('sensibilidade', st.sens); repaintAll(); }
  else repaint();
}
$('#cfgSens').addEventListener('input', e => setSens(e.target.value));
$('#cfgSens').addEventListener('change', e => setSens(e.target.value, true));
$('#mapSens').addEventListener('input', e => setSens(e.target.value));
$('#mapSens').addEventListener('change', e => setSens(e.target.value, true));
$('#cfgSpan').addEventListener('click', e => {
  const b = e.target.closest('[data-span]'); if (!b) return;
  st.span = b.dataset.span; DB.setPref('referencia', st.span);
  syncCfg(); repaintAll();
});
$('#cfgDuo').addEventListener('click', () => {
  st.duo = !st.duo; DB.setPref('duo', st.duo);
  applyAccent(); syncCfg(); syncPalUI(); repaintAll();
});
$('#cfgDuoA').addEventListener('input', e => { st.duoA = e.target.value; repaint(); });
$('#cfgDuoB').addEventListener('input', e => { st.duoB = e.target.value; repaint(); });
['#cfgDuoA', '#cfgDuoB'].forEach(id => $(id).addEventListener('change', () => {
  DB.setPref('duoA', st.duoA); DB.setPref('duoB', st.duoB);
  applyAccent(); repaintAll();
}));
$('#cfgDuoSwap').addEventListener('click', () => {
  const a = st.duoA; st.duoA = st.duoB; st.duoB = a;
  DB.setPref('duoA', st.duoA); DB.setPref('duoB', st.duoB);
  applyAccent(); syncCfg(); repaintAll();
});
$('#cfgTop5').addEventListener('click', () => {
  st.top5 = !st.top5; DB.setPref('marcarTop5', st.top5); syncCfg();
});
$('#cfgResale').addEventListener('click', () => {
  st.resale = !st.resale;
  DB.setPref('contarRevendas', st.resale);
  invalidateSim();
  if (st.ds && st.an) apply(); else syncCfg();
  setTimeout(syncCfg, 700);
  toast(st.resale ? 'Contando revendas' : 'Só a primeira compra',
    st.resale ? 'A receita passa a somar tudo o que foi cobrado.' : 'Cada poltrona conta uma vez por viagem.');
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

/* ══════════════════════════════════════════════════════════════
   DISPONIBILIDADE DAS AÇÕES
   Sem base carregada não há o que simular, salvar ou exportar.
   Os botões continuam visíveis — o usuário vê o que existe — mas
   ficam inertes até o CSV entrar.
   ══════════════════════════════════════════════════════════════ */
function syncActions() {
  const on = !!st.an;
  $$('.dash').forEach(b => { b.disabled = !on; b.setAttribute('aria-disabled', String(!on)); });
  $('#btnHist').disabled = false;
  $('#fab').hidden = !on;   /* o botão de filtro só existe com base carregada */
  const t = $('#btnSim2'); if (t) t.disabled = !on;
  const a = $('#advSim'); if (a) a.disabled = !on;
  if (!on) $('#exportMenu').hidden = true;
}

/* ══════════════════════════════════════════════════════════════
   OVERLAY DE CARREGAMENTO
   A barra é interpolada: o alvo vem do parser, e um laço de
   animação persegue esse alvo. Arquivo pequeno não faz a barra
   saltar de 0 a 100 num piscar — ela sempre percorre o caminho.
   ══════════════════════════════════════════════════════════════ */
/* O laço usa setInterval, não requestAnimationFrame: rAF congela em
   aba oculta, e uma barra que nunca chega ao fim prenderia o overlay
   na tela. 16 ms dá a mesma suavidade e continua correndo em segundo
   plano, ainda que o navegador reduza a frequência. */
const LOADQ = { target: 0, shown: 0, timer: 0, t0: 0 };
function load(t, d, p, ph) {
  const el = $('#load');
  el.hidden = false;
  $('#loadTitle').textContent = t || 'Processando…';
  $('#loadDetail').textContent = d || ''; if (ph) $('#loadPhase').textContent = ph;
  LOADQ.target = p == null ? 0 : p; LOADQ.shown = 0; LOADQ.t0 = Date.now();
  paintProg();
  /* dois frames para o navegador registrar o estado inicial e a
     transição de opacidade realmente acontecer */
  requestAnimationFrame(() => requestAnimationFrame(() => el.classList.add('on')));
  startProg();
}
function startProg() {
  if (LOADQ.timer) return;
  LOADQ.timer = setInterval(() => {
    const diff = LOADQ.target - LOADQ.shown;
    if (Math.abs(diff) < .002) { LOADQ.shown = LOADQ.target; }
    else LOADQ.shown += diff * (Math.abs(diff) > .3 ? .10 : .055);
    paintProg();
    if (LOADQ.shown >= 1) stopProg();
  }, 16);
}
function stopProg() { if (LOADQ.timer) clearInterval(LOADQ.timer); LOADQ.timer = 0; }
function paintProg() {
  const v = Math.max(0, Math.min(1, LOADQ.shown));
  $('#loadBar').style.width = (v * 100) + '%';
  $('#loadPct').textContent = Math.round(v * 100) + '%';
}
function prog(p, d) {
  LOADQ.target = Math.max(LOADQ.target, Math.max(0, Math.min(1, +p || 0)));
  startProg();
  if (d != null) $('#loadDetail').textContent = d;
}
function phase(txt, detail) {
  $('#loadTitle').textContent = txt;
  if (detail != null) $('#loadDetail').textContent = detail;
}
/* Espera a barra encher antes de sumir, respeitando um tempo mínimo
   para o processo não parecer instantâneo. O prazo máximo garante que
   o overlay saia mesmo se a animação for estrangulada pelo navegador. */
function unloadSmooth(minMs) {
  const min = minMs == null ? 900 : minMs;
  const deadline = Date.now() + min + 2500;
  return new Promise(res => {
    const done = () => {
      stopProg();
      const el = $('#load');
      el.classList.remove('on');        /* desaparece por opacidade */
      setTimeout(() => { el.hidden = true; res(); }, 460);
    };
    const wait = () => {
      const elapsed = Date.now() - LOADQ.t0;
      if ((LOADQ.shown > .99 && elapsed >= min) || Date.now() > deadline) return done();
      setTimeout(wait, 30);
    };
    wait();
  });
}
const unload = () => { stopProg(); const el = $('#load'); el.classList.remove('on'); el.hidden = true; };
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
const pause = ms => new Promise(r => setTimeout(r, ms));

async function handle(files) {
  const list = [...(files || [])].filter(f => /\.(csv|txt)$/i.test(f.name));
  if (!list.length) { toast('Arquivo não reconhecido', 'Selecione um CSV ou TXT.', true); return; }
  load('Lendo o arquivo…', 'Procurando as colunas no cabeçalho', .04, 'Importação local');
  try {
    /* 1 · leitura — a ordem das colunas no CSV não importa: o motor
       localiza cada uma pelo nome, tolerando acento e maiúscula */
    await pause(260);
    const parts = [];
    for (let i = 0; i < list.length; i++) {
      phase(list.length > 1 ? `Lendo ${i + 1} de ${list.length}` : `Lendo ${list[i].name}`);
      parts.push(await S.parseFile(list[i], { onProgress: u => {
        const w = u.total ? u.loaded / u.total : 0;
        prog(.05 + (i + w) / list.length * .55, `${int(u.rows)} linhas lidas`);
      } }));
    }

    /* 2 · consolidação */
    phase('Reconstruindo as viagens…', 'Agrupando bilhetes por veículo, data e horário');
    prog(.68); await pause(300);
    st.ds = parts.length === 1 ? parts[0] : S.merge(parts, `${parts.length} arquivos`);

    /* 3 · cálculo */
    phase('Calculando as métricas…', 'Ordem de compra, antecedência e cobertura');
    prog(.82); await pause(280);
    st.layout = ''; st.layoutManual = false; st.sim = null;
    run(true);

    /* 4 · desenho */
    phase('Desenhando o mapa…', S.LAYOUTS[st.an.layout].badge);
    prog(.94); await pause(240);
    prog(1, 'Pronto');
    await unloadSmooth(1100);

    toast('Análise concluída', `${int(st.an.summary.events)} eventos em ${int(st.an.period.tripCount)} viagens.`);
    /* todo estudo entra no histórico assim que é analisado */
    askSave({ auto: true });
  } catch (e) { unload(); toast('Não consegui analisar', e && e.message ? e.message : String(e), true); }
  finally { $('#file').value = ''; }
}

/* A planta só é imposta quando o usuário a escolheu à mão. Caso
   contrário vai nula, e o motor a redetecta a partir do recorte —
   é o que permite filtrar por uma classe de veículo diferente sem
   o mapa esvaziar. */
function opts(reset) {
  if (reset) return { layout: st.layoutManual ? st.layout : null, includeResales: st.resale };
  return {
    layout: st.layoutManual ? st.layout : null,
    includeResales: st.resale,
    start: $('#from').value || null, end: $('#to').value || null,
    minTrips: Math.max(1, Number($('#minN').value) || 1),
    service: $('#fService').value || null, channel: $('#fChannel').value || null,
    klass: $('#fClass').value || null, route: $('#fRoute').value || null,
    market: $('#fMarket').value || null, line: $('#fLine').value || null,
    origin: $('#fOrigin').value || null, destination: $('#fDest').value || null,
    dow: $('#fWeek').value === '' ? null : Number($('#fWeek').value),
    minOcc: Number($('#fOcc').value) || 0, lead: $('#fLead').value || 'all'
  };
}
function run(reset) {
  const an = S.analyze(st.ds, opts(reset));
  st.an = an;
  st.layout = an.layout;   /* acompanha o que foi detectado no recorte */
  /* A troca entrada → painel acontece por trás do desfoque: o painel
     nasce transparente e ganha corpo enquanto o overlay ainda cobre,
     em vez de um piscar de uma tela para outra. */
  if ($('#dash').hidden) {
    $('#dash').classList.add('fading');
    $('#home').hidden = true; $('#dash').hidden = false;
    requestAnimationFrame(() => requestAnimationFrame(() => $('#dash').classList.remove('fading')));
  } else {
    $('#home').hidden = true; $('#dash').hidden = false;
  }
  $('#resume').hidden = true;
  syncActions();
  /* o nome da base vive no deck de filtros, não no cabeçalho */
  document.title = `${an.sourceName || 'Estudo'} · Estudo de Poltronas`;
  if (reset) {
    $('#from').value = an.period.start || ''; $('#to').value = an.period.end || '';
    $('#from').min = $('#to').min = an.period.start || '';
    $('#from').max = $('#to').max = an.period.end || '';
    $('#minN').value = an.minN;
    fillFacets();
  }
  fillLayouts();   /* a planta pode ter mudado com o recorte */
  const t = activeTop();
  st.seat = t[0] ? t[0].seat : ((an.seats.find(s => s.appear) || an.seats[0]).seat);
  renderAll();
  if (reset) scrollTo({ top: 0, behavior: 'smooth' });
}
function fillLayouts() {
  $('#layout').innerHTML = Object.values(S.LAYOUTS).map(l =>
    `<option value="${l.id}"${l.id === st.layout ? ' selected' : ''}>${esc(l.name)}</option>`).join('');
}
/* Cada select é montado a partir das facetas contadas na importação,
   ordenadas por volume — numa base grande, o que interessa vem antes.
   Campos com um único valor são escondidos: filtrar por eles não
   mudaria nada e só ocupariam espaço. */
function fillFacets() {
  const f = st.ds.facets || {};
  const opt = (o, lbl, fmt) => `<option value="">${lbl}</option>` + Object.entries(o || {})
    .sort((a, b) => b[1] - a[1]).filter(([k]) => k).slice(0, 500)
    .map(([k, n]) => `<option value="${esc(k)}">${esc(fmt ? fmt(k) : k)} (${int(n)})</option>`).join('');
  const nOf = o => Object.keys(o || {}).filter(Boolean).length;
  const put = (id, facet, lbl) => {
    const el = $('#' + id); if (!el) return;
    el.innerHTML = opt(facet, lbl);
    const fld = el.closest('.fld');
    if (fld) fld.hidden = nOf(facet) < 2;   /* um valor só não é filtro */
  };
  put('fMarket', f.markets, 'Todos os mercados');
  put('fLine', f.lines, 'Todas as linhas');
  put('fOrigin', f.origins, 'Todas as origens');
  put('fDest', f.destinations, 'Todos os destinos');
  put('fService', f.services, 'Todos os serviços');
  put('fChannel', f.channels, 'Todos os canais');
  put('fClass', f.classes, 'Todas as classes');
  put('fRoute', f.routes, 'Todos os trechos');
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
  renderActiveFilters();
  renderSource(); renderOrderWarn(); renderNarrative(); renderKpis(); renderAdvice(); renderEse(); renderPodium();
  renderMap(); drawCharts(); renderTable(); renderMethod(); renderQuality(); reveal();
}
function renderSource() {
  const a = st.an;
  $('#srcName').textContent = a.sourceName || 'Base';
  $('#srcMeta').textContent = `${dt(a.period.start)} a ${dt(a.period.end)} · ${int(a.period.tripCount)} viagens`;
  $('#ver').textContent = `v${a.version} · ${S.LAYOUTS[a.layout].badge}`
    + (a.summary.includeResales ? ' · receita com revendas' : '');
  $('#deckBadge').textContent = S.LAYOUTS[a.layout].badge;
}
/* ══════════════════════════════════════════════════════════════
   GRANULARIDADE DA HORA
   O sistema de origem exporta a venda com a hora cheia, sem minutos
   — em todos os arquivos vistos até aqui, 100% dos registros. Isso
   não é defeito de um arquivo: é o formato. Um aviso permanente no
   topo seria ruído, porque alerta que nunca desliga ninguém lê.

   A ressalva vale mesmo assim, mas só num lugar: quando o usuário
   escolhe justamente o ranking que depende da ordem. Nos outros
   dois — antecedência e volume — a hora cheia não atrapalha nada,
   porque a distância até a partida é medida em dias.

   O cálculo não muda: rank médio para empatados e crédito de
   primeira rateado é o tratamento correto e não há como recuperar
   uma ordem que o banco não gravou.
   ══════════════════════════════════════════════════════════════ */
function renderOrderWarn() {
  const a = st.an, s = a.summary, q = a.quality || {};
  const el = $('#rankNote'); if (!el) return;
  const mantida = s.orderKept == null ? 1 : s.orderKept;
  const horaCheia = q.valid ? (q.coarse || 0) / q.valid : 0;
  /* aparece só no ranking que depende da ordem, e só se a perda for material */
  if (st.rank !== 'first' || mantida > .92 || horaCheia < .5) { el.hidden = true; return; }
  el.hidden = false;
  $('span', el).innerHTML =
    `O arquivo grava a venda na hora cheia, sem minutos, então compras da mesma hora chegam empatadas: `
    + `<b>${int(s.tiedSeats)}</b> de ${int(s.rankedSeats)} poltronas sem ordem definida, `
    + `<b>${pct(1 - mantida, 0)}</b> da ordem indeterminada. Os empates são rateados. `
    + `Para decidir preço, <b>Maior antecedência</b> é mais firme — é medida em dias.`;
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
/* ══════════════════════════════════════════════════════════════
   RECOMENDAÇÃO
   Traduz o estudo numa frase que um gerente comercial leia sem
   dicionário: quais poltronas testar, quanto subir e quanto isso
   representa em um mês, seis meses e um ano.

   O critério de escolha é o índice de oportunidade — cobertura,
   precocidade e primeira escolha — porque poltrona que vende cedo
   e sempre é a que menos sofre com um ajuste de preço. O valor
   sugerido é deliberadamente modesto (10% ou o arredondamento de
   10% do ticket) para caber num teste real.
   ══════════════════════════════════════════════════════════════ */
const adv = { mode: 'pct' };
function adviceSeats() {
  const a = st.an;
  const pool = (a.byScore && a.byScore.length ? a.byScore : a.topVolume10 || [])
    .filter(s => s.appear >= a.minN && s.revenue > 0);
  return pool.slice(0, 3);
}
function renderAdvice() {
  const a = st.an, el = $('#advice');
  const seats = adviceSeats();
  if (!seats.length || !a.summary.revenue) { el.hidden = true; return; }
  el.hidden = false;

  const tickets = seats.reduce((n, s) => n + (s.revN || 0), 0);
  const receita = seats.reduce((n, s) => n + (s.revenue || 0), 0);
  const ticketMedio = tickets ? receita / tickets : 0;

  /* valor sugerido: 10%, arredondado para um número redondo em reais */
  const pctSug = 10;
  const brutoAbs = ticketMedio * pctSug / 100;
  const absSug = brutoAbs >= 20 ? Math.round(brutoAbs / 5) * 5
    : brutoAbs >= 5 ? Math.round(brutoAbs)
      : Math.max(1, Math.round(brutoAbs * 2) / 2);

  const r = S.simulate(a, adv.mode === 'abs'
    ? { mode: 'abs', abs: absSug, seats }
    : { mode: 'pct', pct: pctSug, seats });

  const nomes = seats.map(s => s.seat);
  const lista = nomes.length > 1
    ? nomes.slice(0, -1).join(', ') + ' e ' + nomes[nomes.length - 1]
    : String(nomes[0]);
  const ajuste = adv.mode === 'abs'
    ? `<b>${brl0(absSug)}</b> por bilhete`
    : `<b>${pctSug}%</b> no preço`;
  const equiv = adv.mode === 'abs'
    ? `${pct(r.pctEfetivo, 1)} sobre o ticket médio delas`
    : `${brl(r.porBilhete)} por bilhete`;

  $('#adviceText').innerHTML =
    `As poltronas <b>${lista}</b> vendem mais cedo e aparecem em mais viagens — são as candidatas naturais a um preço maior. ` +
    `Nos <b>${int(a.period.calendarDays)} dias</b> deste recorte, esses <b>${int(r.tickets)} bilhetes</b> já vendidos ` +
    `teriam rendido <b>${brl0(r.delta)}</b> a mais com ${ajuste} (${equiv}). ` +
    `No mesmo ritmo, isso é <b>${brl0(r.perMonth)}</b> por mês e <b>${brl0(r.perYear)}</b> por ano.`;

  $('#adviceNums').innerHTML = [
    ['No recorte', brl0(r.delta)],
    ['Por bilhete', brl(r.porBilhete)],
    ['Por mês', brl0(r.perMonth)],
    ['Em 6 meses', brl0(r.perHalf)],
    ['Em 12 meses', brl0(r.perYear)]
  ].map(([k, v]) => `<div><small>${esc(k)}</small><b>${v}</b></div>`).join('');

  $('#adviceCaveat').textContent =
    `O valor do recorte é fato: são passagens já vendidas, remarcadas pelo preço maior. ` +
    `Mês e ano apenas estendem o ritmo observado e supõem a mesma procura — ` +
    `um aumento real pode afastar parte dos passageiros.`;

  adv.last = { seats, absSug, pctSug };
}

/* ══════════════════════════════════════════════════════════════
   CONTA DE PADEIRO
   Aritmética crua de propósito: aumento × poltronas × dias, com um
   serviço por dia. Não entra o preço da passagem, não entra o
   histórico, não desconta nada.

   Ela existe porque a simulação sobre os dados responde "quanto
   isso rendeu no recorte", e numa conversa a primeira pergunta
   costuma ser outra: "e se eu subir dois reais, dá quanto no ano?".
   As duas convivem, desde que ninguém confunda uma com a outra —
   por isso vive em seção separada e com o método escrito na tela.
   ══════════════════════════════════════════════════════════════ */
const ese = { valor: 5, qtd: 5 };
const ESE_PRONTOS = [
  { v: 2, q: 10 }, { v: 5, q: 5 }, { v: 5, q: 10 }, { v: 10, q: 5 }, { v: 20, q: 3 }
];
function eseQtdReal() {
  if (ese.qtd !== 'full') return Number(ese.qtd);
  const L = st.an && S.LAYOUTS[st.an.layout];
  return L ? Object.keys(L.map).length : 46;
}
function eseCalc(v, q) {
  const dia = v * q;
  return { dia, mes: dia * 30, semestre: dia * 182, ano: dia * 365 };
}
function renderEse() {
  if (!st.an) return;
  const q = eseQtdReal(), v = ese.valor;
  const r = eseCalc(v, q);
  /* "em" + "as" = "nas": sem isto sai "em as 46 poltronas" */
  const comoQtd = ese.qtd === 'full'
    ? `nas <b>${int(q)} poltronas</b> do veículo`
    : `em <b>${int(q)} poltronas</b>`;

  $('#eseFrase').innerHTML =
    `Subindo <b>${brl0(v)}</b> ${comoQtd}, com um serviço por dia, entram `
    + `<span class="big">${brl0(r.dia)}</span> a mais por dia — `
    + `<span class="big">${brl0(r.mes)}</span> em um mês e <span class="big">${brl0(r.ano)}</span> em um ano.`;

  $('#eseNums').innerHTML = [
    ['Por dia', brl0(r.dia), 0],
    ['Em 1 mês', brl0(r.mes), 0],
    ['Em 6 meses', brl0(r.semestre), 0],
    ['Em 1 ano', brl0(r.ano), 1]
  ].map(([k, val, hi]) => `<div${hi ? ' class="hi"' : ''}><small>${esc(k)}</small><b>${val}</b></div>`).join('');

  $('#eseCalc').innerHTML =
    `<b>${brl0(v)}</b> × <b>${int(q)}</b> poltronas = ${brl0(r.dia)} por serviço &nbsp;·&nbsp; `
    + `× <b>365</b> dias = <b>${brl0(r.ano)}</b> no ano`;

  $$('#eseVal .chip').forEach(b => b.classList.toggle('on', Number(b.dataset.v) === ese.valor));
  $$('#eseQtd .chip').forEach(b => b.classList.toggle('on', String(b.dataset.q) === String(ese.qtd)));

  $('#eseGrid').innerHTML = ESE_PRONTOS.map(p => {
    const c = eseCalc(p.v, p.q);
    const on = p.v === ese.valor && String(p.q) === String(ese.qtd);
    return `<button class="esecard${on ? ' on' : ''}" type="button" data-v="${p.v}" data-q="${p.q}">
      <i>${brl0(p.v)} em ${p.q} poltronas</i><b>${brl0(c.ano)}</b><span>por ano</span></button>`;
  }).join('');
}
$('#eseVal').addEventListener('click', e => {
  const b = e.target.closest('[data-v]'); if (!b) return;
  ese.valor = Number(b.dataset.v); renderEse();
});
$('#eseQtd').addEventListener('click', e => {
  const b = e.target.closest('[data-q]'); if (!b) return;
  ese.qtd = b.dataset.q === 'full' ? 'full' : Number(b.dataset.q); renderEse();
});
$('#eseGrid').addEventListener('click', e => {
  const b = e.target.closest('[data-v]'); if (!b) return;
  ese.valor = Number(b.dataset.v); ese.qtd = Number(b.dataset.q); renderEse();
});
$('#eseToSim').addEventListener('click', () => openSim({ mode: 'abs', abs: ese.valor, scope: '5' }));

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
  /* data-n ajusta a grade ao número de colocados, para não sobrar
     coluna vazia quando o recorte é estreito */
  $('#podium').dataset.n = top.length;
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

/* POSIÇÃO DE CADA POLTRONA NA ESCALA (0 a 1), antes da curva de
   sensibilidade. A referência muda conforme a preferência do usuário:
   zero   — proporção sobre o maior valor (grandeza absoluta)
   minmax — estica entre o menor e o maior valor com venda
   rank   — usa só a ordem, ignorando a distância entre os valores
   Devolve um Map para não recalcular a cada poltrona. */
function seatPositions() {
  const a = st.an, M = METRICS[st.metric], out = new Map();
  const vals = [];
  a.seats.forEach(s => {
    const v = M.get(s);
    if (s.appear > 0 && v != null) vals.push({ seat: s.seat, v: M.rel ? v : v });
  });
  if (!vals.length) return out;
  if (st.span === 'rank') {
    const sorted = [...vals].sort((x, y) => x.v - y.v);
    const n = sorted.length;
    sorted.forEach((x, i) => out.set(x.seat, n === 1 ? 1 : i / (n - 1)));
    SCALE.pivot = 0.5;   /* por construção o rank já é uniforme */
    return out;
  }
  const nums = vals.map(x => x.v);
  const hiV = Math.max(...nums);
  const loV = st.span === 'minmax' ? Math.min(...nums) : (M.rel ? 0 : 0);
  const range = hiV - loV;
  vals.forEach(x => out.set(x.seat, range > 0 ? (x.v - loV) / range : 1));
  /* mediana das posições — é nela que a curva de sensibilidade morde */
  const ps = [...out.values()].sort((a, b) => a - b);
  SCALE.pivot = ps.length
    ? (ps.length % 2 ? ps[(ps.length - 1) / 2] : (ps[ps.length / 2 - 1] + ps[ps.length / 2]) / 2)
    : 0.5;
  return out;
}

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
  g.classList.toggle('onlytop', st.onlyTop);
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
  const pos = seatPositions();
  $('#legLow').textContent = M.low(a);
  $('#legHigh').textContent = M.high(a);
  $('#legTrack').style.background = `linear-gradient(90deg,${sp.map((c, i) => `${rgb(c)} ${(i / (sp.length - 1) * 100).toFixed(0)}%`).join(',')})`;
  a.seats.forEach(s => {
    const el = $(`.seat[data-seat="${s.seat}"]`); if (!el) return;
    const raw = M.get(s), has = s.appear > 0 && raw != null;
    const t = has ? pos.get(s.seat) : null;
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
function drawCharts() { chartLead(); chartFill(); buildSeatFill(); chartRank(); }
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
/* ══════════════════════════════════════════════════════════════
   COMO O ÔNIBUS ENCHE
   Curva acumulada da esquerda (mais de 2 meses antes) até a partida,
   à direita. Cada ponto responde: desta data em diante, que fatia
   das vendas daquele grupo já tinha acontecido?

   O eixo do tempo é invertido de propósito — dias-antes decresce
   rumo à partida, e ler da esquerda para a direita passa a ser ler
   o calendário na direção natural.

   A curva é desenhada progressivamente com stroke-dashoffset: a
   animação não é enfeite, é a leitura do próprio fenômeno.
   ══════════════════════════════════════════════════════════════ */
const fillState = { scope: '5' };
const FILL_MARKS = ['2 meses', '1 mês', '4 sem', '2 sem', '1 sem', '5 d', '3 d', '2 d', '1 d', 'partida'];

function fillSeries(seats) {
  const n = st.an.dayBuckets.length;
  const b = new Array(n).fill(0);
  seats.forEach(s => (s.buckets || []).forEach((v, i) => b[i] += v));
  const total = b.reduce((x, y) => x + y, 0) || 1;
  /* buckets vêm do mais próximo da partida para o mais distante;
     acumulamos ao contrário, para a curva subir rumo à partida */
  const out = [0];
  let acc = 0;
  for (let i = n - 1; i >= 0; i--) { acc += b[i]; out.push(acc / total); }
  return { pts: out, total: b.reduce((x, y) => x + y, 0) };
}
function chartFill() {
  const a = st.an;
  const all = a.seats.filter(s => s.appear);
  const listaTop = activeList();
  const grupo = fillState.scope === 'all' ? all
    : listaTop.slice(0, Number(fillState.scope));
  const rotulo = fillState.scope === 'all' ? 'Todas as poltronas' : 'Top ' + fillState.scope;
  $('#fillKeyA').textContent = rotulo;

  const A = fillSeries(grupo), B = fillSeries(all);
  const n = A.pts.length;
  const W = 660, H = 300, L = 44, R = 14, T = 16, Bm = 46, iw = W - L - R, ih = H - T - Bm;
  const x = i => L + (i / (n - 1)) * iw;
  const y = v => T + (1 - v) * ih;
  const linha = pts => pts.map((v, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(v).toFixed(1)}`).join(' ');
  const area = pts => linha(pts) + ` L${x(n - 1).toFixed(1)},${y(0).toFixed(1)} L${x(0).toFixed(1)},${y(0).toFixed(1)} Z`;

  let g = '';
  [0, .25, .5, .75, 1].forEach(v => {
    g += `<line class="gl" x1="${L}" y1="${y(v)}" x2="${W - R}" y2="${y(v)}"/>` +
      `<text x="${L - 8}" y="${y(v) + 3}" text-anchor="end">${Math.round(v * 100)}%</text>`;
  });
  FILL_MARKS.forEach((lb, i) => {
    if (i % 2 && i !== FILL_MARKS.length - 1) return;   /* alterna para não colidir */
    g += `<text x="${x(i)}" y="${T + ih + 18}" text-anchor="middle">${lb}</text>`;
  });
  /* a partida é o limite: uma linha vertical marca o fim do prazo */
  g += `<line x1="${x(n - 1)}" y1="${T}" x2="${x(n - 1)}" y2="${T + ih}" stroke="var(--line-3)" stroke-dasharray="3 4"/>`;
  g += `<line class="ax" x1="${L}" y1="${T + ih}" x2="${W - R}" y2="${T + ih}"/>`;

  g += `<path class="fillarea" d="${area(A.pts)}"/>`;
  g += `<path class="fillref" d="${linha(B.pts)}"/>`;
  g += `<path class="fillline" d="${linha(A.pts)}"/>`;

  /* marcador em cada ponto, com a leitura em texto */
  A.pts.forEach((v, i) => {
    if (!i) return;
    g += `<g class="fillpt" style="--d:${(i / (n - 1) * 1.1).toFixed(2)}s">
      <circle cx="${x(i).toFixed(1)}" cy="${y(v).toFixed(1)}" r="3.5"/>
      <title>${esc(FILL_MARKS[i - 1] || '')} antes da partida: ${pct(v, 0)} das vendas de ${esc(rotulo.toLowerCase())} já tinham acontecido</title></g>`;
  });
  g += `<text x="${L + iw / 2}" y="${H - 8}" text-anchor="middle">quando a venda aconteceu, rumo à partida</text>`;

  const meta = marcoMetade(A.pts);
  $('#chFill').innerHTML =
    `<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="Curva de enchimento até a partida">${g}</svg>` +
    `<p class="filltell">${esc(rotulo)}: metade das vendas já tinha acontecido <b>${esc(meta)}</b> antes da partida` +
    `${A.total ? ` · ${int(A.total)} ${pl(A.total, 'compra', 'compras')} no recorte` : ''}.</p>`;
  playFill();
}
/* em que marco a curva cruza os 50% */
function marcoMetade(pts) {
  for (let i = 1; i < pts.length; i++) if (pts[i] >= .5) return FILL_MARKS[i - 1] || 'na partida';
  return 'na partida';
}
function playFill() {
  const svg = $('#chFill svg'); if (!svg) return;
  svg.classList.remove('run');
  void svg.getBoundingClientRect();     /* força o reinício da animação */
  svg.classList.add('run');
}
/* ══════════════════════════════════════════════════════════════
   O SALÃO ENCHENDO
   A mesma linha do tempo, agora sobre a planta. Cada poltrona acende
   no ponto do prazo em que METADE das suas compras já tinha
   acontecido — a mediana da antecedência, não a média, para que
   duas compras muito antecipadas não façam a poltrona acender cedo
   demais.

   Vale a regra da primeira compra: `medLead` vem das primeiras
   compras de cada viagem, então cancelamento seguido de revenda não
   move o momento em que a poltrona acende.
   ══════════════════════════════════════════════════════════════ */
const sfState = { scope: '5', step: 9, timer: 0 };
function bucketIndex(dias) {
  const B = S.BUCKETS;
  for (let i = 0; i < B.length; i++) if (dias < B[i][1]) return i;
  return B.length - 1;
}
function buildSeatFill() {
  const a = st.an, L = S.LAYOUTS[a.layout];
  const nb = S.BUCKETS.length;
  const acende = new Map();
  a.seats.forEach(s => {
    if (!s.appear) return;
    /* sem mediana de antecedência a poltrona só acende na partida */
    const d = s.medLead != null ? s.medLead : (s.avgLead != null ? s.avgLead : 0);
    acende.set(s.seat, nb - 1 - bucketIndex(d));
  });
  sfState.acende = acende;

  const g = document.createElement('div');
  g.className = 'sfgrid';
  g.style.gridTemplateColumns = `repeat(${L.columns}, minmax(0,1fr))`;
  let extra = `<div class="band">${esc(L.band)}</div>`;
  if (L.stairCol) extra += `<div class="stair" style="grid-column:${L.stairCol}">${ico('stairs')}</div>`;
  if (L.wcCol) extra += `<div class="wc" style="grid-row:1;grid-column:${L.wcCol}">${ico('wc')}</div>`;
  g.innerHTML = extra;
  a.seats.forEach(s => {
    const d = document.createElement('div');
    d.className = 'sfseat';
    d.dataset.seat = s.seat;
    d.style.gridRow = s.gridRow; d.style.gridColumn = s.col;
    d.textContent = s.seat;
    d.title = s.appear
      ? `Poltrona ${s.seat} · mediana ${num(s.medLead, 1)} dias antes da partida · ${int(s.appear)} ${pl(s.appear, 'viagem', 'viagens')}`
      : `Poltrona ${s.seat} · sem venda no recorte`;
    g.appendChild(d);
  });
  const host = $('#sfBus');
  host.innerHTML = '';
  host.appendChild(g);

  $('#sfMarks').innerHTML = FILL_MARKS.map(m => `<span>${esc(m)}</span>`).join('');
  $('#sfKey').textContent = sfState.scope === 'all' ? 'Ranking ativo' : 'Top ' + sfState.scope;
  paintSeatFill(sfState.step);
}
function paintSeatFill(step) {
  const a = st.an;
  sfState.step = step;
  const destaque = sfState.scope === 'all' ? new Set()
    : new Set(activeList().slice(0, Number(sfState.scope)).map(s => s.seat));
  /* mesma escala do mapa de calor: a poltrona não acende em branco,
     acende já na cor que ela tem no mapa — a leitura é a mesma */
  const sp = stops();
  const pos = seatPositions();
  let vendidas = 0, total = 0;
  $$('#sfBus .sfseat').forEach(el => {
    const n = Number(el.dataset.seat);
    const q = sfState.acende.get(n);
    const temVenda = q != null;
    if (temVenda) total++;
    const on = temVenda && q <= step;
    if (on) vendidas++;
    if (on && pos.has(n)) {
      const c = ramp(pos.get(n), sp);
      el.style.background = rgb(c);
      el.style.color = ink(c);
    } else {
      el.style.background = '';
      el.style.color = '';
    }
    el.classList.toggle('on', on);
    el.classList.toggle('dead', !temVenda);
    el.classList.toggle('hot', destaque.has(n));
  });
  $('#sfRange').value = step;
  $('#sfWhen').textContent = FILL_MARKS[step] === 'partida' ? 'Partida' : FILL_MARKS[step] + ' antes';
  const jaTop = sfState.scope === 'all' ? null
    : [...destaque].filter(n => { const q = sfState.acende.get(n); return q != null && q <= step; }).length;
  $('#sfNow').innerHTML = `<b>${int(vendidas)}</b> de ${int(total)} poltronas já vendidas`
    + (jaTop != null ? ` · <b>${jaTop}</b> de ${destaque.size} do top` : '');
}
/* Loop contínuo: percorre o prazo, segura um instante na partida,
   apaga e recomeça. Parar é só arrastar a barra ou clicar de novo. */
function playSeatFill(loop) {
  clearInterval(sfState.timer);
  if (loop === false) { sfState.timer = 0; sfState.loop = false; return; }
  sfState.loop = true;
  paintSeatFill(0);
  let k = 0, pausa = 0;
  sfState.timer = setInterval(() => {
    if (pausa > 0) { pausa--; return; }
    k++;
    if (k > 9) { k = -1; pausa = 3; paintSeatFill(0); return; }
    paintSeatFill(k);
  }, 560);
  const b = $('#sfPlay');
  if (b) b.classList.add('on');
}
function stopSeatFill() {
  clearInterval(sfState.timer); sfState.timer = 0; sfState.loop = false;
  const b = $('#sfPlay'); if (b) b.classList.remove('on');
}
$('#sfRange').addEventListener('input', e => {
  stopSeatFill();
  paintSeatFill(Number(e.target.value));
});
$('#sfPlay').addEventListener('click', () => {
  if (sfState.loop) stopSeatFill(); else playSeatFill();
});
$('#seatFillScope').addEventListener('click', e => {
  const b = e.target.closest('[data-sf]'); if (!b || b.dataset.sf === sfState.scope) return;
  sfState.scope = b.dataset.sf;
  $$('#seatFillScope button').forEach(x => x.classList.toggle('on', x === b));
  $('#sfKey').textContent = sfState.scope === 'all' ? 'Ranking ativo' : 'Top ' + sfState.scope;
  paintSeatFill(sfState.step);
});

$('#fillSwitch').addEventListener('click', e => {
  const b = e.target.closest('[data-fill]'); if (!b || b.dataset.fill === fillState.scope) return;
  fillState.scope = b.dataset.fill;
  $$('#fillSwitch button').forEach(x => x.classList.toggle('on', x === b));
  chartFill();
});
$('#fillReplay').addEventListener('click', playFill);
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
  const pos = seatPositions();   /* mesma escala do mapa, para a bolinha bater com a poltrona */
  const { k, asc } = st.sort;
  const rows = a.seats.filter(s => s.appear && (!q || String(s.seat).includes(q))).sort((x, y) => {
    const A = x[k], B = y[k];
    if (A == null && B == null) return 0; if (A == null) return 1; if (B == null) return -1;
    if (typeof A === 'string') return asc ? A.localeCompare(B) : B.localeCompare(A);
    return asc ? A - B : B - A;
  });
  $('#table').innerHTML = `<div class="head">${COLS.map(c => `<span data-sort="${c.k}" class="${k === c.k ? 's' + (asc ? ' asc' : '') : ''}">${c.t}</span>`).join('')}</div>` +
    (rows.length ? rows.map(s => {
      const c = ramp(pos.has(s.seat) ? pos.get(s.seat) : 0, sp), low = s.conf === 'Baixa' || s.conf === 'Insuficiente';
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
/* Cada cartão mostra a conta e, logo abaixo, a mesma conta refeita com
   um número real deste recorte — a fórmula sozinha não convence
   ninguém que precisa defender o resultado numa reunião. */
function ex(passos, resultado) {
  return `<div class="exbox"><span class="exlbl">Exemplo com os seus dados</span>
    ${passos.map(p => `<div class="exrow"><i>${esc(p[0])}</i><b>${p[1]}</b></div>`).join('')}
    <div class="exres"><i>${esc(resultado[0])}</i><b>${resultado[1]}</b></div></div>`;
}
function renderMethod() {
  const a = st.an, l = a.leadTop, f = a.top10[0], m = a.mostSold, sp = stops();
  const boxes = [0, .25, .5, .75, 1].map(t => { const c = ramp(t, sp); return `<span style="background:${rgb(c)};color:${ink(c)}">${Math.round(t * 100)}</span>`; }).join('');
  const rich = a.seats.filter(s => s.appear && s.revenue > 0).sort((x, y) => y.revenue - x.revenue)[0];
  const pos = seatPositions();

  const cards = [
    ['01', 'Viagem e primeira compra',
      `<p>As vendas são agrupadas por viagem — um veículo, um dia, um horário. A poltrona conta uma vez por viagem, pela primeira compra; revendas ficam de fora.</p>
      <code>chave = serviço | linha | data | hora | origem | destino</code>
      ${ex([['Bilhetes lidos no recorte', int(a.summary.events)],
        ['Agrupados em viagens distintas', int(a.period.tripCount)]],
        ['Poltronas por viagem, em média', num(a.summary.perTrip, 1)])}`],

    ['02', 'Rank e percentil',
      `<p>Dentro de cada viagem as poltronas são ordenadas pelo instante da primeira compra: a 1ª vendida tem rank 1. O percentil transforma esse rank numa escala de 0 a 100%, para comparar viagem cheia com viagem vazia.</p>
      <code>percentil = (rank na viagem − 1) ÷ (vendidas na viagem − 1)</code>
      ${ex([['Numa viagem que vendeu 10 poltronas…', '10'],
        ['…e a nossa foi a 3ª a sair', 'rank 3'],
        ['Conta', '(3 − 1) ÷ (10 − 1)']],
        ['Percentil naquela viagem', '22,2%'])}
      <p class="exnote">Isso é feito viagem a viagem; o número da tabela é a média desses percentuais.${f ? ` A poltrona ${f.seat}, por exemplo, tem rank médio ${num(f.avgRank, 2)} em ${int(f.appear)} ${pl(f.appear, 'viagem', 'viagens')} e percentil médio ${pct(f.avgPct, 1)}.` : ''} Quanto menor, mais cedo ela sai na fila.</p>
      ${(a.quality && a.quality.valid && (a.quality.coarse || 0) / a.quality.valid > .5) ? `<p class="exnote"><b>Limite conhecido:</b> o sistema de origem grava a venda na hora cheia, sem minutos — há 24 horários possíveis por dia. Compras da mesma hora chegam empatadas e recebem o rank médio, com o crédito de primeira rateado. Neste recorte, ${pct(1 - (a.summary.orderKept == null ? 1 : a.summary.orderKept), 0)} da ordem fica indeterminada. Não há como recuperá-la: por isso a antecedência, medida em dias, é a base mais firme para decidir preço.</p>` : ''}`],

    ['03', 'Antecedência',
      `<p>Dias entre a primeira compra e a partida. Média e mediana andam juntas porque uma compra feita com seis meses de folga puxa a média sozinha.</p>
      <code>antecedência = (partida − 1ª compra) ÷ 1 dia</code>
      ${l ? ex([['Poltrona', l.seat],
        ['Compras com data de partida válida', int(l.leadN)],
        ['Média dos dias de antecedência', num(l.avgLead, 1) + ' dias'],
        ['Mediana (metade comprou antes disso)', num(l.medLead, 1) + ' dias']],
        ['Diferença média − mediana', num(Math.abs((l.avgLead || 0) - (l.medLead || 0)), 1) + ' dias']) : ''}
      <p class="exnote">Diferença grande entre as duas = poucas compras muito antecipadas inflando a média. Neste recorte houve <b>${int(a.summary.tiesFirst)}</b> ${pl(a.summary.tiesFirst, 'viagem', 'viagens')} com empate na primeira posição; nesses casos o crédito é rateado.</p>`],

    ['04', 'Mapa de calor',
      `<p>A cor traduz a métrica escolhida. A intensidade é a posição do valor dentro da escala, e depois passa pela curva de sensibilidade que você regula.</p>
      <code>intensidade = valor ÷ maior valor do recorte</code>
      <div class="scaleboxes">${boxes}</div>
      ${m ? ex([['Poltrona mais vendida (a âncora)', `${m.seat} · ${int(m.appear)} viagens`],
        ['Uma poltrona com metade disso', int(Math.round(m.appear / 2)) + ' viagens'],
        ['Conta', `${int(Math.round(m.appear / 2))} ÷ ${int(m.appear)}`]],
        ['Fica na altura da escala', '50%']) : ''}`],

    ['05', 'Índice de oportunidade',
      `<p>Combina três sinais para priorizar quais poltronas testar primeiro. Não estima receita — ordena candidatas.</p>
      <div class="weights"><div class="wrow"><span>Cobertura</span><div class="tk"><i style="width:50%"></i></div><span class="vv">50%</span></div>
      <div class="wrow"><span>Precocidade</span><div class="tk"><i style="width:35%"></i></div><span class="vv">35%</span></div>
      <div class="wrow"><span>1ª escolha</span><div class="tk"><i style="width:15%"></i></div><span class="vv">15%</span></div></div>
      ${f ? ex([['Poltrona', f.seat],
        ['Cobertura ' + pct(f.coverage, 0) + ' × 0,50', num((f.coverage || 0) * 50, 1)],
        ['Precocidade ' + pct(1 - (f.avgPct || 0), 0) + ' × 0,35', num((1 - (f.avgPct || 0)) * 35, 1)],
        ['1ª escolha ' + pct(f.firstRate || 0, 0) + ' ÷ 25% × 0,15', num(Math.min(1, (f.firstRate || 0) / 0.25) * 15, 1)]],
        ['Índice', num(f.scorePct, 1) + '/100']) : ''}
      <p class="exnote">A 1ª escolha é dividida por 25% antes de entrar: ser a primeira em um quarto das viagens já vale a nota cheia desse critério.</p>`],

    ['06', 'Receita não cobrada',
      `<p>Aqui não há previsão. Os bilhetes já foram vendidos: a conta os remarca por um preço maior e mostra a diferença — o que passou pela porta e não foi cobrado.</p>
      <code>não cobrado = receita observada × aumento</code>
      ${rich ? ex([['Poltrona', rich.seat],
        ['Bilhetes vendidos no recorte', int(rich.revN)],
        ['Receita que entrou', brl0(rich.revenue)],
        ['Se cada um saísse 10% mais caro', `${brl0(rich.revenue)} × 10%`]],
        ['Teria entrado a mais', brl0(rich.revenue * 0.10)]) : ''}
      <p class="exnote">Projeções de mês e ano estendem esse ritmo e supõem a mesma procura.</p>`],

    ['07', 'Limites',
      `<p>Estudo observacional, amostra mínima de <b>${int(a.minN)} viagens</b> por poltrona. Uma poltrona pode vender cedo por conforto, por aparecer primeiro na tela de venda ou por regra de canal — a base não distingue os três.</p>
      <p>${esc(S.LAYOUTS[a.layout].ctx)}</p>
      <p>Use como hipótese para um teste controlado, não como justificativa isolada de reajuste.</p>`]
  ];
  void pos;
  $('#method').innerHTML = cards.map(c => `<article class="mcard"><span class="st">${c[0]}</span><h3>${esc(c[1])}</h3>${c[2]}</article>`).join('');
}
function renderQuality() {
  const a = st.an, q = a.quality || {};
  const cards = [
    { v: q.rawRows, l: 'linhas lidas', i: 'qRaw' },
    { v: q.valid, l: 'eventos válidos', i: 'qValid' },
    { v: (q.codeSeat || 0) + (q.badSeat || 0), l: 'poltronas não numéricas', i: 'qSeat', w: (q.codeSeat + q.badSeat) > 0 },
    { v: q.offLayout, l: 'fora da planta', i: 'qOff', w: q.offLayout > 0 },
    { v: q.afterDeparture, l: 'vendas após a partida', i: 'qAfter', w: q.afterDeparture > 0 },
    { v: q.noSaleTime, l: 'sem data de venda', i: 'qNoDate', w: q.noSaleTime > 0 },
    { v: q.dup, l: 'duplicados', i: 'qDup' },
    { v: a.summary.resales, l: 'revendas ignoradas', i: 'qResale', w: (a.summary.resales || 0) > 0 },
    { v: q.tiesFirst, l: 'empates na 1ª', i: 'qTies' }
  ];
  $('#qual').innerHTML = cards.map(c => `<article class="qcard${c.w ? ' w' : ''}">
    <span class="lbl">${esc(c.l)}<button class="i" data-info="${c.i}" type="button" aria-label="Explicar ${esc(c.l)}">i</button></span>
    <b>${int(c.v || 0)}</b></article>`).join('');
  const n = [];
  if (q.coarse / Math.max(1, q.valid) > .8) n.push('Mais de 80% das vendas têm horário de hora cheia: empates são esperados e foram rateados.');
  if (q.offLayout) n.push(`${int(q.offLayout)} ocorrências citam poltronas fora da planta “${S.LAYOUTS[a.layout].badge}”. Se o número for alto, troque a planta.`);
  if (q.assumedDeparture) n.push(`O arquivo não traz hora da partida, só a data. A antecedência é contada em dias de calendário e as vendas do próprio dia do embarque entram com 0 dia — não são descartadas.`);
  if (q.afterDeparture) n.push(`${int(q.afterDeparture)} ${pl(q.afterDeparture, 'venda foi isolada', 'vendas foram isoladas')} por ${q.assumedDeparture ? 'terem data posterior à da viagem' : 'serem posteriores ao horário de partida'}.`);
  if (a.summary.singles) n.push(`${int(a.summary.singles)} viagens com uma única poltrona vendida entram no volume, mas não no percentil.`);
  if (a.summary.droppedTrips) n.push(`${int(a.summary.droppedTrips)} viagens ficaram fora pelo filtro de ocupação mínima.`);
  if (a.period.depMissing) n.push(`${int(a.period.depMissing)} viagens sem hora de partida não entram na antecedência.`);
  if (a.summary.resales) n.push(a.summary.includeResales
    ? `${int(a.summary.resales)} ${pl(a.summary.resales, 'compra repetida', 'compras repetidas')} da mesma poltrona na mesma viagem: você optou por contá-las, e ${brl0(a.summary.resaleRev)} delas estão somados à receita. Ordem e antecedência seguem vindo da primeira compra.`
    : `${int(a.summary.resales)} ${pl(a.summary.resales, 'compra repetida', 'compras repetidas')} da mesma poltrona na mesma viagem: vale a primeira, e ${brl0(a.summary.resaleRev)} dessas repetições ficaram fora da receita para não contar o lugar duas vezes.`);
  if (!st.ds || !st.ds.headers || !st.ds.headers.some(h => /tipo\s*venda|situa|status/i.test(h)))
    n.push('O arquivo não traz coluna de situação da venda, então cancelamentos não são identificados um a um — a regra da primeira compra é o que protege o cálculo nesses casos.');
  if (q.noRevenue) n.push(`${int(q.noRevenue)} registros sem valor: eles contam no volume, mas não na receita nem na simulação.`);
  n.push(`Recorte: ${dt(a.period.start)} a ${dt(a.period.end)} · amostra mínima ${int(a.minN)} · planta ${S.LAYOUTS[a.layout].badge}.`);
  $('#qnotes').innerHTML = n.map(x => `<div><i>—</i><span>${esc(x)}</span></div>`).join('');
}

/* ══════ SIMULADOR ══════ */
const sim = { scope: '3', seat: null, rank: 'volume', mode: 'pct', pct: 10, abs: 5, from: '', to: '' };

/* A análise completa é cara e só muda quando o período ou os filtros
   mudam — não quando o usuário arrasta o percentual. Guardamos o
   resultado por chave; mexer no slider passa a ser só aritmética. */
const simCache = { key: '', an: null };
function simBase() {
  const o = Object.assign({}, opts(false), { start: sim.from || null, end: sim.to || null });
  const key = JSON.stringify(o);
  if (simCache.key === key && simCache.an) return simCache.an;
  simCache.an = S.analyze(st.ds, o);
  simCache.key = key;
  return simCache.an;
}
const invalidateSim = () => { simCache.key = ''; simCache.an = null; };
function openSim(pre) {
  if (!st.an) return;
  if (pre && pre.scope) { sim.scope = pre.scope; if (pre.seat) sim.seat = pre.seat; }
  if (pre && pre.rank) sim.rank = pre.rank;
  if (!sim.from) { sim.from = $('#from').value || st.an.period.start || ''; sim.to = $('#to').value || st.an.period.end || ''; }
  $('#simFrom').value = sim.from; $('#simTo').value = sim.to;
  $('#simSeat').innerHTML = st.an.seats.filter(s => s.appear).map(s =>
    `<option value="${s.seat}"${s.seat === (sim.seat || st.seat) ? ' selected' : ''}>Poltrona ${s.seat} · ${esc(s.position)} · ${brl0(s.revenue)}</option>`).join('');
  if (!sim.seat) sim.seat = st.seat;
  if (pre && pre.mode) sim.mode = pre.mode;
  if (pre && pre.abs != null) sim.abs = pre.abs;
  if (pre && pre.pct != null) sim.pct = pre.pct;
  $('#simRank').value = sim.rank;
  $('#simPct').value = sim.pct; $('#simPctTxt').textContent = '+' + sim.pct + '%';
  $('#simAbs').value = sim.abs; $('#simAbsTxt').textContent = '+' + brl0(sim.abs);
  $$('#simScope .chip').forEach(c => c.classList.toggle('on', c.dataset.scope === sim.scope));
  $$('#simPreset .chip').forEach(c => c.classList.toggle('on', Number(c.dataset.pct) === sim.pct));
  $$('#simAbsPreset .chip').forEach(c => c.classList.toggle('on', Number(c.dataset.abs) === sim.abs));
  syncSimMode();
  $('#simSeatWrap').hidden = sim.scope !== 'one';
  $('#simOut').innerHTML = '';
  $('#dlgSim').showModal();
  renderSim(true);
}
function syncSimMode() {
  $$('#simMode button').forEach(b => b.classList.toggle('on', b.dataset.mode === sim.mode));
  $('#simModePct').hidden = sim.mode !== 'pct';
  $('#simModeAbs').hidden = sim.mode !== 'abs';
}
function simSeats(an) {
  if (sim.scope === 'one') { const s = an.seats.find(x => x.seat === Number(sim.seat)); return s ? [s] : []; }
  const n = Number(sim.scope) || 5;
  const list = sim.rank === 'volume' ? an.topRevenue10 : sim.rank === 'first' ? an.top10 : sim.rank === 'advance' ? an.topLead10 : an.byScore;
  const out = list.slice(0, n);
  return out.length ? out : an.seats.filter(s => s.appear).sort((a, b) => b.revenue - a.revenue).slice(0, n);
}
const simOpts = () => sim.mode === 'abs'
  ? { mode: 'abs', abs: sim.abs }
  : { mode: 'pct', pct: sim.pct };
const simLabel = () => sim.mode === 'abs' ? `+${brl0(sim.abs)} por bilhete` : `+${sim.pct}%`;

/* Repintura em dois níveis: arrastar o slider só reescreve os números
   (barato, cabe num frame); a estrutura da tela é remontada apenas
   quando muda a seleção de poltronas ou o período. */
let simFrame = 0;
function renderSim(structural) {
  if (simFrame) cancelAnimationFrame(simFrame);
  simFrame = requestAnimationFrame(() => { simFrame = 0; doRenderSim(structural); });
}
function doRenderSim(structural) {
  const an = simBase();
  const seats = simSeats(an);
  const r = S.simulate(an, Object.assign(simOpts(), { seats }));
  st.sim = { r, an, seats };
  $('#simSub').textContent = `${dt(an.period.start)} a ${dt(an.period.end)} · ${int(an.period.tripCount)} viagens · ${seats.length} ${pl(seats.length, 'poltrona', 'poltronas')} no cenário`;

  const maxBar = Math.max(r.base, r.novo, 1);
  const curveMax = Math.max(...r.curve.map(c => Math.abs(c.v)), 1);
  const curLabel = c => c.abs ? `+${brl0(c.p)}` : `+${c.p}%`;
  const curOn = c => c.abs ? Math.abs(c.p - sim.abs) < .01 : c.p === sim.pct;

  /* a conta escrita por extenso, com os números do recorte */
  const passo = sim.mode === 'abs'
    ? `<code>${int(r.tickets)} bilhetes × ${brl(sim.abs)} = <b>${brl0(r.delta)}</b></code>`
    : `<code>${brl0(r.base)} × ${sim.pct}% = <b>${brl0(r.delta)}</b></code>`;

  const html = `
    <div class="bigres">
      <div><small>Foi cobrado</small><b id="rBase">—</b><span>${int(r.tickets)} bilhetes já vendidos</span></div>
      <div><small>Teria sido com ${esc(simLabel())}</small><b class="acc" id="rNovo">—</b><span>os mesmos bilhetes</span></div>
      <div><small>Deixou de entrar</small><b class="up" id="rDelta">—</b><span>${brl(r.porBilhete)} por bilhete</span></div>
      <div><small>Equivale em 12 meses</small><b class="up" id="rYear">—</b><span>${brl(r.perDay)} por dia</span></div>
    </div>
    <div class="simchart">
      <h4>A conta</h4>
      <div class="calcbox">${passo}
        <p>Estes bilhetes <b>já foram vendidos</b>. A conta não estima procura futura: ela remarca o que saiu pelo preço maior e mostra a diferença — ${pct(r.deltaPct, 1)} a mais sobre a receita dessas poltronas.</p>
      </div>
      <h4 style="margin-top:16px">Antes e depois</h4>
      <div class="cmp">
        <div class="cmprow"><span>Cobrado</span><div class="tk"><i class="a" data-w="${(r.base / maxBar * 100).toFixed(1)}"></i></div><span class="vv">${brl0(r.base)}</span></div>
        <div class="cmprow"><span>Com ajuste</span><div class="tk"><i class="b" data-w="${(r.novo / maxBar * 100).toFixed(1)}"></i></div><span class="vv" style="color:var(--acc)">${brl0(r.novo)}</span></div>
      </div>
      <h4 style="margin-top:16px">Quanto por tamanho do ajuste</h4>
      <div class="cmp">${r.curve.filter(c => c.p > 0).map(c => `<div class="cmprow"><span>${curLabel(c)}</span>
        <div class="tk"><i class="${curOn(c) ? 'b' : 'a'}" data-w="${(Math.abs(c.v) / curveMax * 100).toFixed(1)}"></i></div>
        <span class="vv"${curOn(c) ? ' style="color:var(--acc)"' : ''}>${brl0(c.v)}</span></div>`).join('')}</div>
    </div>
    <div class="simtbl">
      <div class="r h"><span>Nº</span><span>Posição</span><span>Bilhetes</span><span>Ticket</span><span>Cobrado</span><span>Não cobrado</span></div>
      ${r.seats.map((x, i) => `<div class="r${i < 3 ? ' t' : ''}"><span>${x.seat}</span><span>${esc(x.position)} · ${esc(x.side)}</span>
        <span>${int(x.tickets)}</span><span>${brl(x.avgRev)} → ${brl(x.novoTicket)}</span><span>${brl0(x.base)}</span>
        <span style="color:var(--acc);font-weight:800">+${brl0(x.delta)}</span></div>`).join('')}
    </div>
    <div class="simnote">A seleção é <b>${pct(r.share, 1)}</b> da receita do recorte; no total isso daria <b>${pct(r.totalDeltaPct, 2)}</b> a mais (${brl0(r.totalBase)} → ${brl0(r.totalNovo)}).
      ${sim.mode === 'abs' ? `Somar ${brl(sim.abs)} por bilhete equivale a ${pct(r.pctEfetivo, 1)} sobre o ticket médio. ` : ''}Os 12 meses apenas estendem o ritmo do período — supõem a mesma procura, e um aumento real pode afastar parte dos passageiros.</div>`;

  const out = $('#simOut');
  const first = !out.children.length;
  out.innerHTML = html;
  /* contagem animada só na abertura; no arrasto o número entra direto */
  if (first || structural) {
    countUp($('#rBase'), r.base, v => brl0(v));
    countUp($('#rNovo'), r.novo, v => brl0(v), 700);
    countUp($('#rDelta'), r.delta, v => (v >= 0 ? '+' : '') + brl0(v), 700);
    countUp($('#rYear'), r.perYear, v => (v >= 0 ? '+' : '') + brl0(v), 800);
  } else {
    $('#rBase').textContent = brl0(r.base);
    $('#rNovo').textContent = brl0(r.novo);
    $('#rDelta').textContent = (r.delta >= 0 ? '+' : '') + brl0(r.delta);
    $('#rYear').textContent = (r.perYear >= 0 ? '+' : '') + brl0(r.perYear);
  }
  $$('#simOut .tk i').forEach(i => { i.style.width = i.dataset.w + '%'; });
  if ($('#simAbsHint')) {
    const tm = r.tickets ? r.base / r.tickets : 0;
    $('#simAbsHint').textContent = tm
      ? `Ticket médio da seleção hoje: ${brl(tm)}. Somar ${brl0(sim.abs)} equivale a ${pct(r.pctEfetivo, 1)}.`
      : 'Sem receita na seleção para comparar.';
  }
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
/* Todo arquivo analisado vira um estudo no histórico. O diálogo abre
   logo após a importação só para o usuário dar um nome — se ele
   fechar, o estudo é gravado com o nome sugerido mesmo assim. */
function askSave(o) {
  if (!st.an) return;
  const a = st.an, auto = !!(o && o.auto);
  const guess = `${a.sourceName.replace(/\.(csv|txt)$/i, '')} · ${dt(a.period.start)} a ${dt(a.period.end)}`;
  saveCtx.auto = auto;
  saveCtx.id = auto ? null : saveCtx.id;
  $('#saveName').value = guess;
  $('#saveTitle').innerHTML = auto ? 'Como quer <b>chamar este estudo?</b>' : 'Que nome dar a <b>este estudo?</b>';
  $('#saveHint').textContent = (auto ? 'Ele já está no histórico deste navegador. ' : '')
    + `${S.LAYOUTS[a.layout].badge} · ${int(a.period.tripCount)} viagens · ${brl0(a.summary.revenue)} · amostra mínima ${int(a.minN)}`;
  $('#dlgSave').showModal();
  setTimeout(() => { $('#saveName').focus(); $('#saveName').select(); }, 60);
  if (auto) doSave({ silent: true });   /* grava já; renomear depois só atualiza */
}
const saveCtx = { auto: false, id: null };
/* silent = gravação automática logo após a importação; sem silent é o
   usuário confirmando o nome, que atualiza o mesmo registro. */
async function doSave(o) {
  const silent = !!(o && o.silent === true);
  const name = ($('#saveName').value || '').trim();
  if (!name) { toast('Dê um nome', 'O estudo precisa de um nome para ficar no histórico.', true); return; }
  const a = st.an;
  if (!saveCtx.id) saveCtx.id = 'e' + Date.now().toString(36) + Math.floor(Math.random() * 1e4).toString(36);
  const rec = { id: saveCtx.id,
    name, savedAt: new Date().toISOString(), layout: a.layout, source: a.sourceName,
    snap: snapshot(a), filters: a.filters, sim: st.sim ? st.sim.r : null };
  try {
    await DB.put(rec);
    await loadHist();
    if (silent) return;
    $('#dlgSave').close();
    toast(saveCtx.auto ? 'Estudo renomeado' : 'Estudo salvo', `“${name}” está no histórico deste navegador.`);
    saveCtx.auto = false;
  } catch (e) { if (!silent) toast('Não deu para salvar', e.message || String(e), true); }
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
  $('#home').hidden = true; $('#dash').hidden = false;
  $('#resume').hidden = true;
  saveCtx.id = rec.id; saveCtx.auto = false; invalidateSim();
  syncActions();
  document.title = `${rec.name} · Estudo de Poltronas`;
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
$('#btnDemo').addEventListener('click', async () => {
  load('Gerando demonstração…', '60 viagens sintéticas', .12, 'Demonstração');
  try {
    await pause(320);
    phase('Reconstruindo as viagens…'); prog(.55); await pause(280);
    st.ds = S.parseText(demoCsv(), 'Demonstração.csv'); st.layout = ''; st.layoutManual = false; st.sim = null;
    saveCtx.id = null; invalidateSim();
    phase('Calculando as métricas…'); prog(.82); await pause(260);
    run(true);
    prog(1, 'Pronto');
    await unloadSmooth(900);
    toast('Demonstração carregada', 'Números fictícios, só para conhecer o painel. Não vai para o histórico.');
  } catch (e) { unload(); toast('Falha', e.message, true); }
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
  invalidateSim();
  load('Recalculando…', 'Aplicando filtros ao recorte', .3, 'Atualização');
  setTimeout(() => {
    try { run(false); prog(1); unloadSmooth(520); }
    catch (e) { unload(); toast('Não deu para aplicar', e.message, true); }
  }, 40);
}
/* ── filtros: botão flutuante e modal central ───────── */
function openFilters() {
  if (!st.an) return;
  const a = st.an;
  $('#filSub').textContent = `${dt(a.period.start)} a ${dt(a.period.end)} · ${int(a.period.tripCount)} viagens · ${brl0(a.summary.revenue)}`;
  $('#dlgFilters').showModal();
}
$('#fab').addEventListener('click', openFilters);
$('#btnApply').addEventListener('click', () => { $('#dlgFilters').close(); apply(); });
/* todos os campos de recorte, num só lugar */
const FILTER_IDS = ['fMarket', 'fLine', 'fOrigin', 'fDest', 'fRoute', 'fService', 'fClass', 'fChannel', 'fWeek'];
$('#btnClear').addEventListener('click', () => {
  FILTER_IDS.forEach(id => $('#' + id).value = '');
  $('#fOcc').value = '0'; $('#fLead').value = 'all';
  st.layoutManual = false;
  $('#dlgFilters').close();
  apply();
});
/* Dentro do modal nada recalcula sozinho: o usuário monta o recorte
   inteiro e só então pede o resultado. Evita meia dúzia de análises
   no meio do caminho — e o overlay piscando por cima do modal. */
['from', 'to', 'minN', 'layout', ...FILTER_IDS, 'fOcc', 'fLead'].forEach(id => {
  $('#' + id).addEventListener('change', e => {
    /* escolher a planta na mão desliga a detecção automática */
    if (id === 'layout') { st.layout = e.target.value; st.layoutManual = true; }
    updateFabCount();
  });
});
/* o contador no botão conta o que está selecionado, mesmo antes de aplicar */
function updateFabCount() {
  let n = FILTER_IDS.filter(id => $('#' + id).value).length;
  if ($('#fOcc').value && $('#fOcc').value !== '0') n++;
  if ($('#fLead').value && $('#fLead').value !== 'all') n++;
  const b = $('#fabCount');
  b.textContent = n; b.hidden = !n;
}

/* ══════════════════════════════════════════════════════════════
   FILTROS ATIVOS
   Numa base grande é fácil esquecer o que está ligado e ler o
   número errado. Os filtros em vigor ficam visíveis abaixo do deck,
   cada um removível com um clique.
   ══════════════════════════════════════════════════════════════ */
const FILTER_LABELS = {
  fMarket: 'Mercado', fLine: 'Linha', fOrigin: 'Origem', fDest: 'Destino', fRoute: 'Trecho',
  fService: 'Serviço', fClass: 'Classe', fChannel: 'Canal', fWeek: 'Dia', fOcc: 'Ocupação', fLead: 'Antecedência'
};
function renderActiveFilters() {
  const host = $('#activeFilters'); if (!host) return;
  const on = [];
  FILTER_IDS.forEach(id => {
    const el = $('#' + id);
    if (el && el.value) on.push({ id, label: FILTER_LABELS[id], text: el.options[el.selectedIndex].text.replace(/\s*\(\d[\d.]*\)\s*$/, '') });
  });
  if ($('#fOcc').value && $('#fOcc').value !== '0') on.push({ id: 'fOcc', label: FILTER_LABELS.fOcc, text: $('#fOcc').options[$('#fOcc').selectedIndex].text, reset: '0' });
  if ($('#fLead').value && $('#fLead').value !== 'all') on.push({ id: 'fLead', label: FILTER_LABELS.fLead, text: $('#fLead').options[$('#fLead').selectedIndex].text, reset: 'all' });
  host.hidden = !on.length;
  host.innerHTML = on.map(f => `<button class="fchip" type="button" data-drop="${f.id}" data-reset="${f.reset || ''}"
    title="Remover este filtro"><i>${esc(f.label)}</i>${esc(f.text)}<svg><use href="#s-x"/></svg></button>`).join('')
    + (on.length > 1 ? '<button class="fchip clear" type="button" data-drop="all">Limpar tudo</button>' : '');
  updateFabCount();
}
$('#activeFilters').addEventListener('click', e => {
  const b = e.target.closest('[data-drop]'); if (!b) return;
  if (b.dataset.drop === 'all') return $('#btnClear').click();
  $('#' + b.dataset.drop).value = b.dataset.reset || '';
  apply();
});
$('#rankSwitch').addEventListener('click', e => {
  const b = e.target.closest('[data-rank]'); if (!b || b.dataset.rank === st.rank) return;
  st.rank = b.dataset.rank; DB.setPref('rank', st.rank);
  const t = activeTop(); if (t[0]) st.seat = t[0].seat;
  renderOrderWarn();
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
  /* fechar por [data-close] precisa passar pelo mesmo caminho de
     closeCfg, senão a gaveta some mas a classe que empurra o
     conteúdo fica — e a página volta torta, com folga à direita */
  const c = e.target.closest('[data-close]');
  if (c) { if (c.dataset.close === 'dlgCfg') closeCfg(); else $('#' + c.dataset.close).close(); }
});
/* ── exportação: um botão, dois formatos ────────────── */
function closeExportMenu() {
  $('#exportMenu').hidden = true;
  $('#btnExport').setAttribute('aria-expanded', 'false');
}
$('#btnExport').addEventListener('click', e => {
  e.stopPropagation();
  const m = $('#exportMenu');
  if (!m.hidden) return closeExportMenu();
  const r = $('#btnExport').getBoundingClientRect();
  m.hidden = false;
  const b = m.getBoundingClientRect();
  m.style.left = Math.max(10, Math.min(innerWidth - b.width - 10, r.left + r.width / 2 - b.width / 2)) + 'px';
  m.style.top = (r.bottom + 8) + 'px';
  $('#btnExport').setAttribute('aria-expanded', 'true');
});
document.addEventListener('click', e => {
  if (!$('#exportMenu').hidden && !e.target.closest('#exportMenu') && !e.target.closest('#btnExport')) closeExportMenu();
});
document.addEventListener('keydown', e => { if (e.key === 'Escape') closeExportMenu(); });
addEventListener('resize', closeExportMenu);
$('#exportMenu').addEventListener('click', e => {
  const b = e.target.closest('[data-fmt]'); if (!b) return;
  closeExportMenu();
  b.dataset.fmt === 'pdf' ? exportPdf() : exportXlsx();
});
function exportXlsx() {
  try {
    OUT.xlsx(st.an, { title: 'Estudo de Poltronas', topSeats: activeTop(), sim: st.sim ? st.sim.r : null,
      filename: `estudo-poltronas_${st.an.period.start || 'inicio'}_a_${st.an.period.end || 'fim'}.xlsx` });
    toast('XLSX gerado', 'Resumo, poltronas, ritmo, simulação e metodologia.');
  } catch (e) { toast('Falha no XLSX', e.message || String(e), true); }
}
/* O PDF sai sempre no tema claro (papel). A escala segue as mesmas
   escolhas do painel: paleta, inversão e contraste. */
function pdfRamp() {
  const src = st.pdfColor ? PALS[st.pal] : PALS.cinza;
  const sp = st.inv ? [...src.light].reverse() : src.light;
  return sp.map(h => h.replace('#', ''));
}
/* Retrato do estado atual da tela: o PDF sai com a métrica que está
   no mapa, o ranking selecionado, os filtros aplicados e a mesma
   escala de cor — inclusive sensibilidade e inversão. */
function screenState() {
  const a = st.an, M = METRICS[st.metric];
  const pos = seatPositions();
  const heat = {};
  a.seats.forEach(s => { if (pos.has(s.seat)) heat[s.seat] = curve(pos.get(s.seat)); });

  const rotulo = { advance: 'Maior antecedência', first: 'Vendem primeiro', volume: 'Mais vendidas' };
  const f = [];
  const push = (k, v) => { if (v) f.push([k, v]); };
  push('Período', `${dt(a.period.start)} a ${dt(a.period.end)}`);
  push('Amostra mínima', `${int(a.minN)} viagens`);
  push('Planta', S.LAYOUTS[a.layout].badge);
  const sel = id => { const el = $('#' + id); return el && el.value ? el.options[el.selectedIndex].text.replace(/\s*\(\d[\d.]*\)\s*$/, '') : ''; };
  push('Mercado', sel('fMarket')); push('Linha', sel('fLine'));
  push('Origem', sel('fOrigin')); push('Destino', sel('fDest')); push('Trecho', sel('fRoute'));
  push('Serviço', sel('fService')); push('Classe', sel('fClass')); push('Canal', sel('fChannel'));
  push('Dia da semana', sel('fWeek'));
  if ($('#fOcc').value && $('#fOcc').value !== '0') push('Ocupação mínima', sel('fOcc'));
  if ($('#fLead').value && $('#fLead').value !== 'all') push('Antecedência', sel('fLead'));

  return {
    heat, metricLabel: M.label, metricDesc: M.desc,
    legendLow: M.low(a), legendHigh: M.high(a),
    rankLabel: rotulo[st.rank] || '', filters: f,
    scale: `${st.duo ? 'cores personalizadas' : PALS[st.pal].name}${st.inv ? ' · invertida' : ''} · sensibilidade ${SENS_TXT(st.sens)} · referência ${st.span === 'rank' ? 'posição no ranking' : st.span === 'minmax' ? 'mínimo a máximo' : 'zero ao máximo'}`
  };
}
function exportPdf() {
  try {
    const s = screenState();
    OUT.pdf(st.an, Object.assign({
      title: 'Estudo de Poltronas', topSeats: activeTop(), sim: st.sim ? st.sim.r : null,
      ramp: pdfRamp(), acc: '1A1A18', invert: st.inv,
      filename: `estudo-poltronas_${st.an.period.start || 'inicio'}_a_${st.an.period.end || 'fim'}.pdf`
    }, s));
    toast('PDF gerado', `Espelha a tela: ${s.metricLabel.toLowerCase()}, ${s.filters.length} ${pl(s.filters.length, 'filtro', 'filtros')} e a escala em uso.`);
  } catch (e) { toast('Falha no PDF', e.message || String(e), true); }
}
$('#btnReset').addEventListener('click', () => {
  st.ds = st.an = null; st.layout = ''; st.layoutManual = false; st.sim = null;
  saveCtx.id = null; saveCtx.auto = false; invalidateSim();
  $('#dash').hidden = true; $('#home').hidden = false;
  $('#advice').hidden = true; $('#resume').hidden = true;
  syncActions();
  document.title = 'Estudo de Poltronas'; $('#file').value = '';
  loadHist().then(offerResume);
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
  renderSim(true);
});
$('#simSeat').addEventListener('change', e => { sim.seat = Number(e.target.value); renderSim(true); });
$('#simRank').addEventListener('change', e => { sim.rank = e.target.value; renderSim(true); });
$('#simMode').addEventListener('click', e => {
  const b = e.target.closest('[data-mode]'); if (!b || b.dataset.mode === sim.mode) return;
  sim.mode = b.dataset.mode; syncSimMode(); renderSim(true);
});
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
$('#simAbs').addEventListener('input', e => {
  sim.abs = Math.max(0, Number(e.target.value) || 0);
  $('#simAbsTxt').textContent = '+' + brl0(sim.abs);
  $$('#simAbsPreset .chip').forEach(c => c.classList.toggle('on', Number(c.dataset.abs) === sim.abs));
  renderSim();
});
$('#simAbsPreset').addEventListener('click', e => {
  const b = e.target.closest('[data-abs]'); if (!b) return;
  sim.abs = Number(b.dataset.abs); $('#simAbs').value = sim.abs;
  $('#simAbsTxt').textContent = '+' + brl0(sim.abs);
  $$('#simAbsPreset .chip').forEach(c => c.classList.toggle('on', c === b));
  renderSim();
});
/* recomendação: alterna entre ler o aumento em % e em reais */
$('#advTabs').addEventListener('click', e => {
  const b = e.target.closest('[data-adv]'); if (!b || b.dataset.adv === adv.mode) return;
  adv.mode = b.dataset.adv;
  $$('#advTabs button').forEach(x => x.classList.toggle('on', x === b));
  renderAdvice();
});
$('#advSim').addEventListener('click', () => {
  if (!adv.last) return openSim();
  openSim({ scope: '3', rank: 'score', mode: adv.mode, abs: adv.last.absSug, pct: adv.last.pctSug });
});
$('#simFrom').addEventListener('change', e => { sim.from = e.target.value; invalidateSim(); renderSim(true); });
$('#simTo').addEventListener('change', e => { sim.to = e.target.value; invalidateSim(); renderSim(true); });
$('#simReset').addEventListener('click', () => {
  sim.from = $('#from').value || st.an.period.start || ''; sim.to = $('#to').value || st.an.period.end || '';
  $('#simFrom').value = sim.from; $('#simTo').value = sim.to; invalidateSim(); renderSim(true);
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
/* ══════════════════════════════════════════════════════════════
   RETOMAR
   Fechar a guia no meio de um estudo não deveria custar o trabalho
   já feito. As métricas ficam em IndexedDB desde a importação, então
   basta oferecer o último estudo de volta — sem abrir nada sozinho,
   porque a intenção de quem volta pode ser começar outro.
   ══════════════════════════════════════════════════════════════ */
const RESUME_SKIP = 'poltronas:resume:dispensado';
function quando(iso) {
  const d = new Date(iso), agora = Date.now(), min = Math.round((agora - d.getTime()) / 60000);
  if (min < 2) return 'agora há pouco';
  if (min < 60) return `há ${min} minutos`;
  const h = Math.round(min / 60);
  if (h < 24) return `há ${h} ${pl(h, 'hora', 'horas')}`;
  const dias = Math.round(h / 24);
  if (dias < 30) return `há ${dias} ${pl(dias, 'dia', 'dias')}`;
  return `em ${d.toLocaleDateString('pt-BR')}`;
}
function offerResume() {
  const el = $('#resume');
  if (!el || st.an || !st.hist.length) return;
  const r = st.hist[0];
  let skip = '';
  try { skip = localStorage.getItem(RESUME_SKIP) || ''; } catch (e) {}
  if (skip === r.id) return;
  const s = r.snap || {};
  const p = s.period || {};
  $('#resumeName').textContent = r.name;
  $('#resumeMeta').textContent = [
    `salvo ${quando(r.savedAt)}`,
    p.start ? `${dt(p.start)} a ${dt(p.end)}` : null,
    p.tripCount ? `${int(p.tripCount)} viagens` : null,
    (S.LAYOUTS[r.layout] || {}).badge
  ].filter(Boolean).join(' · ');
  el.hidden = false;
}
$('#resumeGo').addEventListener('click', () => {
  if (st.hist[0]) openStudy(st.hist[0].id);
});
$('#resumeAll').addEventListener('click', openHist);
$('#resumeDismiss').addEventListener('click', () => {
  $('#resume').hidden = true;
  try { if (st.hist[0]) localStorage.setItem(RESUME_SKIP, st.hist[0].id); } catch (e) {}
});

/* ══════════════════════════════════════════════════════════════
   AMOSTRA DA ENTRADA
   Números fictícios, só ilustrativos. O ônibus enche em ordem
   sorteada mas com viés: as cinco poltronas destacadas acendem
   cedo, que é justamente o padrão que o estudo procura.
   ══════════════════════════════════════════════════════════════ */
const PV_MARKS = ['2 meses antes', '1 mês antes', '3 semanas antes', '2 semanas antes',
  '1 semana antes', '5 dias antes', '3 dias antes', '2 dias antes', 'véspera', 'partida'];
function buildPreview() {
  const bus = $('#pvBus'); if (!bus) return;
  const HOT = new Set([2, 3, 14, 15, 26]);   /* as "campeãs" da amostra */
  const linhas = [[], [], [], []];
  for (let i = 0; i < 48; i++) linhas[i % 4].push(i);
  bus.innerHTML = linhas.map((r, ri) =>
    `<div class="pvrow${ri === 2 ? ' aisle' : ''}">` +
    r.map(i => `<i class="pvseat${HOT.has(i) ? ' hot' : ''}" data-i="${i}"></i>`).join('') +
    '</div>').join('');

  /* momento em que cada poltrona acende: as destacadas bem antes */
  const quando = new Map();
  for (let i = 0; i < 48; i++) {
    const base = HOT.has(i) ? 1 + Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 7);
    quando.set(i, Math.min(9, base));
  }
  /* intensidade fictícia por poltrona, para a amostra já sair na
     paleta escolhida em vez de um bloco chapado */
  const calor = new Map();
  for (let i = 0; i < 48; i++) {
    calor.set(i, HOT.has(i) ? .82 + Math.random() * .18 : .1 + Math.random() * .6);
  }
  let passo = 0;
  const pinta = () => {
    const sp = stops();
    $$('#pvBus .pvseat').forEach(el => {
      const i = Number(el.dataset.i);
      const on = quando.get(i) <= passo;
      el.classList.toggle('on', on);
      el.style.background = on ? rgb(ramp(calor.get(i), sp)) : '';
    });
    $('#pvWhen').textContent = PV_MARKS[passo];
  };
  pinta();
  setInterval(() => {
    passo++;
    if (passo > 11) { passo = 0; quando.forEach((v, k) => quando.set(k, HOT.has(k) ? 1 + Math.floor(Math.random() * 3) : 3 + Math.floor(Math.random() * 7))); }
    if (passo <= 9) pinta();
  }, 900);

  buildTell();
}

/* ══════════════════════════════════════════════════════════════
   O QUE DÁ PARA DESCOBRIR
   Um painel que troca devagar entre algumas leituras que o estudo
   entrega. Cada frase vem com um desenho simples do próprio
   raciocínio — nada de números reais aqui, é só o convite.
   Troca em 7 segundos, com dissolução longa: não é um carrossel
   que pisca, é algo que muda enquanto a pessoa lê a página.
   ══════════════════════════════════════════════════════════════ */
const TELL = [
  { t: 'Descubra quanto ficou na mesa',
    d: 'Se as poltronas mais disputadas tivessem saído um pouco mais caras, quanto teria entrado a mais no ano — sobre passagens que já foram vendidas.',
    art: 'money' },
  { t: 'Veja quais esgotam primeiro',
    d: 'Algumas poltronas vendem semanas antes do resto do veículo. São elas que aguentam um preço maior sem espantar ninguém.',
    art: 'curve' },
  { t: 'Compare mercado por mercado',
    d: 'Filtre por mercado, linha, origem, canal ou classe e veja se o padrão se repete ou se cada trecho tem o seu.',
    art: 'filter' },
  { t: 'Leve o estudo pronto',
    d: 'O relatório sai em PDF espelhando a tela, ou em Excel com a base auditável — para discutir o preço com número na mão.',
    art: 'doc' }
];
function tellArt(kind) {
  const W = 300, H = 118;
  if (kind === 'money') {
    const bars = [.28, .42, .55, .7, .88, 1];
    return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">` +
      bars.map((v, i) => {
        const x = 22 + i * 46, h = v * 74;
        return `<rect x="${x}" y="${H - 20 - h}" width="26" height="${h}" rx="5" class="tb" style="--i:${i}"/>` +
          (i === bars.length - 1 ? `<rect x="${x}" y="${H - 20 - h - 16}" width="26" height="13" rx="4" class="tbx"/>` : '');
      }).join('') +
      `<line x1="14" y1="${H - 19}" x2="${W - 14}" y2="${H - 19}" stroke="var(--line-2)"/></svg>`;
  }
  if (kind === 'curve') {
    const a = [0, .08, .2, .38, .6, .78, .9, 1], b = [0, .02, .07, .16, .3, .5, .74, 1];
    const cx = i => 20 + (i / 7) * (W - 40), cy = v => H - 22 - v * 74;
    const ln = p => p.map((v, i) => `${i ? 'L' : 'M'}${cx(i).toFixed(1)},${cy(v).toFixed(1)}`).join(' ');
    return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
      <line x1="14" y1="${cy(0)}" x2="${W - 14}" y2="${cy(0)}" stroke="var(--line-2)"/>
      <path class="tl b" d="${ln(b)}"/><path class="tl a" d="${ln(a)}"/>
      <circle class="tdot" cx="${cx(7)}" cy="${cy(1)}" r="4"/></svg>`;
  }
  if (kind === 'filter') {
    const chips = [[18, 26, 84], [110, 26, 62], [180, 26, 96], [18, 60, 70], [96, 60, 88], [192, 60, 74]];
    return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">` +
      chips.map((c, i) => `<rect x="${c[0]}" y="${c[1]}" width="${c[2]}" height="22" rx="11" class="tc" style="--i:${i}"/>`).join('') +
      `<rect x="18" y="94" width="140" height="8" rx="4" class="tc dim" style="--i:6"/></svg>`;
  }
  return `<svg viewBox="0 0 ${W} ${H}" aria-hidden="true">
    <rect x="86" y="14" width="74" height="92" rx="7" class="tp" style="--i:0"/>
    <rect x="146" y="24" width="74" height="92" rx="7" class="tp on" style="--i:1"/>
    <rect x="158" y="42" width="46" height="5" rx="2.5" class="tln"/>
    <rect x="158" y="56" width="38" height="5" rx="2.5" class="tln"/>
    <rect x="158" y="70" width="44" height="5" rx="2.5" class="tln"/>
    <rect x="158" y="84" width="26" height="5" rx="2.5" class="tln"/></svg>`;
}
function buildTell() {
  const host = $('#pvSlides'); if (!host) return;
  host.innerHTML = TELL.map((s, i) => `<article class="pvslide${i ? '' : ' on'}" data-i="${i}">
    <div class="pvart">${tellArt(s.art)}</div>
    <b>${esc(s.t)}</b><span>${esc(s.d)}</span>
  </article>`).join('');
  $('#pvDots').innerHTML = TELL.map((s, i) => `<i class="${i ? '' : 'on'}"></i>`).join('');
  let k = 0;
  setInterval(() => {
    k = (k + 1) % TELL.length;
    $$('#pvSlides .pvslide').forEach(el => el.classList.toggle('on', Number(el.dataset.i) === k));
    $$('#pvDots i').forEach((el, i) => el.classList.toggle('on', i === k));
  }, 7000);
}
buildPreview();

buildPal();
loadHist().then(offerResume);
syncActions();
reveal();
})();
