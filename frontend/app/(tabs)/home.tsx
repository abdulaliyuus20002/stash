import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Image,
  useWindowDimensions,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/store/authStore';
import { useItemsStore } from '@/src/store/itemsStore';
import { useCollectionsStore } from '@/src/store/collectionsStore';
import { ItemCard } from '@/src/components';
import { spacing, typography, borderRadius } from '@/src/utils/theme';
import axios from 'axios';
import { API_URL } from '@/src/utils/config';

interface InsightsData {
  total_items: number;
  items_this_week: number;
  top_platforms: { platform: string; count: number }[];
  top_tags: { tag: string; count: number }[];
  collections_count: number;
  weekly_summary: string | null;
  resurfaced_items: {
    id: string;
    title: string;
    thumbnail_url: string | null;
    platform: string;
    days_ago: number;
    message: string;
  }[];
}

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const token = useAuthStore((state) => state.token);
  const { items, isLoading: itemsLoading, fetchItems } = useItemsStore();
  const { collections, isLoading: collectionsLoading, fetchCollections } = useCollectionsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [insightsLoading, setInsightsLoading] = useState(false);
  
  // Responsive dimensions
  const { width } = useWindowDimensions();
  const isSmallScreen = width < 380;
  const isMediumScreen = width >= 380 && width < 768;
  const isLargeScreen = width >= 768;

  const fetchInsights = useCallback(async () => {
    if (!token) return;
    setInsightsLoading(true);
    try {
      const response = await axios.get(`${API_URL}/api/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInsights(response.data);
    } catch (error) {
      console.log('Insights fetch error:', error);
    } finally {
      setInsightsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    if (token) {
      fetchItems(token);
      fetchCollections(token);
      fetchInsights();
    }
  }, [token]);

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await Promise.all([fetchItems(token), fetchCollections(token), fetchInsights()]);
    setRefreshing(false);
  };

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const recentItems = items.slice(0, 3);
  const isLoading = itemsLoading || collectionsLoading;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Header / Greeting */}
        <View style={styles.header}>
          <View>
            <Text style={[styles.greeting, { color: colors.textSecondary }]}>{getGreeting()}</Text>
            <Text style={[styles.userName, { color: colors.text }]}>
              {user?.name || 'there'}
            </Text>
          </View>
          <TouchableOpacity
            style={[styles.addButton, { backgroundColor: colors.accent }]}
            onPress={() => router.push('/add-item')}
          >
            <Ionicons name="add" size={24} color={colors.primary} />
          </TouchableOpacity>
        </View>

        {/* Stats Cards */}
        <View style={[styles.statsContainer, isSmallScreen && styles.statsContainerSmall]}>
          <TouchableOpacity
            style={[
              styles.statCard, 
              { backgroundColor: colors.card, borderColor: colors.border },
              isSmallScreen && styles.statCardSmall
            ]}
            onPress={() => router.push('/(tabs)/index')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.accent + '20' }, isSmallScreen && styles.statIconSmall]}>
              <Ionicons name="bookmark" size={isSmallScreen ? 20 : 24} color={colors.accent} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }, isSmallScreen && styles.statNumberSmall]}>{items.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }, isSmallScreen && styles.statLabelSmall]}>Saved</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard, 
              { backgroundColor: colors.card, borderColor: colors.border },
              isSmallScreen && styles.statCardSmall
            ]}
            onPress={() => router.push('/(tabs)/collections')}
            activeOpacity={0.7}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.accent + '20' }, isSmallScreen && styles.statIconSmall]}>
              <Ionicons name="folder" size={isSmallScreen ? 20 : 24} color={colors.accent} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }, isSmallScreen && styles.statNumberSmall]}>{collections.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }, isSmallScreen && styles.statLabelSmall]}>Collections</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.statCard, 
              { backgroundColor: colors.card, borderColor: colors.border },
              isSmallScreen && styles.statCardSmall
            ]}
            onPress={() => {}}
            activeOpacity={0.9}
          >
            <View style={[styles.statIconContainer, { backgroundColor: '#22c55e20' }, isSmallScreen && styles.statIconSmall]}>
              <Ionicons name="trending-up" size={isSmallScreen ? 20 : 24} color="#22c55e" />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }, isSmallScreen && styles.statNumberSmall]}>{insights?.items_this_week || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }, isSmallScreen && styles.statLabelSmall]}>This Week</Text>
          </TouchableOpacity>
        </View>

        {/* Weekly Digest / AI Summary */}
        {insights?.weekly_summary && (
          <View style={styles.section}>
            <View style={[styles.digestCard, { backgroundColor: colors.accent + '15' }]}>
              <View style={styles.digestHeader}>
                <View style={[styles.digestIcon, { backgroundColor: colors.accent }]}>
                  <Ionicons name="sparkles" size={18} color={colors.primary} />
                </View>
                <Text style={[styles.digestTitle, { color: colors.text }]}>Weekly Insights</Text>
              </View>
              <Text style={[styles.digestText, { color: colors.textSecondary }]}>
                {insights.weekly_summary}
              </Text>
            </View>
          </View>
        )}

        {/* Resurfaced Items - "Remember These?" */}
        {insights?.resurfaced_items && insights.resurfaced_items.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="time-outline" size={20} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Remember These?</Text>
              </View>
            </View>
            {insights.resurfaced_items.slice(0, 2).map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.resurfacedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/item/${item.id}`)}
              >
                {item.thumbnail_url ? (
                  <Image source={{ uri: item.thumbnail_url }} style={styles.resurfacedImage} />
                ) : (
                  <View style={[styles.resurfacedImagePlaceholder, { backgroundColor: colors.inputBg }]}>
                    <Ionicons name="image-outline" size={20} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.resurfacedContent}>
                  <Text style={[styles.resurfacedTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <Text style={[styles.resurfacedDays, { color: colors.accent }]}>
                    {item.message}
                  </Text>
                </View>
                <Ionicons name="chevron-forward" size={18} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Quick Actions */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { color: colors.text }]}>Quick Actions</Text>
          <View style={styles.quickActions}>
            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/add-item')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="add" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Save Content</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/search')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.inputBg }]}>
                <Ionicons name="search" size={20} color={colors.textSecondary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Search</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, { backgroundColor: colors.card, borderColor: colors.border }]}
              onPress={() => router.push('/(tabs)/collections')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.inputBg }]}>
                <Ionicons name="folder-open" size={20} color={colors.textSecondary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Collections</Text>
            </TouchableOpacity>
          </View>
        </View>

        {/* Recent Items */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Recent Items</Text>
            {items.length > 0 && (
              <TouchableOpacity onPress={() => router.push('/(tabs)/index')}>
                <Text style={[styles.seeAll, { color: colors.accent }]}>See All</Text>
              </TouchableOpacity>
            )}
          </View>

          {isLoading && items.length === 0 ? (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.accent} />
            </View>
          ) : recentItems.length > 0 ? (
            <View style={styles.recentItems}>
              {recentItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  onPress={() => router.push(`/item/${item.id}`)}
                />
              ))}
            </View>
          ) : (
            <View style={[styles.emptyState, { backgroundColor: colors.card, borderColor: colors.border }]}>
              <Ionicons name="bookmark-outline" size={32} color={colors.textMuted} />
              <Text style={[styles.emptyTitle, { color: colors.text }]}>No items yet</Text>
              <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
                Save your first piece of content to get started
              </Text>
              <TouchableOpacity
                style={[styles.emptyButton, { backgroundColor: colors.accent }]}
                onPress={() => router.push('/add-item')}
              >
                <Text style={[styles.emptyButtonText, { color: colors.primary }]}>Save Content</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Collections Preview */}
        {collections.length > 0 && (
          <View style={[styles.section, styles.lastSection]}>
            <View style={styles.sectionHeader}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Your Collections</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/collections')}>
                <Text style={[styles.seeAll, { color: colors.accent }]}>See All</Text>
              </TouchableOpacity>
            </View>

            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.collectionsScroll}>
              {collections.slice(0, 5).map((collection) => (
                <TouchableOpacity
                  key={collection.id}
                  style={[styles.collectionChip, { backgroundColor: colors.card, borderColor: colors.border }]}
                  onPress={() => router.push(`/collection/${collection.id}`)}
                >
                  <Ionicons name="folder" size={18} color={colors.accent} />
                  <Text style={[styles.collectionName, { color: colors.text }]} numberOfLines={1}>
                    {collection.name}
                  </Text>
                  <Text style={[styles.collectionCount, { color: colors.textMuted }]}>
                    {collection.item_count}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  greeting: {
    fontSize: typography.body.fontSize,
    marginBottom: 4,
  },
  userName: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
  },
  addButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
  },
  statsContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.sm,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  statNumber: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 2,
  },
  statLabel: {
    fontSize: 11,
  },
  digestCard: {
    padding: spacing.md,
    borderRadius: borderRadius.lg,
  },
  digestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
    gap: spacing.sm,
  },
  digestIcon: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digestTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  digestText: {
    fontSize: typography.body.fontSize,
    lineHeight: 22,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  resurfacedCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  resurfacedImage: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
  },
  resurfacedImagePlaceholder: {
    width: 50,
    height: 50,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resurfacedContent: {
    flex: 1,
  },
  resurfacedTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    marginBottom: 4,
  },
  resurfacedDays: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  lastSection: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
  },
  seeAll: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  quickActions: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  actionIcon: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  actionText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  loadingContainer: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  recentItems: {
    gap: spacing.sm,
  },
  emptyState: {
    padding: spacing.xl,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  emptyTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  emptyText: {
    fontSize: typography.bodySmall.fontSize,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  emptyButton: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
  },
  emptyButtonText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  collectionsScroll: {
    marginHorizontal: -spacing.md,
    paddingHorizontal: spacing.md,
  },
  collectionChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    marginRight: spacing.sm,
    gap: spacing.sm,
  },
  collectionName: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    maxWidth: 120,
  },
  collectionCount: {
    fontSize: typography.bodySmall.fontSize,
  },
});
