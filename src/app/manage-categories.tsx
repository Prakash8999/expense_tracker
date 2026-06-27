import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { Colors } from '@/constants/theme';
import { useStore } from '@/store/useStore';
import { addCategory } from '@/db/queries';
import { AVAILABLE_ICONS, AVAILABLE_COLORS } from '@/constants/categories';

const { width } = Dimensions.get('window');

export default function ManageCategoriesScreen() {
  const { expenseCategories, incomeCategories, loadCategories } = useStore();
  const [tab, setTab] = useState<'expense' | 'income'>('expense');
  const [showForm, setShowForm] = useState(false);
  const [name, setName] = useState('');
  const [selectedIcon, setSelectedIcon] = useState('star');
  const [selectedColor, setSelectedColor] = useState('#6366F1');

  const cats = tab === 'expense' ? expenseCategories : incomeCategories;

  const handleAdd = async () => {
    if (!name.trim()) { Alert.alert('Error', 'Enter a category name.'); return; }
    await addCategory({ name: name.trim(), icon: selectedIcon, color: selectedColor, type: tab });
    await loadCategories();
    setName(''); setShowForm(false);
  };

  return (
    <SafeAreaView style={s.safe} edges={['top']}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()}><Ionicons name="close" size={28} color={Colors.light.text} /></TouchableOpacity>
        <Text style={s.title}>Categories</Text>
        <TouchableOpacity onPress={() => setShowForm(!showForm)}>
          <Ionicons name={showForm ? 'close-circle' : 'add-circle'} size={28} color={Colors.light.tint} />
        </TouchableOpacity>
      </View>

      <View style={s.tabRow}>
        <TouchableOpacity style={[s.tab, tab === 'expense' && s.tabActive]} onPress={() => setTab('expense')}>
          <Text style={[s.tabText, tab === 'expense' && s.tabTextActive]}>Expense</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.tab, tab === 'income' && s.tabActive]} onPress={() => setTab('income')}>
          <Text style={[s.tabText, tab === 'income' && s.tabTextActive]}>Income</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={s.content}>
        {showForm && (
          <View style={s.formCard}>
            <TextInput style={s.input} placeholder="Category Name" placeholderTextColor="#94A3B8" value={name} onChangeText={setName} />
            <Text style={s.label}>Icon</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 12 }}>
              {AVAILABLE_ICONS.slice(0, 30).map(icon => (
                <TouchableOpacity key={icon} style={[s.iconItem, selectedIcon === icon && { backgroundColor: selectedColor + '20', borderColor: selectedColor }]} onPress={() => setSelectedIcon(icon)}>
                  <Ionicons name={icon as any} size={20} color={selectedIcon === icon ? selectedColor : '#94A3B8'} />
                </TouchableOpacity>
              ))}
            </ScrollView>
            <Text style={s.label}>Color</Text>
            <View style={s.colorRow}>
              {AVAILABLE_COLORS.slice(0, 12).map(c => (
                <TouchableOpacity key={c} style={[s.colorDot, { backgroundColor: c }, selectedColor === c && s.colorSelected]} onPress={() => setSelectedColor(c)} />
              ))}
            </View>
            <TouchableOpacity style={s.addBtn} onPress={handleAdd}>
              <Text style={s.addBtnText}>Add Category</Text>
            </TouchableOpacity>
          </View>
        )}

        <View style={s.grid}>
          {cats.map((cat: any) => (
            <View key={cat.id} style={s.catItem}>
              <View style={[s.catIcon, { backgroundColor: cat.color + '20' }]}>
                <Ionicons name={cat.icon as any} size={22} color={cat.color} />
              </View>
              <Text style={s.catName} numberOfLines={1}>{cat.name}</Text>
            </View>
          ))}
        </View>
        <View style={{ height: 100 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const COLS = 4;
const ITEM_W = (width - 60) / COLS;

const s = StyleSheet.create({
  safe: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  title: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  tabRow: { flexDirection: 'row', marginHorizontal: 20, backgroundColor: '#F1F5F9', borderRadius: 14, padding: 4, marginBottom: 16 },
  tab: { flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center' },
  tabActive: { backgroundColor: '#FFF', elevation: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#94A3B8' },
  tabTextActive: { color: Colors.light.text },
  content: { flex: 1, paddingHorizontal: 20 },
  formCard: { backgroundColor: '#FFF', borderRadius: 18, padding: 18, marginBottom: 20 },
  input: { backgroundColor: '#F1F5F9', borderRadius: 12, padding: 14, fontSize: 16, color: Colors.light.text, marginBottom: 14 },
  label: { fontSize: 13, fontWeight: '600', color: '#94A3B8', marginBottom: 8 },
  iconItem: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 8, borderWidth: 2, borderColor: '#F1F5F9' },
  colorRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 16 },
  colorDot: { width: 32, height: 32, borderRadius: 16, borderWidth: 3, borderColor: 'transparent' },
  colorSelected: { borderColor: '#0F172A' },
  addBtn: { backgroundColor: Colors.light.tint, borderRadius: 14, paddingVertical: 14, alignItems: 'center' },
  addBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  grid: { flexDirection: 'row', flexWrap: 'wrap' },
  catItem: { width: ITEM_W, alignItems: 'center', marginBottom: 20 },
  catIcon: { width: 48, height: 48, borderRadius: 16, justifyContent: 'center', alignItems: 'center', marginBottom: 6 },
  catName: { fontSize: 11, color: Colors.light.textSecondary, textAlign: 'center', fontWeight: '500' },
});
