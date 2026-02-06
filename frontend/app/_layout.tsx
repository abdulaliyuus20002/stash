import React from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme } from 'react-native';
import { useAuthStore } from '@/src/store/authStore';
import { colors, darkColors } from '@/src/utils/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? darkColors : colors;
  const { isAuthenticated } = useAuthStore();

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
