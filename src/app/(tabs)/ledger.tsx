import React, { useState, useMemo } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, TextInput, SectionList, Platform, Modal
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useStore } from '@/store/useStore';
import { Colors, FontFamily, Shadows, Radius, ScreenPadding } from '@/constants/theme';
import { formatCurrency } from '@/utils/currency';

const TIMEFRAMES = [
  { label: '7 Days', days: 7 },
  { label: '1 Month', days: 30 },
  { label: '3 Months', days: 90 },
  { label: '6 Months', days: 180 },
  { label: '1 Year', days: 365 },
  { label: 'All', days: 0 },
  { label: 'Custom', days: -1 },
];

const TYPE_FILTERS = ['All', 'Expense', 'Income', 'Transfer'];

export default function LedgerScreen() {
  const { transactions, categories, accounts, currency } = useStore();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedTimeframe, setSelectedTimeframe] = useState(1); // 1 Month
  const [selectedType, setSelectedType] = useState('All');
  
  // Custom Date State
  const [customStart, setCustomStart] = useState<Date>(new Date(Date.now() - 30 * 86400000));
  const [customEnd, setCustomEnd] = useState<Date>(new Date());
  const [showStartPicker, setShowStartPicker] = useState(false);
  const [showEndPicker, setShowEndPicker] = useState(false);

  const filteredTxns = useMemo(() => {
    // Pre-process: visually group split group expenses
    const groupedTxns: any[] = [];
    const skipIds = new Set();
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (skipIds.has(t.id)) continue;
      if (t.groupId) {
        const match = transactions.find((x: any) => x.groupId === t.groupId && Math.abs(x.date - t.date) < 2000 && x.id !== t.id);
        if (match) {
          skipIds.add(match.id);
          groupedTxns.push({
            ...t,
            id: `group-${t.groupId}-${t.date}`,
            amount: t.amount + match.amount,
            note: t.note?.replace('My Share: ', '')?.replace('Lent to Group: ', ''),
            type: 'expense',
            isGrouped: true,
          });
          continue;
        }
      }
      groupedTxns.push(t);
    }

    let result = [...groupedTxns];
    const tf = TIMEFRAMES[selectedTimeframe];

    // Timeframe filter
    if (tf.days > 0) {
      const cutoff = Date.now() - tf.days * 86400000;
      result = result.filter((t: any) => t.date >= cutoff);
    } else if (tf.days === -1) {
      // Custom Range
      const start = customStart.setHours(0,0,0,0);
      const end = customEnd.setHours(23,59,59,999);
      result = result.filter((t: any) => t.date >= start && t.date <= end);
    }

    // Type filter
    if (selectedType !== 'All') {
      result = result.filter((t: any) => t.type === selectedType.toLowerCase());
    }

    // Search
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      result = result.filter((t: any) => {
        const cat = categories.find((c: any) => c.id === t.categoryId);
        return (t.note?.toLowerCase().includes(q)) ||
               (cat?.name?.toLowerCase().includes(q)) ||
               (t.amount.toString().includes(q));
      });
    }

    return result;
  }, [transactions, selectedTimeframe, selectedType, searchQuery, categories, customStart, customEnd]);

  // Group by date
  const sections = useMemo(() => {
    const groups: Record<string, any[]> = {};
    filteredTxns.forEach((t: any) => {
      const dateKey = new Date(t.date).toLocaleDateString(undefined, {
        weekday: 'short', year: 'numeric', month: 'short', day: 'numeric',
      });
      if (!groups[dateKey]) groups[dateKey] = [];
      groups[dateKey].push(t);
    });
    return Object.entries(groups).map(([title, data]) => ({
      title,
      data,
      dayTotal: data.reduce((sum, t) => {
        if (t.type === 'expense') return sum - t.amount;
        if (t.type === 'income') return sum + t.amount;
        return sum;
      }, 0),
    }));
  }, [filteredTxns]);

  // Summary
  const summary = useMemo(() => {
    const income = filteredTxns.filter((t: any) => t.type === 'income').reduce((s: number, t: any) => s + t.amount, 0);
    const expense = filteredTxns.filter((t: any) => t.type === 'expense').reduce((s: number, t: any) => s + t.amount, 0);
    return { income, expense, net: income - expense, count: filteredTxns.length };
  }, [filteredTxns]);

  const getCat = (txn: any) => categories.find((c: any) => c.id === txn.categoryId);
  const getAcc = (id: string) => accounts.find((a: any) => a.id === id);

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Records</Text>
        <Ionicons name="funnel-outline" size={24} color={Colors.light.tint} />
      </View>

      {/* Search */}
      <View style={styles.searchContainer}>
        <Ionicons name="search" size={20} color="#94A3B8" />
        <TextInput
          style={styles.searchInput}
          placeholder="Search by note, category, amount..."
          placeholderTextColor="#94A3B8"
          value={searchQuery}
          onChangeText={setSearchQuery}
        />
        {searchQuery ? (
          <TouchableOpacity onPress={() => setSearchQuery('')}>
            <Ionicons name="close-circle" size={20} color="#94A3B8" />
          </TouchableOpacity>
        ) : null}
      </View>

      {/* Timeframe */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {TIMEFRAMES.map((tf, i) => (
            <TouchableOpacity
              key={tf.label}
              style={[styles.tfChip, selectedTimeframe === i && styles.tfChipActive]}
              onPress={() => setSelectedTimeframe(i)}
            >
              <Text style={[styles.tfChipText, selectedTimeframe === i && styles.tfChipTextActive]}>{tf.label}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Type Filter */}
      <View style={styles.filterWrapper}>
        <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.filterScroll} contentContainerStyle={{ paddingHorizontal: 20 }}>
          {TYPE_FILTERS.map(t => (
            <TouchableOpacity
              key={t}
              style={[styles.typeChip, selectedType === t && styles.typeChipActive]}
              onPress={() => setSelectedType(t)}
            >
              <Text style={[styles.typeChipText, selectedType === t && styles.typeChipTextActive]}>{t}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Custom Date Selection UI */}
      {TIMEFRAMES[selectedTimeframe].days === -1 && (
        <View style={styles.customDateRow}>
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowStartPicker(true)}>
            <Text style={styles.dateLabel}>Start</Text>
            <Text style={styles.dateValue}>{customStart.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</Text>
          </TouchableOpacity>
          <Ionicons name="arrow-forward" size={16} color="#94A3B8" />
          <TouchableOpacity style={styles.dateBtn} onPress={() => setShowEndPicker(true)}>
            <Text style={styles.dateLabel}>End</Text>
            <Text style={styles.dateValue}>{customEnd.toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric'})}</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Summary Bar */}
      <View style={styles.summaryBar}>
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Income</Text>
          <Text style={[styles.summaryValue, { color: '#66BB6A' }]}>+{formatCurrency(summary.income, currency.code)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Expense</Text>
          <Text style={[styles.summaryValue, { color: '#EF5350' }]}>-{formatCurrency(summary.expense, currency.code)}</Text>
        </View>
        <View style={styles.summaryDivider} />
        <View style={styles.summaryItem}>
          <Text style={styles.summaryLabel}>Net</Text>
          <Text style={[styles.summaryValue, { color: summary.net >= 0 ? '#66BB6A' : '#EF5350' }]}>
            {formatCurrency(summary.net, currency.code)}
          </Text>
        </View>
      </View>

      {/* Transaction List */}
      <SectionList
        sections={sections}
        keyExtractor={(item) => item.id}
        renderSectionHeader={({ section }) => (
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionDate}>{section.title}</Text>
            <Text style={[styles.sectionTotal, { color: section.dayTotal >= 0 ? '#66BB6A' : '#EF5350' }]}>
              {formatCurrency(section.dayTotal, currency.code)}
            </Text>
          </View>
        )}
        renderItem={({ item: txn }) => {
          const cat = getCat(txn);
          return (
            <View style={styles.txnRow}>
              <View style={[styles.txnIcon, { backgroundColor: (cat?.color || '#94A3B8') + '18' }]}>
                <Ionicons name={(cat?.icon || (txn.type === 'transfer' ? 'swap-horizontal' : 'help-circle')) as any} size={20} color={cat?.color || '#94A3B8'} />
              </View>
              <View style={styles.txnInfo}>
                <Text style={styles.txnName}>{txn.note || cat?.name || txn.type}</Text>
                <Text style={styles.txnSubtext}>
                  {getAcc(txn.accountId)?.name || ''}{txn.type === 'transfer' && txn.toAccountId ? ` → ${getAcc(txn.toAccountId)?.name}` : ''}
                </Text>
              </View>
              <Text style={[styles.txnAmount, { color: txn.type === 'income' ? '#66BB6A' : txn.type === 'transfer' ? '#42A5F5' : '#EF5350' }]}>
                {txn.type === 'income' ? '+' : (txn.type === 'expense' || (txn.type === 'transfer' && !txn.toAccountId)) ? '-' : ''}{formatCurrency(txn.amount, currency.code)}
              </Text>
            </View>
          );
        }}
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Ionicons name="document-text-outline" size={48} color="#CBD5E1" />
            <Text style={styles.emptyText}>No records found</Text>
            <Text style={styles.emptySubtext}>Try adjusting your filters or search</Text>
          </View>
        }
        contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 100 }}
        stickySectionHeadersEnabled={false}
      />

      {/* Date Pickers */}
      {showStartPicker && (
        <DateTimePicker
          value={customStart}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowStartPicker(Platform.OS === 'ios');
            if (date) setCustomStart(date);
          }}
        />
      )}
      {showEndPicker && (
        <DateTimePicker
          value={customEnd}
          mode="date"
          display="default"
          onChange={(event, date) => {
            setShowEndPicker(Platform.OS === 'ios');
            if (date) setCustomEnd(date);
          }}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingHorizontal: ScreenPadding, paddingVertical: 16 },
  headerTitle: { fontSize: 26, fontFamily: FontFamily.extraBold, color: Colors.light.text },

  searchContainer: { flexDirection: 'row', alignItems: 'center', marginHorizontal: ScreenPadding, backgroundColor: Colors.light.card, borderRadius: Radius.md, paddingHorizontal: 14, marginBottom: 14, borderWidth: 1, borderColor: Colors.light.borderLight, ...Shadows.sm },
  searchInput: { flex: 1, paddingVertical: 13, paddingHorizontal: 8, fontSize: 15, fontFamily: FontFamily.medium, color: Colors.light.text },

  filterWrapper: { height: 40, marginBottom: 12 },
  filterScroll: { flex: 1 },
  
  tfChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.light.card, marginRight: 8, borderWidth: 1, borderColor: Colors.light.border, height: 36, justifyContent: 'center' },
  tfChipActive: { backgroundColor: Colors.light.tint, borderColor: Colors.light.tint },
  tfChipText: { fontSize: 13, fontFamily: FontFamily.semiBold, color: Colors.light.textSecondary },
  tfChipTextActive: { color: '#FFF' },

  typeChip: { paddingHorizontal: 16, paddingVertical: 8, borderRadius: Radius.full, backgroundColor: Colors.light.card, marginRight: 8, borderWidth: 1, borderColor: Colors.light.border, height: 36, justifyContent: 'center' },
  typeChipActive: { backgroundColor: Colors.light.text, borderColor: Colors.light.text },
  typeChipText: { fontSize: 13, fontFamily: FontFamily.semiBold, color: Colors.light.textSecondary },
  typeChipTextActive: { color: '#FFF' },

  customDateRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', marginHorizontal: ScreenPadding, marginBottom: 16, backgroundColor: Colors.light.card, padding: 14, borderRadius: Radius.lg, gap: 12, borderWidth: 1, borderColor: Colors.light.borderLight, ...Shadows.sm },
  dateBtn: { flex: 1, backgroundColor: Colors.light.backgroundSubtle, padding: 10, borderRadius: Radius.sm, alignItems: 'center' },
  dateLabel: { fontSize: 11, fontFamily: FontFamily.semiBold, color: Colors.light.textTertiary, marginBottom: 2 },
  dateValue: { fontSize: 14, fontFamily: FontFamily.bold, color: Colors.light.text },

  summaryBar: { flexDirection: 'row', marginHorizontal: ScreenPadding, backgroundColor: Colors.light.card, borderRadius: Radius.lg, padding: 16, marginBottom: 18, borderWidth: 1, borderColor: Colors.light.borderLight, ...Shadows.sm },
  summaryItem: { flex: 1, alignItems: 'center' },
  summaryLabel: { fontSize: 11, fontFamily: FontFamily.semiBold, color: Colors.light.textTertiary, marginBottom: 6 },
  summaryValue: { fontSize: 14, fontFamily: FontFamily.bold },
  summaryDivider: { width: 1, backgroundColor: Colors.light.borderLight },

  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingTop: 18, paddingBottom: 10 },
  sectionDate: { fontSize: 13, fontFamily: FontFamily.semiBold, color: Colors.light.textTertiary },
  sectionTotal: { fontSize: 13, fontFamily: FontFamily.bold },

  txnRow: { flexDirection: 'row', alignItems: 'center', backgroundColor: Colors.light.card, padding: 16, borderRadius: Radius.md, marginBottom: 8, gap: 14, borderWidth: 1, borderColor: Colors.light.borderLight },
  txnIcon: { width: 46, height: 46, borderRadius: Radius.md, justifyContent: 'center', alignItems: 'center' },
  txnInfo: { flex: 1 },
  txnName: { fontSize: 15, fontFamily: FontFamily.semiBold, color: Colors.light.text },
  txnSubtext: { fontSize: 12, fontFamily: FontFamily.medium, color: Colors.light.textTertiary, marginTop: 3 },
  txnAmount: { fontSize: 16, fontFamily: FontFamily.bold },

  emptyState: { alignItems: 'center', paddingVertical: 60 },
  emptyText: { fontSize: 16, fontFamily: FontFamily.semiBold, color: Colors.light.textTertiary, marginTop: 16 },
  emptySubtext: { fontSize: 13, fontFamily: FontFamily.medium, color: '#CBD5E1', marginTop: 6 },
});
