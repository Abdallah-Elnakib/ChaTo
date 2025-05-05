import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { I18nManager, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';
import I18n from '../constants/i18n';
import { useTheme } from '../context/ThemeContext';
import ChatScreen from '../screens/ChatScreen';

export default function ChatsScreen() {
  const { darkMode } = useTheme();
  const [search, setSearch] = useState('');
  const [chats] = useState([]); // TODO: ربط مع السيرفر لجلب المحادثات

  return (
    <View style={[styles.container, darkMode && { backgroundColor: '#181818' }] }>
      {/* Header with logo and app name */}
      <View style={styles.header}>
        <Ionicons name="chatbubbles" size={32} color="#25D366" style={styles.logo} />
        <Text style={[styles.appName, darkMode && { color: '#25D366' }]}>ChaTo</Text>
      </View>

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, darkMode && { backgroundColor: '#333', borderColor: '#444' }] }>
          <Ionicons name="search" size={20} color={darkMode ? '#bbb' : '#888'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, darkMode && { color: '#fff' }]}
            placeholder={I18n.t('chats') + '...'}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={darkMode ? '#bbb' : '#888'}
            textAlign={I18nManager.isRTL ? 'right' : 'left'}
          />
        </View>
      </View>

      {/* Chats List or Empty State */}
      <ScrollView style={styles.content}>
        {chats.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="chatbubble-ellipses-outline" size={80} color="#25D366" style={styles.emptyIcon} />
            <Text style={[styles.emptyText, darkMode && { color: '#aaa' }]}>{I18n.t('noChats')}</Text>
            <Text style={[styles.emptySubText, darkMode && { color: '#888' }]}>{I18n.t('startConversation')}</Text>
          </View>
        ) : (
          <ChatScreen />
        )}
      </ScrollView>
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
  searchContainer: {
    paddingHorizontal: 20,
    marginBottom: 18,
  },
  searchInputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: '#eee',
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 4,
    elevation: 2,
  },
  searchIcon: {
    marginRight: 10,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: 16,
    color: '#333',
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 40,
  },
  emptyIcon: {
    marginBottom: 18,
    opacity: 0.7,
  },
  emptyText: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#888',
    marginBottom: 6,
  },
  emptySubText: {
    fontSize: 15,
    color: '#aaa',
  },
  content: {
    flex: 1,
  },
}); 