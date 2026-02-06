import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  RefreshControl,
  ActivityIndicator,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useCollectionsStore } from '../../src/store/collectionsStore';
import { ItemCard } from '../../src/components';
import { SavedItem, Collection } from '../../src/types';
import { spacing, typography, borderRadius } from '../../src/utils/theme';
import api from '../../src/utils/api';

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { collections } = useCollectionsStore();

  const [items, setItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collection, setCollection] = useState<Collection | null>(null);

  useFocusEffect(
    useCallback(() => {
      fetchItems();
    }, [id])
  );

  useEffect(() => {
    const col = collections.find((c) => c.id === id);
    if (col) setCollection(col);
  }, [collections, id]);

  const fetchItems = async () => {
    try {
      const response = await api.get(`/items?collection=${id}`);
      setItems(response.data);
    } catch (error) {
      console.error('Error fetching collection items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await fetchItems();
    setRefreshing(false);
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.inputBg }]}>
        <Ionicons name="folder-open-outline" size={48} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No items yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Add items to this collection when saving content
      </Text>
    </View>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: collection?.name || 'Collection',
        }}
      />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
        {/* Header Stats */}
        <View style={[styles.statsBar, { backgroundColor: colors.card, borderColor: colors.border }]}>
          <Text style={[styles.statsText, { color: colors.textSecondary }]}>
            {items.length} {items.length === 1 ? 'item' : 'items'}
          </Text>
        </View>

        {isLoading ? (
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
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  statsBar: {
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderBottomWidth: 1,
  },
  statsText: {
    fontSize: typography.bodySmall.fontSize,
  },
  listContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
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
  },
});
