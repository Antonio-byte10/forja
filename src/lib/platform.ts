import { useEffect, useState } from 'react';
import { Alert, Platform } from 'react-native';

/** Confirmação que funciona no celular e no navegador. */
export const confirm = (title: string, message = '', ok = 'Confirmar') =>
  Platform.OS === 'web'
    ? Promise.resolve(window.confirm(message ? `${title}\n\n${message}` : title))
    : new Promise<boolean>((resolve) =>
        Alert.alert(
          title,
          message,
          [
            { text: 'Cancelar', style: 'cancel', onPress: () => resolve(false) },
            { text: ok, onPress: () => resolve(true) },
          ],
          { cancelable: true, onDismiss: () => resolve(false) },
        ),
      );

/** Horário atual, atualizado a cada `ms`. */
export const useNow = (ms = 1000) => {
  const [now, setNow] = useState(Date.now);
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), ms);
    return () => clearInterval(id);
  }, [ms]);
  return now;
};
