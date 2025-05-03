import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Localization from 'expo-localization';
import { createInstance } from 'i18next';
import { initReactI18next } from 'react-i18next';

const LANGUAGES = {
    en: {
        translation: {
            login: {
                welcome: 'Welcome to ChaTo',
                email: 'Email',
                password: 'Password',
                login: 'Login',
                noAccount: 'Don\'t have an account? Register',
                fillAllFields: 'Please fill in all fields',
                failed: 'Login failed. Please try again.',
                forgotPassword: 'Forgot password?'
            },
            forgotPassword: {
                title: 'Forgot Password',
                email: 'Email',
                send: 'Send Reset Code',
                code: 'Reset Code',
                newPassword: 'New Password',
                confirmNewPassword: 'Confirm New Password',
                success: 'Password reset successful! You can now login.',
                failed: 'Failed to reset password. Please try again.',
                codeSent: 'A reset code has been sent to your email.',
                passwordsNotMatch: 'Passwords do not match.'
            },
            error: 'Error'
        }
    },
    ar: {
        translation: {
            login: {
                welcome: 'مرحباً بك في تشاتو',
                email: 'البريد الإلكتروني',
                password: 'كلمة المرور',
                login: 'تسجيل الدخول',
                noAccount: 'ليس لديك حساب؟ سجل الآن',
                fillAllFields: 'الرجاء ملء جميع الحقول',
                failed: 'فشل تسجيل الدخول. الرجاء المحاولة مرة أخرى.',
                forgotPassword: 'نسيت كلمة المرور؟'
            },
            forgotPassword: {
                title: 'نسيت كلمة المرور',
                email: 'البريد الإلكتروني',
                send: 'إرسال رمز الاستعادة',
                code: 'رمز الاستعادة',
                newPassword: 'كلمة المرور الجديدة',
                confirmNewPassword: 'تأكيد كلمة المرور الجديدة',
                success: 'تمت إعادة تعيين كلمة المرور بنجاح! يمكنك الآن تسجيل الدخول.',
                failed: 'فشل في إعادة تعيين كلمة المرور. حاول مرة أخرى.',
                codeSent: 'تم إرسال رمز الاستعادة إلى بريدك الإلكتروني.',
                passwordsNotMatch: 'كلمتا المرور غير متطابقتين.'
            },
            error: 'خطأ'
        }
    }
};

const LANGUAGE_DETECTOR = {
    type: 'languageDetector',
    async: true,
    detect: async (callback: (lng: string) => void) => {
        try {
            const savedLanguage = await AsyncStorage.getItem('user-language');
            if (savedLanguage) {
                return callback(savedLanguage);
            }
            return callback(Localization.locale.split('-')[0]);
        } catch (error) {
            console.log('Error reading language', error);
        }
    },
    init: () => { },
    cacheUserLanguage: async (lng: string) => {
        try {
            await AsyncStorage.setItem('user-language', lng);
        } catch (error) {
            console.log('Error saving language', error);
        }
    }
};

const i18n = createInstance();

i18n
    .use(LANGUAGE_DETECTOR as any)
    .use(initReactI18next)
    .init({
        resources: LANGUAGES,
        fallbackLng: 'en',
        interpolation: {
            escapeValue: false
        },
        react: {
            useSuspense: false
        }
    });

export default i18n; 