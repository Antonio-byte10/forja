import * as Notifications from 'expo-notifications';

/**
 * Aviso de fim do descanso que chega mesmo com a tela bloqueada (notificação local, sem internet).
 * Com o app aberto o aviso não aparece: quem avisa é a vibração do cronômetro.
 */
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldPlaySound: false,
    shouldSetBadge: false,
    shouldShowBanner: false,
    shouldShowList: false,
  }),
});

const CANAL = 'descanso';
let pronto: Promise<boolean> | undefined;

/** Cria o canal e pede a permissão uma vez só (no Android 13+ o pedido só aparece depois do canal). */
export const prepararAvisos = () =>
  (pronto ??= (async () => {
    await Notifications.setNotificationChannelAsync(CANAL, {
      name: 'Fim do descanso',
      // eslint-disable-next-line import/namespace -- vem de um `export *` que o lint não segue (o tsc confere).
      importance: Notifications.AndroidImportance.HIGH,
      vibrationPattern: [0, 500, 200, 500],
      sound: 'default',
    });
    const atual = await Notifications.getPermissionsAsync();
    if (atual.granted) return true;
    return (await Notifications.requestPermissionsAsync()).granted;
  })().catch(() => false));

/** Agenda o aviso para daqui a `segundos`; devolve o id para cancelar. */
export async function agendarAviso(segundos: number, title: string, body: string): Promise<string | undefined> {
  if (segundos < 1 || !(await prepararAvisos())) return undefined;
  return Notifications.scheduleNotificationAsync({
    content: { title, body },
    trigger: { type: Notifications.SchedulableTriggerInputTypes.TIME_INTERVAL, seconds: Math.round(segundos), channelId: CANAL },
  }).catch(() => undefined);
}

export function cancelarAviso(id?: string) {
  if (id) Notifications.cancelScheduledNotificationAsync(id).catch(() => {});
}
