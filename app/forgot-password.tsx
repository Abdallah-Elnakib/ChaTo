import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from './context/ThemeContext';
import { api } from './services/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleSend = async () => {
    if (!email) {
      Alert.alert(t('error'), t('register.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      await api.forgotPassword(email);
      Alert.alert(t('success'), t('forgotPassword.codeSent'));
      router.push({ pathname: 'reset-password', params: { email } } as any);
    } catch (error: any) {
      Alert.alert(t('error'), error.response?.data?.message || t('forgotPassword.failed'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={[styles.card, { backgroundColor: colors.card, shadowColor: '#25D366' }] }>
        <Text style={[styles.title, { color: colors.primary }]}>{t('forgotPassword.title')}</Text>
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: '#25D366' }]}
          placeholder={t('forgotPassword.email')}
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleSend}
          disabled={loading}
          activeOpacity={0.85}
        >
          {loading ? (
            <ActivityIndicator color={'#fff'} />
          ) : (
            <Text style={styles.buttonText}>{t('forgotPassword.send')}</Text>
          )}
        </TouchableOpacity>
      </View>
    </View>
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
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 28,
    textAlign: 'center',
    color: '#25D366',
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
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 14,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 8,
    marginBottom: 8,
    backgroundColor: '#25D366',
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
}); 