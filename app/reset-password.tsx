import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Alert, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from './context/ThemeContext';
import { api } from './services/api';

export default function ResetPasswordScreen() {
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();

  const handleReset = async () => {
    if (!code || !newPassword || !confirmPassword) {
      Alert.alert(t('error'), t('register.fillAllFields'));
      return;
    }
    if (newPassword !== confirmPassword) {
      Alert.alert(t('error'), t('forgotPassword.passwordsNotMatch'));
      return;
    }
    setLoading(true);
    try {
      await api.resetPassword({ email: email as string, code, newPassword });
      Alert.alert(t('success'), t('forgotPassword.success'));
      router.replace({ pathname: 'login' } as any);
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
          placeholder={t('forgotPassword.code')}
          placeholderTextColor={colors.textSecondary}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
        />
        <View style={{ width: '100%', position: 'relative' }}>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: '#25D366', paddingRight: 44 }]}
            placeholder={t('forgotPassword.newPassword')}
            placeholderTextColor={colors.textSecondary}
            value={newPassword}
            onChangeText={setNewPassword}
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
        <TextInput
          style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: '#25D366' }]}
          placeholder={t('forgotPassword.confirmNewPassword')}
          placeholderTextColor={colors.textSecondary}
          value={confirmPassword}
          onChangeText={setConfirmPassword}
          secureTextEntry={!showPassword}
        />
        <TouchableOpacity
          style={styles.button}
          onPress={handleReset}
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
  eyeIcon: {
    position: 'absolute',
    right: 14,
    top: 14,
    zIndex: 10,
  },
}); 