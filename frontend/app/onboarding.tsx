import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '@/src/store/authStore';
import { spacing, borderRadius } from '@/src/utils/theme';
import axios from 'axios';
import { API_URL } from '@/src/utils/config';

const { width } = Dimensions.get('window');

// Design system colors
const colors = {
  primary: '#2DD4BF',
  primaryDark: '#14B8A6',
  gray50: '#F9FAFB',
  gray100: '#F3F4F6',
  gray200: '#E5E7EB',
  gray500: '#6B7280',
  gray700: '#374151',
  gray900: '#111827',
  success: '#10B981',
  white: '#FFFFFF',
};

// Personalization options (5 max)
const PERSONALIZATION_OPTIONS = [
  { id: 'videos', emoji: '🎬', label: 'Videos & Podcasts' },
  { id: 'articles', emoji: '📰', label: 'Articles & News' },
  { id: 'business', emoji: '💡', label: 'Business & Ideas' },
  { id: 'design', emoji: '🎨', label: 'Design & Inspiration' },
  { id: 'other', emoji: '📚', label: 'Everything Else' },
];

// Platform icons for Screen 2
const PLATFORMS = [
  { name: 'YouTube', icon: 'logo-youtube' },
  { name: 'Instagram', icon: 'logo-instagram' },
  { name: 'Twitter', icon: 'logo-twitter' },
  { name: 'LinkedIn', icon: 'logo-linkedin' },
  { name: 'Web', icon: 'globe-outline' },
];

