import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from './context/ThemeContext';
import { login } from './services/authService';
import { saveToken } from './utils/storage';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(t('error'), t('login.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const response = await login(email, password);
      await saveToken(response.token);
      router.replace({ pathname: '/(tabs)' } as any);
    } catch (error: any) {
      Alert.alert(t('error'), error.message || t('login.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.container}>
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: '#25D366' }]}>
          <View style={[styles.logoRow]}>
            <View style={styles.logoIconCircle}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#25D366" />
            </View>
            <Text style={[styles.logo, { color: '#25D366', fontFamily: 'sans-serif-medium', letterSpacing: 3 }]}>ChaTo</Text>
          </View>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'sans-serif', fontWeight: '700' }]}>{t('login.welcome')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: '#25D366', shadowColor: '#25D366' }]}
            placeholder={t('login.email')}
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={{ width: '100%', position: 'relative' }}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: '#25D366', shadowColor: '#25D366', paddingRight: 44 }]}
              placeholder={t('login.password')}
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={styles.eyeIcon}
              onPress={() => setShowPassword((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#25D366" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => router.push({ pathname: 'forgot-password' } as any)}
            style={styles.forgotLink}
          >
            <Text style={styles.forgotText}>{t('login.forgotPassword')}</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.button}
            onPress={handleLogin}
            disabled={loading}
            activeOpacity={0.85}
          >
            <View style={styles.buttonGradient}>
              {loading ? (
                <ActivityIndicator color={'#fff'} />
              ) : (
                <Text style={styles.buttonText}>{t('login.login')}</Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push({ pathname: 'register' } as any)}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>{t('login.noAccount')}</Text>
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#101a13',
  },
  card: {
    width: '100%',
    maxWidth: 370,
    borderRadius: 26,
    padding: 32,
    alignItems: 'center',
    shadowOpacity: 0.18,
    shadowRadius: 24,
    shadowOffset: { width: 0, height: 12 },
    elevation: 12,
    backgroundColor: '#181f1b',
  },
  logoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 10,
  },
  logoIconCircle: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: '#e8f9f0',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 10,
    borderWidth: 2,
    borderColor: '#25D366',
    shadowColor: '#25D366',
    shadowOpacity: 0.18,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 4,
  },
  logo: {
    fontSize: 40,
    fontWeight: 'bold',
    marginBottom: 10,
    letterSpacing: 3,
    color: '#25D366',
    textShadowColor: '#1b3c2a',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 28,
    textAlign: 'center',
    color: '#fff',
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    fontSize: 17,
    marginBottom: 18,
    backgroundColor: '#121a14',
    color: '#fff',
    shadowOpacity: 0.08,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    overflow: 'hidden',
  },
  buttonGradient: {
    width: '100%',
    height: '100%',
    borderRadius: 14,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
  registerLink: {
    marginTop: 10,
  },
  registerText: {
    fontSize: 15,
    textAlign: 'center',
    color: '#25D366',
    textDecorationLine: 'underline',
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 10,
  },
  forgotLink: {
    alignSelf: 'flex-end',
    marginBottom: 8,
  },
  forgotText: {
    color: '#25D366',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
}); 