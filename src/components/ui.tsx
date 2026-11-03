import { useState } from 'react';
import { Image, Pressable, StyleSheet, Text, TextInput, View, type ViewProps } from 'react-native';
import { catalog } from '@/data/catalog';
import { parseNumber } from '@/lib/workout';
import { colors, radius } from '@/theme';

type ButtonProps = {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'ghost' | 'danger';
  small?: boolean;
  disabled?: boolean;
};

export function Button({ label, onPress, variant = 'primary', small, disabled }: ButtonProps) {
  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      accessibilityRole="button"
      style={({ pressed }) => [s.btn, s[variant], small && s.small, (pressed || disabled) && s.dim]}
    >
      <Text style={[s.btnLabel, variant === 'primary' && { color: colors.onAccent }, variant === 'danger' && { color: colors.danger }]}>
        {label}
      </Text>
    </Pressable>
  );
}

export const Card = ({ style, ...props }: ViewProps) => <View style={[s.card, style]} {...props} />;

const show = (n: number) => (n ? String(n).replace('.', ',') : '');

/** Campo numérico que aceita vírgula e não perde o que está sendo digitado. */
export function NumberInput({ value, onChange, label, integer }: { value: number; onChange: (n: number) => void; label: string; integer?: boolean }) {
  const [text, setText] = useState(show(value));
  const [synced, setSynced] = useState(value);
  // Valor mudou por fora (ex.: nova série): atualiza o texto sem apagar "42," enquanto digita.
  if (value !== synced) {
    setSynced(value);
    if (parseNumber(text) !== value) setText(show(value));
  }
  return (
    <TextInput
      value={text}
      accessibilityLabel={label}
      onChangeText={(t) => {
        setText(t);
        onChange(parseNumber(t));
      }}
      keyboardType={integer ? 'number-pad' : 'decimal-pad'}
      selectTextOnFocus
      placeholder="0"
      placeholderTextColor={colors.muted}
      style={s.input}
    />
  );
}

export function Stepper({ value, onChange, min = 1, label }: { value: number; onChange: (n: number) => void; min?: number; label: string }) {
  return (
    <View style={s.stepper}>
      <Text style={s.stepLabel}>{label}</Text>
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={({ pressed }) => [s.stepBtn, pressed && s.dim]} accessibilityRole="button" accessibilityLabel={`Menos ${label}`}>
        <Text style={s.stepSign}>−</Text>
      </Pressable>
      <Text style={s.stepValue}>{value}</Text>
      <Pressable onPress={() => onChange(value + 1)} style={({ pressed }) => [s.stepBtn, pressed && s.dim]} accessibilityRole="button" accessibilityLabel={`Mais ${label}`}>
        <Text style={s.stepSign}>+</Text>
      </Pressable>
    </View>
  );
}

/** `size` é a altura (miniatura 3:2, sem cortar a foto), ou '100%' para a largura toda. `square` recorta no centro. */
export function ExerciseImage({ catalogKey, name, size, square }: { catalogKey?: string; name: string; size: number | '100%'; square?: boolean }) {
  const source = catalogKey ? catalog[catalogKey]?.image : undefined;
  // Fotos do catálogo são 3:2. A proporção fica na caixa; a imagem só preenche.
  const box = size === '100%' ? { width: '100%' as const, aspectRatio: 1.5 } : { width: square ? size : size * 1.5, height: size };
  return (
    <View style={[s.image, box]}>
      {source ? (
        <Image source={source} resizeMode="cover" style={StyleSheet.absoluteFill} accessibilityLabel={`Foto: ${name}`} />
      ) : (
        <View style={[StyleSheet.absoluteFill, s.placeholder]}>
          <Text style={s.placeholderText}>{name.charAt(0).toUpperCase()}</Text>
        </View>
      )}
    </View>
  );
}

const s = StyleSheet.create({
  btn: { borderRadius: radius, paddingVertical: 15, paddingHorizontal: 18, alignItems: 'center' },
  small: { paddingVertical: 9, paddingHorizontal: 12 },
  primary: { backgroundColor: colors.accent },
  ghost: { backgroundColor: colors.raised },
  danger: { backgroundColor: 'transparent', borderWidth: 1, borderColor: colors.danger },
  dim: { opacity: 0.6 },
  btnLabel: { color: colors.text, fontWeight: '700', fontSize: 15 },
  card: { backgroundColor: colors.card, borderRadius: radius, padding: 16, borderWidth: 1, borderColor: colors.border },
  input: {
    backgroundColor: colors.raised, color: colors.text, borderRadius: 10, paddingVertical: 10,
    fontSize: 17, fontWeight: '700', textAlign: 'center', minWidth: 64, flex: 1,
  },
  stepper: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  stepLabel: { color: colors.muted, fontSize: 13, marginRight: 2 },
  stepBtn: { width: 40, height: 40, borderRadius: 10, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  stepSign: { color: colors.text, fontSize: 18, fontWeight: '700' },
  stepValue: { color: colors.text, fontSize: 16, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  image: { borderRadius: 10, backgroundColor: '#fff', overflow: 'hidden' },
  placeholder: { backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.muted, fontSize: 22, fontWeight: '800' },
});
