import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text } from 'react-native';
import { Button, Card } from '@/components/ui';
import { confirm } from '@/lib/platform';
import { parseBackup } from '@/lib/workout';
import { useStore } from '@/store';
import { colors } from '@/theme';

export default function Backup() {
  const { plans, history, restore } = useStore();
  const [message, setMessage] = useState('');

  const copy = async () => {
    await Clipboard.setStringAsync(JSON.stringify({ plans, history }));
    setMessage('Backup copiado. Cole numa conversa sua no WhatsApp, no e-mail ou num bloco de notas para guardar.');
  };

  const paste = async () => {
    try {
      const data = parseBackup(await Clipboard.getStringAsync());
      const ok = await confirm(
        'Restaurar backup?',
        `${data.plans.length} fichas e ${data.history.length} treinos. Os dados atuais serão substituídos.`,
        'Restaurar',
      );
      if (!ok) return;
      restore(data);
      setMessage('Backup restaurado.');
    } catch {
      setMessage('Não encontrei um backup válido na área de transferência. Copie o texto do backup inteiro e tente de novo.');
    }
  };

  return (
    <ScrollView contentContainerStyle={s.content}>
      <Card style={{ gap: 6 }}>
        <Text style={s.title}>Seus dados ficam só neste celular</Text>
        <Text style={s.muted}>
          {plans.length} fichas e {history.length} treinos salvos. Se trocar de celular ou desinstalar o app, use o backup.
        </Text>
      </Card>
      <Button label="Copiar backup" onPress={copy} />
      <Button variant="ghost" label="Restaurar do texto copiado" onPress={paste} />
      {!!message && <Text style={s.message}>{message}</Text>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  title: { color: colors.text, fontWeight: '800', fontSize: 16 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  message: { color: colors.accent, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
