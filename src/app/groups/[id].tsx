import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Image, ScrollView, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { db } from '@/db';
import { groups, groupMembers, groupExpenses, groupExpenseParticipants, groupSettlements } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { LinearGradient } from 'expo-linear-gradient';
import { simplifyDebts } from '@/utils/debtSimplification';
import { useStore } from '@/store/useStore';

const { width } = Dimensions.get('window');

export default function GroupScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { expenseCategories } = useStore();

  const [group, setGroup] = React.useState<any>(null);
  const [members, setMembers] = React.useState<any[]>([]);
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [allParticipants, setAllParticipants] = React.useState<any[]>([]);
  const [settlements, setSettlements] = React.useState<any[]>([]);
  const [selectedExpense, setSelectedExpense] = React.useState<any>(null);

  useFocusEffect(
    React.useCallback(() => {
      const fetchData = async () => {
        if (!id) return;
        const gData = await db.select().from(groups).where(eq(groups.id, id));
        setGroup(gData[0]);

        const mData = await db.select().from(groupMembers).where(eq(groupMembers.groupId, id));
        setMembers(mData);

        const eData = await db.select().from(groupExpenses).where(eq(groupExpenses.groupId, id)).orderBy(desc(groupExpenses.date));
        setExpenses(eData);

        const pData = await db.select().from(groupExpenseParticipants);
        setAllParticipants(pData);

        const sData = await db.select().from(groupSettlements).where(eq(groupSettlements.groupId, id));
        setSettlements(sData);
      };
      fetchData();
    }, [id])
  );

  // Calculate balances
  // Net balance = paidShare - owedShare + settlementsPaid - settlementsReceived
  // If positive, they are owed money. If negative, they owe money.
  const balances = React.useMemo(() => {
    if (!members || !allParticipants) return {};
    
    const bals: Record<string, number> = {};
    members.forEach(m => bals[m.id] = 0);
    
    allParticipants.forEach(p => {
      if (bals[p.memberId] !== undefined) {
        bals[p.memberId] += (p.paidShare - p.owedShare);
      }
    });

    settlements.forEach(s => {
      if (bals[s.fromMemberId] !== undefined) bals[s.fromMemberId] += s.amount;
      if (bals[s.toMemberId] !== undefined) bals[s.toMemberId] -= s.amount;
    });
    
    return bals;
  }, [members, allParticipants, settlements]);

  const suggestedRepayments = React.useMemo(() => {
    return simplifyDebts(balances);
  }, [balances]);

  if (!group) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading Group...</Text>
      </SafeAreaView>
    );
  }

  const renderExpense = ({ item }: { item: typeof groupExpenses.$inferSelect }) => {
    const cat = expenseCategories.find(c => c.id === item.categoryId);
    return (
      <TouchableOpacity style={styles.expenseCard} onPress={() => setSelectedExpense(item)}>
        <View style={[styles.expenseIcon, { backgroundColor: (cat?.color || '#0EA5E9') + '15' }]}>
          <Ionicons name={(cat?.icon || 'receipt') as any} size={24} color={cat?.color || '#0EA5E9'} />
        </View>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseDesc}>{item.description || cat?.name || 'Group Expense'}</Text>
          <Text style={styles.expenseDate}>{cat?.name || 'Uncategorized'} • {new Date(item.date).toLocaleDateString()}</Text>
        </View>
        <Text style={styles.expenseAmount}>${item.totalAmount.toFixed(2)}</Text>
      </TouchableOpacity>
    );
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
          <Ionicons name="arrow-back" size={24} color={Colors.light.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{group.name}</Text>
        <View style={{ width: 32 }} /> 
      </View>

      <FlatList
        data={expenses}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View>
            {/* Balances Section */}
            <View style={styles.sectionHeaderWrap}>
              <Text style={styles.sectionTitle}>Group Balances</Text>
              <TouchableOpacity 
                style={[styles.settleUpBtn, expenses.length === 0 && { opacity: 0.5 }]}
                onPress={() => router.push(`/groups/${group.id}/settle-up` as any)}
                disabled={expenses.length === 0}
              >
                <Text style={styles.settleUpBtnText}>Settle Up</Text>
              </TouchableOpacity>
            </View>
            
            <View style={styles.balancesCard}>
              {members?.map(m => {
                const bal = balances[m.id] || 0;
                const isPositive = bal > 0.01;
                const isNegative = bal < -0.01;
                let statusColor: string = Colors.light.textSecondary;
                let statusText = 'Settled up';
                
                if (isPositive) {
                  statusColor = '#10B981'; // Green
                  statusText = `gets back $${bal.toFixed(2)}`;
                } else if (isNegative) {
                  statusColor = '#EF4444'; // Red
                  statusText = `owes $${Math.abs(bal).toFixed(2)}`;
                }

                return (
                  <View key={m.id} style={styles.balanceRow}>
                    <View style={styles.memberAvatar}>
                      <Ionicons name={m.isUser ? "person" : "person-outline"} size={16} color="#6366F1" />
                    </View>
                    <Text style={styles.memberName}>{m.name}</Text>
                    <Text style={[styles.memberBalance, { color: statusColor }]}>{statusText}</Text>
                  </View>
                );
              })}
            </View>

            {suggestedRepayments.length > 0 && (
              <>
                <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Suggested Repayments</Text>
                <View style={styles.balancesCard}>
                  {suggestedRepayments.map((rep, idx) => {
                    const fromMember = members.find(m => m.id === rep.from);
                    const toMember = members.find(m => m.id === rep.to);
                    
                    return (
                      <View key={idx} style={styles.repaymentRow}>
                        <Text style={styles.repaymentText}>
                          <Text style={{ fontWeight: '700' }}>{fromMember?.isUser ? 'You' : fromMember?.name}</Text>
                          {' pays '}
                          <Text style={{ fontWeight: '700' }}>{toMember?.isUser ? 'You' : toMember?.name}</Text>
                        </Text>
                        <Text style={styles.repaymentAmount}>${rep.amount.toFixed(2)}</Text>
                      </View>
                    );
                  })}
                </View>
              </>
            )}

            <Text style={[styles.sectionTitle, { marginTop: 24 }]}>Recent Expenses</Text>
            {expenses?.length === 0 && (
              <Text style={styles.emptyText}>No expenses yet. Add one to get started!</Text>
            )}
          </View>
        )}
        renderItem={renderExpense}
      />

      <TouchableOpacity 
        style={styles.fab} 
        activeOpacity={0.8}
        onPress={() => router.push(`/groups/${group.id}/add-expense` as any)}
      >
        <LinearGradient
          colors={['#6366F1', '#818CF8']}
          style={styles.fabGradient}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}>
          <Ionicons name="add" size={28} color="#FFF" />
        </LinearGradient>
      </TouchableOpacity>

      {/* Expense Details Modal */}
      <Modal
        visible={!!selectedExpense}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setSelectedExpense(null)}
      >
        <SafeAreaView style={{ flex: 1, backgroundColor: '#FFF' }}>
          <View style={styles.modalHeader}>
            <TouchableOpacity onPress={() => setSelectedExpense(null)}>
              <Text style={{ color: '#6366F1', fontSize: 16, fontWeight: '600' }}>Close</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Expense Details</Text>
            <View style={{ width: 40 }} />
          </View>
          
          <ScrollView style={{ flex: 1 }}>
            {selectedExpense && (
              <View style={styles.modalContent}>
                <View style={styles.modalHero}>
                  <Text style={styles.modalHeroTitle}>{selectedExpense.description}</Text>
                  <Text style={styles.modalHeroAmount}>${selectedExpense.totalAmount.toFixed(2)}</Text>
                  <Text style={styles.modalHeroDate}>{new Date(selectedExpense.date).toLocaleDateString()}</Text>
                </View>

                <Text style={styles.modalSectionTitle}>Split Breakdown</Text>
                <View style={styles.breakdownCard}>
                  {members.map(m => {
                    const participation = allParticipants.find(p => p.expenseId === selectedExpense.id && p.memberId === m.id);
                    if (!participation || (participation.paidShare === 0 && participation.owedShare === 0)) return null;

                    return (
                      <View key={m.id} style={styles.breakdownRow}>
                        <Text style={styles.breakdownName}>{m.isUser ? 'Me' : m.name}</Text>
                        <View style={{ alignItems: 'flex-end' }}>
                          {participation.paidShare > 0 && <Text style={styles.breakdownPaid}>Paid: ${participation.paidShare.toFixed(2)}</Text>}
                          {participation.owedShare > 0 && <Text style={styles.breakdownOwed}>{participation.paidShare > 0 ? 'Share:' : 'Owed:'} ${participation.owedShare.toFixed(2)}</Text>}
                        </View>
                      </View>
                    );
                  })}
                </View>

                {selectedExpense.receiptImage && (
                  <View style={{ marginTop: 24 }}>
                    <Text style={styles.modalSectionTitle}>Receipt</Text>
                    <Image 
                      source={{ uri: selectedExpense.receiptImage }} 
                      style={styles.receiptImage} 
                    />
                  </View>
                )}
              </View>
            )}
          </ScrollView>
        </SafeAreaView>
      </Modal>

    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: { 
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', 
    paddingHorizontal: 20, paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F1F5F9',
    backgroundColor: '#FFF'
  },
  backBtn: { padding: 4 },
  headerTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  
  listContent: { padding: 20, paddingBottom: 100 },
  
  sectionHeaderWrap: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 },
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 0 },
  
  settleUpBtn: { backgroundColor: '#10B981', paddingHorizontal: 12, paddingVertical: 6, borderRadius: 16 },
  settleUpBtnText: { color: '#FFF', fontSize: 13, fontWeight: '700' },

  balancesCard: {
    backgroundColor: '#FFF',
    borderRadius: 16,
    padding: 16,
    elevation: 2,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.05,
    shadowRadius: 8,
  },
  balanceRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 8 },
  memberAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center', marginRight: 12 },
  memberName: { flex: 1, fontSize: 15, fontWeight: '600', color: Colors.light.text },
  memberBalance: { fontSize: 14, fontWeight: '600' },
  
  expenseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#FFF',
    padding: 16,
    borderRadius: 16,
    marginBottom: 12,
    elevation: 1,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  expenseIcon: { width: 44, height: 44, borderRadius: 12, backgroundColor: '#E0F2FE', justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  expenseInfo: { flex: 1 },
  expenseDesc: { fontSize: 16, fontWeight: '600', color: Colors.light.text, marginBottom: 4 },
  expenseDate: { fontSize: 13, color: Colors.light.textSecondary },
  expenseAmount: { fontSize: 16, fontWeight: '700', color: Colors.light.text },

  emptyText: { fontSize: 14, color: Colors.light.textSecondary, fontStyle: 'italic', marginTop: 12 },

  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 60,
    height: 60,
    borderRadius: 30,
    elevation: 8,
    shadowColor: '#6366F1',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
  },
  fabGradient: {
    flex: 1,
    borderRadius: 30,
    justifyContent: 'center',
    alignItems: 'center',
  },

  repaymentRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 8, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  repaymentText: { fontSize: 14, color: Colors.light.text },
  repaymentAmount: { fontSize: 14, fontWeight: '700', color: '#6366F1' },

  modalHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: 20, borderBottomWidth: 1, borderBottomColor: '#F1F5F9' },
  modalTitle: { fontSize: 18, fontWeight: '700', color: Colors.light.text },
  modalContent: { padding: 20 },
  modalHero: { alignItems: 'center', marginBottom: 32, padding: 24, backgroundColor: '#F8FAFC', borderRadius: 24 },
  modalHeroTitle: { fontSize: 20, fontWeight: '700', color: Colors.light.text, marginBottom: 8 },
  modalHeroAmount: { fontSize: 36, fontWeight: '800', color: '#6366F1', marginBottom: 4 },
  modalHeroDate: { fontSize: 14, color: Colors.light.textSecondary },
  modalSectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
  
  breakdownCard: { backgroundColor: '#F8FAFC', borderRadius: 16, padding: 16, borderWidth: 1, borderColor: '#F1F5F9' },
  breakdownRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: '#E2E8F0' },
  breakdownName: { fontSize: 15, fontWeight: '600', color: Colors.light.text },
  breakdownPaid: { fontSize: 13, color: '#10B981', fontWeight: '500' },
  breakdownOwed: { fontSize: 13, color: '#EF4444', fontWeight: '500' },

  receiptImage: { width: width - 40, height: (width - 40) * 1.5, borderRadius: 16, resizeMode: 'cover', backgroundColor: '#F1F5F9' },
});
