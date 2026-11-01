import { useEffect, useState } from 'react';
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
export function NumberInput({ value, onChange, label }: { value: number; onChange: (n: number) => void; label: string }) {
  const [text, setText] = useState(show(value));
  useEffect(() => {
    setText((t) => (parseNumber(t) === value ? t : show(value)));
  }, [value]);
  return (
    <TextInput
      value={text}
      accessibilityLabel={label}
      onChangeText={(t) => {
        setText(t);
        onChange(parseNumber(t));
      }}
      keyboardType="decimal-pad"
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
      <Pressable onPress={() => onChange(Math.max(min, value - 1))} style={s.stepBtn} accessibilityLabel={`Menos ${label}`}>
        <Text style={s.stepSign}>−</Text>
      </Pressable>
      <Text style={s.stepValue}>{value}</Text>
      <Pressable onPress={() => onChange(value + 1)} style={s.stepBtn} accessibilityLabel={`Mais ${label}`}>
        <Text style={s.stepSign}>+</Text>
      </Pressable>
    </View>
  );
}

export function ExerciseImage({ catalogKey, name, size }: { catalogKey?: string; name: string; size: number | '100%' }) {
  const source = catalogKey ? catalog[catalogKey]?.image : undefined;
  // Fotos do catálogo são 3:2.
  const box = size === '100%' ? { width: size, aspectRatio: 1.5 } : { width: size, height: size };
  return source ? (
    <Image source={source} resizeMode="cover" style={[s.image, box]} />
  ) : (
    <View style={[s.image, s.placeholder, box]}>
      <Text style={s.placeholderText}>{name.charAt(0).toUpperCase()}</Text>
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
  stepBtn: { width: 34, height: 34, borderRadius: 10, backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  stepSign: { color: colors.text, fontSize: 18, fontWeight: '700' },
  stepValue: { color: colors.text, fontSize: 16, fontWeight: '700', minWidth: 24, textAlign: 'center' },
  image: { borderRadius: 10, backgroundColor: '#fff' },
  placeholder: { backgroundColor: colors.raised, alignItems: 'center', justifyContent: 'center' },
  placeholderText: { color: colors.muted, fontSize: 22, fontWeight: '800' },
});
