import React, { useEffect, useState } from 'react';
import { 
  View, 
  Text, 
  StyleSheet, 
  FlatList, 
  RefreshControl, 
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter, Stack } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useTheme } from '@/src/hooks/useTheme';
import { useCollectionsStore } from '@/src/store/collectionsStore';
import { useItemsStore } from '@/src/store/itemsStore';
import { useAuthStore } from '@/src/store/authStore';
import { SavedItem, Collection } from '@/src/types';
import { spacing, typography, borderRadius } from '@/src/utils/theme';
import { API_URL } from '@/src/utils/config';

export default function CollectionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { collections } = useCollectionsStore();
  const { deleteItem } = useItemsStore();
  const token = useAuthStore((state) => state.token);

  const [items, setItems] = useState<SavedItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [collection, setCollection] = useState<Collection | null>(null);
  const [deletingItemId, setDeletingItemId] = useState<string | null>(null);

  useEffect(() => {
    const col = collections.find((c) => c.id === id);
    if (col) setCollection(col);
  }, [collections, id]);

  useEffect(() => {
    if (token && id) {
      fetchItems();
    }
  }, [token, id]);

  const fetchItems = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/api/items?collection=${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
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

  const handleDeleteItem = (item: SavedItem) => {
    Alert.alert(
      'Delete Save',
      `Are you sure you want to delete "${item.title}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Delete', 
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            setDeletingItemId(item.id);
            try {
              await deleteItem(token, item.id);
              // Remove from local state
              setItems(prev => prev.filter(i => i.id !== item.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item. Please try again.');
            } finally {
              setDeletingItemId(null);
            }
          }
        }
      ]
    );
  };

  const handleRemoveFromCollection = (item: SavedItem) => {
    Alert.alert(
      'Remove from Collection',
      `Remove "${item.title}" from this collection? The item will still be in your Inbox.`,
      [
        { text: 'Cancel', style: 'cancel' },
        { 
          text: 'Remove', 
          style: 'destructive',
          onPress: async () => {
            if (!token || !id) return;
            setDeletingItemId(item.id);
            try {
              // Update the item to remove this collection
              const updatedCollections = (item.collections || []).filter(c => c !== id);
              await axios.put(
                `${API_URL}/api/items/${item.id}`,
                { collections: updatedCollections },
                { headers: { Authorization: `Bearer ${token}` } }
              );
              // Remove from local state
              setItems(prev => prev.filter(i => i.id !== item.id));
            } catch (error) {
              Alert.alert('Error', 'Failed to remove item from collection. Please try again.');
            } finally {
              setDeletingItemId(null);
            }
          }
        }
      ]
    );
  };

  const renderItem = ({ item }: { item: SavedItem }) => (
    <TouchableOpacity 
      style={[styles.itemCard, { backgroundColor: colors.card, borderColor: colors.border }]}
      onPress={() => router.push(`/item/${item.id}`)}
      activeOpacity={0.7}
    >
      <View style={styles.itemContent}>
        {/* Thumbnail */}
        {item.thumbnail_url ? (
          <View style={[styles.thumbnail, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="image-outline" size={24} color={colors.textMuted} />
          </View>
        ) : (
          <View style={[styles.thumbnail, { backgroundColor: colors.inputBg }]}>
            <Ionicons 
              name={getPlatformIcon(item.platform)} 
              size={24} 
              color={colors.textMuted} 
            />
          </View>
        )}

        {/* Info */}
        <View style={styles.itemInfo}>
          <Text style={[styles.itemTitle, { color: colors.text }]} numberOfLines={2}>
            {item.title || 'Untitled'}
          </Text>
          <View style={styles.itemMeta}>
            <Ionicons 
              name={getPlatformIcon(item.platform)} 
              size={12} 
              color={colors.textMuted} 
            />
            <Text style={[styles.itemPlatform, { color: colors.textMuted }]}>
              {item.platform || 'Web'}
            </Text>
            {item.tags && item.tags.length > 0 && (
              <>
                <Text style={[styles.itemDot, { color: colors.textMuted }]}>·</Text>
                <Text style={[styles.itemTags, { color: colors.textMuted }]} numberOfLines={1}>
                  {item.tags.slice(0, 2).map(t => `#${t}`).join(' ')}
                </Text>
              </>
            )}
          </View>
        </View>

        {/* Actions */}
        <View style={styles.itemActions}>
          {deletingItemId === item.id ? (
            <ActivityIndicator size="small" color={colors.accent} />
          ) : (
            <TouchableOpacity 
              style={[styles.actionButton, { backgroundColor: colors.inputBg }]}
              onPress={() => {
                Alert.alert(
                  'Item Options',
                  'What would you like to do?',
                  [
                    { text: 'Cancel', style: 'cancel' },
                    { 
                      text: 'Remove from Collection', 
                      onPress: () => handleRemoveFromCollection(item)
                    },
                    { 
                      text: 'Delete Permanently', 
                      style: 'destructive',
                      onPress: () => handleDeleteItem(item)
                    },
                  ]
                );
              }}
            >
              <Ionicons name="ellipsis-horizontal" size={18} color={colors.textSecondary} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );

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
      <Stack.Screen options={{ title: collection?.name || 'Collection' }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
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
            renderItem={renderItem}
            contentContainerStyle={[styles.listContent, items.length === 0 && styles.emptyList]}
            ListEmptyComponent={renderEmpty}
            refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.accent} />}
            showsVerticalScrollIndicator={false}
          />
        )}
      </SafeAreaView>
    </>
  );
}

// Helper function to get platform icon
const getPlatformIcon = (platform?: string): string => {
  switch (platform?.toLowerCase()) {
    case 'youtube': return 'logo-youtube';
    case 'twitter': return 'logo-twitter';
    case 'instagram': return 'logo-instagram';
    case 'linkedin': return 'logo-linkedin';
    case 'tiktok': return 'logo-tiktok';
    case 'medium': return 'logo-medium';
    default: return 'globe-outline';
  }
};

const styles = StyleSheet.create({
  container: { flex: 1 },
  statsBar: { 
    paddingVertical: spacing.sm, 
    paddingHorizontal: spacing.md, 
    borderBottomWidth: 1 
  },
  statsText: { fontSize: typography.bodySmall.fontSize },
  listContent: { 
    paddingHorizontal: spacing.md, 
    paddingTop: spacing.md, 
    paddingBottom: spacing.xl,
    gap: spacing.sm,
  },
  emptyList: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  emptyContainer: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    paddingHorizontal: spacing.xl 
  },
  emptyIcon: { 
    width: 96, 
    height: 96, 
    borderRadius: borderRadius.xl, 
    justifyContent: 'center', 
    alignItems: 'center', 
    marginBottom: spacing.lg 
  },
  emptyTitle: { 
    fontSize: typography.h3.fontSize, 
    fontWeight: '600', 
    marginBottom: spacing.sm 
  },
  emptyText: { 
    fontSize: typography.body.fontSize, 
    textAlign: 'center', 
    lineHeight: 22 
  },
  // Item Card Styles
  itemCard: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  itemContent: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    gap: spacing.md,
  },
  thumbnail: {
    width: 56,
    height: 56,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  itemInfo: {
    flex: 1,
    gap: 4,
  },
  itemTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    lineHeight: 20,
  },
  itemMeta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  itemPlatform: {
    fontSize: 12,
  },
  itemDot: {
    fontSize: 12,
  },
  itemTags: {
    fontSize: 12,
    flex: 1,
  },
  itemActions: {
    paddingLeft: spacing.sm,
  },
  actionButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
