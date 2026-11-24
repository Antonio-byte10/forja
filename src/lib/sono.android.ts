import { aggregateRecord, getGrantedPermissions, getSdkStatus, initialize, requestPermission, SdkAvailabilityStatus } from 'react-native-health-connect';
import { meioDia } from './datas';

/** Noite atribuída ao dia em que termina, do meio-dia anterior até o meio-dia local. */
export async function lerSono(dia: string, pedir: boolean): Promise<number | undefined> {
  const status = await getSdkStatus();
  if (status !== SdkAvailabilityStatus.SDK_AVAILABLE || !await initialize()) {
    throw new Error('Health Connect indisponível. Verifique a instalação ou registre o sono manualmente.');
  }
  const temLeitura = (p: { accessType: string; recordType: string }) => p.recordType === 'SleepSession' && p.accessType === 'read';
  if (!(await getGrantedPermissions()).some(temLeitura)) {
    if (!pedir || !(await requestPermission([{ accessType: 'read', recordType: 'SleepSession' }])).some(temLeitura)) {
      throw new Error('Autorize a leitura de sono nas permissões do Health Connect.');
    }
  }
  const fim = meioDia(dia);
  const inicio = new Date(fim);
  inicio.setDate(inicio.getDate() - 1);
  const resultado = await aggregateRecord({ recordType: 'SleepSession', timeRangeFilter: {
    operator: 'between', startTime: inicio.toISOString(), endTime: new Date(Math.min(Date.now(), fim.getTime())).toISOString(),
  } });
  const minutos = Math.round(resultado.SLEEP_DURATION_TOTAL / 60);
  return minutos > 0 ? minutos : undefined;
}
