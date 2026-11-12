/**
 * Boneco animado: transforma poses (ângulos das articulações) em formas prontas para desenhar em SVG.
 * Não depende de React nem do navegador: o app desenha com react-native-svg e a galeria com SVG puro.
 *
 * Coordenadas do "mundo" em cm, y para cima, chão em y = 0. Ângulos em graus: 0 = direita, 90 = cima.
 * Vista lateral: de bruços a cabeça fica à direita; de costas, à esquerda.
 */

export type Ponto = [number, number];
/** Dois ângulos (osso de cima, osso de baixo) ou um alvo para a mão/pé alcançar. */
export type Membro = [number, number] | { alvo: [number | string, number]; curva?: number };

export type Pose = {
  vista?: 'frente';
  /** Direção do quadril até o meio das costas. */
  torso?: number;
  /** Quanto a parte de cima das costas dobra em relação à de baixo (abdominal, gato). */
  coluna?: number;
  cabeca?: number;
  bracoN: Membro; bracoF: Membro; pernaN: Membro; pernaF: Membro;
  maoN?: number; maoF?: number; peN?: number; peF?: number;
  /** [ponto do corpo, x, y]: onde esse ponto fica no mundo. */
  ancora?: [string, number, number];
};

export type Quadro = { pose: Pose; ida?: number; pausa?: number };
export type Objeto =
  | { tipo: 'banco'; x: number; y: number; w: number; h: number }
  | { tipo: 'parede'; x: number }
  | { tipo: 'barra'; x: number; y: number };
export type Parte = 'torso' | 'braco' | 'antebraco' | 'coxa' | 'canela';
export type Animacao = { nome: string; foco?: Parte[]; pegada?: 'normal' | 'aberta' | 'diamante'; objetos?: Objeto[]; poses: Quadro[] };

export type Tom = 'pele' | 'peleLonge' | 'foco' | 'focoLonge' | 'roupa' | 'roupaLonge';
/** Forma já em coordenadas de tela (y para baixo). `g`: de onde vem a luz até a sombra. */
export type Forma = { d: string; g: [number, number, number, number]; tom: Tom };
export type Desenho = { formas: Forma[]; sombra: { cx: number; rx: number; opacidade: number } };
export type Caixa = { x: number; y: number; w: number; h: number };

const L = { lombar: 26, peito: 26, ombro: 20, pescoco: 12, braco: 30, antebraco: 27, mao: 9, coxa: 44, canela: 44, pe: 20 };

