import React, { useEffect, useState } from 'react';
import { ActivityIndicator, Alert, FlatList, Image, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const DUMMY_AVATAR = 'https://ui-avatars.com/api/?name=User&background=007AFF&color=fff';
import getServerUrl from '../utils/getServerUrl';

const FriendsScreen = ({ navigation }) => {
  const [friends, setFriends] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const [pendingRequests, setPendingRequests] = useState([]);

  // TODO: Replace with real token management
  const token = '';

  useEffect(() => {
    const fetchFriends = async () => {
      setLoading(true);
      try {
        const response = await fetch(`${getServerUrl()}/api/friends/list`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setFriends(data.friends || []);
      } catch (err) {}
      setLoading(false);
    };
    fetchFriends();
  }, []);

  const handleSearch = async () => {
    if (!search) return;
    setSearching(true);
    try {
      const response = await fetch(`${getServerUrl()}/api/friends/search?query=${encodeURIComponent(search)}`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await response.json();
      if (response.ok) setSearchResults(data.users || []);
    } catch (err) {}
    setSearching(false);
  };

  const handleAddFriend = async (userId) => {
    try {
      const response = await fetch(`${getServerUrl()}/api/friends/request`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ toUserId: userId })
      });
      const data = await response.json();
      if (response.ok) {
        Alert.alert('Success', 'Friend request sent!');
      } else {
        Alert.alert('Error', data.message || 'Failed to send request.');
      }
    } catch (err) {
      Alert.alert('Error', 'Failed to send request.');
    }
  };

  // TODO: Fetch and handle pending friend requests

  const renderFriend = ({ item }) => (
    <View style={styles.friendItem}>
      <Image source={{ uri: item.avatar || DUMMY_AVATAR }} style={styles.avatar} />
      <Text style={styles.friendName}>{item.username}</Text>
    </View>
  );

  const renderSearchResult = ({ item }) => (
    <View style={styles.friendItem}>
      <Image source={{ uri: item.avatar || DUMMY_AVATAR }} style={styles.avatar} />
      <Text style={styles.friendName}>{item.username}</Text>
      <TouchableOpacity style={styles.addButton} onPress={() => handleAddFriend(item._id)}>
        <Text style={styles.addButtonText}>Add</Text>
      </TouchableOpacity>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Friends</Text>
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search by username or email"
          value={search}
          onChangeText={setSearch}
          onSubmitEditing={handleSearch}
        />
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch} disabled={searching}>
          <Text style={styles.searchButtonText}>{searching ? '...' : 'Search'}</Text>
        </TouchableOpacity>
      </View>
      {searchResults.length > 0 && (
        <FlatList
          data={searchResults}
          keyExtractor={item => item._id}
          renderItem={renderSearchResult}
          contentContainerStyle={{ paddingBottom: 16 }}
          ListHeaderComponent={<Text style={styles.sectionTitle}>Search Results</Text>}
        />
      )}
      <Text style={styles.sectionTitle}>Your Friends</Text>
      {loading ? (
        <ActivityIndicator size="large" color="#007AFF" style={{ marginTop: 32 }} />
      ) : (
        <FlatList
          data={friends}
          keyExtractor={item => item._id}
          renderItem={renderFriend}
          contentContainerStyle={{ paddingBottom: 32 }}
          ListEmptyComponent={<Text style={{ textAlign: 'center', marginTop: 32, color: '#888' }}>No friends yet.</Text>}
        />
      )}
      {/* TODO: Show pending friend requests */}
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
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16
  },
  searchInput: {
    flex: 1,
    height: 44,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#fff',
    fontSize: 16
  },
  searchButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 8
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#007AFF',
    marginTop: 24,
    marginBottom: 8
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
  },
  addButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8
  },
  addButtonText: {
    color: '#fff',
    fontSize: 16
  }
});

export default FriendsScreen; 