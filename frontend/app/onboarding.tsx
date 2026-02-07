import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  TextInput as RNTextInput,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/store/authStore';
import { Button } from '@/src/components';
import { spacing, typography, borderRadius } from '@/src/utils/theme';
import axios from 'axios';
import { API_URL } from '@/src/utils/config';

const { width } = Dimensions.get('window');

interface OnboardingOption {
  id: string;
  label: string;
  icon: string;
}

const SAVE_TYPES: OnboardingOption[] = [
  { id: 'startup_ideas', label: 'Startup ideas', icon: 'bulb-outline' },
  { id: 'content_inspiration', label: 'Content inspiration', icon: 'color-palette-outline' },
  { id: 'educational_videos', label: 'Educational videos', icon: 'school-outline' },
  { id: 'faith_growth', label: 'Faith & growth', icon: 'heart-outline' },
  { id: 'random_interesting', label: 'Random interesting stuff', icon: 'sparkles-outline' },
];

const USAGE_GOALS: OnboardingOption[] = [
  { id: 'organize_ideas', label: 'Organize ideas', icon: 'folder-outline' },
  { id: 'second_brain', label: 'Build a second brain', icon: 'brain' },
  { id: 'stop_losing', label: 'Stop losing saved content', icon: 'bookmark-outline' },
  { id: 'all_above', label: 'All of the above', icon: 'checkmark-done-outline' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const token = useAuthStore((state) => state.token);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSaveTypes, setSelectedSaveTypes] = useState<string[]>([]);
  const [selectedGoals, setSelectedGoals] = useState<string[]>([]);
  const [collectionName, setCollectionName] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 4;

  const toggleSaveType = (id: string) => {
    setSelectedSaveTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
  };

  const toggleGoal = (id: string) => {
    if (id === 'all_above') {
      setSelectedGoals(['organize_ideas', 'second_brain', 'stop_losing', 'all_above']);
    } else {
      setSelectedGoals((prev) =>
        prev.includes(id) ? prev.filter((g) => g !== id) : [...prev, id]
      );
    }
  };

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = async () => {
    setIsLoading(true);
    try {
      // Save preferences
      await axios.put(
        `${API_URL}/api/users/preferences`,
        {
          save_types: selectedSaveTypes,
          usage_goals: selectedGoals,
          onboarding_completed: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Create first collection if provided
      if (collectionName.trim()) {
        await axios.post(
          `${API_URL}/api/collections`,
          { name: collectionName.trim() },
          { headers: { Authorization: `Bearer ${token}` } }
        );
      }

      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Onboarding error:', error);
      router.replace('/(tabs)/home');
    } finally {
      setIsLoading(false);
    }
  };

  const handleSkip = () => {
    router.replace('/(tabs)/home');
  };

  const renderStep = () => {
    switch (currentStep) {
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="layers" size={64} color={colors.accent} />
            </View>
            <Text style={[styles.headline, { color: colors.text }]}>
              Welcome to your{'\n'}private idea vault.
            </Text>
            <Text style={[styles.subheadline, { color: colors.textSecondary }]}>
              Save content from anywhere, organize it beautifully, and never lose an idea again.
            </Text>
          </View>
        );

      case 1:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              What do you usually save?
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              This helps us personalize your experience
            </Text>
            <View style={styles.optionsContainer}>
              {SAVE_TYPES.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: selectedSaveTypes.includes(option.id)
                        ? colors.accent + '20'
                        : colors.card,
                      borderColor: selectedSaveTypes.includes(option.id)
                        ? colors.accent
                        : colors.border,
                    },
                  ]}
                  onPress={() => toggleSaveType(option.id)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={selectedSaveTypes.includes(option.id) ? colors.accent : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: selectedSaveTypes.includes(option.id)
                          ? colors.accent
                          : colors.text,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedSaveTypes.includes(option.id) && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 2:
        return (
          <View style={styles.stepContent}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              How do you want to use Stash?
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Select all that apply
            </Text>
            <View style={styles.optionsContainer}>
              {USAGE_GOALS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: selectedGoals.includes(option.id)
                        ? colors.accent + '20'
                        : colors.card,
                      borderColor: selectedGoals.includes(option.id)
                        ? colors.accent
                        : colors.border,
                    },
                  ]}
                  onPress={() => toggleGoal(option.id)}
                >
                  <Ionicons
                    name={option.icon as any}
                    size={24}
                    color={selectedGoals.includes(option.id) ? colors.accent : colors.textMuted}
                  />
                  <Text
                    style={[
                      styles.optionLabel,
                      {
                        color: selectedGoals.includes(option.id)
                          ? colors.accent
                          : colors.text,
                      },
                    ]}
                  >
                    {option.label}
                  </Text>
                  {selectedGoals.includes(option.id) && (
                    <Ionicons name="checkmark-circle" size={20} color={colors.accent} />
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      case 3:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accent + '20' }]}>
              <Ionicons name="folder-open" size={48} color={colors.accent} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Create your first collection
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              Collections help you organize your saved content
            </Text>
            <RNTextInput
              style={[
                styles.collectionInput,
                {
                  backgroundColor: colors.inputBg,
                  color: colors.text,
                  borderColor: colors.border,
                },
              ]}
              value={collectionName}
              onChangeText={setCollectionName}
              placeholder="e.g., Business Ideas, Watch Later..."
              placeholderTextColor={colors.textMuted}
            />
            <View style={styles.suggestionChips}>
              {['Watch Later', 'Ideas', 'Inspiration', 'Learning'].map((suggestion) => (
                <TouchableOpacity
                  key={suggestion}
                  style={[styles.suggestionChip, { backgroundColor: colors.inputBg }]}
                  onPress={() => setCollectionName(suggestion)}
                >
                  <Text style={[styles.suggestionText, { color: colors.textSecondary }]}>
                    {suggestion}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      {/* Progress indicator */}
      <View style={styles.progressContainer}>
        {Array.from({ length: totalSteps }).map((_, index) => (
          <View
            key={index}
            style={[
              styles.progressDot,
              {
                backgroundColor: index <= currentStep ? colors.accent : colors.border,
                width: index === currentStep ? 24 : 8,
              },
            ]}
          />
        ))}
      </View>

      {/* Skip button */}
      {currentStep > 0 && (
        <TouchableOpacity style={styles.skipButton} onPress={handleSkip}>
          <Text style={[styles.skipText, { color: colors.textMuted }]}>Skip</Text>
        </TouchableOpacity>
      )}

      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {renderStep()}
      </ScrollView>

      {/* Navigation buttons */}
      <View style={styles.buttonContainer}>
        {currentStep > 0 && (
          <TouchableOpacity
            style={[styles.backButton, { borderColor: colors.border }]}
            onPress={handleBack}
          >
            <Ionicons name="arrow-back" size={20} color={colors.text} />
          </TouchableOpacity>
        )}
        <Button
          title={currentStep === totalSteps - 1 ? 'Get Started' : 'Continue'}
          onPress={currentStep === totalSteps - 1 ? handleComplete : handleNext}
          loading={isLoading}
          style={{ flex: 1 }}
          size="lg"
        />
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: spacing.lg,
    gap: spacing.sm,
  },
  progressDot: {
    height: 8,
    borderRadius: 4,
  },
  skipButton: {
    position: 'absolute',
    top: spacing.xl,
    right: spacing.lg,
    zIndex: 10,
  },
  skipText: {
    fontSize: typography.body.fontSize,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
  },
  stepContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.xl,
  },
  iconContainer: {
    width: 120,
    height: 120,
    borderRadius: 60,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  headline: {
    fontSize: 28,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 36,
  },
  subheadline: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.lg,
  },
  stepTitle: {
    fontSize: typography.h2.fontSize,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  optionsContainer: {
    width: '100%',
    gap: spacing.sm,
  },
  optionCard: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    gap: spacing.md,
  },
  optionLabel: {
    flex: 1,
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  collectionInput: {
    width: '100%',
    borderWidth: 1,
    borderRadius: borderRadius.lg,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    fontSize: typography.body.fontSize,
    marginBottom: spacing.md,
  },
  suggestionChips: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  suggestionChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: borderRadius.full,
  },
  suggestionText: {
    fontSize: typography.bodySmall.fontSize,
  },
  buttonContainer: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    gap: spacing.md,
  },
  backButton: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
});
