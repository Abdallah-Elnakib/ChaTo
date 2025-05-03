import React, { useEffect, useRef, useState } from 'react';
import { FlatList, Image, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const DUMMY_AVATAR = 'https://ui-avatars.com/api/?name=User&background=007AFF&color=fff';

const ChatScreen = ({ route }) => {
  const { chatId } = route.params;
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState('');
  const flatListRef = useRef();

  // TODO: Replace with real token management
  const token = '';

  useEffect(() => {
    const fetchMessages = async () => {
      try {
        const response = await fetch(`http://localhost:5000/api/chats/${chatId}/messages`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        const data = await response.json();
        if (response.ok) setMessages(data.messages || []);
      } catch (err) {
        console.log(err);
      }
    };
    fetchMessages();
  }, [chatId]);

  const handleSend = async () => {
    if (!input.trim()) return;
    try {
      const response = await fetch('http://localhost:5000/api/chats/message', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ chatId, content: input })
      });
      const data = await response.json();
      if (response.ok) {
        setMessages(prev => [...prev, data.message]);
        setInput('');
        setTimeout(() => flatListRef.current?.scrollToEnd({ animated: true }), 100);
      }
    } catch (err) {
      console.log(err);
    }
  };

  const renderItem = ({ item }) => (
    <View style={[styles.messageContainer, item.sender?._id === 'me' ? styles.myMessage : styles.otherMessage]}>
      <Image source={{ uri: item.sender?.avatar || DUMMY_AVATAR }} style={styles.avatar} />
      <View style={styles.bubble}>
        <Text style={styles.sender}>{item.sender?.username || 'User'}</Text>
        <Text style={styles.content}>{item.content}</Text>
      </View>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <FlatList
        ref={flatListRef}
        data={messages}
        keyExtractor={item => item._id}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
        onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Type a message..."
          value={input}
          onChangeText={setInput}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend}>
          <Text style={styles.sendButtonText}>Send</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7'
  },
  messageContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 12
  },
  myMessage: {
    alignSelf: 'flex-end'
  },
  otherMessage: {
    alignSelf: 'flex-start'
  },
  avatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
    marginRight: 8
  },
  bubble: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 10,
    maxWidth: '80%',
    shadowColor: '#000',
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1
  },
  sender: {
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2
  },
  content: {
    fontSize: 16,
    color: '#222'
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee'
  },
  input: {
    flex: 1,
    height: 44,
    borderColor: '#ccc',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    backgroundColor: '#f7f7f7',
    fontSize: 16
  },
  sendButton: {
    backgroundColor: '#007AFF',
    marginLeft: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  }
});

export default ChatScreen; 