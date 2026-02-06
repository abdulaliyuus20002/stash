import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  RefreshControl,
  ActivityIndicator,
  Alert,
  Modal,
  TextInput as RNTextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useCollectionsStore } from '@/src/store/collectionsStore';
import { useAuthStore } from '@/src/store/authStore';
import { CollectionCard, Button } from '@/src/components';
import { spacing, typography, borderRadius } from '@/src/utils/theme';

export default function CollectionsScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { user } = useAuthStore();
  const token = useAuthStore((state) => state.token);
  const { collections, isLoading, fetchCollections, addCollection, updateCollection, deleteCollection } = useCollectionsStore();
  const [refreshing, setRefreshing] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [newName, setNewName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const maxCollections = user?.plan_type === 'pro' ? Infinity : 5;

  useEffect(() => {
    if (token) {
      fetchCollections(token).catch((err) => {
        console.log('Collections fetch error:', err);
      });
    }
  }, [token]);

  const onRefresh = async () => {
    if (!token) return;
    setRefreshing(true);
    await fetchCollections(token);
    setRefreshing(false);
  };

  const handleOpenModal = (collection?: { id: string; name: string }) => {
    if (collection) {
      setEditingId(collection.id);
      setNewName(collection.name);
    } else {
      if (collections.length >= maxCollections) {
        Alert.alert(
          'Collection Limit Reached',
          `Free plan is limited to ${maxCollections} collections. Upgrade to Pro for unlimited collections.`,
          [{ text: 'OK' }]
        );
        return;
      }
      setEditingId(null);
      setNewName('');
    }
    setShowModal(true);
  };

  const handleSubmit = async () => {
    if (!newName.trim()) {
      Alert.alert('Error', 'Please enter a collection name');
      return;
    }

    if (!token) {
      Alert.alert('Error', 'Please log in first');
      return;
    }

    setIsSubmitting(true);
    try {
      if (editingId) {
        await updateCollection(token, editingId, newName.trim());
      } else {
        await addCollection(token, newName.trim());
      }
      setShowModal(false);
      setNewName('');
      setEditingId(null);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save collection');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = (id: string, name: string) => {
    Alert.alert(
      'Delete Collection',
      `Are you sure you want to delete "${name}"? Items in this collection will not be deleted.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            if (!token) return;
            try {
              await deleteCollection(token, id);
            } catch (error) {
              Alert.alert('Error', 'Failed to delete collection');
            }
          },
        },
      ]
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <View style={[styles.emptyIcon, { backgroundColor: colors.inputBg }]}>
        <Ionicons name="folder-outline" size={48} color={colors.textMuted} />
      </View>
      <Text style={[styles.emptyTitle, { color: colors.text }]}>No collections yet</Text>
      <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
        Create collections to organize your saved content
      </Text>
      <TouchableOpacity
        style={[styles.emptyButton, { backgroundColor: colors.accent }]}
        onPress={() => handleOpenModal()}
      >
        <Ionicons name="add" size={20} color={colors.primary} />
        <Text style={[styles.emptyButtonText, { color: colors.primary }]}>New Collection</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <View style={styles.header}>
        <Text style={[styles.collectionCount, { color: colors.textSecondary }]}>
          {collections.length} / {maxCollections === Infinity ? '∞' : maxCollections} collections
        </Text>
        <TouchableOpacity
          style={[styles.addButton, { backgroundColor: colors.accent }]}
          onPress={() => handleOpenModal()}
        >
          <Ionicons name="add" size={20} color={colors.primary} />
        </TouchableOpacity>
      </View>

      {isLoading && collections.length === 0 ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={collections}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <CollectionCard
              collection={item}
              onPress={() => router.push(`/collection/${item.id}`)}
              onEdit={() => handleOpenModal({ id: item.id, name: item.name })}
              onDelete={() => handleDelete(item.id, item.name)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            collections.length === 0 && styles.emptyList,
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

      {/* Create/Edit Modal */}
      <Modal
        visible={showModal}
        animationType="slide"
        transparent
        onRequestClose={() => setShowModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { backgroundColor: colors.card }]}>
            <View style={styles.modalHeader}>
              <Text style={[styles.modalTitle, { color: colors.text }]}>
                {editingId ? 'Edit Collection' : 'New Collection'}
              </Text>
              <TouchableOpacity onPress={() => setShowModal(false)}>
                <Ionicons name="close" size={24} color={colors.textMuted} />
              </TouchableOpacity>
            </View>

            <RNTextInput
              style={[
                styles.modalInput,
                { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
              ]}
              value={newName}
              onChangeText={setNewName}
              placeholder="Collection name"
              placeholderTextColor={colors.textMuted}
              autoFocus
            />

            <View style={styles.modalButtons}>
              <Button
                title="Cancel"
                onPress={() => setShowModal(false)}
                variant="outline"
                style={{ flex: 1 }}
              />
              <Button
                title={editingId ? 'Save' : 'Create'}
                onPress={handleSubmit}
                loading={isSubmitting}
                style={{ flex: 1 }}
              />
            </View>
          </View>
        </View>
      </Modal>
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
    paddingVertical: spacing.sm,
  },
  collectionCount: {
    fontSize: typography.bodySmall.fontSize,
  },
  addButton: {
    width: 36,
    height: 36,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
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
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    borderTopLeftRadius: borderRadius.xl,
    borderTopRightRadius: borderRadius.xl,
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  modalTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '600',
  },
  modalInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    marginBottom: spacing.lg,
  },
  modalButtons: {
    flexDirection: 'row',
    gap: spacing.md,
  },
});
