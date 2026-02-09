import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
  Animated,
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

interface SaveOption {
  id: string;
  label: string;
  icon: string;
}

const SAVE_OPTIONS: SaveOption[] = [
  { id: 'business_ideas', label: 'Business ideas', icon: 'bulb-outline' },
  { id: 'videos_reels', label: 'Videos & reels', icon: 'play-circle-outline' },
  { id: 'articles', label: 'Articles', icon: 'document-text-outline' },
  { id: 'research', label: 'Research', icon: 'flask-outline' },
  { id: 'quotes', label: 'Quotes', icon: 'chatbubble-outline' },
  { id: 'creative', label: 'Creative inspiration', icon: 'color-palette-outline' },
  { id: 'bookmarks', label: 'Bookmarks', icon: 'bookmark-outline' },
  { id: 'other', label: 'Other', icon: 'ellipsis-horizontal-outline' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const token = useAuthStore((state) => state.token);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedSaveTypes, setSelectedSaveTypes] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  // Animation for card stacking (Screen 3)
  const cardAnim1 = useRef(new Animated.Value(0)).current;
  const cardAnim2 = useRef(new Animated.Value(0)).current;
  const cardAnim3 = useRef(new Animated.Value(0)).current;

  const totalSteps = 5;

  // Animate cards when on step 3
  useEffect(() => {
    if (currentStep === 2) {
      // Reset animations
      cardAnim1.setValue(0);
      cardAnim2.setValue(0);
      cardAnim3.setValue(0);
      
      // Stagger animation - scattered to organized
      Animated.sequence([
        Animated.delay(300),
        Animated.parallel([
          Animated.spring(cardAnim1, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8 }),
          Animated.spring(cardAnim2, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8, delay: 100 }),
          Animated.spring(cardAnim3, { toValue: 1, useNativeDriver: true, tension: 50, friction: 8, delay: 200 }),
        ]),
      ]).start();
    }
  }, [currentStep]);

  const toggleSaveType = (id: string) => {
    setSelectedSaveTypes((prev) =>
      prev.includes(id) ? prev.filter((t) => t !== id) : [...prev, id]
    );
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

  const handleComplete = async (upgradeToPro: boolean = false) => {
    setIsLoading(true);
    try {
      // Save preferences
      await axios.put(
        `${API_URL}/api/users/preferences`,
        {
          save_types: selectedSaveTypes,
          onboarding_completed: true,
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (upgradeToPro) {
        router.replace('/upgrade');
      } else {
        router.replace('/(tabs)/home');
      }
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

  const getButtonTitle = () => {
    switch (currentStep) {
      case 0:
        return 'Take Control';
      case 1:
        return 'Show Me How';
      case 2:
        return 'I Want This';
      case 3:
        return 'Personalise My Stash';
      case 4:
        return 'Start Free';
      default:
        return 'Continue';
    }
  };

  const renderStep = () => {
    switch (currentStep) {
      // Screen 1 - Emotional Hook
      case 0:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="cloud-outline" size={56} color={colors.accent} />
              <View style={[styles.floatingIcon, styles.floatingIcon1, { backgroundColor: colors.card }]}>
                <Ionicons name="bookmark" size={16} color={colors.textMuted} />
              </View>
              <View style={[styles.floatingIcon, styles.floatingIcon2, { backgroundColor: colors.card }]}>
                <Ionicons name="link" size={14} color={colors.textMuted} />
              </View>
              <View style={[styles.floatingIcon, styles.floatingIcon3, { backgroundColor: colors.card }]}>
                <Ionicons name="play" size={14} color={colors.textMuted} />
              </View>
            </View>
            <Text style={[styles.headline, { color: colors.text }]}>
              Tired of losing{'\n'}great ideas?
            </Text>
            <Text style={[styles.subheadline, { color: colors.textSecondary }]}>
              You save videos, posts, and articles everywhere…{'\n'}
              but when you need them, they're gone.
            </Text>
          </View>
        );

      // Screen 2 - Transformation / Value
      case 1:
        return (
          <View style={styles.stepContent}>
            <View style={[styles.iconContainer, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="sparkles" size={56} color={colors.accent} />
            </View>
            <Text style={[styles.headline, { color: colors.text }]}>
              Turn chaos{'\n'}into clarity.
            </Text>
            <Text style={[styles.subheadline, { color: colors.textSecondary }]}>
              Capture inspiration in 2 taps.{'\n'}
              Find anything in seconds — even months later.
            </Text>
            <View style={styles.featureList}>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.accent + '20' }]}>
                  <Ionicons name="flash" size={18} color={colors.accent} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>Save in 2 taps</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.accent + '20' }]}>
                  <Ionicons name="search" size={18} color={colors.accent} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>Find instantly</Text>
              </View>
              <View style={styles.featureItem}>
                <View style={[styles.featureIcon, { backgroundColor: colors.accent + '20' }]}>
                  <Ionicons name="time" size={18} color={colors.accent} />
                </View>
                <Text style={[styles.featureText, { color: colors.text }]}>Remember forever</Text>
              </View>
            </View>
          </View>
        );

      // Screen 3 - Identity / Aspiration with animation
      case 2:
        return (
          <View style={styles.stepContent}>
            {/* Animated card stack */}
            <View style={styles.cardStackContainer}>
              <Animated.View
                style={[
                  styles.animatedCard,
                  styles.animatedCard3,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  {
                    transform: [
                      { translateX: cardAnim3.interpolate({ inputRange: [0, 1], outputRange: [-40, 0] }) },
                      { translateY: cardAnim3.interpolate({ inputRange: [0, 1], outputRange: [30, 8] }) },
                      { rotate: cardAnim3.interpolate({ inputRange: [0, 1], outputRange: ['-15deg', '0deg'] }) },
                    ],
                    opacity: cardAnim3.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                  },
                ]}
              >
                <View style={[styles.cardLine, { backgroundColor: colors.textMuted + '30' }]} />
                <View style={[styles.cardLineShort, { backgroundColor: colors.textMuted + '30' }]} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.animatedCard,
                  styles.animatedCard2,
                  { backgroundColor: colors.card, borderColor: colors.border },
                  {
                    transform: [
                      { translateX: cardAnim2.interpolate({ inputRange: [0, 1], outputRange: [35, 0] }) },
                      { translateY: cardAnim2.interpolate({ inputRange: [0, 1], outputRange: [-25, 4] }) },
                      { rotate: cardAnim2.interpolate({ inputRange: [0, 1], outputRange: ['12deg', '0deg'] }) },
                    ],
                    opacity: cardAnim2.interpolate({ inputRange: [0, 1], outputRange: [0.5, 1] }),
                  },
                ]}
              >
                <View style={[styles.cardLine, { backgroundColor: colors.textMuted + '30' }]} />
                <View style={[styles.cardLineShort, { backgroundColor: colors.textMuted + '30' }]} />
              </Animated.View>
              <Animated.View
                style={[
                  styles.animatedCard,
                  styles.animatedCard1,
                  { backgroundColor: colors.accent + '15', borderColor: colors.accent },
                  {
                    transform: [
                      { translateX: cardAnim1.interpolate({ inputRange: [0, 1], outputRange: [0, 0] }) },
                      { translateY: cardAnim1.interpolate({ inputRange: [0, 1], outputRange: [50, 0] }) },
                      { rotate: cardAnim1.interpolate({ inputRange: [0, 1], outputRange: ['8deg', '0deg'] }) },
                    ],
                    opacity: cardAnim1,
                  },
                ]}
              >
                <View style={[styles.cardIconSmall, { backgroundColor: colors.accent }]}>
                  <Ionicons name="layers" size={16} color={colors.primary} />
                </View>
                <View style={[styles.cardLine, { backgroundColor: colors.accent + '50' }]} />
                <View style={[styles.cardLineShort, { backgroundColor: colors.accent + '50' }]} />
              </Animated.View>
            </View>
            
            <Text style={[styles.headline, { color: colors.text }]}>
              Build your digital{'\n'}second brain.
            </Text>
            <Text style={[styles.subheadline, { color: colors.textSecondary }]}>
              Your mind is for creating.{'\n'}
              Stash remembers everything else.
            </Text>
          </View>
        );

      // Screen 4 - Personalisation
      case 3:
        return (
          <View style={styles.stepContentScroll}>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              What do you mostly save?
            </Text>
            <Text style={[styles.stepSubtitle, { color: colors.textSecondary }]}>
              We'll tailor your Stash experience.
            </Text>
            <View style={styles.optionsGrid}>
              {SAVE_OPTIONS.map((option) => (
                <TouchableOpacity
                  key={option.id}
                  style={[
                    styles.optionCard,
                    {
                      backgroundColor: selectedSaveTypes.includes(option.id)
                        ? colors.accent + '15'
                        : colors.card,
                      borderColor: selectedSaveTypes.includes(option.id)
                        ? colors.accent
                        : colors.border,
                    },
                  ]}
                  onPress={() => toggleSaveType(option.id)}
                  activeOpacity={0.7}
                >
                  <View style={[
                    styles.optionIconContainer,
                    { 
                      backgroundColor: selectedSaveTypes.includes(option.id) 
                        ? colors.accent + '20' 
                        : colors.inputBg 
                    }
                  ]}>
                    <Ionicons
                      name={option.icon as any}
                      size={22}
                      color={selectedSaveTypes.includes(option.id) ? colors.accent : colors.textMuted}
                    />
                  </View>
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
                    <View style={[styles.checkmark, { backgroundColor: colors.accent }]}>
                      <Ionicons name="checkmark" size={12} color={colors.primary} />
                    </View>
                  )}
                </TouchableOpacity>
              ))}
            </View>
          </View>
        );

      // Screen 5 - Scientific Credibility + Upgrade Framing
      case 4:
        return (
          <View style={styles.stepContentScroll}>
            <View style={[styles.brainIcon, { backgroundColor: colors.accent + '15' }]}>
              <Ionicons name="bulb" size={40} color={colors.accent} />
            </View>
            <Text style={[styles.stepTitle, { color: colors.text }]}>
              Your brain isn't built{'\n'}to remember bookmarks.
            </Text>
            <Text style={[styles.scientificText, { color: colors.textSecondary }]}>
              Studies show organised systems reduce cognitive load and improve recall.
              When everything has a place, your focus improves.
            </Text>
            
            {/* Plan comparison */}
            <View style={styles.plansContainer}>
              {/* Free Plan */}
              <View style={[styles.planCard, { backgroundColor: colors.card, borderColor: colors.border }]}>
                <Text style={[styles.planTitle, { color: colors.text }]}>Free Plan</Text>
                <View style={styles.planFeatures}>
                  <View style={styles.planFeatureItem}>
                    <Ionicons name="checkmark" size={16} color={colors.success} />
                    <Text style={[styles.planFeatureText, { color: colors.textSecondary }]}>50 saves</Text>
                  </View>
                  <View style={styles.planFeatureItem}>
                    <Ionicons name="checkmark" size={16} color={colors.success} />
                    <Text style={[styles.planFeatureText, { color: colors.textSecondary }]}>5 collections</Text>
                  </View>
                  <View style={styles.planFeatureItem}>
                    <Ionicons name="checkmark" size={16} color={colors.success} />
                    <Text style={[styles.planFeatureText, { color: colors.textSecondary }]}>Basic search</Text>
                  </View>
                </View>
              </View>
              
              {/* Pro Plan */}
              <View style={[styles.planCard, styles.proPlanCard, { backgroundColor: colors.accent + '10', borderColor: colors.accent }]}>
                <View style={[styles.proBadge, { backgroundColor: colors.accent }]}>
                  <Text style={[styles.proBadgeText, { color: colors.primary }]}>PRO</Text>
                </View>
                <Text style={[styles.planTitle, { color: colors.text }]}>Pro Plan</Text>
                <View style={styles.planFeatures}>
                  <View style={styles.planFeatureItem}>
                    <Ionicons name="checkmark" size={16} color={colors.accent} />
                    <Text style={[styles.planFeatureText, { color: colors.text }]}>Unlimited saves</Text>
                  </View>
                  <View style={styles.planFeatureItem}>
                    <Ionicons name="checkmark" size={16} color={colors.accent} />
                    <Text style={[styles.planFeatureText, { color: colors.text }]}>Unlimited collections</Text>
                  </View>
                  <View style={styles.planFeatureItem}>
                    <Ionicons name="checkmark" size={16} color={colors.accent} />
                    <Text style={[styles.planFeatureText, { color: colors.text }]}>Advanced search</Text>
                  </View>
                  <View style={styles.planFeatureItem}>
                    <Ionicons name="checkmark" size={16} color={colors.accent} />
                    <Text style={[styles.planFeatureText, { color: colors.text }]}>Smart organisation</Text>
                  </View>
                </View>
              </View>
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
        <Text style={[styles.progressText, { color: colors.textMuted }]}>
          Step {currentStep + 1} of {totalSteps}
        </Text>
        <View style={styles.progressBar}>
          <View 
            style={[
              styles.progressFill, 
              { 
                backgroundColor: colors.accent,
                width: `${((currentStep + 1) / totalSteps) * 100}%` 
              }
            ]} 
          />
        </View>
      </View>

      {/* Skip button */}
      {currentStep > 0 && currentStep < 4 && (
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
        
        {currentStep === 4 ? (
          <View style={styles.finalButtons}>
            <Button
              title="Start Free"
              onPress={() => handleComplete(false)}
              loading={isLoading}
              style={{ flex: 1 }}
              size="lg"
            />
            <TouchableOpacity
              style={styles.upgradeTextButton}
              onPress={() => handleComplete(true)}
            >
              <Text style={[styles.upgradeText, { color: colors.accent }]}>
                Upgrade to Pro
              </Text>
            </TouchableOpacity>
          </View>
        ) : (
          <Button
            title={getButtonTitle()}
            onPress={handleNext}
            loading={isLoading}
            style={{ flex: 1 }}
            size="lg"
          />
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  progressContainer: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.sm,
  },
  progressText: {
    fontSize: typography.bodySmall.fontSize,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  progressBar: {
    height: 4,
    backgroundColor: '#E5E7EB',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  skipButton: {
    position: 'absolute',
    top: spacing.xl + 8,
    right: spacing.lg,
    zIndex: 10,
    padding: spacing.sm,
  },
  skipText: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
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
  stepContentScroll: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.lg,
  },
  iconContainer: {
    width: 140,
    height: 140,
    borderRadius: 70,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.xl,
    position: 'relative',
  },
  floatingIcon: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  floatingIcon1: {
    top: 10,
    right: 5,
  },
  floatingIcon2: {
    bottom: 15,
    left: 0,
  },
  floatingIcon3: {
    top: 30,
    left: 10,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.md,
    lineHeight: 40,
  },
  subheadline: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    lineHeight: 24,
    paddingHorizontal: spacing.md,
  },
  featureList: {
    marginTop: spacing.xl,
    gap: spacing.md,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  featureIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  featureText: {
    fontSize: typography.body.fontSize,
    fontWeight: '500',
  },
  // Card stack animation styles
  cardStackContainer: {
    width: 200,
    height: 160,
    marginBottom: spacing.xl,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  animatedCard: {
    position: 'absolute',
    width: 140,
    height: 90,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    padding: spacing.md,
    justifyContent: 'center',
  },
  animatedCard1: {
    zIndex: 3,
  },
  animatedCard2: {
    zIndex: 2,
  },
  animatedCard3: {
    zIndex: 1,
  },
  cardIconSmall: {
    width: 28,
    height: 28,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  cardLine: {
    height: 8,
    borderRadius: 4,
    width: '80%',
    marginBottom: spacing.xs,
  },
  cardLineShort: {
    height: 8,
    borderRadius: 4,
    width: '50%',
  },
  // Options grid for personalization
  stepTitle: {
    fontSize: 24,
    fontWeight: '700',
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  stepSubtitle: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  optionsGrid: {
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    justifyContent: 'center',
  },
  optionCard: {
    width: (width - spacing.lg * 2 - spacing.sm) / 2 - 4,
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 2,
    alignItems: 'center',
    position: 'relative',
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 22,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  optionLabel: {
    fontSize: typography.bodySmall.fontSize,
    fontWeight: '600',
    textAlign: 'center',
  },
  checkmark: {
    position: 'absolute',
    top: 8,
    right: 8,
    width: 20,
    height: 20,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Screen 5 styles
  brainIcon: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  scientificText: {
    fontSize: typography.body.fontSize,
    textAlign: 'center',
    lineHeight: 22,
    paddingHorizontal: spacing.md,
    marginBottom: spacing.xl,
  },
  plansContainer: {
    width: '100%',
    gap: spacing.md,
  },
  planCard: {
    padding: spacing.lg,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
  },
  proPlanCard: {
    borderWidth: 2,
    position: 'relative',
  },
  proBadge: {
    position: 'absolute',
    top: -10,
    right: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: 4,
    borderRadius: borderRadius.sm,
  },
  proBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  planTitle: {
    fontSize: typography.h3.fontSize,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
  planFeatures: {
    gap: spacing.sm,
  },
  planFeatureItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  planFeatureText: {
    fontSize: typography.body.fontSize,
  },
  // Button container
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
  finalButtons: {
    flex: 1,
    gap: spacing.md,
  },
  upgradeTextButton: {
    alignItems: 'center',
    paddingVertical: spacing.sm,
  },
  upgradeText: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
});