const rad = (g: number) => (g * Math.PI) / 180;
const dir = (g: number): Ponto => [Math.cos(rad(g)), Math.sin(rad(g))];
const soma = (p: Ponto, v: Ponto, k = 1): Ponto => [p[0] + v[0] * k, p[1] + v[1] * k];
const angulo = (p: Ponto, q: Ponto) => (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;

type Osso = { base: Ponto; j1: Ponto; j2: Ponto; a1: number; a2: number; ponta: Ponto; calcanhar: Ponto };
export type Esqueleto = {
  pelve: Ponto; meio: Ponto; pescoco: Ponto; cabeca: Ponto; anguloCabeca: number; anguloPeito: number; frente: boolean;
  ombroN: Ponto; ombroF: Ponto; quadrilN: Ponto; quadrilF: Ponto;
  bracoN: Osso; bracoF: Osso; pernaN: Osso; pernaF: Osso;
};

/** Duas articulações alcançando um alvo; `curva` escolhe o lado do cotovelo/joelho. */
function alcancar(base: Ponto, alvo: Ponto, a: number, b: number, curva: number): [number, number] {
  const dx = alvo[0] - base[0], dy = alvo[1] - base[1];
  const d = Math.max(0.01, Math.min(Math.hypot(dx, dy), a + b - 0.01));
  const t = Math.atan2(dy, dx);
  const alfa = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
  const a1 = t + curva * alfa;
  const meio: Ponto = [base[0] + a * Math.cos(a1), base[1] + a * Math.sin(a1)];
  const fim: Ponto = [base[0] + d * Math.cos(t), base[1] + d * Math.sin(t)];
  return [(a1 * 180) / Math.PI, angulo(meio, fim)];
}

const MEMBROS = [
  ['bracoN', 'ombroN', L.braco, L.antebraco], ['bracoF', 'ombroF', L.braco, L.antebraco],
  ['pernaN', 'quadrilN', L.coxa, L.canela], ['pernaF', 'quadrilF', L.coxa, L.canela],
] as const;

/** Pose → posição de cada articulação. */
export function resolver(pose: Pose): Esqueleto {
  const frente = pose.vista === 'frente';
  const T = pose.torso ?? 90;
  const cima = T + (pose.coluna ?? 0);
  const lado = dir(T - 90);
  const pelve: Ponto = [0, 0];
  const meio = soma(pelve, dir(T), L.lombar);
  const pescoco = soma(meio, dir(cima), L.peito);
  const anguloCabeca = cima + (pose.cabeca ?? 0);
  const baseOmbro = soma(meio, dir(cima), L.ombro);
  const ladoCima = dir(cima - 90);
  const E = {
    pelve, meio, pescoco, cabeca: soma(pescoco, dir(anguloCabeca), L.pescoco), anguloCabeca, anguloPeito: cima, frente,
    ombroN: soma(baseOmbro, ladoCima, frente ? 18 : 0), ombroF: soma(baseOmbro, ladoCima, frente ? -18 : 0),
    quadrilN: soma(pelve, lado, frente ? 9 : 0), quadrilF: soma(pelve, lado, frente ? -9 : 0),
  } as Esqueleto;

  const montar = (nome: (typeof MEMBROS)[number][0], base: Ponto, a: number, b: number, [a1, a2]: [number, number]) => {
    const j1 = soma(base, dir(a1), a);
    const j2 = soma(j1, dir(a2), b);
    const perna = nome.startsWith('perna');
    const extra = pose[(perna ? 'pe' : 'mao') + nome.slice(-1) as 'peN'] ?? (perna ? a2 + 90 : a2);
    E[nome] = { base, j1, j2, a1, a2, ponta: soma(j2, dir(extra), perna ? L.pe : L.mao), calcanhar: soma(j2, dir(extra), -5) };
  };
  for (const [nome, base, a, b] of MEMBROS) {
    const m = pose[nome];
    if (Array.isArray(m)) montar(nome, E[base], a, b, m);
  }

  // Âncora: encaixa um ponto conhecido (pé, mão, quadril) no lugar certo do chão ou do aparelho.
  const [qual, ax, ay] = pose.ancora ?? ['pelve', 0, 93];
  const ref = pontoDe(E, qual);
  const dx = ax - ref[0], dy = ay - ref[1];
  const mover = (p?: Ponto) => { if (p) { p[0] += dx; p[1] += dy; } };
  for (const k of ['pelve', 'meio', 'pescoco', 'cabeca', 'ombroN', 'ombroF', 'quadrilN', 'quadrilF'] as const) mover(E[k]);
  for (const [nome] of MEMBROS) {
    const o = E[nome];
    if (o) for (const k of ['j1', 'j2', 'ponta', 'calcanhar'] as const) mover(o[k]);
  }

  for (const [nome, base, a, b] of MEMBROS) {
    const m = pose[nome];
    if (Array.isArray(m)) continue;
    const x = typeof m.alvo[0] === 'number' ? m.alvo[0] : E[base][0] + Number(m.alvo[0].slice(1));
    montar(nome, E[base], a, b, alcancar(E[base], [x, m.alvo[1]], a, b, m.curva ?? 1));
  }
  return E;
}

const ATALHOS: Record<string, [keyof Esqueleto, keyof Osso]> = {
  maoN: ['bracoN', 'ponta'], maoF: ['bracoF', 'ponta'], punhoN: ['bracoN', 'j2'], punhoF: ['bracoF', 'j2'],
  cotoveloN: ['bracoN', 'j1'], cotoveloF: ['bracoF', 'j1'], peN: ['pernaN', 'ponta'], peF: ['pernaF', 'ponta'],
  tornozeloN: ['pernaN', 'j2'], tornozeloF: ['pernaF', 'j2'], joelhoN: ['pernaN', 'j1'], joelhoF: ['pernaF', 'j1'],
};
function pontoDe(E: Esqueleto, qual: string): Ponto {
  const a = ATALHOS[qual];
  const p = a ? (E[a[0]] as Osso | undefined)?.[a[1]] : (E as unknown as Record<string, Ponto>)[qual];
  if (!p) throw new Error(`Âncora inválida: ${qual} (o membro precisa ser dado por ângulos)`);
  return p as Ponto;
}

// ---------- Interpolação ----------
const mix = (a: number, b: number, t: number) => a + (b - a) * t;
const mixAngulo = (a: number, b: number, t: number) => a + ((((b - a) % 360) + 540) % 360 - 180) * t;
const suave = (t: number) => t * t * (3 - 2 * t);
const numeroS = (v: number | string) => Number(String(v).slice(1));

function mixMembro(a: Membro, b: Membro, t: number): Membro {
  if (Array.isArray(a) && Array.isArray(b)) return [mixAngulo(a[0], b[0], t), mixAngulo(a[1], b[1], t)];
  if (!Array.isArray(a) && !Array.isArray(b)) {
    const x = typeof a.alvo[0] === 'number' && typeof b.alvo[0] === 'number' ? mix(a.alvo[0], b.alvo[0], t) : `S${mix(numeroS(a.alvo[0]), numeroS(b.alvo[0]), t)}`;
    return { alvo: [x, mix(a.alvo[1], b.alvo[1], t)], curva: a.curva };
  }
  return t < 0.5 ? a : b;
}

export function misturar(a: Pose, b: Pose, t: number): Pose {
  const n = (k: 'torso' | 'coluna' | 'cabeca', padrao: number) => mixAngulo(a[k] ?? padrao, b[k] ?? padrao, t);
  const opc = (k: 'maoN' | 'maoF' | 'peN' | 'peF') => (a[k] !== undefined && b[k] !== undefined ? mixAngulo(a[k], b[k], t) : t < 0.5 ? a[k] : b[k]);
  const aa = a.ancora ?? ['pelve', 0, 93], ab = b.ancora ?? ['pelve', 0, 93];
  return {
    vista: a.vista, torso: n('torso', 90), coluna: n('coluna', 0), cabeca: n('cabeca', 0),
    bracoN: mixMembro(a.bracoN, b.bracoN, t), bracoF: mixMembro(a.bracoF, b.bracoF, t),
    pernaN: mixMembro(a.pernaN, b.pernaN, t), pernaF: mixMembro(a.pernaF, b.pernaF, t),
    maoN: opc('maoN'), maoF: opc('maoF'), peN: opc('peN'), peF: opc('peF'),
    ancora: [t < 0.5 ? aa[0] : ab[0], mix(aa[1], ab[1], t), mix(aa[2], ab[2], t)],
  };
}

const tempos = (q: Quadro) => ({ ida: q.ida ?? 0.9, pausa: q.pausa ?? 0.25 });
export const duracao = (anim: Animacao) => anim.poses.reduce((s, q) => s + tempos(q).ida + tempos(q).pausa, 0);

/** Pose no instante `t` (segundos); a animação dá a volta sozinha. */
export function poseEm(anim: Animacao, t: number): Pose {
  const qs = anim.poses;
  let resto = ((t % duracao(anim)) + duracao(anim)) % duracao(anim);
  let i = 0;
  for (; i < qs.length - 1; i++) {
    const d = tempos(qs[i]).ida + tempos(qs[i]).pausa;
    if (resto < d) break;
    resto -= d;
  }
  const anterior = qs[(i - 1 + qs.length) % qs.length].pose;
  const { ida } = tempos(qs[i]);
  return misturar(anterior, qs[i].pose, resto < ida ? suave(resto / ida) : 1);
}

// ---------- Formas ----------
const tela = (p: Ponto): Ponto => [p[0], -p[1]];
const f = (n: number) => Math.round(n * 100) / 100;

/** Cápsula que afina de `r1` para `r2`: é o que dá cara de braço e perna em vez de palito. */
function capsula(pa: Ponto, pb: Ponto, r1: number, r2: number, tom: Tom): Forma {
  const a = tela(pa), b = tela(pb);
  const dx = b[0] - a[0], dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 0.001;
  let nx = -dy / len, ny = dx / len;
  const d = `M${f(a[0] + nx * r1)} ${f(a[1] + ny * r1)}L${f(b[0] + nx * r2)} ${f(b[1] + ny * r2)}A${r2} ${r2} 0 0 0 ${f(b[0] - nx * r2)} ${f(b[1] - ny * r2)}`
    + `L${f(a[0] - nx * r1)} ${f(a[1] - ny * r1)}A${r1} ${r1} 0 0 0 ${f(a[0] + nx * r1)} ${f(a[1] + ny * r1)}Z`;
  // Luz de cima e um pouco da esquerda: o gradiente atravessa o membro e dá o volume.
  if (nx * -0.45 + ny * -1 < 0) { nx = -nx; ny = -ny; }
  const h = Math.max(r1, r2), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
  return { d, g: [f(cx + nx * h), f(cy + ny * h), f(cx - nx * h), f(cy - ny * h)], tom };
}

function bola(p: Ponto, r: number, tom: Tom): Forma {
  const [x, y] = tela(p);
  return { d: `M${f(x - r)} ${f(y)}A${r} ${r} 0 1 0 ${f(x + r)} ${f(y)}A${r} ${r} 0 1 0 ${f(x - r)} ${f(y)}Z`, g: [f(x - r * 0.45), f(y - r), f(x + r * 0.45), f(y + r)], tom };
}

function pontosDoCorpo(E: Esqueleto): Ponto[] {
  const out: Ponto[] = [E.pelve, E.meio, E.pescoco, [E.cabeca[0] - 11, E.cabeca[1] - 11], [E.cabeca[0] + 11, E.cabeca[1] + 11]];
  for (const [nome] of MEMBROS) out.push(E[nome].j1, E[nome].j2, E[nome].ponta, E[nome].calcanhar);
  return out;
}

/** Esqueleto → formas na ordem de desenho (lado de longe, tronco, cabeça, lado de perto). */
export function desenhar(anim: Animacao, pose: Pose): Desenho {
  const E = resolver(pose);
  const foco = new Set<Parte>(anim.foco);
  const tom = (parte: Parte | null, longe: boolean): Tom => (parte && foco.has(parte) ? (longe ? 'focoLonge' : 'foco') : longe ? 'peleLonge' : 'pele');
  const formas: Forma[] = [];

  const braco = (o: Osso, longe: boolean) => {
    formas.push(
      bola(o.base, 6.6, tom('braco', longe)),
      capsula(o.base, o.j1, 6, 4.9, tom('braco', longe)),
      capsula(o.j1, o.j2, 4.8, 3.5, tom('antebraco', longe)),
      capsula(o.j2, o.ponta, 3.6, 2.9, tom(null, longe)),
    );
  };
  const perna = (o: Osso, longe: boolean) => {
    const short = soma(o.base, dir(o.a1), L.coxa * 0.42);
    formas.push(
      capsula(o.base, o.j1, 9.4, 6.4, tom('coxa', longe)),
      capsula(o.base, short, 10, 8.6, longe ? 'roupaLonge' : 'roupa'),
      capsula(o.j1, soma(o.j1, dir(o.a2), L.canela * 0.45), 6.3, 6, tom('canela', longe)),
      capsula(o.j1, o.j2, 6, 4.2, tom('canela', longe)),
      capsula(o.calcanhar, o.ponta, 4.2, 3, longe ? 'roupaLonge' : 'roupa'),
    );
  };
  const tronco = () => {
    const topo = soma(E.meio, dir(E.anguloPeito), L.peito - 7);
    if (E.frente) {
      formas.push(
        capsula(E.pelve, E.meio, 14, 13, tom('torso', false)),
        capsula(E.meio, topo, 13, 15, tom('torso', false)),
        capsula(E.ombroF, E.ombroN, 8, 8, tom('torso', false)),
        capsula(E.quadrilF, E.quadrilN, 10.5, 10.5, 'roupa'),
      );
    } else {
      formas.push(
        capsula(E.pelve, E.meio, 12.2, 11, tom('torso', false)),
        capsula(E.meio, topo, 11, 13.2, tom('torso', false)),
        bola(E.pelve, 12.6, 'roupa'),
      );
    }
    // Pescoço e cabeça: a cabeça é um oval com o queixo para o lado da frente.
    const adiante = dir(E.anguloCabeca - 90);
    formas.push(capsula(soma(E.pescoco, dir(E.anguloPeito), -3), soma(E.pescoco, dir(E.anguloCabeca), 5), 4.6, 4.2, tom(null, false)));
    if (!E.frente) formas.push(bola(soma(soma(E.cabeca, adiante, 3.2), dir(E.anguloCabeca), -4.2), 7.4, tom(null, false)));
    formas.push(bola(E.cabeca, 10.2, tom(null, false)));
  };

  if (E.frente) {
    perna(E.pernaF, false); perna(E.pernaN, false); tronco(); braco(E.bracoF, false); braco(E.bracoN, false);
  } else {
    braco(E.bracoF, true); perna(E.pernaF, true); tronco(); perna(E.pernaN, false); braco(E.bracoN, false);
  }

  const ps = pontosDoCorpo(E);
  const xs = ps.map((p) => p[0]);
  const min = Math.min(...xs), max = Math.max(...xs);
  const altura = Math.max(0, Math.min(...ps.map((p) => p[1])));
  return { formas, sombra: { cx: f((min + max) / 2), rx: f((max - min) / 2 + 6), opacidade: f(Math.max(0.12, 0.5 - altura / 150)) } };
}

/** Caixa 3:2 (como as fotos) onde cabem todas as poses e os aparelhos. */
export function caixa(anim: Animacao): Caixa {
  const pts: Ponto[] = [];
  anim.poses.forEach((q, i) => {
    const prox = anim.poses[(i + 1) % anim.poses.length].pose;
    for (const t of [0, 0.25, 0.5, 0.75]) pts.push(...pontosDoCorpo(resolver(misturar(q.pose, prox, t))).map(tela));
  });
  for (const o of anim.objetos ?? []) {
    if (o.tipo === 'banco') pts.push([o.x, -o.y - o.h], [o.x + o.w, 0]);
    if (o.tipo === 'barra') pts.push([o.x, -o.y - 6]);
    if (o.tipo === 'parede') pts.push([o.x + 14, 0]);
  }
  let x0 = Math.min(...pts.map((p) => p[0])) - 18, x1 = Math.max(...pts.map((p) => p[0])) + 18;
  let y0 = Math.min(...pts.map((p) => p[1])) - 18;
  const y1 = Math.max(0, ...pts.map((p) => p[1])) + 12;
  let w = x1 - x0, h = y1 - y0;
  if (w / h < 1.5) { x0 -= (h * 1.5 - w) / 2; w = h * 1.5; } else { y0 -= w / 1.5 - h; h = w / 1.5; }
  x1 = x0 + w;
  return { x: f(x0), y: f(y0), w: f(w), h: f(h) };
}

/** Cores de cada tom: [borda clara, luz, meio, sombra]. `acento` é a cor do app para o músculo em foco. */
export const TONS: Record<Exclude<Tom, 'foco' | 'focoLonge'>, [string, string, string, string]> = {
  pele: ['#aab3bf', '#f4f6f9', '#b4bcc8', '#4d5560'],
  peleLonge: ['#565e69', '#8b94a1', '#646d79', '#2a2f36'],
  roupa: ['#3a4150', '#5c6577', '#3b4352', '#1b1f27'],
  roupaLonge: ['#22262f', '#3a4150', '#272c36', '#14171c'],
};

const hex = (n: number) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
/** Mistura a cor com branco (k > 0) ou preto (k < 0). */
export function clarear(cor: string, k: number): string {
  const c = [1, 3, 5].map((i) => parseInt(cor.slice(i, i + 2), 16));
  return `#${c.map((v) => hex(k >= 0 ? v + (255 - v) * k : v * (1 + k))).join('')}`;
}

/** Os quatro tons de cada material, com o músculo em foco na cor do app. */
export function paleta(acento: string): Record<Tom, [string, string, string, string]> {
  return {
    ...TONS,
    foco: [clarear(acento, 0.15), clarear(acento, 0.62), acento, clarear(acento, -0.62)],
    focoLonge: [clarear(acento, -0.45), clarear(acento, -0.15), clarear(acento, -0.4), clarear(acento, -0.75)],
  };
}
