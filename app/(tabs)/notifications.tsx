import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native';
import I18n from '../constants/i18n';
import { useTheme } from '../context/ThemeContext';

type Notification = {
  id: number;
  type: 'message' | 'friend' | 'system';
  title: string;
  message: string;
  time: string;
  read: boolean;
};

export default function NotificationsScreen() {
  const { darkMode } = useTheme();
  const [notifications, setNotifications] = useState<Notification[]>([
    {
      id: 1,
      type: 'message',
      title: I18n.t('newMessage'),
      message: I18n.t('messageFrom', { name: 'John' }),
      time: I18n.t('timeAgo', { time: '2m' }),
      read: false,
    },
    {
      id: 2,
      type: 'friend',
      title: I18n.t('friendRequest'),
      message: I18n.t('friendRequestFrom', { name: 'Jane' }),
      time: I18n.t('timeAgo', { time: '5m' }),
      read: false,
    },
    {
      id: 3,
      type: 'system',
      title: I18n.t('systemUpdate'),
      message: I18n.t('newFeaturesAvailable'),
      time: I18n.t('timeAgo', { time: '1h' }),
      read: true,
    },
  ]);

  const [showUnreadOnly, setShowUnreadOnly] = useState(false);

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
                <Text style={[styles.notificationTime, darkMode && { color: '#888' }]}>{notification.time}</Text>
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