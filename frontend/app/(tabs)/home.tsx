import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
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

export default function HomeScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const token = useAuthStore((state) => state.token);
  const { items, isLoading: itemsLoading, fetchItems } = useItemsStore();
  const { collections, isLoading: collectionsLoading, fetchCollections } = useCollectionsStore();
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    if (token) {
      fetchItems(token);
      fetchCollections(token);
    }
  }, [token]);

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await Promise.all([fetchItems(token), fetchCollections(token)]);
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
        <View style={styles.statsContainer}>
          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/index')}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="bookmark" size={24} color={colors.accent} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{items.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Saved Items</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.statCard, { backgroundColor: colors.card, borderColor: colors.border }]}
            onPress={() => router.push('/(tabs)/collections')}
          >
            <View style={[styles.statIconContainer, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="folder" size={24} color={colors.accent} />
            </View>
            <Text style={[styles.statNumber, { color: colors.text }]}>{collections.length}</Text>
            <Text style={[styles.statLabel, { color: colors.textSecondary }]}>Collections</Text>
          </TouchableOpacity>
        </View>

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
              onPress={() => router.push('/(tabs)/insights')}
            >
              <View style={[styles.actionIcon, { backgroundColor: colors.inputBg }]}>
                <Ionicons name="analytics" size={20} color={colors.textSecondary} />
              </View>
              <Text style={[styles.actionText, { color: colors.text }]}>Insights</Text>
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
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    alignItems: 'center',
  },
  statIconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.full,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  statNumber: {
    fontSize: 28,
    fontWeight: '700',
    marginBottom: 4,
  },
  statLabel: {
    fontSize: typography.bodySmall.fontSize,
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
