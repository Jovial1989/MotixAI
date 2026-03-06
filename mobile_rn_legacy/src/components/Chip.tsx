import { StyleSheet, Text, View } from 'react-native';
import { C, T, S, R } from '@/theme';

interface ChipProps {
  label: string;
  variant?: 'default' | 'success' | 'warning' | 'primary';
}

export function Chip({ label, variant = 'default' }: ChipProps) {
  const bg    = variant === 'success'  ? C.successLight
              : variant === 'warning'  ? C.warningLight
              : variant === 'primary'  ? C.primaryLight
              : C.bgCard;
  const border = variant === 'success' ? C.successBorder
               : variant === 'warning' ? C.warningBorder
               : variant === 'primary' ? C.primaryBorder
               : C.border;
  const color  = variant === 'success' ? C.success
               : variant === 'warning' ? C.warning
               : variant === 'primary' ? C.primaryDark
               : C.textSub;

  return (
    <View style={[s.chip, { backgroundColor: bg, borderColor: border }]}>
      <Text style={[s.label, { color }]}>{label}</Text>
    </View>
  );
}

const s = StyleSheet.create({
  chip:  { borderRadius: R.full, borderWidth: 1, paddingHorizontal: S.sm + 4, paddingVertical: S.xs + 2 },
  label: { ...T.small, fontWeight: '500' },
});
