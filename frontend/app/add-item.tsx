import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useItemsStore } from '@/src/store/itemsStore';
import { useCollectionsStore } from '@/src/store/collectionsStore';
import { Button, TextInput } from '@/src/components';
import { MetadataResponse } from '@/src/types';
import { spacing, typography, borderRadius } from '@/src/utils/theme';

export default function AddItemScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { addItem, extractMetadata } = useItemsStore();
  const { collections, fetchCollections } = useCollectionsStore();

  const [url, setUrl] = useState('');
  const [title, setTitle] = useState('');
  const [notes, setNotes] = useState('');
  const [tags, setTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  const [metadata, setMetadata] = useState<MetadataResponse | null>(null);
  const [isExtracting, setIsExtracting] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showCollections, setShowCollections] = useState(false);

  useEffect(() => {
    fetchCollections();
  }, []);

  const handleExtractMetadata = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    // Validate URL format
    try {
      new URL(url.startsWith('http') ? url : `https://${url}`);
    } catch {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setIsExtracting(true);
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      const result = await extractMetadata(fullUrl);
      setMetadata(result);
      setTitle(result.title);
      setTags(result.suggested_tags);
    } catch (error) {
      console.error('Extract metadata error:', error);
      Alert.alert('Note', 'Could not extract metadata. You can enter details manually.');
    } finally {
      setIsExtracting(false);
    }
  };

  const handleAddTag = () => {
    const tag = tagInput.trim().toLowerCase();
    if (tag && !tags.includes(tag)) {
      setTags([...tags, tag]);
    }
    setTagInput('');
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  const toggleCollection = (collectionId: string) => {
    if (selectedCollections.includes(collectionId)) {
      setSelectedCollections(selectedCollections.filter((id) => id !== collectionId));
    } else {
      setSelectedCollections([...selectedCollections, collectionId]);
    }
  };

  const handleSave = async () => {
    if (!url.trim()) {
      Alert.alert('Error', 'Please enter a URL');
      return;
    }

    setIsSaving(true);
    try {
      const fullUrl = url.startsWith('http') ? url : `https://${url}`;
      await addItem(fullUrl, {
        title: title || fullUrl,
        thumbnail_url: metadata?.thumbnail_url,
        platform: metadata?.platform || 'Web',
        content_type: metadata?.content_type || 'article',
        notes,
        tags,
        collections: selectedCollections,
      });
      router.back();
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.detail || 'Failed to save item');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['bottom']}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* URL Input */}
          <View style={styles.urlSection}>
            <TextInput
              label="URL"
              value={url}
              onChangeText={setUrl}
              placeholder="Paste a link here..."
              autoCapitalize="none"
              keyboardType="url"
              autoCorrect={false}
            />
            <Button
              title={isExtracting ? 'Extracting...' : 'Extract Info'}
              onPress={handleExtractMetadata}
              loading={isExtracting}
              variant="secondary"
              size="sm"
            />
          </View>

          {/* Platform Badge */}
          {metadata && (
            <View style={styles.metadataPreview}>
              <View style={[styles.platformBadge, { backgroundColor: colors.inputBg }]}>
                <Ionicons name="link" size={16} color={colors.textSecondary} />
                <Text style={[styles.platformText, { color: colors.textSecondary }]}>
                  {metadata.platform} • {metadata.content_type}
                </Text>
              </View>
            </View>
          )}

          {/* Title */}
          <TextInput
            label="Title"
            value={title}
            onChangeText={setTitle}
            placeholder="Enter a title..."
            multiline
            numberOfLines={2}
          />

          {/* Notes */}
          <TextInput
            label="Notes (optional)"
            value={notes}
            onChangeText={setNotes}
            placeholder="Add notes about this content..."
            multiline
            numberOfLines={4}
            style={{ minHeight: 100, textAlignVertical: 'top' }}
          />

          {/* Tags */}
          <View style={styles.tagsSection}>
            <Text style={[styles.sectionLabel, { color: colors.text }]}>Tags</Text>
            <View style={styles.tagInputRow}>
              <View style={{ flex: 1 }}>
                <TextInput
                  value={tagInput}
                  onChangeText={setTagInput}
                  placeholder="Add a tag..."
                  onSubmitEditing={handleAddTag}
                  returnKeyType="done"
                  containerStyle={{ marginBottom: 0 }}
                />
              </View>
              <TouchableOpacity
                style={[styles.addTagButton, { backgroundColor: colors.accent }]}
                onPress={handleAddTag}
              >
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {tags.length > 0 && (
              <View style={styles.tagsContainer}>
                {tags.map((tag, index) => (
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
          <View style={styles.collectionsSection}>
            <TouchableOpacity
              style={styles.collectionHeader}
              onPress={() => setShowCollections(!showCollections)}
            >
              <Text style={[styles.sectionLabel, { color: colors.text }]}>
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
                {collections.length === 0 ? (
                  <Text style={[styles.noCollections, { color: colors.textMuted }]}>
                    No collections yet. Create one in the Collections tab.
                  </Text>
                ) : (
                  collections.map((collection) => (
                    <TouchableOpacity
                      key={collection.id}
                      style={[
                        styles.collectionItem,
                        { borderBottomColor: colors.border },
                      ]}
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
                  ))
                )}
              </View>
            )}
          </View>
        </ScrollView>

        {/* Save Button */}
        <View style={[styles.footer, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
          <Button
            title="Save to Stash"
            onPress={handleSave}
            loading={isSaving}
            size="lg"
          />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  scrollContent: {
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.lg,
  },
  urlSection: {
    marginBottom: spacing.sm,
  },
  metadataPreview: {
    marginBottom: spacing.md,
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: borderRadius.sm,
    gap: spacing.xs,
  },
  platformText: {
    fontSize: typography.bodySmall.fontSize,
  },
  tagsSection: {
    marginBottom: spacing.md,
  },
  sectionLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
    marginBottom: spacing.sm,
  },
  tagInputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
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
  collectionsSection: {
    marginBottom: spacing.md,
  },
  collectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  collectionsList: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    overflow: 'hidden',
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
  noCollections: {
    padding: spacing.md,
    textAlign: 'center',
    fontSize: typography.bodySmall.fontSize,
  },
  footer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
});
