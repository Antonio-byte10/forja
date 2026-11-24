import { planoEm, refeicoesEm, type Nutricao } from './nutricao';
import type { Peso } from './types';
import { dataLocal } from './datas';

export const br = (d: string) => d.split('-').reverse().join('/');
export function lerDataBR(v: string) {
  return /^\d{2}\/\d{2}\/\d{4}$/.test(v) ? v.split('/').reverse().join('-') : '';
}
export function resumoConsulta(inicio: string, fim: string, nutricao: Nutricao, pesos: Peso[], notas: boolean) {
  const noPeriodo = (dia: string) => inicio <= dia && dia <= fim;
  const porData = new Map(pesos.map((p) => [dataLocal(p.t), p.kg]));
  const dias = [...new Set([...Object.keys(nutricao.diario), ...porData.keys()])].filter(noPeriodo).sort();
  const pesagens = dias.flatMap((dia) => porData.has(dia) ? [porData.get(dia)!] : []);
  let total = 0;
  const registros = dias.flatMap((dia) => {
    const r = nutricao.diario[dia];
    const linhas: string[] = [];
    const kg = porData.get(dia);
    if (kg) linhas.push('Peso: ' + kg.toLocaleString('pt-BR') + ' kg');
    if (r?.altura) linhas.push('Altura: ' + r.altura.toLocaleString('pt-BR') + ' cm');
    if (r?.cintura) linhas.push('Cintura: ' + r.cintura.toLocaleString('pt-BR') + ' cm');
    for (const ref of refeicoesEm(planoEm(nutricao.planos, dia), dia)) {
      if (!r?.feitas?.includes(ref.id)) continue;
      total++;
      linhas.push(ref.nome + ' · ' + (r.escolhas?.[ref.id] || 'concluída'));
    }
    if (notas && r?.nota) linhas.push('Nota: ' + r.nota);
    return linhas.length ? [{ dia, linhas }] : [];
  });
  const delta = pesagens.length >= 2 ? Math.round(10 * (pesagens.at(-1)! - pesagens[0])) / 10 : undefined;
  return { registros, pesagens: pesagens.length, total, delta };
}

const esc = (v: string) => v.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c]!);
export function htmlConsulta(inicio: string, fim: string, resumo: ReturnType<typeof resumoConsulta>, fotos: { dia: string; data: string }[]) {
  const medidas = resumo.pesagens + ' pesagem(ns)' + (resumo.delta === undefined ? '' :
    ' · Variação entre a primeira e a última: ' + (resumo.delta > 0 ? '+' : '') + resumo.delta.toLocaleString('pt-BR') + ' kg');
  const dias = resumo.registros.map(({ dia, linhas }) => '<section><h3>' + esc(br(dia)) + '</h3><p>' + linhas.map(esc).join('<br>') + '</p></section>');
  const imagens = fotos.filter((f) => /^data:image\/(jpeg|png|webp);base64,[A-Za-z0-9+/=]+$/i.test(f.data))
    .map((f) => '<figure><img src="' + f.data + '"><figcaption>' + esc(br(f.dia)) + '</figcaption></figure>');
  return '<!doctype html><html lang="pt-BR"><meta charset="utf-8"><title>Resumo para o nutricionista</title>' +
    '<style>@page{size:A4;margin:18mm}body{font:15px/1.5 sans-serif;color:#18181b}h1{font-size:25px}h3,p{margin:5px 0}p{white-space:pre-wrap;overflow-wrap:anywhere}section,figure{break-inside:avoid;border-top:1px solid #ddd;padding:8px 0}figure{display:inline-block;margin:8px}img{width:150px;max-height:200px;object-fit:contain}</style>' +
    '<h1>Resumo para o nutricionista</h1><p>' + esc(br(inicio)) + ' a ' + esc(br(fim)) + '</p><p>' + medidas +
    ' · Refeições registradas: ' + resumo.total + '</p>' + dias.join('') + imagens.join('') + '</html>';
}
