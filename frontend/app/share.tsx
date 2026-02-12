import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Image,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams, Stack } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/store/authStore';
import { useCollectionsStore } from '@/src/store/collectionsStore';
import { useItemsStore } from '@/src/store/itemsStore';
import { spacing, typography, borderRadius } from '@/src/utils/theme';
import { API_URL } from '@/src/utils/config';
import { Collection } from '@/src/types';

// Metadata extraction service
interface LinkMetadata {
  url: string;
  title: string;
  description?: string;
  image?: string;
  platform: string;
  siteName?: string;
}

const extractMetadata = async (url: string): Promise<LinkMetadata> => {
  try {
    // Call backend to extract metadata
    const response = await axios.post(`${API_URL}/api/extract-metadata`, { url });
    return {
      url,
      title: response.data.title || 'Untitled',
      description: response.data.description,
      image: response.data.thumbnail_url,
      platform: response.data.platform || 'Web',
      siteName: response.data.site_name,
    };
  } catch (error) {
    // Fallback - try to detect platform from URL
    const platform = detectPlatform(url);
    return {
      url,
      title: 'Untitled',
      platform,
    };
  }
};

const detectPlatform = (url: string): string => {
  const urlLower = url.toLowerCase();
  if (urlLower.includes('youtube.com') || urlLower.includes('youtu.be')) return 'YouTube';
  if (urlLower.includes('instagram.com')) return 'Instagram';
  if (urlLower.includes('twitter.com') || urlLower.includes('x.com')) return 'Twitter';
  if (urlLower.includes('linkedin.com')) return 'LinkedIn';
  if (urlLower.includes('tiktok.com')) return 'TikTok';
  if (urlLower.includes('medium.com')) return 'Medium';
  if (urlLower.includes('reddit.com')) return 'Reddit';
  if (urlLower.includes('pinterest.com')) return 'Pinterest';
  if (urlLower.includes('spotify.com')) return 'Spotify';
  return 'Web';
};

const getPlatformIcon = (platform: string): string => {
  switch (platform.toLowerCase()) {
    case 'youtube': return 'logo-youtube';
    case 'instagram': return 'logo-instagram';
    case 'twitter': return 'logo-twitter';
    case 'linkedin': return 'logo-linkedin';
    case 'tiktok': return 'logo-tiktok';
    case 'reddit': return 'logo-reddit';
    case 'pinterest': return 'logo-pinterest';
    default: return 'globe-outline';
  }
};

const getPlatformColor = (platform: string): string => {
  switch (platform.toLowerCase()) {
    case 'youtube': return '#FF0000';
    case 'instagram': return '#E4405F';
    case 'twitter': return '#1DA1F2';
    case 'linkedin': return '#0077B5';
    case 'tiktok': return '#000000';
    case 'reddit': return '#FF4500';
    case 'pinterest': return '#BD081C';
    case 'spotify': return '#1DB954';
    default: return '#6B7280';
  }
};

