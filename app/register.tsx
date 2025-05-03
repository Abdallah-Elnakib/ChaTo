import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from './context/ThemeContext';
import { api } from './services/api';

export default function RegisterScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleRegister = async () => {
    if (password !== confirmPassword) {
      Alert.alert(t('error'), t('register.passwordsNotMatch'));
      return;
    }

    if (!name || !email || !password) {
      Alert.alert(t('error'), t('register.fillAllFields'));
      return;
    }

    setLoading(true);
    try {
      await api.register({ name, email, password });
      Alert.alert(t('success'), t('register.success'));
      router.replace({ pathname: '/verify-email', params: { email } } as any);
    } catch (error: any) {
      if (error.message === 'Network Error') {
        Alert.alert(t('error'), t('register.networkError'));
      } else {
        Alert.alert(t('error'), error.response?.data?.message || t('register.failed'));
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <Text style={[styles.title, { color: colors.text }]}>
        {t('register.title')}
      </Text>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border
          }]}
          placeholder={t('register.name')}
          placeholderTextColor={colors.textSecondary}
          value={name}
          onChangeText={setName}
          autoCapitalize="words"
        />
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border
          }]}
          placeholder={t('register.email')}
          placeholderTextColor={colors.textSecondary}
          value={email}
          onChangeText={setEmail}
          keyboardType="email-address"
          autoCapitalize="none"
        />
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border
          }]}
          placeholder={t('register.password')}
          placeholderTextColor={colors.textSecondary}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
        />
        <TextInput
          style={[styles.input, { 
            backgroundColor: colors.card,
            color: colors.text,
            borderColor: colors.border
          }]}
          placeholder={t('register.confirmPassword')}
          placeholderTextColor={colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry
        />
      </View>
      <TouchableOpacity
        style={[styles.button, { backgroundColor: colors.primary }]}
        onPress={handleRegister}
        disabled={loading}
      >
        {loading ? (
          <ActivityIndicator color={colors.buttonText} />
        ) : (
          <Text style={[styles.buttonText, { color: colors.buttonText }]}>
            {t('register.register')}
          </Text>
        )}
      </TouchableOpacity>
      <TouchableOpacity
        onPress={() => router.back()}
        style={styles.loginLink}
      >
        <Text style={[styles.loginText, { color: colors.primary }]}>
          {t('register.haveAccount')}
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    justifyContent: 'center',
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 30,
    textAlign: 'center',
  },
  inputContainer: {
    gap: 15,
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  button: {
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonText: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 10,
  },
  loginText: {
    fontSize: 16,
    textAlign: 'center',
  },
}); 