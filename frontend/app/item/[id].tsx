import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Image,
  Linking,
  TextInput as RNTextInput,
  Modal,
} from 'react-native';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../../src/hooks/useTheme';
import { useItemsStore } from '../../src/store/itemsStore';
import { useCollectionsStore } from '../../src/store/collectionsStore';
import { SavedItem } from '../../src/types';
import { Button } from '../../src/components';
import { spacing, typography, borderRadius } from '../../src/utils/theme';
import { format } from 'date-fns';
import api from '../../src/utils/api';

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { updateItem, deleteItem } = useItemsStore();
  const { collections, fetchCollections } = useCollectionsStore();

  const [item, setItem] = useState<SavedItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showCollections, setShowCollections] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);

  useFocusEffect(
    useCallback(() => {
      fetchItem();
      fetchCollections();
    }, [id])
  );

  const fetchItem = async () => {
    try {
      const response = await api.get(`/items/${id}`);
      const fetchedItem = response.data;
      setItem(fetchedItem);
      setEditedNotes(fetchedItem.notes || '');
      setEditedTags(fetchedItem.tags || []);
      setSelectedCollections(fetchedItem.collections || []);
    } catch (error) {
      Alert.alert('Error', 'Could not load item');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    if (!item) return;

    setIsSaving(true);
    try {
      await updateItem(item.id, {
        notes: editedNotes,
        tags: editedTags,
        collections: selectedCollections,
      });
      Alert.alert('Success', 'Changes saved');
    } catch (error) {
      Alert.alert('Error', 'Failed to save changes');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Item',
      'Are you sure you want to delete this item?',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteItem(item!.id);
              router.back();
            } catch (error) {
              Alert.alert('Error', 'Failed to delete item');
            }
          },
        },
      ]
    );
  };

  const handleOpenUrl = () => {
    if (item?.url) {
      Linking.openURL(item.url);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !editedTags.includes(tag)) {
      setEditedTags([...editedTags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setEditedTags(editedTags.filter((t) => t !== tagToRemove));
  };

  const toggleCollection = (collectionId: string) => {
    if (selectedCollections.includes(collectionId)) {
      setSelectedCollections(selectedCollections.filter((id) => id !== collectionId));
    } else {
      setSelectedCollections([...selectedCollections, collectionId]);
    }
  };

  if (isLoading) {
    return (
      <View style={[styles.loadingContainer, { backgroundColor: colors.background }]}>
        <ActivityIndicator size="large" color={colors.accent} />
      </View>
    );
  }

  if (!item) return null;

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <ScrollView showsVerticalScrollIndicator={false}>
        {/* Thumbnail */}
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="image-outline" size={48} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.content}>
          {/* Header */}
          <View style={styles.header}>
            <View style={[styles.platformBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.platformText, { color: colors.primary }]}>
                {item.platform}
              </Text>
            </View>
            <Text style={[styles.date, { color: colors.textMuted }]}>
              {format(new Date(item.created_at), 'MMM d, yyyy')}
            </Text>
          </View>

          {/* Title */}
          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>

          {/* URL */}
          <TouchableOpacity style={styles.urlRow} onPress={handleOpenUrl}>
            <Ionicons name="link" size={18} color={colors.accent} />
            <Text style={[styles.url, { color: colors.accent }]} numberOfLines={1}>
              {item.url}
            </Text>
            <Ionicons name="open-outline" size={18} color={colors.accent} />
          </TouchableOpacity>

          {/* Notes */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <RNTextInput
              style={[
                styles.notesInput,
                { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
              ]}
              value={editedNotes}
              onChangeText={setEditedNotes}
              placeholder="Add notes..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </View>

          {/* Tags */}
          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
            <View style={styles.tagInputRow}>
              <RNTextInput
                style={[
                  styles.tagInput,
                  { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border },
                ]}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add a tag..."
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <TouchableOpacity
                style={[styles.addTagButton, { backgroundColor: colors.accent }]}
                onPress={handleAddTag}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {editedTags.length > 0 && (
              <View style={styles.tagsContainer}>
                {editedTags.map((tag, index) => (
                  <TouchableOpacity
                    key={index}
                    style={[styles.tag, { backgroundColor: colors.inputBg }]}
                    onPress={() => handleRemoveTag(tag)}
                  >
                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
                    <Ionicons name="close" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Collections */}
          <View style={styles.section}>
            <TouchableOpacity
              style={styles.sectionHeader}
              onPress={() => setShowCollections(!showCollections)}
            >
              <Text style={[styles.sectionTitle, { color: colors.text }]}>
                Collections ({selectedCollections.length})
              </Text>
              <Ionicons
                name={showCollections ? 'chevron-up' : 'chevron-down'}
                size={20}
                color={colors.textMuted}
              />
            </TouchableOpacity>

            {showCollections && (
              <View style={[styles.collectionsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {collections.map((collection) => (
                  <TouchableOpacity
                    key={collection.id}
                    style={[styles.collectionItem, { borderBottomColor: colors.border }]}
                    onPress={() => toggleCollection(collection.id)}
                  >
                    <Ionicons
                      name={selectedCollections.includes(collection.id) ? 'checkbox' : 'square-outline'}
                      size={22}
                      color={selectedCollections.includes(collection.id) ? colors.accent : colors.textMuted}
                    />
                    <Text style={[styles.collectionName, { color: colors.text }]}>
                      {collection.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          {/* Actions */}
          <View style={styles.actions}>
            <Button title="Save Changes" onPress={handleSave} loading={isSaving} size="lg" />
            <TouchableOpacity style={styles.deleteButton} onPress={handleDelete}>
              <Ionicons name="trash-outline" size={20} color={colors.error} />
              <Text style={[styles.deleteText, { color: colors.error }]}>Delete Item</Text>
            </TouchableOpacity>
          </View>
        </View>
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
  thumbnail: {
    width: '100%',
    height: 200,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 150,
    justifyContent: 'center',
    alignItems: 'center',
  },
  content: {
    padding: spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  platformBadge: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  platformText: {
    fontSize: 12,
    fontWeight: '600',
  },
  date: {
    fontSize: typography.caption.fontSize,
  },
  title: {
    fontSize: typography.h2.fontSize,
    fontWeight: '600',
    marginBottom: spacing.md,
    lineHeight: 32,
  },
  urlRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  url: {
    flex: 1,
    fontSize: typography.bodySmall.fontSize,
  },
  section: {
    marginBottom: spacing.lg,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionTitle: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  notesInput: {
    borderWidth: 1,
    borderRadius: borderRadius.md,
    padding: spacing.md,
    fontSize: typography.body.fontSize,
    minHeight: 120,
  },
  tagInputRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  tagInput: {
    flex: 1,
    borderWidth: 1,
    borderRadius: borderRadius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: typography.body.fontSize,
  },
  addTagButton: {
    width: 44,
    height: 44,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  tag: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  tagText: {
    fontSize: typography.bodySmall.fontSize,
  },
  collectionsList: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    marginTop: spacing.sm,
  },
  collectionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    gap: spacing.sm,
  },
  collectionName: {
    fontSize: typography.body.fontSize,
  },
  actions: {
    marginTop: spacing.lg,
    gap: spacing.md,
  },
  deleteButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  deleteText: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
});
