import React, { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ScrollView } from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '@/src/hooks/useTheme';
import { useAuthStore } from '@/src/store/authStore';
import { Button, TextInput } from '@/src/components';
import { spacing, typography } from '@/src/utils/theme';

export default function RegisterScreen() {
  const router = useRouter();
  const { colors } = useTheme();
  const { register, isLoading } = useAuthStore();
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const handleRegister = async () => {
    if (!email || !password) {
      Alert.alert('Error', 'Please fill in all required fields');
      return;
    }

    if (password.length < 6) {
      Alert.alert('Error', 'Password must be at least 6 characters');
      return;
    }

    if (password !== confirmPassword) {
      Alert.alert('Error', 'Passwords do not match');
      return;
    }

    try {
      await register(email, password, name || undefined);
      router.replace('/onboarding');
    } catch (error: any) {
      Alert.alert('Error', error.message);
    }
  };

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardView}
      >
        <ScrollView
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
            hitSlop={{ top: 15, bottom: 15, left: 15, right: 15 }}
            accessibilityLabel="Go back"
            accessibilityRole="button"
          >
            <Ionicons name="arrow-back" size={24} color={colors.text} />
          </TouchableOpacity>

          <View style={styles.header}>
            <Text style={[styles.title, { color: colors.text }]}>Create account</Text>
            <Text style={[styles.subtitle, { color: colors.textSecondary }]}>
              Start building your content vault
            </Text>
          </View>

          <View style={styles.form}>
            <TextInput
              label="Name (optional)"
              value={name}
              onChangeText={setName}
              placeholder="Your name"
              autoCapitalize="words"
            />

            <TextInput
              label="Email"
              value={email}
              onChangeText={setEmail}
              placeholder="you@example.com"
              keyboardType="email-address"
              autoCapitalize="none"
              autoComplete="email"
            />

            <View>
              <TextInput
                label="Password"
                value={password}
                onChangeText={setPassword}
                placeholder="At least 6 characters"
                secureTextEntry={!showPassword}
              />
              <TouchableOpacity
                style={styles.eyeButton}
                onPress={() => setShowPassword(!showPassword)}
              >
                <Ionicons
                  name={showPassword ? 'eye-off' : 'eye'}
                  size={20}
                  color={colors.textMuted}
                />
              </TouchableOpacity>
            </View>

            <TextInput
              label="Confirm Password"
              value={confirmPassword}
              onChangeText={setConfirmPassword}
              placeholder="Confirm your password"
              secureTextEntry={!showPassword}
            />

            <Button
              title="Create Account"
              onPress={handleRegister}
              loading={isLoading}
              style={{ marginTop: spacing.lg }}
              size="lg"
            />
          </View>

          <View style={styles.footer}>
            <Text style={[styles.footerText, { color: colors.textSecondary }]}>
              Already have an account?{' '}
            </Text>
            <TouchableOpacity onPress={() => router.replace('/login')}>
              <Text style={[styles.footerLink, { color: colors.accent }]}>
                Sign in
              </Text>
            </TouchableOpacity>
          </View>
        </ScrollView>
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
    flexGrow: 1,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
  },
  backButton: {
    marginTop: spacing.md,
    marginBottom: spacing.xl,
    width: 40,
    height: 40,
    justifyContent: 'center',
  },
  header: {
    marginBottom: spacing.xl,
  },
  title: {
    fontSize: typography.h1.fontSize,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  subtitle: {
    fontSize: typography.body.fontSize,
  },
  form: {
    flex: 1,
  },
  eyeButton: {
    position: 'absolute',
    right: spacing.md,
    top: 38,
    padding: spacing.sm,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: spacing.xl,
  },
  footerText: {
    fontSize: typography.body.fontSize,
  },
  footerLink: {
    fontSize: typography.body.fontSize,
    fontWeight: '600',
  },
});
