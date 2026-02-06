import React from 'react';
import { View, Text, Image, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { SavedItem } from '../types';
import { borderRadius, spacing, typography } from '../utils/theme';
import { format } from 'date-fns';

interface ItemCardProps {
  item: SavedItem;
  onPress: () => void;
  onDelete?: () => void;
}

const getPlatformIcon = (platform: string): keyof typeof Ionicons.glyphMap => {
  const icons: Record<string, keyof typeof Ionicons.glyphMap> = {
    YouTube: 'logo-youtube',
    X: 'logo-twitter',
    Instagram: 'logo-instagram',
    TikTok: 'logo-tiktok',
    LinkedIn: 'logo-linkedin',
    GitHub: 'logo-github',
    Reddit: 'logo-reddit',
    Web: 'globe-outline',
  };
  return icons[platform] || 'globe-outline';
};

const getPlatformColor = (platform: string): string => {
  const platformColors: Record<string, string> = {
    YouTube: '#FF0000',
    X: '#000000',
    Instagram: '#E4405F',
    TikTok: '#000000',
    LinkedIn: '#0077B5',
    GitHub: '#333333',
    Reddit: '#FF4500',
    Web: '#64748B',
  };
  return platformColors[platform] || '#64748B';
};

export const ItemCard: React.FC<ItemCardProps> = ({ item, onPress, onDelete }) => {
  const { colors, isDark } = useTheme();

  return (
    <TouchableOpacity
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderColor: colors.border,
          shadowColor: isDark ? '#000' : '#64748B',
        },
      ]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      {item.thumbnail_url ? (
        <Image
          source={{ uri: item.thumbnail_url }}
          style={styles.thumbnail}
          resizeMode="cover"
        />
      ) : (
        <View style={[styles.thumbnailPlaceholder, { backgroundColor: colors.inputBg }]}>
          <Ionicons name={getPlatformIcon(item.platform)} size={32} color={colors.textMuted} />
        </View>
      )}

      <View style={styles.content}>
        <View style={styles.header}>
          <View style={[styles.platformBadge, { backgroundColor: getPlatformColor(item.platform) }]}>
            <Ionicons
              name={getPlatformIcon(item.platform)}
              size={12}
              color="#FFFFFF"
            />
            <Text style={styles.platformText}>{item.platform}</Text>
          </View>
          <Text style={[styles.date, { color: colors.textMuted }]}>
            {format(new Date(item.created_at), 'MMM d, yyyy')}
          </Text>
        </View>

        <Text style={[styles.title, { color: colors.text }]} numberOfLines={2}>
          {item.title}
        </Text>

        {item.tags.length > 0 && (
          <View style={styles.tags}>
            {item.tags.slice(0, 3).map((tag, index) => (
              <View
                key={index}
                style={[styles.tag, { backgroundColor: colors.inputBg }]}
              >
                <Text style={[styles.tagText, { color: colors.textSecondary }]}>
                  #{tag}
                </Text>
              </View>
            ))}
            {item.tags.length > 3 && (
              <Text style={[styles.moreTag, { color: colors.textMuted }]}>
                +{item.tags.length - 3}
              </Text>
            )}
          </View>
        )}
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.md,
    overflow: 'hidden',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.08,
    shadowRadius: 8,
    elevation: 3,
  },
  thumbnail: {
    width: '100%',
    height: 160,
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: 100,
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
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
    gap: 4,
  },
  platformText: {
    color: '#FFFFFF',
    fontSize: 11,
    fontWeight: '600',
  },
  date: {
    fontSize: typography.caption.fontSize,
  },
  title: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
    lineHeight: 22,
  },
  tags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    marginTop: spacing.sm,
    gap: spacing.xs,
  },
  tag: {
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
  },
  tagText: {
    fontSize: 11,
  },
  moreTag: {
    fontSize: 11,
    alignSelf: 'center',
  },
});
