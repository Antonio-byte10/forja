import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Button, Card, ScreenHeader, Txt } from '@/components/ui';
import { confirm } from '@/lib/platform';
import { parseBackup } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;

export default function Backup() {
  const plans = useStore((st) => st.plans);
  const history = useStore((st) => st.history);
  const restore = useStore((st) => st.restore);
  const { bottom } = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();

  const copy = async () => {
    await Clipboard.setStringAsync(JSON.stringify({ plans, history }));
    setMessage({ ok: true, text: 'Backup copiado. Cole numa conversa sua no WhatsApp, no e-mail ou num bloco de notas para guardar.' });
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
      setMessage({ ok: true, text: 'Backup restaurado.' });
    } catch {
      setMessage({ ok: false, text: 'Esse texto não é um backup válido. Cole o texto do backup inteiro.' });
    }
  };

  return (
    <View style={s.screen}>
      <ScreenHeader kicker="Seus dados" title="Backup" />
      <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Card style={s.info}>
          <View style={s.infoIcon}>
            <Icon name="database" size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="h2">Tudo fica só neste celular</Txt>
            <Txt v="sub">
              {plural(plans.length, 'ficha')} e {plural(history.length, 'treino')} salvos. Antes de trocar de celular ou
              desinstalar o app, copie o backup.
            </Txt>
          </View>
        </Card>
        <Button label="Copiar backup" icon="copy" onPress={copy} />

        <View style={s.section}>
          <Txt v="label">Restaurar</Txt>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Cole aqui o texto do backup"
            placeholderTextColor={colors.faint}
            accessibilityLabel="Texto do backup"
            style={s.input}
          />
          <Button variant="secondary" icon="upload" label="Restaurar backup" onPress={load} disabled={!text.trim()} />
        </View>
        {message && (
          <View style={[s.message, !message.ok && s.messageError]}>
            <Icon name={message.ok ? 'check' : 'x'} size={18} color={message.ok ? colors.up : colors.danger} />
            <Txt style={{ flex: 1 }}>{message.text}</Txt>
          </View>
        )}
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, gap: 12 },
  info: { flexDirection: 'row', gap: 14 },
  infoIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  section: { gap: 10, marginTop: 16 },
  input: {
    backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, padding: 14, minHeight: 120,
    textAlignVertical: 'top', borderWidth: 1, borderColor: colors.line, fontFamily: fonts.body, fontSize: 13,
  },
  message: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.md, padding: 14 },
  messageError: { borderWidth: 1, borderColor: colors.danger },
});
