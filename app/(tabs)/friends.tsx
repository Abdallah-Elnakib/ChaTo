import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, Image, Modal, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import I18n from '../constants/i18n';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import getServerUrl from '../utils/server';
// لا تحفظ السيرفر في متغير ثابت، استدعِ الدالة مباشرة عند كل طلب
// const SERVER_URL = getServerUrl();

export default function FriendsScreen() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [friends] = useState([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  const handleAddFriend = () => {
    setShowAddModal(true);
    setSearchEmail('');
    setSearchResult(null);
    setSearchError('');
  };

  const handleSearch = async () => {
    setSearchLoading(true);
    setSearchResult(null);
    setSearchError('');
    try {
      const url = `${getServerUrl()}/friends/search?query=` + encodeURIComponent(searchEmail);
      console.log('Searching friend at:', url);
      console.log('Token used:', token);
      const res = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const data = await res.json();
      console.log('Search response:', data);
      Alert.alert(
        'تفاصيل البحث',
        `Status: ${res.status}\nToken: ${token?.slice(0, 20)}...\nResponse: ${JSON.stringify(data)}`
      );
      if (res.ok && data.users && data.users.length > 0) {
        // Exclude self
        const found = data.users.find((u: any) => u.email === searchEmail && u._id !== user._id);
        if (found) setSearchResult(found);
        else setSearchError(I18n.t('noFriends'));
      } else {
        setSearchError(I18n.t('noFriends'));
      }
    } catch (e: any) {
      setSearchError(I18n.t('errorOccurred', { error: e.message }));
      Alert.alert('خطأ في البحث', e.message || JSON.stringify(e));
    }
    setSearchLoading(false);
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;
    setActionLoading(true);
    try {
      const url = `${getServerUrl()}/friends/request`;
      console.log('Sending friend request to:', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUserId: searchResult._id }),
      });
      const data = await res.json();
      console.log('Friend request response:', data);
      if (res.ok) {
        Alert.alert(I18n.t('addFriend'), I18n.t('friendRequest'));
      } else {
        Alert.alert(I18n.t('addFriend'), data.message || I18n.t('errorOccurred', { error: '' }));
      }
    } catch (e: any) {
      Alert.alert(I18n.t('addFriend'), I18n.t('errorOccurred', { error: e.message }));
    }
    setActionLoading(false);
  };

  const handleBlock = async () => {
    if (!searchResult) return;
    setActionLoading(true);
    try {
      const url = `${getServerUrl()}/friends/block`;
      console.log('Sending block request to:', url);
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ userIdToBlock: searchResult._id }),
      });
      const data = await res.json();
      console.log('Block response:', data);
      if (res.ok) {
        Alert.alert(I18n.t('addFriend'), I18n.t('blocked'));
      } else {
        Alert.alert(I18n.t('addFriend'), data.message || I18n.t('errorOccurred', { error: '' }));
      }
    } catch (e: any) {
      Alert.alert(I18n.t('addFriend'), I18n.t('errorOccurred', { error: e.message }));
    }
    setActionLoading(false);
  };

  const handleProfile = () => {
    // يمكنك هنا توجيه المستخدم لصفحة البروفايل
    Alert.alert(I18n.t('profile'), `${searchResult.username}\n${searchResult.email}`);
  };

  return (
    <View style={[styles.container, darkMode && { backgroundColor: '#222' }] }>
      {/* Header with logo and app name */}
      <View style={styles.header}>
        <Ionicons name="people" size={32} color="#25D366" style={styles.logo} />
        <Text style={[styles.appName, darkMode && { color: '#25D366' } ]}>ChaTo</Text>
      </View>

      {/* Search Bar and Add Friend Button */}
      <View style={styles.searchContainer}>
        <View style={[styles.searchInputContainer, darkMode && { backgroundColor: '#333', borderColor: '#444' }] }>
          <Ionicons name="search" size={20} color={darkMode ? '#bbb' : '#888'} style={styles.searchIcon} />
          <TextInput
            style={[styles.searchInput, darkMode && { color: '#fff' }]}
            placeholder={I18n.t('searchFriends')}
            value={search}
            onChangeText={setSearch}
            placeholderTextColor={darkMode ? '#bbb' : '#888'}
          />
        </View>
        <TouchableOpacity style={styles.addButton} onPress={handleAddFriend}>
          <Ionicons name="person-add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      {/* Friends List or Empty State */}
      <ScrollView style={styles.content}>
        {friends.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="people-outline" size={80} color="#25D366" style={styles.emptyIcon} />
            <Text style={[styles.emptyText, darkMode && { color: '#aaa' }]}>{I18n.t('noFriends')}</Text>
            <Text style={[styles.emptySubText, darkMode && { color: '#888' }]}>{I18n.t('addFriendsToStart')}</Text>
            <TouchableOpacity style={styles.addFriendButton} onPress={handleAddFriend}>
              <Text style={styles.addFriendButtonText}>{I18n.t('addFriend')}</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View>
            {/* قائمة الأصدقاء ستأتي هنا */}
          </View>
        )}
      </ScrollView>

      {/* Add Friend Modal */}
      <Modal
        visible={showAddModal}
        transparent
        animationType="slide"
        onRequestClose={() => setShowAddModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.3)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: darkMode ? '#222' : '#fff', borderRadius: 16, padding: 24, minWidth: 300, alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 18, marginBottom: 10, color: darkMode ? '#fff' : '#222' }}>{I18n.t('addFriend')}</Text>
            <TextInput
              style={{ borderWidth: 1, borderColor: '#ccc', borderRadius: 10, padding: 10, width: 220, marginBottom: 12, color: darkMode ? '#fff' : '#222', backgroundColor: darkMode ? '#181818' : '#f7f7f7' }}
              placeholder={I18n.t('userEmail')}
              value={searchEmail}
              onChangeText={setSearchEmail}
              autoCapitalize="none"
              keyboardType="email-address"
              placeholderTextColor={darkMode ? '#aaa' : '#888'}
            />
            <TouchableOpacity style={{ backgroundColor: '#25D366', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10, marginBottom: 10 }} onPress={handleSearch} disabled={searchLoading || !searchEmail}>
              {searchLoading ? <ActivityIndicator color="#fff" /> : <Text style={{ color: '#fff', fontWeight: 'bold' }}>{I18n.t('searchFriends')}</Text>}
            </TouchableOpacity>
            {searchError ? <Text style={{ color: 'red', marginBottom: 8 }}>{searchError}</Text> : null}
            {searchResult && (
  <View style={{
    alignItems: 'center',
    marginTop: 16,
    backgroundColor: darkMode ? '#23272f' : '#fff',
    borderRadius: 20,
    paddingVertical: 28,
    paddingHorizontal: 20,
    shadowColor: '#000',
    shadowOpacity: 0.16,
    shadowRadius: 14,
    elevation: 10,
    borderWidth: 1,
    borderColor: darkMode ? '#2d2d2d' : '#e0e0e0',
    width: 300,
  }}>
    <View style={{
      backgroundColor: darkMode ? '#181818' : '#f5f5f5',
      borderRadius: 50,
      padding: 6,
      marginBottom: 12,
      shadowColor: '#25D366',
      shadowOpacity: 0.2,
      shadowRadius: 10,
      elevation: 4,
    }}>
      {searchResult.avatar ? (
        <Image source={{ uri: searchResult.avatar }} style={{ width: 80, height: 80, borderRadius: 40, borderWidth: 2, borderColor: '#25D366' }} />
      ) : (
        <Ionicons name="person-circle" size={80} color="#25D366" />
      )}
    </View>
    <Text style={{ fontWeight: 'bold', fontSize: 22, color: darkMode ? '#fff' : '#222', marginBottom: 3 }}>{searchResult.username}</Text>
    <Text style={{ fontSize: 15, color: darkMode ? '#bbb' : '#888', marginBottom: 20 }}>{searchResult.email}</Text>
    <TouchableOpacity style={{ backgroundColor: '#25D366', borderRadius: 14, paddingVertical: 13, marginBottom: 12, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 2 }} onPress={handleSendRequest} disabled={actionLoading}>
      <Ionicons name="person-add" size={20} color="#fff" style={{ marginRight: 8 }} />
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>{I18n.t('addFriend')}</Text>
    </TouchableOpacity>
    <TouchableOpacity style={{ backgroundColor: '#e53935', borderRadius: 14, paddingVertical: 13, marginBottom: 12, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 2 }} onPress={handleBlock} disabled={actionLoading}>
      <Ionicons name="close-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>{I18n.t('block') && !I18n.t('block').includes('translation') ? I18n.t('block') : 'Block'}</Text>
    </TouchableOpacity>
    <TouchableOpacity style={{ backgroundColor: '#2196F3', borderRadius: 14, paddingVertical: 13, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 2 }} onPress={handleProfile}>
      <Ionicons name="person" size={20} color="#fff" style={{ marginRight: 8 }} />
      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>{I18n.t('profile')}</Text>
    </TouchableOpacity>
  </View>
)}
            <TouchableOpacity onPress={() => setShowAddModal(false)} style={{ marginTop: 18 }}>
              <Text style={{ color: '#888' }}>{I18n.t('close')}</Text>
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
  searchContainer: {
    flexDirection: 'row',
    paddingHorizontal: 20,
    marginBottom: 18,
    alignItems: 'center',
  },
  searchInputContainer: {
    flex: 1,
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
  addButton: {
    backgroundColor: '#25D366',
    width: 40,
    height: 40,
    borderRadius: 20,
    justifyContent: 'center',
    alignItems: 'center',
    marginLeft: 10,
  },
  content: {
    flex: 1,
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
    marginBottom: 20,
  },
  addFriendButton: {
    backgroundColor: '#25D366',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 20,
    marginTop: 10,
  },
  addFriendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  friendsList: {
    paddingHorizontal: 20,
  },
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  friendInfo: {
    marginLeft: 15,
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  friendStatus: {
    fontSize: 14,
    color: '#888',
  },
}); 