import React, { useEffect, useState } from 'react';
import { ActivityIndicator, FlatList, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const NotificationsScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [marking, setMarking] = useState(false);

  // TODO: Replace with real token management
  const token = '';

  useEffect(() => {
    const fetchNotifications = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/notifications', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setNotifications(data.notifications || []);
      } catch (err) {}
      setLoading(false);
    };
    fetchNotifications();
  }, []);

  const handleMarkAsRead = async (notificationId) => {
    setMarking(true);
    try {
      const response = await fetch('http://localhost:5000/api/notifications/read', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ notificationId })
      });
      if (response.ok) {
        setNotifications(prev => prev.map(n => n._id === notificationId ? { ...n, isRead: true } : n));
      }
    } catch (err) {}
    setMarking(false);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.notificationItem, item.isRead && styles.readNotification]}>
      <Text style={styles.notificationText}>{item.content}</Text>
      {!item.isRead && (
        <TouchableOpacity style={styles.markButton} onPress={() => handleMarkAsRead(item._id)} disabled={marking}>
          <Text style={styles.markButtonText}>Mark as read</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Notifications</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={notifications}
          keyExtractor={item => item._id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>No notifications yet.</Text>}
        />
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
    paddingTop: 40,
    paddingHorizontal: 16
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginBottom: 16
  },
  notificationItem: {
    backgroundColor: '#fff',
    borderRadius: 10,
    padding: 16,
    marginBottom: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between'
  },
  readNotification: {
    opacity: 0.5
  },
  notificationText: {
    fontSize: 16,
    color: '#222',
    flex: 1
  },
  markButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 8,
    marginLeft: 12
  },
  markButtonText: {
    color: '#fff',
    fontSize: 14
  }
});

export default NotificationsScreen; 