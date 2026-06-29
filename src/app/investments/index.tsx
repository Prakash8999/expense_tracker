import React, { useState, useMemo } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal, TextInput, KeyboardAvoidingView, Platform, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useStore } from '@/store/useStore';
import { Colors } from '@/constants/theme';
import { formatCurrency } from '@/utils/currency';
import { PieChart } from 'react-native-gifted-charts';
import { addInvestment, deleteInvestment } from '@/db/queries';

export default function InvestmentsDashboardScreen() {
  const { investments, currency, loadInvestments } = useStore();
  const [modalVisible, setModalVisible] = useState(false);
  
  const [name, setName] = useState('');
  const [type, setType] = useState('stock');
  const [purchasePrice, setPurchasePrice] = useState('');
  const [currentValue, setCurrentValue] = useState('');
  const [quantity, setQuantity] = useState('1');

  const handleSave = async () => {
    if (!name || !purchasePrice || !currentValue) {
      Alert.alert('Error', 'Please fill all required fields');
      return;
    }
    await addInvestment({
      name,
      type,
      purchasePrice: parseFloat(purchasePrice),
      currentValue: parseFloat(currentValue),
      quantity: parseFloat(quantity) || 1,
      purchaseDate: Date.now(),
    });
    setModalVisible(false);
    setName('');
    setPurchasePrice('');
    setCurrentValue('');
    setQuantity('1');
    await loadInvestments();
  };

  // Calculations
  const totalInvested = investments.reduce((sum, i) => sum + (i.purchasePrice * i.quantity), 0);
  const totalCurrent = investments.reduce((sum, i) => sum + (i.currentValue * i.quantity), 0);
  const totalProfit = totalCurrent - totalInvested;
  const totalProfitPercentage = totalInvested > 0 ? (totalProfit / totalInvested) * 100 : 0;
  const isPositive = totalProfit >= 0;

  // Diversification Ring Data
  const pieData = useMemo(() => {
    if (investments.length === 0) return [{ value: 1, color: '#E2E8F0', text: '' }];
    const groups: Record<string, number> = {};
    investments.forEach(i => {
      groups[i.type] = (groups[i.type] || 0) + (i.currentValue * i.quantity);
    });
    
    const colors: any = { 'crypto': '#8B5CF6', 'stock': '#3B82F6', 'real_estate': '#10B981', 'gold': '#F59E0B', 'other': '#64748B' };
    
    return Object.entries(groups).map(([type, value]) => ({
      value,
      color: colors[type] || colors['other'],
      text: type.substring(0, 3).toUpperCase(),
    }));
  }, [investments]);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backButton}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Investments</Text>
        <TouchableOpacity onPress={() => setModalVisible(true)} style={styles.addButton}>
          <Ionicons name="add" size={24} color="#FFF" />
        </TouchableOpacity>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        
        {/* Main P/L Dashboard Card */}
        <View style={styles.dashboardCard}>
          <Text style={styles.dashboardLabel}>Total Portfolio Value</Text>
          <Text style={styles.dashboardTotal}>{formatCurrency(totalCurrent, currency.code)}</Text>
          
          <View style={[styles.plPill, { backgroundColor: isPositive ? '#DCFCE7' : '#FEE2E2' }]}>
            <Ionicons name={isPositive ? "trending-up" : "trending-down"} size={16} color={isPositive ? '#16A34A' : '#EF4444'} />
            <Text style={[styles.plPillText, { color: isPositive ? '#16A34A' : '#EF4444' }]}>
              {isPositive ? '+' : ''}{formatCurrency(totalProfit, currency.code)} ({totalProfitPercentage.toFixed(2)}%)
            </Text>
          </View>
        </View>

        {/* Diversification Ring */}
        {investments.length > 0 && (
          <View style={styles.chartCard}>
            <Text style={styles.chartTitle}>Asset Allocation</Text>
            <View style={{ alignItems: 'center', marginTop: 10 }}>
              <PieChart
                donut
                radius={70}
                innerRadius={50}
                data={pieData}
                centerLabelComponent={() => (
                  <View style={{ alignItems: 'center' }}>
                    <Text style={{ fontSize: 10, color: '#94A3B8' }}>Assets</Text>
                  </View>
                )}
              />
            </View>
            <View style={styles.legendContainer}>
              {pieData.map((slice, idx) => (
                <View key={idx} style={styles.legendItem}>
                  <View style={[styles.legendDot, { backgroundColor: slice.color }]} />
                  <Text style={styles.legendText}>{slice.text}</Text>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Investment List */}
        <Text style={styles.sectionTitle}>Your Holdings</Text>
        {investments.map(inv => {
          const invested = inv.purchasePrice * inv.quantity;
          const current = inv.currentValue * inv.quantity;
          const profit = current - invested;
          const profitPercent = invested > 0 ? (profit / invested) * 100 : 0;
          const isInvPositive = profit >= 0;

          return (
            <TouchableOpacity 
              key={inv.id} 
              style={styles.invCard}
              onLongPress={() => {
                Alert.alert('Delete', 'Delete this investment?', [
                  { text: 'Cancel', style: 'cancel' },
                  { text: 'Delete', style: 'destructive', onPress: async () => { await deleteInvestment(inv.id); await loadInvestments(); } }
                ]);
              }}
            >
              <View style={styles.invInfo}>
                <Text style={styles.invName}>{inv.name}</Text>
                <Text style={styles.invType}>{inv.type.toUpperCase()} • Qty: {inv.quantity}</Text>
              </View>
              <View style={styles.invValues}>
                <Text style={styles.invCurrent}>{formatCurrency(current, currency.code)}</Text>
                <Text style={[styles.invProfit, { color: isInvPositive ? '#16A34A' : '#EF4444' }]}>
                  {isInvPositive ? '+' : ''}{profitPercent.toFixed(2)}%
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}

        {investments.length === 0 && (
          <View style={styles.emptyState}>
            <Ionicons name="pie-chart-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No investments tracked yet.</Text>
          </View>
        )}
        
        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Add Modal */}
      <Modal visible={modalVisible} transparent animationType="slide">
        <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
          <View style={styles.modalOverlay}>
            <View style={styles.modalContent}>
              <View style={styles.modalHeader}>
                <Text style={styles.modalTitle}>Add Investment</Text>
                <TouchableOpacity onPress={() => setModalVisible(false)}>
                  <Ionicons name="close" size={24} color="#64748B" />
                </TouchableOpacity>
              </View>
              
              <TextInput style={styles.input} placeholder="Asset Name (e.g. Bitcoin)" value={name} onChangeText={setName} />
              
              <View style={styles.typeRow}>
                {['crypto', 'stock', 'real_estate', 'other'].map(t => (
                  <TouchableOpacity key={t} style={[styles.typeChip, type === t && styles.typeChipActive]} onPress={() => setType(t)}>
                    <Text style={[styles.typeText, type === t && styles.typeTextActive]}>{t}</Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TextInput style={styles.input} placeholder="Quantity" keyboardType="numeric" value={quantity} onChangeText={setQuantity} />
              <TextInput style={styles.input} placeholder="Purchase Price (Per Unit)" keyboardType="numeric" value={purchasePrice} onChangeText={setPurchasePrice} />
              <TextInput style={styles.input} placeholder="Current Value (Per Unit)" keyboardType="numeric" value={currentValue} onChangeText={setCurrentValue} />

              <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
                <Text style={styles.saveBtnText}>Save Asset</Text>
              </TouchableOpacity>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  backButton: { padding: 4 },
  headerTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text },
  addButton: { width: 36, height: 36, borderRadius: 18, backgroundColor: '#6366F1', justifyContent: 'center', alignItems: 'center' },
  
  scrollContent: { paddingHorizontal: 20, paddingTop: 10 },
  
  dashboardCard: { backgroundColor: '#1E293B', padding: 24, borderRadius: 24, alignItems: 'center', marginBottom: 20, elevation: 4, shadowColor: '#000', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.1, shadowRadius: 12 },
  dashboardLabel: { fontSize: 13, color: '#94A3B8', fontWeight: '600', marginBottom: 8, textTransform: 'uppercase', letterSpacing: 1 },
  dashboardTotal: { fontSize: 36, fontWeight: '800', color: '#FFF', marginBottom: 16 },
  plPill: { flexDirection: 'row', alignItems: 'center', gap: 6, paddingHorizontal: 12, paddingVertical: 6, borderRadius: 20 },
  plPillText: { fontSize: 14, fontWeight: '700' },

  chartCard: { backgroundColor: '#FFF', padding: 20, borderRadius: 20, marginBottom: 20, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  chartTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 10 },
  legendContainer: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 12, marginTop: 16 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: '600', color: '#64748B' },

  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 12, marginTop: 10 },
  invCard: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', backgroundColor: '#FFF', padding: 16, borderRadius: 16, marginBottom: 12, elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4 },
  invInfo: { flex: 1 },
  invName: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 4 },
  invType: { fontSize: 12, color: '#94A3B8', fontWeight: '600', textTransform: 'uppercase' },
  invValues: { alignItems: 'flex-end' },
  invCurrent: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 4 },
  invProfit: { fontSize: 13, fontWeight: '700' },

  emptyState: { alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  emptyText: { marginTop: 12, fontSize: 15, color: '#94A3B8', fontWeight: '500' },

  modalOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)', justifyContent: 'flex-end' },
  modalContent: { backgroundColor: '#FFF', borderTopLeftRadius: 24, borderTopRightRadius: 24, padding: 24, paddingBottom: 40 },
  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 },
  modalTitle: { fontSize: 20, fontWeight: '800', color: Colors.light.text },
  input: { backgroundColor: '#F8FAFC', borderRadius: 12, padding: 16, fontSize: 16, color: Colors.light.text, marginBottom: 12 },
  
  typeRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginBottom: 12 },
  typeChip: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 20, backgroundColor: '#F1F5F9' },
  typeChipActive: { backgroundColor: '#6366F1' },
  typeText: { fontSize: 13, fontWeight: '600', color: '#64748B' },
  typeTextActive: { color: '#FFF' },

  saveBtn: { backgroundColor: '#6366F1', padding: 16, borderRadius: 12, alignItems: 'center', marginTop: 10 },
  saveBtnText: { fontSize: 16, fontWeight: '700', color: '#FFF' },
});
