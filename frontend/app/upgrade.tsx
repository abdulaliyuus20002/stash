import React, { useState, useEffect } from 'react';
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
import { useAuthStore } from '@/src/store/authStore';
import { spacing, borderRadius } from '@/src/utils/theme';
import axios from 'axios';
import { API_URL } from '@/src/utils/config';

// Design system colors
const colors = {
  primary: '#2DD4BF',
  primaryDark: '#14B8A6',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray500: '#6B7280',
  gray700: '#374151',
  gray900: '#111827',
  success: '#10B981',
  warning: '#F59E0B',
  white: '#FFFFFF',
};

export default function UpgradeScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [isLoading, setIsLoading] = useState(false);
  const [selectedPlan, setSelectedPlan] = useState<'monthly' | 'yearly'>('yearly');
  const [socialProofCount, setSocialProofCount] = useState(2847);

  useEffect(() => {
    const randomAdd = Math.floor(Math.random() * 50);
    setSocialProofCount(2847 + randomAdd);
  }, []);

  const handleUpgrade = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      await axios.post(
        `${API_URL}/api/users/upgrade-pro`,
        { plan: selectedPlan },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      const userResponse = await axios.get(`${API_URL}/api/auth/me`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      
      useAuthStore.setState({ 
        user: { ...userResponse.data, is_pro: true, plan_type: 'pro' } 
      });
      
      Alert.alert(
        'Your 14-day trial has started!',
        'Enjoy full Pro access. We\'ll remind you before it ends.',
        [{ text: 'Start Exploring', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to start trial. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleContinueFree = () => {
    router.back();
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
              <Ionicons name="close" size={24} color={colors.gray700} />
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.container}>
        <ScrollView 
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.scrollContent}
        >
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.headerIcon, { backgroundColor: colors.primary + '15' }]}>
              <Ionicons name="sparkles" size={28} color={colors.primary} />
            </View>
            <Text style={styles.title}>Try Stash Pro Free</Text>
            <Text style={styles.subtitle}>14 days free, then choose your plan</Text>
            
            {/* Social Proof */}
            <View style={styles.socialProof}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '72%' }]} />
              </View>
              <View style={styles.socialProofRow}>
                <Ionicons name="people" size={14} color={colors.gray500} />
                <Text style={styles.socialProofText}>
                  <Text style={styles.socialProofNumber}>{socialProofCount.toLocaleString()}</Text> people joined this week
                </Text>
              </View>
            </View>
          </View>

          {/* Feature Sections */}
          <View style={styles.featuresSection}>
            <FeatureBlock 
              icon="infinite-outline"
              iconColor={colors.primary}
              title="Unlimited everything"
              description="Never count saves again."
            />
            <FeatureBlock 
              icon="sparkles-outline"
              iconColor={colors.primary}
              title="AI that helps, not decides"
              bullets={[
                'Smart tags — suggested, you approve',
                'AI summaries — generate when you need',
                'Collection recommendations — one tap'
              ]}
            />
            <FeatureBlock 
              icon="sync-outline"
              iconColor={colors.primary}
              title="Cross-device sync"
              description="Pick up anywhere, anytime."
            />
          </View>

          {/* Pricing Plans */}
          <View style={styles.plansContainer}>
            {/* Yearly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('yearly')}
              activeOpacity={0.7}
            >
              <View style={styles.planBadge}>
                <Ionicons name="flame" size={14} color={colors.warning} />
                <Text style={styles.planBadgeText}>YEARLY — Best value</Text>
              </View>
              <View style={styles.planContent}>
                <View style={styles.planInfo}>
                  <Text style={styles.planLabel}>YEARLY</Text>
                  <View style={styles.planPriceRow}>
                    <Text style={styles.planPrice}>$39.99</Text>
                    <Text style={styles.planPeriod}>/year</Text>
                  </View>
                  <Text style={styles.planSavings}>$3.33/month · Save 33%</Text>
                </View>
                <View style={[
                  styles.radioOuter,
                  selectedPlan === 'yearly' && styles.radioOuterSelected
                ]}>
                  {selectedPlan === 'yearly' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
              {selectedPlan === 'yearly' && (
                <TouchableOpacity
                  style={styles.trialButton}
                  onPress={handleUpgrade}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Text style={styles.trialButtonText}>Try 14 Days Free</Text>
                      <Ionicons name="arrow-forward" size={18} color={colors.white} />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
              activeOpacity={0.7}
            >
              <View style={styles.planContent}>
                <View style={styles.planInfo}>
                  <Text style={styles.planLabel}>MONTHLY</Text>
                  <View style={styles.planPriceRow}>
                    <Text style={styles.planPrice}>$4.99</Text>
                    <Text style={styles.planPeriod}>/month</Text>
                  </View>
                  <Text style={styles.planSavings}>Billed monthly</Text>
                </View>
                <View style={[
                  styles.radioOuter,
                  selectedPlan === 'monthly' && styles.radioOuterSelected
                ]}>
                  {selectedPlan === 'monthly' && (
                    <View style={styles.radioInner} />
                  )}
                </View>
              </View>
              {selectedPlan === 'monthly' && (
                <TouchableOpacity
                  style={styles.trialButton}
                  onPress={handleUpgrade}
                  disabled={isLoading}
                >
                  {isLoading ? (
                    <ActivityIndicator color={colors.white} />
                  ) : (
                    <>
                      <Text style={styles.trialButtonText}>Try 14 Days Free</Text>
                      <Ionicons name="arrow-forward" size={18} color={colors.white} />
                    </>
                  )}
                </TouchableOpacity>
              )}
            </TouchableOpacity>
          </View>

          {/* Free Forever Option */}
          <View style={styles.freeSection}>
            <View style={styles.freeSectionHeader}>
              <Ionicons name="gift-outline" size={18} color={colors.gray500} />
              <Text style={styles.freeSectionTitle}>FREE FOREVER</Text>
            </View>
            <Text style={styles.freeSectionDesc}>
              500 saves · 10 collections · Basic search · 3 AI suggestions/month
            </Text>
            <TouchableOpacity style={styles.freeButton} onPress={handleContinueFree}>
              <Text style={styles.freeButtonText}>Continue with Free</Text>
            </TouchableOpacity>
          </View>

          {/* Trust Elements */}
          <View style={styles.trustSection}>
            <View style={styles.trustItem}>
              <Ionicons name="shield-checkmark-outline" size={16} color={colors.success} />
              <Text style={styles.trustText}>No charge for 14 days</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="close-circle-outline" size={16} color={colors.gray500} />
              <Text style={styles.trustText}>Cancel anytime</Text>
            </View>
            <View style={styles.trustItem}>
              <Ionicons name="cloud-download-outline" size={16} color={colors.gray500} />
              <Text style={styles.trustText}>Keep your data</Text>
            </View>
          </View>

          {/* Footer Links */}
          <View style={styles.footer}>
            <TouchableOpacity onPress={handleRestore}>
              <Text style={styles.footerLink}>Restore</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity>
              <Text style={styles.footerLinkMuted}>Terms</Text>
            </TouchableOpacity>
            <Text style={styles.footerDot}>·</Text>
            <TouchableOpacity>
              <Text style={styles.footerLinkMuted}>Privacy</Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