export default function OnboardingScreen() {
  const router = useRouter();
  const token = useAuthStore((state) => state.token);
  const [currentStep, setCurrentStep] = useState(0);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const totalSteps = 5;

  const handleNext = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const handleSkip = () => {
    if (currentStep < totalSteps - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleFreeChoice();
    }
  };

  const handleFreeChoice = async () => {
    setIsLoading(true);
    try {
      await axios.put(
        `${API_URL}/api/users/preferences`,
        {
          save_types: selectedCategory ? [selectedCategory] : [],
          onboarding_completed: true,
          plan_choice: 'free',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.replace('/(tabs)/home');
    } catch (error) {
      console.error('Onboarding error:', error);
      router.replace('/(tabs)/home');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProTrialChoice = async () => {
    setIsLoading(true);
    try {
      await axios.put(
        `${API_URL}/api/users/preferences`,
        {
          save_types: selectedCategory ? [selectedCategory] : [],
          onboarding_completed: true,
          plan_choice: 'pro_trial',
        },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      router.replace('/upgrade');
    } catch (error) {
      console.error('Onboarding error:', error);
      router.replace('/upgrade');
    } finally {
      setIsLoading(false);
    }
  };

  const renderProgressHeader = () => (
    <View style={styles.header}>
      <TouchableOpacity onPress={handleSkip} style={styles.skipButton}>
        <Text style={styles.skipText}>Skip</Text>
        <Ionicons name="arrow-forward" size={14} color={colors.gray500} />
      </TouchableOpacity>
      <Text style={styles.progressText}>{currentStep + 1}/{totalSteps}</Text>
    </View>
  );

  // SCREEN 1: Emotional Hook
  const renderScreen1 = () => (
    <View style={styles.screenContent}>
      <View style={styles.contentCenter}>
        <Text style={styles.headline}>
          That "I'll save this for later" video?
        </Text>
        <Text style={styles.headlineAccent}>
          It's been 3 years. You never found it.
        </Text>
        <Text style={styles.subtext}>
          You save everything. You find nothing.
        </Text>
      </View>
      <TouchableOpacity style={styles.ctaButton} onPress={handleNext}>
        <Text style={styles.ctaText}>Change That</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  // SCREEN 2: Platform + AI Tease
  const renderScreen2 = () => (
    <View style={styles.screenContent}>
      <View style={styles.contentCenter}>
        <Text style={styles.headline}>From anywhere.</Text>
        <Text style={styles.headlineAccent}>Found in seconds.</Text>
        
        {/* Platform icons */}
        <View style={styles.platformRow}>
          {PLATFORMS.map((platform, index) => (
            <View key={index} style={styles.platformItem}>
              <Ionicons name={platform.icon as any} size={28} color={colors.gray700} />
              <Text style={styles.platformLabel}>{platform.name}</Text>
            </View>
          ))}
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>1</Text></View>
            <Text style={styles.stepText}>Tap share → Choose Stash</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={styles.stepNumber}><Text style={styles.stepNumberText}>2</Text></View>
            <Text style={styles.stepText}>AI suggests tags & collections</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={14} color={colors.white} />
            </View>
            <Text style={styles.stepText}>You approve. Done.</Text>
          </View>
        </View>
      </View>
      <TouchableOpacity style={styles.ctaButton} onPress={handleNext}>
        <Text style={styles.ctaText}>Yes, I Want This</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  // SCREEN 3: Philosophy + Control
  const renderScreen3 = () => (
    <View style={styles.screenContent}>
      <View style={styles.contentCenter}>
        <Text style={styles.headline}>
          Your brain has <Text style={styles.highlight}>50,000 thoughts</Text> a day.
        </Text>
        <Text style={styles.subtext}>
          Stop using them to remember URLs.
        </Text>
        
        <View style={styles.philosophyBox}>
          <Text style={styles.philosophyText}>
            Stash remembers the content.{'\n'}
            <Text style={styles.philosophyBold}>You stay in control.</Text>
          </Text>
        </View>

        <View style={styles.promiseBox}>
          <Ionicons name="shield-checkmark" size={24} color={colors.primary} />
          <Text style={styles.promiseText}>
            AI suggests. You decide.{'\n'}
            <Text style={styles.promiseSubtext}>Collections, tags, summaries — you approve everything.</Text>
          </Text>
        </View>
      </View>
      <TouchableOpacity style={styles.ctaButton} onPress={handleNext}>
        <Text style={styles.ctaText}>Clear My Mental Clutter</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  // SCREEN 4: Personalization
  const renderScreen4 = () => (
    <View style={styles.screenContent}>
      <View style={styles.contentTop}>
        <Text style={styles.headline}>What do you save most?</Text>
        <Text style={styles.subtext}>
          We'll tailor your Stash experience — you approve every suggestion.
        </Text>

        <View style={styles.optionsContainer}>
          {PERSONALIZATION_OPTIONS.map((option) => (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionPill,
                selectedCategory === option.id && styles.optionPillSelected,
              ]}
              onPress={() => setSelectedCategory(option.id)}
            >
              <Text style={styles.optionEmoji}>{option.emoji}</Text>
              <Text style={[
                styles.optionLabel,
                selectedCategory === option.id && styles.optionLabelSelected,
              ]}>
                {option.label}
              </Text>
              {selectedCategory === option.id && (
                <View style={styles.optionCheck}>
                  <Ionicons name="checkmark" size={14} color={colors.white} />
                </View>
              )}
            </TouchableOpacity>
          ))}
        </View>
      </View>
      <TouchableOpacity 
        style={[styles.ctaButton, !selectedCategory && styles.ctaButtonDisabled]} 
        onPress={handleNext}
        disabled={!selectedCategory}
      >
        <Text style={styles.ctaText}>Personalise My Stash</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  // SCREEN 5: The Big Choice
  const renderScreen5 = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.screen5Content}>
      <Text style={styles.socialProof}>
        Join <Text style={styles.socialProofNumber}>4,237</Text> people organizing their digital life.
      </Text>

      {/* FREE FOREVER Card */}
      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <Text style={styles.planEmoji}>✨</Text>
          <Text style={styles.planTitle}>FREE FOREVER</Text>
        </View>
        <View style={styles.planFeatures}>
          <View style={styles.planFeature}>
            <Ionicons name="checkmark" size={16} color={colors.success} />
            <Text style={styles.planFeatureText}>500 saves – 3 months of collecting</Text>
          </View>
          <View style={styles.planFeature}>
            <Ionicons name="checkmark" size={16} color={colors.success} />
            <Text style={styles.planFeatureText}>10 collections – You organize manually</Text>
          </View>
          <View style={styles.planFeature}>
            <Ionicons name="checkmark" size={16} color={colors.success} />
            <Text style={styles.planFeatureText}>Basic search – Find by title</Text>
          </View>
          <View style={styles.planFeature}>
            <Ionicons name="checkmark" size={16} color={colors.success} />
            <Text style={styles.planFeatureText}>3 AI suggestions/month – Try the magic</Text>
          </View>
          <View style={styles.planFeature}>
            <Ionicons name="checkmark" size={16} color={colors.success} />
            <Text style={styles.planFeatureText}>Every device – Syncs everywhere</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.freeButton} 
          onPress={handleFreeChoice}
          disabled={isLoading}
        >
          <Text style={styles.freeButtonText}>Choose Free</Text>
        </TouchableOpacity>
      </View>

      {/* PRO TRIAL Card */}
      <View style={[styles.planCard, styles.proCard]}>
        <View style={styles.planHeader}>
          <Text style={styles.planEmoji}>🚀</Text>
          <Text style={styles.planTitle}>TRY PRO FREE – 14 Days</Text>
        </View>
        <View style={styles.planFeatures}>
          <View style={styles.planFeature}>
            <Ionicons name="checkmark" size={16} color={colors.primary} />
            <Text style={styles.planFeatureText}>Unlimited saves & collections</Text>
          </View>
          <View style={styles.planFeature}>
            <Ionicons name="checkmark" size={16} color={colors.primary} />
            <Text style={styles.planFeatureText}>AI suggests smart tags – You approve in 1 tap</Text>
          </View>
          <View style={styles.planFeature}>
            <Ionicons name="checkmark" size={16} color={colors.primary} />
            <Text style={styles.planFeatureText}>AI generates summaries – Key ideas instantly</Text>
          </View>
          <View style={styles.planFeature}>
            <Ionicons name="checkmark" size={16} color={colors.primary} />
            <Text style={styles.planFeatureText}>AI recommends collections – Based on your content</Text>
          </View>
          <View style={styles.planFeature}>
            <Ionicons name="checkmark" size={16} color={colors.primary} />
            <Text style={styles.planFeatureText}>Advanced search – Find anything</Text>
          </View>
          <View style={styles.planFeature}>
            <Ionicons name="checkmark" size={16} color={colors.primary} />
            <Text style={styles.planFeatureText}>Cancel anytime, keep your data</Text>
          </View>
        </View>
        <TouchableOpacity 
          style={styles.proButton} 
          onPress={handleProTrialChoice}
          disabled={isLoading}
        >
          <Text style={styles.proButtonText}>Start 14-Day Trial</Text>
          <Ionicons name="arrow-forward" size={18} color={colors.white} />
        </TouchableOpacity>
      </View>

      {/* Fine print */}
      <View style={styles.finePrint}>
        <Text style={styles.finePrintText}>
          ✓ Card required for trial  ✓ No charge for 14 days
        </Text>
      </View>
    </ScrollView>
  );

  const renderStep = () => {
    switch (currentStep) {
      case 0: return renderScreen1();
      case 1: return renderScreen2();
      case 2: return renderScreen3();
      case 3: return renderScreen4();
      case 4: return renderScreen5();
      default: return null;
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      {currentStep < 4 && renderProgressHeader()}
      {currentStep === 4 && (
        <View style={styles.header}>
          <TouchableOpacity onPress={handleFreeChoice} style={styles.skipButton}>
            <Text style={styles.skipText}>Skip</Text>
            <Ionicons name="arrow-forward" size={14} color={colors.gray500} />
          </TouchableOpacity>
          <Text style={styles.progressText}>5/5</Text>
        </View>
      )}
      {renderStep()}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.white,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingTop: 16,
  },
  skipButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  skipText: {
    fontSize: 14,
    color: colors.gray500,
  },
  progressText: {
    fontSize: 14,
    color: colors.gray500,
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 24,
    justifyContent: 'space-between',
  },
  contentCenter: {
    flex: 1,
    justifyContent: 'center',
  },
  contentTop: {
    flex: 1,
    paddingTop: 32,
  },
  headline: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.gray900,
    lineHeight: 40,
    marginBottom: 8,
  },
  headlineAccent: {
    fontSize: 32,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 40,
    marginBottom: 16,
  },
  highlight: {
    color: colors.primary,
  },
  subtext: {
    fontSize: 16,
    color: colors.gray500,
    lineHeight: 24,
    marginBottom: 32,
  },
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 12,
    gap: 8,
  },
  ctaButtonDisabled: {
    backgroundColor: colors.gray200,
  },
  ctaText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  // Screen 2 styles
  platformRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 32,
    paddingHorizontal: 8,
  },
  platformItem: {
    alignItems: 'center',
    gap: 4,
  },
  platformLabel: {
    fontSize: 10,
    color: colors.gray500,
  },
  stepsContainer: {
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.gray200,
    justifyContent: 'center',
    alignItems: 'center',
  },
  stepNumberText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.gray700,
  },
  stepText: {
    fontSize: 16,
    color: colors.gray700,
  },
  // Screen 3 styles
  philosophyBox: {
    backgroundColor: colors.gray50,
    padding: 20,
    borderRadius: 12,
    marginBottom: 24,
  },
  philosophyText: {
    fontSize: 16,
    color: colors.gray700,
    lineHeight: 24,
    textAlign: 'center',
  },
  philosophyBold: {
    fontWeight: '700',
    color: colors.gray900,
  },
  promiseBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    backgroundColor: colors.primary + '10',
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.primary + '30',
  },
  promiseText: {
    flex: 1,
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
    lineHeight: 24,
  },
  promiseSubtext: {
    fontWeight: '400',
    color: colors.gray500,
  },
  // Screen 4 styles
  optionsContainer: {
    gap: 12,
    marginTop: 24,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 12,
  },
  optionPillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '10',
  },
  optionEmoji: {
    fontSize: 24,
  },
  optionLabel: {
    flex: 1,
    fontSize: 16,
    color: colors.gray700,
    fontWeight: '500',
  },
  optionLabelSelected: {
    color: colors.gray900,
    fontWeight: '600',
  },
  optionCheck: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.primary,
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Screen 5 styles
  scrollView: {
    flex: 1,
  },
  screen5Content: {
    paddingHorizontal: 24,
    paddingBottom: 32,
  },
  socialProof: {
    fontSize: 16,
    color: colors.gray500,
    textAlign: 'center',
    marginVertical: 24,
  },
  socialProofNumber: {
    fontWeight: '700',
    color: colors.gray900,
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  proCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '05',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 16,
  },
  planEmoji: {
    fontSize: 20,
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  planFeatures: {
    gap: 12,
    marginBottom: 20,
  },
  planFeature: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
  },
  planFeatureText: {
    flex: 1,
    fontSize: 14,
    color: colors.gray700,
    lineHeight: 20,
  },
  freeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: colors.gray700,
  },
  freeButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 56,
    borderRadius: 12,
    backgroundColor: colors.primary,
    gap: 8,
  },
  proButtonText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.white,
  },
  finePrint: {
    alignItems: 'center',
    paddingVertical: 16,
  },
  finePrintText: {
    fontSize: 12,
    color: colors.gray500,
    textAlign: 'center',
  },
});
