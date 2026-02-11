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

  // Simulate dynamic social proof (would come from backend)
  useEffect(() => {
    const randomAdd = Math.floor(Math.random() * 50);
    setSocialProofCount(2847 + randomAdd);
  }, []);

  const handleUpgrade = async () => {
    if (!token) return;
    
    setIsLoading(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/users/upgrade-pro`,
        { plan: selectedPlan },
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
              <Ionicons name="close" size={24} color={colors.gray900} />
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
            <Text style={styles.title}>✨ Try Stash Pro Free — 14 Days</Text>
            
            {/* Social Proof Counter */}
            <View style={styles.socialProof}>
              <View style={styles.progressBar}>
                <View style={[styles.progressFill, { width: '75%' }]} />
              </View>
              <Text style={styles.socialProofText}>
                <Text style={styles.socialProofNumber}>{socialProofCount.toLocaleString()}</Text> people joined this week
              </Text>
            </View>
          </View>

          {/* Feature Sections */}
          <View style={styles.featuresSection}>
            {/* Unlimited Everything */}
            <View style={styles.featureBlock}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureEmoji}>📦</Text>
                <Text style={styles.featureTitle}>Unlimited everything</Text>
              </View>
              <Text style={styles.featureDesc}>Never count saves again.</Text>
            </View>

            {/* AI that helps */}
            <View style={styles.featureBlock}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureEmoji}>🤖</Text>
                <Text style={styles.featureTitle}>AI that helps, not decides</Text>
              </View>
              <View style={styles.featureList}>
                <Text style={styles.featureListItem}>• Smart tags — suggested, you approve</Text>
                <Text style={styles.featureListItem}>• AI summaries — generate when you need them</Text>
                <Text style={styles.featureListItem}>• Collection recommendations — one tap to add</Text>
              </View>
            </View>

            {/* Cross-device sync */}
            <View style={styles.featureBlock}>
              <View style={styles.featureHeader}>
                <Text style={styles.featureEmoji}>🔄</Text>
                <Text style={styles.featureTitle}>Cross-device sync</Text>
              </View>
              <Text style={styles.featureDesc}>Pick up anywhere, anytime.</Text>
            </View>
          </View>

          {/* Pricing Plans */}
          <View style={styles.plansContainer}>
            {/* Yearly Plan - Best Value */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'yearly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('yearly')}
            >
              <View style={styles.bestValueBadge}>
                <Text style={styles.bestValueText}>🔥 YEARLY — Best value</Text>
              </View>
              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>$39.99</Text>
                <Text style={styles.planPeriod}>/year</Text>
              </View>
              <Text style={styles.planSavings}>($3.33/month • Save 33%)</Text>
              
              <TouchableOpacity
                style={styles.trialButton}
                onPress={handleUpgrade}
                disabled={isLoading || selectedPlan !== 'yearly'}
              >
                {isLoading && selectedPlan === 'yearly' ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.trialButtonText}>Try 14 Days Free</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.white} />
                  </>
                )}
              </TouchableOpacity>
            </TouchableOpacity>

            {/* Monthly Plan */}
            <TouchableOpacity
              style={[
                styles.planCard,
                selectedPlan === 'monthly' && styles.planCardSelected,
              ]}
              onPress={() => setSelectedPlan('monthly')}
            >
              <View style={styles.monthlyHeader}>
                <Text style={styles.monthlyLabel}>📱 MONTHLY</Text>
              </View>
              <View style={styles.planPricing}>
                <Text style={styles.planPrice}>$4.99</Text>
                <Text style={styles.planPeriod}>/month</Text>
              </View>
              
              <TouchableOpacity
                style={[styles.trialButton, selectedPlan !== 'monthly' && styles.trialButtonInactive]}
                onPress={handleUpgrade}
                disabled={isLoading || selectedPlan !== 'monthly'}
              >
                {isLoading && selectedPlan === 'monthly' ? (
                  <ActivityIndicator color={colors.white} />
                ) : (
                  <>
                    <Text style={styles.trialButtonText}>Try 14 Days Free</Text>
                    <Ionicons name="arrow-forward" size={18} color={colors.white} />
                  </>
                )}
              </TouchableOpacity>
            </TouchableOpacity>
          </View>

          {/* Free Forever Option */}
          <View style={styles.freeForeverSection}>
            <View style={styles.freeForeverHeader}>
              <Text style={styles.freeForeverEmoji}>🕊️</Text>
              <Text style={styles.freeForeverTitle}>FREE FOREVER</Text>
            </View>
            <Text style={styles.freeForeverDesc}>
              500 saves • 10 collections • Basic search • 3 AI suggestions/month
            </Text>
            <TouchableOpacity style={styles.freeButton} onPress={handleContinueFree}>
              <Text style={styles.freeButtonText}>Continue with Free</Text>
            </TouchableOpacity>
          </View>

          {/* Trust Elements */}
          <View style={styles.trustSection}>
            <Text style={styles.trustText}>
              ✓ No charge for 14 days  ✓ Cancel anytime  ✓ Keep your data
            </Text>
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  scrollContent: {
    paddingHorizontal: 24,
    paddingTop: 60,
    paddingBottom: 32,
  },
  closeButton: {
    padding: 8,
  },
  header: {
    marginBottom: 24,
  },
  title: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.gray900,
    textAlign: 'center',
    marginBottom: 16,
  },
  socialProof: {
    alignItems: 'center',
    gap: 8,
  },
  progressBar: {
    width: '60%',
    height: 6,
    backgroundColor: colors.gray200,
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    backgroundColor: colors.primary,
    borderRadius: 3,
  },
  socialProofText: {
    fontSize: 14,
    color: colors.gray500,
  },
  socialProofNumber: {
    fontWeight: '700',
    color: colors.gray900,
  },
  // Features Section
  featuresSection: {
    marginBottom: 24,
    gap: 20,
  },
  featureBlock: {
    gap: 4,
  },
  featureHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  featureEmoji: {
    fontSize: 20,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
  },
  featureDesc: {
    fontSize: 14,
    color: colors.gray500,
    paddingLeft: 28,
  },
  featureList: {
    paddingLeft: 28,
    gap: 4,
  },
  featureListItem: {
    fontSize: 14,
    color: colors.gray500,
    lineHeight: 20,
  },
  // Plans
  plansContainer: {
    gap: 16,
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
  bestValueBadge: {
    marginBottom: 12,
  },
  bestValueText: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray900,
  },
  monthlyHeader: {
    marginBottom: 12,
  },
  monthlyLabel: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray700,
  },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'baseline',
    marginBottom: 4,
  },
  planPrice: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gray900,
  },
  planPeriod: {
    fontSize: 16,
    color: colors.gray500,
    marginLeft: 4,
  },
  planSavings: {
    fontSize: 14,
    color: colors.gray500,
    marginBottom: 16,
  },
  trialButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: 8,
  },
  trialButtonInactive: {
    backgroundColor: colors.gray200,
  },
  trialButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  // Free Forever
  freeForeverSection: {
    backgroundColor: colors.gray50,
    borderRadius: 16,
    padding: 20,
    marginBottom: 24,
    alignItems: 'center',
  },
  freeForeverHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
  freeForeverEmoji: {
    fontSize: 20,
  },
  freeForeverTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: colors.gray700,
  },
  freeForeverDesc: {
    fontSize: 14,
    color: colors.gray500,
    textAlign: 'center',
    marginBottom: 16,
  },
  freeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 48,
    paddingHorizontal: 32,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray300,
  },
  freeButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
  },
  // Trust Section
  trustSection: {
    marginBottom: 24,
  },
  trustText: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  footerLink: {
    fontSize: 14,
    color: colors.primary,
  },
  footerLinkMuted: {
    fontSize: 14,
    color: colors.gray500,
  },
  footerDot: {
    fontSize: 14,
    color: colors.gray500,
  },
});
