import * as Clipboard from 'expo-clipboard';
import { useState } from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Icon } from '@/components/Icon';
import { Button, Card, ScreenHeader, Txt } from '@/components/ui';
import { abrirArquivo, compartilharArquivo } from '@/lib/arquivo';
import { confirm } from '@/lib/platform';
import { historicoCsv, parseBackup } from '@/lib/workout';
import { useStore } from '@/store';
import { colors, fonts, radius } from '@/theme';

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`;
const hoje = () => {
  const d = new Date();
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

export default function Backup() {
  const plans = useStore((st) => st.plans);
  const history = useStore((st) => st.history);
  const restore = useStore((st) => st.restore);
  const ultimoBackup = useStore((st) => st.ajustes.ultimoBackup);
  const marcarBackup = () => useStore.getState().setAjustes({ ultimoBackup: Date.now() });
  const { bottom } = useSafeAreaInsets();
  const [text, setText] = useState('');
  const [message, setMessage] = useState<{ ok: boolean; text: string }>();

  const copy = async () => {
    await Clipboard.setStringAsync(JSON.stringify({ plans, history }));
    marcarBackup();
    setMessage({ ok: true, text: 'Backup copiado. Cole numa conversa sua no WhatsApp, no e-mail ou num bloco de notas para guardar.' });
  };

  const salvarArquivo = async () => {
    try {
      await compartilharArquivo(`treino-backup-${hoje()}.json`, JSON.stringify({ plans, history }), 'application/json');
      marcarBackup();
      setMessage({ ok: true, text: 'Arquivo de backup criado. Guarde no Drive, no WhatsApp ou no e-mail.' });
    } catch {
      setMessage({ ok: false, text: 'Não deu para criar o arquivo. Use "Copiar backup" como alternativa.' });
    }
  };

  const exportarCsv = async () => {
    try {
      await compartilharArquivo(`treino-historico-${hoje()}.csv`, historicoCsv(history), 'text/csv');
    } catch {
      setMessage({ ok: false, text: 'Não deu para criar a planilha.' });
    }
  };

  const abrir = async () => {
    try {
      const conteudo = await abrirArquivo();
      if (conteudo) await load(conteudo);
    } catch {
      setMessage({ ok: false, text: 'Não deu para ler esse arquivo.' });
    }
  };

  const load = async (input = text) => {
    try {
      const data = parseBackup(input);
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
      setMessage({ ok: false, text: 'Isso não é um backup válido. Use o arquivo .json ou o texto inteiro do backup.' });
    }
  };

  return (
    <View style={s.screen}>
      <ScreenHeader kicker="Seus dados" title="Backup" />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView contentContainerStyle={[s.content, { paddingBottom: bottom + 32 }]} keyboardShouldPersistTaps="handled">
        <Card style={s.info}>
          <View style={s.infoIcon}>
            <Icon name="database" size={22} color={colors.accent} />
          </View>
          <View style={{ flex: 1, gap: 4 }}>
            <Txt v="h2">Tudo fica só neste celular</Txt>
            <Txt v="sub">
              {plural(plans.length, 'ficha')} e {plural(history.length, 'treino')} salvos. Antes de trocar de celular ou
              desinstalar o app, salve o backup.
            </Txt>
          </View>
        </Card>
        <Button label="Salvar arquivo de backup" icon="share" onPress={salvarArquivo} />
        <View style={s.row}>
          <Button small variant="secondary" icon="copy" label="Copiar texto" onPress={copy} style={{ flex: 1 }} />
          <Button small variant="secondary" icon="file" label="Planilha (CSV)" onPress={exportarCsv} disabled={!history.length} style={{ flex: 1 }} />
        </View>
        <Txt v="sub" style={{ fontSize: 12 }}>
          {ultimoBackup ? `Último backup: ${new Date(ultimoBackup).toLocaleDateString('pt-BR')}.` : 'Nenhum backup feito ainda.'}
          {' '}A planilha abre no Excel ou no Planilhas Google (só para ver, não restaura).
        </Txt>

        <View style={s.section}>
          <Txt v="label">Restaurar</Txt>
          <Button variant="secondary" icon="upload" label="Abrir arquivo de backup" onPress={abrir} />
          <Txt v="sub" style={{ fontSize: 12 }}>Ou cole o texto do backup:</Txt>
          <TextInput
            value={text}
            onChangeText={setText}
            multiline
            placeholder="Cole aqui o texto do backup"
            placeholderTextColor={colors.faint}
            accessibilityLabel="Texto do backup"
            style={s.input}
          />
          <Button variant="secondary" icon="upload" label="Restaurar do texto" onPress={() => load()} disabled={!text.trim()} />
        </View>
        {message && (
          <View style={[s.message, !message.ok && s.messageError]}>
            <Icon name={message.ok ? 'check' : 'x'} size={18} color={message.ok ? colors.up : colors.danger} />
            <Txt style={{ flex: 1 }}>{message.text}</Txt>
          </View>
        )}
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const s = StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  content: { paddingHorizontal: 16, gap: 12 },
  info: { flexDirection: 'row', gap: 14 },
  infoIcon: { width: 44, height: 44, borderRadius: 22, backgroundColor: colors.accentSoft, alignItems: 'center', justifyContent: 'center' },
  section: { gap: 10, marginTop: 16 },
  row: { flexDirection: 'row', gap: 10 },
  input: {
    backgroundColor: colors.surface, color: colors.text, borderRadius: radius.md, padding: 14, minHeight: 120,
    textAlignVertical: 'top', borderWidth: 1, borderColor: colors.line, fontFamily: fonts.body, fontSize: 13,
  },
  message: { flexDirection: 'row', gap: 10, alignItems: 'flex-start', backgroundColor: colors.surface, borderRadius: radius.md, padding: 14 },
  messageError: { borderWidth: 1, borderColor: colors.danger },
});
