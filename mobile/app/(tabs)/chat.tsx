import { useState } from 'react';
import {
  View, Text, TextInput, TouchableOpacity, ScrollView,
  StyleSheet, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { useRouter } from 'expo-router';
import apiClient from '@/lib/apiClient';

const C = {
  orange: '#f97316',
  white: '#ffffff',
  gray50: '#f9fafb',
  gray200: '#e5e7eb',
  gray500: '#6b7280',
  gray900: '#111827',
  red: '#ef4444',
};

export default function SearchScreen() {
  const router = useRouter();
  const [inputMode, setInputMode] = useState<'manual' | 'vin'>('manual');
  const [make, setMake] = useState('');
  const [model, setModel] = useState('');
  const [year, setYear] = useState('');
  const [vin, setVin] = useState('');
  const [partName, setPartName] = useState('');
  const [partOem, setPartOem] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const submit = async () => {
    setError('');
    if (!partName && !partOem) { setError('Enter a part name or OEM number'); return; }
    if (inputMode === 'manual' && (!make || !model)) { setError('Enter make and model'); return; }
    if (inputMode === 'vin' && !vin) { setError('Enter a VIN number'); return; }

    setLoading(true);
    try {
      const payload = {
        ...(inputMode === 'vin' ? { vin } : { vehicleMake: make, vehicleModel: model, vehicleYear: year ? parseInt(year) : undefined }),
        partName: partName || undefined,
        partOem: partOem || undefined,
      };
      const res = await apiClient.post('/guides', payload);
      router.push(`/guide/${res.data.data.id}`);
    } catch {
      setError('Failed to create guide. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      <ScrollView style={styles.container} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Search repair guide</Text>
        <Text style={styles.subtitle}>Enter your vehicle and part details</Text>

        {/* Toggle */}
        <View style={styles.toggle}>
          <TouchableOpacity
            style={[styles.toggleBtn, inputMode === 'manual' && styles.toggleBtnActive]}
            onPress={() => setInputMode('manual')}
          >
            <Text style={[styles.toggleText, inputMode === 'manual' && styles.toggleTextActive]}>Make / Model</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.toggleBtn, inputMode === 'vin' && styles.toggleBtnActive]}
            onPress={() => setInputMode('vin')}
          >
            <Text style={[styles.toggleText, inputMode === 'vin' && styles.toggleTextActive]}>VIN number</Text>
          </TouchableOpacity>
        </View>

        {/* Vehicle */}
        <Text style={styles.label}>Vehicle</Text>
        {inputMode === 'vin' ? (
          <TextInput style={styles.input} placeholder="e.g. 1HGCM82633A123456" placeholderTextColor="#9ca3af"
            value={vin} onChangeText={setVin} autoCapitalize="characters" />
        ) : (
          <View style={styles.row}>
            <TextInput style={[styles.input, styles.flex1]} placeholder="Make" placeholderTextColor="#9ca3af" value={make} onChangeText={setMake} />
            <TextInput style={[styles.input, styles.flex1]} placeholder="Model" placeholderTextColor="#9ca3af" value={model} onChangeText={setModel} />
            <TextInput style={[styles.input, { width: 80 }]} placeholder="Year" placeholderTextColor="#9ca3af" value={year} onChangeText={setYear} keyboardType="number-pad" />
          </View>
        )}

        {/* Part */}
        <Text style={styles.label}>Part</Text>
        <TextInput style={styles.input} placeholder="Part name (e.g. Brake pads front)" placeholderTextColor="#9ca3af" value={partName} onChangeText={setPartName} />
        <TextInput style={styles.input} placeholder="OEM number (optional)" placeholderTextColor="#9ca3af" value={partOem} onChangeText={setPartOem} />

        {error ? <Text style={styles.error}>{error}</Text> : null}

        <TouchableOpacity style={styles.submitBtn} onPress={submit} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.submitText}>Generate repair guide</Text>}
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.gray50 },
  content: { padding: 20, paddingBottom: 40 },
  title: { fontSize: 22, fontWeight: '700', color: C.gray900, marginBottom: 4 },
  subtitle: { fontSize: 14, color: C.gray500, marginBottom: 24 },
  toggle: {
    flexDirection: 'row', backgroundColor: C.gray200, borderRadius: 12,
    padding: 4, marginBottom: 20,
  },
  toggleBtn: { flex: 1, paddingVertical: 10, borderRadius: 10, alignItems: 'center' },
  toggleBtnActive: { backgroundColor: C.white },
  toggleText: { fontSize: 14, fontWeight: '600', color: C.gray500 },
  toggleTextActive: { color: C.gray900 },
  label: { fontSize: 14, fontWeight: '600', color: C.gray900, marginBottom: 8 },
  input: {
    backgroundColor: C.white, borderWidth: 1, borderColor: C.gray200,
    borderRadius: 12, paddingHorizontal: 14, paddingVertical: 12,
    fontSize: 15, color: C.gray900, marginBottom: 12,
  },
  row: { flexDirection: 'row', gap: 8 },
  flex1: { flex: 1 },
  error: { color: C.red, fontSize: 14, marginBottom: 12 },
  submitBtn: {
    backgroundColor: C.orange, borderRadius: 12, paddingVertical: 16,
    alignItems: 'center', marginTop: 8,
  },
  submitText: { color: C.white, fontWeight: '700', fontSize: 16 },
});
