import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router';
import React from 'react';
import { Platform } from 'react-native';
import I18n from '../constants/i18n';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

export default function TabLayout() {
  const { darkMode } = useTheme();
  const { locale } = useLanguage();
  return (
    <Tabs
      key={locale}
      screenOptions={{
        tabBarActiveTintColor: '#25D366', // WhatsApp green for active
        tabBarInactiveTintColor: darkMode ? '#bbb' : '#888',
        tabBarStyle: {
          backgroundColor: darkMode ? '#181818' : '#fff',
          borderTopWidth: 0.5,
          borderTopColor: darkMode ? '#333' : '#eee',
          height: 65,
          paddingBottom: Platform.OS === 'ios' ? 20 : 10,
          shadowColor: '#000',
          shadowOffset: { width: 0, height: -2 },
          shadowOpacity: 0.08,
          shadowRadius: 8,
          elevation: 10,
        },
        tabBarLabelStyle: {
          fontSize: 14,
          fontWeight: 'bold',
          marginBottom: 4,
        },
        headerShown: false,
      }}
    >
      <Tabs.Screen
        name="chats"
        options={{
          title: I18n.t('chats'),
          tabBarIcon: ({ color, size }) => <Ionicons name="chatbubbles" size={size} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="friends"
        options={{
          title: I18n.t('friends'),
          tabBarIcon: ({ color, size }) => <Ionicons name="people" size={size} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: I18n.t('notifications'),
          tabBarIcon: ({ color, size }) => <Ionicons name="notifications" size={size} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="ai"
        options={{
          title: I18n.t('ai'),
          tabBarIcon: ({ color, size }) => <Ionicons name="logo-electron" size={size} color={color} />, 
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: I18n.t('settings'),
          tabBarIcon: ({ color, size }) => <Ionicons name="settings" size={size} color={color} />, 
        }}
      />
    </Tabs>
  );
}
