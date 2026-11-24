import { useStore } from '@/store';

/**
 * Servidor de IA do Forja (scripts/servidor-ia.mjs). Pode rodar no Render, com código de acesso,
 * ou no computador com `npm run ia`. O endereço vem de "Servidor de IA" no app; sem nada salvo,
 * usa EXPO_PUBLIC_IA_URL / EXPO_PUBLIC_IA_TOKEN do .env.local de quem gerou o APK.
 */
export const LOCAL = 'http://127.0.0.1:8787';

export type ConfigIa = { endereco: string; codigo: string };

export function configIa(): ConfigIa {
  const { servidorIa, codigoIa } = useStore.getState().ajustes;
  return {
    endereco: (servidorIa?.trim() || process.env.EXPO_PUBLIC_IA_URL?.trim() || LOCAL).replace(/\/+$/, ''),
    codigo: (codigoIa ?? process.env.EXPO_PUBLIC_IA_TOKEN ?? '').trim(),
  };
}

/** Só HTTPS sai do aparelho; HTTP apenas para o próprio computador. */
export const enderecoValido = (endereco: string) =>
  /^https:\/\/[^\s/]+(\/\S*)?$/.test(endereco) || /^http:\/\/(127\.0\.0\.1|localhost)(:\d+)?\/?$/.test(endereco);

const ehLocal = (endereco: string) => /^http:\/\/(127\.0\.0\.1|localhost)/.test(endereco);

export const avisoServico = (endereco: string) => ehLocal(endereco)
  ? 'Servidor de IA indisponível. Configure o endereço do Render em Servidor de IA ou inicie npm run ia no computador.'
  : 'Não foi possível falar com o servidor de IA. Confira a internet e o endereço. No plano gratuito do Render, o servidor leva até 1 minuto para acordar: tente de novo.';

/** Tempo de espera que cobre o servidor gratuito do Render acordando. */
export const PRAZO_IA = 90_000;

type Rota = { caminho: '/plano'; tipo: 'application/pdf'; marca: 'pdf' } | { caminho: '/motivacao'; tipo: 'application/json'; marca: 'motivacao' };

export const ROTAS = {
  plano: { caminho: '/plano', tipo: 'application/pdf', marca: 'pdf' },
  motivacao: { caminho: '/motivacao', tipo: 'application/json', marca: 'motivacao' },
} as const satisfies Record<string, Rota>;

const cabecalhos = (codigo: string): Record<string, string> => (codigo ? { Authorization: 'Bearer ' + codigo } : {});

/** Envia ao servidor e devolve o JSON; erro de rede vira o aviso do servidor, erro do servidor vira a mensagem dele. */
export async function chamarServico(rota: Rota, body: BodyInit, signal: AbortSignal): Promise<Record<string, unknown>> {
  const { endereco, codigo } = configIa();
  let res: Response;
  try {
    res = await fetch(endereco + rota.caminho, {
      method: 'POST', headers: { 'Content-Type': rota.tipo, 'X-Forja': rota.marca, ...cabecalhos(codigo) }, body, signal,
    });
  } catch (e) {
    if (signal.aborted) throw e;
    throw new Error(avisoServico(endereco));
  }
  const dados = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(typeof dados.erro === 'string' ? dados.erro : 'O servidor de IA não conseguiu responder.');
  return dados;
}

/** Botão "Testar conexão": diz em uma frase o que está faltando. */
export async function testarServico({ endereco, codigo }: ConfigIa, signal: AbortSignal): Promise<string> {
  try {
    const res = await fetch(endereco.replace(/\/+$/, '') + '/saude', { headers: cabecalhos(codigo), signal });
    const dados = await res.json().catch(() => ({}));
    if (!res.ok || dados.ok !== true) return 'O endereço respondeu, mas não é um servidor do Forja.';
    if (!dados.autorizado) return 'Servidor encontrado, mas o código de acesso não confere.';
    if (!dados.gemini) return 'Servidor encontrado, mas sem GEMINI_API_KEY configurada.';
    return 'Conexão funcionando.';
  } catch {
    if (signal.aborted) return 'O servidor demorou demais. No Render gratuito, tente de novo em 1 minuto.';
    return avisoServico(endereco);
  }
}
