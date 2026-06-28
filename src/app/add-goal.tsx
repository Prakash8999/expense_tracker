import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, KeyboardAvoidingView, Platform, Modal, TouchableWithoutFeedback } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { addGoal } from '@/db/queries';
import { AVAILABLE_COLORS } from '@/constants/categories';

const GOAL_ICONS = ['flag', 'car', 'home', 'airplane', 'school', 'gift', 'diamond', 'trophy', 'rocket', 'heart', 'laptop', 'musical-notes', 'camera', 'earth', 'fitness', 'medal'];

export default function AddGoalScreen() {
  const { currency, loadGoals } = useStore();
  const [name, setName] = useState('');
  const [target, setTarget] = useState('');
  const [currentAmount, setCurrentAmount] = useState('');
  const [targetDate, setTargetDate] = useState<number | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [note, setNote] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('flag');
  const [selectedColor, setSelectedColor] = useState('#6366F1');

  const handleSave = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Enter a goal name.'); return; }
    const amt = parseFloat(target);
    if (!amt || amt <= 0) { Alert.alert('Error', 'Enter a valid target amount.'); return; }
    const curAmt = parseFloat(currentAmount) || 0;
    
    await addGoal({ 
      name: name.trim(), 
      targetAmount: amt, 
      currentAmount: curAmt,
      targetDate: targetDate || undefined,
      icon: selectedIcon, 
      color: selectedColor, 
      note: note.trim() || undefined 
    });
    
    await loadGoals();
    router.back();
  };

  const getTargetDateLabel = () => {
    if (!targetDate) return 'Set Target Date (Optional)';
    const d = new Date(targetDate);
    return `Target: ${d.toLocaleDateString('default', { month: 'long', year: 'numeric' })}`;
  };

  const setDateOption = (months: number) => {
    const d = new Date();
    d.setMonth(d.getMonth() + months);
    setTargetDate(d.getTime());
    setShowDatePicker(false);
  };

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={28} color={Colors.light.text} /></TouchableOpacity>
          <Text style={styles.headerTitle}>New Savings Goal</Text>
          <TouchableOpacity onPress={handleSave}><Text style={styles.saveText}>Save</Text></TouchableOpacity>
        </View>
        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Preview */}
          <View style={styles.preview}>
            <View style={[styles.previewIcon, { backgroundColor: selectedColor + '20' }]}>
              <Ionicons name={selectedIcon as any} size={36} color={selectedColor} />
            </View>
            <Text style={styles.previewName}>{name || 'My Goal'}</Text>
            <Text style={styles.previewTarget}>{target ? `${currency.symbol}${target}` : 'Set a target'}</Text>
          </View>

          <TextInput style={styles.input} placeholder="Goal Name (e.g. New Car)" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
          
          <View style={styles.rowInputs}>
            <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder={`Target (${currency.symbol})`} placeholderTextColor="#94A3B8" keyboardType="decimal-pad" value={target} onChangeText={setTarget} />
            <TextInput style={[styles.input, { flex: 1, marginBottom: 0 }]} placeholder={`Starting (${currency.symbol})`} placeholderTextColor="#94A3B8" keyboardType="decimal-pad" value={currentAmount} onChangeText={setCurrentAmount} />
          </View>

          <TouchableOpacity style={styles.dateSelector} onPress={() => setShowDatePicker(true)}>
            <Ionicons name="calendar-outline" size={20} color={targetDate ? Colors.light.tint : '#94A3B8'} />
            <Text style={[styles.dateSelectorText, targetDate ? { color: Colors.light.text, fontWeight: '600' as const } : null]}>
              {getTargetDateLabel()}
            </Text>
          </TouchableOpacity>

          <TextInput style={[styles.input, { minHeight: 56, marginTop: 14 }]} placeholder="Note (optional)" placeholderTextColor="#94A3B8" value={note} onChangeText={setNote} multiline />

          <Text style={styles.label}>Icon</Text>
          <View style={styles.iconGrid}>
            {GOAL_ICONS.map(icon => (
              <TouchableOpacity key={icon} style={[styles.iconItem, selectedIcon === icon && { backgroundColor: selectedColor + '20', borderColor: selectedColor }]} onPress={() => setSelectedIcon(icon)}>
                <Ionicons name={icon as any} size={22} color={selectedIcon === icon ? selectedColor : '#94A3B8'} />
              </TouchableOpacity>
            ))}
          </View>

          <Text style={styles.label}>Color</Text>
          <View style={styles.colorGrid}>
            {AVAILABLE_COLORS.slice(0, 16).map(color => (
              <TouchableOpacity key={color} style={[styles.colorItem, { backgroundColor: color }, selectedColor === color && styles.colorSelected]} onPress={() => setSelectedColor(color)} />
            ))}
          </View>
          <View style={{ height: 100 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* Target Date Modal */}
      <Modal visible={showDatePicker} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowDatePicker(false)}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <Text style={styles.modalTitle}>When do you need it?</Text>
              
              <TouchableOpacity style={styles.modalOption} onPress={() => setDateOption(3)}>
                <Text style={styles.modalOptionText}>In 3 Months</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => setDateOption(6)}>
                <Text style={styles.modalOptionText}>In 6 Months</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => setDateOption(12)}>
                <Text style={styles.modalOptionText}>In 1 Year</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => setDateOption(24)}>
                <Text style={styles.modalOptionText}>In 2 Years</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.modalOption} onPress={() => { setTargetDate(null); setShowDatePicker(false); }}>
                <Text style={[styles.modalOptionText, { color: '#EF5350' }]}>No Target Date</Text>
              </TouchableOpacity>
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  saveText: { fontSize: 16, fontWeight: '700', color: Colors.light.tint },
  content: { flex: 1, paddingHorizontal: 20 },
  preview: { alignItems: 'center', paddingVertical: 24, marginBottom: 20 },
  previewIcon: { width: 80, height: 80, borderRadius: 24, justifyContent: 'center', alignItems: 'center', marginBottom: 12 },
  previewName: { fontSize: 20, fontWeight: '700', color: Colors.light.text },
  previewTarget: { fontSize: 14, color: '#94A3B8', marginTop: 4 },
  input: { backgroundColor: '#FFF', borderRadius: 14, padding: 16, fontSize: 16, color: Colors.light.text, marginBottom: 14, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  rowInputs: { flexDirection: 'row', gap: 12, marginBottom: 14 },
  dateSelector: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#FFF', borderRadius: 14, padding: 16, gap: 10, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  dateSelectorText: { fontSize: 16, color: '#94A3B8' },
  label: { fontSize: 15, fontWeight: '600', color: Colors.light.textSecondary, marginBottom: 12, marginTop: 4 },
  iconGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  iconItem: { width: 44, height: 44, borderRadius: 14, justifyContent: 'center', alignItems: 'center', backgroundColor: '#FFF', borderWidth: 2, borderColor: '#F1F5F9' },
  colorGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginBottom: 20 },
  colorItem: { width: 38, height: 38, borderRadius: 19, borderWidth: 3, borderColor: 'transparent' },
  colorSelected: { borderColor: '#0F172A', transform: [{ scale: 1.15 }] },
  
  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'center', alignItems: 'center', padding: 20 },
  modalContent: { backgroundColor: '#FFF', width: '100%', borderRadius: 20, padding: 20, elevation: 5, shadowColor: '#000', shadowOpacity: 0.2, shadowRadius: 10, shadowOffset: { width: 0, height: 4 } },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text, marginBottom: 16, textAlign: 'center' },
  modalOption: { paddingVertical: 16, borderBottomWidth: 1, borderBottomColor: '#F1F5F9', alignItems: 'center' },
  modalOptionText: { fontSize: 16, fontWeight: '600', color: Colors.light.tint },
});
