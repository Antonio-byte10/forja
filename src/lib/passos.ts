import {
  aggregateRecord, getGrantedPermissions, getSdkStatus, initialize, openHealthConnectSettings, requestPermission, SdkAvailabilityStatus,
} from 'react-native-health-connect';

/**
 * Passos do dia lidos do Health Connect (Android): o próprio celular, o relógio ou o Samsung Health contam,
 * e o Forja só lê. Funciona com o app fechado porque quem conta é o sistema.
 */
export type EstadoPassos = 'ok' | 'sem-permissao' | 'sem-app' | 'indisponivel';

const LEITURA = [{ accessType: 'read' as const, recordType: 'Steps' as const }];

export async function estadoPassos(): Promise<EstadoPassos> {
  try {
    const sdk = await getSdkStatus();
    if (sdk === SdkAvailabilityStatus.SDK_UNAVAILABLE_PROVIDER_UPDATE_REQUIRED) return 'sem-app';
    if (sdk !== SdkAvailabilityStatus.SDK_AVAILABLE) return 'indisponivel';
    if (!(await initialize())) return 'indisponivel';
    const ok = (await getGrantedPermissions()).some((p) => p.recordType === 'Steps' && p.accessType === 'read');
    return ok ? 'ok' : 'sem-permissao';
  } catch {
    return 'indisponivel';
  }
}

/** Abre a tela do Health Connect pedindo para ler os passos. */
export async function pedirPermissaoPassos(): Promise<boolean> {
  try {
    if (!(await initialize())) return false;
    const dadas = await requestPermission(LEITURA);
    return dadas.some((p) => p.recordType === 'Steps');
  } catch {
    return false;
  }
}

export const abrirAjustesPassos = () => {
  try {
    openHealthConnectSettings();
  } catch {
    // Sem Health Connect instalado: nada a abrir.
  }
};

/** Passos de cada um dos últimos `dias` (do mais antigo a hoje), contando da meia-noite local. */
export async function passosPorDia(dias = 7): Promise<{ dia: number; passos: number }[]> {
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const lista = Array.from({ length: dias }, (_, i) => new Date(hoje.getFullYear(), hoje.getMonth(), hoje.getDate() - (dias - 1 - i)));
  return Promise.all(
    lista.map(async (inicio) => {
      const fim = new Date(inicio.getFullYear(), inicio.getMonth(), inicio.getDate() + 1);
      try {
        const r = await aggregateRecord({
          recordType: 'Steps',
          timeRangeFilter: { operator: 'between', startTime: inicio.toISOString(), endTime: fim.toISOString() },
        });
        return { dia: inicio.getTime(), passos: r.COUNT_TOTAL ?? 0 };
      } catch {
        return { dia: inicio.getTime(), passos: 0 };
      }
    }),
  );
}
