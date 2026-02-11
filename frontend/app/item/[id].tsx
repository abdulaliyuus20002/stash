import React, { useEffect, useState } from 'react';
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
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { useTheme } from '@/src/hooks/useTheme';
import { useItemsStore } from '@/src/store/itemsStore';
import { useCollectionsStore } from '@/src/store/collectionsStore';
import { useAuthStore } from '@/src/store/authStore';
import { SavedItem } from '@/src/types';
import { Button } from '@/src/components';
import { spacing, typography, borderRadius } from '@/src/utils/theme';
import { format } from 'date-fns';
import { API_URL } from '@/src/utils/config';

interface ExtractedIdea {
  title: string;
  description?: string;
  type?: string;
}

interface SmartTag {
  name: string;
  confidence: string;
  cluster: string;
  is_new: boolean;
}

interface ActionItem {
  task: string;
  priority?: string;
  estimated_time?: string;
  category?: string;
  completed: boolean;
}

export default function ItemDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { colors } = useTheme();
  const { updateItem, deleteItem } = useItemsStore();
  const { collections, fetchCollections } = useCollectionsStore();
  const token = useAuthStore((state) => state.token);

  const [item, setItem] = useState<SavedItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [editedNotes, setEditedNotes] = useState('');
  const [editedTags, setEditedTags] = useState<string[]>([]);
  const [tagInput, setTagInput] = useState('');
  const [showCollections, setShowCollections] = useState(false);
  const [selectedCollections, setSelectedCollections] = useState<string[]>([]);
  
  // AI Features State
  const [aiSummary, setAiSummary] = useState<string[]>([]);
  const [isGeneratingSummary, setIsGeneratingSummary] = useState(false);
  const [extractedIdeas, setExtractedIdeas] = useState<ExtractedIdea[]>([]);
  const [isExtractingIdeas, setIsExtractingIdeas] = useState(false);
  const [smartTags, setSmartTags] = useState<SmartTag[]>([]);
  const [isGeneratingTags, setIsGeneratingTags] = useState(false);
  const [actionItems, setActionItems] = useState<ActionItem[]>([]);
  const [isGeneratingActions, setIsGeneratingActions] = useState(false);
  const [showAIPanel, setShowAIPanel] = useState(true);
  const [collectionSuggestion, setCollectionSuggestion] = useState<{collection_name: string; reason: string} | null>(null);

  useEffect(() => {
    if (token && id) {
      fetchItem();
      fetchCollections(token).catch(console.log);
    }
  }, [token, id]);

  const fetchItem = async () => {
    if (!token) return;
    try {
      const response = await axios.get(`${API_URL}/api/items/${id}`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const fetchedItem = response.data;
      setItem(fetchedItem);
      setEditedNotes(fetchedItem.notes || '');
      setEditedTags(fetchedItem.tags || []);
      setSelectedCollections(fetchedItem.collections || []);
      if (fetchedItem.ai_summary) {
        setAiSummary(fetchedItem.ai_summary);
      }
    } catch (error) {
      Alert.alert('Error', 'Could not load item');
      router.back();
    } finally {
      setIsLoading(false);
    }
  };

  const generateAISummary = async () => {
    if (!token || !id) return;
    setIsGeneratingSummary(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/items/${id}/ai-summary`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.summary && response.data.summary.length > 0) {
        setAiSummary(response.data.summary);
      }
    } catch (error) {
      console.log('AI summary error:', error);
    } finally {
      setIsGeneratingSummary(false);
    }
  };

  const extractIdeas = async () => {
    if (!token || !id) return;
    setIsExtractingIdeas(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/items/${id}/extract-ideas`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.ideas) {
        setExtractedIdeas(response.data.ideas);
      }
    } catch (error) {
      console.log('Idea extraction error:', error);
    } finally {
      setIsExtractingIdeas(false);
    }
  };

  const generateSmartTags = async () => {
    if (!token || !id) return;
    setIsGeneratingTags(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/items/${id}/smart-tags`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.suggested_tags) {
        setSmartTags(response.data.suggested_tags);
      }
    } catch (error) {
      console.log('Smart tags error:', error);
    } finally {
      setIsGeneratingTags(false);
    }
  };

  const generateActionItems = async () => {
    if (!token || !id) return;
    setIsGeneratingActions(true);
    try {
      const response = await axios.post(
        `${API_URL}/api/items/${id}/action-items`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.action_items) {
        setActionItems(response.data.action_items);
      }
    } catch (error) {
      console.log('Action items error:', error);
    } finally {
      setIsGeneratingActions(false);
    }
  };

  const toggleActionItem = async (index: number) => {
    if (!token || !id) return;
    try {
      const response = await axios.put(
        `${API_URL}/api/items/${id}/action-items/${index}/toggle`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.action_items) {
        setActionItems(response.data.action_items);
      }
    } catch (error) {
      console.log('Toggle action error:', error);
    }
  };

  const applySmartTag = async (tagName: string) => {
    if (!token || !id) return;
    try {
      await axios.post(
        `${API_URL}/api/items/${id}/apply-smart-tag?tag_name=${encodeURIComponent(tagName)}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!editedTags.includes(tagName)) {
        setEditedTags([...editedTags, tagName]);
      }
      // Remove from smart tags suggestions
      setSmartTags(smartTags.filter(t => t.name !== tagName));
    } catch (error) {
      console.log('Apply tag error:', error);
    }
  };

  const getCollectionSuggestion = async () => {
    if (!token || !id) return;
    try {
      const response = await axios.get(
        `${API_URL}/api/items/${id}/suggest-collection`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCollectionSuggestion(response.data);
    } catch (error) {
      console.log('Collection suggestion error:', error);
    }
  };

  const handleSave = async () => {
    if (!item || !token) return;

    setIsSaving(true);
    try {
      await updateItem(token, item.id, {
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
    if (!token) return;
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
              await deleteItem(token, item!.id);
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
      setSelectedCollections(selectedCollections.filter((cid) => cid !== collectionId));
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
        {item.thumbnail_url ? (
          <Image source={{ uri: item.thumbnail_url }} style={styles.thumbnail} resizeMode="cover" />
        ) : (
          <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="image-outline" size={48} color={colors.textMuted} />
          </View>
        )}

        <View style={styles.content}>
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

          <Text style={[styles.title, { color: colors.text }]}>{item.title}</Text>

          <TouchableOpacity style={styles.urlRow} onPress={handleOpenUrl}>
            <Ionicons name="link" size={18} color={colors.accent} />
            <Text style={[styles.url, { color: colors.accent }]} numberOfLines={1}>
              {item.url}
            </Text>
            <Ionicons name="open-outline" size={18} color={colors.accent} />
          </TouchableOpacity>

          {/* AI Summary Section */}
          <View style={[styles.aiSection, { backgroundColor: colors.accent + '10', borderColor: colors.accent + '30' }]}>
            <View style={styles.aiHeader}>
              <View style={styles.aiTitleRow}>
                <Ionicons name="sparkles" size={18} color={colors.accent} />
                <Text style={[styles.aiTitle, { color: colors.text }]}>AI Summary</Text>
              </View>
              {aiSummary.length === 0 && (
                <TouchableOpacity
                  style={[styles.generateButton, { backgroundColor: colors.accent }]}
                  onPress={generateAISummary}
                  disabled={isGeneratingSummary}
                >
                  {isGeneratingSummary ? (
                    <ActivityIndicator size="small" color={colors.primary} />
                  ) : (
                    <>
                      <Ionicons name="flash" size={14} color={colors.primary} />
                      <Text style={[styles.generateText, { color: colors.primary }]}>Generate</Text>
                    </>
                  )}
                </TouchableOpacity>
              )}
            </View>
            {aiSummary.length > 0 ? (
              <View style={styles.summaryList}>
                {aiSummary.map((point, index) => (
                  <View key={index} style={styles.summaryItem}>
                    <Text style={[styles.summaryBullet, { color: colors.accent }]}>•</Text>
                    <Text style={[styles.summaryText, { color: colors.textSecondary }]}>{point}</Text>
                  </View>
                ))}
              </View>
            ) : !isGeneratingSummary ? (
              <Text style={[styles.aiPlaceholder, { color: colors.textMuted }]}>
                Generate an AI summary to get quick insights about this content
              </Text>
            ) : null}
          </View>

          {/* AI Suggestions Panel */}
          <View style={[styles.premiumPanel, { backgroundColor: colors.card, borderColor: colors.border }]}>
            <TouchableOpacity 
              style={styles.premiumHeader}
              onPress={() => setShowAIPanel(!showAIPanel)}
            >
              <View style={styles.premiumTitleRow}>
                <View style={[styles.premiumBadge, { backgroundColor: colors.accent }]}>
                  <Ionicons name="sparkles" size={14} color={colors.primary} />
                </View>
                <Text style={[styles.premiumTitle, { color: colors.text }]}>AI Suggestions</Text>
              </View>
              <Ionicons 
                name={showAIPanel ? "chevron-up" : "chevron-down"} 
                size={20} 
                color={colors.textMuted} 
              />
            </TouchableOpacity>

            {showAIPanel && (
              <View style={styles.premiumContent}>
                {/* Generate Summary */}
                <View style={styles.aiFeatureCard}>
                  <View style={styles.aiFeatureHeader}>
                    <View style={styles.aiFeatureTitleRow}>
                      <Ionicons name="document-text-outline" size={18} color={colors.accent} />
                      <Text style={[styles.aiFeatureTitle, { color: colors.text }]}>AI Summary</Text>
                    </View>
                    {aiSummary.length === 0 && (
                      <TouchableOpacity
                        style={[styles.aiFeatureButton, { backgroundColor: colors.accent }]}
                        onPress={generateAISummary}
                        disabled={isGeneratingSummary}
                      >
                        {isGeneratingSummary ? (
                          <ActivityIndicator size="small" color={colors.white} />
                        ) : (
                          <Text style={[styles.aiFeatureButtonText, { color: colors.white }]}>Generate Summary</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  {aiSummary.length > 0 && (
                    <View style={[styles.summaryBox, { backgroundColor: colors.inputBg }]}>
                      {aiSummary.map((point, idx) => (
                        <Text key={idx} style={[styles.summaryPoint, { color: colors.text }]}>• {point}</Text>
                      ))}
                    </View>
                  )}
                </View>

                {/* Suggested Tags - Approve or Edit */}
                <View style={styles.aiFeatureCard}>
                  <View style={styles.aiFeatureHeader}>
                    <View style={styles.aiFeatureTitleRow}>
                      <Ionicons name="pricetags-outline" size={18} color={colors.accent} />
                      <Text style={[styles.aiFeatureTitle, { color: colors.text }]}>Suggested Tags</Text>
                    </View>
                    {smartTags.length === 0 && (
                      <TouchableOpacity
                        style={[styles.aiFeatureButton, { backgroundColor: colors.inputBg }]}
                        onPress={generateSmartTags}
                        disabled={isGeneratingTags}
                      >
                        {isGeneratingTags ? (
                          <ActivityIndicator size="small" color={colors.accent} />
                        ) : (
                          <Text style={[styles.aiFeatureButtonText, { color: colors.accent }]}>Get Suggestions</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  {smartTags.length > 0 && (
                    <View style={styles.smartTagsContainer}>
                      <Text style={[styles.approveHint, { color: colors.textMuted }]}>Tap to approve:</Text>
                      <View style={styles.smartTagsWrap}>
                        {smartTags.map((tag, index) => (
                          <TouchableOpacity 
                            key={index} 
                            style={[
                              styles.smartTag, 
                              { 
                                backgroundColor: editedTags.includes(tag.name) ? colors.accent + '20' : colors.inputBg,
                                borderColor: editedTags.includes(tag.name) ? colors.accent : colors.border
                              }
                            ]}
                            onPress={() => applySmartTag(tag.name)}
                          >
                            <Text style={[styles.smartTagText, { color: editedTags.includes(tag.name) ? colors.accent : colors.textSecondary }]}>
                              #{tag.name}
                            </Text>
                            <Ionicons 
                              name={editedTags.includes(tag.name) ? "checkmark-circle" : "add-circle-outline"} 
                              size={16} 
                              color={editedTags.includes(tag.name) ? colors.accent : colors.textMuted} 
                            />
                          </TouchableOpacity>
                        ))}
                      </View>
                      {smartTags.length > 0 && !smartTags.every(t => editedTags.includes(t.name)) && (
                        <TouchableOpacity 
                          style={[styles.approveAllButton, { backgroundColor: colors.accent }]}
                          onPress={() => {
                            const newTags = [...editedTags];
                            smartTags.forEach(t => {
                              if (!newTags.includes(t.name)) newTags.push(t.name);
                            });
                            setEditedTags(newTags);
                          }}
                        >
                          <Ionicons name="checkmark-done" size={16} color={colors.white} />
                          <Text style={[styles.approveAllText, { color: colors.white }]}>Approve All</Text>
                        </TouchableOpacity>
                      )}
                    </View>
                  )}
                </View>

                {/* Recommended Collection */}
                <View style={styles.aiFeatureCard}>
                  <View style={styles.aiFeatureHeader}>
                    <View style={styles.aiFeatureTitleRow}>
                      <Ionicons name="folder-outline" size={18} color={colors.accent} />
                      <Text style={[styles.aiFeatureTitle, { color: colors.text }]}>Recommended Collection</Text>
                    </View>
                    {!collectionSuggestion && (
                      <TouchableOpacity
                        style={[styles.aiFeatureButton, { backgroundColor: colors.inputBg }]}
                        onPress={getCollectionSuggestion}
                        disabled={isGeneratingSummary}
                      >
                        <Text style={[styles.aiFeatureButtonText, { color: colors.accent }]}>Get Suggestion</Text>
                      </TouchableOpacity>
                    )}
                  </View>
                  {collectionSuggestion && (
                    <View style={[styles.collectionSuggestion, { backgroundColor: colors.inputBg, borderColor: colors.accent }]}>
                      <View style={styles.collectionSuggestionContent}>
                        <Ionicons name="folder" size={20} color={colors.accent} />
                        <View style={styles.collectionSuggestionText}>
                          <Text style={[styles.collectionSuggestionName, { color: colors.text }]}>{collectionSuggestion.collection_name}</Text>
                          <Text style={[styles.collectionSuggestionReason, { color: colors.textMuted }]}>{collectionSuggestion.reason}</Text>
                        </View>
                      </View>
                      <TouchableOpacity 
                        style={[styles.addCollectionButton, { backgroundColor: colors.accent }]}
                        onPress={() => {
                          // Find or create collection
                          const existing = collections.find(c => c.name.toLowerCase() === collectionSuggestion.collection_name.toLowerCase());
                          if (existing && !selectedCollections.includes(existing.id)) {
                            setSelectedCollections([...selectedCollections, existing.id]);
                          }
                          Alert.alert('Added!', `Added to ${collectionSuggestion.collection_name}`);
                        }}
                      >
                        <Ionicons name="add" size={16} color={colors.white} />
                        <Text style={[styles.addCollectionText, { color: colors.white }]}>Add</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>

                {/* Extract Key Ideas */}
                <View style={styles.aiFeatureCard}>
                  <View style={styles.aiFeatureHeader}>
                    <View style={styles.aiFeatureTitleRow}>
                      <Ionicons name="bulb-outline" size={18} color={colors.accent} />
                      <Text style={[styles.aiFeatureTitle, { color: colors.text }]}>Key Ideas</Text>
                    </View>
                    {extractedIdeas.length === 0 && (
                      <TouchableOpacity
                        style={[styles.aiFeatureButton, { backgroundColor: colors.inputBg }]}
                        onPress={extractIdeas}
                        disabled={isExtractingIdeas}
                      >
                        {isExtractingIdeas ? (
                          <ActivityIndicator size="small" color={colors.accent} />
                        ) : (
                          <Text style={[styles.aiFeatureButtonText, { color: colors.accent }]}>Extract Ideas</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  {extractedIdeas.length > 0 && (
                    <View style={styles.ideasList}>
                      {extractedIdeas.map((idea, index) => (
                        <View key={index} style={[styles.ideaCard, { backgroundColor: colors.inputBg }]}>
                          <View style={styles.ideaHeader}>
                            <Text style={[styles.ideaTitle, { color: colors.text }]}>{idea.title}</Text>
                            {idea.type && (
                              <View style={[styles.ideaType, { backgroundColor: colors.accent + '20' }]}>
                                <Text style={[styles.ideaTypeText, { color: colors.accent }]}>{idea.type}</Text>
                              </View>
                            )}
                          </View>
                          {idea.description && (
                            <Text style={[styles.ideaDesc, { color: colors.textSecondary }]}>{idea.description}</Text>
                          )}
                        </View>
                      ))}
                    </View>
                  )}
                </View>

                {/* Extract Action Items */}
                <View style={styles.aiFeatureCard}>
                  <View style={styles.aiFeatureHeader}>
                    <View style={styles.aiFeatureTitleRow}>
                      <Ionicons name="checkbox-outline" size={18} color={colors.accent} />
                      <Text style={[styles.aiFeatureTitle, { color: colors.text }]}>Action Items</Text>
                    </View>
                    {actionItems.length === 0 && (
                      <TouchableOpacity
                        style={[styles.aiFeatureButton, { backgroundColor: colors.inputBg }]}
                        onPress={generateActionItems}
                        disabled={isGeneratingActions}
                      >
                        {isGeneratingActions ? (
                          <ActivityIndicator size="small" color={colors.accent} />
                        ) : (
                          <Text style={[styles.aiFeatureButtonText, { color: colors.accent }]}>Generate</Text>
                        )}
                      </TouchableOpacity>
                    )}
                  </View>
                  {actionItems.length > 0 && (
                    <View style={styles.actionsList}>
                      {actionItems.map((action, index) => (
                        <TouchableOpacity 
                          key={index} 
                          style={[styles.actionItem, { backgroundColor: colors.inputBg }]}
                          onPress={() => toggleActionItem(index)}
                        >
                          <View style={[
                            styles.actionCheckbox, 
                            { 
                              borderColor: action.completed ? colors.accent : colors.border,
                              backgroundColor: action.completed ? colors.accent : 'transparent'
                            }
                          ]}>
                            {action.completed && <Ionicons name="checkmark" size={14} color={colors.primary} />}
                          </View>
                          <View style={styles.actionContent}>
                            <Text style={[
                              styles.actionTask, 
                              { 
                                color: action.completed ? colors.textMuted : colors.text,
                                textDecorationLine: action.completed ? 'line-through' : 'none'
                              }
                            ]}>{action.task}</Text>
                            <View style={styles.actionMeta}>
                              {action.priority && (
                                <View style={[styles.actionPriority, { 
                                  backgroundColor: action.priority === 'high' ? '#ef444420' : 
                                    action.priority === 'medium' ? '#f59e0b20' : '#22c55e20' 
                                }]}>
                                  <Text style={[styles.actionPriorityText, { 
                                    color: action.priority === 'high' ? '#ef4444' : 
                                      action.priority === 'medium' ? '#f59e0b' : '#22c55e' 
                                  }]}>{action.priority}</Text>
                                </View>
                              )}
                              {action.estimated_time && (
                                <Text style={[styles.actionTime, { color: colors.textMuted }]}>
                                  ⏱ {action.estimated_time}
                                </Text>
                              )}
                            </View>
                          </View>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </View>
              </View>
            )}
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Notes</Text>
            <RNTextInput
              style={[styles.notesInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
              value={editedNotes}
              onChangeText={setEditedNotes}
              placeholder="Add notes..."
              placeholderTextColor={colors.textMuted}
              multiline
              textAlignVertical="top"
            />
          </View>

          <View style={styles.section}>
            <Text style={[styles.sectionTitle, { color: colors.text }]}>Tags</Text>
            <View style={styles.tagInputRow}>
              <RNTextInput
                style={[styles.tagInput, { backgroundColor: colors.inputBg, color: colors.text, borderColor: colors.border }]}
                value={tagInput}
                onChangeText={setTagInput}
                placeholder="Add a tag..."
                placeholderTextColor={colors.textMuted}
                onSubmitEditing={handleAddTag}
                returnKeyType="done"
              />
              <TouchableOpacity style={[styles.addTagButton, { backgroundColor: colors.accent }]} onPress={handleAddTag}>
                <Ionicons name="add" size={20} color={colors.primary} />
              </TouchableOpacity>
            </View>

            {editedTags.length > 0 && (
              <View style={styles.tagsContainer}>
                {editedTags.map((tag, index) => (
                  <TouchableOpacity key={index} style={[styles.tag, { backgroundColor: colors.inputBg }]} onPress={() => handleRemoveTag(tag)}>
                    <Text style={[styles.tagText, { color: colors.textSecondary }]}>#{tag}</Text>
                    <Ionicons name="close" size={14} color={colors.textMuted} />
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

          <View style={styles.section}>
            <TouchableOpacity style={styles.sectionHeader} onPress={() => setShowCollections(!showCollections)}>
              <Text style={[styles.sectionTitle, { color: colors.text }]}>Collections ({selectedCollections.length})</Text>
              <Ionicons name={showCollections ? 'chevron-up' : 'chevron-down'} size={20} color={colors.textMuted} />
            </TouchableOpacity>

            {showCollections && (
              <View style={[styles.collectionsList, { backgroundColor: colors.card, borderColor: colors.border }]}>
                {collections.map((collection) => (
                  <TouchableOpacity key={collection.id} style={[styles.collectionItem, { borderBottomColor: colors.border }]} onPress={() => toggleCollection(collection.id)}>
                    <Ionicons name={selectedCollections.includes(collection.id) ? 'checkbox' : 'square-outline'} size={22} color={selectedCollections.includes(collection.id) ? colors.accent : colors.textMuted} />
                    <Text style={[styles.collectionName, { color: colors.text }]}>{collection.name}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            )}
          </View>

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
  container: { flex: 1 },
  loadingContainer: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  thumbnail: { width: '100%', height: 200 },
  thumbnailPlaceholder: { width: '100%', height: 150, justifyContent: 'center', alignItems: 'center' },
  content: { padding: spacing.md },
  header: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  platformBadge: { paddingHorizontal: spacing.sm, paddingVertical: 4, borderRadius: borderRadius.sm },
  platformText: { fontSize: 12, fontWeight: '600' },
  date: { fontSize: typography.caption.fontSize },
  title: { fontSize: typography.h2.fontSize, fontWeight: '600', marginBottom: spacing.md, lineHeight: 32 },
  urlRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, marginBottom: spacing.lg },
  url: { flex: 1, fontSize: typography.bodySmall.fontSize },
  aiSection: { padding: spacing.md, borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.md },
  aiHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', marginBottom: spacing.sm },
  aiTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiTitle: { fontSize: typography.body.fontSize, fontWeight: '600' },
  generateButton: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, gap: 4 },
  generateText: { fontSize: 12, fontWeight: '600' },
  summaryList: { gap: spacing.sm },
  summaryItem: { flexDirection: 'row', gap: spacing.sm },
  summaryBullet: { fontSize: typography.body.fontSize, fontWeight: '700' },
  summaryText: { flex: 1, fontSize: typography.body.fontSize, lineHeight: 22 },
  aiPlaceholder: { fontSize: typography.bodySmall.fontSize, fontStyle: 'italic' },
  // Premium AI Panel
  premiumPanel: { borderRadius: borderRadius.lg, borderWidth: 1, marginBottom: spacing.lg, overflow: 'hidden' },
  premiumHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', padding: spacing.md },
  premiumTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  premiumBadge: { width: 26, height: 26, borderRadius: 13, justifyContent: 'center', alignItems: 'center' },
  premiumTitle: { fontSize: typography.body.fontSize, fontWeight: '700' },
  premiumContent: { padding: spacing.md, paddingTop: 0, gap: spacing.md },
  aiFeatureCard: { gap: spacing.sm },
  aiFeatureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  aiFeatureTitleRow: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  aiFeatureTitle: { fontSize: typography.bodySmall.fontSize, fontWeight: '600' },
  aiFeatureButton: { paddingHorizontal: spacing.md, paddingVertical: spacing.xs, borderRadius: borderRadius.sm },
  aiFeatureButtonText: { fontSize: 12, fontWeight: '600' },
  // Ideas
  ideasList: { gap: spacing.sm },
  ideaCard: { padding: spacing.sm, borderRadius: borderRadius.md },
  ideaHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 4 },
  ideaTitle: { fontSize: typography.bodySmall.fontSize, fontWeight: '600', flex: 1 },
  ideaType: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.sm },
  ideaTypeText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  ideaDesc: { fontSize: typography.caption.fontSize, lineHeight: 18 },
  // Smart Tags
  smartTagsContainer: { gap: spacing.sm },
  smartTagsWrap: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.xs },
  smartTag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.full, borderWidth: 1, gap: 4 },
  smartTagText: { fontSize: 12, fontWeight: '500' },
  approveHint: { fontSize: 12, marginBottom: spacing.xs },
  approveAllButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', paddingVertical: spacing.sm, paddingHorizontal: spacing.md, borderRadius: borderRadius.md, gap: spacing.xs, marginTop: spacing.sm },
  approveAllText: { fontSize: 12, fontWeight: '600' },
  // Summary Box
  summaryBox: { padding: spacing.sm, borderRadius: borderRadius.md },
  summaryPoint: { fontSize: typography.bodySmall.fontSize, lineHeight: 20, marginBottom: 4 },
  // Collection Suggestion
  collectionSuggestion: { padding: spacing.md, borderRadius: borderRadius.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  collectionSuggestionContent: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm, flex: 1 },
  collectionSuggestionText: { flex: 1 },
  collectionSuggestionName: { fontSize: typography.body.fontSize, fontWeight: '600', marginBottom: 2 },
  collectionSuggestionReason: { fontSize: 12 },
  addCollectionButton: { flexDirection: 'row', alignItems: 'center', paddingVertical: spacing.xs, paddingHorizontal: spacing.sm, borderRadius: borderRadius.sm, gap: 4 },
  addCollectionText: { fontSize: 12, fontWeight: '600' },
  // Action Items
  actionsList: { gap: spacing.sm },
  actionItem: { flexDirection: 'row', alignItems: 'flex-start', padding: spacing.sm, borderRadius: borderRadius.md, gap: spacing.sm },
  actionCheckbox: { width: 22, height: 22, borderRadius: 6, borderWidth: 2, justifyContent: 'center', alignItems: 'center', marginTop: 2 },
  actionContent: { flex: 1 },
  actionTask: { fontSize: typography.bodySmall.fontSize, fontWeight: '500', marginBottom: 4 },
  actionMeta: { flexDirection: 'row', alignItems: 'center', gap: spacing.sm },
  actionPriority: { paddingHorizontal: spacing.xs, paddingVertical: 2, borderRadius: borderRadius.sm },
  actionPriorityText: { fontSize: 10, fontWeight: '600', textTransform: 'capitalize' },
  actionTime: { fontSize: 10 },
  // Other sections
  section: { marginBottom: spacing.lg },
  sectionHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  sectionTitle: { fontSize: typography.body.fontSize, fontWeight: '600', marginBottom: spacing.sm },
  notesInput: { borderWidth: 1, borderRadius: borderRadius.md, padding: spacing.md, fontSize: typography.body.fontSize, minHeight: 120 },
  tagInputRow: { flexDirection: 'row', gap: spacing.sm },
  tagInput: { flex: 1, borderWidth: 1, borderRadius: borderRadius.md, paddingHorizontal: spacing.md, paddingVertical: spacing.sm, fontSize: typography.body.fontSize },
  addTagButton: { width: 44, height: 44, borderRadius: borderRadius.md, justifyContent: 'center', alignItems: 'center' },
  tagsContainer: { flexDirection: 'row', flexWrap: 'wrap', gap: spacing.sm, marginTop: spacing.sm },
  tag: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.sm, paddingVertical: spacing.xs, borderRadius: borderRadius.sm, gap: spacing.xs },
  tagText: { fontSize: typography.bodySmall.fontSize },
  collectionsList: { borderRadius: borderRadius.md, borderWidth: 1, marginTop: spacing.sm },
  collectionItem: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: spacing.md, paddingVertical: spacing.md, borderBottomWidth: 1, gap: spacing.sm },
  collectionName: { fontSize: typography.body.fontSize },
  actions: { marginTop: spacing.lg, gap: spacing.md },
  deleteButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: spacing.sm, paddingVertical: spacing.md },
  deleteText: { fontSize: typography.body.fontSize, fontWeight: '500' },
});
