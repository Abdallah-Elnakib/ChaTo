import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import i18n from '../i18n';
import { useTranslation } from 'react-i18next';
import { KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { useTheme } from './context/ThemeContext';
import { api } from './services/api';

interface FormData {
  name: string;
  email: string;
  password: string;
  confirmPassword: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  password?: string;
  confirmPassword?: string;
  submit?: string;
}

export default function Register() {
  const { colors } = useTheme();
  // زر تغيير اللغة في الأعلى
  const langButton = (
    <TouchableOpacity
      onPress={() => {
        const newLang = (i18n.language === 'ar' ? 'en' : 'ar');
        i18n.changeLanguage(newLang);
      }}
      style={{
        position: 'absolute',
        top: 64,
        [i18n.language === 'ar' ? 'left' : 'right']: 24,
        zIndex: 10
      }}
    >
      <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>
        {i18n.language === 'ar' ? 'English' : 'العربية'}
      </Text>
    </TouchableOpacity>
  );
  const router = useRouter();
  const { t } = useTranslation('translation');
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    password: '',
    confirmPassword: '',
  });
  const [errors, setErrors] = useState<FormErrors>({});
  const [isLoading, setIsLoading] = useState(false);

  const validateForm = () => {
    const newErrors: FormErrors = {};
    if (!formData.name) newErrors.name = t('register.nameRequired');
    if (!formData.email) newErrors.email = t('register.emailRequired');
    if (!formData.password) newErrors.password = t('register.passwordRequired');
    if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = t('register.passwordsDontMatch');
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validateForm()) return;
    
    setIsLoading(true);
    try {
      const response = await api.register(formData);
      if (response.success || (typeof response.message === 'string' && response.message.toLowerCase().includes('account created'))) {
        router.replace({ pathname: '/verify-email', params: { email: formData.email } } as any);
      } else {
        setErrors({ submit: response.message || t('register.registrationFailed') });
      }
    } catch (error: any) {
      let errorMsg = error.message || t('register.registrationFailed');
      // معالجة خطأ تكرار اسم المستخدم
      if (
        error.response &&
        error.response.data &&
        error.response.data.error &&
        error.response.data.error.includes('duplicate key error') &&
        error.response.data.error.includes('username')
      ) {
        errorMsg = t('register.usernameExists') || 'اسم المستخدم مستخدم بالفعل. يرجى اختيار اسم آخر.';
      }
      setErrors({ submit: errorMsg });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {langButton}
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={styles.logoContainer}>
        <Ionicons name="chatbubble-ellipses" size={48} color="#25D366" />
        <Text style={[styles.titleLogo, { textAlign: i18n.language === 'ar' ? 'right' : 'left' }]}>ChaTo</Text>
        <Text style={[styles.subtitle, { textAlign: i18n.language === 'ar' ? 'right' : 'left' }]}>{t('register.createAccount')}</Text>
      </View>
      <View style={styles.formContainer}>
        <View style={[styles.inputWrapper, { flexDirection: i18n.language === 'ar' ? 'row-reverse' : 'row' }]}>
          <Ionicons name="person-outline" size={20} color="#25D366" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { textAlign: i18n.language === 'ar' ? 'right' : 'left' }]}
            placeholder={t('register.name')}
            placeholderTextColor="#888"
            value={formData.name}
            onChangeText={(text) => setFormData({ ...formData, name: text })}
          />
        </View>
        {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}

        <View style={[styles.inputWrapper, { flexDirection: i18n.language === 'ar' ? 'row-reverse' : 'row' }]}>
          <Ionicons name="mail-outline" size={20} color="#25D366" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { textAlign: i18n.language === 'ar' ? 'right' : 'left' }]}
            placeholder={t('register.email')}
            placeholderTextColor="#888"
            value={formData.email}
            onChangeText={(text) => setFormData({ ...formData, email: text })}
            keyboardType="email-address"
            autoCapitalize="none"
          />
        </View>
        {errors.email && <Text style={styles.errorText}>{errors.email}</Text>}

        <View style={[styles.inputWrapper, { flexDirection: i18n.language === 'ar' ? 'row-reverse' : 'row' }]}>
          <Ionicons name="lock-closed-outline" size={20} color="#25D366" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { textAlign: i18n.language === 'ar' ? 'right' : 'left' }]}
            placeholder={t('register.password')}
            placeholderTextColor="#888"
            value={formData.password}
            onChangeText={(text) => setFormData({ ...formData, password: text })}
            secureTextEntry
          />
        </View>
        {errors.password && <Text style={styles.errorText}>{errors.password}</Text>}

        <View style={[styles.inputWrapper, { flexDirection: i18n.language === 'ar' ? 'row-reverse' : 'row' }]}>
          <Ionicons name="lock-closed-outline" size={20} color="#25D366" style={styles.inputIcon} />
          <TextInput
            style={[styles.input, { textAlign: i18n.language === 'ar' ? 'right' : 'left' }]}
            placeholder={t('register.confirmPassword')}
            placeholderTextColor="#888"
            value={formData.confirmPassword}
            onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
            secureTextEntry
          />
        </View>
        {errors.confirmPassword && <Text style={styles.errorText}>{errors.confirmPassword}</Text>}

        {errors.submit && <Text style={styles.errorText}>{errors.submit}</Text>}

        <TouchableOpacity
          style={[styles.button, isLoading && styles.buttonDisabled]}
          onPress={handleRegister}
          disabled={isLoading}
        >
          <Text style={styles.buttonText}>
              {isLoading ? t('register.creatingAccount') : t('register.createAccount')}
            </Text>
          </TouchableOpacity>

        <View style={[styles.loginContainer, { flexDirection: i18n.language === 'ar' ? 'row-reverse' : 'row' }]}>
          <Text style={[styles.loginText, { textAlign: i18n.language === 'ar' ? 'right' : 'left' }]}>
              {t('register.alreadyHaveAccount')}
            </Text>
          <TouchableOpacity onPress={() => router.replace({ pathname: '/login' } as any)}>
            <Text style={[styles.loginLink, { textAlign: i18n.language === 'ar' ? 'right' : 'left' }]}>{t('register.login')}</Text>
          </TouchableOpacity>
        </View>
      </View>

    </KeyboardAvoidingView>
    </>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#101a13',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 16,
  },
  logoContainer: {
    alignItems: 'center',
    marginBottom: 48,
  },
  titleLogo: {
    fontSize: 36,
    fontWeight: 'bold',
    color: '#25D366',
    marginTop: 8,
    letterSpacing: 3,
    textShadowColor: '#1b3c2a',
    textShadowOffset: { width: 0, height: 2 },
    textShadowRadius: 8,
  },
  subtitle: {
    color: '#fff',
    fontSize: 18,
    marginTop: 4,
    marginBottom: 16,
    textAlign: 'center',
    fontWeight: '600',
  },
  formContainer: {
    width: '100%',
    maxWidth: 350,
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#181f1b',
    borderRadius: 12,
    marginBottom: 18,
    paddingHorizontal: 14,
    borderWidth: 1,
    borderColor: '#23262F',
    shadowColor: '#25D366',
    shadowOpacity: 0.08,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  inputIcon: {
    marginRight: 8,
  },
  input: {
    flex: 1,
    color: '#FFF',
    fontSize: 16,
    paddingVertical: 14,
    backgroundColor: 'transparent',
    fontWeight: '500',
  },
  button: {
    backgroundColor: '#25D366',
    borderRadius: 12,
    paddingVertical: 16,
    alignItems: 'center',
    marginTop: 16,
    marginBottom: 16,
    elevation: 2,
    shadowColor: '#25D366',
    shadowOpacity: 0.15,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: '#fff',
    fontWeight: 'bold',
    fontSize: 18,
    letterSpacing: 1,
  },
  loginContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 10,
    alignItems: 'center',
  },
  loginText: {
    color: '#888',
    marginRight: 4,
    fontSize: 15,
  },
  loginLink: {
    color: '#25D366',
    fontWeight: 'bold',
    fontSize: 15,
    textDecorationLine: 'underline',
  },
  errorText: {
    color: '#ff4444',
    fontSize: 14,
    marginBottom: 10,
    marginLeft: 8,
  },
});