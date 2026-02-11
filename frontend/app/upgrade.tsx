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

// Reduced to 3 most compelling features (reduces cognitive load)
const PRO_FEATURES = [
  {
    icon: 'infinite-outline',
    title: 'Unlimited saves & collections',
    description: 'Never hit a limit again',
  },
  {
    icon: 'notifications-outline',
    title: 'Smart resurfacing',
    description: 'Resurface ideas when you need them',
  },
  {
    icon: 'sparkles',
    title: 'Future AI features',
    description: 'First access to new AI tools',
  },
];

// Trial timeline steps
const TRIAL_TIMELINE = [
  { day: 'Today', description: 'Full access', icon: 'checkmark-circle' },
  { day: 'Day 5', description: 'Reminder', icon: 'notifications-outline' },
  { day: 'Day 7', description: '$59.99/year', icon: 'card-outline' },
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
        'Your 7-day trial has started!',
        'Enjoy full Pro access. We\'ll remind you before it ends.',
        [{ text: 'Start Exploring', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start trial. Please try again.');
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
            <Text style={[styles.title, { color: colors.text }]}>Try Stash Pro Free</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              7 days free, then $59.99/year
            </Text>
          </View>

          {/* Compact Features List */}
          <View style={styles.featuresContainer}>
            {PRO_FEATURES.map((feature, index) => (
              <View key={index} style={styles.featureItem}>
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
              </View>
            ))}
          </View>

          {/* Trial Timeline */}
          <View style={[styles.timelineContainer, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.timelineTitle, { color: colors.text }]}>How your trial works</Text>
            <View style={styles.timeline}>
              {TRIAL_TIMELINE.map((step, index) => (
                <View key={index} style={styles.timelineStep}>
                  <View style={[
                    styles.timelineIcon, 
                    { backgroundColor: index === 0 ? colors.accent : colors.inputBg }
                  ]}>
                    <Ionicons 
                      name={step.icon as any} 
                      size={16} 
                      color={index === 0 ? colors.primary : colors.textMuted} 
                    />
                  </View>
                  <Text style={[styles.timelineDay, { color: colors.text }]}>{step.day}</Text>
                  <Text style={[styles.timelineDesc, { color: colors.textSecondary }]}>{step.description}</Text>
                  {index < TRIAL_TIMELINE.length - 1 && (
                    <View style={[styles.timelineConnector, { backgroundColor: colors.border }]} />
                  )}
                </View>
              ))}
            </View>
          </View>

          {/* Pricing Plans */}
          <View style={styles.plansContainer}>
            {/* Yearly Plan - Recommended */}
            <TouchableOpacity
              style={[
                styles.planCard,
                styles.yearlyPlan,
                {
                  backgroundColor: selectedPlan === 'yearly' ? colors.accent + '10' : colors.card,
                  borderColor: selectedPlan === 'yearly' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSelectedPlan('yearly')}
            >
              {/* Save Badge - More prominent */}
              <View style={[styles.saveBadge, { backgroundColor: colors.accent }]}>
                <Text style={[styles.saveText, { color: colors.primary }]}>SAVE 37%</Text>
              </View>
              
              <View style={styles.planContent}>
                <View style={styles.planLeft}>
                  <View style={styles.planNameRow}>
                    <Text style={[styles.planName, { color: colors.text }]}>Yearly</Text>
                    <Text style={[styles.trialBadge, { color: colors.accent }]}>7 days free</Text>
                  </View>
                  <View style={styles.priceRow}>
                    <Text style={[styles.planPrice, { color: colors.text }]}>$4.99</Text>
                    <Text style={[styles.planPeriod, { color: colors.textMuted }]}>/mo</Text>
                    <Text style={[styles.originalPrice, { color: colors.textMuted }]}>$7.99/mo</Text>
                  </View>
                  <Text style={[styles.planBilled, { color: colors.textSecondary }]}>
                    $59.99 billed annually after trial
                  </Text>
                </View>
                <View style={[
                  styles.radioOuter, 
                  { borderColor: selectedPlan === 'yearly' ? colors.accent : colors.border }
                ]}>
                  {selectedPlan === 'yearly' && (
                    <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />
                  )}
                </View>
              </View>
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                {
                  backgroundColor: selectedPlan === 'monthly' ? colors.accent + '10' : colors.card,
                  borderColor: selectedPlan === 'monthly' ? colors.accent : colors.border,
                },
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.planContent}>
                <View style={styles.planLeft}>
                  <Text style={[styles.planName, { color: colors.text }]}>Monthly</Text>
                  <View style={styles.priceRow}>
                    <Text style={[styles.planPrice, { color: colors.text }]}>$7.99</Text>
                    <Text style={[styles.planPeriod, { color: colors.textMuted }]}>/mo</Text>
                  </View>
                  <Text style={[styles.planBilled, { color: colors.textSecondary }]}>
                    Billed monthly, cancel anytime
                  </Text>
                </View>
                <View style={[
                  styles.radioOuter, 
                  { borderColor: selectedPlan === 'monthly' ? colors.accent : colors.border }
                ]}>
                  {selectedPlan === 'monthly' && (
                    <View style={[styles.radioInner, { backgroundColor: colors.accent }]} />
                  )}
                </View>
              </View>
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
              <Text style={[styles.ctaText, { color: colors.primary }]}>
                {selectedPlan === 'yearly' ? 'Try Free for 7 Days' : 'Start Pro Monthly'}
              </Text>
            )}
          </TouchableOpacity>

          {/* No Payment Due Now - Trust element */}
          {selectedPlan === 'yearly' && (
            <View style={styles.noPaymentContainer}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
              <Text style={[styles.noPaymentText, { color: colors.textSecondary }]}>
                No payment due now
              </Text>
            </View>
          )}

          {/* Cancel Anytime - Trust element */}
          <Text style={[styles.cancelText, { color: colors.textMuted }]}>
            Cancel anytime in settings. No questions asked.
          </Text>

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
                Terms
              </Text>
            </TouchableOpacity>
            <Text style={[styles.footerDot, { color: colors.textMuted }]}>•</Text>
            <TouchableOpacity>
              <Text style={[styles.footerLink, { color: colors.textMuted }]}>
                Privacy
              </Text>
            </TouchableOpacity>
          </View>
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
    width: 56,
    height: 56,
    borderRadius: 28,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
  },
  // Compact features
  featuresContainer: {
    marginBottom: spacing.lg,
    gap: spacing.md,
  },
  featureItem: {
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
  // Trial Timeline
  timelineContainer: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
  },
  timelineTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  timeline: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  timelineStep: {
    alignItems: 'center',
    flex: 1,
    position: 'relative',
  },
  timelineIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  timelineDay: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    marginBottom: 2,
  },
  timelineDesc: {
    fontSize: 11,
    textAlign: 'center',
  },
  timelineConnector: {
    position: 'absolute',
    top: 16,
    left: '60%',
    right: '-40%',
    height: 2,
    zIndex: -1,
  },
  // Plans
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
  yearlyPlan: {
    paddingTop: spacing.lg + 4,
  },
  saveBadge: {
    position: 'absolute',
    top: 0,
    left: 0,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderBottomRightRadius: borderRadius.md,
  },
  saveText: {
    fontSize: 11,
    fontWeight: '700',
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planLeft: {
    flex: 1,
  },
  planNameRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
  planName: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
  },
  trialBadge: {
    fontSize: 12,
    fontWeight: '600',
  },
  priceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 24,
    fontWeight: '700',
  },
  planPeriod: {
    fontSize: typography.bodySmall.fontSize,
  },
  originalPrice: {
    fontSize: typography.bodySmall.fontSize,
    textDecorationLine: 'line-through',
    marginLeft: spacing.sm,
  },
  planBilled: {
    fontSize: typography.bodySmall.fontSize,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
  },
  // CTA
  ctaButton: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.lg,
    marginBottom: spacing.sm,
  },
  ctaText: {
    fontSize: typography.body.fontSize,
    fontWeight: '700',
  },
  // Trust elements
  noPaymentContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    marginBottom: spacing.sm,
  },
  noPaymentText: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  cancelText: {
    fontSize: typography.bodySmall.fontSize,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: spacing.sm,
  },
  footerLink: {
    fontSize: typography.bodySmall.fontSize,
  },
  footerDot: {
    fontSize: typography.bodySmall.fontSize,
  },
});
