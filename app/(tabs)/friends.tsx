import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Image, Modal, Pressable, ScrollView, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import { showMessage } from 'react-native-flash-message';
import I18n from '../constants/i18n';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';

import getServerUrl from '../utils/server';

function formatLastSeen(dateStr: string | undefined) {
  if (!dateStr) return '';
  const date = new Date(dateStr);
  const now = new Date();
  const diff = Math.floor((now.getTime() - date.getTime()) / 60000); // minutes
  if (diff < 1) return 'Online';
  if (diff < 60) return `Last seen ${diff} min ago`;
  if (diff < 1440) return `Last seen ${Math.floor(diff/60)}h ago`;
  return `Last seen ${date.toLocaleDateString()} ${date.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'})}`;
}

export default function FriendsScreen() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [search, setSearch] = useState('');
  const [friends, setFriends] = useState<any[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchEmail, setSearchEmail] = useState('');
  const [searchResult, setSearchResult] = useState<any>(null);
  const [searchLoading, setSearchLoading] = useState(false);
  const [searchError, setSearchError] = useState('');
  const [actionLoading, setActionLoading] = useState(false);
  const [token, setToken] = useState<string | null>(null);

  // Friend requests state
  const [friendRequests, setFriendRequests] = useState<any[]>([]);

  const [showNameModal, setShowNameModal] = useState(false);
  const [modalName] = useState('');

  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [friendToDelete, setFriendToDelete] = useState<any>(null);

  const [activeTab, setActiveTab] = useState<'friends' | 'requests' | 'blocked'>('friends');

  const [blockedUsers, setBlockedUsers] = useState<any[]>([]);

  const [showUnblockModal, setShowUnblockModal] = useState(false);
  const [userToUnblock, setUserToUnblock] = useState<any>(null);

  useEffect(() => {
    AsyncStorage.getItem('token').then(setToken);
  }, []);

  // Fetch friend requests from notifications
  useEffect(() => {
    async function fetchFriendRequests() {
      if (!user || !user.id) return;
      try {
        let t = token;
        if (!t) t = await AsyncStorage.getItem('token');
        const res = await fetch(`${getServerUrl()}/notifications?userId=${user.id}`, {
  headers: {
    'Content-Type': 'application/json',
    ...(t ? { Authorization: `Bearer ${t}` } : {}),
  },
});
        const data = await res.json();
        console.log('Fetched notifications:', data);
        if (res.ok && data.notifications) {

const filtered = data.notifications.filter((n: any) => n.type === 'friend_request' && !n.isRead)
  .map((n: any) => ({
    ...n,
    fromUserId: n.fromUserId || n.user, 
    fromName: n.fromName || n.username || n.name || (n.content && n.content.split(' sent')[0]) || n.user, 
    fromAvatar: n.fromAvatar || n.avatar || null,
  }));
console.log('Filtered friend requests:', filtered);
setFriendRequests(filtered);
        }
      } catch (e: any) {
        showMessage({
          message: 'Error',
          description: e.message || 'Failed to fetch friend requests',
          type: 'danger',
          backgroundColor: '#e53935',
          icon: 'danger',
        });
      }
    }
    fetchFriendRequests();
  }, [user, token]);

  // Accept friend request
  const handleAcceptRequest = async (notificationId: string) => {
    try {
      let t = token;
      if (!t) t = await AsyncStorage.getItem('token');
      console.log('Accepting friend request for notification:', notificationId);
      
      // Find the notification
      const notification = friendRequests.find(r => r._id === notificationId);
      if (!notification) {
        showMessage({
          message: 'Error',
          description: 'Friend request not found',
          type: 'danger',
          backgroundColor: '#e53935',
          icon: 'danger',
        });
        return;
      }
      
      // Get the sender's ID from the notification content
      const senderId = notification.fromUserId;
      if (!senderId) {
        showMessage({
          message: 'Error',
          description: 'Invalid friend request',
          type: 'danger',
          backgroundColor: '#e53935',
          icon: 'danger',
        });
        return;
      }
      
      const res = await fetch(`${getServerUrl()}/friends/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify({ 
          notificationId: notificationId,
          accept: true 
        }),
      });
      const data = await res.json();
      console.log('Friend request response:', data);
      if (res.ok) {
        setFriendRequests(reqs => reqs.filter(r => (r.fromUserId || r.user) !== senderId));
        let newFriend = null;
        const req = friendRequests.find(r => (r.fromUserId || r.user) === senderId);
        if (req) {
          newFriend = {
            _id: req.fromUserId || req.user,
            name: req.fromName || req.username || req.name || '',
            avatar: req.fromAvatar || req.avatar || null,
          };
        }
        if (!newFriend) {
          // إذا لم توجد البيانات، اجلبها من السيرفر
          try {
            const friendRes = await fetch(`${getServerUrl()}/users/${senderId}`, {
              headers: { 'Content-Type': 'application/json', ...(t ? { Authorization: `Bearer ${t}` } : {}) },
            });
            if (friendRes.ok) {
              const userData = await friendRes.json();
              newFriend = {
                _id: userData._id,
                name: userData.name || userData.username || userData.email || '',
                avatar: userData.avatar || null,
              };
            }
          } catch {}
        }
        if (newFriend) setFriends(prev => [...prev, {
          ...newFriend,
          isOnline: (newFriend as any).isOnline ?? false,
          lastSeen: (newFriend as any).lastSeen ?? null,
        }]);
        showMessage({
          message: 'Friend request accepted!',
          type: 'success',
          backgroundColor: '#25D366',
          icon: 'success',
        });
      } else {
        showMessage({
          message: data.message || 'Failed to accept request',
          type: 'danger',
          backgroundColor: '#e53935',
          icon: 'danger',
        });
      }
    } catch (e: any) {
      showMessage({
        message: e.message || 'Failed to accept request',
        type: 'danger',
        backgroundColor: '#e53935',
        icon: 'danger',
      });
    }
  };
  // Reject friend request
  const handleRejectRequest = async (fromUserId: string) => {
    try {
      let t = token;
      if (!t) t = await AsyncStorage.getItem('token');
      const res = await fetch(`${getServerUrl()}/friends/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify({ fromUserId, accept: false }),
      });
      const data = await res.json();
      if (res.ok) {
        setFriendRequests(reqs => reqs.filter(r => (r.fromUserId || r.user) !== fromUserId));
        showMessage({
          message: 'Friend request rejected',
          type: 'info',
          backgroundColor: '#888',
          icon: 'info',
        });
      } else {
        showMessage({
          message: data.message || 'Failed to reject request',
          type: 'danger',
          backgroundColor: '#e53935',
          icon: 'danger',
        });
      }
    } catch (e: any) {
      showMessage({
        message: e.message || 'Failed to reject request',
        type: 'danger',
        backgroundColor: '#e53935',
        icon: 'danger',
      });
    }
  };

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
      
      if (res.ok && data.users && data.users.length > 0) {
        // Exclude self and find the first matching user
        const found = data.users.find((u: any) => u.email === searchEmail && u._id !== user._id);
        if (found) {
          console.log('Found user with blocked status:', found.isBlocked);
          setSearchResult(found);
        } else {
          setSearchError(I18n.t('noFriends'));
        }
      } else {
        setSearchError(I18n.t('noFriends'));
      }
    } catch (e: any) {
      console.error('Search error:', e);
      setSearchError(I18n.t('errorOccurred', { error: e.message }));
      showMessage({
        message: 'Search Error',
        description: e.message || JSON.stringify(e),
        type: 'danger',
        backgroundColor: '#e53935',
        icon: 'danger',
      });
    }
    setSearchLoading(false);
  };

  const handleSendRequest = async () => {
    if (!searchResult) return;
    setActionLoading(true);
    try {
      const url = `${getServerUrl()}/friends/request`;
      const res = await fetch(url, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ toUserId: searchResult._id }),
      });
      const data = await res.json();
      if (res.ok) {
        showMessage({
          message: 'Friend Request',
          description: data.message || 'Friend request sent successfully!',
          type: 'success',
          backgroundColor: '#25D366',
          icon: 'success',
        });
      } else {
        let msg = data.message || 'Failed to send friend request';
        // تخصيص بعض الرسائل الشائعة
        if (msg.includes('yourself')) msg = 'You cannot send a friend request to yourself.';
        if (msg.includes('Already friends')) msg = 'You are already friends.';
        if (msg.includes('already sent')) msg = 'Friend request already sent.';
        if (msg.includes('blocked')) msg = 'Cannot send friend request to or from a blocked user.';
        showMessage({
          message: 'Friend Request',
          description: msg,
          type: 'danger',
          backgroundColor: '#e53935',
          icon: 'danger',
        });
      }
    } catch (e: any) {
      showMessage({
        message: 'Friend Request',
        description: e.message || 'Failed to send friend request',
        type: 'danger',
        backgroundColor: '#e53935',
        icon: 'danger',
      });
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
        showMessage({
          message: I18n.t('addFriend'),
          description: I18n.t('blocked'),
          type: 'success',
          backgroundColor: '#25D366',
          icon: 'success',
        });
      } else {
        showMessage({
          message: I18n.t('addFriend'),
          description: data.message || I18n.t('errorOccurred', { error: '' }),
          type: 'danger',
          backgroundColor: '#e53935',
          icon: 'danger',
        });
      }
    } catch (e: any) {
      showMessage({
        message: I18n.t('addFriend'),
        description: I18n.t('errorOccurred', { error: e.message }),
        type: 'danger',
        backgroundColor: '#e53935',
        icon: 'danger',
      });
    }
    setActionLoading(false);
  };

  const handleProfile = () => {
    // يمكنك هنا توجيه المستخدم لصفحة البروفايل
    showMessage({
      message: I18n.t('profile'),
      description: `${searchResult.username}\n${searchResult.email}`,
      type: 'info',
      backgroundColor: '#25D366',
      icon: 'info',
    });
  };

  useEffect(() => {
    async function fetchFriends() {
      if (!user || !user.id) {
        console.log('No user or user.id');
        return;
      }
      try {
        let t = token;
        if (!t) t = await AsyncStorage.getItem('token');
        console.log('Fetching friends for user:', user.id, 'with token:', t);
        const res = await fetch(`${getServerUrl()}/friends/list`, {
          headers: {
            'Content-Type': 'application/json',
            ...(t ? { Authorization: `Bearer ${t}` } : {}),
          },
        });
        const data = await res.json();
        console.log('Fetched friends response:', data);
        if (res.ok && data.friends) {
          setFriends(
            data.friends.map((friend: any) => ({
              ...friend,
              isOnline: friend.isOnline ?? false,
              lastSeen: friend.lastSeen ?? null,
            }))
          );
        } else {
          setFriends([]);
        }
      } catch (e: any) {
        console.log('Error fetching friends:', e);
        setFriends([]);
      }
    }
    fetchFriends();
  }, [user, token]);

  useEffect(() => {
    async function fetchBlocked() {
      if (!user || !user.id) return;
      try {
        let t = token;
        if (!t) t = await AsyncStorage.getItem('token');
        const res = await fetch(`${getServerUrl()}/friends/blocked`, {
          headers: {
            'Content-Type': 'application/json',
            ...(t ? { Authorization: `Bearer ${t}` } : {}),
          },
        });
        const data = await res.json();
        console.log('Blocked users response:', data);
        if (res.ok && data.blocked) {
          setBlockedUsers(data.blocked);
        } else {
          setBlockedUsers([]);
        }
      } catch {
        setBlockedUsers([]);
      }
    }
    fetchBlocked();
  }, [user, token]);

  const handleUnblock = async (userIdToUnblock: string) => {
    try {
      let t = token;
      if (!t) t = await AsyncStorage.getItem('token');
      const res = await fetch(`${getServerUrl()}/friends/unblock`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(t ? { Authorization: `Bearer ${t}` } : {}),
        },
        body: JSON.stringify({ userIdToUnblock }),
      });
      const data = await res.json();
      if (res.ok) {
        setBlockedUsers(prev => prev.filter(u => u._id !== userIdToUnblock));
        showMessage({
          message: 'Unblocked',
          description: 'User has been unblocked.',
          type: 'success',
          backgroundColor: '#25D366',
          icon: 'success',
        });
      } else {
        showMessage({
          message: 'Error',
          description: data.message || 'Failed to unblock user',
          type: 'danger',
          backgroundColor: '#e53935',
          icon: 'danger',
        });
      }
    } catch (e: any) {
      showMessage({
        message: 'Error',
        description: e.message || 'Failed to unblock user',
        type: 'danger',
        backgroundColor: '#e53935',
        icon: 'danger',
      });
    }
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

      {/* Tabs */}
      <View style={{ flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8, marginTop: 4 }}>
        <TouchableOpacity
          onPress={() => setActiveTab('friends')}
          style={{
            flex: 1,
            backgroundColor: activeTab === 'friends' ? '#25D366' : (darkMode ? '#23272f' : '#eee'),
            paddingVertical: 6,
            borderTopLeftRadius: 10,
            borderBottomLeftRadius: 10,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: activeTab === 'friends' ? '#25D366' : (darkMode ? '#333' : '#ddd'),
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="people" size={15} color={activeTab === 'friends' ? '#fff' : (darkMode ? '#bbb' : '#25D366')} style={{ marginRight: 5 }} />
          <Text style={{ color: activeTab === 'friends' ? '#fff' : (darkMode ? '#bbb' : '#222'), fontWeight: 'bold', fontSize: 13 }}>Friends</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('requests')}
          style={{
            flex: 1,
            backgroundColor: activeTab === 'requests' ? '#25D366' : (darkMode ? '#23272f' : '#eee'),
            paddingVertical: 6,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: activeTab === 'requests' ? '#25D366' : (darkMode ? '#333' : '#ddd'),
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="person-add" size={15} color={activeTab === 'requests' ? '#fff' : (darkMode ? '#bbb' : '#25D366')} style={{ marginRight: 5 }} />
          <Text style={{ color: activeTab === 'requests' ? '#fff' : (darkMode ? '#bbb' : '#222'), fontWeight: 'bold', fontSize: 13 }}>Requests</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => setActiveTab('blocked')}
          style={{
            flex: 1,
            backgroundColor: activeTab === 'blocked' ? '#25D366' : (darkMode ? '#23272f' : '#eee'),
            paddingVertical: 6,
            borderTopRightRadius: 10,
            borderBottomRightRadius: 10,
            alignItems: 'center',
            borderWidth: 1,
            borderColor: activeTab === 'blocked' ? '#25D366' : (darkMode ? '#333' : '#ddd'),
            flexDirection: 'row',
            justifyContent: 'center',
          }}
        >
          <Ionicons name="ban" size={15} color={activeTab === 'blocked' ? '#fff' : (darkMode ? '#bbb' : '#e53935')} style={{ marginRight: 5 }} />
          <Text style={{ color: activeTab === 'blocked' ? '#fff' : (darkMode ? '#bbb' : '#222'), fontWeight: 'bold', fontSize: 13 }}>Blocked</Text>
        </TouchableOpacity>
      </View>

      {/* Friend Requests Section */}
      {activeTab === 'friends' && (
        <ScrollView style={styles.content}>
          {friends.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 32 }}>
              <Ionicons name="people-circle" size={70} color="#25D366" style={{ marginBottom: 12, opacity: 0.7 }} />
              <Text style={{ fontSize: 18, color: darkMode ? '#bbb' : '#888', fontWeight: 'bold', marginBottom: 8 }}>
                {I18n.t('noFriends') || 'No friends yet'}
              </Text>
              <Text style={{ fontSize: 15, color: darkMode ? '#888' : '#aaa', marginBottom: 18 }}>
                {I18n.t('addYourFirstFriend') || 'Add your first friend and start chatting!'}
              </Text>
            </View>
          ) : (
            friends.map(friend => (
              <Pressable
                key={friend._id}
                android_ripple={{ color: '#25D36622' }}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: darkMode ? '#23272f' : '#1b1b1b',
                  borderRadius: 18,
                  padding: 14,
                  marginHorizontal: 20,
                  marginBottom: 14,
                  shadowColor: '#25D366',
                  shadowOpacity: 0.10,
                  shadowRadius: 10,
                  shadowOffset: { width: 0, height: 4 },
                  elevation: 5,
                  borderWidth: 1.2,
                  borderColor: darkMode ? '#222' : '#222',
                  minHeight: 70,
                }}
              >
                <View style={{ position: 'relative', marginRight: 16 }}>
                  {friend.avatar ? (
                    <Image
                      source={{ uri: friend.avatar }}
                      style={{
                        width: 54,
                        height: 54,
                        borderRadius: 27,
                        borderWidth: 2,
                        borderColor: '#25D366',
                        backgroundColor: '#eafaf1',
                        shadowColor: '#25D366',
                        shadowOpacity: 0.18,
                        shadowRadius: 6,
                      }}
                    />
                  ) : (
                    <Ionicons name="person-circle" size={54} color={'#bbb'} />
                  )}
                  {/* Online status dot */}
                  <View style={{
                    position: 'absolute',
                    bottom: 4,
                    right: 4,
                    width: 12,
                    height: 12,
                    borderRadius: 6,
                    backgroundColor: friend.isOnline ? '#25D366' : '#bbb',
                    borderWidth: 1.5,
                    borderColor: darkMode ? '#23272f' : '#1b1b1b',
                  }} />
                </View>
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <Text
                    style={{ fontWeight: 'bold', fontSize: 26, color: darkMode ? '#fff' : '#25D366', marginBottom: 4, letterSpacing: 0.2 }}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {friend.name}
                  </Text>
                  <Text style={{ fontSize: 15, color: '#bbb', marginBottom: 2 }} numberOfLines={1}>
                    {friend.username || ''}
                  </Text>
                  <Text style={{ fontSize: 13, color: friend.isOnline ? '#25D366' : '#888', fontWeight: 'bold', marginBottom: 6 }}>
                    {friend.isOnline ? 'Online' : formatLastSeen(friend.lastSeen)}
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 2, justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: darkMode ? '#23272f' : '#222',
                        borderRadius: 50,
                        padding: 6,
                        marginRight: 8,
                        shadowColor: '#25D366',
                        shadowOpacity: 0.08,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                      onPress={() => {
                        showMessage({
                          message: 'Profile',
                          description: `Username: ${friend.username || friend.name}\nEmail: ${friend.email || ''}`,
                          type: 'info',
                          backgroundColor: '#25D366',
                          icon: 'info',
                        });
                      }}
                    >
                      <Ionicons name="person" size={17} color={'#25D366'} />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#25D366',
                        borderRadius: 50,
                        padding: 6,
                        marginRight: 8,
                        shadowColor: '#25D366',
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                      onPress={() => {
                        showMessage({
                          message: 'Coming soon',
                          description: 'Chat with your friend will be available soon.',
                          type: 'info',
                          backgroundColor: '#25D366',
                          icon: 'info',
                        });
                      }}
                    >
                      <Ionicons name="chatbubble-ellipses" size={17} color="#fff" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#e53935',
                        borderRadius: 50,
                        padding: 6,
                      }}
                      onPress={() => {
                        console.log('Delete button pressed for friend:', friend);
                        setFriendToDelete(friend);
                        setShowDeleteModal(true);
                        console.log('Delete modal should now be visible');
                      }}
                    >
                      <Ionicons name="trash" size={17} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </Pressable>
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'requests' && (
        <ScrollView style={styles.content}>
          {friendRequests.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 32 }}>
              <Ionicons name="person-add" size={60} color="#25D366" style={{ marginBottom: 12, opacity: 0.7 }} />
              <Text style={{ fontSize: 18, color: darkMode ? '#bbb' : '#888', fontWeight: 'bold', marginBottom: 8 }}>
                No friend requests
              </Text>
            </View>
          ) : (
            friendRequests.map((req) => (
              <View
                key={req._id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: darkMode ? '#23272f' : '#fff',
                  borderRadius: 18,
                  padding: 14,
                  marginBottom: 14,
                  shadowColor: '#000',
                  shadowOpacity: 0.08,
                  shadowRadius: 8,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 4,
                  borderWidth: 1,
                  borderColor: darkMode ? '#333' : '#e0e0e0',
                }}
              >
                {req.fromAvatar ? (
                  <Image
                    source={{ uri: req.fromAvatar }}
                    style={{
                      width: 56,
                      height: 56,
                      borderRadius: 28,
                      marginRight: 16,
                      borderWidth: 2,
                      borderColor: '#25D366',
                      backgroundColor: '#eafaf1',
                    }}
                  />
                ) : (
                  <Ionicons name="person-circle" size={56} color="#25D366" style={{ marginRight: 16 }} />
                )}
                <View style={{ flex: 1, justifyContent: 'center' }}>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: 2 }}>
                    <Ionicons name="person" size={18} color={darkMode ? '#25D366' : '#25D366'} style={{ marginRight: 5 }} />
                    <Text
                      style={{
                        fontWeight: 'bold',
                        fontSize: 18,
                        color: darkMode ? '#25D366' : '#222',
                        letterSpacing: 0.2,
                      }}
                      numberOfLines={1}
                    >
                      {req.fromName}
                    </Text>
                  </View>
                  <Text
                    style={{
                      fontSize: 13,
                      color: darkMode ? '#bbb' : '#666',
                      marginBottom: 4,
                    }}
                    numberOfLines={2}
                  >
                    {req.content}
                  </Text>
                  <View style={{ flexDirection: 'row', marginTop: 6 }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#25D366',
                        borderRadius: 8,
                        paddingVertical: 7,
                        paddingHorizontal: 22,
                        marginRight: 10,
                        shadowColor: '#25D366',
                        shadowOpacity: 0.15,
                        shadowRadius: 4,
                        elevation: 2,
                      }}
                      onPress={() => {
                        console.log('Accept Friend Request for notification:', req._id, req);
                        handleAcceptRequest(req._id);
                      }}
                    >
                      <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15 }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{
                        backgroundColor: darkMode ? '#444' : '#fff',
                        borderWidth: 1.5,
                        borderColor: '#e53935',
                        borderRadius: 8,
                        paddingVertical: 7,
                        paddingHorizontal: 22,
                      }}
                      onPress={() => handleRejectRequest(req.fromUserId)}
                    >
                      <Text style={{ color: '#e53935', fontWeight: 'bold', fontSize: 15 }}>Reject</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

      {activeTab === 'blocked' && (
        <ScrollView style={styles.content}>
          {blockedUsers.length === 0 ? (
            <View style={{ alignItems: 'center', marginTop: 32 }}>
              <Ionicons name="ban" size={60} color="#e53935" style={{ marginBottom: 12, opacity: 0.7 }} />
              <Text style={{ fontSize: 18, color: darkMode ? '#bbb' : '#888', fontWeight: 'bold', marginBottom: 8 }}>
                No blocked users
              </Text>
            </View>
          ) : (
            blockedUsers.map((user) => (
              <View
                key={user._id}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  backgroundColor: darkMode ? '#23272f' : '#f3f3f3',
                  borderRadius: 10,
                  padding: 8,
                  marginBottom: 8,
                  marginHorizontal: 18,
                  shadowColor: '#25D366',
                  shadowOpacity: 0.07,
                  shadowRadius: 5,
                  shadowOffset: { width: 0, height: 2 },
                  elevation: 2,
                  borderWidth: 1,
                  borderColor: darkMode ? '#222' : '#e0e0e0',
                  minHeight: 60,
                }}
              >
                <View style={{ position: 'relative', marginRight: 10 }}>
                  {user.avatar ? (
                    <Image
                      source={{ uri: user.avatar }}
                      style={{
                        width: 48,
                        height: 48,
                        borderRadius: 24,
                        borderWidth: 1.2,
                        borderColor: '#e53935',
                        backgroundColor: '#fdeaea',
                      }}
                    />
                  ) : (
                    <Ionicons name="person-circle" size={48} color={'#bbb'} />
                  )}
                </View>
                <View style={{ flex: 1, minWidth: 0, justifyContent: 'center' }}>
                  <Text
                    style={{ fontWeight: '900', fontSize: 30, color: darkMode ? '#fff' : '#e53935', marginBottom: 2, letterSpacing: 0.1, width: '100%' }}
                    numberOfLines={2}
                    ellipsizeMode="tail"
                  >
                    {user.name}
                  </Text>
                  <Text style={{ fontSize: 12, color: '#bbb', marginBottom: 1 }} numberOfLines={1}>
                    {user.username || ''}
                  </Text>
                  <Text style={{ fontSize: 14, color: '#e53935', fontWeight: 'bold', marginBottom: 2 }}>
                    Blocked
                  </Text>
                  <View style={{ flexDirection: 'row', alignItems: 'center', marginTop: 1, justifyContent: 'flex-end' }}>
                    <TouchableOpacity
                      style={{
                        backgroundColor: '#25D366',
                        borderRadius: 50,
                        padding: 5,
                        shadowColor: '#25D366',
                        shadowOpacity: 0.10,
                        shadowRadius: 2,
                        elevation: 1,
                      }}
                      onPress={() => {
                        setUserToUnblock(user);
                        setShowUnblockModal(true);
                      }}
                    >
                      <Ionicons name="checkmark-circle" size={15} color="#fff" />
                    </TouchableOpacity>
                  </View>
                </View>
              </View>
            ))
          )}
        </ScrollView>
      )}

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
    {!searchResult.isBlocked && !searchResult.hasBlockedMe && (
      <TouchableOpacity style={{ backgroundColor: '#25D366', borderRadius: 14, paddingVertical: 13, marginBottom: 12, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 2 }} onPress={handleSendRequest} disabled={actionLoading}>
        <Ionicons name="person-add" size={20} color="#fff" style={{ marginRight: 8 }} />
        <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 17 }}>{I18n.t('addFriend')}</Text>
      </TouchableOpacity>
    )}
    {searchResult.isBlocked && (
      <View style={{ backgroundColor: darkMode ? '#333' : '#f5f5f5', borderRadius: 14, paddingVertical: 13, marginBottom: 12, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 2 }}>
        <Ionicons name="ban" size={20} color={darkMode ? '#999' : '#666'} style={{ marginRight: 8 }} />
        <Text style={{ color: darkMode ? '#999' : '#666', fontWeight: 'bold', fontSize: 17 }}>{I18n.t('userBlocked')}</Text>
      </View>
    )}
    {searchResult.hasBlockedMe && (
      <View style={{ backgroundColor: darkMode ? '#333' : '#f5f5f5', borderRadius: 14, paddingVertical: 13, marginBottom: 12, width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'center', elevation: 2 }}>
        <Ionicons name="ban" size={20} color={darkMode ? '#e53935' : '#e53935'} style={{ marginRight: 8 }} />
        <Text style={{ color: darkMode ? '#e53935' : '#e53935', fontWeight: 'bold', fontSize: 17 }}>{I18n.t('blockedYou') || 'This user has blocked you'}</Text>
      </View>
    )}
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

      {/* Modal لعرض الاسم الكامل */}
      <Modal
        visible={showNameModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowNameModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.5)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: darkMode ? '#23272f' : '#fff', borderRadius: 18, padding: 30, minWidth: 250, alignItems: 'center' }}>
            <Text style={{ fontWeight: 'bold', fontSize: 26, color: darkMode ? '#25D366' : '#222', marginBottom: 18, textAlign: 'center' }}>{modalName}</Text>
            <TouchableOpacity onPress={() => setShowNameModal(false)} style={{ marginTop: 10, backgroundColor: '#25D366', borderRadius: 10, paddingHorizontal: 24, paddingVertical: 10 }}>
              <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 16 }}>Close</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>

      {/* Modal تأكيد حذف الصديق */}
      <Modal
        visible={showDeleteModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowDeleteModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: darkMode ? 'rgba(35,39,47,0.98)' : 'rgba(255,255,255,0.98)', borderRadius: 32, width: 210, height: 210, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, elevation: 12 }}>
            <View style={{ backgroundColor: '#fdeaea', borderRadius: 30, padding: 10, marginBottom: 6 }}>
              <Ionicons name="trash" size={28} color="#e53935" />
            </View>
            <Text style={{ fontWeight: 'bold', fontSize: 16, color: darkMode ? '#fff' : '#222', marginBottom: 8, textAlign: 'center', letterSpacing: 0.2 }}>
              Are you sure you want to delete this friend?
            </Text>
            <Text style={{ fontSize: 13, color: '#888', marginBottom: 10, textAlign: 'center' }}>
              {friendToDelete?.name}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%' }}>
              <TouchableOpacity
                style={{ backgroundColor: '#e53935', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7, marginRight: 8, shadowColor: '#e53935', shadowOpacity: 0.13, shadowRadius: 6, elevation: 2 }}
                onPress={async () => {
                  if (!friendToDelete) {
                    console.log('No friendToDelete set!');
                    return;
                  }
                  console.log('Deleting friend:', friendToDelete);
                  try {
                    let t = token;
                    if (!t) t = await AsyncStorage.getItem('token');
                    const res = await fetch(`${getServerUrl()}/friends/remove`, {
                      method: 'POST',
                      headers: {
                        'Content-Type': 'application/json',
                        ...(t ? { Authorization: `Bearer ${t}` } : {}),
                      },
                      body: JSON.stringify({ friendId: friendToDelete._id }),
                    });
                    const data = await res.json();
                    console.log('Delete friend response:', data);
                    if (res.ok) {
                      setFriends(prev => prev.filter(f => f._id !== friendToDelete._id));
                      showMessage({
                        message: 'Deleted',
                        description: 'Friend removed successfully',
                        type: 'success',
                        backgroundColor: '#25D366',
                        icon: 'success',
                      });
                    } else {
                      showMessage({
                        message: 'Error',
                        description: data.message || 'An error occurred while removing the friend',
                        type: 'danger',
                        backgroundColor: '#e53935',
                        icon: 'danger',
                      });
                      console.log('Delete friend failed:', data);
                    }
                  } catch (err) {
                    showMessage({
                      message: 'Error',
                      description: 'An error occurred while removing the friend',
                      type: 'danger',
                      backgroundColor: '#e53935',
                      icon: 'danger',
                    });
                    console.log('Delete friend exception:', err);
                  }
                  setShowDeleteModal(false);
                  setFriendToDelete(null);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.2 }}>Delete</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#bbb', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 7 }}
                onPress={() => {
                  setShowDeleteModal(false);
                  setFriendToDelete(null);
                  console.log('Delete cancelled');
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 14, letterSpacing: 0.2 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* Modal تأكيد إلغاء الحظر */}
      <Modal
        visible={showUnblockModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowUnblockModal(false)}
      >
        <View style={{ flex: 1, backgroundColor: 'rgba(0,0,0,0.35)', justifyContent: 'center', alignItems: 'center' }}>
          <View style={{ backgroundColor: darkMode ? 'rgba(35,39,47,0.98)' : 'rgba(255,255,255,0.98)', borderRadius: 22, width: 270, height: 210, alignItems: 'center', justifyContent: 'center', shadowColor: '#000', shadowOpacity: 0.18, shadowRadius: 18, elevation: 12 }}>
            <View style={{ backgroundColor: '#eafaf1', borderRadius: 30, padding: 14, marginBottom: 10 }}>
              <Ionicons name="checkmark-circle" size={36} color="#25D366" />
            </View>
            <Text style={{ fontWeight: 'bold', fontSize: 15, color: darkMode ? '#fff' : '#222', marginBottom: 10, textAlign: 'center', letterSpacing: 0.2 }}>
              Are you sure you want to unblock this user?
            </Text>
            <Text style={{ fontSize: 13, color: '#888', marginBottom: 18, textAlign: 'center' }}>
              {userToUnblock?.name}
            </Text>
            <View style={{ flexDirection: 'row', justifyContent: 'center', width: '100%' }}>
              <TouchableOpacity
                style={{ backgroundColor: '#25D366', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 8, marginRight: 8, shadowColor: '#25D366', shadowOpacity: 0.13, shadowRadius: 6, elevation: 2 }}
                onPress={async () => {
                  if (!userToUnblock) return;
                  await handleUnblock(userToUnblock._id);
                  setShowUnblockModal(false);
                  setUserToUnblock(null);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.2 }}>Unblock</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={{ backgroundColor: '#bbb', borderRadius: 18, paddingHorizontal: 18, paddingVertical: 8 }}
                onPress={() => {
                  setShowUnblockModal(false);
                  setUserToUnblock(null);
                }}
              >
                <Text style={{ color: '#fff', fontWeight: 'bold', fontSize: 15, letterSpacing: 0.2 }}>Cancel</Text>
              </TouchableOpacity>
            </View>
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