import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ScrollView, StyleSheet, Text, TextInput } from 'react-native';
import { Button, Card } from '@/components/ui';
import { confirm } from '@/lib/platform';
import { parseBackup } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, radius } from '@/theme';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function Backup() {
  const { plans, history, restore } = useStore();
  const [text, setText] = useState('');
  const [message, setMessage] = useState('');

  const copy = async () => {
    await Clipboard.setStringAsync(JSON.stringify({ plans, history }));
    setMessage('Backup copiado. Cole numa conversa sua no WhatsApp, no e-mail ou num bloco de notas para guardar.');
  };

  const load = async () => {
    try {
      const data = parseBackup(text);
      const ok = await confirm(
        'Restaurar backup?',
        `${plural(data.plans.length, 'ficha')} e ${plural(data.history.length, 'treino')}. Os dados atuais serão substituídos.`,
        'Restaurar',
      );
      if (!ok) return;
      restore(data);
      setText('');
      setMessage('Backup restaurado.');
    } catch {
      setMessage('Esse texto não é um backup válido. Cole o texto do backup inteiro.');
    }
  };

  return (
    <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
      <Card style={{ gap: 6 }}>
        <Text style={s.title}>Seus dados ficam só neste celular</Text>
        <Text style={s.muted}>
          {plural(plans.length, 'ficha')} e {plural(history.length, 'treino')} salvos. Se trocar de celular ou
          desinstalar o app, use o backup.
        </Text>
      </Card>
      <Button label="Copiar backup" onPress={copy} />

      <Text style={[s.title, { marginTop: 12 }]}>Restaurar</Text>
      <TextInput
        value={text}
        onChangeText={setText}
        multiline
        placeholder="Cole aqui o texto do backup"
        placeholderTextColor={colors.muted}
        accessibilityLabel="Texto do backup"
        style={s.input}
      />
      <Button variant="ghost" label="Restaurar backup" onPress={load} disabled={!text.trim()} />
      {!!message && <Text style={s.message}>{message}</Text>}
    </ScrollView>
  );
}

const s = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  title: { color: colors.text, fontWeight: '800', fontSize: 16 },
  muted: { color: colors.muted, fontSize: 14, lineHeight: 20 },
  input: {
    backgroundColor: colors.card, color: colors.text, borderRadius: radius, padding: 12, minHeight: 110,
    textAlignVertical: 'top', borderWidth: 1, borderColor: colors.border, fontSize: 13,
  },
  message: { color: colors.accent, fontSize: 14, lineHeight: 20, textAlign: 'center' },
});
