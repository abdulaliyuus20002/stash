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

// Personalization options with icons
const PERSONALIZATION_OPTIONS = [
  { id: 'videos', icon: 'videocam', label: 'Videos & Podcasts' },
  { id: 'articles', icon: 'newspaper', label: 'Articles & News' },
  { id: 'business', icon: 'bulb', label: 'Business & Ideas' },
  { id: 'design', icon: 'color-palette', label: 'Design & Inspiration' },
  { id: 'other', icon: 'library', label: 'Everything Else' },
];

// Platform icons for Screen 2
const PLATFORMS = [
  { name: 'YouTube', icon: 'logo-youtube', color: '#FF0000' },
  { name: 'Instagram', icon: 'logo-instagram', color: '#E4405F' },
  { name: 'Twitter', icon: 'logo-twitter', color: '#1DA1F2' },
  { name: 'LinkedIn', icon: 'logo-linkedin', color: '#0077B5' },
  { name: 'Web', icon: 'globe-outline', color: colors.gray700 },
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
        {/* Icon illustration */}
        <View style={styles.illustrationContainer}>
          <View style={[styles.illustrationCircle, { backgroundColor: colors.primary + '15' }]}>
            <Ionicons name="cloud-outline" size={48} color={colors.primary} />
          </View>
          <View style={[styles.floatingIcon, styles.floatingIcon1]}>
            <Ionicons name="bookmark" size={16} color={colors.gray500} />
          </View>
          <View style={[styles.floatingIcon, styles.floatingIcon2]}>
            <Ionicons name="link" size={14} color={colors.gray500} />
          </View>
          <View style={[styles.floatingIcon, styles.floatingIcon3]}>
            <Ionicons name="play" size={14} color={colors.gray500} />
          </View>
        </View>

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
              <View style={[styles.platformIconContainer, { backgroundColor: platform.color + '15' }]}>
                <Ionicons name={platform.icon as any} size={24} color={platform.color} />
              </View>
              <Text style={styles.platformLabel}>{platform.name}</Text>
            </View>
          ))}
        </View>

        {/* Steps */}
        <View style={styles.stepsContainer}>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: colors.gray100 }]}>
              <Text style={styles.stepNumberText}>1</Text>
            </View>
            <Text style={styles.stepText}>Tap share → Choose Stash Pro</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: colors.gray100 }]}>
              <Text style={styles.stepNumberText}>2</Text>
            </View>
            <Text style={styles.stepText}>AI suggests tags & collections</Text>
          </View>
          <View style={styles.stepItem}>
            <View style={[styles.stepNumber, { backgroundColor: colors.primary }]}>
              <Ionicons name="checkmark" size={14} color={colors.white} />
            </View>
            <Text style={[styles.stepText, { fontWeight: '600' }]}>You approve. Done.</Text>
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
        {/* Brain icon */}
        <View style={[styles.illustrationCircle, { backgroundColor: colors.primary + '15', marginBottom: 24 }]}>
          <Ionicons name="flash" size={40} color={colors.primary} />
        </View>

        <Text style={styles.headline}>
          Your brain has{' '}
          <Text style={styles.highlight}>50,000 thoughts</Text>
          {' '}a day.
        </Text>
        <Text style={styles.subtext}>
          Stop using them to remember URLs.
        </Text>
        
        <View style={styles.philosophyBox}>
          <Text style={styles.philosophyText}>
            Stash Pro remembers the content.
          </Text>
          <Text style={styles.philosophyBold}>You stay in control.</Text>
        </View>

        <View style={styles.promiseBox}>
          <View style={[styles.promiseIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="shield-checkmark" size={20} color={colors.white} />
          </View>
          <View style={styles.promiseTextContainer}>
            <Text style={styles.promiseTitle}>AI suggests. You decide.</Text>
            <Text style={styles.promiseSubtext}>Collections, tags, summaries — you approve everything.</Text>
          </View>
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
          We'll tailor your Stash Pro experience — you approve every suggestion.
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
              <View style={[
                styles.optionIconContainer,
                { backgroundColor: selectedCategory === option.id ? colors.primary + '20' : colors.gray100 }
              ]}>
                <Ionicons
                  name={option.icon as any}
                  size={22}
                  color={selectedCategory === option.id ? colors.primary : colors.gray500}
                />
              </View>
              <Text style={[
                styles.optionLabel,
                selectedCategory === option.id && styles.optionLabelSelected,
              ]}>
                {option.label}
              </Text>
              {selectedCategory === option.id && (
                <View style={[styles.optionCheck, { backgroundColor: colors.primary }]}>
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
        <Text style={styles.ctaText}>Personalise My Stash Pro</Text>
        <Ionicons name="arrow-forward" size={20} color={colors.white} />
      </TouchableOpacity>
    </View>
  );

  // SCREEN 5: The Big Choice
  const renderScreen5 = () => (
    <ScrollView style={styles.scrollView} contentContainerStyle={styles.screen5Content}>
      {/* Social proof */}
      <View style={styles.socialProofContainer}>
        <Ionicons name="people" size={18} color={colors.gray500} />
        <Text style={styles.socialProof}>
          Join <Text style={styles.socialProofNumber}>4,237</Text> people organizing their digital life.
        </Text>
      </View>

      {/* FREE FOREVER Card */}
      <View style={styles.planCard}>
        <View style={styles.planHeader}>
          <View style={[styles.planIcon, { backgroundColor: colors.gray100 }]}>
            <Ionicons name="sparkles-outline" size={20} color={colors.gray700} />
          </View>
          <Text style={styles.planTitle}>FREE FOREVER</Text>
        </View>
        <View style={styles.planFeatures}>
          <FeatureItem icon="save-outline" text="500 saves – 3 months of collecting" color={colors.success} />
          <FeatureItem icon="folder-outline" text="10 collections – You organize manually" color={colors.success} />
          <FeatureItem icon="search-outline" text="Basic search – Find by title" color={colors.success} />
          <FeatureItem icon="sparkles-outline" text="3 AI suggestions/month – Try the magic" color={colors.success} />
          <FeatureItem icon="sync-outline" text="Every device – Syncs everywhere" color={colors.success} />
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
          <View style={[styles.planIcon, { backgroundColor: colors.primary }]}>
            <Ionicons name="rocket" size={20} color={colors.white} />
          </View>
          <Text style={styles.planTitle}>TRY PRO FREE – 14 Days</Text>
        </View>
        <View style={styles.planFeatures}>
          <FeatureItem icon="infinite-outline" text="Unlimited saves & collections" color={colors.primary} />
          <FeatureItem icon="pricetags-outline" text="AI suggests smart tags – You approve in 1 tap" color={colors.primary} />
          <FeatureItem icon="document-text-outline" text="AI generates summaries – Key ideas instantly" color={colors.primary} />
          <FeatureItem icon="folder-open-outline" text="AI recommends collections – Based on your content" color={colors.primary} />
          <FeatureItem icon="search" text="Advanced search – Find anything" color={colors.primary} />
          <FeatureItem icon="shield-checkmark-outline" text="Cancel anytime, keep your data" color={colors.primary} />
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
        <View style={styles.finePrintItem}>
          <Ionicons name="card-outline" size={14} color={colors.gray500} />
          <Text style={styles.finePrintText}>Card required for trial</Text>
        </View>
        <View style={styles.finePrintItem}>
          <Ionicons name="checkmark-circle-outline" size={14} color={colors.gray500} />
          <Text style={styles.finePrintText}>No charge for 14 days</Text>
        </View>
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

// Feature Item Component
const FeatureItem = ({ icon, text, color }: { icon: string; text: string; color: string }) => (
  <View style={styles.featureItem}>
    <Ionicons name={icon as any} size={18} color={color} />
    <Text style={styles.featureText}>{text}</Text>
  </View>
);

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
    paddingVertical: 8,
  },
  skipText: {
    fontSize: 15,
    color: colors.gray500,
    fontWeight: '500',
  },
  progressText: {
    fontSize: 15,
    color: colors.gray500,
    fontWeight: '600',
  },
  screenContent: {
    flex: 1,
    paddingHorizontal: 24,
    paddingBottom: 32,
    justifyContent: 'space-between',
  },
  contentCenter: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  contentTop: {
    flex: 1,
    paddingTop: 32,
  },
  // Illustration styles
  illustrationContainer: {
    position: 'relative',
    marginBottom: 32,
  },
  illustrationCircle: {
    width: 100,
    height: 100,
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
  },
  floatingIcon: {
    position: 'absolute',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.white,
    justifyContent: 'center',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  floatingIcon1: { top: -5, right: -10 },
  floatingIcon2: { bottom: 10, left: -15 },
  floatingIcon3: { top: 20, left: -10 },
  // Typography
  headline: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.gray900,
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 8,
  },
  headlineAccent: {
    fontSize: 28,
    fontWeight: '700',
    color: colors.primary,
    lineHeight: 36,
    textAlign: 'center',
    marginBottom: 16,
  },
  highlight: {
    color: colors.primary,
  },
  subtext: {
    fontSize: 16,
    color: colors.gray500,
    lineHeight: 24,
    textAlign: 'center',
    marginBottom: 32,
  },
  // CTA Button
  ctaButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    height: 56,
    borderRadius: 16,
    gap: 8,
  },
  ctaButtonDisabled: {
    backgroundColor: colors.gray200,
  },
  ctaText: {
    fontSize: 17,
    fontWeight: '600',
    color: colors.white,
  },
  // Screen 2 - Platforms
  platformRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginBottom: 40,
    paddingHorizontal: 8,
  },
  platformItem: {
    alignItems: 'center',
    gap: 8,
  },
  platformIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  platformLabel: {
    fontSize: 11,
    color: colors.gray500,
    fontWeight: '500',
  },
  // Steps
  stepsContainer: {
    width: '100%',
    gap: 16,
  },
  stepItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  stepNumber: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
  // Screen 3 - Philosophy
  philosophyBox: {
    backgroundColor: colors.gray50,
    padding: 24,
    borderRadius: 16,
    marginBottom: 20,
    alignItems: 'center',
    width: '100%',
  },
  philosophyText: {
    fontSize: 17,
    color: colors.gray600,
    lineHeight: 26,
    textAlign: 'center',
    marginBottom: 4,
  },
  philosophyBold: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.gray900,
    textAlign: 'center',
  },
  promiseBox: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 16,
    backgroundColor: colors.primary + '08',
    padding: 20,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: colors.primary + '20',
    width: '100%',
  },
  promiseIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  promiseTextContainer: {
    flex: 1,
  },
  promiseTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray900,
    marginBottom: 4,
  },
  promiseSubtext: {
    fontSize: 14,
    color: colors.gray500,
    lineHeight: 20,
  },
  // Screen 4 - Options
  optionsContainer: {
    gap: 12,
    marginTop: 24,
  },
  optionPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.gray50,
    paddingVertical: 16,
    paddingHorizontal: 16,
    borderRadius: 16,
    borderWidth: 2,
    borderColor: 'transparent',
    gap: 16,
  },
  optionPillSelected: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '08',
  },
  optionIconContainer: {
    width: 44,
    height: 44,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
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
    justifyContent: 'center',
    alignItems: 'center',
  },
  // Screen 5 - Plans
  scrollView: {
    flex: 1,
  },
  screen5Content: {
    paddingHorizontal: 24,
    paddingBottom: 40,
  },
  socialProofContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    marginVertical: 24,
  },
  socialProof: {
    fontSize: 15,
    color: colors.gray500,
  },
  socialProofNumber: {
    fontWeight: '700',
    color: colors.gray900,
  },
  planCard: {
    backgroundColor: colors.white,
    borderRadius: 20,
    padding: 24,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: colors.gray200,
  },
  proCard: {
    borderColor: colors.primary,
    borderWidth: 2,
    backgroundColor: colors.primary + '03',
  },
  planHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 20,
  },
  planIcon: {
    width: 40,
    height: 40,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
  },
  planTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.gray900,
    letterSpacing: 0.3,
  },
  planFeatures: {
    gap: 14,
    marginBottom: 24,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
  },
  featureText: {
    flex: 1,
    fontSize: 15,
    color: colors.gray700,
    lineHeight: 22,
  },
  freeButton: {
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.gray300,
    backgroundColor: colors.white,
  },
  freeButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.gray700,
  },
  proButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    height: 52,
    borderRadius: 14,
    backgroundColor: colors.primary,
    gap: 8,
  },
  proButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.white,
  },
  finePrint: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: 24,
    paddingVertical: 16,
  },
  finePrintItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  finePrintText: {
    fontSize: 13,
    color: colors.gray500,
  },
});
