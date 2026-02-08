import React, { useState, useCallback, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Switch,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useItemsStore } from '@/src/store/itemsStore';
import { useAuthStore } from '@/src/store/authStore';
import { SearchBar, ItemCard } from '@/src/components';
import { SavedItem } from '@/src/types';
import { spacing, typography, borderRadius } from '@/src/utils/theme';
import { useDebouncedCallback } from '@/src/hooks/useDebounce';
import axios from 'axios';
import { API_URL } from '@/src/utils/config';

export default function SearchScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { searchItems } = useItemsStore();
  const token = useAuthStore((state) => state.token);
  const user = useAuthStore((state) => state.user);
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SavedItem[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  
  // Advanced search options (Pro only)
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);
  const [searchInNotes, setSearchInNotes] = useState(true);
  const [searchInTags, setSearchInTags] = useState(true);
  const [searchInTitles, setSearchInTitles] = useState(true);
  
  const isPro = user?.plan_type === 'pro' || user?.is_pro;

  const performSearch = useCallback(async (searchQuery: string) => {
    if (searchQuery.length < 2 || !token) {
      setResults([]);
      setHasSearched(false);
      return;
    }

    setIsSearching(true);
    try {
      if (isPro && showAdvancedOptions) {
        // Use advanced search for Pro users
        const params = new URLSearchParams({
          q: searchQuery,
          search_notes: searchInNotes.toString(),
          search_tags: searchInTags.toString(),
          search_titles: searchInTitles.toString(),
        });
        
        const response = await axios.get(
          `${API_URL}/api/search/advanced?${params}`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setResults(response.data.results);
      } else {
        // Standard search
        const searchResults = await searchItems(token, searchQuery);
        setResults(searchResults);
      }
      setHasSearched(true);
    } catch (error: any) {
      console.error('Search error:', error);
      if (error.response?.status === 403) {
        Alert.alert(
          'Pro Feature',
          'Advanced search is available for Pro users.',
          [
            { text: 'Cancel', style: 'cancel' },
            { text: 'Upgrade', onPress: () => router.push('/upgrade') }
          ]
        );
      }
    } finally {
      setIsSearching(false);
    }
  }, [searchItems, token, isPro, showAdvancedOptions, searchInNotes, searchInTags, searchInTitles]);

  const debouncedSearch = useDebouncedCallback(performSearch, 300);

  const handleQueryChange = (text: string) => {
    setQuery(text);
    debouncedSearch(text);
  };

  const handleClear = () => {
    setQuery('');
    setResults([]);
    setHasSearched(false);
  };

  const toggleAdvancedOptions = () => {
    if (!isPro) {
      Alert.alert(
        'Pro Feature',
        'Advanced search lets you search within notes, tags, and more. Upgrade to Pro to unlock!',
        [
          { text: 'Not Now', style: 'cancel' },
          { text: 'Go Pro', onPress: () => router.push('/upgrade') }
        ]
      );
      return;
    }
    setShowAdvancedOptions(!showAdvancedOptions);
  };

  // Re-search when advanced options change
  useEffect(() => {
    if (query.length >= 2) {
      debouncedSearch(query);
    }
  }, [searchInNotes, searchInTags, searchInTitles, showAdvancedOptions]);

  const renderEmpty = () => {
    if (!hasSearched) {
      return (
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: colors.inputBg }]}>
            <Ionicons name="search" size={48} color={colors.textMuted} />
          </View>
          <Text style={[styles.emptyTitle, { color: colors.text }]}>Search your stash</Text>
          <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
            Find content by title, tags, notes, or platform
          </Text>
          {!isPro && (
            <TouchableOpacity
              style={[styles.proBanner, { backgroundColor: colors.accent + '15', borderColor: colors.accent }]}
              onPress={() => router.push('/upgrade')}
            >
              <Ionicons name="diamond" size={16} color={colors.accent} />
              <Text style={[styles.proBannerText, { color: colors.accent }]}>
                Upgrade to Pro for advanced search
              </Text>
              <Ionicons name="chevron-forward" size={16} color={colors.accent} />
            </TouchableOpacity>
          )}
        </View>
      );
    }

    return (
      <View style={styles.emptyContainer}>
        <View style={[styles.emptyIcon, { backgroundColor: colors.inputBg }]}>
          <Ionicons name="file-tray-outline" size={48} color={colors.textMuted} />
        </View>
        <Text style={[styles.emptyTitle, { color: colors.text }]}>No results found</Text>
        <Text style={[styles.emptyText, { color: colors.textSecondary }]}>
          Try a different search term
        </Text>
      </View>
    );
  };

  const renderAdvancedOptions = () => {
    if (!showAdvancedOptions || !isPro) return null;
    
    return (
      <View style={[styles.advancedOptions, { backgroundColor: colors.card, borderColor: colors.border }]}>
        <Text style={[styles.advancedTitle, { color: colors.text }]}>Search In</Text>
        
        <View style={styles.optionRow}>
          <View style={styles.optionLabel}>
            <Ionicons name="text-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.optionText, { color: colors.text }]}>Titles</Text>
          </View>
          <Switch
            value={searchInTitles}
            onValueChange={setSearchInTitles}
            trackColor={{ false: colors.border, true: colors.accent + '80' }}
            thumbColor={searchInTitles ? colors.accent : colors.textMuted}
          />
        </View>
        
        <View style={styles.optionRow}>
          <View style={styles.optionLabel}>
            <Ionicons name="document-text-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.optionText, { color: colors.text }]}>Notes</Text>
          </View>
          <Switch
            value={searchInNotes}
            onValueChange={setSearchInNotes}
            trackColor={{ false: colors.border, true: colors.accent + '80' }}
            thumbColor={searchInNotes ? colors.accent : colors.textMuted}
          />
        </View>
        
        <View style={styles.optionRow}>
          <View style={styles.optionLabel}>
            <Ionicons name="pricetags-outline" size={18} color={colors.textSecondary} />
            <Text style={[styles.optionText, { color: colors.text }]}>Tags</Text>
          </View>
          <Switch
            value={searchInTags}
            onValueChange={setSearchInTags}
            trackColor={{ false: colors.border, true: colors.accent + '80' }}
            thumbColor={searchInTags ? colors.accent : colors.textMuted}
          />
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]} edges={['left', 'right']}>
      <View style={styles.searchContainer}>
        <SearchBar
          value={query}
          onChangeText={handleQueryChange}
          onClear={handleClear}
          placeholder="Search titles, tags, notes..."
        />
        
        {/* Advanced Search Toggle */}
        <TouchableOpacity
          style={[
            styles.advancedToggle, 
            { 
              backgroundColor: showAdvancedOptions && isPro ? colors.accent + '20' : colors.card,
              borderColor: showAdvancedOptions && isPro ? colors.accent : colors.border 
            }
          ]}
          onPress={toggleAdvancedOptions}
        >
          <Ionicons 
            name="options-outline" 
            size={18} 
            color={showAdvancedOptions && isPro ? colors.accent : colors.textSecondary} 
          />
          <Text style={[
            styles.advancedToggleText, 
            { color: showAdvancedOptions && isPro ? colors.accent : colors.textSecondary }
          ]}>
            Advanced
          </Text>
          {!isPro && (
            <View style={[styles.proBadge, { backgroundColor: colors.accent }]}>
              <Text style={[styles.proBadgeText, { color: colors.primary }]}>PRO</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>
      
      {renderAdvancedOptions()}

      {isSearching ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <FlatList
          data={results}
          keyExtractor={(item) => item.id}
          renderItem={({ item }) => (
            <ItemCard
              item={item}
              onPress={() => router.push(`/item/${item.id}`)}
            />
          )}
          contentContainerStyle={[
            styles.listContent,
            results.length === 0 && styles.emptyList,
          ]}
          ListEmptyComponent={renderEmpty}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          ListHeaderComponent={
            hasSearched && results.length > 0 ? (
              <Text style={[styles.resultsCount, { color: colors.textSecondary }]}>
                {results.length} result{results.length !== 1 ? 's' : ''} found
                {showAdvancedOptions && isPro && ' (Advanced)'}
              </Text>
            ) : null
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  searchContainer: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  advancedToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    gap: spacing.xs,
  },
  advancedToggleText: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '500',
  },
  proBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    marginLeft: 2,
  },
  proBadgeText: {
    fontSize: 9,
    fontWeight: '700',
  },
  advancedOptions: {
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  advancedTitle: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    marginBottom: spacing.md,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  optionLabel: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  optionText: {
    fontSize: typography.body.fontSize,
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
  proBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  proBannerText: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
    flex: 1,
  },
  resultsCount: {
    fontSize: typography.bodySmall.fontSize,
    marginBottom: spacing.sm,
  },
});
