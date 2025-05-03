import { Slot, useRouter, useSegments } from 'expo-router';
import React from 'react';
import { ActivityIndicator, Text, View } from 'react-native';
import { AuthProvider, useAuth } from './context/AuthContext';
import { LanguageProvider } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import './utils/i18n';

function RootLayoutNav() {
  const { loading, isAuthenticated } = useAuth();
  const router = useRouter();
  const segments = useSegments();

  React.useEffect(() => {
    const inAuthPages = ['login', 'register', 'forgot-password', 'reset-password', 'verify-email'].includes(segments[0]);
    if (!loading && !isAuthenticated && !inAuthPages) {
      router.replace({ pathname: 'login' } as any);
    }
    // إذا أصبح المستخدم موثّقًا وهو في صفحات auth، انقله إلى التبويبات
    if (!loading && isAuthenticated && inAuthPages) {
      router.replace({ pathname: '/(tabs)/chats' } as any);
    }
  }, [loading, isAuthenticated, router, segments]);

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color="#007AFF" />
        <Text style={{ marginTop: 16, fontSize: 18 }}>Loading...</Text>
      </View>
    );
  }

  return <Slot />;
}

export default function RootLayout() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <LanguageProvider>
          <RootLayoutNav />
        </LanguageProvider>
      </ThemeProvider>
    </AuthProvider>
  );
}
