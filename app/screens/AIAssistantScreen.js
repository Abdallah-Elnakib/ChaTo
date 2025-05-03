import React, { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';

const AIAssistantScreen = () => {
  const [messages, setMessages] = useState([]); // {role: 'user'|'ai', text: string}
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  // TODO: Replace with real token management
  const token = '';

  const handleSend = async () => {
    if (!input.trim()) return;
    const userMsg = { role: 'user', text: input };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('http://localhost:5000/api/ai/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({ prompt: input })
      });
      const data = await response.json();
      if (response.ok && data.result) {
        setMessages(prev => [...prev, { role: 'ai', text: data.result }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', text: data.message || 'AI did not respond.' }]);
      }
    } catch (_) {
      setMessages(prev => [...prev, { role: 'ai', text: 'Error contacting AI.' }]);
    }
    setLoading(false);
  };

  const renderItem = ({ item }) => (
    <View style={[styles.message, item.role === 'user' ? styles.userMsg : styles.aiMsg]}>
      <Text style={styles.msgRole}>{item.role === 'user' ? 'You' : 'AI'}</Text>
      <Text style={styles.msgText}>{item.text}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.container} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
      <Text style={styles.title}>AI Assistant</Text>
      <FlatList
        data={messages}
        keyExtractor={(_, idx) => idx.toString()}
        renderItem={renderItem}
        contentContainerStyle={{ padding: 16 }}
      />
      <View style={styles.inputContainer}>
        <TextInput
          style={styles.input}
          placeholder="Ask the AI anything..."
          value={input}
          onChangeText={setInput}
          editable={!loading}
        />
        <TouchableOpacity style={styles.sendButton} onPress={handleSend} disabled={loading}>
          {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>Send</Text>}
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
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#222',
    marginTop: 40,
    marginBottom: 8,
    alignSelf: 'center'
  },
  message: {
    marginBottom: 12,
    padding: 12,
    borderRadius: 10,
    maxWidth: '85%'
  },
  userMsg: {
    backgroundColor: '#007AFF22',
    alignSelf: 'flex-end'
  },
  aiMsg: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start'
  },
  msgRole: {
    fontWeight: 'bold',
    color: '#007AFF',
    marginBottom: 2
  },
  msgText: {
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

export default AIAssistantScreen; 