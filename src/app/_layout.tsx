import { DefaultTheme, ThemeProvider } from '@react-navigation/native';
import { Stack } from 'expo-router';
import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { useDatabase } from '../db/useDatabase';
import { useStore } from '../store/useStore';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import { Colors } from '@/constants/theme';

const LightTheme = {
  ...DefaultTheme,
  colors: {
    ...DefaultTheme.colors,
    background: Colors.light.background,
    card: Colors.light.card,
    text: Colors.light.text,
    border: Colors.light.border,
    primary: Colors.light.tint,
  },
};

export default function RootLayout() {
  const { isReady, error } = useDatabase();
  const checkOnboarding = useStore((s) => s.checkOnboarding);
  const loadData = useStore((s) => s.loadData);
  const isInitialized = useStore((s) => s.isInitialized);

  useEffect(() => {
    if (isReady) {
      checkOnboarding().then(() => loadData());
    }
  }, [isReady]);

  if (!isReady || !isInitialized) {
    return (
      <SafeAreaProvider>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.light.tint} />
          <Text style={styles.loadingText}>Setting up your finances...</Text>
          {error && <Text style={styles.errorText}>Error: {error.message}</Text>}
        </View>
        <StatusBar style="dark" />
      </SafeAreaProvider>
    );
  }

  return (
    <SafeAreaProvider>
      <ThemeProvider value={LightTheme}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Screen name="onboarding" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="add-transaction" options={{ presentation: 'modal' }} />
          <Stack.Screen name="manage-categories" options={{ presentation: 'modal' }} />
          <Stack.Screen name="add-account" options={{ presentation: 'modal' }} />
          <Stack.Screen name="add-budget" options={{ presentation: 'modal' }} />
          <Stack.Screen name="add-goal" options={{ presentation: 'modal' }} />
          <Stack.Screen name="add-planned-payment" options={{ presentation: 'modal' }} />
          <Stack.Screen name="add-debt" options={{ presentation: 'modal' }} />
          <Stack.Screen name="add-shopping-list" options={{ presentation: 'modal' }} />
        </Stack>
      </ThemeProvider>
      <StatusBar style="dark" />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.light.background,
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: Colors.light.textSecondary,
  },
  errorText: {
    marginTop: 8,
    fontSize: 14,
    color: '#EF5350',
  },
});
