import { ThemedView } from '@/components/ThemedView';
import { Ionicons } from '@expo/vector-icons';
import React, { useState } from 'react';
import { ActivityIndicator, FlatList, KeyboardAvoidingView, Platform, StyleSheet, Text, TextInput, TouchableOpacity, View } from 'react-native';
import I18n from '../constants/i18n';
import { useTheme } from '../context/ThemeContext';

interface Message {
  role: 'user' | 'ai';
  text: string;
  time: string;
}

export default function AIScreen() {
  const { darkMode } = useTheme();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    const now = new Date();
    const time = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = { role: 'user', text: input, time };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);
    try {
      const response = await fetch('https://api.cohere.ai/v1/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer mLhgffkNnjlgq9JsiPuI75oPhinUzjJM2LM2FRs6',
          'Cohere-Version': '2022-12-06'
        },
        body: JSON.stringify({
          message: userMsg.text,
          model: 'command',
          temperature: 0.7,
          max_tokens: 200,
          stream: false
        })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        console.error('API Error:', errorData);
        throw new Error(`API Error: ${response.status} - ${JSON.stringify(errorData)}`);
      }

      const data = await response.json();
      
      if (data.text) {
        const aiTime = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        setMessages(prev => [...prev, { role: 'ai', text: data.text.trim(), time: aiTime }]);
      } else {
        console.error('Unexpected response format:', data);
        setMessages(prev => [...prev, { role: 'ai', text: I18n.t('aiError'), time }]);
      }
    } catch (error: any) {
      console.error('Error details:', error);
      setMessages(prev => [...prev, { role: 'ai', text: I18n.t('errorOccurred', { error: error.message || I18n.t('unknownError') }), time }]);
    }
    setLoading(false);
  };

  const renderItem = ({ item }: { item: Message }) => (
    <View style={[
      styles.message,
      item.role === 'user' ? styles.userMsg : styles.aiMsg,
      darkMode && (item.role === 'user' ? styles.userMsgDark : styles.aiMsgDark)
    ]}>
      <Text style={[styles.msgRole, item.role === 'user' && styles.userRole, darkMode && styles.msgRoleDark]}>
        {item.role === 'user' ? I18n.t('you') : I18n.t('ai')}
      </Text>
      <Text style={[styles.msgText, item.role === 'user' && styles.userMsgText, darkMode && styles.msgTextDark]}>{item.text}</Text>
      <Text style={styles.msgTime}>{item.time}</Text>
    </View>
  );

  return (
    <KeyboardAvoidingView
      style={{ flex: 1 }}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
    >
      <ThemedView style={[styles.container, darkMode && { backgroundColor: '#181818' }] }>
        <View style={styles.header}>
          <View style={styles.headerLeft}>
            <Ionicons name="chatbubbles" size={32} color="#25D366" style={styles.logo} />
            <Text style={styles.appName}>ChaTo</Text>
          </View>
          <Text style={styles.title}>{I18n.t('ai')}</Text>
        </View>
        <FlatList
          data={messages}
          keyExtractor={(_, idx) => idx.toString()}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16 }}
          showsVerticalScrollIndicator={false}
        />
        <View style={[styles.inputContainer, darkMode && { backgroundColor: '#222', borderColor: '#333' }] }>
          <TextInput
            style={[styles.input, darkMode && { color: '#fff', backgroundColor: '#181818', borderColor: '#333' }]}
            placeholder={I18n.t('typeQuestion')}
            value={input}
            onChangeText={setInput}
            editable={!loading}
            multiline
            maxLength={500}
            placeholderTextColor={darkMode ? '#aaa' : '#888'}
          />
          <TouchableOpacity
            style={[styles.sendButton, (!input.trim() || loading) && styles.sendButtonDisabled]}
            onPress={handleSend}
            disabled={loading || !input.trim()}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={styles.sendButtonText}>{I18n.t('send')}</Text>}
          </TouchableOpacity>
        </View>
      </ThemedView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    marginBottom: 20,
    marginTop: 70,
  },
  headerLeft: {
    flexDirection: 'row',
    alignItems: 'center',
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
  title: {
    fontSize: 20,
    fontWeight: '600',
    color: '#25D366',
    backgroundColor: '#25D36622',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
  },
  messagesContainer: {
    padding: 16,
    paddingBottom: 24,
  },
  message: {
    marginBottom: 16,
    padding: 16,
    borderRadius: 16,
    maxWidth: '85%',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  userMsg: {
    backgroundColor: '#e0ffe5',
    alignSelf: 'flex-end',
  },
  aiMsg: {
    backgroundColor: '#fff',
    alignSelf: 'flex-start',
  },
  userMsgBubble: {
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    borderBottomLeftRadius: 16,
    borderBottomRightRadius: 4,
    marginLeft: 40,
    marginRight: 0,
  },
  aiMsgBubble: {
    borderTopRightRadius: 16,
    borderTopLeftRadius: 16,
    borderBottomRightRadius: 16,
    borderBottomLeftRadius: 4,
    marginRight: 40,
    marginLeft: 0,
  },
  userRole: {
    color: '#25D366',
    textAlign: 'right',
  },
  userMsgText: {
    textAlign: 'right',
  },
  msgRole: {
    fontWeight: 'bold',
    color: '#25D366',
    marginBottom: 4,
  },
  msgText: {
    fontSize: 16,
    color: '#222',
    lineHeight: 22,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#fff',
    borderTopWidth: 1,
    borderColor: '#eee',
  },
  input: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    borderColor: '#ddd',
    borderWidth: 1,
    borderRadius: 22,
    paddingHorizontal: 16,
    paddingVertical: 8,
    backgroundColor: '#f7f7f7',
    fontSize: 16,
    textAlignVertical: 'center',
  },
  sendButton: {
    backgroundColor: '#25D366',
    marginLeft: 8,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 22,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.2,
    shadowRadius: 2,
    elevation: 2,
  },
  sendButtonDisabled: {
    backgroundColor: '#ccc',
  },
  sendButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  userMsgDark: {
    backgroundColor: '#263238',
  },
  aiMsgDark: {
    backgroundColor: '#222',
  },
  msgRoleDark: {
    color: '#25D366',
  },
  msgTextDark: {
    color: '#fff',
  },
  msgTime: {
    fontSize: 12,
    color: '#888',
    marginTop: 4,
    textAlign: 'right',
  },
}); 