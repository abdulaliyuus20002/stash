import React, { useEffect, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, View, ActivityIndicator, StyleSheet } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { colors, darkColors } from '@/src/utils/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? darkColors : colors;
  const { isAuthenticated, hasHydrated, checkAuth, token } = useAuthStore();
  const [isInitializing, setIsInitializing] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      // Wait for hydration
      if (!hasHydrated) return;
      
      try {
        if (token) {
          await checkAuth();
        }
      } catch (error) {
        console.log('Auth check error:', error);
      } finally {
        setIsInitializing(false);
      }
    };

    initialize();
  }, [hasHydrated, token]);

  // Show loading while hydrating or initializing
  if (!hasHydrated || isInitializing) {
    return (
      <View style={[styles.loading, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.accent} />
      </View>
    );
  }

  return (
    <>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <Stack
        screenOptions={{
          headerStyle: {
            backgroundColor: themeColors.background,
          },
          headerTintColor: themeColors.text,
          headerShadowVisible: false,
          contentStyle: {
            backgroundColor: themeColors.background,
          },
        }}
      >
        {isAuthenticated ? (
          <>
            <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
            <Stack.Screen
              name="add-item"
              options={{
                presentation: 'modal',
                title: 'Save Content',
                headerTitleStyle: { fontWeight: '600' },
              }}
            />
            <Stack.Screen
              name="item/[id]"
              options={{
                title: 'Details',
                headerTitleStyle: { fontWeight: '600' },
              }}
            />
            <Stack.Screen
              name="collection/[id]"
              options={{
                title: 'Collection',
                headerTitleStyle: { fontWeight: '600' },
              }}
            />
          </>
        ) : (
          <>
            <Stack.Screen name="index" options={{ headerShown: false }} />
            <Stack.Screen name="login" options={{ title: 'Login', headerShown: false }} />
            <Stack.Screen name="register" options={{ title: 'Sign Up', headerShown: false }} />
          </>
        )}
      </Stack>
    </>
  );
}

const styles = StyleSheet.create({
  loading: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
