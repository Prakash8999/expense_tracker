import {
  Colors,
  FontFamily,
  Radius,
  ScreenPadding,
  Shadows,
  TypeScale,
} from "@/constants/theme";
import { db } from "@/db";
import { categories as dbCategories } from "@/db/schema";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { eq } from "drizzle-orm";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import React, { useEffect, useMemo } from "react";
import {
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { SetupModal } from "@/components/SetupModal";

const { width } = Dimensions.get("window");
const CARD_WIDTH = width - 40;

export default function DashboardScreen() {
  const {
    accounts,
    transactions,
    currency,
    isLoading,
    loadData,
    categories,
    plannedPayments,
    debts,
    goals,
    budgets,
  } = useStore();

  useEffect(() => {
    // try {
    //   db.run(
    //     sql`ALTER TABLE group_members ADD COLUMN is_fund INTEGER DEFAULT 0`,
    //   );
    // } catch (e) {
    //   console.log("Column is_fund already exists or error:", e);
    // }

    // Patch the icon in the database for users who already seeded
    try {
      db.update(dbCategories)
        .set({ icon: "map" })
        .where(eq(dbCategories.name, "Trips & Travel"))
        .run();
    } catch (e) {
      console.log("Failed to update category icon:", e);
    }

    loadData();
  }, []);

  const totalBalance = useMemo(
    () => accounts.reduce((sum: number, a: any) => sum + a.balance, 0),
    [accounts],
  );

  // Current month stats
  const monthStats = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();
    const monthTxns = transactions.filter((t: any) => t.date >= startOfMonth);
    const income = monthTxns
      .filter((t: any) => t.type === "income")
      .reduce((s: number, t: any) => s + t.amount, 0);
    const expense = monthTxns
      .filter((t: any) => t.type === "expense")
      .reduce((s: number, t: any) => s + t.amount, 0);
    return { income, expense };
  }, [transactions]);

  // Category spending breakdown for current month
  const categorySpending = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
    ).getTime();
    const monthExpenses = transactions.filter(
      (t: any) => t.type === "expense" && t.date >= startOfMonth,
    );
    const map: Record<string, number> = {};
    monthExpenses.forEach((t: any) => {
      if (t.categoryId) {
        map[t.categoryId] = (map[t.categoryId] || 0) + t.amount;
      }
    });
    return Object.entries(map)
      .map(([catId, amount]) => {
        const cat = categories.find((c: any) => c.id === catId);
        return {
          catId,
          amount,
          name: cat?.name || "Other",
          icon: cat?.icon || "help",
          color: cat?.color || "#94A3B8",
        };
      })
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 5);
  }, [transactions, categories]);

  // 1. Daily Budgets
  const dailyBudgets = useMemo(() => {
    const now = new Date();
    return budgets
      .filter((b: any) => b.period === "daily")
      .map((b: any) => {
        const cat = categories.find((c: any) => c.id === b.categoryId);
        const startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        ).getTime();
        const spent = transactions
          .filter(
            (t: any) =>
              t.type === "expense" &&
              t.date >= startDate &&
              (!b.categoryId || t.categoryId === b.categoryId),
          )
          .reduce((s: number, t: any) => s + t.amount, 0);
        const pct = Math.min((spent / b.amount) * 100, 100);
        return { ...b, cat, spent, pct };
      });
  }, [budgets, transactions, categories]);

  // 3. Upcoming Bills
  const upcomingBills = useMemo(() => {
    const now = Date.now();
    return [...plannedPayments]
      .filter((p) => p.nextDueDate >= now)
      .sort((a, b) => a.nextDueDate - b.nextDueDate)
      .slice(0, 5);
  }, [plannedPayments]);

  // 4. Active Goal Mini Tracker
  const activeGoal = useMemo(() => {
    if (goals.length === 0) return null;
    return [...goals].sort((a, b) => {
      const aDone = a.currentAmount >= a.targetAmount;
      const bDone = b.currentAmount >= b.targetAmount;
      if (aDone && !bDone) return 1;
      if (!aDone && bDone) return -1;
      return (a.targetDate || Infinity) - (b.targetDate || Infinity);
    })[0];
  }, [goals]);

  // 5. Debt Overview
  const debtStats = useMemo(() => {
    let toCollect = 0;
    let toPay = 0;
    debts.forEach((d) => {
      if (!d.isSettled) {
        if (d.type === "lent") toCollect += d.remainingAmount;
        else toPay += d.remainingAmount;
      }
    });
    return { toCollect, toPay };
  }, [debts]);

  const displayTxns = useMemo(() => {
    const grouped: any[] = [];
    const skipIds = new Set();
    for (let i = 0; i < transactions.length; i++) {
      const t = transactions[i];
      if (skipIds.has(t.id)) continue;
      if (t.groupId) {
        const match = transactions.find(
          (x: any) =>
            x.groupId === t.groupId &&
            Math.abs(x.date - t.date) < 2000 &&
            x.id !== t.id,
        );
        if (match) {
          skipIds.add(match.id);
          grouped.push({
            ...t,
            id: `group-${t.groupId}-${t.date}`,
            amount: t.amount + match.amount,
            note: t.note
              ?.replace("My Share: ", "")
              ?.replace("Lent to Group: ", ""),
            type: "expense",
            isGrouped: true,
          });
          continue;
        }
      }
      grouped.push(t);
    }
    return grouped.slice(0, 10);
  }, [transactions]);

  const getCategoryForTxn = (txn: any) => {
    if (!txn.categoryId) return null;
    return categories.find((c: any) => c.id === txn.categoryId);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <ScrollView style={styles.container} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <View style={styles.headerRow}>
          <View>
            <Text style={styles.greeting}>Good {getTimeGreeting()} 👋</Text>
            <Text style={styles.headerSubtitle}>Your financial overview</Text>
          </View>
          <TouchableOpacity style={styles.notifBtn}>
            <Ionicons
              name="notifications-outline"
              size={24}
              color={Colors.light.text}
            />
          </TouchableOpacity>
        </View>

        {/* Total Balance Card */}
        <LinearGradient
          colors={["#6366F1", "#7C3AED", "#6366F1"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.balanceCard}
        >
          <View style={styles.balanceCardInner}>
            <Text style={styles.balanceLabel}>Total Balance</Text>
            <Text style={styles.balanceAmount}>
              {formatCurrency(totalBalance, currency.code)}
            </Text>

            <View style={styles.incExpRow}>
              <View style={styles.incExpItem}>
                <View
                  style={[
                    styles.incExpIcon,
                    { backgroundColor: "rgba(255,255,255,0.15)" },
                  ]}
                >
                  <Ionicons name="arrow-down" size={16} color="#86EFAC" />
                </View>
                <View>
                  <Text style={styles.incExpLabel}>Income</Text>
                  <Text style={[styles.incExpAmount, { color: "#86EFAC" }]}>
                    {formatCurrency(monthStats.income, currency.code)}
                  </Text>
                </View>
              </View>
              <View style={styles.incExpDivider} />
              <View style={styles.incExpItem}>
                <View
                  style={[
                    styles.incExpIcon,
                    { backgroundColor: "rgba(255,255,255,0.15)" },
                  ]}
                >
                  <Ionicons name="arrow-up" size={16} color="#FCA5A5" />
                </View>
                <View>
                  <Text style={styles.incExpLabel}>Expense</Text>
                  <Text style={[styles.incExpAmount, { color: "#FCA5A5" }]}>
                    {formatCurrency(monthStats.expense, currency.code)}
                  </Text>
                </View>
              </View>
            </View>
          </View>
        </LinearGradient>

        {/* Quick Actions */}
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push("/add-transaction?type=expense")}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: "#FFF0F0" }]}
            >
              <Ionicons name="remove-circle" size={24} color="#EF5350" />
            </View>
            <Text style={styles.quickActionText}>Expense</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push("/add-transaction?type=income")}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: "#F0FFF4" }]}
            >
              <Ionicons name="add-circle" size={24} color="#66BB6A" />
            </View>
            <Text style={styles.quickActionText}>Income</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push("/add-transaction?type=transfer")}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: "#F0F4FF" }]}
            >
              <Ionicons name="swap-horizontal" size={24} color="#42A5F5" />
            </View>
            <Text style={styles.quickActionText}>Transfer</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => router.push("/add-account")}
          >
            <View
              style={[styles.quickActionIcon, { backgroundColor: "#F5F0FF" }]}
            >
              <Ionicons name="wallet" size={24} color="#7E57C2" />
            </View>
            <Text style={styles.quickActionText}>Account</Text>
          </TouchableOpacity>
        </View>

        {/* Accounts */}
        {accounts.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>My Accounts</Text>
              <TouchableOpacity onPress={() => router.push("/add-account")}>
                <Ionicons name="add" size={22} color={Colors.light.tint} />
              </TouchableOpacity>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.accountScroll}
            >
              {accounts.map((acc: any) => (
                <View
                  key={acc.id}
                  style={[styles.accountCard, { borderLeftColor: acc.color }]}
                >
                  <View style={styles.accountCardTop}>
                    <Ionicons
                      name={acc.icon as any}
                      size={20}
                      color={acc.color}
                    />
                    <Text style={styles.accountType}>
                      {acc.type.toUpperCase()}
                    </Text>
                  </View>
                  <Text style={styles.accountName}>{acc.name}</Text>
                  <Text style={styles.accountBalance}>
                    {formatCurrency(acc.balance, currency.code)}
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 1. Daily Budgets */}
        {dailyBudgets.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Daily Budget</Text>
            </View>
            {dailyBudgets.map((b: any) => (
              <View key={b.id} style={styles.budgetCard}>
                <View style={styles.budgetHeader}>
                  <View style={styles.budgetLeft}>
                    <View
                      style={[
                        styles.budgetIcon,
                        {
                          backgroundColor:
                            (b.cat?.color || Colors.light.tint) + "20",
                        },
                      ]}
                    >
                      <Ionicons
                        name={(b.cat?.icon || "pie-chart") as any}
                        size={16}
                        color={b.cat?.color || Colors.light.tint}
                      />
                    </View>
                    <View>
                      <Text style={styles.budgetName}>
                        {b.cat?.name || "Daily Budget"}
                      </Text>
                      <Text style={styles.budgetPeriod}>Daily</Text>
                    </View>
                  </View>
                  <View style={styles.budgetRight}>
                    <Text style={styles.budgetSpent}>
                      {formatCurrency(b.spent, currency.code)}
                    </Text>
                    <Text style={styles.budgetLimit}>
                      of {formatCurrency(b.amount, currency.code)}
                    </Text>
                  </View>
                </View>
                <View style={styles.barBg}>
                  <View
                    style={[
                      styles.barFill,
                      {
                        width: `${b.pct}%`,
                        backgroundColor:
                          b.pct >= 90
                            ? "#EF5350"
                            : b.pct >= 70
                              ? "#FFA726"
                              : "#66BB6A",
                      },
                    ]}
                  />
                </View>
                <Text
                  style={[
                    styles.budgetRemaining,
                    { color: b.pct >= 90 ? "#EF5350" : "#66BB6A" },
                  ]}
                >
                  {b.pct >= 100
                    ? "Over budget!"
                    : `${formatCurrency(b.amount - b.spent, currency.code)} remaining`}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* 2. Upcoming Bills */}
        {upcomingBills.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Upcoming Bills</Text>
            </View>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.billsScroll}
            >
              {upcomingBills.map((bill) => (
                <View key={bill.id} style={styles.billCard}>
                  <View style={styles.billIcon}>
                    <Ionicons
                      name="calendar-outline"
                      size={20}
                      color="#7E57C2"
                    />
                  </View>
                  <Text style={styles.billName} numberOfLines={1}>
                    {bill.name}
                  </Text>
                  <Text style={styles.billAmount}>
                    {formatCurrency(bill.amount, currency.code)}
                  </Text>
                  <Text style={styles.billDue}>
                    Due in{" "}
                    {Math.ceil((bill.nextDueDate - Date.now()) / 86400000)}d
                  </Text>
                </View>
              ))}
            </ScrollView>
          </View>
        )}

        {/* 4. Active Goal */}
        {activeGoal && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Goal Progress</Text>
            </View>
            <TouchableOpacity
              style={styles.activeGoalCard}
              onPress={() =>
                router.push(`/goal-details/${activeGoal.id}` as any)
              }
              activeOpacity={0.8}
            >
              <View
                style={[
                  styles.goalIconMini,
                  { backgroundColor: activeGoal.color + "20" },
                ]}
              >
                <Ionicons
                  name={activeGoal.icon as any}
                  size={20}
                  color={activeGoal.color}
                />
              </View>
              <View style={{ flex: 1, paddingRight: 10 }}>
                <Text style={styles.activeGoalName}>{activeGoal.name}</Text>
                <View style={styles.goalMiniBarBg}>
                  <View
                    style={[
                      styles.goalMiniBarFill,
                      {
                        width: `${Math.min(100, (activeGoal.currentAmount / activeGoal.targetAmount) * 100)}%`,
                        backgroundColor: activeGoal.color,
                      },
                    ]}
                  />
                </View>
              </View>
              <Text style={styles.activeGoalPct}>
                {Math.min(
                  100,
                  (activeGoal.currentAmount / activeGoal.targetAmount) * 100,
                ).toFixed(0)}
                %
              </Text>
            </TouchableOpacity>
          </View>
        )}

        {/* 5. Debt Overview */}
        {(debtStats.toCollect > 0 || debtStats.toPay > 0) && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Debts & Loans</Text>
            </View>
            <View style={styles.debtRow}>
              <View style={[styles.debtBox, { backgroundColor: "#F0FFF4" }]}>
                <Text style={styles.debtBoxLabel}>To Collect</Text>
                <Text style={[styles.debtBoxAmount, { color: "#66BB6A" }]}>
                  {formatCurrency(debtStats.toCollect, currency.code)}
                </Text>
              </View>
              <View style={[styles.debtBox, { backgroundColor: "#FFF0F0" }]}>
                <Text style={styles.debtBoxLabel}>To Pay</Text>
                <Text style={[styles.debtBoxAmount, { color: "#EF5350" }]}>
                  {formatCurrency(debtStats.toPay, currency.code)}
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Spending by Category */}
        {categorySpending.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <Text style={styles.sectionTitle}>Top Spending This Month</Text>
            </View>
            {categorySpending.map((cs, i) => {
              const maxAmount = categorySpending[0]?.amount || 1;
              const barWidth = (cs.amount / maxAmount) * 100;
              return (
                <View key={cs.catId} style={styles.catSpendRow}>
                  <View
                    style={[
                      styles.catSpendIcon,
                      { backgroundColor: cs.color + "20" },
                    ]}
                  >
                    <Ionicons
                      name={cs.icon as any}
                      size={18}
                      color={cs.color}
                    />
                  </View>
                  <View style={styles.catSpendInfo}>
                    <View style={styles.catSpendTextRow}>
                      <Text style={styles.catSpendName}>{cs.name}</Text>
                      <Text style={styles.catSpendAmount}>
                        {formatCurrency(cs.amount, currency.code)}
                      </Text>
                    </View>
                    <View style={styles.catSpendBarBg}>
                      <View
                        style={[
                          styles.catSpendBar,
                          { width: `${barWidth}%`, backgroundColor: cs.color },
                        ]}
                      />
                    </View>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent Transactions */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Recent Transactions</Text>
            <TouchableOpacity onPress={() => router.push("/(tabs)/ledger")}>
              <Text style={styles.seeAll}>See All</Text>
            </TouchableOpacity>
          </View>
          {displayTxns.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="receipt-outline" size={48} color="#CBD5E1" />
              <Text style={styles.emptyText}>No transactions yet</Text>
              <Text style={styles.emptySubtext}>
                Tap the + button to add your first transaction
              </Text>
            </View>
          ) : (
            displayTxns.map((txn: any) => {
              const cat = getCategoryForTxn(txn);
              return (
                <View key={txn.id} style={styles.txnRow}>
                  <View
                    style={[
                      styles.txnIcon,
                      { backgroundColor: (cat?.color || "#94A3B8") + "18" },
                    ]}
                  >
                    <Ionicons
                      name={(cat?.icon || "help-circle") as any}
                      size={20}
                      color={cat?.color || "#94A3B8"}
                    />
                  </View>
                  <View style={styles.txnInfo}>
                    <Text style={styles.txnName}>
                      {txn.note ||
                        cat?.name ||
                        (txn.type === "transfer"
                          ? "Transfer"
                          : txn.type === "income"
                            ? "Income"
                            : "Expense")}
                    </Text>
                    <Text style={styles.txnDate}>
                      {new Date(txn.date).toLocaleDateString(undefined, {
                        month: "short",
                        day: "numeric",
                      })}
                    </Text>
                  </View>
                  <Text
                    style={[
                      styles.txnAmount,
                      {
                        color:
                          txn.type === "income"
                            ? "#66BB6A"
                            : txn.type === "transfer"
                              ? "#42A5F5"
                              : "#EF5350",
                      },
                    ]}
                  >
                    {txn.type === "income"
                      ? "+"
                      : txn.type === "expense" ||
                          (txn.type === "transfer" && !txn.toAccountId)
                        ? "-"
                        : ""}
                    {formatCurrency(txn.amount, currency.code)}
                  </Text>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 60 }} />
      </ScrollView>

      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push("/add-transaction")}
      >
        <Ionicons name="add" size={28} color="#FFF" />
      </TouchableOpacity>

      <SetupModal />
    </SafeAreaView>
  );
}

function getTimeGreeting() {
  const h = new Date().getHours();
  if (h < 12) return "Morning";
  if (h < 17) return "Afternoon";
  return "Evening";
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  container: { flex: 1 },
  headerRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: ScreenPadding,
    paddingTop: 10,
    paddingBottom: 20,
  },
  greeting: { ...TypeScale.title, color: Colors.light.text },
  headerSubtitle: {
    fontSize: 14,
    fontFamily: FontFamily.medium,
    color: Colors.light.textSecondary,
    marginTop: 4,
  },
  notifBtn: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    backgroundColor: Colors.light.card,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    ...Shadows.sm,
  },

  balanceCard: {
    marginHorizontal: ScreenPadding,
    borderRadius: Radius.xl,
    overflow: "hidden",
    marginBottom: 24,
    ...Shadows.tint,
  },
  balanceCardInner: { padding: 28 },
  balanceLabel: {
    color: "rgba(255,255,255,0.65)",
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  balanceAmount: {
    color: "#FFF",
    ...TypeScale.heroNumber,
    marginTop: 6,
    marginBottom: 24,
    letterSpacing: -0.5,
  },
  incExpRow: { flexDirection: "row", alignItems: "center" },
  incExpItem: { flexDirection: "row", alignItems: "center", flex: 1, gap: 10 },
  incExpIcon: {
    width: 38,
    height: 38,
    borderRadius: 19,
    justifyContent: "center",
    alignItems: "center",
  },
  incExpLabel: {
    color: "rgba(255,255,255,0.55)",
    fontSize: 12,
    fontFamily: FontFamily.medium,
  },
  incExpAmount: { fontSize: 16, fontFamily: FontFamily.bold },
  incExpDivider: {
    width: 1,
    height: 36,
    backgroundColor: "rgba(255,255,255,0.12)",
    marginHorizontal: 14,
  },

  quickActions: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: ScreenPadding,
    marginBottom: 28,
  },
  quickAction: { alignItems: "center", gap: 8 },
  quickActionIcon: {
    width: 56,
    height: 56,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  quickActionText: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Colors.light.textSecondary,
  },

  section: { paddingHorizontal: ScreenPadding, marginBottom: 15 },
  sectionHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 17,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
    letterSpacing: -0.2,
  },
  seeAll: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: Colors.light.tint,
  },

  accountScroll: { marginBottom: 4 },
  accountCard: {
    width: 165,
    backgroundColor: Colors.light.card,
    borderRadius: Radius.lg,
    padding: 18,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    ...Shadows.sm,
  },
  accountCardTop: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 14,
  },
  accountType: {
    ...TypeScale.overline,
    color: Colors.light.textTertiary,
  },
  accountName: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: Colors.light.textSecondary,
    marginBottom: 4,
  },
  accountBalance: {
    fontSize: 18,
    fontFamily: FontFamily.extraBold,
    color: Colors.light.text,
  },

  catSpendRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 16,
    gap: 14,
  },
  catSpendIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
  },
  catSpendInfo: { flex: 1 },
  catSpendTextRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 8,
  },
  catSpendName: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: Colors.light.text,
  },
  catSpendAmount: {
    fontSize: 14,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  catSpendBarBg: {
    height: 5,
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 3,
  },
  catSpendBar: { height: 5, borderRadius: 3 },

  txnRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 10,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.borderLight,
  },
  txnIcon: {
    width: 46,
    height: 46,
    borderRadius: Radius.md,
    justifyContent: "center",
    alignItems: "center",
  },
  txnInfo: { flex: 1 },
  txnName: {
    fontSize: 15,
    fontFamily: FontFamily.semiBold,
    color: Colors.light.text,
  },
  txnDate: {
    fontSize: 12,
    fontFamily: FontFamily.medium,
    color: Colors.light.textTertiary,
    marginTop: 3,
  },
  txnAmount: { fontSize: 16, fontFamily: FontFamily.bold },

  emptyState: { alignItems: "center", paddingVertical: 48 },
  emptyText: {
    fontSize: 16,
    fontFamily: FontFamily.semiBold,
    color: Colors.light.textTertiary,
    marginTop: 16,
  },
  emptySubtext: {
    fontSize: 13,
    fontFamily: FontFamily.medium,
    color: "#CBD5E1",
    marginTop: 6,
  },

  fab: {
    position: "absolute",
    bottom: 24,
    right: 24,
    width: 58,
    height: 58,
    borderRadius: 20,
    backgroundColor: Colors.light.tint,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.tint,
  },

  // Widgets
  budgetCard: {
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 14,
    marginBottom: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  budgetHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 10,
  },
  budgetLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
  budgetIcon: {
    width: 32,
    height: 32,
    borderRadius: 10,
    justifyContent: "center",
    alignItems: "center",
  },
  budgetName: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: Colors.light.text,
  },
  budgetPeriod: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: "#94A3B8",
    marginTop: 2,
  },
  budgetRight: { alignItems: "flex-end" },
  budgetSpent: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
  },
  budgetLimit: {
    fontSize: 11,
    fontFamily: FontFamily.regular,
    color: "#94A3B8",
  },
  barBg: {
    height: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 3,
    marginBottom: 6,
  },
  barFill: { height: 6, borderRadius: 3 },
  budgetRemaining: { fontSize: 12, fontFamily: FontFamily.semiBold },

  billsScroll: { paddingTop: 4, paddingBottom: 12 },
  billCard: {
    width: 150,
    backgroundColor: Colors.light.card,
    padding: 18,
    borderRadius: Radius.lg,
    marginRight: 12,
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    ...Shadows.sm,
  },
  billIcon: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    backgroundColor: "#F5F0FF",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 14,
  },
  billName: {
    fontSize: 14,
    fontFamily: FontFamily.semiBold,
    color: Colors.light.text,
    marginBottom: 6,
  },
  billAmount: {
    fontSize: 17,
    fontFamily: FontFamily.extraBold,
    color: Colors.light.text,
    marginBottom: 6,
  },
  billDue: {
    fontSize: 12,
    fontFamily: FontFamily.semiBold,
    color: Colors.light.danger,
  },

  activeGoalCard: {
    backgroundColor: Colors.light.card,
    padding: 18,
    borderRadius: Radius.lg,
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
    ...Shadows.sm,
  },
  goalIconMini: {
    width: 42,
    height: 42,
    borderRadius: Radius.sm,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 14,
  },
  activeGoalName: {
    fontSize: 15,
    fontFamily: FontFamily.bold,
    color: Colors.light.text,
    marginBottom: 8,
  },
  goalMiniBarBg: {
    width: "100%",
    height: 5,
    backgroundColor: Colors.light.backgroundSubtle,
    borderRadius: 3,
  },
  goalMiniBarFill: { height: 5, borderRadius: 3 },
  activeGoalPct: {
    fontSize: 16,
    fontFamily: FontFamily.extraBold,
    color: Colors.light.text,
  },

  debtRow: { flexDirection: "row", gap: 12 },
  debtBox: {
    flex: 1,
    padding: 18,
    borderRadius: Radius.lg,
    alignItems: "center",
    borderWidth: 1,
    borderColor: Colors.light.borderLight,
  },
  debtBoxLabel: {
    fontSize: 13,
    fontFamily: FontFamily.semiBold,
    color: Colors.light.textSecondary,
    marginBottom: 6,
  },
  debtBoxAmount: { fontSize: 18, fontFamily: FontFamily.extraBold },
});
