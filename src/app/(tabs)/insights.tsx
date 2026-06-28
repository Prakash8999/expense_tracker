import { Colors } from "@/constants/theme";
import { useStore } from "@/store/useStore";
import { formatCurrency } from "@/utils/currency";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  Dimensions,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  TouchableWithoutFeedback,
  View,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

const { width } = Dimensions.get("window");
type InsightTab = "analytics" | "budgets" | "goals";
type TimeFilter = "day" | "week" | "month";
type TypeFilter = "both" | "expense" | "income";

// ─────────────────────────────────────────────────────────────
//  Helpers
// ─────────────────────────────────────────────────────────────
function formatCompact(val: number, currencyCode: string) {
  try {
    let num = val;
    let suffix = "";
    if (val >= 1000000) {
      num = val / 1000000;
      suffix = "M";
    } else if (val >= 1000) {
      num = val / 1000;
      suffix = "K";
    }

    return (
      new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: currencyCode,
        maximumFractionDigits: suffix ? 1 : 0,
      }).format(num) + suffix
    );
  } catch {
    return `${val}`;
  }
}

export default function InsightsScreen() {
  const { budgets, goals, transactions, categories, currency } = useStore();
  const [tab, setTab] = useState<InsightTab>("analytics");

  // New Analytics Filters
  const [timeFilter, setTimeFilter] = useState<TimeFilter>("month");
  const [typeFilter, setTypeFilter] = useState<TypeFilter>("both");
  const [showTypeDropdown, setShowTypeDropdown] = useState(false);
  const [scrollX, setScrollX] = useState(0);
  const [selectedChartItem, setSelectedChartItem] = useState<any>(null);
  const chartScrollRef = useRef<ScrollView>(null);

  useEffect(() => {
    // Wait a brief moment for the new chart width to calculate before scrolling
    setTimeout(() => {
      chartScrollRef.current?.scrollToEnd({ animated: false });
    }, 50);
  }, [timeFilter]);

  // ── Budget data ──────────────────────────────────────────
  const budgetData = useMemo(() => {
    const now = new Date();
    return budgets.map((b: any) => {
      const cat = categories.find((c: any) => c.id === b.categoryId);
      let startDate: number;
      if (b.period === "monthly") {
        startDate = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
      } else if (b.period === "weekly") {
        const d = new Date();
        d.setDate(d.getDate() - d.getDay());
        startDate = d.getTime();
      } else if (b.period === "daily") {
        startDate = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate(),
        ).getTime();
      } else if (b.period === "yearly") {
        startDate = new Date(now.getFullYear(), 0, 1).getTime();
      } else {
        startDate = b.startDate;
      }
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

  // ── Analytics Data (Dynamic Custom Chart) ────────────────
  const chartData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();

    if (timeFilter === "day") {
      const endOfToday = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() + 1,
      ).getTime();
      const txns = transactions.filter(
        (t: any) => t.date >= startOfToday && t.date < endOfToday,
      );

      const map: Record<string, any> = {};
      txns.forEach((t: any) => {
        const cat = categories.find((c: any) => c.id === t.categoryId);
        const key = cat?.id || "other";
        if (!map[key]) {
          map[key] = {
            label: cat?.name || "Other",
            expense: 0,
            income: 0,
            id: key,
          };
        }
        if (t.type === "expense") map[key].expense += t.amount;
        if (t.type === "income") map[key].income += t.amount;
      });
      return Object.values(map).sort(
        (a, b) => b.expense + b.income - (a.expense + a.income),
      );
    } else {
      const daysCount = timeFilter === "week" ? 7 : 30;
      const data = [];
      for (let i = daysCount - 1; i >= 0; i--) {
        const d = new Date(
          now.getFullYear(),
          now.getMonth(),
          now.getDate() - i,
        );
        const ts = d.getTime();
        const end = new Date(
          d.getFullYear(),
          d.getMonth(),
          d.getDate() + 1,
        ).getTime();

        const txns = transactions.filter(
          (t: any) => t.date >= ts && t.date < end,
        );
        const expense = txns
          .filter((t: any) => t.type === "expense")
          .reduce((s: number, t: any) => s + t.amount, 0);
        const income = txns
          .filter((t: any) => t.type === "income")
          .reduce((s: number, t: any) => s + t.amount, 0);

        let label = "";
        if (timeFilter === "week") {
          const days = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
          label = days[d.getDay()];
        } else {
          label = `${d.getDate()}`;
        }

        data.push({ label, expense, income, id: ts.toString() });
      }
      return data;
    }
  }, [transactions, timeFilter, categories]);

  const { maxY, ySteps } = useMemo(() => {
    let max = 0;
    chartData.forEach((d) => {
      if (typeFilter === "both") {
        max = Math.max(max, d.expense + d.income); // Stacked total
      } else if (typeFilter === "expense") {
        max = Math.max(max, d.expense);
      } else {
        max = Math.max(max, d.income);
      }
    });

    if (max === 0) {
      return { maxY: 100, ySteps: [100, 50, 0] };
    }

    // Calculate a nice step size for the Y axis
    const roughStep = max / 4;
    const mag = Math.pow(10, Math.floor(Math.log10(roughStep || 1)));
    const norm = roughStep / mag;

    let niceStep;
    if (norm < 1.5) niceStep = 1;
    else if (norm < 3) niceStep = 2;
    else if (norm < 7) niceStep = 5;
    else niceStep = 10;

    const step = niceStep * mag;
    const steps = [0, step, step * 2, step * 3, step * 4];

    // Ensure the top step covers the max value
    let finalMax = step * 4;
    while (finalMax < max) {
      finalMax += step;
      steps.push(finalMax);
    }

    return { maxY: finalMax, ySteps: steps.reverse() }; // Largest first for rendering top-down
  }, [chartData, typeFilter]);

  // Breakdown Data (depends on time & type filters)
  const breakdownData = useMemo(() => {
    const now = new Date();
    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
    ).getTime();
    let startTs = startOfToday;
    if (timeFilter === "week") {
      startTs = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 6,
      ).getTime();
    } else if (timeFilter === "month") {
      startTs = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate() - 29,
      ).getTime();
    }
    const endTs = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate() + 1,
    ).getTime();

    // If viewing income, breakdown income. Otherwise default to expense breakdown.
    const relevantType = typeFilter === "income" ? "income" : "expense";

    const txns = transactions.filter(
      (t: any) =>
        t.type === relevantType && t.date >= startTs && t.date < endTs,
    );
    const grandTotal = txns.reduce((s: number, t: any) => s + t.amount, 0);

    const map: Record<string, any> = {};
    txns.forEach((t: any) => {
      const cat = categories.find((c: any) => c.id === t.categoryId);
      const key = cat?.id || "uncategorized";
      if (!map[key]) {
        map[key] = {
          amount: 0,
          color: cat?.color || "#94A3B8",
          name: cat?.name || "Uncategorized",
        };
      }
      map[key].amount += t.amount;
    });

    const slices = Object.values(map)
      .sort((a, b) => b.amount - a.amount)
      .slice(0, 7);
    return { slices, grandTotal, type: relevantType };
  }, [transactions, timeFilter, typeFilter, categories]);

  // Month totals (Always shows current calendar month summary at the top)
  const currentMonthTotals = useMemo(() => {
    const now = new Date();
    const start = new Date(now.getFullYear(), now.getMonth(), 1).getTime();
    const income = transactions
      .filter((t: any) => t.type === "income" && t.date >= start)
      .reduce((s: number, t: any) => s + t.amount, 0);
    const expense = transactions
      .filter((t: any) => t.type === "expense" && t.date >= start)
      .reduce((s: number, t: any) => s + t.amount, 0);
    return { income, expense, net: income - expense };
  }, [transactions]);

  const hasAnyTxn = transactions.length > 0;

  return (
    <SafeAreaView style={styles.safeArea} edges={["top"]}>
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Insights</Text>
        <Text style={styles.headerSub}>Your financial picture</Text>
      </View>

      {/* 3-way Tab switcher */}
      <View style={styles.tabRow}>
        {(
          [
            { key: "analytics", label: "Analytics", icon: "bar-chart" },
            { key: "budgets", label: "Budgets", icon: "wallet" },
            { key: "goals", label: "Goals", icon: "flag" },
          ] as { key: InsightTab; label: string; icon: string }[]
        ).map((item) => (
          <TouchableOpacity
            key={item.key}
            style={[styles.tab, tab === item.key && styles.tabActive]}
            onPress={() => setTab(item.key)}
          >
            <Ionicons
              name={
                (tab === item.key ? item.icon : `${item.icon}-outline`) as any
              }
              size={16}
              color={tab === item.key ? Colors.light.tint : "#94A3B8"}
            />
            <Text
              style={[styles.tabText, tab === item.key && styles.tabTextActive]}
            >
              {item.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        {/* ═══════════════ ANALYTICS TAB ═══════════════ */}
        {tab === "analytics" && (
          <>
            {!hasAnyTxn ? (
              <EmptyState
                icon="bar-chart-outline"
                title="No data yet"
                subtitle="Add transactions to see your analytics come alive"
              />
            ) : (
              <>
                {/* This Month Summary */}
                <View style={styles.summaryRow}>
                  <View
                    style={[styles.summaryCard, { borderTopColor: "#66BB6A" }]}
                  >
                    <Text style={styles.summaryLabel}>Income</Text>
                    <Text style={[styles.summaryAmount, { color: "#66BB6A" }]}>
                      {formatCurrency(currentMonthTotals.income, currency.code)}
                    </Text>
                  </View>
                  <View
                    style={[styles.summaryCard, { borderTopColor: "#EF5350" }]}
                  >
                    <Text style={styles.summaryLabel}>Expenses</Text>
                    <Text style={[styles.summaryAmount, { color: "#EF5350" }]}>
                      {formatCurrency(
                        currentMonthTotals.expense,
                        currency.code,
                      )}
                    </Text>
                  </View>
                  <View
                    style={[
                      styles.summaryCard,
                      {
                        borderTopColor:
                          currentMonthTotals.net >= 0 ? "#42A5F5" : "#FF7043",
                      },
                    ]}
                  >
                    <Text style={styles.summaryLabel}>Net</Text>
                    <Text
                      style={[
                        styles.summaryAmount,
                        {
                          color:
                            currentMonthTotals.net >= 0 ? "#42A5F5" : "#FF7043",
                        },
                      ]}
                    >
                      {currentMonthTotals.net >= 0 ? "+" : ""}
                      {formatCurrency(currentMonthTotals.net, currency.code)}
                    </Text>
                  </View>
                </View>

                {/* Filters */}
                <View style={styles.filtersContainer}>
                  {/* Time Filter Chips */}
                  <View style={[styles.filterGroup, { flex: 2 }]}>
                    {(["day", "week", "month"] as TimeFilter[]).map((f) => (
                      <TouchableOpacity
                        key={f}
                        style={[
                          styles.filterChip,
                          timeFilter === f && styles.filterChipActive,
                        ]}
                        onPress={() => setTimeFilter(f)}
                      >
                        <Text
                          style={[
                            styles.filterChipText,
                            timeFilter === f && styles.filterChipTextActive,
                          ]}
                        >
                          1 {f.charAt(0).toUpperCase() + f.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>

                  {/* Type Filter Dropdown */}
                  <TouchableOpacity
                    style={styles.dropdownButton}
                    onPress={() => setShowTypeDropdown(true)}
                  >
                    <Text style={styles.dropdownButtonText}>
                      {typeFilter === "both"
                        ? "Both"
                        : typeFilter === "expense"
                          ? "Expense"
                          : "Income"}
                    </Text>
                    <Ionicons
                      name="chevron-down"
                      size={16}
                      color={Colors.light.tint}
                    />
                  </TouchableOpacity>
                </View>

                {/* Custom Dynamic Chart */}
                <View style={styles.chartCard}>
                  <View
                    style={{
                      flexDirection: "row",
                      justifyContent: "space-between",
                      alignItems: "flex-start",
                    }}
                  >
                    <View style={{ flex: 1, paddingRight: 8 }}>
                      <Text style={styles.chartTitle}>
                        {timeFilter === "day"
                          ? "Today's Cash Flow"
                          : timeFilter === "week"
                            ? "7-Day Trend"
                            : "30-Day Trend"}
                      </Text>
                      <Text style={styles.chartSub}>
                        {typeFilter === "both"
                          ? "Income & Expenses"
                          : typeFilter === "expense"
                            ? "Expenses only"
                            : "Income only"}
                        {timeFilter === "month" &&
                          ` • ${new Date(
                            new Date().getFullYear(),
                            new Date().getMonth(),
                            new Date().getDate() - 29,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })} - ${new Date().toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`}
                        {timeFilter === "week" &&
                          ` • ${new Date(
                            new Date().getFullYear(),
                            new Date().getMonth(),
                            new Date().getDate() - 6,
                          ).toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                          })} - ${new Date().toLocaleDateString("en-US", {
                            month: "short",
                            day: "numeric",
                            year: "numeric",
                          })}`}
                        {timeFilter === "day" &&
                          ` • ${new Date().toLocaleDateString("en-US", {
                            month: "long",
                            day: "numeric",
                            year: "numeric",
                          })}`}
                      </Text>
                    </View>

                    {/* Scroll Controls */}
                    <View
                      style={{ flexDirection: "row", gap: 6, marginTop: -2 }}
                    >
                      <TouchableOpacity
                        style={styles.scrollControlBtn}
                        onPress={() => {
                          chartScrollRef.current?.scrollTo({
                            x: Math.max(0, scrollX - 180),
                            animated: true,
                          });
                        }}
                      >
                        <Ionicons
                          name="chevron-back"
                          size={20}
                          color="#64748B"
                        />
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.scrollControlBtn}
                        onPress={() => {
                          chartScrollRef.current?.scrollTo({
                            x: scrollX + 180,
                            animated: true,
                          });
                        }}
                      >
                        <Ionicons
                          name="chevron-forward"
                          size={20}
                          color="#64748B"
                        />
                      </TouchableOpacity>
                    </View>
                  </View>

                  {chartData.length === 0 ? (
                    <View style={styles.chartEmpty}>
                      <Ionicons
                        name="stats-chart-outline"
                        size={32}
                        color="#CBD5E1"
                      />
                      <Text style={styles.chartEmptyText}>
                        No data for this period
                      </Text>
                    </View>
                  ) : (
                    <View style={styles.customChartContainer}>
                      {/* Y-Axis */}
                      <View style={styles.yAxis}>
                        {ySteps.map((step, idx) => (
                          <Text key={idx} style={styles.yAxisText}>
                            {formatCompact(step, currency.code)}
                          </Text>
                        ))}
                      </View>

                      {/* Straight Axes Lines */}
                      <View style={styles.axesContainer} pointerEvents="none">
                        <View style={styles.xAxisLine} />
                        <View style={styles.yAxisLine} />
                      </View>

                      {/* Chart Scroll Area */}
                      <ScrollView
                        key={timeFilter}
                        ref={chartScrollRef}
                        horizontal
                        showsHorizontalScrollIndicator={false}
                        style={{ flex: 1 }}
                        contentContainerStyle={styles.chartScrollContent}
                        onScroll={(e) =>
                          setScrollX(e.nativeEvent.contentOffset.x)
                        }
                        scrollEventThrottle={16}
                      >
                        {chartData.map((d, i) => {
                          const expHeight = (d.expense / maxY) * 160;
                          const incHeight = (d.income / maxY) * 160;

                          // Determine bar width based on filter
                          const barWidth =
                            timeFilter === "month"
                              ? 12
                              : timeFilter === "week"
                                ? 24
                                : 32;
                          const barGap =
                            timeFilter === "month"
                              ? 12
                              : timeFilter === "week"
                                ? 24
                                : 24;

                          return (
                            <TouchableOpacity
                              key={d.id}
                              style={[
                                styles.barColumn,
                                { marginRight: barGap },
                              ]}
                              onPress={() => setSelectedChartItem(d)}
                              activeOpacity={0.7}
                            >
                              <View style={styles.barTrack}>
                                {/* Stacked Bars: Expense on top (Red), Income on bottom (Green) */}
                                {(typeFilter === "both" ||
                                  typeFilter === "expense") &&
                                  d.expense > 0 && (
                                    <View
                                      style={[
                                        styles.barFillSegment,
                                        {
                                          height: expHeight,
                                          backgroundColor: "#EF5350",
                                          borderTopLeftRadius: 4,
                                          borderTopRightRadius: 4,
                                          borderBottomLeftRadius:
                                            typeFilter === "both" &&
                                            d.income > 0
                                              ? 0
                                              : 4,
                                          borderBottomRightRadius:
                                            typeFilter === "both" &&
                                            d.income > 0
                                              ? 0
                                              : 4,
                                        },
                                        { width: barWidth },
                                      ]}
                                    />
                                  )}
                                {(typeFilter === "both" ||
                                  typeFilter === "income") &&
                                  d.income > 0 && (
                                    <View
                                      style={[
                                        styles.barFillSegment,
                                        {
                                          height: incHeight,
                                          backgroundColor: "#66BB6A",
                                          borderBottomLeftRadius: 4,
                                          borderBottomRightRadius: 4,
                                          borderTopLeftRadius:
                                            typeFilter === "both" &&
                                            d.expense > 0
                                              ? 0
                                              : 4,
                                          borderTopRightRadius:
                                            typeFilter === "both" &&
                                            d.expense > 0
                                              ? 0
                                              : 4,
                                        },
                                        { width: barWidth },
                                      ]}
                                    />
                                  )}
                                {((typeFilter === "both" &&
                                  d.expense === 0 &&
                                  d.income === 0) ||
                                  (typeFilter === "expense" &&
                                    d.expense === 0) ||
                                  (typeFilter === "income" &&
                                    d.income === 0)) && (
                                  <View
                                    style={[
                                      styles.barFillSegment,
                                      {
                                        height: 6,
                                        backgroundColor: "#CBD5E1",
                                        borderRadius: 3,
                                        width: barWidth,
                                      },
                                    ]}
                                  />
                                )}
                              </View>
                              <View style={styles.xLabelContainer}>
                                <Text
                                  style={styles.xLabelText}
                                  numberOfLines={1}
                                >
                                  {d.label}
                                </Text>
                              </View>
                            </TouchableOpacity>
                          );
                        })}
                      </ScrollView>
                    </View>
                  )}

                  {/* Legend */}
                  <View style={styles.chartLegend}>
                    {(typeFilter === "both" || typeFilter === "income") && (
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: "#66BB6A" },
                          ]}
                        />
                        <Text style={styles.legendText}>Income</Text>
                      </View>
                    )}
                    {(typeFilter === "both" || typeFilter === "expense") && (
                      <View style={styles.legendItem}>
                        <View
                          style={[
                            styles.legendDot,
                            { backgroundColor: "#EF5350" },
                          ]}
                        />
                        <Text style={styles.legendText}>Expenses</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Category Breakdown */}
                {breakdownData.slices.length > 0 && (
                  <View style={styles.chartCard}>
                    <Text style={styles.chartTitle}>
                      {breakdownData.type === "income"
                        ? "Income by Category"
                        : "Spending by Category"}
                    </Text>
                    <Text style={styles.chartSub}>
                      {timeFilter === "day"
                        ? "Today"
                        : timeFilter === "week"
                          ? "Last 7 Days"
                          : "Last 30 Days"}{" "}
                      ·{" "}
                      {formatCurrency(breakdownData.grandTotal, currency.code)}{" "}
                      total
                    </Text>
                    {breakdownData.slices.map((slice, i) => {
                      const pct =
                        breakdownData.grandTotal > 0
                          ? (slice.amount / breakdownData.grandTotal) * 100
                          : 0;
                      return (
                        <View key={i} style={styles.catBreakRow}>
                          <View
                            style={[
                              styles.catBreakColorDot,
                              { backgroundColor: slice.color },
                            ]}
                          />
                          <Text style={styles.catBreakName} numberOfLines={1}>
                            {slice.name}
                          </Text>
                          <View style={styles.catBreakBarWrap}>
                            <View
                              style={[
                                styles.catBreakBarFill,
                                {
                                  width: `${pct}%`,
                                  backgroundColor: slice.color,
                                },
                              ]}
                            />
                          </View>
                          <Text style={styles.catBreakPct}>
                            {pct.toFixed(0)}%
                          </Text>
                          <Text style={styles.catBreakAmt}>
                            {formatCurrency(slice.amount, currency.code)}
                          </Text>
                        </View>
                      );
                    })}
                  </View>
                )}
              </>
            )}
          </>
        )}

        {/* ═══════════════ BUDGETS TAB ═══════════════ */}
        {tab === "budgets" && (
          <>
            {budgetData.length === 0 ? (
              <EmptyState
                icon="pie-chart-outline"
                title="No budgets set"
                subtitle="Create a budget to track your spending limits"
                actionLabel="Create Budget"
                onAction={() => router.push("/add-budget")}
              />
            ) : (
              <>
                {budgetData.map((b: any) => (
                  <BudgetCard key={b.id} b={b} currency={currency} />
                ))}
                <TouchableOpacity
                  style={styles.addMoreBtn}
                  onPress={() => router.push("/add-budget")}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={Colors.light.tint}
                  />
                  <Text style={styles.addMoreText}>Add Budget</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        {/* ═══════════════ GOALS TAB ═══════════════ */}
        {tab === "goals" && (
          <>
            {goals.length === 0 ? (
              <EmptyState
                icon="flag-outline"
                title="No savings goals"
                subtitle="Set a target and track your progress towards it"
                actionLabel="Create Goal"
                onAction={() => router.push("/add-goal")}
              />
            ) : (
              <>
                {goals.map((g: any) => (
                  <GoalCard key={g.id} g={g} currency={currency} />
                ))}
                <TouchableOpacity
                  style={styles.addMoreBtn}
                  onPress={() => router.push("/add-goal")}
                >
                  <Ionicons
                    name="add-circle-outline"
                    size={20}
                    color={Colors.light.tint}
                  />
                  <Text style={styles.addMoreText}>Add Goal</Text>
                </TouchableOpacity>
              </>
            )}
          </>
        )}

        <View style={{ height: 100 }} />
      </ScrollView>

      {/* Type Filter Dropdown Modal */}
      <Modal visible={showTypeDropdown} transparent animationType="fade">
        <TouchableWithoutFeedback onPress={() => setShowTypeDropdown(false)}>
          <View style={styles.dropdownOverlay}>
            <View style={styles.dropdownMenu}>
              <Text style={styles.dropdownTitle}>View Data For</Text>
              {(["both", "expense", "income"] as TypeFilter[]).map((t) => (
                <TouchableOpacity
                  key={t}
                  style={[
                    styles.dropdownOption,
                    typeFilter === t && styles.dropdownOptionActive,
                  ]}
                  onPress={() => {
                    setTypeFilter(t);
                    setShowTypeDropdown(false);
                  }}
                >
                  <Text
                    style={[
                      styles.dropdownOptionText,
                      typeFilter === t && styles.dropdownOptionTextActive,
                    ]}
                  >
                    {t === "both"
                      ? "Income & Expenses"
                      : t === "expense"
                        ? "Expenses Only"
                        : "Income Only"}
                  </Text>
                  {typeFilter === t && (
                    <Ionicons
                      name="checkmark-circle"
                      size={20}
                      color={Colors.light.tint}
                    />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        </TouchableWithoutFeedback>
      </Modal>

      {/* Chart Detail Modal */}
      <Modal visible={!!selectedChartItem} transparent animationType="slide">
        <View style={styles.modalBottomSheetOverlay}>
          <View style={styles.detailModalContent}>
            <View style={styles.detailModalHeader}>
              <View>
                <Text style={styles.detailModalTitle}>
                  {timeFilter === "day"
                    ? selectedChartItem?.label
                    : selectedChartItem
                      ? new Date(
                          Number(selectedChartItem.id),
                        ).toLocaleDateString("en-US", {
                          weekday: "long",
                          month: "long",
                          day: "numeric",
                          year: "numeric",
                        })
                      : ""}
                </Text>
                {timeFilter === "day" && (
                  <Text
                    style={{ fontSize: 13, color: "#94A3B8", marginTop: 2 }}
                  >
                    {new Date().toLocaleDateString("en-US", {
                      weekday: "long",
                      month: "long",
                      day: "numeric",
                      year: "numeric",
                    })}
                  </Text>
                )}
              </View>
              <TouchableOpacity onPress={() => setSelectedChartItem(null)}>
                <Ionicons name="close" size={24} color="#64748B" />
              </TouchableOpacity>
            </View>

            <View style={styles.detailModalSummary}>
              <View style={styles.detailSummaryBox}>
                <Text style={styles.detailSummaryLabel}>Expense</Text>
                <Text style={[styles.detailSummaryAmt, { color: "#EF5350" }]}>
                  {formatCurrency(
                    selectedChartItem?.expense || 0,
                    currency.code,
                  )}
                </Text>
              </View>
              <View style={styles.detailSummaryBox}>
                <Text style={styles.detailSummaryLabel}>Income</Text>
                <Text style={[styles.detailSummaryAmt, { color: "#66BB6A" }]}>
                  {formatCurrency(
                    selectedChartItem?.income || 0,
                    currency.code,
                  )}
                </Text>
              </View>
            </View>

            <Text style={styles.detailModalSubTitle}>Transactions</Text>
            <ScrollView
              style={styles.detailTxnList}
              showsVerticalScrollIndicator={false}
            >
              {(() => {
                if (!selectedChartItem) return null;

                let txnsForBar = [];
                if (timeFilter === "day") {
                  const startOfToday = new Date(
                    new Date().getFullYear(),
                    new Date().getMonth(),
                    new Date().getDate(),
                  ).getTime();
                  const endOfToday = startOfToday + 86400000;
                  txnsForBar = transactions.filter(
                    (t: any) =>
                      t.date >= startOfToday &&
                      t.date < endOfToday &&
                      (t.categoryId === selectedChartItem.id ||
                        (!t.categoryId && selectedChartItem.id === "other")) &&
                      t.type !== "transfer",
                  );
                } else {
                  const ts = Number(selectedChartItem.id);
                  const endTs = ts + 86400000;
                  txnsForBar = transactions.filter(
                    (t: any) =>
                      t.date >= ts && t.date < endTs && t.type !== "transfer",
                  );
                }

                if (txnsForBar.length === 0) {
                  return (
                    <Text style={styles.detailEmptyText}>
                      No transactions found.
                    </Text>
                  );
                }

                return txnsForBar.map((t: any) => {
                  const cat = categories.find(
                    (c: any) => c.id === t.categoryId,
                  );
                  return (
                    <View key={t.id} style={styles.detailTxnItem}>
                      <View
                        style={[
                          styles.detailTxnIcon,
                          {
                            backgroundColor:
                              (cat?.color || Colors.light.tint) + "20",
                          },
                        ]}
                      >
                        <Ionicons
                          name={(cat?.icon || "list") as any}
                          size={20}
                          color={cat?.color || Colors.light.tint}
                        />
                      </View>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.detailTxnName}>
                          {cat?.name || "Uncategorized"}
                        </Text>
                        <Text style={styles.detailTxnNote}>
                          {new Date(t.date).toLocaleTimeString("en-US", {
                            hour: "numeric",
                            minute: "2-digit",
                            hour12: true,
                          })}
                          {t.note ? ` • ${t.note}` : ""}
                        </Text>
                      </View>
                      <Text
                        style={[
                          styles.detailTxnAmt,
                          {
                            color: t.type === "expense" ? "#EF5350" : "#66BB6A",
                          },
                        ]}
                      >
                        {t.type === "expense" ? "-" : "+"}
                        {formatCurrency(t.amount, currency.code)}
                      </Text>
                    </View>
                  );
                });
              })()}
            </ScrollView>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

// ─────────────────────────────────────────────────────────────
//  Sub-components
// ─────────────────────────────────────────────────────────────
function EmptyState({
  icon,
  title,
  subtitle,
  actionLabel,
  onAction,
}: {
  icon: any;
  title: string;
  subtitle: string;
  actionLabel?: string;
  onAction?: () => void;
}) {
  return (
    <View style={styles.emptyState}>
      <Ionicons name={icon} size={52} color="#CBD5E1" />
      <Text style={styles.emptyText}>{title}</Text>
      <Text style={styles.emptySubtext}>{subtitle}</Text>
      {actionLabel && onAction && (
        <TouchableOpacity style={styles.addBtn} onPress={onAction}>
          <Ionicons name="add" size={20} color="#FFF" />
          <Text style={styles.addBtnText}>{actionLabel}</Text>
        </TouchableOpacity>
      )}
    </View>
  );
}

function BudgetCard({ b, currency }: { b: any; currency: any }) {
  const barColor =
    b.pct >= 90 ? "#EF5350" : b.pct >= 70 ? "#FFA726" : "#66BB6A";
  return (
    <View style={styles.budgetCard}>
      <View style={styles.budgetHeader}>
        <View style={styles.budgetLeft}>
          <View
            style={[
              styles.budgetIcon,
              { backgroundColor: (b.cat?.color || Colors.light.tint) + "20" },
            ]}
          >
            <Ionicons
              name={(b.cat?.icon || "pie-chart") as any}
              size={20}
              color={b.cat?.color || Colors.light.tint}
            />
          </View>
          <View>
            <Text style={styles.budgetName}>
              {b.cat?.name || "Total Budget"}
            </Text>
            <Text style={styles.budgetPeriod}>
              {b.period.charAt(0).toUpperCase() + b.period.slice(1)}
            </Text>
          </View>
        </View>
        <View style={styles.budgetRight}>
          <Text style={[styles.budgetSpent, { color: barColor }]}>
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
            { width: `${b.pct}%`, backgroundColor: barColor },
          ]}
        />
      </View>
      <View style={styles.budgetFooter}>
        <Text style={[styles.budgetRemaining, { color: barColor }]}>
          {b.pct >= 100
            ? "⚠️ Over budget!"
            : `${formatCurrency(b.amount - b.spent, currency.code)} remaining`}
        </Text>
        <Text style={styles.budgetPctText}>{b.pct.toFixed(0)}%</Text>
      </View>
    </View>
  );
}

function GoalCard({ g, currency }: { g: any; currency: any }) {
  const pct = Math.min((g.currentAmount / g.targetAmount) * 100, 100);
  const daysLeft = g.targetDate
    ? Math.max(0, Math.ceil((g.targetDate - Date.now()) / 86400000))
    : null;
  return (
    <TouchableOpacity
      style={styles.goalCard}
      activeOpacity={0.8}
      onPress={() => router.push(`/goal-details/${g.id}` as any)}
    >
      <View style={styles.goalHeader}>
        <View style={[styles.goalIcon, { backgroundColor: g.color + "20" }]}>
          <Ionicons name={g.icon as any} size={24} color={g.color} />
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.goalName}>{g.name}</Text>
          {daysLeft !== null && (
            <Text style={styles.goalDays}>
              {daysLeft === 0 ? "Due today!" : `${daysLeft} days left`}
            </Text>
          )}
        </View>
        <Text style={[styles.goalPct, { color: g.color }]}>
          {pct.toFixed(0)}%
        </Text>
      </View>
      <View style={styles.barBg}>
        <View
          style={[
            styles.barFill,
            { width: `${pct}%`, backgroundColor: g.color },
          ]}
        />
      </View>
      <View style={styles.goalAmounts}>
        <Text style={styles.goalSaved}>
          {formatCurrency(g.currentAmount, currency.code)} saved
        </Text>
        <Text style={styles.goalTarget}>
          Target: {formatCurrency(g.targetAmount, currency.code)}
        </Text>
      </View>
      {g.note && <Text style={styles.goalNote}>{g.note}</Text>}
    </TouchableOpacity>
  );
}

// ─────────────────────────────────────────────────────────────
//  Styles
// ─────────────────────────────────────────────────────────────
const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },
  header: { paddingHorizontal: 20, paddingTop: 12, paddingBottom: 4 },
  headerTitle: { fontSize: 28, fontWeight: "800", color: Colors.light.text },
  headerSub: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 2 },

  tabRow: {
    flexDirection: "row",
    marginHorizontal: 20,
    backgroundColor: "#F1F5F9",
    borderRadius: 14,
    padding: 4,
    marginBottom: 16,
    marginTop: 12,
  },
  tab: {
    flex: 1,
    flexDirection: "row",
    paddingVertical: 9,
    borderRadius: 11,
    alignItems: "center",
    justifyContent: "center",
    gap: 5,
  },
  tabActive: {
    backgroundColor: "#FFF",
    elevation: 3,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 4,
  },
  tabText: { fontSize: 11, fontWeight: "600", color: "#94A3B8" },
  tabTextActive: { color: Colors.light.text, fontWeight: "700" },

  content: { flex: 1, paddingHorizontal: 20 },

  // Filters
  filtersContainer: {
    flexDirection: "row",
    marginBottom: 16,
    gap: 10,
    paddingHorizontal: 2,
  },
  filterGroup: {
    flexDirection: "row",
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    padding: 4,
  },
  filterChip: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
    borderRadius: 10,
  },
  filterChipActive: {
    backgroundColor: "#FFF",
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
  },
  filterChipText: { fontSize: 12, fontWeight: "600", color: "#94A3B8" },
  filterChipTextActive: { color: Colors.light.tint, fontWeight: "700" },

  dropdownButton: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "#F8FAFC",
    borderRadius: 12,
    paddingVertical: 8,
  },
  dropdownButtonText: {
    fontSize: 12,
    fontWeight: "700",
    color: Colors.light.tint,
  },

  dropdownOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  dropdownMenu: {
    backgroundColor: "#FFF",
    width: "100%",
    borderRadius: 20,
    padding: 20,
    elevation: 5,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
  },
  dropdownTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 16,
    textAlign: "center",
  },
  dropdownOption: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  dropdownOptionActive: {},
  dropdownOptionText: { fontSize: 15, fontWeight: "500", color: "#64748B" },
  dropdownOptionTextActive: { color: Colors.light.text, fontWeight: "700" },

  // Summary
  summaryRow: { flexDirection: "row", gap: 10, marginBottom: 16 },
  summaryCard: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 14,
    padding: 12,
    borderTopWidth: 3,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  summaryLabel: {
    fontSize: 11,
    fontWeight: "600",
    color: "#94A3B8",
    marginBottom: 4,
  },
  summaryAmount: { fontSize: 13, fontWeight: "800", color: Colors.light.text },

  // Custom Chart
  chartCard: {
    backgroundColor: "#FFF",
    borderRadius: 20,
    padding: 18,
    marginBottom: 16,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 6,
  },
  chartTitle: { fontSize: 16, fontWeight: "700", color: Colors.light.text },
  chartSub: { fontSize: 12, color: "#94A3B8", marginBottom: 16, marginTop: 2 },
  scrollControlBtn: {
    padding: 6,
    backgroundColor: "#F1F5F9",
    borderRadius: 8,
  },

  customChartContainer: {
    height: 180,
    flexDirection: "row",
    marginBottom: 16,
    position: "relative",
  },
  yAxis: {
    justifyContent: "space-between",
    paddingRight: 8,
    alignItems: "flex-end",
    width: 45,
    zIndex: 2,
  },
  yAxisText: { fontSize: 9, color: "#94A3B8", fontWeight: "500" },
  axesContainer: {
    position: "absolute",
    left: 45,
    right: 0,
    top: 5,
    bottom: 20,
    zIndex: 1,
  },
  xAxisLine: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    height: 1.5,
    backgroundColor: "#CBD5E1",
  },
  yAxisLine: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 1.5,
    backgroundColor: "#CBD5E1",
  },
  chartScrollContent: {
    alignItems: "flex-end",
    paddingLeft: 8,
    paddingRight: 16,
  },
  barColumn: {
    alignItems: "center",
    justifyContent: "flex-end",
    height: "100%",
    zIndex: 2,
  },
  barTrack: {
    flex: 1,
    justifyContent: "flex-end",
    alignItems: "center",
    width: "100%",
  },
  barFillSegment: { width: "100%" },
  xLabelContainer: { height: 20, justifyContent: "center" },
  xLabelText: {
    fontSize: 8,
    color: "#94A3B8",
    textAlign: "center",
  },

  chartLegend: {
    flexDirection: "row",
    gap: 16,
    justifyContent: "center",
    marginTop: 4,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendText: { fontSize: 12, fontWeight: "500", color: "#64748B" },

  // Breakdown
  catBreakRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 10,
  },
  catBreakColorDot: { width: 10, height: 10, borderRadius: 5, flexShrink: 0 },
  catBreakName: {
    fontSize: 12,
    fontWeight: "600",
    color: Colors.light.text,
    width: 80,
  },
  catBreakBarWrap: {
    flex: 1,
    height: 7,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
  },
  catBreakBarFill: { height: 7, borderRadius: 4 },
  catBreakPct: {
    fontSize: 11,
    fontWeight: "700",
    color: "#64748B",
    width: 30,
    textAlign: "right",
  },
  catBreakAmt: {
    fontSize: 11,
    fontWeight: "600",
    color: "#64748B",
    width: 70,
    textAlign: "right",
  },

  chartEmpty: { alignItems: "center", paddingVertical: 24, gap: 8 },
  chartEmptyText: {
    fontSize: 12,
    color: "#94A3B8",
    textAlign: "center",
    marginTop: 4,
  },

  // Budgets
  budgetCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
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
    marginBottom: 14,
  },
  budgetLeft: { flexDirection: "row", alignItems: "center", gap: 12 },
  budgetIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
  },
  budgetName: { fontSize: 15, fontWeight: "600", color: Colors.light.text },
  budgetPeriod: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  budgetRight: { alignItems: "flex-end" },
  budgetSpent: { fontSize: 16, fontWeight: "700" },
  budgetLimit: { fontSize: 12, color: "#94A3B8" },
  barBg: {
    height: 8,
    backgroundColor: "#F1F5F9",
    borderRadius: 4,
    marginBottom: 8,
  },
  barFill: { height: 8, borderRadius: 4 },
  budgetFooter: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  budgetRemaining: { fontSize: 13, fontWeight: "600" },
  budgetPctText: { fontSize: 13, fontWeight: "700", color: "#94A3B8" },

  // Goals
  goalCard: {
    backgroundColor: "#FFF",
    borderRadius: 18,
    padding: 18,
    marginBottom: 14,
    elevation: 1,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 4,
  },
  goalHeader: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  goalIcon: {
    width: 48,
    height: 48,
    borderRadius: 16,
    justifyContent: "center",
    alignItems: "center",
  },
  goalName: { fontSize: 16, fontWeight: "700", color: Colors.light.text },
  goalDays: { fontSize: 12, color: "#94A3B8", marginTop: 2 },
  goalPct: { fontSize: 20, fontWeight: "800" },
  goalAmounts: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 4,
  },
  goalSaved: { fontSize: 13, fontWeight: "600", color: "#66BB6A" },
  goalTarget: { fontSize: 13, color: "#94A3B8" },
  goalNote: {
    fontSize: 13,
    color: "#64748B",
    marginTop: 8,
    fontStyle: "italic",
  },

  // Shared
  emptyState: { alignItems: "center", paddingVertical: 60 },
  emptyText: {
    fontSize: 18,
    fontWeight: "600",
    color: "#94A3B8",
    marginTop: 14,
  },
  emptySubtext: {
    fontSize: 14,
    color: "#CBD5E1",
    marginTop: 4,
    textAlign: "center",
    paddingHorizontal: 20,
  },
  addBtn: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    backgroundColor: Colors.light.tint,
    paddingHorizontal: 24,
    paddingVertical: 14,
    borderRadius: 14,
    marginTop: 20,
  },
  addBtnText: { color: "#FFF", fontSize: 16, fontWeight: "700" },
  addMoreBtn: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1.5,
    borderColor: Colors.light.tint,
    borderStyle: "dashed",
    marginBottom: 8,
  },
  addMoreText: { fontSize: 15, fontWeight: "600", color: Colors.light.tint },

  // Detail Modal
  modalBottomSheetOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.4)",
    justifyContent: "flex-end",
  },
  detailModalContent: {
    backgroundColor: "#FFF",
    width: "100%",
    height: "75%",
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: 24,
    elevation: 10,
    shadowColor: "#000",
    shadowOpacity: 0.2,
    shadowRadius: 10,
  },
  detailModalHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: 20,
  },
  detailModalTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: Colors.light.text,
  },
  detailModalSummary: { flexDirection: "row", gap: 12, marginBottom: 24 },
  detailSummaryBox: {
    flex: 1,
    backgroundColor: "#F8FAFC",
    padding: 16,
    borderRadius: 16,
    alignItems: "center",
  },
  detailSummaryLabel: { fontSize: 13, color: "#64748B", marginBottom: 6 },
  detailSummaryAmt: { fontSize: 18, fontWeight: "800" },
  detailModalSubTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: Colors.light.text,
    marginBottom: 12,
  },
  detailTxnList: { flex: 1 },
  detailEmptyText: { color: "#94A3B8", textAlign: "center", marginTop: 20 },
  detailTxnItem: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#F1F5F9",
  },
  detailTxnIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: "center",
    alignItems: "center",
    marginRight: 12,
  },
  detailTxnName: { fontSize: 15, fontWeight: "600", color: Colors.light.text },
  detailTxnNote: { fontSize: 13, color: "#94A3B8", marginTop: 2 },
  detailTxnAmt: { fontSize: 15, fontWeight: "700" },
});
