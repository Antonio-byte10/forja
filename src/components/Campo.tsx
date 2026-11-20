import { StyleSheet, TextInput, View, type TextInputProps } from 'react-native';
import { colors, fonts, radius } from '@/theme';
import { Txt } from './ui';

export function Campo({ label, ...props }: TextInputProps & { label: string }) {
  return (
    <View style={{ gap: 4 }}>
      <Txt v="label">{label}</Txt>
      <TextInput accessibilityLabel={label} placeholderTextColor={colors.faint} {...props}
        style={[s.input, props.multiline && s.multi]} />
    </View>
  );
}
const s = StyleSheet.create({
  input: { minHeight: 44, backgroundColor: colors.raised, borderRadius: radius.sm, paddingHorizontal: 12,
    paddingVertical: 8, color: colors.text, fontFamily: fonts.body, fontSize: 16 },
  multi: { minHeight: 84, textAlignVertical: 'top' },
});
