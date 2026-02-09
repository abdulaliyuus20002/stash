import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useRouter, Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/store/authStore';
import { Button } from '@/src/components';
import { spacing, typography, borderRadius } from '@/src/utils/theme';
import { Ionicons } from '@expo/vector-icons';

export default function WelcomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { isAuthenticated } = useAuthStore();

  // Redirect to tabs if already authenticated
  if (isAuthenticated) {
    return <Redirect href="/(tabs)/home" />;
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={styles.content}>
        <View style={[styles.logoContainer, { backgroundColor: colors.primary }]}>
          <Ionicons name="layers" size={48} color={colors.accent} />
        </View>
        
        <Text style={[styles.title, { color: colors.text }]}>Stash</Text>
        <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
          Your private content vault for ideas worth keeping
        </Text>

        <View style={styles.features}>
          {[
            { icon: 'bookmark-outline', text: 'Save content from anywhere' },
            { icon: 'folder-outline', text: 'Organize with collections' },
            { icon: 'search-outline', text: 'Find anything instantly' },
          ].map((feature, index) => (
            <View key={index} style={styles.featureRow}>
              <View style={[styles.featureIcon, { backgroundColor: colors.accent + '20' }]}>
                <Ionicons name={feature.icon as any} size={20} color={colors.accent} />
              </View>
              <Text style={[styles.featureText, { color: colors.textSecondary }]}>
                {feature.text}
              </Text>
            </View>
          ))}
        </View>
      </View>

      <View style={styles.buttons}>
        <Button
          title="Get Started"
          onPress={() => router.push('/register')}
          size="lg"
          style={{ marginBottom: spacing.md }}
        />
        <Button
          title="I already have an account"
          onPress={() => router.push('/login')}
          variant="ghost"
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: spacing.lg,
  },
  content: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoContainer: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  title: {
    fontSize: 42,
    fontWeight: '700',
    letterSpacing: -1,
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
  },
  features: {
    width: '100%',
    gap: spacing.md,
  },
  featureRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: typography.body.fontSize,
    flex: 1,
  },
  buttons: {
    paddingBottom: spacing.xl,
  },
});
