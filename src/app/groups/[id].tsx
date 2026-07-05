import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { db } from '@/db';
import { groups, groupMembers, groupExpenses, groupExpenseParticipants } from '@/db/schema';
import { eq, desc } from 'drizzle-orm';
import { LinearGradient } from 'expo-linear-gradient';

export default function GroupScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();

  const [group, setGroup] = React.useState<any>(null);
  const [members, setMembers] = React.useState<any[]>([]);
  const [expenses, setExpenses] = React.useState<any[]>([]);
  const [allParticipants, setAllParticipants] = React.useState<any[]>([]);

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
      };
      fetchData();
    }, [id])
  );

  // Calculate balances
  // Net balance = paidShare - owedShare
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
    
    return bals;
  }, [members, allParticipants]);

  if (!group) {
    return (
      <SafeAreaView style={styles.safeArea}>
        <Text style={{ textAlign: 'center', marginTop: 20 }}>Loading Group...</Text>
      </SafeAreaView>
    );
  }

  const renderExpense = ({ item }: { item: typeof groupExpenses.$inferSelect }) => (
    <View style={styles.expenseCard}>
      <View style={styles.expenseIcon}>
        <Ionicons name="receipt" size={24} color="#0EA5E9" />
      </View>
      <View style={styles.expenseInfo}>
        <Text style={styles.expenseDesc}>{item.description}</Text>
        <Text style={styles.expenseDate}>{new Date(item.date).toLocaleDateString()}</Text>
      </View>
      <Text style={styles.expenseAmount}>${item.totalAmount.toFixed(2)}</Text>
    </View>
  );

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
            <Text style={styles.sectionTitle}>Group Balances</Text>
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
  
  sectionTitle: { fontSize: 16, fontWeight: '700', color: Colors.light.text, marginBottom: 12 },
  
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
});
