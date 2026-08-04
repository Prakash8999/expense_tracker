import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList, Modal, Image, ScrollView, Dimensions, Share, Alert, TextInput } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { useRouter, useLocalSearchParams, useFocusEffect } from 'expo-router';
import { db } from '@/db';
import { groups, groupMembers, groupExpenses, groupExpenseParticipants, groupSettlements, accounts } from '@/db/schema';
import { addTransaction as addTxn } from '@/db/queries';
import { eq, desc } from 'drizzle-orm';
import { LinearGradient } from 'expo-linear-gradient';
import { simplifyDebts } from '@/utils/debtSimplification';
import { useStore } from '@/store/useStore';
import * as Crypto from 'expo-crypto';

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
  const [activeTab, setActiveTab] = React.useState<'expenses' | 'activity'>('expenses');
  const [isSuggestedExpanded, setIsSuggestedExpanded] = React.useState(true);
  const [isActualExpanded, setIsActualExpanded] = React.useState(false);
  
  const [userAccounts, setUserAccounts] = React.useState<any[]>([]);
  const [isContributeModalVisible, setIsContributeModalVisible] = React.useState(false);
  const [isFundBreakdownModalVisible, setIsFundBreakdownModalVisible] = React.useState(false);
  const [contributeAmountStr, setContributeAmountStr] = React.useState('');
  const [contributePayerId, setContributePayerId] = React.useState<string | null>(null);
  const [contributeAccountId, setContributeAccountId] = React.useState<string | null>(null);

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

        const aData = await db.select().from(accounts);
        setUserAccounts(aData);
      };
      fetchData();
    }, [id])
  );

  React.useEffect(() => {
    if (userAccounts.length > 0 && !contributeAccountId) {
      setContributeAccountId(userAccounts[0].id);
    }
    if (members.length > 0 && !contributePayerId) {
      const me = members.find(m => m.isUser);
      if (me) setContributePayerId(me.id);
    }
  }, [userAccounts, members, isContributeModalVisible]);

  const { humanBalances, fundBalances } = React.useMemo(() => {
    if (!members || !allParticipants) return { humanBalances: {}, fundBalances: {} };
    
    const hBals: Record<string, number> = {};
    const fBals: Record<string, number> = {};
    members.forEach(m => {
      hBals[m.id] = 0;
      fBals[m.id] = 0;
    });

    const fundMember = members.find(m => m.isFund);

    // Track the primary payer for each expense
    const expensePayers: Record<string, string> = {};
    allParticipants.forEach(p => {
       if (p.paidShare > 0) expensePayers[p.expenseId] = p.memberId;
    });

    allParticipants.forEach(p => {
      const payerId = expensePayers[p.expenseId];
      if (fundMember && payerId === fundMember.id) {
        if (fBals[p.memberId] !== undefined) fBals[p.memberId] += (p.paidShare - p.owedShare);
      } else {
        if (hBals[p.memberId] !== undefined) hBals[p.memberId] += (p.paidShare - p.owedShare);
      }
    });

    settlements.forEach(s => {
      if (fundMember && (s.toMemberId === fundMember.id || s.fromMemberId === fundMember.id)) {
        if (fBals[s.fromMemberId] !== undefined) fBals[s.fromMemberId] += s.amount;
        if (fBals[s.toMemberId] !== undefined) fBals[s.toMemberId] -= s.amount;
      } else {
        if (hBals[s.fromMemberId] !== undefined) hBals[s.fromMemberId] += s.amount;
        if (hBals[s.toMemberId] !== undefined) hBals[s.toMemberId] -= s.amount;
      }
    });
    
    return { humanBalances: hBals, fundBalances: fBals };
  }, [members, allParticipants, settlements]);

  const suggestedRepayments = React.useMemo(() => {
    const instructions = simplifyDebts(humanBalances);
    const fundMember = members?.find(m => m.isFund);
    if (!fundMember) return instructions;
    return instructions.filter(i => i.from !== fundMember.id && i.to !== fundMember.id);
  }, [humanBalances, members]);

  const actualRepayments = React.useMemo(() => {
    if (!members || !allParticipants) return [];

    // 1. Combine all events chronologically to find the last fully settled time
    const events: { date: number, type: 'expense' | 'settlement', data: any }[] = [];
    expenses.forEach(e => events.push({ date: e.date, type: 'expense', data: e }));
    settlements.forEach(s => events.push({ date: s.date, type: 'settlement', data: s }));
    events.sort((a, b) => a.date - b.date);

    let lastSettledTime = 0;
    const runningBals: Record<string, number> = {};
    members.forEach(m => runningBals[m.id] = 0);

    events.forEach(ev => {
      if (ev.type === 'expense') {
        const parts = allParticipants.filter(p => p.expenseId === ev.data.id);
        parts.forEach(p => {
          if (runningBals[p.memberId] !== undefined) {
            runningBals[p.memberId] += (p.paidShare - p.owedShare);
          }
        });
      } else if (ev.type === 'settlement') {
        const s = ev.data;
        if (runningBals[s.fromMemberId] !== undefined) runningBals[s.fromMemberId] += s.amount;
        if (runningBals[s.toMemberId] !== undefined) runningBals[s.toMemberId] -= s.amount;
      }

      // Check if settled
      const isSettled = Object.values(runningBals).every(b => Math.abs(b) < 0.01);
      if (isSettled) {
        lastSettledTime = ev.date;
      }
    });

    // 2. Compute pairwise debts ONLY using events after lastSettledTime
    const activeExpenses = expenses.filter(e => e.date > lastSettledTime);
    const activeSettlements = settlements.filter(s => s.date > lastSettledTime);

    const pairwise: Record<string, Record<string, number>> = {};
    members.forEach(m1 => {
      pairwise[m1.id] = {};
      members.forEach(m2 => {
        pairwise[m1.id][m2.id] = 0;
      });
    });

    activeExpenses.forEach(e => {
      const parts = allParticipants.filter(p => p.expenseId === e.id);
      const totalPaid = parts.reduce((sum, p) => sum + p.paidShare, 0);
      if (totalPaid === 0) return;
      
      parts.forEach(ower => {
        if (ower.owedShare > 0) {
          parts.forEach(payer => {
            if (payer.paidShare > 0 && ower.memberId !== payer.memberId) {
              const amountOwedToPayer = ower.owedShare * (payer.paidShare / totalPaid);
              pairwise[ower.memberId][payer.memberId] += amountOwedToPayer;
            }
          });
        }
      });
    });

    activeSettlements.forEach(s => {
      if (pairwise[s.fromMemberId] && pairwise[s.fromMemberId][s.toMemberId] !== undefined) {
        pairwise[s.fromMemberId][s.toMemberId] -= s.amount;
      }
    });

    const instructions: { from: string, to: string, amount: number }[] = [];
    const processed = new Set<string>();
    
    members.forEach(m1 => {
      members.forEach(m2 => {
        if (m1.id === m2.id) return;
        const pairKey = [m1.id, m2.id].sort().join('-');
        if (processed.has(pairKey)) return;
        processed.add(pairKey);

        const m1OwesM2 = pairwise[m1.id][m2.id];
        const m2OwesM1 = pairwise[m2.id][m1.id];
        
        const net = m1OwesM2 - m2OwesM1;
        if (net > 0.01) {
          instructions.push({ from: m1.id, to: m2.id, amount: net });
        } else if (net < -0.01) {
          instructions.push({ from: m2.id, to: m1.id, amount: Math.abs(net) });
        }
      });
    });
    const fundMember = members?.find(m => m.isFund);
    if (fundMember) {
      return instructions.filter(i => i.from !== fundMember.id && i.to !== fundMember.id);
    }
    return instructions;
  }, [members, allParticipants, expenses, settlements]);

  const activityLog = React.useMemo(() => {
    if (!group) return [];
    const logs = [];
    logs.push({ id: 'create', type: 'create', date: group.createdAt, text: 'Group created' });
    
    expenses.forEach(e => {
      logs.push({ id: `exp-${e.id}`, type: 'expense', date: e.date, text: `Added expense: ${e.description}` });
    });

    settlements.forEach(s => {
      const fromName = members.find(m => m.id === s.fromMemberId)?.name || 'Someone';
      const toName = members.find(m => m.id === s.toMemberId)?.name || 'Someone';
      logs.push({ id: `set-${s.id}`, type: 'settlement', date: s.date, text: `${fromName} paid ${toName} $${s.amount.toFixed(2)}` });
    });

    return logs.sort((a, b) => {
      if (b.date !== a.date) return b.date - a.date;
      if (a.type === 'create') return 1;
      if (b.type === 'create') return -1;
      return 0;
    });
  }, [group, expenses, settlements, members]);

  const handleContribute = async () => {
    const amt = parseFloat(contributeAmountStr);
    if (!amt || amt <= 0) return Alert.alert('Error', 'Enter a valid amount.');
    if (!contributePayerId) return Alert.alert('Error', 'Select a contributor.');
    
    const fundMember = members.find(m => m.isFund);
    if (!fundMember) return Alert.alert('Error', 'Group Fund not found.');
    
    const payer = members.find(m => m.id === contributePayerId);
    if (payer?.isUser && !contributeAccountId) {
      return Alert.alert('Error', 'Select a personal account to deduct from.');
    }
    
    const now = Date.now();
    try {
      await db.insert(groupSettlements).values({
        id: Crypto.randomUUID(),
        groupId: id,
        fromMemberId: contributePayerId,
        toMemberId: fundMember.id,
        amount: amt,
        date: now,
      });

      if (payer?.isUser && contributeAccountId) {
        const tripCat = useStore.getState().expenseCategories.find(c => c.name === 'Group Contribution') || 
                        useStore.getState().expenseCategories.find(c => c.name === 'Entertainment');
                        
        await addTxn({
          amount: amt,
          type: 'expense',
          categoryId: tripCat?.id || 'system',
          accountId: contributeAccountId,
          date: now,
          note: `Contributed to Group Fund (${group.name})`,
          groupId: id
        });
      }
      
      // refresh
      const sData = await db.select().from(groupSettlements).where(eq(groupSettlements.groupId, id));
      setSettlements(sData);
      
      await useStore.getState().loadData();
      
      setIsContributeModalVisible(false);
      setContributeAmountStr('');
    } catch (e) {
      Alert.alert('Error', 'Failed to save contribution.');
    }
  };

  const handleShare = async () => {
    if (!group) return;
    try {
      let report = `🏕️ Group Report: ${group.name}\n\n`;
      
      const fundMember = members.find(m => m.isFund);
      if (fundMember) {
        const fundBal = fundBalances[fundMember.id] || 0;
        report += `Group Bank: $${Math.abs(fundBal).toFixed(2)} available\n\n`;
      }

      if (expenses.length > 0) {
        report += `Expense Details:\n`;
        expenses.forEach(e => {
          const parts = allParticipants.filter(p => p.expenseId === e.id);
          const payers = parts.filter(p => p.paidShare > 0);
          const payerNames = payers.map(p => members.find(m => m.id === p.memberId)?.name || 'Someone').join(', ');
          
          const cat = expenseCategories.find(c => c.id === e.categoryId);
          const catName = cat ? cat.name : 'Expense';
          const title = e.description && e.description.toLowerCase() !== 'group expense' 
            ? `${catName} - ${e.description}` 
            : catName;

          report += `- ${title}: $${e.totalAmount.toFixed(2)} (paid by ${payerNames})\n`;
        });
        report += `\n`;
      }

      const totalExp = expenses.reduce((sum, e) => sum + e.totalAmount, 0);
      report += `Total Expenses: $${totalExp.toFixed(2)}\n\n`;
      
      report += `Final Balances:\n`;
      members.filter(m => !m.isFund).forEach(m => {
        const bal = humanBalances[m.id] || 0;
        if (bal > 0.01) report += `- ${m.name}: +$${bal.toFixed(2)} (Gets back)\n`;
        else if (bal < -0.01) report += `- ${m.name}: -$${Math.abs(bal).toFixed(2)} (Owes)\n`;
        else report += `- ${m.name}: Settled up\n`;
      });

      if (suggestedRepayments.length > 0) {
        report += `\nSuggested Repayments:\n`;
        suggestedRepayments.forEach(rep => {
          const fromName = members.find(m => m.id === rep.from)?.name;
          const toName = members.find(m => m.id === rep.to)?.name;
          report += `- ${fromName} pays ${toName} $${rep.amount.toFixed(2)}\n`;
        });
      } else {
        report += `\nAll debts are settled! 🎉\n`;
      }
      
      report += `\nGenerated by Antigravity Expense Tracker`;
      
      await Share.share({ message: report });
    } catch (error) {
      console.error('Error sharing', error);
    }
  };

  const handleArchiveToggle = async () => {
    if (!group) return;
    
    // Validate if archiving
    if (!group.isArchived) {
      const hasDebts = Object.values(humanBalances).some(b => Math.abs(b) > 0.01) || 
                       Object.values(fundBalances).some(b => Math.abs(b) > 0.01);
      if (hasDebts) {
        Alert.alert('Cannot Archive', 'All debts must be settled before archiving this group.');
        return;
      }
    }
    
    try {
      await db.update(groups).set({ isArchived: !group.isArchived }).where(eq(groups.id, group.id));
      setGroup({ ...group, isArchived: !group.isArchived });
      Alert.alert('Success', `Group ${group.isArchived ? 'unarchived' : 'archived'} successfully.`);
    } catch (error) {
      Alert.alert('Error', 'Failed to update group archive status.');
    }
  };

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
        <TouchableOpacity onPress={handleShare} style={styles.backBtn}>
          <Ionicons name="share-outline" size={24} color={Colors.light.text} />
        </TouchableOpacity>
      </View>

      <FlatList
        data={activeTab === 'expenses' ? expenses : activityLog}
        keyExtractor={item => item.id}
        contentContainerStyle={styles.listContent}
        ListHeaderComponent={() => (
          <View>
            {/* Group Bank Section */}
            {members?.find(m => m.isFund) && (() => {
              const fundMember = members.find(m => m.isFund)!;
              const fundBal = fundBalances[fundMember.id] || 0;
              return (
                <LinearGradient
                  colors={['#10B98115', '#05966910']}
                  style={[styles.balancesCard, { marginBottom: 24, borderWidth: 0, shadowColor: '#10B981', shadowOpacity: 0.1, shadowRadius: 10, elevation: 3 }]}
                >
                  <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
                    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12 }}>
                      <View style={[styles.memberAvatar, { backgroundColor: '#10B98120' }]}>
                        <Ionicons name="wallet" size={16} color="#10B981" />
                      </View>
                      <View>
                        <Text style={{ fontSize: 16, fontWeight: '700', color: Colors.light.text }}>Group Bank</Text>
                        <Text style={{ fontSize: 13, color: Colors.light.textSecondary }}>Available Balance</Text>
                      </View>
                    </View>
                    <Text style={{ fontSize: 24, fontWeight: '800', color: '#10B981' }}>
                      ${Math.abs(fundBal).toFixed(2)}
                    </Text>
                  </View>
                  <View style={{ flexDirection: 'row', gap: 12 }}>
                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: '#10B98115', paddingVertical: 10, borderRadius: 20, borderWidth: 1, borderColor: '#10B98130', alignItems: 'center' }}
                      onPress={() => setIsFundBreakdownModalVisible(true)}
                    >
                      <Text style={{ color: '#059669', fontSize: 14, fontWeight: '700' }}>Breakdown</Text>
                    </TouchableOpacity>
                    <TouchableOpacity 
                      style={{ flex: 1, backgroundColor: '#10B981', paddingVertical: 10, borderRadius: 20, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6 }}
                      onPress={() => setIsContributeModalVisible(true)}
                    >
                      <Ionicons name="add" size={16} color="#FFF" />
                      <Text style={{ color: '#FFF', fontSize: 14, fontWeight: '700' }}>Add</Text>
                    </TouchableOpacity>
                  </View>
                </LinearGradient>
              );
            })()}

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
              {members?.filter(m => !m.isFund).map(m => {
                const bal = humanBalances[m.id] || 0;
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
              <View style={{ marginTop: 24 }}>
                <TouchableOpacity 
                  style={styles.sectionHeaderWrap} 
                  onPress={() => setIsSuggestedExpanded(!isSuggestedExpanded)}
                >
                  <Text style={styles.sectionTitle}>Suggested Repayments (Minimal)</Text>
                  <Ionicons name={isSuggestedExpanded ? "chevron-up" : "chevron-down"} size={20} color={Colors.light.textSecondary} />
                </TouchableOpacity>
                {isSuggestedExpanded && (
                  <View style={styles.balancesCard}>
                    {suggestedRepayments.map((rep, idx) => {
                      const fromMember = members.find(m => m.id === rep.from);
                      const toMember = members.find(m => m.id === rep.to);
                      
                      return (
                        <View key={idx} style={styles.repaymentRow}>
                          <Text style={styles.repaymentText}>
                            <Text style={{ fontWeight: '700' }}>{fromMember?.isUser ? 'You' : fromMember?.name}</Text>
                            {' pay '}
                            <Text style={{ fontWeight: '700' }}>{toMember?.isUser ? 'You' : toMember?.name}</Text>
                          </Text>
                          <Text style={styles.repaymentAmount}>${rep.amount.toFixed(2)}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            {actualRepayments.length > 0 && (
              <View style={{ marginTop: 16 }}>
                <TouchableOpacity 
                  style={styles.sectionHeaderWrap} 
                  onPress={() => setIsActualExpanded(!isActualExpanded)}
                >
                  <Text style={styles.sectionTitle}>Actual Repayments (Exact)</Text>
                  <Ionicons name={isActualExpanded ? "chevron-up" : "chevron-down"} size={20} color={Colors.light.textSecondary} />
                </TouchableOpacity>
                {isActualExpanded && (
                  <View style={styles.balancesCard}>
                    {actualRepayments.map((rep, idx) => {
                      const fromMember = members.find(m => m.id === rep.from);
                      const toMember = members.find(m => m.id === rep.to);
                      
                      return (
                        <View key={idx} style={styles.repaymentRow}>
                          <Text style={styles.repaymentText}>
                            <Text style={{ fontWeight: '700' }}>{fromMember?.isUser ? 'You' : fromMember?.name}</Text>
                            {' pay '}
                            <Text style={{ fontWeight: '700' }}>{toMember?.isUser ? 'You' : toMember?.name}</Text>
                          </Text>
                          <Text style={styles.repaymentAmount}>${rep.amount.toFixed(2)}</Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </View>
            )}

            <View style={styles.tabToggle}>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'expenses' && styles.tabBtnActive]}
                onPress={() => setActiveTab('expenses')}
              >
                <Text style={[styles.tabText, activeTab === 'expenses' && styles.tabTextActive]}>Expenses</Text>
              </TouchableOpacity>
              <TouchableOpacity 
                style={[styles.tabBtn, activeTab === 'activity' && styles.tabBtnActive]}
                onPress={() => setActiveTab('activity')}
              >
                <Text style={[styles.tabText, activeTab === 'activity' && styles.tabTextActive]}>Activity Log</Text>
              </TouchableOpacity>
            </View>
            
            {activeTab === 'expenses' && expenses?.length === 0 && (
              <Text style={styles.emptyText}>No expenses yet. Add one to get started!</Text>
            )}
            {activeTab === 'activity' && activityLog?.length === 0 && (
              <Text style={styles.emptyText}>No activity found.</Text>
            )}
          </View>
        )}
        renderItem={({ item }) => {
          if (activeTab === 'expenses') return renderExpense({ item });
          
          let icon = "information-circle";
          let color = "#94A3B8";
          if (item.type === 'expense') { icon = "receipt"; color = "#0EA5E9"; }
          else if (item.type === 'settlement') { icon = "swap-horizontal"; color = "#10B981"; }
          else if (item.type === 'create') { icon = "sparkles"; color = "#6366F1"; }

          return (
            <View style={styles.activityCard}>
              <View style={[styles.activityIcon, { backgroundColor: color + '15' }]}>
                <Ionicons name={icon as any} size={20} color={color} />
              </View>
              <View style={styles.activityInfo}>
                <Text style={styles.activityText}>{item.text}</Text>
                <Text style={styles.activityDate}>{new Date(item.date).toLocaleDateString()} at {new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</Text>
              </View>
            </View>
          );
        }}
        ListFooterComponent={() => activeTab === 'activity' ? (
          <View style={styles.footerSection}>
            <TouchableOpacity 
              style={[styles.archiveBtn, group.isArchived && styles.unarchiveBtn]}
              onPress={handleArchiveToggle}
            >
              <Ionicons name={group.isArchived ? "folder-open-outline" : "archive-outline"} size={20} color={group.isArchived ? "#6366F1" : "#EF4444"} />
              <Text style={[styles.archiveBtnText, group.isArchived && { color: '#6366F1' }]}>
                {group.isArchived ? 'Unarchive Group' : 'Archive Group'}
              </Text>
            </TouchableOpacity>
            <Text style={styles.archiveHelp}>
              {group.isArchived ? 'This group is archived.' : 'If the group trip is over you can archive it, but all balances must be settled first.'}
            </Text>
          </View>
        ) : <View style={{ height: 100 }} />}
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
                  {(() => {
                    const fundMember = members.find(m => m.isFund);
                    const isFundExpense = fundMember && allParticipants.some(p => p.expenseId === selectedExpense.id && p.memberId === fundMember.id && p.paidShare > 0);
                    
                    return members.map(m => {
                      const participation = allParticipants.find(p => p.expenseId === selectedExpense.id && p.memberId === m.id);
                      if (!participation || (participation.paidShare === 0 && participation.owedShare === 0)) return null;

                      // Ghost Fund approach: completely hide the internal splits for human members if paid by the fund.
                      if (isFundExpense && !m.isFund) return null;

                      let label = participation.paidShare > 0 ? 'Share:' : 'Owed:';

                      return (
                        <View key={m.id} style={styles.breakdownRow}>
                          <Text style={styles.breakdownName}>{m.isUser ? 'Me' : m.name}</Text>
                          <View style={{ alignItems: 'flex-end' }}>
                            {participation.paidShare > 0 && <Text style={styles.breakdownPaid}>Paid: ${participation.paidShare.toFixed(2)}</Text>}
                            {participation.owedShare > 0 && <Text style={styles.breakdownOwed}>{label} ${participation.owedShare.toFixed(2)}</Text>}
                          </View>
                        </View>
                      );
                    });
                  })()}
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

      {/* Contribute to Fund Modal */}
      <Modal visible={isContributeModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsContributeModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Contribute to Fund</Text>
            <TouchableOpacity onPress={() => setIsContributeModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={[styles.expenseIcon, { backgroundColor: '#10B98115', width: 64, height: 64, borderRadius: 32, marginBottom: 16 }]}>
                <Ionicons name="wallet" size={32} color="#10B981" />
              </View>
              <Text style={{ fontSize: 16, color: Colors.light.textSecondary, marginBottom: 8 }}>Amount to Add</Text>
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Text style={{ fontSize: 32, fontWeight: '700', color: Colors.light.text }}>$</Text>
                <TextInput
                  style={{ fontSize: 48, fontWeight: '800', color: Colors.light.text, minWidth: 100 }}
                  placeholder="0.00"
                  keyboardType="numeric"
                  value={contributeAmountStr}
                  onChangeText={setContributeAmountStr}
                  autoFocus
                />
              </View>
            </View>

            <Text style={styles.modalSectionTitle}>Who is contributing?</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={{ marginBottom: 24 }}>
              {members.filter(m => !m.isFund).map(m => (
                <TouchableOpacity
                  key={m.id}
                  style={[styles.memberChip, contributePayerId === m.id && styles.memberChipActive]}
                  onPress={() => setContributePayerId(m.id)}
                >
                  <Ionicons name="person" size={16} color={contributePayerId === m.id ? '#FFF' : Colors.light.textSecondary} />
                  <Text style={[styles.memberChipText, contributePayerId === m.id && styles.memberChipTextActive]}>
                    {m.isUser ? 'Me' : m.name}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {members.find(m => m.id === contributePayerId)?.isUser && (
              <View style={{ marginBottom: 24 }}>
                <Text style={styles.modalSectionTitle}>Pay from (Personal Account)</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  {userAccounts.map(acc => (
                    <TouchableOpacity
                      key={acc.id}
                      style={[styles.memberChip, contributeAccountId === acc.id && styles.memberChipActive]}
                      onPress={() => setContributeAccountId(acc.id)}
                    >
                      <Ionicons name={acc.icon as any} size={16} color={contributeAccountId === acc.id ? '#FFF' : acc.color} />
                      <Text style={[styles.memberChipText, contributeAccountId === acc.id && styles.memberChipTextActive]}>
                        {acc.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </ScrollView>
              </View>
            )}

            <TouchableOpacity 
              style={[styles.saveBtn, { backgroundColor: '#10B981', paddingVertical: 16, alignItems: 'center', marginTop: 16 }]}
              onPress={handleContribute}
            >
              <Text style={[styles.saveBtnText, { color: '#FFF', fontSize: 16 }]}>Add to Group Bank</Text>
            </TouchableOpacity>
          </ScrollView>
        </SafeAreaView>
      </Modal>

      {/* Fund Breakdown Modal */}
      <Modal visible={isFundBreakdownModalVisible} animationType="slide" presentationStyle="pageSheet" onRequestClose={() => setIsFundBreakdownModalVisible(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: Colors.light.background }}>
          <View style={styles.modalHeader}>
            <Text style={styles.modalTitle}>Fund Breakdown</Text>
            <TouchableOpacity onPress={() => setIsFundBreakdownModalVisible(false)}>
              <Ionicons name="close" size={24} color={Colors.light.textSecondary} />
            </TouchableOpacity>
          </View>
          <ScrollView style={styles.modalContent}>
            <View style={{ alignItems: 'center', marginBottom: 32 }}>
              <View style={[styles.expenseIcon, { backgroundColor: '#10B98115', width: 64, height: 64, borderRadius: 32, marginBottom: 16 }]}>
                <Ionicons name="wallet" size={32} color="#10B981" />
              </View>
              <Text style={{ fontSize: 16, color: Colors.light.textSecondary, marginBottom: 8 }}>Available Balance</Text>
              <Text style={{ fontSize: 36, fontWeight: '800', color: '#10B981' }}>
                ${Math.abs(fundBalances[members?.find(m => m.isFund)?.id || ''] || 0).toFixed(2)}
              </Text>
            </View>

            <Text style={styles.modalSectionTitle}>Distributions</Text>
            <View style={styles.breakdownCard}>
              {members?.filter(m => !m.isFund).map(m => {
                const bal = fundBalances[m.id] || 0;
                if (Math.abs(bal) < 0.01) return null;
                const getsBack = bal > 0;
                return (
                  <View key={m.id} style={styles.breakdownRow}>
                    <Text style={styles.breakdownName}>{m.isUser ? 'Me' : m.name}</Text>
                    <View style={{ alignItems: 'flex-end' }}>
                      <Text style={[getsBack ? styles.breakdownPaid : styles.breakdownOwed, { fontSize: 15 }]}>
                        {getsBack ? 'Gets back' : 'Owes fund'}: ${Math.abs(bal).toFixed(2)}
                      </Text>
                    </View>
                  </View>
                );
              })}
            </View>
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
  
  tabToggle: { flexDirection: 'row', backgroundColor: '#F1F5F9', borderRadius: 12, padding: 4, marginTop: 24, marginBottom: 16 },
  tabBtn: { flex: 1, paddingVertical: 8, alignItems: 'center', borderRadius: 10 },
  tabBtnActive: { backgroundColor: '#FFF', elevation: 2, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.1, shadowRadius: 2 },
  tabText: { fontSize: 14, fontWeight: '600', color: '#64748B' },
  tabTextActive: { color: Colors.light.text },

  activityCard: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, borderBottomWidth: 1, borderBottomColor: '#F8FAFC' },
  activityIcon: { width: 40, height: 40, borderRadius: 12, justifyContent: 'center', alignItems: 'center', marginRight: 14 },
  activityInfo: { flex: 1 },
  activityText: { fontSize: 14, fontWeight: '600', color: Colors.light.text, marginBottom: 2 },
  activityDate: { fontSize: 12, color: Colors.light.textSecondary },

  footerSection: { marginTop: 32, marginBottom: 20, alignItems: 'center', paddingHorizontal: 20 },
  archiveBtn: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: 12, paddingHorizontal: 24, borderRadius: 16, backgroundColor: '#FEF2F2', width: '100%', marginBottom: 12 },
  unarchiveBtn: { backgroundColor: '#EEF2FF' },
  archiveBtnText: { marginLeft: 8, fontSize: 15, fontWeight: '700', color: '#EF4444' },
  archiveHelp: { fontSize: 12, color: '#94A3B8', textAlign: 'center', paddingHorizontal: 20 },
  
  memberChip: { flexDirection: 'row', alignItems: 'center', backgroundColor: '#F8FAFC', borderWidth: 1, borderColor: '#E2E8F0', paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20, marginRight: 12 },
  memberChipActive: { backgroundColor: '#10B981', borderColor: '#10B981' },
  memberChipText: { fontSize: 15, fontWeight: '600', color: Colors.light.text, marginLeft: 8 },
  memberChipTextActive: { color: '#FFF' },
  
  saveBtn: { backgroundColor: '#6366F1', paddingVertical: 14, borderRadius: 16, alignItems: 'center', marginTop: 24, marginHorizontal: 20 },
  saveBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
});
