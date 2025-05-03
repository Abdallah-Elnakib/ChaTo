import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { ActivityIndicator, Alert, I18nManager, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import I18n from './constants/i18n'; // المسار الصحيح إذا كان الملف داخل app
import { useTheme } from './context/ThemeContext';
import { login } from './services/authService';

import { useAuth } from './context/AuthContext';

export default function LoginScreen() {
  const [lang, setLang] = useState(I18n.locale);

  // عند بدء الشاشة، جلب اللغة من AsyncStorage وتعيينها
  useEffect(() => {
    AsyncStorage.getItem('appLang').then(storedLang => {
      if (storedLang && storedLang !== I18n.locale) {
        I18n.locale = storedLang;
        setLang(storedLang);
        I18nManager.forceRTL(storedLang === 'ar');
      }
    });
  }, []);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const { colors } = useTheme();



  const { login: authLogin } = useAuth();
  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(I18n.t('error'), I18n.t('login.fillAllFields'));
      return;
    }
    setLoading(true);
    try {
      const response = await login(email, password);
      await authLogin(response.token, response.user);
      // لا داعي للتوجيه هنا، سيتم التوجيه تلقائياً عبر RootLayoutNav
    } catch (error: any) {
      let errorMsg = error.message || I18n.t('login.failed');
      if (error.response && error.response.data) {
        if (error.response.data.message) {
          errorMsg = error.response.data.message;
        } else if (error.response.data.errors && Array.isArray(error.response.data.errors)) {
          const first = error.response.data.errors[0];
          if (typeof first === 'string') errorMsg = first;
          else if (first && first.msg) errorMsg = first.msg;
        }
      }
      Alert.alert(I18n.t('error'), errorMsg);
    } finally {
      setLoading(false);
    }
  };


  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: colors.background }}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
    >
      <View style={[styles.container, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
        <View style={[styles.card, { backgroundColor: colors.card, shadowColor: '#25D366' }]}>
          <View style={[styles.logoRow, { flexDirection: I18nManager.isRTL ? 'row-reverse' : 'row' }]}>
            <View style={styles.logoIconCircle}>
              <Ionicons name="chatbubble-ellipses" size={24} color="#25D366" />
            </View>
            <Text style={[styles.logo, { color: '#25D366', fontFamily: 'sans-serif-medium', letterSpacing: 3, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>ChaTo</Text>
          </View>
          <Text style={[styles.title, { color: colors.text, fontFamily: 'sans-serif', fontWeight: '700', textAlign: I18nManager.isRTL ? 'right' : 'left' }]}>{I18n.t('login.welcome')}</Text>
          <TextInput
            style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: '#25D366', shadowColor: '#25D366', textAlign: I18nManager.isRTL ? 'right' : 'left' }]} 
            placeholder={I18n.t('login.email')}
            placeholderTextColor={colors.textSecondary}
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            autoCapitalize="none"
          />
          <View style={{ width: '100%', position: 'relative' }}>
            <TextInput
              style={[styles.input, { backgroundColor: colors.background, color: colors.text, borderColor: '#25D366', shadowColor: '#25D366', paddingRight: 44, textAlign: I18nManager.isRTL ? 'right' : 'left' }]}
              placeholder={I18n.t('login.password')}
              placeholderTextColor={colors.textSecondary}
              value={password}
              onChangeText={setPassword}
              secureTextEntry={!showPassword}
            />
            <TouchableOpacity
              style={[styles.eyeIcon, I18nManager.isRTL ? { left: 14, right: undefined } : { right: 14, left: undefined }]}
              onPress={() => setShowPassword((prev) => !prev)}
              activeOpacity={0.7}
            >
              <Ionicons name={showPassword ? 'eye-off' : 'eye'} size={22} color="#25D366" />
            </TouchableOpacity>
          </View>
          <TouchableOpacity
            onPress={() => router.push({ pathname: 'forgot-password' } as any)}
            style={[
              styles.forgotLink,
              // ضبط المحاذاة حسب اتجاه اللغة
              { alignSelf: I18nManager.isRTL ? 'flex-start' : 'flex-end' }
            ]}
          >
            <Text style={styles.forgotText}>{I18n.t('login.forgotPassword')}</Text>
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
                <Text style={styles.buttonText}>{I18n.t('login.login')}</Text>
              )}
            </View>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push({ pathname: 'register' } as any)}
            style={styles.registerLink}
          >
            <Text style={styles.registerText}>{I18n.t('login.noAccount')}</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity
          onPress={async () => {
            const newLang = (I18n.locale === 'ar' ? 'en' : 'ar');
            I18n.locale = newLang;
            setLang(newLang);
            I18nManager.forceRTL(newLang === 'ar');
            await AsyncStorage.setItem('appLang', newLang);
            Alert.alert('تم تغيير اللغة', 'سيتم إعادة تحميل التطبيق الآن');
            try {
              const Updates = await import('expo-updates');
              if (Updates && Updates.reloadAsync) {
                await Updates.reloadAsync();
              } else {
                Alert.alert('خطأ', 'لم يتم العثور على expo-updates!');
              }
            } catch (e) {
              if (e instanceof Error) {
                Alert.alert('خطأ', 'فشل في إعادة تحميل التطبيق: ' + e.message);
              } else {
                Alert.alert('خطأ', 'فشل في إعادة تحميل التطبيق: ' + String(e));
              }
            }
          }}
          style={{
            position: 'absolute',
            top: 64,
            [lang === 'ar' ? 'left' : 'right']: 24,
            zIndex: 10
          }}
        >
          <Text style={{ color: colors.primary, fontWeight: 'bold', fontSize: 16 }}>
            {I18n.locale === 'ar' ? 'English' : 'العربية'}
          </Text>
        </TouchableOpacity>
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
    alignSelf: 'center', // توسيط الرابط في كل الاتجاهات
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
    // alignSelf ديناميكي في JSX
    marginBottom: 8,
  },
  forgotText: {
    color: '#25D366',
    fontSize: 14,
    fontWeight: '600',
    textDecorationLine: 'underline',
  },
}); 