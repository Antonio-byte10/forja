/* GERADO por scripts/gerar-boneco-web.mjs — não edite aqui; edite src/lib/boneco.ts e src/data/animacoes.ts. */
(function () {
/**
 * Boneco animado: transforma poses (ângulos das articulações) em formas prontas para desenhar em SVG.
 * Não depende de React nem do navegador: o app desenha com react-native-svg e a galeria com SVG puro.
 *
 * Coordenadas do "mundo" em cm, y para cima, chão em y = 0. Ângulos em graus: 0 = direita, 90 = cima.
 * Vista lateral: de bruços a cabeça fica à direita; de costas, à esquerda.
 */
const L = { lombar: 26, peito: 26, ombro: 20, pescoco: 12, braco: 30, antebraco: 27, mao: 9, coxa: 44, canela: 44, pe: 20 };
const rad = (g) => (g * Math.PI) / 180;
const dir = (g) => [Math.cos(rad(g)), Math.sin(rad(g))];
const soma = (p, v, k = 1) => [p[0] + v[0] * k, p[1] + v[1] * k];
const angulo = (p, q) => (Math.atan2(q[1] - p[1], q[0] - p[0]) * 180) / Math.PI;
/** Duas articulações alcançando um alvo; `curva` escolhe o lado do cotovelo/joelho. */
function alcancar(base, alvo, a, b, curva) {
    const dx = alvo[0] - base[0], dy = alvo[1] - base[1];
    const d = Math.max(0.01, Math.min(Math.hypot(dx, dy), a + b - 0.01));
    const t = Math.atan2(dy, dx);
    const alfa = Math.acos(Math.max(-1, Math.min(1, (a * a + d * d - b * b) / (2 * a * d))));
    const a1 = t + curva * alfa;
    const meio = [base[0] + a * Math.cos(a1), base[1] + a * Math.sin(a1)];
    const fim = [base[0] + d * Math.cos(t), base[1] + d * Math.sin(t)];
    return [(a1 * 180) / Math.PI, angulo(meio, fim)];
}
const MEMBROS = [
    ['bracoN', 'ombroN', L.braco, L.antebraco], ['bracoF', 'ombroF', L.braco, L.antebraco],
    ['pernaN', 'quadrilN', L.coxa, L.canela], ['pernaF', 'quadrilF', L.coxa, L.canela],
];
/** Pose → posição de cada articulação. */
function resolver(pose) {
    const frente = pose.vista === 'frente';
    const T = pose.torso ?? 90;
    const cima = T + (pose.coluna ?? 0);
    const lado = dir(T - 90);
    const pelve = [0, 0];
    const meio = soma(pelve, dir(T), L.lombar);
    const pescoco = soma(meio, dir(cima), L.peito);
    const anguloCabeca = cima + (pose.cabeca ?? 0);
    const baseOmbro = soma(meio, dir(cima), L.ombro);
    const ladoCima = dir(cima - 90);
    const E = {
        pelve, meio, pescoco, cabeca: soma(pescoco, dir(anguloCabeca), L.pescoco), anguloCabeca, anguloPeito: cima, frente,
        ombroN: soma(baseOmbro, ladoCima, frente ? 18 : 0), ombroF: soma(baseOmbro, ladoCima, frente ? -18 : 0),
        quadrilN: soma(pelve, lado, frente ? 9 : 0), quadrilF: soma(pelve, lado, frente ? -9 : 0),
    };
    const montar = (nome, base, a, b, [a1, a2]) => {
        const j1 = soma(base, dir(a1), a);
        const j2 = soma(j1, dir(a2), b);
        const perna = nome.startsWith('perna');
        const extra = pose[(perna ? 'pe' : 'mao') + nome.slice(-1)] ?? (perna ? a2 + 90 : a2);
        E[nome] = { base, j1, j2, a1, a2, ponta: soma(j2, dir(extra), perna ? L.pe : L.mao), calcanhar: soma(j2, dir(extra), -5) };
    };
    for (const [nome, base, a, b] of MEMBROS) {
        const m = pose[nome];
        if (Array.isArray(m))
            montar(nome, E[base], a, b, m);
    }
    // Âncora: encaixa um ponto conhecido (pé, mão, quadril) no lugar certo do chão ou do aparelho.
    const [qual, ax, ay] = pose.ancora ?? ['pelve', 0, 93];
    const ref = pontoDe(E, qual);
    const dx = ax - ref[0], dy = ay - ref[1];
    const mover = (p) => { if (p) {
        p[0] += dx;
        p[1] += dy;
    } };
    for (const k of ['pelve', 'meio', 'pescoco', 'cabeca', 'ombroN', 'ombroF', 'quadrilN', 'quadrilF'])
        mover(E[k]);
    for (const [nome] of MEMBROS) {
        const o = E[nome];
        if (o)
            for (const k of ['j1', 'j2', 'ponta', 'calcanhar'])
                mover(o[k]);
    }
    for (const [nome, base, a, b] of MEMBROS) {
        const m = pose[nome];
        if (Array.isArray(m))
            continue;
        const x = typeof m.alvo[0] === 'number' ? m.alvo[0] : E[base][0] + Number(m.alvo[0].slice(1));
        montar(nome, E[base], a, b, alcancar(E[base], [x, m.alvo[1]], a, b, m.curva ?? 1));
    }
    return E;
}
const ATALHOS = {
    maoN: ['bracoN', 'ponta'], maoF: ['bracoF', 'ponta'], punhoN: ['bracoN', 'j2'], punhoF: ['bracoF', 'j2'],
    cotoveloN: ['bracoN', 'j1'], cotoveloF: ['bracoF', 'j1'], peN: ['pernaN', 'ponta'], peF: ['pernaF', 'ponta'],
    tornozeloN: ['pernaN', 'j2'], tornozeloF: ['pernaF', 'j2'], joelhoN: ['pernaN', 'j1'], joelhoF: ['pernaF', 'j1'],
};
function pontoDe(E, qual) {
    const a = ATALHOS[qual];
    const p = a ? E[a[0]]?.[a[1]] : E[qual];
    if (!p)
        throw new Error(`Âncora inválida: ${qual} (o membro precisa ser dado por ângulos)`);
    return p;
}
// ---------- Interpolação ----------
const mix = (a, b, t) => a + (b - a) * t;
const mixAngulo = (a, b, t) => a + ((((b - a) % 360) + 540) % 360 - 180) * t;
const suave = (t) => t * t * (3 - 2 * t);
const numeroS = (v) => Number(String(v).slice(1));
function mixMembro(a, b, t) {
    if (Array.isArray(a) && Array.isArray(b))
        return [mixAngulo(a[0], b[0], t), mixAngulo(a[1], b[1], t)];
    if (!Array.isArray(a) && !Array.isArray(b)) {
        const x = typeof a.alvo[0] === 'number' && typeof b.alvo[0] === 'number' ? mix(a.alvo[0], b.alvo[0], t) : `S${mix(numeroS(a.alvo[0]), numeroS(b.alvo[0]), t)}`;
        return { alvo: [x, mix(a.alvo[1], b.alvo[1], t)], curva: a.curva };
    }
    return t < 0.5 ? a : b;
}
function misturar(a, b, t) {
    const n = (k, padrao) => mixAngulo(a[k] ?? padrao, b[k] ?? padrao, t);
    const opc = (k) => (a[k] !== undefined && b[k] !== undefined ? mixAngulo(a[k], b[k], t) : t < 0.5 ? a[k] : b[k]);
    const aa = a.ancora ?? ['pelve', 0, 93], ab = b.ancora ?? ['pelve', 0, 93];
    return {
        vista: a.vista, torso: n('torso', 90), coluna: n('coluna', 0), cabeca: n('cabeca', 0),
        bracoN: mixMembro(a.bracoN, b.bracoN, t), bracoF: mixMembro(a.bracoF, b.bracoF, t),
        pernaN: mixMembro(a.pernaN, b.pernaN, t), pernaF: mixMembro(a.pernaF, b.pernaF, t),
        maoN: opc('maoN'), maoF: opc('maoF'), peN: opc('peN'), peF: opc('peF'),
        ancora: [t < 0.5 ? aa[0] : ab[0], mix(aa[1], ab[1], t), mix(aa[2], ab[2], t)],
    };
}
const tempos = (q) => ({ ida: q.ida ?? 0.9, pausa: q.pausa ?? 0.25 });
const duracao = (anim) => anim.poses.reduce((s, q) => s + tempos(q).ida + tempos(q).pausa, 0);
/** Pose no instante `t` (segundos); a animação dá a volta sozinha. */
function poseEm(anim, t) {
    const qs = anim.poses;
    let resto = ((t % duracao(anim)) + duracao(anim)) % duracao(anim);
    let i = 0;
    for (; i < qs.length - 1; i++) {
        const d = tempos(qs[i]).ida + tempos(qs[i]).pausa;
        if (resto < d)
            break;
        resto -= d;
    }
    const anterior = qs[(i - 1 + qs.length) % qs.length].pose;
    const { ida } = tempos(qs[i]);
    return misturar(anterior, qs[i].pose, resto < ida ? suave(resto / ida) : 1);
}
// ---------- Formas ----------
const tela = (p) => [p[0], -p[1]];
const f = (n) => Math.round(n * 100) / 100;
/** Cápsula que afina de `r1` para `r2`: é o que dá cara de braço e perna em vez de palito. */
function capsula(pa, pb, r1, r2, tom) {
    const a = tela(pa), b = tela(pb);
    const dx = b[0] - a[0], dy = b[1] - a[1];
    const len = Math.hypot(dx, dy) || 0.001;
    let nx = -dy / len, ny = dx / len;
    const d = `M${f(a[0] + nx * r1)} ${f(a[1] + ny * r1)}L${f(b[0] + nx * r2)} ${f(b[1] + ny * r2)}A${r2} ${r2} 0 0 0 ${f(b[0] - nx * r2)} ${f(b[1] - ny * r2)}`
        + `L${f(a[0] - nx * r1)} ${f(a[1] - ny * r1)}A${r1} ${r1} 0 0 0 ${f(a[0] + nx * r1)} ${f(a[1] + ny * r1)}Z`;
    // Luz de cima e um pouco da esquerda: o gradiente atravessa o membro e dá o volume.
    if (nx * -0.45 + ny * -1 < 0) {
        nx = -nx;
        ny = -ny;
    }
    const h = Math.max(r1, r2), cx = (a[0] + b[0]) / 2, cy = (a[1] + b[1]) / 2;
    return { d, g: [f(cx + nx * h), f(cy + ny * h), f(cx - nx * h), f(cy - ny * h)], tom };
}
function bola(p, r, tom) {
    const [x, y] = tela(p);
    return { d: `M${f(x - r)} ${f(y)}A${r} ${r} 0 1 0 ${f(x + r)} ${f(y)}A${r} ${r} 0 1 0 ${f(x - r)} ${f(y)}Z`, g: [f(x - r * 0.45), f(y - r), f(x + r * 0.45), f(y + r)], tom };
}
function pontosDoCorpo(E) {
    const out = [E.pelve, E.meio, E.pescoco, [E.cabeca[0] - 11, E.cabeca[1] - 11], [E.cabeca[0] + 11, E.cabeca[1] + 11]];
    for (const [nome] of MEMBROS)
        out.push(E[nome].j1, E[nome].j2, E[nome].ponta, E[nome].calcanhar);
    return out;
}
/** Esqueleto → formas na ordem de desenho (lado de longe, tronco, cabeça, lado de perto). */
function desenhar(anim, pose) {
    const E = resolver(pose);
    const foco = new Set(anim.foco);
    const tom = (parte, longe) => (parte && foco.has(parte) ? (longe ? 'focoLonge' : 'foco') : longe ? 'peleLonge' : 'pele');
    const formas = [];
    const braco = (o, longe) => {
        formas.push(bola(o.base, 6.6, tom('braco', longe)), capsula(o.base, o.j1, 6, 4.9, tom('braco', longe)), capsula(o.j1, o.j2, 4.8, 3.5, tom('antebraco', longe)), capsula(o.j2, o.ponta, 3.6, 2.9, tom(null, longe)));
    };
    const perna = (o, longe) => {
        const short = soma(o.base, dir(o.a1), L.coxa * 0.42);
        formas.push(capsula(o.base, o.j1, 9.4, 6.4, tom('coxa', longe)), capsula(o.base, short, 10, 8.6, longe ? 'roupaLonge' : 'roupa'), capsula(o.j1, soma(o.j1, dir(o.a2), L.canela * 0.45), 6.3, 6, tom('canela', longe)), capsula(o.j1, o.j2, 6, 4.2, tom('canela', longe)), capsula(o.calcanhar, o.ponta, 4.2, 3, longe ? 'roupaLonge' : 'roupa'));
    };
    const tronco = () => {
        const topo = soma(E.meio, dir(E.anguloPeito), L.peito - 7);
        if (E.frente) {
            formas.push(capsula(E.pelve, E.meio, 14, 13, tom('torso', false)), capsula(E.meio, topo, 13, 15, tom('torso', false)), capsula(E.ombroF, E.ombroN, 8, 8, tom('torso', false)), capsula(E.quadrilF, E.quadrilN, 10.5, 10.5, 'roupa'));
        }
        else {
            formas.push(capsula(E.pelve, E.meio, 12.2, 11, tom('torso', false)), capsula(E.meio, topo, 11, 13.2, tom('torso', false)), bola(E.pelve, 12.6, 'roupa'));
        }
        // Pescoço e cabeça: a cabeça é um oval com o queixo para o lado da frente.
        const adiante = dir(E.anguloCabeca - 90);
        formas.push(capsula(soma(E.pescoco, dir(E.anguloPeito), -3), soma(E.pescoco, dir(E.anguloCabeca), 5), 4.6, 4.2, tom(null, false)));
        if (!E.frente)
            formas.push(bola(soma(soma(E.cabeca, adiante, 3.2), dir(E.anguloCabeca), -4.2), 7.4, tom(null, false)));
        formas.push(bola(E.cabeca, 10.2, tom(null, false)));
    };
    if (E.frente) {
        perna(E.pernaF, false);
        perna(E.pernaN, false);
        tronco();
        braco(E.bracoF, false);
        braco(E.bracoN, false);
    }
    else {
        braco(E.bracoF, true);
        perna(E.pernaF, true);
        tronco();
        perna(E.pernaN, false);
        braco(E.bracoN, false);
    }
    const ps = pontosDoCorpo(E);
    const xs = ps.map((p) => p[0]);
    const min = Math.min(...xs), max = Math.max(...xs);
    const altura = Math.max(0, Math.min(...ps.map((p) => p[1])));
    return { formas, sombra: { cx: f((min + max) / 2), rx: f((max - min) / 2 + 6), opacidade: f(Math.max(0.12, 0.5 - altura / 150)) } };
}
/** Caixa 3:2 (como as fotos) onde cabem todas as poses e os aparelhos. */
function caixa(anim) {
    const pts = [];
    anim.poses.forEach((q, i) => {
        const prox = anim.poses[(i + 1) % anim.poses.length].pose;
        for (const t of [0, 0.25, 0.5, 0.75])
            pts.push(...pontosDoCorpo(resolver(misturar(q.pose, prox, t))).map(tela));
    });
    for (const o of anim.objetos ?? []) {
        if (o.tipo === 'banco')
            pts.push([o.x, -o.y - o.h], [o.x + o.w, 0]);
        if (o.tipo === 'barra')
            pts.push([o.x, -o.y - 6]);
        if (o.tipo === 'parede')
            pts.push([o.x + 14, 0]);
    }
    let x0 = Math.min(...pts.map((p) => p[0])) - 18, x1 = Math.max(...pts.map((p) => p[0])) + 18;
    let y0 = Math.min(...pts.map((p) => p[1])) - 18;
    const y1 = Math.max(0, ...pts.map((p) => p[1])) + 12;
    let w = x1 - x0, h = y1 - y0;
    if (w / h < 1.5) {
        x0 -= (h * 1.5 - w) / 2;
        w = h * 1.5;
    }
    else {
        y0 -= w / 1.5 - h;
        h = w / 1.5;
    }
    x1 = x0 + w;
    return { x: f(x0), y: f(y0), w: f(w), h: f(h) };
}
/** Cores de cada tom: [borda clara, luz, meio, sombra]. `acento` é a cor do app para o músculo em foco. */
const TONS = {
    pele: ['#aab3bf', '#f4f6f9', '#b4bcc8', '#4d5560'],
    peleLonge: ['#565e69', '#8b94a1', '#646d79', '#2a2f36'],
    roupa: ['#3a4150', '#5c6577', '#3b4352', '#1b1f27'],
    roupaLonge: ['#22262f', '#3a4150', '#272c36', '#14171c'],
};
const hex = (n) => Math.round(Math.max(0, Math.min(255, n))).toString(16).padStart(2, '0');
/** Mistura a cor com branco (k > 0) ou preto (k < 0). */
function clarear(cor, k) {
    const c = [1, 3, 5].map((i) => parseInt(cor.slice(i, i + 2), 16));
    return `#${c.map((v) => hex(k >= 0 ? v + (255 - v) * k : v * (1 + k))).join('')}`;
}
/** Os quatro tons de cada material, com o músculo em foco na cor do app. */
function paleta(acento) {
    return {
        ...TONS,
        foco: [clarear(acento, 0.15), clarear(acento, 0.62), acento, clarear(acento, -0.62)],
        focoLonge: [clarear(acento, -0.45), clarear(acento, -0.15), clarear(acento, -0.4), clarear(acento, -0.75)],
    };
}

/*
 * Poses de cada exercício (o desenho está em lib/boneco.ts).
 * Ângulos em graus: 0 = direita, 90 = cima, -90 = baixo.
 * De bruços: cabeça à direita. De costas: cabeça à esquerda.
 * ida = segundos para chegar na pose; pausa = segundos parado nela.
 */
const reto = (t, d = 0) => [t + 180 + d, t + 180 + d]; // perna alinhada com o tronco
const pernasRetas = (t) => ({ pernaN: reto(t), pernaF: reto(t, 1) });
const maos = (x, y = 3) => ({ bracoN: { alvo: [x, y], curva: -1 }, bracoF: { alvo: [x - 2, y], curva: -1 }, maoN: 0, maoF: 0 });
/** Flexão com os pés no chão: só muda a inclinação do corpo; as mãos ficam fixas. */
const flexao = (alto, baixo, maoX, [desce, embaixo, sobe, emcima] = [1, 0.15, 1, 0.2]) => [
    { pose: { torso: alto, cabeca: -4, ...pernasRetas(alto), ...maos(maoX), ancora: ['peN', 0, 1] }, ida: sobe, pausa: emcima },
    { pose: { torso: baixo, cabeca: -4, ...pernasRetas(baixo), ...maos(maoX), ancora: ['peN', 0, 1] }, ida: desce, pausa: embaixo },
];
const deitado = { torso: 180, cabeca: 0, ancora: ['pelve', 0, 12], bracoN: [-1, 0], bracoF: [-1, 0] };
const pernasDobradas = (x = 42) => ({ pernaN: { alvo: [x, 6], curva: 1 }, pernaF: { alvo: [x + 2, 6], curva: 1 }, peN: 0, peF: 0 });
const prancha = (t = 15.5) => ({ torso: t, cabeca: -4, ...pernasRetas(t), bracoN: [-91, -89], bracoF: [-92, -88], maoN: 0, maoF: 0, ancora: ['punhoN', 124, 3] });
const quatroApoios = { torso: 10, cabeca: 0, pernaN: [-90, 180], pernaF: [-91, 181], peN: 180, peF: 180, bracoN: [-92, -88], bracoF: [-93, -87], maoN: 0, maoF: 0, ancora: ['pelve', 0, 50] };
const emPe = { torso: 90, pernaN: [-90, -90], pernaF: [-89, -90], peN: 0, peF: 0, bracoN: [-96, -86], bracoF: [-92, -84], ancora: ['pelve', 0, 93] };
const animacoes = {
    // ---------- Flexões ----------
    flexao_parede: {
        nome: 'Flexão na parede', foco: ['braco', 'antebraco', 'torso'], objetos: [{ tipo: 'parede', x: 104 }],
        poses: [
            { pose: { torso: 70, cabeca: -6, pernaN: reto(70), pernaF: reto(70, 1), peN: 0, peF: 0, bracoN: { alvo: [99, 128], curva: -1 }, bracoF: { alvo: [98, 126], curva: -1 }, maoN: 90, maoF: 90, ancora: ['tornozeloN', 0, 6] }, ida: 1, pausa: 0.2 },
            { pose: { torso: 60, cabeca: -6, pernaN: reto(60), pernaF: reto(60, 1), peN: 0, peF: 0, bracoN: { alvo: [99, 128], curva: -1 }, bracoF: { alvo: [98, 126], curva: -1 }, maoN: 90, maoF: 90, ancora: ['tornozeloN', 0, 6] }, ida: 1, pausa: 0.15 },
        ],
    },
    flexao_inclinada_banco: {
        nome: 'Flexão inclinada (mãos no banco)', foco: ['braco', 'antebraco', 'torso'], objetos: [{ tipo: 'banco', x: 82, y: 0, w: 48, h: 45 }],
        poses: [
            { pose: { torso: 37, cabeca: -4, ...pernasRetas(37), ...maos(104, 48), ancora: ['peN', 0, 1] }, ida: 1, pausa: 0.2 },
            { pose: { torso: 22, cabeca: -4, ...pernasRetas(22), ...maos(104, 48), ancora: ['peN', 0, 1] }, ida: 1, pausa: 0.15 },
        ],
    },
    flexao_joelhos: {
        nome: 'Flexão com joelhos apoiados', foco: ['braco', 'antebraco', 'torso'],
        poses: [
            { pose: { torso: 33, cabeca: -4, pernaN: [213, 140], pernaF: [214, 141], ...maos(77), ancora: ['joelhoN', 0, 7] }, ida: 1, pausa: 0.2 },
            { pose: { torso: 12, cabeca: -4, pernaN: [192, 140], pernaF: [193, 141], ...maos(77), ancora: ['joelhoN', 0, 7] }, ida: 1, pausa: 0.15 },
        ],
    },
    flexao: { nome: 'Flexão tradicional', foco: ['braco', 'antebraco', 'torso'], pegada: 'normal', poses: flexao(15.5, 1.5, 124) },
    flexao_aberta: { nome: 'Flexão aberta', foco: ['torso'], pegada: 'aberta', poses: flexao(15, 2.5, 123) },
    flexao_diamante: { nome: 'Flexão diamante (fechada)', foco: ['braco', 'antebraco'], pegada: 'diamante', poses: flexao(16, 2.5, 126) },
    flexao_declinada: {
        nome: 'Flexão declinada (pés no banco)', foco: ['braco', 'torso'], objetos: [{ tipo: 'banco', x: -16, y: 0, w: 40, h: 40 }],
        poses: [
            { pose: { torso: -2, cabeca: -6, ...pernasRetas(-2), ...maos(141), ancora: ['peN', 8, 41] }, ida: 1, pausa: 0.2 },
            { pose: { torso: -11, cabeca: -6, ...pernasRetas(-11), ...maos(141), ancora: ['peN', 8, 41] }, ida: 1, pausa: 0.15 },
        ],
    },
    flexao_pike: {
        nome: 'Flexão pike (quadril alto)', foco: ['braco', 'antebraco'],
        poses: [
            { pose: { torso: -58, cabeca: 0, pernaN: [236, 236], pernaF: [237, 237], ...maos(96), ancora: ['peN', 0, 1] }, ida: 1, pausa: 0.2 },
            { pose: { torso: -76, cabeca: 0, pernaN: [242, 242], pernaF: [243, 243], ...maos(96), ancora: ['peN', 0, 1] }, ida: 1.1, pausa: 0.15 },
        ],
    },
    flexao_escapular: {
        nome: 'Flexão escapular', foco: ['torso'],
        poses: [
            { pose: { ...prancha(15.5), bracoN: [-90, -90], bracoF: [-91, -89] }, ida: 0.7, pausa: 0.3 },
            { pose: { ...prancha(13.2), bracoN: [-90, -90], bracoF: [-91, -89], coluna: 2 }, ida: 0.7, pausa: 0.3 },
        ],
    },
    flexao_negativa: { nome: 'Flexão negativa (desce em 3 s)', foco: ['braco', 'antebraco', 'torso'], pegada: 'normal', poses: flexao(15.5, 1.5, 124, [3, 0.3, 0.7, 0.3]) },
    // ---------- Abdômen ----------
    abdominal: {
        nome: 'Abdominal (crunch)', foco: ['torso'],
        poses: [
            { pose: { ...deitado, ...pernasDobradas() }, ida: 1, pausa: 0.2 },
            { pose: { ...deitado, ...pernasDobradas(), torso: 174, coluna: -30, cabeca: 6, bracoN: [-16, -10], bracoF: [-14, -8] }, ida: 1, pausa: 0.4 },
        ],
    },
    abdominal_infra: {
        nome: 'Abdominal infra', foco: ['torso', 'coxa'],
        poses: [
            { pose: { ...deitado, pernaN: [92, 2], pernaF: [93, 3], peN: 0, peF: 0 }, ida: 1, pausa: 0.2 },
            { pose: { ...deitado, torso: 186, coluna: -6, ancora: ['pelve', 0, 17], pernaN: [138, 60], pernaF: [139, 61], peN: 60, peF: 60 }, ida: 1, pausa: 0.4 },
        ],
    },
    dead_bug: {
        nome: 'Dead bug', foco: ['torso'],
        poses: [
            { pose: { ...deitado, bracoN: [88, 90], bracoF: [92, 90], pernaN: [90, 0], pernaF: [91, 1], peN: 0, peF: 0 }, ida: 0.9, pausa: 0.2 },
            { pose: { ...deitado, bracoN: [88, 90], bracoF: [172, 174], pernaN: [12, 10], pernaF: [91, 1], peN: 10, peF: 0 }, ida: 1.2, pausa: 0.3 },
            { pose: { ...deitado, bracoN: [88, 90], bracoF: [92, 90], pernaN: [90, 0], pernaF: [91, 1], peN: 0, peF: 0 }, ida: 1.2, pausa: 0.2 },
            { pose: { ...deitado, bracoN: [172, 174], bracoF: [92, 90], pernaN: [90, 0], pernaF: [12, 10], peN: 0, peF: 10 }, ida: 1.2, pausa: 0.3 },
        ],
    },
    canoa: {
        nome: 'Canoa (hollow hold)', foco: ['torso', 'coxa'],
        poses: [
            { pose: { ...deitado, torso: 172, coluna: -14, cabeca: 4, bracoN: [165, 165], bracoF: [166, 166], pernaN: [18, 18], pernaF: [19, 19], peN: 30, peF: 30 }, ida: 1.2, pausa: 0.6 },
            { pose: { ...deitado, torso: 170, coluna: -18, cabeca: 4, bracoN: [161, 161], bracoF: [162, 162], pernaN: [22, 22], pernaF: [23, 23], peN: 34, peF: 34 }, ida: 1.2, pausa: 0.6 },
        ],
    },
    v_up: {
        nome: 'V-up (canivete)', foco: ['torso', 'coxa'],
        poses: [
            { pose: { ...deitado, torso: 178, bracoN: [177, 177], bracoF: [178, 178], pernaN: [5, 5], pernaF: [6, 6], peN: 20, peF: 20 }, ida: 1.1, pausa: 0.2 },
            { pose: { ...deitado, torso: 140, coluna: -16, cabeca: 8, bracoN: [60, 60], bracoF: [61, 61], pernaN: [56, 56], pernaF: [57, 57], peN: 70, peF: 70 }, ida: 1, pausa: 0.3 },
        ],
    },
    elevacao_pernas: {
        nome: 'Elevação de pernas deitado', foco: ['torso', 'coxa'],
        poses: [
            { pose: { ...deitado, pernaN: [4, 4], pernaF: [5, 5], peN: 15, peF: 15 }, ida: 1.2, pausa: 0.2 },
            { pose: { ...deitado, pernaN: [86, 86], pernaF: [87, 87], peN: 120, peF: 120 }, ida: 1.2, pausa: 0.3 },
        ],
    },
    tesoura: {
        nome: 'Tesoura (batida de pernas)', foco: ['torso', 'coxa'],
        poses: [
            { pose: { ...deitado, coluna: -8, cabeca: 8, pernaN: [26, 26], pernaF: [12, 12], peN: 40, peF: 30 }, ida: 0.45, pausa: 0 },
            { pose: { ...deitado, coluna: -8, cabeca: 8, pernaN: [12, 12], pernaF: [26, 26], peN: 30, peF: 40 }, ida: 0.45, pausa: 0 },
        ],
    },
    prancha: {
        nome: 'Prancha', foco: ['torso'],
        poses: [
            { pose: { torso: 6, cabeca: -4, ...pernasRetas(6), bracoN: [-90, 0], bracoF: [-91, 1], maoN: 0, maoF: 0, ancora: ['cotoveloN', 120, 5] }, ida: 1.5, pausa: 0.5 },
            { pose: { torso: 6.8, cabeca: -4, ...pernasRetas(6.8), bracoN: [-90, 0], bracoF: [-91, 1], maoN: 0, maoF: 0, ancora: ['cotoveloN', 120, 5] }, ida: 1.5, pausa: 0.5 },
        ],
    },
    prancha_toque_ombro: {
        nome: 'Prancha com toque no ombro', foco: ['torso', 'braco'],
        poses: [
            { pose: { ...prancha(), ancora: ['punhoF', 122, 3] }, ida: 0.7, pausa: 0.15 },
            { pose: { ...prancha(), ancora: ['punhoF', 122, 3], bracoN: [-72, 100], maoN: 100 }, ida: 0.7, pausa: 0.25 },
            { pose: { ...prancha(), ancora: ['punhoN', 124, 3] }, ida: 0.7, pausa: 0.15 },
            { pose: { ...prancha(), ancora: ['punhoN', 124, 3], bracoF: [-72, 100], maoF: 100 }, ida: 0.7, pausa: 0.25 },
        ],
    },
    perdigueiro: {
        nome: 'Perdigueiro (bird dog)', foco: ['torso'],
        poses: [
            { pose: quatroApoios, ida: 1, pausa: 0.2 },
            { pose: { ...quatroApoios, bracoN: [6, 6], pernaF: [184, 184], peF: 274 }, ida: 1.1, pausa: 0.6 },
            { pose: quatroApoios, ida: 1, pausa: 0.2 },
            { pose: { ...quatroApoios, bracoF: [6, 6], pernaN: [184, 184], peN: 274 }, ida: 1.1, pausa: 0.6 },
        ],
    },
    escalador_lento: {
        nome: 'Escalador lento (sem salto)', foco: ['torso', 'coxa'],
        poses: [
            { pose: prancha(), ida: 0.8, pausa: 0.1 },
            { pose: { ...prancha(), pernaN: [-36, 196] }, ida: 0.8, pausa: 0.25 },
            { pose: prancha(), ida: 0.8, pausa: 0.1 },
            { pose: { ...prancha(), pernaF: [-36, 196] }, ida: 0.8, pausa: 0.25 },
        ],
    },
    // ---------- Aquecimento e exercícios sem foto ----------
    marcha_joelho_alto: {
        nome: 'Marcha com joelho alto', foco: ['coxa'],
        poses: [
            { pose: { ...emPe, pernaN: [2, -90], peN: 0, bracoN: [-120, -60], bracoF: [-60, 20] }, ida: 0.6, pausa: 0.15 },
            { pose: emPe, ida: 0.5, pausa: 0 },
            { pose: { ...emPe, pernaF: [2, -90], peF: 0, bracoF: [-120, -60], bracoN: [-60, 20] }, ida: 0.6, pausa: 0.15 },
            { pose: emPe, ida: 0.5, pausa: 0 },
        ],
    },
    agachamento_parede: {
        nome: 'Agachamento isométrico na parede', foco: ['coxa'], objetos: [{ tipo: 'parede', x: -28 }],
        poses: [
            { pose: { torso: 90, pernaN: [0, -90], pernaF: [1, -90], peN: 0, peF: 0, bracoN: [-60, -5], bracoF: [-62, -6], ancora: ['pelve', 0, 50] }, ida: 1.5, pausa: 0.5 },
            { pose: { torso: 90, pernaN: [1, -90], pernaF: [2, -90], peN: 0, peF: 0, bracoN: [-60, -5], bracoF: [-62, -6], ancora: ['pelve', 0, 49] }, ida: 1.5, pausa: 0.5 },
        ],
    },
    suspensao_barra: {
        nome: 'Suspensão na barra (dead hang)', foco: ['braco', 'antebraco'], objetos: [{ tipo: 'barra', x: 6, y: 210 }],
        poses: [
            { pose: { torso: 90, pernaN: [-92, -95], pernaF: [-90, -93], bracoN: [88, 90], bracoF: [89, 90], maoN: 90, maoF: 90, ancora: ['punhoN', 4, 206] }, ida: 1.4, pausa: 0.6 },
            { pose: { torso: 90, cabeca: -3, pernaN: [-92, -95], pernaF: [-90, -93], bracoN: [87, 91], bracoF: [88, 91], maoN: 90, maoF: 90, ancora: ['punhoN', 4, 206] }, ida: 1.4, pausa: 0.6 },
        ],
    },
    polichinelo: {
        nome: 'Polichinelo', foco: ['coxa'],
        poses: [
            { pose: { vista: 'frente', torso: 90, pernaN: [-86, -90], pernaF: [-94, -90], peN: 0, peF: 180, bracoN: [-80, -86], bracoF: [-100, -94], ancora: ['pelve', 0, 93] }, ida: 0.45, pausa: 0.1 },
            { pose: { vista: 'frente', torso: 90, pernaN: [-68, -70], pernaF: [-112, -110], peN: 0, peF: 180, bracoN: [60, 82], bracoF: [120, 98], ancora: ['pelve', 0, 89] }, ida: 0.45, pausa: 0.1 },
        ],
    },
};


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

})();
