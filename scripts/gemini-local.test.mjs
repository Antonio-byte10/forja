import { afterEach, expect, it, vi } from 'vitest';
import { criarServico } from './gemini-local.mjs';

let servidor;
afterEach(async () => {
  if (servidor) await new Promise((resolve) => servidor.close(resolve));
});

async function abrir(chave, resposta) {
  const consultar = vi.fn().mockResolvedValue(resposta);
  servidor = criarServico({ chave, consultar });
  await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + servidor.address().port + '/plano';
  const enviar = (headers = {}, body = '%PDF-1.7 fictício') => fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/pdf', 'X-Forja': 'pdf', ...headers }, body,
  });
  return { consultar, enviar };
}

it('envia apenas o PDF ao provedor e devolve o plano para revisão', async () => {
  const plano = { orientacoes: '', refeicoes: [{ nome: 'Almoço', horario: '', alimentos: 'Arroz', dias: [] }] };
  const resposta = Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(plano) }] } }] });
  const { enviar, consultar } = await abrir('teste-local', resposta);
  expect(await (await enviar()).json()).toEqual(plano);
  const [url, opcoes] = consultar.mock.calls[0];
  expect(url).toMatch(/\/gemini-3\.5-flash-lite:generateContent$/);
  const payload = JSON.parse(opcoes.body);
  expect(Buffer.from(payload.contents[0].parts[0].inlineData.data, 'base64').toString()).toBe('%PDF-1.7 fictício');
  expect(opcoes.headers['x-goog-api-key']).toBe('teste-local');
});
it('não consulta o provedor com origem externa ou documento incompatível', async () => {
  const { enviar, consultar } = await abrir('teste-local');
  expect((await enviar({ Origin: 'https://exemplo.invalid' })).status).toBe(403);
  expect((await enviar({}, 'formato inválido')).status).toBe(400);
  expect(consultar).not.toHaveBeenCalled();
});
it('informa a falta da chave e mantém os detalhes do servidor privados', async () => {
  const { enviar, consultar } = await abrir('');
  expect((await enviar()).status).toBe(503);
  expect(consultar).not.toHaveBeenCalled();
});
it('recusa transcrições truncadas', async () => {
  const { enviar } = await abrir('teste-local', Response.json({ candidates: [{ finishReason: 'MAX_TOKENS' }] }));
  expect((await enviar()).status).toBe(422);
});
