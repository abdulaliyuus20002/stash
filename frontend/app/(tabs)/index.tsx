import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useFocusEffect } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useItemsStore } from '@/src/store/itemsStore';
import { ItemCard } from '@/src/components';
import { spacing, typography, borderRadius } from '@/src/utils/theme';

export default function InboxScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { items, isLoading, fetchItems, sortOrder, setSortOrder, platformFilter, setPlatformFilter } = useItemsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showFilters, setShowFilters] = useState(false);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [sortOrder, platformFilter])
  );

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const platforms = ['All', 'YouTube', 'X', 'Instagram', 'TikTok', 'LinkedIn', 'Web'];

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.inputBg }]}>
        <Ionicons name="file-tray-outline" size={48} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>Your inbox is empty</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Save your first piece of content by tapping the + button above
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.accent }]}
        onPress={() => router.push('/add-item')}
      >
        <Ionicons name="add" size={20} color={colors.primary} />
        <Text style={[styles.emptyButtonText, { color: colors.primary }]}>Save Content</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      {/* Filters */}
      <View style={styles.filterSection}>
        <TouchableOpacity
          style={[styles.filterButton, { backgroundColor: colors.inputBg }]}
          onPress={() => setShowFilters(!showFilters)}
        >
          <Ionicons name="filter" size={18} color={colors.textSecondary} />
          <Text style={[styles.filterButtonText, { color: colors.textSecondary }]}>
            {platformFilter || 'All Platforms'}
          </Text>
          <Ionicons name={showFilters ? 'chevron-up' : 'chevron-down'} size={16} color={colors.textMuted} />
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.sortButton, { backgroundColor: colors.inputBg }]}
          onPress={() => setSortOrder(sortOrder === 'newest' ? 'oldest' : 'newest')}
        >
          <Ionicons name="swap-vertical" size={18} color={colors.textSecondary} />
          <Text style={[styles.sortText, { color: colors.textSecondary }]}>
            {sortOrder === 'newest' ? 'Newest' : 'Oldest'}
          </Text>
        </TouchableOpacity>
      </View>

      {showFilters && (
        <View style={[styles.platformFilters, { backgroundColor: colors.card, borderColor: colors.border }]}>
          {platforms.map((platform) => (
            <TouchableOpacity
              key={platform}
              style={[
                styles.platformChip,
                {
                  backgroundColor:
                    (platform === 'All' && !platformFilter) || platformFilter === platform
                      ? colors.accent
                      : colors.inputBg,
                },
              ]}
              onPress={() => {
                setPlatformFilter(platform === 'All' ? null : platform);
                setShowFilters(false);
              }}
            >
              <Text
                style={[
                  styles.platformChipText,
                  {
                    color:
                      (platform === 'All' && !platformFilter) || platformFilter === platform
                        ? colors.primary
                        : colors.textSecondary,
                  },
                ]}
              >
                {platform}
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {isLoading && items.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={items}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => router.push(`/item/${item.id}`)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            items.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={renderEmpty}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              tintColor={colors.accent}
            />
          }
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  filterSection: {
    flexDirection: 'row',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
  },
  filterButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  filterButtonText: {
    fontSize: 14,
    fontWeight: '500',
  },
  sortButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.md,
    gap: spacing.xs,
  },
  sortText: {
    fontSize: 14,
    fontWeight: '500',
  },
  platformFilters: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    gap: spacing.sm,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  platformChip: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
  },
  platformChipText: {
    fontSize: 13,
    fontWeight: '500',
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.sm,
    paddingBottom: spacing.xl,
  },
  emptyList: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
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
