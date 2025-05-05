import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TouchableOpacity, View } from 'react-native';

const DUMMY_AVATAR = 'https://ui-avatars.com/api/?name=User&background=007AFF&color=fff';

const NewChatScreen = ({ navigation }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);

  // TODO: Replace with real token management
  const token = '';

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5000/api/friends/list', {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setFriends(data.friends || []);
      } catch (err) {}
      setLoading(false);
    };
    fetchFriends();
  }, []);

  const handleStartChat = async (friendId) => {
    try {
      const response = await fetch('http://localhost:5000/api/chats/private', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ otherUserId: friendId })
      });
      const data = await response.json();
      if (response.ok && data.chat) {
        navigation.replace('Chat', { chatId: data.chat._id });
      } else {
        Alert.alert('Error', data.message || 'Failed to start chat.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to start chat.');
    }
  };

  const renderFriend = ({ item }) => (
    <TouchableOpacity style={styles.friendItem} onPress={() => handleStartChat(item._id)}>
      <Image source={{ uri: item.avatar || DUMMY_AVATAR }} style={styles.avatar} />
      <Text style={styles.friendName}>{item.username}</Text>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Start New Chat</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={item => item._id}
          renderItem={renderFriend}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>No friends to chat with.</Text>}
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
  friendItem: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    marginBottom: 10,
    borderRadius: 10,
    padding: 12,
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 4,
    elevation: 2
  },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    marginRight: 12
  },
  friendName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#222',
    flex: 1
  }
});

export default NewChatScreen; 