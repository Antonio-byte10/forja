import { afterEach, expect, it, vi } from 'vitest';
import { criarServico } from './servidor-ia.mjs';

let servidor;
afterEach(async () => {
  if (servidor) await new Promise((resolve) => servidor.close(resolve));
});

async function abrir(chave, resposta, token) {
  const consultar = vi.fn().mockResolvedValue(resposta);
  servidor = criarServico({ chave, consultar, token, registrar: () => {} });
  await new Promise((resolve) => servidor.listen(0, '127.0.0.1', resolve));
  const url = 'http://127.0.0.1:' + servidor.address().port + '/plano';
  const enviar = (headers = {}, body = '%PDF-1.7 fictício') => fetch(url, {
    method: 'POST', headers: { 'Content-Type': 'application/pdf', 'X-Forja': 'pdf', ...headers }, body,
  });
  return { consultar, enviar, motivar: (dados) => fetch(url.replace('/plano', '/motivacao'), {
    method: 'POST', headers: { 'Content-Type': 'application/json', 'X-Forja': 'motivacao' }, body: JSON.stringify(dados),
  }) };
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

it('recusa dados extras e envia ao Gemini somente a contagem para a mensagem', async () => {
  const mensagem = 'Guarde um momento para você nesta semana.';
  const resposta = Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ mensagem }) }] } }] });
  const { motivar, consultar } = await abrir('teste', resposta);
  for (const dados of [{ diasAtivos: 8 }, { diasAtivos: 2, peso: 70 }, {}]) expect((await motivar(dados)).status).toBe(400);
  expect(consultar).not.toHaveBeenCalled();
  expect(await (await motivar({ diasAtivos: 2 })).json()).toEqual({ mensagem });
  expect(JSON.parse(consultar.mock.calls[0][1].body).contents[0].parts).toEqual([{ text: 'Dias com treino registrado nos últimos sete dias: 2' }]);
});

it('no servidor público exige o código de acesso antes de ler o pedido', async () => {
  const plano = { orientacoes: '', refeicoes: [{ nome: 'Almoço', horario: '', alimentos: 'Arroz', dias: [] }] };
  const resposta = Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify(plano) }] } }] });
  const { enviar, consultar } = await abrir('teste', resposta, 'codigo-secreto');
  expect((await enviar()).status).toBe(401);
  expect((await enviar({ Authorization: 'Bearer errado' })).status).toBe(401);
  expect(consultar).not.toHaveBeenCalled();
  expect((await enviar({ Authorization: 'Bearer codigo-secreto' })).status).toBe(200);
});
it('a verificação de saúde diz se o código vale sem expor a chave', async () => {
  await abrir('teste', undefined, 'codigo-secreto');
  const url = 'http://127.0.0.1:' + servidor.address().port + '/saude';
  expect(await (await fetch(url)).json()).toEqual({ ok: true, autorizado: false });
  expect(await (await fetch(url, { headers: { Authorization: 'Bearer codigo-secreto' } })).json()).toEqual({ ok: true, autorizado: true, gemini: true });
});

it('bloqueia quem erra o código muitas vezes, inclusive com o código certo depois', async () => {
  const { enviar, consultar } = await abrir('teste', undefined, 'codigo-secreto');
  for (let i = 0; i < 10; i++) expect((await enviar({ Authorization: 'Bearer chute' + i })).status).toBe(401);
  expect((await enviar({ Authorization: 'Bearer codigo-secreto' })).status).toBe(429);
  expect(consultar).not.toHaveBeenCalled();
});
it('a verificação de saúde sem código não conta como tentativa', async () => {
  await abrir('teste', undefined, 'codigo-secreto');
  const url = 'http://127.0.0.1:' + servidor.address().port + '/saude';
  for (let i = 0; i < 12; i++) expect((await fetch(url)).status).toBe(200);
});

it('tenta de novo quando o Gemini está sobrecarregado', async () => {
  const mensagem = 'Um passo de cada vez.';
  const ok = Response.json({ candidates: [{ finishReason: 'STOP', content: { parts: [{ text: JSON.stringify({ mensagem }) }] } }] });
  const { motivar, consultar } = await abrir('teste', undefined);
  consultar.mockReset().mockResolvedValueOnce(new Response('{}', { status: 503 })).mockResolvedValueOnce(ok);
  expect(await (await motivar({ diasAtivos: 1 })).json()).toEqual({ mensagem });
  expect(consultar).toHaveBeenCalledTimes(2);
});
