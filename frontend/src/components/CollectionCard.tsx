import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../hooks/useTheme';
import { Collection } from '../types';
import { borderRadius, spacing, typography } from '../utils/theme';

interface CollectionCardProps {
  collection: Collection;
  onPress: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
}

export const CollectionCard: React.FC<CollectionCardProps> = ({
  collection,
  onPress,
  onEdit,
  onDelete,
}) => {
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
      <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
        <Ionicons name="folder" size={24} color={colors.accent} />
      </View>

      <View style={styles.content}>
        <Text style={[styles.name, { color: colors.text }]} numberOfLines={1}>
          {collection.name}
        </Text>
        <Text style={[styles.count, { color: colors.textMuted }]}>
          {collection.item_count} {collection.item_count === 1 ? 'item' : 'items'}
        </Text>
      </View>

      <View style={styles.actions}>
        {onEdit && (
          <TouchableOpacity onPress={onEdit} style={styles.actionButton}>
            <Ionicons name="pencil" size={18} color={colors.textMuted} />
          </TouchableOpacity>
        )}
        {onDelete && (
          <TouchableOpacity onPress={onDelete} style={styles.actionButton}>
            <Ionicons name="trash-outline" size={18} color={colors.error} />
          </TouchableOpacity>
        )}
        <Ionicons name="chevron-forward" size={20} color={colors.textMuted} />
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    flexDirection: 'row',
    alignItems: 'center',
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    marginBottom: spacing.sm,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: spacing.md,
  },
  content: {
    flex: 1,
  },
  name: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
  count: {
    fontSize: typography.caption.fontSize,
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  actionButton: {
    padding: spacing.xs,
  },
});
