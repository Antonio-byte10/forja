// Gera proxima-versao/boneco/boneco.js a partir do mesmo código que o app usa
// (src/lib/boneco.ts + src/data/animacoes.ts), para a galeria e a ficha em HTML.
// Uso: node scripts/gerar-boneco-web.mjs
import { readFileSync, writeFileSync } from 'node:fs';
import ts from 'typescript';

const js = (arquivo) =>
  ts.transpileModule(readFileSync(arquivo, 'utf-8'), { compilerOptions: { target: 'ES2020', module: 'ESNext' } }).outputText
    .replace(/^import .*$/gm, '')
    .replace(/^export (type )?\{.*$/gm, '')
    .replace(/^export /gm, '');

const dom = `
const NS = 'http://www.w3.org/2000/svg';
const el = (tag, attrs, pai) => { const e = document.createElementNS(NS, tag); for (const k in attrs) e.setAttribute(k, attrs[k]); if (pai) pai.appendChild(e); return e; };
let seq = 0;
/** Anima um exercício num <svg>. opts: { acento, parado (nº da pose, a partir de 1) }. */
function animar(svg, anim, opts = {}) {
  const id = 'b' + seq++, c = caixa(anim), tons = paleta(opts.acento || '#FF5B1F');
  svg.setAttribute('viewBox', [c.x, c.y, c.w, c.h].join(' '));
  const defs = el('defs', {}, svg);
  el('line', { x1: c.x, x2: c.x + c.w, y1: 0.6, y2: 0.6, stroke: '#34343c', 'stroke-width': 1.2 }, svg);
  for (const o of anim.objetos || []) {
    if (o.tipo === 'banco') el('rect', { x: o.x, y: -o.y - o.h, width: o.w, height: o.h, rx: 3, fill: '#26262d', stroke: '#3f3f49' }, svg);
    if (o.tipo === 'parede') el('rect', { x: o.x, y: c.y, width: 14, height: -c.y, fill: '#202027', stroke: '#34343c' }, svg);
    if (o.tipo === 'barra') { el('line', { x1: o.x - 42, x2: o.x - 42, y1: -o.y, y2: 0, stroke: '#34343c', 'stroke-width': 3 }, svg); el('line', { x1: o.x + 42, x2: o.x + 42, y1: -o.y, y2: 0, stroke: '#34343c', 'stroke-width': 3 }, svg); el('line', { x1: o.x - 46, x2: o.x + 46, y1: -o.y, y2: -o.y, stroke: '#9aa0aa', 'stroke-width': 4, 'stroke-linecap': 'round' }, svg); }
  }
  const sombra = el('ellipse', { cy: 1.5, ry: 3.2, fill: '#000' }, svg);
  const grupo = el('g', {}, svg);
  let pecas = [];
  const pintar = (pose) => {
    const d = desenhar(anim, pose);
    sombra.setAttribute('cx', d.sombra.cx); sombra.setAttribute('rx', d.sombra.rx); sombra.setAttribute('opacity', d.sombra.opacidade);
    d.formas.forEach((fm, i) => {
      let p = pecas[i];
      if (!p) {
        const lg = el('linearGradient', { id: id + i, gradientUnits: 'userSpaceOnUse' }, defs);
        const stops = [0, 0.3, 0.62, 1].map((o) => el('stop', { offset: o }, lg));
        p = pecas[i] = { lg, stops, path: el('path', { fill: 'url(#' + id + i + ')' }, grupo), tom: '' };
      }
      if (p.tom !== fm.tom) { p.tom = fm.tom; p.stops.forEach((s, k) => s.setAttribute('stop-color', tons[fm.tom][k])); }
      p.path.setAttribute('d', fm.d);
      ['x1', 'y1', 'x2', 'y2'].forEach((k, j) => p.lg.setAttribute(k, fm.g[j]));
    });
  };
  if (opts.parado) { pintar(anim.poses[opts.parado - 1].pose); return () => {}; }
  let vivo = true; const t0 = performance.now();
  const quadro = (agora) => { if (!vivo) return; pintar(poseEm(anim, (agora - t0) / 1000)); requestAnimationFrame(quadro); };
  requestAnimationFrame(quadro);
  return () => { vivo = false; };
}
window.Boneco = { animar };
window.ANIMACOES = animacoes;
`;

const saida = `/* GERADO por scripts/gerar-boneco-web.mjs — não edite aqui; edite src/lib/boneco.ts e src/data/animacoes.ts. */
(function () {
${js('src/lib/boneco.ts')}
${js('src/data/animacoes.ts')}
${dom}
})();
`;
writeFileSync('proxima-versao/boneco/boneco.js', saida);
console.log('proxima-versao/boneco/boneco.js', (saida.length / 1024).toFixed(1) + ' KB');
