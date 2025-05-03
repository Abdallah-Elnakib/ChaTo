import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import React, { useEffect, useState } from 'react';
import { Alert, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import I18n from '../constants/i18n';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import getServerUrl from '../utils/server';
import { fromNow } from '../utils/time';

type Notification = {
  id: number;
  type: 'message' | 'friend' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
  fromId?: string;
  fromName?: string; // Added for sender's name
};

export default function NotificationsScreen() {
  const { darkMode } = useTheme();
  const { user } = useAuth();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

  // Fetch notifications from backend (simulate with mock data for now)
  useEffect(() => {
    async function fetchNotifications() {
      if (!user) return;
      try {
        let token = null;
        try {
          token = await AsyncStorage.getItem('token');
        } catch {}
        // استبدل الرابط التالي بمسار جلب الإشعارات من السيرفر الخاص بك
        const res = await fetch(`${getServerUrl()}/notifications?userId=${user._id}`, {
          headers: {
            'Content-Type': 'application/json',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        const data = await res.json();
        if (!res.ok) {
          Alert.alert('Error', data.message || 'Failed to fetch notifications');
          return;
        }
        setNotifications(data.notifications || []);
      } catch (e: any) {
        Alert.alert('Error', e.message || 'Failed to fetch notifications');
      }
    }
    fetchNotifications();
  }, [user]);


  const getNotificationIcon = (type: string) => {
    switch (type) {
      case 'message':
        return 'chatbubbles';
      case 'friend':
        return 'person-add';
      case 'system':
        return 'notifications';
      default:
        return 'notifications';
    }
  };

  const markAsRead = (id: number) => {
    setNotifications(notifications.map(notification => 
      notification.id === id ? { ...notification, read: true } : notification
    ));
  };

  // Handle accepting a friend request
  const handleAccept = async (fromId: string) => {
    try {
      // Get token (if you store it in AsyncStorage or context)
      let token = null;
      try {
        token = await AsyncStorage.getItem('token');
      } catch {}
      // Call backend API to accept the friend request (المسار الصحيح)
      const res = await fetch(`${getServerUrl()}/friends/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fromUserId: fromId, accept: true }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.message || 'Failed to accept friend request');
        return;
      }
      // Optionally, update friends list here (emit event or refresh)
      // Mark notification as read and update time to real time
      setNotifications(notifications => notifications.map(n =>
        (n.type === 'friend' && (n.fromId === fromId || n.id.toString() === fromId))
          ? { ...n, read: true, time: (data.acceptedAt || new Date().toISOString()) }
          : n
      ));
      Alert.alert('Success', 'Friend request accepted!');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to accept friend request');
    }
  };

  // Handle rejecting a friend request
  const handleReject = async (fromId: string) => {
    try {
      let token = null;
      try {
        token = await AsyncStorage.getItem('token');
      } catch {}
      const res = await fetch(`${getServerUrl()}/friends/respond`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify({ fromUserId: fromId, accept: false }),
      });
      const data = await res.json();
      if (!res.ok) {
        Alert.alert('Error', data.message || 'Failed to reject friend request');
        return;
      }
      setNotifications(notifications => notifications.map(n =>
        (n.type === 'friend' && (n.fromId === fromId || n.id.toString() === fromId)) ? { ...n, read: true } : n
      ));
      Alert.alert('Rejected', `Friend request from user ${fromId} has been rejected`);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to reject friend request');
    }
  };

  // Helper to get the user id for friend notifications 
  const getFromId = (notification: Notification) => {
    // If fromId exists, use it, otherwise fallback to id
    // @ts-ignore
    return notification.fromId ?? notification.id;
  };

  const filteredNotifications = showUnreadOnly
    ? notifications.filter(n => !n.read)
    : notifications;

  return (
    <View style={[styles.container, darkMode && { backgroundColor: '#181818' }] }>
      {/* Header with logo and app name */}
      <View style={styles.header}>
        <Ionicons name="notifications" size={32} color="#25D366" style={styles.logo} />
        <Text style={[styles.appName, darkMode && { color: '#25D366' }]}>ChaTo</Text>
      </View>

      {/* Notification Settings */}
      <View style={[styles.settingsContainer, darkMode && { backgroundColor: '#222', borderColor: '#333' }] }>
        <View style={styles.settingItem}>
          <Text style={[styles.settingText, darkMode && { color: '#fff' }]}>{I18n.t('showUnreadOnly')}</Text>
          <Switch
            value={showUnreadOnly}
            onValueChange={setShowUnreadOnly}
            trackColor={{ false: '#767577', true: '#81b0ff' }}
            thumbColor={showUnreadOnly ? '#25D366' : '#f4f3f4'}
          />
        </View>
      </View>

      {/* Notifications List */}
      <ScrollView style={styles.notificationsList}>
        {filteredNotifications.length === 0 ? (
          <View style={styles.emptyState}>
            <Ionicons name="notifications-off" size={80} color="#25D366" style={styles.emptyIcon} />
            <Text style={[styles.emptyText, darkMode && { color: '#aaa' }]}>{I18n.t('notificationsEmpty')}</Text>
            <Text style={[styles.emptySubText, darkMode && { color: '#888' }]}>{I18n.t('allCaughtUp')}</Text>
          </View>
        ) : (
          filteredNotifications.map((notification) => (
            <TouchableOpacity
              key={notification.id}
              style={[
                styles.notificationItem,
                !notification.read && styles.unreadNotification,
                darkMode && (notification.read ? styles.notificationItemDark : styles.unreadNotificationDark)
              ]}
              onPress={() => markAsRead(notification.id)}
            >
              <View style={[styles.notificationIcon, darkMode && { backgroundColor: '#263238' }] }>
                <Ionicons 
                  name={getNotificationIcon(notification.type)} 
                  size={24} 
                  color="#25D366" 
                />
              </View>
              <View style={styles.notificationContent}>
                <Text style={[styles.notificationTitle, darkMode && { color: '#fff' }]}>{notification.title}</Text>
                <Text style={[styles.notificationMessage, darkMode && { color: '#bbb' }]}>{notification.message}</Text>
                <Text style={[styles.notificationTime, darkMode && { color: '#888' }]}>{fromNow(notification.time)}</Text>
                {notification.type === 'friend' && (
                  <View style={{ flexDirection: 'row', marginTop: 8 }}>
                    <TouchableOpacity
                      style={{ backgroundColor: '#25D366', padding: 8, borderRadius: 8, marginRight: 8 }}
                      onPress={() => handleAccept(String(getFromId(notification)))}
                    >
                      <Text style={{ color: '#fff' }}>Accept</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={{ backgroundColor: '#ff4444', padding: 8, borderRadius: 8 }}
                      onPress={() => handleReject(String(getFromId(notification)))}
                    >
                      <Text style={{ color: '#fff' }}>Delete</Text>
                    </TouchableOpacity>
                  </View>
                )}
              </View>
              {!notification.read && (
                <View style={styles.unreadDot} />
              )}
            </TouchableOpacity>
          ))
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
  settingsContainer: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    borderRadius: 10,
    marginBottom: 20,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  settingItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  settingText: {
    fontSize: 16,
    color: '#333',
  },
  notificationsList: {
    flex: 1,
  },
  notificationItem: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 20,
    marginBottom: 10,
    borderRadius: 10,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 3,
    elevation: 2,
  },
  unreadNotification: {
    backgroundColor: '#f0fff0',
  },
  notificationIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#e8f5e9',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15,
  },
  notificationContent: {
    flex: 1,
  },
  notificationTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  notificationMessage: {
    fontSize: 14,
    color: '#666',
    marginBottom: 4,
  },
  notificationTime: {
    fontSize: 12,
    color: '#888',
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: '#25D366',
    alignSelf: 'center',
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
  notificationItemDark: {
    backgroundColor: '#222',
  },
  unreadNotificationDark: {
    backgroundColor: '#263238',
  },
}); 