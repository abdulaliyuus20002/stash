import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/store/authStore';
import { spacing, typography, borderRadius } from '@/src/utils/theme';
import axios from 'axios';
import { API_URL } from '@/src/utils/config';

interface PlanInfo {
  plan_type: string;
  is_pro: boolean;
  usage: {
    items_count: number;
    collections_count: number;
    items_limit: number;
    collections_limit: number;
  };
  features: {
    unlimited_collections: boolean;
    advanced_search: boolean;
    smart_reminders: boolean;
    vault_export: boolean;
    ai_features: boolean;
  };
}

export default function ProfileScreen() {
  const { colors } = useTheme();
  const { user, logout } = useAuthStore();
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [planInfo, setPlanInfo] = useState<PlanInfo | null>(null);
  const [isExporting, setIsExporting] = useState(false);

  useEffect(() => {
    if (token) {
      fetchPlanInfo();
    }
  }, [token]);

  const fetchPlanInfo = async () => {
    try {
      const response = await axios.get(`${API_URL}/api/users/plan`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setPlanInfo(response.data);
    } catch (error) {
      console.log('Plan fetch error:', error);
    }
  };

  const handleExport = async () => {
    if (!planInfo?.is_pro) {
      Alert.alert(
        'Pro Feature',
        'Vault export is available for Pro users. Upgrade to export your data.',
        [
          { text: 'Cancel', style: 'cancel' },
          { text: 'Upgrade', onPress: () => router.push('/upgrade') }
        ]
      );
      return;
    }

    setIsExporting(true);
    try {
      const response = await axios.get(`${API_URL}/api/export/vault`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      Alert.alert(
        'Export Ready',
        `Your vault has been exported: ${response.data.statistics.total_items} items and ${response.data.statistics.total_collections} collections.`,
        [{ text: 'OK' }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to export vault.');
    } finally {
      setIsExporting(false);
    }
  };

  const handleLogout = () => {
    Alert.alert(
      'Sign Out',
      'Are you sure you want to sign out?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Sign Out',
          style: 'destructive',
          onPress: logout,
        },
      ]
    );
  };

  const isPro = planInfo?.is_pro || user?.plan_type === 'pro';

  const menuItems = [
    {
      icon: 'person-outline',
      title: 'Account',
      subtitle: user?.email,
      onPress: () => {},
    },
    {
      icon: 'diamond-outline',
      title: 'Plan',
      subtitle: isPro ? 'Pro' : 'Free',
      badge: !isPro ? 'Upgrade' : undefined,
      onPress: () => router.push('/upgrade'),
      highlight: !isPro,
    },
    {
      icon: 'download-outline',
      title: 'Export Vault',
      subtitle: isPro ? 'Backup your data' : 'Pro feature',
      badge: !isPro ? 'PRO' : undefined,
      onPress: handleExport,
      loading: isExporting,
    },
    {
      icon: 'color-palette-outline',
      title: 'Appearance',
      subtitle: 'System default',
      onPress: () => {},
    },
    {
      icon: 'notifications-outline',
      title: 'Notifications',
      subtitle: isPro ? 'Smart reminders on' : 'Pro feature',
      badge: !isPro ? 'PRO' : undefined,
      onPress: () => {
        if (!isPro) {
          Alert.alert('Pro Feature', 'Smart reminders are available for Pro users.', [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/upgrade') }
          ]);
        }
      },
    },
    {
      icon: 'shield-checkmark-outline',
      title: 'Privacy',
      subtitle: 'Your data is private',
      onPress: () => {},
    },
    {
      icon: 'help-circle-outline',
      title: 'Help & Support',
      onPress: () => {},
    },
  ];

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Profile Header */}
        <View style={styles.profileHeader}>
          <View style={[styles.avatar, { backgroundColor: colors.accent }]}>
            <Text style={[styles.avatarText, { color: colors.primary }]}>
              {user?.name?.[0]?.toUpperCase() || user?.email?.[0]?.toUpperCase() || '?'}
            </Text>
          </View>
          <Text style={[styles.userName, { color: colors.text }]}>
            {user?.name || 'User'}
          </Text>
          <Text style={[styles.userEmail, { color: colors.textSecondary }]}>
            {user?.email}
          </Text>
          <TouchableOpacity 
            style={[
              styles.planBadge, 
              { backgroundColor: isPro ? colors.accent : colors.accent + '20' }
            ]}
            onPress={() => !isPro && router.push('/upgrade')}
          >
            <Ionicons
              name={isPro ? 'diamond' : 'sparkles-outline'}
              size={14}
              color={isPro ? colors.primary : colors.accent}
            />
            <Text style={[styles.planText, { color: isPro ? colors.primary : colors.accent }]}>
              {isPro ? 'Pro Plan' : 'Free Plan'}
            </Text>
            {!isPro && (
              <Ionicons name="chevron-forward" size={14} color={colors.accent} />
            )}
          </TouchableOpacity>
        </View>

        {/* Usage Stats for Free Users */}
        {!isPro && planInfo && (
          <View style={[styles.usageCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Text style={[styles.usageTitle, { color: colors.text }]}>Usage</Text>
            <View style={styles.usageRow}>
              <View style={styles.usageItem}>
                <Text style={[styles.usageCount, { color: colors.text }]}>
                  {planInfo.usage.items_count}/{planInfo.usage.items_limit === -1 ? '∞' : planInfo.usage.items_limit}
                </Text>
                <Text style={[styles.usageLabel, { color: colors.textMuted }]}>Items</Text>
              </View>
              <View style={[styles.usageDivider, { backgroundColor: colors.border }]} />
              <View style={styles.usageItem}>
                <Text style={[styles.usageCount, { color: colors.text }]}>
                  {planInfo.usage.collections_count}/{planInfo.usage.collections_limit === -1 ? '∞' : planInfo.usage.collections_limit}
                </Text>
                <Text style={[styles.usageLabel, { color: colors.textMuted }]}>Collections</Text>
              </View>
            </View>
            <TouchableOpacity 
              style={[styles.upgradeButton, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/upgrade')}
            >
              <Ionicons name="diamond" size={16} color={colors.primary} />
              <Text style={[styles.upgradeText, { color: colors.primary }]}>Upgrade for Unlimited</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Menu Items */}
        <View style={styles.menuSection}>
          {menuItems.map((item, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.menuItem,
                { backgroundColor: colors.card, borderColor: item.highlight ? colors.accent : colors.border },
              ]}
              onPress={item.onPress}
              activeOpacity={0.7}
            >
              <View style={[styles.menuIcon, { backgroundColor: item.highlight ? colors.accent + '20' : colors.inputBg }]}>
                <Ionicons name={item.icon as any} size={20} color={item.highlight ? colors.accent : colors.textSecondary} />
              </View>
              <View style={styles.menuContent}>
                <Text style={[styles.menuTitle, { color: colors.text }]}>{item.title}</Text>
                {item.subtitle && (
                  <Text style={[styles.menuSubtitle, { color: colors.textMuted }]}>
                    {item.subtitle}
                  </Text>
                )}
              </View>
              {item.loading ? (
                <ActivityIndicator size="small" color={colors.accent} />
              ) : (
                <>
                  {item.badge && (
                    <View style={[styles.badge, { backgroundColor: item.badge === 'PRO' ? colors.textMuted : colors.accent }]}>
                      <Text style={[styles.badgeText, { color: colors.primary }]}>
                        {item.badge}
                      </Text>
                    </View>
                  )}
                  <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
                </>
              )}
            </TouchableOpacity>
          ))}
        </View>

        {/* Logout Button */}
        <TouchableOpacity
          style={[
            styles.logoutButton,
            { backgroundColor: colors.card, borderColor: colors.error },
          ]}
          onPress={handleLogout}
        >
          <Ionicons name="log-out-outline" size={20} color={colors.error} />
          <Text style={[styles.logoutText, { color: colors.error }]}>Sign Out</Text>
        </TouchableOpacity>

        <Text style={[styles.version, { color: colors.textMuted }]}>Version 1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  profileHeader: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
    paddingHorizontal: spacing.md,
  },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  avatarText: {
    fontSize: 32,
    fontWeight: '700',
  },
  userName: {
    fontSize: typography.h2.fontSize,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  userEmail: {
    fontSize: typography.body.fontSize,
    marginBottom: spacing.md,
  },
  planBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.xs,
  },
  planText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  usageCard: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  usageTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  usageRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  usageItem: {
    flex: 1,
    alignItems: 'center',
  },
  usageCount: {
    fontSize: 24,
    fontWeight: '700',
  },
  usageLabel: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  usageDivider: {
    width: 1,
    height: 40,
  },
  upgradeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  upgradeText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  menuSection: {
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  menuIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  menuContent: {
    flex: 1,
  },
  menuTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  menuSubtitle: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginRight: spacing.sm,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: spacing.md,
    marginTop: spacing.xl,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
  },
  logoutText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  version: {
    textAlign: 'center',
    fontSize: typography.caption.fontSize,
    marginTop: spacing.lg,
    marginBottom: spacing.xl,
  },
});
