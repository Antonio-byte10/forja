import { describe, expect, it } from 'vitest';
import { dataCurta, dataLocal, dataValida, deslocarDia, formatarHoras } from './datas';

describe('datas', () => {
  it('desloca dias atravessando mês e ano', () => {
    expect(deslocarDia('2026-12-31', 1)).toBe('2027-01-01');
    expect(deslocarDia('2026-03-01', -1)).toBe('2026-02-28');
    expect(deslocarDia('2026-11-24', -7)).toBe('2026-11-17');
  });

  it('valida só datas reais', () => {
    expect(dataValida('2026-02-28')).toBe(true);
    expect(dataValida('2026-02-30')).toBe(false);
    expect(dataValida('24/11/2026')).toBe(false);
  });

  it('dia local tem mês com dois dígitos', () => {
    expect(dataLocal(new Date(2026, 0, 5, 23, 59))).toBe('2026-01-05');
  });

  it('formata horas de sono', () => {
    expect(formatarHoras(450)).toBe('7h30');
    expect(formatarHoras(65)).toBe('1h05');
  });

  it('data curta sem ponto de abreviação', () => {
    expect(dataCurta('2026-11-24')).not.toContain('.');
  });
});
