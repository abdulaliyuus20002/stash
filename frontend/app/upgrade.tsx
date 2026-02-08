import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/store/authStore';
import { spacing, typography, borderRadius } from '@/src/utils/theme';
import axios from 'axios';
import { API_URL } from '@/src/utils/config';

const PRO_FEATURES = [
  {
    icon: 'infinite-outline',
    title: 'Unlimited saves',
    description: 'Save without limits forever',
  },
  {
    icon: 'folder-outline',
    title: 'Unlimited collections',
    description: 'Organize without limits',
  },
  {
    icon: 'search',
    title: 'Advanced search',
    description: 'Search inside notes & tags',
  },
  {
    icon: 'notifications-outline',
    title: 'Smart resurfacing',
    description: 'Never forget saved content',
  },
  {
    icon: 'sparkles',
    title: 'Future AI features',
    description: 'First access to new AI tools',
  },
  {
    icon: 'flash-outline',
    title: 'Priority performance',
    description: 'Faster sync & premium support',
  },
];

export default function UpgradeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const token = useAuthStore((state) => state.token);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');

  const handleUpgrade = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/users/upgrade-pro`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Refresh user state with updated plan
      const userResponse = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      // Update auth store with refreshed user data
      useAuthStore.setState({ 
        user: { ...userResponse.data, is_pro: true, plan_type: 'pro' } 
      });
      
      Alert.alert(
        '🎉 Welcome to Pro!',
        'You now have access to all premium features.',
        [{ text: 'Awesome!', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to upgrade. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleRestore = () => {
    Alert.alert(
      'Restore Purchases',
      'This will restore any previous Pro purchases.',
      [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Restore', onPress: () => Alert.alert('Success', 'Purchases restored!') }
      ]
    );
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: '',
          headerTransparent: true,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.closeButton}
            >
              <Ionicons name="close" size={24} color={colors.text} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.proBadge, { backgroundColor: colors.accent }]}>
              <Ionicons name="diamond" size={24} color={colors.primary} />
            </View>
            <Text style={[styles.title, { color: colors.text }]}>Stash Pro</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Unlock the full power of your idea vault
            </Text>
          </View>

          {/* Features List */}
          <View style={styles.featuresContainer}>
            <Text style={[styles.featuresTitle, { color: colors.text }]}>
              What You Unlock
            </Text>
            {PRO_FEATURES.map((feature, index) => (
              <View 
                key={index} 
                style={[styles.featureItem, { borderBottomColor: colors.border }]}
              >
                <View style={[styles.featureIcon, { backgroundColor: colors.accent + '20' }]}>
                  <Ionicons name={feature.icon as any} size={20} color={colors.accent} />
                </View>
                <View style={styles.featureText}>
                  <Text style={[styles.featureTitle, { color: colors.text }]}>
                    {feature.title}
                  </Text>
                  <Text style={[styles.featureDesc, { color: colors.textMuted }]}>
                    {feature.description}
                  </Text>
                </View>
                <Ionicons name="checkmark-circle" size={22} color={colors.accent} />
              </View>
            ))}
          </View>

          {/* Pricing Plans */}
          <View style={styles.plansContainer}>
            <TouchableOpacity
              style={[
                styles.planCard,
                {
                  backgroundColor: selectedPlan === 'yearly' ? colors.accent + '15' : colors.card,
                  borderColor: selectedPlan === 'yearly' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSelectedPlan('yearly')}
            >
              {selectedPlan === 'yearly' && (
                <View style={[styles.saveBadge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.saveText, { color: colors.primary }]}>SAVE 40%</Text>
                </View>
              )}
              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: colors.text }]}>Yearly</Text>
                <View style={styles.planPricing}>
                  <Text style={[styles.planPrice, { color: colors.text }]}>$4.99</Text>
                  <Text style={[styles.planPeriod, { color: colors.textMuted }]}>/month</Text>
                </View>
              </View>
              <Text style={[styles.planBilled, { color: colors.textSecondary }]}>
                $59.99 billed annually
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.planCard,
                {
                  backgroundColor: selectedPlan === 'monthly' ? colors.accent + '15' : colors.card,
                  borderColor: selectedPlan === 'monthly' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planHeader}>
                <Text style={[styles.planName, { color: colors.text }]}>Monthly</Text>
                <View style={styles.planPricing}>
                  <Text style={[styles.planPrice, { color: colors.text }]}>$7.99</Text>
                  <Text style={[styles.planPeriod, { color: colors.textMuted }]}>/month</Text>
                </View>
              </View>
              <Text style={[styles.planBilled, { color: colors.textSecondary }]}>
                Billed monthly
              </Text>
            </TouchableOpacity>
          </View>

          {/* CTA Button */}
          <TouchableOpacity
            style={[styles.ctaButton, { backgroundColor: colors.accent }]}
            onPress={handleUpgrade}
            disabled={isLoading}
          >
            {isLoading ? (
              <ActivityIndicator color={colors.primary} />
            ) : (
              <>
                <Ionicons name="diamond" size={20} color={colors.primary} />
                <Text style={[styles.ctaText, { color: colors.primary }]}>
                  Start Pro {selectedPlan === 'yearly' ? '(Best Value)' : ''}
                </Text>
              </>
            )}
          </TouchableOpacity>

          {/* Footer Links */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleRestore}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>
                Restore Purchases
              </Text>
            </TouchableOpacity>
            <Text style={[styles.footerDot, { color: colors.textMuted }]}>•</Text>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: colors.textMuted }]}>
                Terms of Use
              </Text>
            </TouchableOpacity>
            <Text style={[styles.footerDot, { color: colors.textMuted }]}>•</Text>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: colors.textMuted }]}>
                Privacy
              </Text>
            </TouchableOpacity>
          </View>

          <Text style={[styles.disclaimer, { color: colors.textMuted }]}>
            Payment will be charged to your account. Subscription automatically renews unless canceled at least 24 hours before the end of the current period.
          </Text>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xxl,
  },
  closeButton: {
    padding: spacing.sm,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  proBadge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  featuresContainer: {
    marginBottom: spacing.xl,
  },
  featuresTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
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
    flex: 1,
  },
  featureTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: typography.bodySmall.fontSize,
  },
  plansContainer: {
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  planCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    position: 'relative',
    overflow: 'hidden',
  },
  saveBadge: {
    position: 'absolute',
    top: 12,
    right: -30,
    paddingHorizontal: spacing.xl,
    paddingVertical: 4,
    transform: [{ rotate: '45deg' }],
  },
  saveText: {
    fontSize: 10,
    fontWeight: '700',
  },
  planHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  planName: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  planPeriod: {
    fontSize: typography.bodySmall.fontSize,
  },
  planBilled: {
    fontSize: typography.bodySmall.fontSize,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  ctaText: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  footerLink: {
    fontSize: typography.bodySmall.fontSize,
  },
  footerDot: {
    fontSize: typography.bodySmall.fontSize,
  },
  disclaimer: {
    fontSize: 10,
    textAlign: 'center',
    lineHeight: 14,
  },
});
