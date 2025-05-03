import { Ionicons } from '@expo/vector-icons';
import { useRouter } from 'expo-router';
import React, { useState } from 'react';
import { Modal, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import I18n from '../constants/i18n';
import { useAuth } from '../context/AuthContext';
import { useLanguage } from '../context/LanguageContext';
import { useTheme } from '../context/ThemeContext';

type SettingOption = {
  name: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress?: () => void;
  type?: 'switch' | 'select';
  value?: boolean | string;
  onValueChange?: (value: boolean) => void;
};

type SettingsSection = {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  options: SettingOption[];
};

export default function SettingsScreen() {
  const { user, logout } = useAuth();
  const { darkMode, setDarkMode } = useTheme();
  const { locale, setLocale } = useLanguage();
  const [notifications, setNotifications] = useState(true);
  const [showLanguageModal, setShowLanguageModal] = useState(false);
  const router = useRouter();

  // Set the language label based on the current locale
  const language = locale === 'ar' ? I18n.t('arabic') : I18n.t('english');

  const handleLogout = async () => {
    await logout();
    router.replace({ pathname: 'login' } as any);
  };

  const handleLanguageChange = (lang: string) => {
    const newLocale = lang === I18n.t('english') ? 'en' : 'ar';
    setLocale(newLocale);
    setShowLanguageModal(false);
  };

  const settingsOptions: SettingsSection[] = [
    {
      title: I18n.t('settings'),
      icon: 'person',
      options: [
        { name: I18n.t('profile'), icon: 'person-circle', onPress: () => console.log('Profile') },
        { name: I18n.t('privacy'), icon: 'shield-checkmark', onPress: () => console.log('Privacy') },
        { name: I18n.t('security'), icon: 'lock-closed', onPress: () => console.log('Security') },
      ],
    },
    {
      title: I18n.t('preferences'),
      icon: 'options',
      options: [
        { 
          name: I18n.t('notifications'), 
          icon: 'notifications',
          type: 'switch',
          value: notifications,
          onValueChange: setNotifications,
        },
        { 
          name: I18n.t('darkMode'), 
          icon: 'moon',
          type: 'switch',
          value: darkMode,
          onValueChange: setDarkMode,
        },
        { 
          name: I18n.t('language'), 
          icon: 'language',
          type: 'select',
          value: language,
          onPress: () => setShowLanguageModal(true),
        },
      ],
    },
    {
      title: I18n.t('support'),
      icon: 'help-circle',
      options: [
        { name: I18n.t('help'), icon: 'help-buoy', onPress: () => console.log('Help') },
        { name: I18n.t('about'), icon: 'information-circle', onPress: () => console.log('About') },
        { name: I18n.t('logout'), icon: 'log-out', onPress: handleLogout },
      ],
    },
  ];

  return (
    <View style={[styles.container, darkMode && { backgroundColor: '#181818' }] }>
      {/* Header with logo and app name */}
      <View style={styles.header}>
        <Ionicons name="settings" size={32} color="#25D366" style={styles.logo} />
        <Text style={[styles.appName, darkMode && { color: '#25D366' }]}>ChaTo</Text>
      </View>

      {/* User Profile Section */}
      <View style={styles.profileSection}>
        <Ionicons name="person-circle" size={80} color="#25D366" />
        <Text style={[styles.userName, darkMode && { color: '#fff' }]}>{user?.username || I18n.t('userName')}</Text>
        <Text style={[styles.userEmail, darkMode && { color: '#bbb' }]}>{user?.email || I18n.t('userEmail')}</Text>
      </View>

      {/* Settings List */}
      <ScrollView style={styles.settingsList}>
        {settingsOptions.map((section, index) => (
          <View key={index} style={styles.section}>
            <Text style={[styles.sectionTitle, darkMode && { color: '#25D366' }]}>{section.title}</Text>
            {section.options.map((option, optionIndex) => (
              <TouchableOpacity
                key={optionIndex}
                style={[
                  styles.option,
                  darkMode && { backgroundColor: '#222', borderColor: '#333' }
                ]}
                onPress={option.onPress}
                activeOpacity={option.type === 'switch' ? 1 : 0.7}
              >
                <View style={styles.optionLeft}>
                  <Ionicons name={option.icon} size={24} color="#25D366" />
                  <Text style={[styles.optionText, darkMode && { color: '#fff' }]}>{option.name}</Text>
                </View>
                {option.type === 'switch' ? (
                  <Switch
                    value={option.value as boolean}
                    onValueChange={option.onValueChange}
                    trackColor={{ false: '#767577', true: '#81b0ff' }}
                    thumbColor={option.value ? '#25D366' : '#f4f3f4'}
                  />
                ) : option.type === 'select' ? (
                  <Text style={{color:'#25D366', fontWeight:'bold'}}>{option.value}</Text>
                ) : (
                  <Ionicons name="chevron-forward" size={24} color={darkMode ? '#bbb' : '#888'} />
                )}
              </TouchableOpacity>
            ))}
          </View>
        ))}
      </ScrollView>

      {/* Language Modal */}
      <Modal
        visible={showLanguageModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowLanguageModal(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, darkMode && { backgroundColor: '#222' }] }>
            <Text style={{fontWeight:'bold', fontSize:18, marginBottom:10, color: darkMode ? '#fff' : '#222'}}>{I18n.t('chooseLanguage')}</Text>
            {[I18n.t('english'), I18n.t('arabic')].map(lang => (
              <TouchableOpacity key={lang} onPress={() => handleLanguageChange(lang)}>
                <Text style={{fontSize:16, marginVertical:8, color: language === lang ? '#25D366' : (darkMode ? '#fff' : '#333')}}>{lang}</Text>
              </TouchableOpacity>
            ))}
            <TouchableOpacity onPress={() => setShowLanguageModal(false)}>
              <Text style={{color:'#888', marginTop:10}}>{I18n.t('close')}</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingTop: 24,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    marginBottom: 12,
    marginTop: 50,
  },
  logo: {
    marginRight: 10,
  },
  appName: {
    fontSize: 26,
    fontWeight: 'bold',
    color: '#25D366',
    letterSpacing: 1,
  },
  profileSection: {
    alignItems: 'center',
    paddingVertical: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
    marginBottom: 20,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginTop: 10,
    color: '#333',
  },
  userEmail: {
    fontSize: 14,
    color: '#888',
    marginTop: 5,
  },
  settingsList: {
    flex: 1,
  },
  section: {
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#888',
    marginLeft: 20,
    marginBottom: 10,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 1,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: '#eee',
  },
  optionLeft: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  optionText: {
    fontSize: 16,
    marginLeft: 15,
    color: '#333',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.3)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContent: {
    backgroundColor: '#fff',
    borderRadius: 16,
    padding: 24,
    minWidth: 220,
    alignItems: 'center',
    elevation: 5,
  },
}); 