export default function ShareScreen() {
  const router = useRouter();
  const params = useLocalSearchParams<{ url?: string; text?: string }>();
  const { colors } = useTheme();
  const token = useAuthStore((state) => state.token);
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated);
  const { collections, fetchCollections } = useCollectionsStore();
  const { createItem } = useItemsStore();

  const [sharedUrl, setSharedUrl] = useState('');
  const [metadata, setMetadata] = useState<LinkMetadata | null>(null);
  const [isLoadingMetadata, setIsLoadingMetadata] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [editableTitle, setEditableTitle] = useState('');
  const [note, setNote] = useState('');
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [showCollectionPicker, setShowCollectionPicker] = useState(false);

  // Extract URL from shared content
  useEffect(() => {
    let url = params.url || '';
    
    // If text contains a URL, extract it
    if (!url && params.text) {
      const urlMatch = params.text.match(/(https?:\/\/[^\s]+)/);
      if (urlMatch) {
        url = urlMatch[1];
      }
    }
    
    if (url) {
      setSharedUrl(url);
      loadMetadata(url);
    }
  }, [params.url, params.text]);

  // Fetch collections on mount
  useEffect(() => {
    if (token) {
      fetchCollections(token);
    }
  }, [token]);

  const loadMetadata = async (url: string) => {
    setIsLoadingMetadata(true);
    try {
      const data = await extractMetadata(url);
      setMetadata(data);
      setEditableTitle(data.title);
    } catch (error) {
      setMetadata({
        url,
        title: 'Untitled',
        platform: detectPlatform(url),
      });
      setEditableTitle('Untitled');
    } finally {
      setIsLoadingMetadata(false);
    }
  };

  const handleSave = async () => {
    if (!token || !sharedUrl) {
      Alert.alert('Error', 'Please enter a valid URL');
      return;
    }

    setIsSaving(true);
    try {
      await createItem(token, {
        url: sharedUrl,
        title: editableTitle || metadata?.title || 'Untitled',
        notes: note,
        collections: selectedCollection ? [selectedCollection] : [],
        platform: metadata?.platform,
        thumbnail_url: metadata?.image,
      });

      // Success feedback
      Alert.alert(
        'Saved!',
        'Content added to your Stash Pro',
        [{ text: 'Done', onPress: () => router.back() }]
      );
    } catch (error) {
      Alert.alert('Error', 'Failed to save. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const selectedCollectionData = collections.find(c => c.id === selectedCollection);

  // If not authenticated, show login prompt
  if (!isAuthenticated) {
    return (
      <>
        <Stack.Screen options={{ title: 'Save to Stash Pro', headerShown: false }} />
        <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
          <View style={styles.authPrompt}>
            <View style={[styles.authIcon, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="lock-closed" size={32} color={colors.accent} />
            </View>
            <Text style={[styles.authTitle, { color: colors.text }]}>Sign in Required</Text>
            <Text style={[styles.authText, { color: colors.textSecondary }]}>
              Please open Stash Pro and sign in to save content.
            </Text>
            <TouchableOpacity
              style={[styles.authButton, { backgroundColor: colors.accent }]}
              onPress={() => router.replace('/login')}
            >
              <Text style={[styles.authButtonText, { color: colors.white }]}>Open Stash Pro</Text>
            </TouchableOpacity>
          </View>
        </SafeAreaView>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: '', headerShown: false }} />
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <KeyboardAvoidingView 
          style={styles.keyboardView}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          {/* Header */}
          <View style={[styles.header, { borderBottomColor: colors.border }]}>
            <TouchableOpacity onPress={handleCancel} style={styles.headerButton}>
              <Text style={[styles.cancelText, { color: colors.textSecondary }]}>Cancel</Text>
            </TouchableOpacity>
            <View style={styles.headerTitle}>
              <Ionicons name="layers" size={20} color={colors.accent} />
              <Text style={[styles.headerTitleText, { color: colors.text }]}>Stash Pro</Text>
            </View>
            <TouchableOpacity 
              onPress={handleSave} 
              style={[styles.saveButton, { backgroundColor: colors.accent }]}
              disabled={isSaving || !sharedUrl}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <Text style={[styles.saveButtonText, { color: colors.white }]}>Save</Text>
              )}
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
            {/* Preview Card */}
            <View style={[styles.previewCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
              {isLoadingMetadata ? (
                <View style={styles.loadingPreview}>
                  <ActivityIndicator size="large" color={colors.accent} />
                  <Text style={[styles.loadingText, { color: colors.textSecondary }]}>
                    Fetching preview...
                  </Text>
                </View>
              ) : (
                <>
                  {/* Preview Image */}
                  {metadata?.image ? (
                    <Image 
                      source={{ uri: metadata.image }} 
                      style={styles.previewImage}
                      resizeMode="cover"
                    />
                  ) : (
                    <View style={[styles.previewImagePlaceholder, { backgroundColor: colors.inputBg }]}>
                      <Ionicons 
                        name={getPlatformIcon(metadata?.platform || 'Web')} 
                        size={48} 
                        color={getPlatformColor(metadata?.platform || 'Web')} 
                      />
                    </View>
                  )}

                  {/* Platform Badge */}
                  <View style={[styles.platformBadge, { backgroundColor: getPlatformColor(metadata?.platform || 'Web') + '20' }]}>
                    <Ionicons 
                      name={getPlatformIcon(metadata?.platform || 'Web')} 
                      size={14} 
                      color={getPlatformColor(metadata?.platform || 'Web')} 
                    />
                    <Text style={[styles.platformText, { color: getPlatformColor(metadata?.platform || 'Web') }]}>
                      {metadata?.platform || 'Web'}
                    </Text>
                  </View>

                  {/* URL */}
                  <Text style={[styles.urlText, { color: colors.textMuted }]} numberOfLines={1}>
                    {sharedUrl}
                  </Text>
                </>
              )}
            </View>

            {/* Title Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Title</Text>
              <TextInput
                style={[styles.textInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                value={editableTitle}
                onChangeText={setEditableTitle}
                placeholder="Enter title"
                placeholderTextColor={colors.textMuted}
              />
            </View>

            {/* Collection Selector */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Collection</Text>
              <TouchableOpacity
                style={[styles.collectionSelector, { backgroundColor: colors.inputBg, borderColor: colors.border }]}
                onPress={() => setShowCollectionPicker(!showCollectionPicker)}
              >
                {selectedCollectionData ? (
                  <View style={styles.selectedCollection}>
                    <Ionicons name="folder" size={18} color={colors.accent} />
                    <Text style={[styles.collectionName, { color: colors.text }]}>
                      {selectedCollectionData.name}
                    </Text>
                  </View>
                ) : (
                  <Text style={[styles.collectionPlaceholder, { color: colors.textMuted }]}>
                    Select collection (optional)
                  </Text>
                )}
                <Ionicons name="chevron-down" size={18} color={colors.textMuted} />
              </TouchableOpacity>

              {/* Collection Picker Dropdown */}
              {showCollectionPicker && (
                <View style={[styles.collectionDropdown, { backgroundColor: colors.card, borderColor: colors.border }]}>
                  <TouchableOpacity
                    style={styles.collectionOption}
                    onPress={() => {
                      setSelectedCollection(null);
                      setShowCollectionPicker(false);
                    }}
                  >
                    <Ionicons name="close-circle-outline" size={18} color={colors.textMuted} />
                    <Text style={[styles.collectionOptionText, { color: colors.textMuted }]}>
                      No collection
                    </Text>
                  </TouchableOpacity>
                  {collections.map((collection) => (
                    <TouchableOpacity
                      key={collection.id}
                      style={[
                        styles.collectionOption,
                        selectedCollection === collection.id && { backgroundColor: colors.accent + '10' }
                      ]}
                      onPress={() => {
                        setSelectedCollection(collection.id);
                        setShowCollectionPicker(false);
                      }}
                    >
                      <Ionicons 
                        name="folder" 
                        size={18} 
                        color={selectedCollection === collection.id ? colors.accent : colors.textSecondary} 
                      />
                      <Text style={[
                        styles.collectionOptionText, 
                        { color: selectedCollection === collection.id ? colors.accent : colors.text }
                      ]}>
                        {collection.name}
                      </Text>
                    </TouchableOpacity>
                  ))}
                </View>
              )}
            </View>

            {/* Note Input */}
            <View style={styles.inputGroup}>
              <Text style={[styles.inputLabel, { color: colors.textSecondary }]}>Note (optional)</Text>
              <TextInput
                style={[
                  styles.textInput, 
                  styles.noteInput,
                  { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }
                ]}
                value={note}
                onChangeText={setNote}
                placeholder="Add a note..."
                placeholderTextColor={colors.textMuted}
                multiline
                numberOfLines={3}
                textAlignVertical="top"
              />
            </View>

            {/* Future AI Features Placeholder - Hidden for now */}
            {/* 
            <View style={[styles.aiSection, { backgroundColor: colors.accent + '08', borderColor: colors.accent + '20' }]}>
              <View style={styles.aiHeader}>
                <Ionicons name="sparkles" size={18} color={colors.accent} />
                <Text style={[styles.aiTitle, { color: colors.accent }]}>AI Suggestions</Text>
                <View style={[styles.comingSoon, { backgroundColor: colors.accent }]}>
                  <Text style={styles.comingSoonText}>Coming Soon</Text>
                </View>
              </View>
              <Text style={[styles.aiDesc, { color: colors.textSecondary }]}>
                Smart tags, collection suggestions, and summaries
              </Text>
            </View>
            */}
          </ScrollView>

          {/* Bottom Save Button (Duplicate for better UX) */}
          <View style={[styles.bottomBar, { backgroundColor: colors.background, borderTopColor: colors.border }]}>
            <TouchableOpacity
              style={[styles.primarySaveButton, { backgroundColor: colors.accent }]}
              onPress={handleSave}
              disabled={isSaving || !sharedUrl}
            >
              {isSaving ? (
                <ActivityIndicator size="small" color={colors.white} />
              ) : (
                <>
                  <Ionicons name="bookmark" size={20} color={colors.white} />
                  <Text style={[styles.primarySaveText, { color: colors.white }]}>Save to Stash Pro</Text>
                </>
              )}
            </TouchableOpacity>
          </View>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  keyboardView: {
    flex: 1,
  },
  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  headerButton: {
    padding: spacing.xs,
  },
  cancelText: {
    fontSize: 16,
  },
  headerTitle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
  },
  headerTitleText: {
    fontSize: 17,
    fontWeight: '600',
  },
  saveButton: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    minWidth: 60,
    alignItems: 'center',
  },
  saveButtonText: {
    fontSize: 15,
    fontWeight: '600',
  },
  // Content
  content: {
    flex: 1,
    paddingHorizontal: spacing.md,
  },
  // Preview Card
  previewCard: {
    marginTop: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    overflow: 'hidden',
  },
  loadingPreview: {
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
  },
  loadingText: {
    fontSize: 14,
  },
  previewImage: {
    width: '100%',
    height: 160,
  },
  previewImagePlaceholder: {
    width: '100%',
    height: 120,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    marginHorizontal: spacing.md,
    marginTop: spacing.sm,
  },
  platformText: {
    fontSize: 12,
    fontWeight: '600',
  },
  urlText: {
    fontSize: 12,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  // Input Groups
  inputGroup: {
    marginTop: spacing.lg,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: '600',
    marginBottom: spacing.xs,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  textInput: {
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: 16,
  },
  noteInput: {
    minHeight: 80,
    paddingTop: spacing.sm,
  },
  // Collection Selector
  collectionSelector: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    borderRadius: borderRadius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm + 2,
  },
  selectedCollection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  collectionName: {
    fontSize: 16,
  },
  collectionPlaceholder: {
    fontSize: 16,
  },
  collectionDropdown: {
    marginTop: spacing.xs,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    maxHeight: 200,
  },
  collectionOption: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  collectionOptionText: {
    fontSize: 15,
  },
  // AI Section (Future)
  aiSection: {
    marginTop: spacing.lg,
    padding: spacing.md,
    borderRadius: borderRadius.md,
    borderWidth: 1,
  },
  aiHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  aiTitle: {
    fontSize: 14,
    fontWeight: '600',
  },
  comingSoon: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  comingSoonText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#fff',
  },
  aiDesc: {
    fontSize: 13,
    marginTop: spacing.xs,
  },
  // Bottom Bar
  bottomBar: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderTopWidth: 1,
  },
  primarySaveButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
  },
  primarySaveText: {
    fontSize: 17,
    fontWeight: '600',
  },
  // Auth Prompt
  authPrompt: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  authIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  authTitle: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  authText: {
    fontSize: 15,
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  authButton: {
    paddingHorizontal: spacing.xl,
    paddingVertical: spacing.md,
    borderRadius: borderRadius.md,
  },
  authButtonText: {
    fontSize: 16,
    fontWeight: '600',
  },
});
