import React from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Dimensions } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/theme';
import { LinearGradient } from 'expo-linear-gradient';

const { width } = Dimensions.get('window');

const FEATURES = [
  {
    icon: 'people',
    color: '#6366F1',
    bg: '#EEF2FF',
    title: 'Friend Groups',
    desc: 'Create travel, roommate, or dinner groups to track shared costs.',
  },
  {
    icon: 'receipt',
    color: '#0EA5E9',
    bg: '#E0F2FE',
    title: 'Shared Expenses',
    desc: 'Split bills equally, by percentage, or by exact custom amounts.',
  },
  {
    icon: 'git-merge',
    color: '#10B981',
    bg: '#D1FAE5',
    title: 'Debt Simplification',
    desc: 'Our engine calculates the minimum transactions needed for everyone to settle up.',
  },
  {
    icon: 'link',
    color: '#F59E0B',
    bg: '#FEF3C7',
    title: 'Personal Sync',
    desc: 'Your share of a group expense automatically hits your personal budget.',
  },
];

export default function GroupsScreen() {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <LinearGradient
        colors={['#6366F115', '#EEF2FF30', Colors.light.background]}
        style={StyleSheet.absoluteFill}
        start={{ x: 0, y: 0 }}
        end={{ x: 0.5, y: 0.6 }}
      />

      {/* Header */}
      <View style={styles.header}>
        <View style={styles.badgeRow}>
          <View style={styles.comingSoonBadge}>
            <Text style={styles.comingSoonText}>🚀 Coming Soon</Text>
          </View>
        </View>
        <Text style={styles.headerTitle}>Group Splitter</Text>
        <Text style={styles.headerSub}>
          Split expenses with friends, simplify debts, and keep everyone even — without the awkward math.
        </Text>
      </View>

      {/* Big illustration icon */}
      <View style={styles.heroArea}>
        <View style={styles.heroCircle}>
          <Ionicons name="people" size={64} color="#6366F1" />
        </View>
        <View style={[styles.orbSmall, { top: 20, right: width * 0.15 }]}>
          <Ionicons name="wallet" size={20} color="#10B981" />
        </View>
        <View style={[styles.orbSmall, { bottom: 10, left: width * 0.15, backgroundColor: '#FEF3C7' }]}>
          <Ionicons name="calculator" size={20} color="#F59E0B" />
        </View>
      </View>

      {/* Feature Preview Cards */}
      <View style={styles.featuresWrap}>
        {FEATURES.map((f, i) => (
          <View key={i} style={styles.featureRow}>
            <View style={[styles.featureIcon, { backgroundColor: f.bg }]}>
              <Ionicons name={f.icon as any} size={22} color={f.color} />
            </View>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>{f.title}</Text>
              <Text style={styles.featureDesc}>{f.desc}</Text>
            </View>
          </View>
        ))}
      </View>

      {/* CTA */}
      <View style={styles.ctaArea}>
        <TouchableOpacity style={styles.notifyBtn} activeOpacity={0.85}>
          <LinearGradient
            colors={['#6366F1', '#818CF8']}
            style={styles.notifyGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 0 }}>
            <Ionicons name="notifications" size={18} color="#FFF" />
            <Text style={styles.notifyBtnText}>We're building this next!</Text>
          </LinearGradient>
        </TouchableOpacity>
        <Text style={styles.ctaSub}>Personal Expense Tracker is completing first</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.light.background },

  header: { paddingHorizontal: 24, paddingTop: 16, paddingBottom: 8 },
  badgeRow: { marginBottom: 10 },
  comingSoonBadge: {
    alignSelf: 'flex-start', backgroundColor: '#6366F110', borderWidth: 1, borderColor: '#6366F130',
    borderRadius: 20, paddingHorizontal: 12, paddingVertical: 5,
  },
  comingSoonText: { fontSize: 12, fontWeight: '700', color: '#6366F1' },
  headerTitle: { fontSize: 30, fontWeight: '800', color: Colors.light.text, lineHeight: 36 },
  headerSub: { fontSize: 14, color: Colors.light.textSecondary, marginTop: 8, lineHeight: 20 },

  heroArea: {
    alignItems: 'center', justifyContent: 'center',
    height: 130, marginVertical: 4, position: 'relative',
  },
  heroCircle: {
    width: 110, height: 110, borderRadius: 55,
    backgroundColor: '#EEF2FF', justifyContent: 'center', alignItems: 'center',
    elevation: 6, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 6 }, shadowOpacity: 0.18, shadowRadius: 12,
  },
  orbSmall: {
    position: 'absolute', width: 44, height: 44, borderRadius: 22,
    backgroundColor: '#D1FAE5', justifyContent: 'center', alignItems: 'center',
    elevation: 3, shadowColor: '#000', shadowOffset: { width: 0, height: 2 }, shadowOpacity: 0.08, shadowRadius: 4,
  },

  featuresWrap: { paddingHorizontal: 20, gap: 12, marginTop: 8 },
  featureRow: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 14,
    backgroundColor: '#FFF', borderRadius: 16, padding: 16,
    elevation: 1, shadowColor: '#000', shadowOffset: { width: 0, height: 1 }, shadowOpacity: 0.04, shadowRadius: 4,
  },
  featureIcon: { width: 44, height: 44, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  featureText: { flex: 1 },
  featureTitle: { fontSize: 15, fontWeight: '700', color: Colors.light.text },
  featureDesc: { fontSize: 13, color: Colors.light.textSecondary, marginTop: 3, lineHeight: 18 },

  ctaArea: { alignItems: 'center', paddingHorizontal: 24, paddingTop: 20 },
  notifyBtn: { width: '100%', borderRadius: 16, overflow: 'hidden', elevation: 4, shadowColor: '#6366F1', shadowOffset: { width: 0, height: 4 }, shadowOpacity: 0.3, shadowRadius: 8 },
  notifyGradient: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, paddingVertical: 16 },
  notifyBtnText: { color: '#FFF', fontSize: 16, fontWeight: '700' },
  ctaSub: { fontSize: 13, color: '#94A3B8', marginTop: 12 },
});
