import type { Animacao, Membro, Pose } from '@/lib/boneco';

/*
 * Poses de cada exercício (o desenho está em lib/boneco.ts).
 * Ângulos em graus: 0 = direita, 90 = cima, -90 = baixo.
 * De bruços: cabeça à direita. De costas: cabeça à esquerda.
 * ida = segundos para chegar na pose; pausa = segundos parado nela.
 */

const reto = (t: number, d = 0): Membro => [t + 180 + d, t + 180 + d]; // perna alinhada com o tronco
const pernasRetas = (t: number) => ({ pernaN: reto(t), pernaF: reto(t, 1) });
const maos = (x: number, y = 3) => ({ bracoN: { alvo: [x, y], curva: -1 } as Membro, bracoF: { alvo: [x - 2, y], curva: -1 } as Membro, maoN: 0, maoF: 0 });

/** Flexão com os pés no chão: só muda a inclinação do corpo; as mãos ficam fixas. */
const flexao = (alto: number, baixo: number, maoX: number, [desce, embaixo, sobe, emcima] = [1, 0.15, 1, 0.2]) => [
  { pose: { torso: alto, cabeca: -4, ...pernasRetas(alto), ...maos(maoX), ancora: ['peN', 0, 1] } as Pose, ida: sobe, pausa: emcima },
  { pose: { torso: baixo, cabeca: -4, ...pernasRetas(baixo), ...maos(maoX), ancora: ['peN', 0, 1] } as Pose, ida: desce, pausa: embaixo },
];

const deitado = { torso: 180, cabeca: 0, ancora: ['pelve', 0, 12] as Pose['ancora'], bracoN: [-1, 0] as Membro, bracoF: [-1, 0] as Membro };
const pernasDobradas = (x = 42) => ({ pernaN: { alvo: [x, 6], curva: 1 } as Membro, pernaF: { alvo: [x + 2, 6], curva: 1 } as Membro, peN: 0, peF: 0 });
const prancha = (t = 15.5): Pose => ({ torso: t, cabeca: -4, ...pernasRetas(t), bracoN: [-91, -89], bracoF: [-92, -88], maoN: 0, maoF: 0, ancora: ['punhoN', 124, 3] });
const quatroApoios: Pose = { torso: 10, cabeca: 0, pernaN: [-90, 180], pernaF: [-91, 181], peN: 180, peF: 180, bracoN: [-92, -88], bracoF: [-93, -87], maoN: 0, maoF: 0, ancora: ['pelve', 0, 50] };
const emPe: Pose = { torso: 90, pernaN: [-90, -90], pernaF: [-89, -90], peN: 0, peF: 0, bracoN: [-96, -86], bracoF: [-92, -84], ancora: ['pelve', 0, 93] };

export const animacoes = {
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
} satisfies Record<string, Animacao>;

export type AnimKey = keyof typeof animacoes;
