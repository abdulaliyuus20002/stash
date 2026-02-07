import React from 'react';
import { Stack, Redirect } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useColorScheme, TouchableOpacity, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import { useAuthStore } from '@/src/store/authStore';
import { colors, darkColors } from '@/src/utils/theme';

export default function RootLayout() {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  const themeColors = isDark ? darkColors : colors;
  const router = useRouter();

  const BackButton = () => (
    <TouchableOpacity
      onPress={() => router.back()}
      style={{ 
        padding: 8, 
        marginLeft: Platform.OS === 'ios' ? -8 : 0,
      }}
      hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
    >
      <Ionicons 
        name={Platform.OS === 'ios' ? 'chevron-back' : 'arrow-back'} 
        size={24} 
        color={themeColors.text} 
      />
    </TouchableOpacity>
  );

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
          headerBackTitleVisible: false,
          headerLeft: ({ canGoBack }) => canGoBack ? <BackButton /> : null,
          gestureEnabled: true,
          animation: 'slide_from_right',
        }}
      >
        <Stack.Screen name="index" options={{ headerShown: false }} />
        <Stack.Screen name="login" options={{ headerShown: false }} />
        <Stack.Screen name="register" options={{ headerShown: false }} />
        <Stack.Screen name="onboarding" options={{ headerShown: false }} />
        <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
        <Stack.Screen
          name="add-item"
          options={{
            presentation: 'modal',
            title: 'Save Content',
            headerTitleStyle: { fontWeight: '600' },
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={{ padding: 8 }}
                hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
              >
                <Ionicons name="close" size={24} color={themeColors.text} />
              </TouchableOpacity>
            ),
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
      </Stack>
    </>
  );
}
