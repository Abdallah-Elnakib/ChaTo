import { Ionicons } from '@expo/vector-icons';
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
      Alert.alert(
        t('error'),
        error.response?.data?.message || error.message || t('forgotPassword.failed')
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }] }>
      <View style={styles.cardShadow}>
        <View style={[styles.card, { backgroundColor: colors.card }] }>
          <View style={styles.iconTitleRow}>
            <Ionicons name="lock-closed-outline" size={28} color="#25D366" style={{ marginRight: 8 }} />
            <Text style={[styles.title, { color: '#25D366' }]}>{t('forgotPassword.title')}</Text>
          </View>
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
  cardShadow: {
    borderRadius: 30,
    shadowColor: '#25D366',
    shadowOpacity: 0.25,
    shadowRadius: 30,
    shadowOffset: { width: 0, height: 8 },
    elevation: 16,
  },
  card: {
    width: 340,
    borderRadius: 30,
    padding: 32,
    alignItems: 'center',
    backgroundColor: '#181f1b',
  },
  iconTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 18,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    letterSpacing: 1,
  },
  input: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    borderWidth: 1.5,
    paddingHorizontal: 18,
    fontSize: 17,
    marginBottom: 22,
    backgroundColor: '#121a14',
    color: '#fff',
  },
  button: {
    width: '100%',
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#25D366',
    marginTop: 8,
  },
  buttonText: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    letterSpacing: 1,
  },
}); 