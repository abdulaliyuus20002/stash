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
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/store/authStore';
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

export default function InsightsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const token = useAuthStore((state) => state.token);
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchInsights = useCallback(async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/api/insights`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setInsights(response.data);
    } catch (error) {
      console.error('Error fetching insights:', error);
    } finally {
      setIsLoading(false);
    }
  }, [token]);

  useEffect(() => {
    fetchInsights();
  }, [fetchInsights]);

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchInsights();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <ScrollView
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />
        }
      >
        {/* Weekly Digest Card */}
        {insights?.weekly_summary && (
          <View style={[styles.digestCard, { backgroundColor: colors.accent + '15' }]}>
            <View style={styles.digestHeader}>
              <View style={[styles.digestIcon, { backgroundColor: colors.accent }]}>
                <Ionicons name="sparkles" size={20} color={colors.primary} />
              </View>
              <Text style={[styles.digestTitle, { color: colors.text }]}>Weekly Digest</Text>
            </View>
            <Text style={[styles.digestText, { color: colors.textSecondary }]}>
              {insights.weekly_summary}
            </Text>
          </View>
        )}

        {/* Stats Overview */}
        <View style={styles.statsGrid}>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="bookmark" size={24} color={colors.accent} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{insights?.total_items || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Total Saves</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="trending-up" size={24} color={colors.success || '#22c55e'} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{insights?.items_this_week || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>This Week</Text>
          </View>
          <View style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <Ionicons name="folder" size={24} color={colors.accent} />
            <Text style={[styles.statNumber, { color: colors.text }]}>{insights?.collections_count || 0}</Text>
            <Text style={[styles.statLabel, { color: colors.textMuted }]}>Collections</Text>
          </View>
        </View>

        {/* Resurfaced Items */}
        {insights?.resurfaced_items && insights.resurfaced_items.length > 0 && (
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View style={styles.sectionTitleRow}>
                <Ionicons name="time-outline" size={20} color={colors.accent} />
                <Text style={[styles.sectionTitle, { color: colors.text }]}>Remember These?</Text>
              </View>
              <Text style={[styles.sectionSubtitle, { color: colors.textMuted }]}>
                Content you saved a while ago
              </Text>
            </View>
            {insights.resurfaced_items.map((item) => (
              <TouchableOpacity
                key={item.id}
                style={[styles.resurfacedCard, { backgroundColor: colors.card, borderColor: colors.border }]}
                onPress={() => router.push(`/item/${item.id}`)}
              >
                {item.thumbnail_url ? (
                  <Image source={{ uri: item.thumbnail_url }} style={styles.resurfacedImage} />
                ) : (
                  <View style={[styles.resurfacedImagePlaceholder, { backgroundColor: colors.inputBg }]}>
                    <Ionicons name="image-outline" size={24} color={colors.textMuted} />
                  </View>
                )}
                <View style={styles.resurfacedContent}>
                  <Text style={[styles.resurfacedTitle, { color: colors.text }]} numberOfLines={2}>
                    {item.title}
                  </Text>
                  <View style={styles.resurfacedMeta}>
                    <View style={[styles.platformBadge, { backgroundColor: colors.inputBg }]}>
                      <Text style={[styles.platformText, { color: colors.textSecondary }]}>
                        {item.platform}
                      </Text>
                    </View>
                    <Text style={[styles.daysAgo, { color: colors.accent }]}>
                      {item.message}
                    </Text>
                  </View>
                </View>
                <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
              </TouchableOpacity>
            ))}
          </View>
        )}

        {/* Top Platforms */}
        {insights?.top_platforms && insights.top_platforms.length > 0 && (
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Platforms</Text>
            <View style={styles.platformsContainer}>
              {insights.top_platforms.map((platform, index) => (
                <View
                  key={platform.platform}
                  style={[styles.platformBar, { backgroundColor: colors.card, borderColor: colors.border }]}
                >
                  <View style={styles.platformInfo}>
                    <Text style={[styles.platformRank, { color: colors.textMuted }]}>#{index + 1}</Text>
                    <Text style={[styles.platformName, { color: colors.text }]}>{platform.platform}</Text>
                  </View>
                  <View style={styles.platformCount}>
                    <View
                      style={[
                        styles.platformProgress,
                        {
                          backgroundColor: colors.accent,
                          width: `${Math.min((platform.count / (insights.top_platforms[0]?.count || 1)) * 100, 100)}%`,
                        },
                      ]}
                    />
                    <Text style={[styles.platformCountText, { color: colors.textSecondary }]}>
                      {platform.count}
                    </Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Top Tags */}
        {insights?.top_tags && insights.top_tags.length > 0 && (
          <View style={[styles.section, styles.lastSection]}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Top Tags</Text>
            <View style={styles.tagsContainer}>
              {insights.top_tags.map((tag) => (
                <View
                  key={tag.tag}
                  style={[styles.tagChip, { backgroundColor: colors.accent + '20' }]}
                >
                  <Text style={[styles.tagText, { color: colors.accent }]}>#{tag.tag}</Text>
                  <View style={[styles.tagCount, { backgroundColor: colors.accent }]}>
                    <Text style={[styles.tagCountText, { color: colors.primary }]}>{tag.count}</Text>
                  </View>
                </View>
              ))}
            </View>
          </View>
        )}

        {/* Empty state */}
        {!insights?.total_items && (
          <View style={styles.emptyContainer}>
            <View style={[styles.emptyIcon, { backgroundColor: colors.inputBg }]}>
              <Ionicons name="analytics-outline" size={48} color={colors.textMuted} />
            </View>
            <Text style={[styles.emptyTitle, { color: colors.text }]}>No insights yet</Text>
            <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
              Start saving content to see your personalized insights and analytics
            </Text>
            <TouchableOpacity
              style={[styles.emptyButton, { backgroundColor: colors.accent }]}
              onPress={() => router.push('/add-item')}
            >
              <Ionicons name="add" size={20} color={colors.primary} />
              <Text style={[styles.emptyButtonText, { color: colors.primary }]}>Save Content</Text>
            </TouchableOpacity>
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
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digestCard: {
    margin: spacing.md,
    padding: spacing.lg,
    borderRadius: borderRadius.xl,
  },
  digestHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  digestIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  digestTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
  },
  digestText: {
    fontSize: typography.body.fontSize,
    lineHeight: 24,
  },
  statsGrid: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 24,
    fontWeight: '700',
    marginTop: spacing.sm,
  },
  statLabel: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  section: {
    paddingHorizontal: spacing.md,
    marginBottom: spacing.lg,
  },
  lastSection: {
    marginBottom: spacing.xxl,
  },
  sectionHeader: {
    marginBottom: spacing.md,
  },
  sectionTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  sectionTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  sectionSubtitle: {
    fontSize: typography.bodySmall.fontSize,
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
    width: 60,
    height: 60,
    borderRadius: borderRadius.md,
  },
  resurfacedImagePlaceholder: {
    width: 60,
    height: 60,
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
    marginBottom: spacing.xs,
  },
  resurfacedMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  platformBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  platformText: {
    fontSize: 11,
    fontWeight: '500',
  },
  daysAgo: {
    fontSize: typography.caption.fontSize,
    fontWeight: '500',
  },
  platformsContainer: {
    gap: spacing.sm,
  },
  platformBar: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  platformInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    width: 120,
    gap: spacing.sm,
  },
  platformRank: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
  },
  platformName: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  platformCount: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  platformProgress: {
    height: 6,
    borderRadius: 3,
    flex: 1,
  },
  platformCountText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
    width: 30,
    textAlign: 'right',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  tagChip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingLeft: spacing.md,
    paddingRight: spacing.xs,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
    gap: spacing.sm,
  },
  tagText: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  tagCount: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.full,
    minWidth: 24,
    alignItems: 'center',
  },
  tagCountText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.xxl,
  },
  emptyIcon: {
    width: 96,
    height: 96,
    borderRadius: borderRadius.xl,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  emptyTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  emptyText: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  emptyButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.md,
    gap: spacing.sm,
  },
  emptyButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