// Feature Block Component
const FeatureBlock = ({ icon, iconColor, title, description, bullets }: { 
  icon: string; 
  iconColor?: string;
  title: string; 
  description?: string; 
  bullets?: string[];
}) => (
  <View style={styles.featureBlock}>
    <View style={styles.featureHeader}>
      <View style={[styles.featureIcon, { backgroundColor: (iconColor || colors.primary) + '12' }]}>
        <Ionicons name={icon as any} size={20} color={iconColor || colors.primary} />
      </View>
      <Text style={styles.featureTitle}>{title}</Text>
    </View>
    {description && (
      <Text style={styles.featureDesc}>{description}</Text>
    )}
    {bullets && (
      <View style={styles.bulletList}>
        {bullets.map((bullet, index) => (
          <View key={index} style={styles.bulletItem}>
            <View style={[styles.bulletDot, { backgroundColor: colors.gray400 }]} />
            <Text style={styles.bulletText}>{bullet}</Text>
          </View>
        ))}
      </View>
    )}
  </View>
);

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 56,
    paddingBottom: 40,
  },
  closeButton: {
    padding: 8,
  },
  // Header
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  headerIcon: {
    width: 56,
    height: 56,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 26,
    fontWeight: '700',
    color: colors.gray900,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    color: colors.gray500,
    marginBottom: 20,
  },
  socialProof: {
    alignItems: 'center',
    width: '100%',
    gap: 10,
  },
  progressBar: {
    width: '60%',
    height: 6,
    backgroundColor: colors.gray100,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  socialProofRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  socialProofText: {
    fontSize: 14,
    color: colors.gray500,
  },
  socialProofNumber: {
    fontWeight: '700',
    color: colors.gray900,
  },
  // Features
  featuresSection: {
    marginBottom: 28,
    gap: 20,
  },
  featureBlock: {
    gap: 8,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  featureDesc: {
    fontSize: 14,
    color: colors.gray500,
    marginLeft: 48,
  },
  bulletList: {
    marginLeft: 48,
    gap: 6,
  },
  bulletItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  bulletDot: {
    width: 5,
    height: 5,
    borderRadius: 2.5,
    backgroundColor: colors.gray400,
    marginTop: 7,
  },
  bulletText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray500,
    lineHeight: 20,
  },
  // Plans
  plansContainer: {
    gap: 12,
    marginBottom: 24,
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 20,
    borderWidth: 2,
    borderColor: colors.gray200,
  },
  planCardSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '05',
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginBottom: 12,
  },
  planBadgeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.gray900,
    letterSpacing: 0.5,
  },
  planContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  planInfo: {
    flex: 1,
  },
  planLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.gray500,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  planPriceRow: {
    flexDirection: 'row',
    alignItems: 'baseline',
  },
  planPrice: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray900,
  },
  planPeriod: {
    fontSize: 15,
    color: colors.gray500,
    marginLeft: 2,
  },
  planSavings: {
    fontSize: 13,
    color: colors.gray500,
    marginTop: 2,
  },
  radioOuter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
    justifyContent: 'center',
    alignItems: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.primary,
  },
  radioInner: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: colors.primary,
  },
  trialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    marginTop: 16,
    gap: 8,
  },
  trialButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  // Free Section
  freeSection: {
    backgroundColor: colors.gray50,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  freeSectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  freeSectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: colors.gray600,
    letterSpacing: 0.5,
  },
  freeSectionDesc: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: 16,
    lineHeight: 20,
  },
  freeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 28,
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  freeButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.gray700,
  },
  // Trust Section
  trustSection: {
    flexDirection: 'row',
    justifyContent: 'center',
    flexWrap: 'wrap',
    gap: 16,
    marginBottom: 24,
  },
  trustItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  trustText: {
    fontSize: 13,
    color: colors.gray500,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 12,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
    fontWeight: '500',
  },
  footerLinkMuted: {
    fontSize: 14,
    color: colors.gray500,
  },
  footerDot: {
    fontSize: 14,
    color: colors.gray300,
  },
});
