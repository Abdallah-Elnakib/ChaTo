import { Ionicons } from '@expo/vector-icons';
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import * as Haptics from 'expo-haptics';
import { LinearGradient } from 'expo-linear-gradient';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useContext, useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  FlatList,
  Image,
  Keyboard,
  KeyboardAvoidingView,
  Platform,
  SafeAreaView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View
} from 'react-native';
import { ThemeContext } from '../context/ThemeContext';

// Constants
const DEFAULT_AVATAR = 'https://ui-avatars.com/api/?background=random&name=User&rounded=true&format=png';

const ChatScreen = () => {
  const params = useLocalSearchParams();
  const router = useRouter();
  const { darkMode, colors } = useContext(ThemeContext);
  
  // State variables
  const [friend, setFriend] = useState(null);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [inputMessage, setInputMessage] = useState('');
  const [conversationId, setConversationId] = useState(null);
  const [isTyping, setIsTyping] = useState(false);
  const [showAttachmentOptions, setShowAttachmentOptions] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingDuration, setRecordingDuration] = useState(0);
  const [refreshing, setRefreshing] = useState(false);
  const [lastSeen, setLastSeen] = useState(null);
  const [userData, setUserData] = useState(null);
  
  // Refs
  const flatListRef = useRef(null);
  const inputRef = useRef(null);
  const recordingTimerRef = useRef(null);
  const typingTimerRef = useRef(null);
  
  // Animated values
  const attachmentMenuHeight = useRef(new Animated.Value(0)).current;
  const micAnimation = useRef(new Animated.Value(1)).current;
  
  // Improved keyboard handling with better layout adjustment
  useEffect(() => {
    // Create event listeners for keyboard
    const keyboardWillShowListener = Platform.OS === 'ios' ? 
      Keyboard.addListener('keyboardWillShow', () => {
        setShowAttachmentOptions(false);
      }) :
      Keyboard.addListener('keyboardDidShow', () => {
        setShowAttachmentOptions(false);
      });
    
    // Handle keyboard hiding
    const keyboardWillHideListener = Platform.OS === 'ios' ? 
      Keyboard.addListener('keyboardWillHide', () => {
        // iOS keyboard hiding
      }) :
      Keyboard.addListener('keyboardDidHide', () => {
        // Force UI refresh to ensure layout resets properly
        setTimeout(() => {
          requestAnimationFrame(() => {
            // This extra state update helps force Android to recalculate layout
          });
        }, 100);
      });
    
    // Scroll to bottom when keyboard appears
    const scrollToBottom = () => {
      if (messages.length > 0 && flatListRef.current) {
        setTimeout(() => {
          flatListRef.current?.scrollToEnd({ animated: true });
        }, 200);
      }
    };
    
    // Add listener for layout changes that should trigger scrolling
    const layoutSubscription = Dimensions.addEventListener('change', scrollToBottom);
    
    // Clean up
    return () => {
      keyboardWillShowListener.remove();
      keyboardWillHideListener.remove();
      layoutSubscription.remove();
    };
  }, [messages.length]);
  
  // Get user data from AsyncStorage
  useEffect(() => {
    const getUserData = async () => {
      try {
        const userDataStr = await AsyncStorage.getItem('userData');
        if (userDataStr) {
          setUserData(JSON.parse(userDataStr));
        }
      } catch (error) {
        console.error('Error loading user data:', error);
      }
    };
    
    getUserData();
  }, []);
  
  // Get friend data from params or AsyncStorage
  useEffect(() => {
    const getFriendData = async () => {
      try {
        // First try to get from URL params
        if (params.friendId && params.friendName) {
          const friendData = {
            _id: params.friendId,
            name: params.friendName,
            avatar: params.friendAvatar || DEFAULT_AVATAR
          };
          
          setFriend(friendData);
          if (params.conversationId) {
            setConversationId(params.conversationId);
          }
          
          // Fetch additional friend data like last seen status
          fetchFriendStatus(params.friendId);
        } else {
          // Try to get from AsyncStorage if not in URL
          const storedFriendData = await AsyncStorage.getItem('currentChatFriend');
          if (storedFriendData) {
            const friendData = JSON.parse(storedFriendData);
            setFriend({
              _id: friendData.id,
              name: friendData.name,
              avatar: friendData.avatar || DEFAULT_AVATAR
            });
            
            // Fetch additional friend data like last seen status
            fetchFriendStatus(friendData.id);
          }
          
          const storedConvId = await AsyncStorage.getItem('currentConversationId');
          if (storedConvId) {
            setConversationId(storedConvId);
          }
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Error getting friend data:', error);
        // Toast Message instead of Alert for better UX
        setLoading(false);
        // Provide haptic feedback for error
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      }
    };
    
    getFriendData();
  }, [params.friendId, params.friendName, params.friendAvatar, params.conversationId]);
  
  // Fetch friend status (last seen, online status)
  const fetchFriendStatus = async (friendId) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) return;
      
      const response = await axios.get(
        `http://10.0.2.2:5000/api/users/${friendId}/status`,
        {
          headers: { Authorization: `Bearer ${token}` },
          timeout: 5000 // 5 seconds timeout
        }
      );
      
      if (response.data && response.data.lastSeen) {
        setLastSeen(response.data.lastSeen);
      }
    } catch (_error) {
      // Silently fail - status is not critical information
      console.log('Could not fetch friend status');
    }
  };
  
  // Format last seen timestamp into user-friendly string
  const formatLastSeen = (timestamp) => {
    if (!timestamp) return '';
    
    const now = new Date();
    const lastSeenDate = new Date(timestamp);
    const diffMs = now - lastSeenDate;
    const diffMins = Math.round(diffMs / 60000);
    const diffHours = Math.round(diffMs / 3600000);
    const diffDays = Math.round(diffMs / 86400000);
    
    if (diffMins < 1) return 'online now';
    if (diffMins < 60) return `last seen ${diffMins} min ago`;
    if (diffHours < 24) return `last seen ${diffHours} ${diffHours === 1 ? 'hour' : 'hours'} ago`;
    if (diffDays < 7) return `last seen ${diffDays} ${diffDays === 1 ? 'day' : 'days'} ago`;
    
    return `last seen on ${lastSeenDate.toLocaleDateString()}`;
  };
  
  // Refresh messages and chat data
  const refreshChat = async () => {
    if (!conversationId) return;
    
    setRefreshing(true);
    try {
      await fetchMessages();
      if (friend && friend._id) {
        await fetchFriendStatus(friend._id);
      }
    } catch (error) {
      console.log('Refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  };
  
  // Wrap fetchMessages in useCallback to prevent unnecessary re-renders
  const fetchMessages = useCallback(async () => { 
    if (!conversationId) return;
    
    try {
      setRefreshing(true);
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        // Use haptic feedback instead of alert for better UX
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        setRefreshing(false);
        return;
      }
      
      const response = await axios.get(
        `http://10.0.2.2:5000/api/conversations/${conversationId}/messages`,
        {
          headers: { 
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        }
      );
      
      if (response.data) {
        // Sort messages by date
        const sortedMessages = response.data.sort((a, b) => 
          new Date(a.createdAt) - new Date(b.createdAt)
        );
        setMessages(sortedMessages);
        
        // Scroll to bottom after loading messages
        setTimeout(() => {
          if (flatListRef.current) {
            flatListRef.current.scrollToEnd({ animated: false });
          }
        }, 100);
        
        // Provide subtle haptic feedback on successful message load
        Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      }
    } catch (error) {
      console.error('Failed to fetch messages:', error);
      // Don't show an alert for network errors - just show an empty chat
    } finally {
      setRefreshing(false);
    }
  }, [conversationId]); // Added dependency array with conversationId
  
  // Load messages when conversation ID changes
  useEffect(() => {
    if (conversationId) {
      fetchMessages();
    }
  }, [conversationId, fetchMessages]);
  
  // Handle typing indicator and send the message
  const handleInputChange = (text) => {
    setInputMessage(text);
    
    // Show typing indicator (in a real app, this would send a typing status to the server)
    if (!isTyping && text.length > 0) {
      setIsTyping(true);
      
      // Clear any existing typing timers
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
      
      // Set timer to hide typing indicator after inactivity
      typingTimerRef.current = setTimeout(() => {
        setIsTyping(false);
      }, 3000);
    } else if (text.length === 0) {
      setIsTyping(false);
      if (typingTimerRef.current) {
        clearTimeout(typingTimerRef.current);
      }
    }
  };
  
  // Start voice recording
  const startRecording = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    setIsRecording(true);
    
    // Animate microphone button
    Animated.loop(
      Animated.sequence([
        Animated.timing(micAnimation, {
          toValue: 1.2,
          duration: 500,
          useNativeDriver: true
        }),
        Animated.timing(micAnimation, {
          toValue: 1,
          duration: 500,
          useNativeDriver: true
        })
      ])
    ).start();
    
    // Start recording timer
    let seconds = 0;
    recordingTimerRef.current = setInterval(() => {
      seconds += 1;
      setRecordingDuration(seconds);
    }, 1000);
    
    // In a real app, this would start actual audio recording
    // For demo purposes, we just show the UI
  };
  
  // Cancel voice recording
  const cancelRecording = () => {
    if (isRecording) {
      Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      setIsRecording(false);
      setRecordingDuration(0);
      
      // Stop animation and clear timer
      micAnimation.setValue(1);
      if (recordingTimerRef.current) {
        clearInterval(recordingTimerRef.current);
      }
    }
  };
  
  // Format recording duration as mm:ss
  const formatDuration = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins < 10 ? '0' : ''}${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };
  
  // Toggle attachment menu
  const toggleAttachmentMenu = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    if (showAttachmentOptions) {
      // Hide the menu
      Animated.timing(attachmentMenuHeight, {
        toValue: 0,
        duration: 200,
        useNativeDriver: false
      }).start();
      setShowAttachmentOptions(false);
    } else {
      // Show the menu
      Animated.timing(attachmentMenuHeight, {
        toValue: 120,
        duration: 200,
        useNativeDriver: false
      }).start();
      setShowAttachmentOptions(true);
    }
  };
  
  // Send a message
  const sendMessage = async () => {
    // Don't send empty messages
    if (!inputMessage.trim() || !friend) return;
    
    // Provide haptic feedback when sending
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Create a temporary message immediately for better UX (optimistic UI)
    const tempId = Date.now().toString();
    const messageText = inputMessage.trim();
    const tempMessage = {
      _id: tempId,
      text: messageText,
      sender: 'me',
      createdAt: new Date().toISOString(),
      pending: true
    };
    
    // Add to UI immediately
    setMessages(prevMessages => [...prevMessages, tempMessage]);
    setInputMessage('');
    
    // Clear typing status
    setIsTyping(false);
    if (typingTimerRef.current) {
      clearTimeout(typingTimerRef.current);
    }
    
    // Scroll to the new message
    setTimeout(() => {
      if (flatListRef.current) {
        flatListRef.current.scrollToEnd({ animated: true });
      }
    }, 50);
    
    try {
      const token = await AsyncStorage.getItem('token');
      if (!token) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        return;
      }
      
      // If we don't have a conversation ID yet, create one
      let currentConvId = conversationId;
      
      if (!currentConvId) {
        try {
          const convResponse = await axios.post(
            'http://10.0.2.2:5000/api/conversations/create',
            { participants: [friend._id] },
            {
              headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json'
              },
              timeout: 5000
            }
          );
          
          if (convResponse.data && convResponse.data._id) {
            currentConvId = convResponse.data._id;
            setConversationId(currentConvId);
            AsyncStorage.setItem('currentConversationId', currentConvId);
          } else {
            throw new Error('Conversation ID not found');
          }
        } catch (_error) {
          // We already added the message to UI, so just leave it as pending
          return;
        }
      }
      
      // Send the actual message to server
      const response = await axios.post(
        `http://10.0.2.2:5000/api/conversations/${currentConvId}/messages`,
        { text: messageText },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          },
          timeout: 8000
        }
      );
      
      if (response.data) {
        // Replace the temporary message with the real one from server
        setMessages(prevMessages => 
          prevMessages.map(msg => 
            msg._id === tempId ? {...response.data, pending: false} : msg
          )
        );
      }
    } catch (_error) {
      // Message remains in UI with pending status
      // In a production app, we might retry sending in the background
    }
  };
  
  // Handle back button
  const handleBack = () => {
    // Clear temporary storage before leaving
    AsyncStorage.removeItem('currentChatFriend');
    // Go back to previous screen
    router.back();
  };
  
  // Render a modern, professional message bubble
  const renderMessage = ({ item }) => {
    const isMyMessage = item.sender === 'me' || item.sender === userData?._id;
    const showAvatar = !isMyMessage && true;

    return (
      <View style={{ flexDirection: isMyMessage ? 'row-reverse' : 'row', alignItems: 'flex-end', marginBottom: 12 }}>
        {/* Avatar for received messages */}
        {showAvatar && (
          <Image
            source={{ uri: friend?.avatar || DEFAULT_AVATAR }}
            style={styles.bubbleAvatar}
          />
        )}
        <TouchableOpacity
          activeOpacity={0.85}
          onLongPress={() => {
            Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          }}
          style={{ flex: 1, alignItems: isMyMessage ? 'flex-end' : 'flex-start' }}
        >
          <View style={[
            styles.messageBubbleModern,
            isMyMessage ? styles.myMessageBubbleModern : styles.theirMessageBubbleModern,
            item.pending && styles.pendingMessage,
          ]}>
            {/* تدرج لوني حقيقي للرسائل المرسلة */}
            {isMyMessage && (
              <LinearGradient
                colors={['#2076F7', '#5EA7FF']}
                start={{ x: 0, y: 0 }}
                end={{ x: 1, y: 1 }}
                style={{
                  position: 'absolute',
                  left: 0,
                  right: 0,
                  top: 0,
                  bottom: 0,
                  borderRadius: 24,
                  zIndex: -1,
                }}
              />
            )}
            {/* اسم المرسل صغير جدًا */}
            {!isMyMessage && (
              <Text style={{ fontSize: 11, color: '#888', marginBottom: 2, fontWeight: 'bold', opacity: 0.7 }}>{item.senderName || friend?.name}</Text>
            )}
            <Text style={[styles.bubbleText, isMyMessage && styles.bubbleTextMine]}>{item.text}</Text>
            <View style={styles.bubbleFooter}>
              <Text style={styles.bubbleTime}>
                {new Date(item.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </Text>
              {item.pending ? (
                <Text style={styles.bubblePending}>sending...</Text>
              ) : isMyMessage && (
                <Ionicons name="checkmark-done" size={16} color="#fff" style={styles.bubbleTick} />
              )}
            </View>
          </View>
        </TouchableOpacity>
        {/* Space for alignment if my message */}
        {isMyMessage && <View style={{ width: 36 }} />}
      </View>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#25D366" />
      </SafeAreaView>
    );
  }
  
  if (!friend) {
    return (
      <SafeAreaView style={styles.errorContainer}>
        <Text style={styles.errorText}>Error loading chat</Text>
        <TouchableOpacity style={styles.backButton} onPress={handleBack}>
          <Text style={styles.backButtonText}>Go Back</Text>
        </TouchableOpacity>
      </SafeAreaView>
    );
  }

  // Display recording UI when recording is active
  if (isRecording) {
    return (
      <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
        <View style={styles.recordingContainer}>
          <View style={styles.recordingContent}>
            <View style={styles.recordingIcon}>
              <Ionicons name="mic" size={24} color="white" />
            </View>
            <View style={styles.recordingInfo}>
              <Text style={styles.recordingDuration}>{formatDuration(recordingDuration)}</Text>
              <Text style={styles.recordingHint}>Slide to cancel</Text>
            </View>
            <TouchableOpacity style={styles.recordingSend}>
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.container, { backgroundColor: colors.background }]}>
      <StatusBar style={darkMode ? "light" : "dark"} />
      
      {/* Chat Header - Modern Style with theme support */}
      <View style={[styles.header, { backgroundColor: darkMode ? '#1F1F1F' : '#075E54' }]}>
        <View style={styles.headerContent}>
          <TouchableOpacity style={styles.headerBackButton} onPress={handleBack}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
          </TouchableOpacity>
          
          <View style={styles.profileContainer}>
            <Image 
              source={{ uri: friend?.avatar || DEFAULT_AVATAR }} 
              style={styles.avatar} 
            />
            
            <View style={styles.profileInfo}>
              <Text style={styles.headerTitle} numberOfLines={1}>
                {friend?.name}
              </Text>
              <Text style={styles.statusText} numberOfLines={1}>
                {lastSeen ? formatLastSeen(lastSeen) : 'offline'}
              </Text>
            </View>
          </View>
          
          <View style={styles.headerActions}>
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="call" size={22} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="videocam" size={22} color="#FFF" />
            </TouchableOpacity>
            
            <TouchableOpacity style={styles.headerButton}>
              <Ionicons name="ellipsis-vertical" size={22} color="#FFF" />
            </TouchableOpacity>
          </View>
        </View>
      </View>
      
      {/* Messages List - Enhanced UI */}
      <KeyboardAvoidingView 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={[styles.keyboardAvoidView, { backgroundColor: darkMode ? colors.background : '#f7f7f7' }]}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 90 : 0}
        enabled={true}
      >
        {/* Chat background with pattern image */}
        <View style={styles.chatContainer}>
          <Image 
            source={{ uri: 'https://i.pinimg.com/originals/97/c0/07/97c00759d90d786d9b6096d274ad3e07.png' }} 
            style={styles.chatBackground} 
            resizeMode="repeat"
          />
          
          {/* Message list with pull-to-refresh */}
          <FlatList
            ref={flatListRef}
            data={messages}
            renderItem={renderMessage}
            keyExtractor={item => item._id.toString()}
            contentContainerStyle={styles.messagesList}
            onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: false })}
            onLayout={() => flatListRef.current?.scrollToEnd({ animated: false })}
            refreshing={refreshing}
            onRefresh={refreshChat}
            showsVerticalScrollIndicator={false}
            ListEmptyComponent={
              <View style={styles.emptyContainer}>
                <Ionicons name="chatbubble-ellipses" size={60} color="#c5c5c5" />
                <Text style={styles.emptyText}>No messages yet</Text>
                <Text style={styles.emptySubtext}>Start the conversation!</Text>
              </View>
            }
          />
        </View>
        
        {/* Typing indicator */}
        {isTyping && (
          <View style={styles.typingContainer}>
            <View style={styles.typingBubble}>
              <View style={styles.typingDots}>
                <View style={[styles.typingDot, styles.typingDot1]} />
                <View style={[styles.typingDot, styles.typingDot2]} />
                <View style={[styles.typingDot, styles.typingDot3]} />
              </View>
            </View>
          </View>
        )}
        
        {/* Modern message input with theme support */}
        <View style={[styles.inputContainer, { 
          backgroundColor: darkMode ? colors.card : '#fff',
          borderTopColor: darkMode ? colors.border : '#E8E8E8',
          paddingBottom: Platform.OS === 'ios' ? 10 : 10,
          bottom: 0, // Ensure it's at the bottom
          position: 'relative', // Helps with positioning on Android
        }]}>
          <TouchableOpacity style={styles.inputButton} onPress={toggleAttachmentMenu}>
            <Ionicons name="add-circle-outline" size={26} color={darkMode ? '#9d9d9d' : '#5d5d5d'} />
          </TouchableOpacity>
          
          <TextInput 
            ref={inputRef}
            style={[styles.input, { 
              backgroundColor: darkMode ? '#333' : '#f2f2f2',
              color: darkMode ? colors.text : '#000'
            }]}
            value={inputMessage}
            onChangeText={handleInputChange}
            placeholder="Type a message"
            placeholderTextColor={darkMode ? '#999' : '#888'}
            multiline
            maxLength={500}
          />
          
          <TouchableOpacity style={styles.inputButton}>
            <Ionicons name="happy-outline" size={26} color={darkMode ? '#9d9d9d' : '#5d5d5d'} />
          </TouchableOpacity>
          
          {inputMessage.trim().length > 0 ? (
            <TouchableOpacity 
              style={[styles.sendButton, { backgroundColor: darkMode ? '#0A84FF' : '#25D366' }]}
              onPress={sendMessage}
            >
              <Ionicons name="send" size={20} color="white" />
            </TouchableOpacity>
          ) : (
            <TouchableOpacity 
              style={[styles.micButton, { backgroundColor: darkMode ? '#0A84FF' : '#25D366' }]}
              onLongPress={startRecording}
              onPressOut={cancelRecording}
            >
              <Ionicons name="mic" size={24} color="white" />
            </TouchableOpacity>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  // Modern message bubble styles
  messageBubbleModern: {
    maxWidth: '70%',
    borderRadius: 24,
    paddingVertical: 8,
    paddingHorizontal: 14,
    marginHorizontal: 4,
    marginVertical: 2,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 2,
    borderWidth: 0,
  },
  myMessageBubbleModern: {
    backgroundColor: 'transparent',
    alignSelf: 'flex-end',
    borderTopRightRadius: 22,
    borderBottomRightRadius: 24,
    borderTopLeftRadius: 24,
    borderBottomLeftRadius: 24,
    overflow: 'hidden',
  },
  theirMessageBubbleModern: {
    backgroundColor: '#F4F6FB',
    alignSelf: 'flex-start',
    borderTopLeftRadius: 22,
    borderBottomLeftRadius: 24,
    borderTopRightRadius: 24,
    borderBottomRightRadius: 24,
    borderWidth: 0,
  },
  bubbleText: {
    fontSize: 16.5,
    color: '#23272F',
    lineHeight: 22,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  bubbleTextMine: {
    color: '#fff',
    fontWeight: 'bold',
  },
  bubbleFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 0,
  },
  bubbleTime: {
    fontSize: 12.5,
    color: '#6bb5ff',
    fontWeight: 'bold',
    marginRight: 6,
    marginTop: 2,
    opacity: 0.85,
  },
  bubblePending: {
    fontSize: 12,
    color: '#FFA500',
    marginLeft: 4,
  },
  bubbleTick: {
    marginLeft: 2,
    marginTop: 1,
  },
  bubbleAvatar: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 6,
    marginLeft: 2,
    backgroundColor: '#eee',
  },
  bubbleSender: {
    fontSize: 13,
    color: '#666',
    marginBottom: 2,
    fontWeight: '600',
  },

  // Main container styles
  container: {
    flex: 1,
    backgroundColor: '#f7f7f7'
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7'
  },
  loadingText: {
    marginTop: 15,
    fontSize: 16,
    color: '#666',
    fontWeight: '500'
  },
  
  // Error screen styles
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#f7f7f7',
    padding: 20
  },
  errorIcon: {
    marginBottom: 20
  },
  errorText: {
    fontSize: 22,
    color: '#333',
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center'
  },
  errorSubtext: {
    fontSize: 16,
    color: '#666',
    marginBottom: 30,
    textAlign: 'center'
  },
  backButton: {
    padding: 5,
    marginRight: 5,
    backgroundColor: '#25D366',
    paddingVertical: 12,
    paddingHorizontal: 30,
    borderRadius: 30,
    elevation: 2,
    shadowColor: '#000',
    shadowOpacity: 0.2,
    shadowRadius: 2,
    shadowOffset: { width: 0, height: 2 }
  },
  backButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold'
  },
  
  // Header styles
  header: {
    backgroundColor: '#075E54',
    paddingTop: 10,
    paddingBottom: 12,
    elevation: 5,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.3,
    shadowRadius: 4,
    marginTop: 35
  },
  headerContent: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 10
  },
  headerBackButton: {
    padding: 5,
    marginRight: 5
  },
  profileContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center'
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    marginRight: 10
  },
  profileInfo: {
    flex: 1
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 2
  },
  statusText: {
    fontSize: 12,
    color: '#e6e6e6',
    fontWeight: '400'
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center'
  },
  headerButton: {
    padding: 8,
    marginLeft: 5
  },
  
  // Chat container styles
  chatContainer: {
    flex: 1
  },
  chatBackground: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.08
  },
  keyboardAvoidView: {
    flex: 1
  },
  messagesList: {
    padding: 10,
    paddingBottom: 80,
  },
  
  // Message styles
  messageWrapper: {
    marginBottom: 2,
    paddingVertical: 2
  },
  messageBubble: {
    maxWidth: '80%',
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 16,
    elevation: 1,
    shadowColor: '#000',
    shadowOpacity: 0.1,
    shadowRadius: 1,
    shadowOffset: { width: 0, height: 1 }
  },
  myMessage: {
    alignSelf: 'flex-end',
    backgroundColor: '#E7FFDB',
    borderBottomRightRadius: 4
  },
  myFirstInGroup: {
    borderTopRightRadius: 16
  },
  myLastInGroup: {
    borderBottomRightRadius: 16,
    marginBottom: 8
  },
  theirMessage: {
    alignSelf: 'flex-start',
    backgroundColor: '#fff',
    borderBottomLeftRadius: 4
  },
  theirFirstInGroup: {
    borderTopLeftRadius: 16
  },
  theirLastInGroup: {
    borderBottomLeftRadius: 16,
    marginBottom: 8
  },
  pendingMessage: {
    opacity: 0.7
  },
  messageSender: {
    fontSize: 12,
    fontWeight: '500',
    color: '#556B2F',
    marginBottom: 2
  },
  messageText: {
    fontSize: 16,
    color: '#303030',
    lineHeight: 22
  },
  myMessageText: {
    color: '#202020'
  },
  messageFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'flex-end',
    marginTop: 4
  },
  timeText: {
    fontSize: 11,
    color: '#999',
    marginRight: 4
  },
  pendingText: {
    fontSize: 11,
    color: '#999',
    fontStyle: 'italic'
  },
  readIcon: {
    marginLeft: 3
  },
  
  // Typing indicator
  typingContainer: {
    paddingHorizontal: 16,
    paddingBottom: 6
  },
  typingBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#f0f0f0',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 10,
    maxWidth: 100
  },
  typingDots: {
    flexDirection: 'row',
    justifyContent: 'center',
    width: 40,
    height: 15
  },
  typingDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: '#90a4ae',
    marginHorizontal: 2
  },
  typingDot1: {
    opacity: 0.6,
    transform: [{ translateY: 3 }]
  },
  typingDot2: {
    opacity: 0.8,
    transform: [{ translateY: 0 }]
  },
  typingDot3: {
    opacity: 1.0,
    transform: [{ translateY: 3 }]
  },
  
  // Empty state
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
    height: 300,
    opacity: 0.7
  },
  emptyText: {
    fontSize: 18,
    color: '#757575',
    textAlign: 'center',
    fontWeight: 'bold',
    marginTop: 15,
    marginBottom: 8
  },
  emptySubtext: {
    fontSize: 14,
    color: '#9e9e9e',
    textAlign: 'center'
  },
  
  // Input area
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 8,
    paddingVertical: 6,
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  inputButton: {
    width: 36,
    height: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4
  },
  input: {
    flex: 1,
    backgroundColor: '#fff',
    borderRadius: 20,
    paddingHorizontal: 15,
    paddingVertical: 8,
    paddingRight: 48,
    minHeight: 40,
    maxHeight: 100,
    fontSize: 16,
    marginHorizontal: 4,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  sendButton: {
    backgroundColor: '#25D366',
    borderRadius: 50,
    height: 36,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4
  },
  micButton: {
    backgroundColor: '#25D366',
    borderRadius: 50,
    height: 36,
    width: 36,
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4
  },
  
  // Attachment menu styles
  attachmentMenu: {
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    overflow: 'hidden'
  },
  attachmentRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    paddingVertical: 10,
    paddingHorizontal: 10
  },
  attachmentOption: {
    alignItems: 'center',
    width: 80
  },
  attachmentIcon: {
    width: 50,
    height: 50,
    borderRadius: 25,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 6
  },
  attachmentText: {
    fontSize: 12,
    color: '#666'
  },
  
  // Voice recording UI
  recordingContainer: {
    backgroundColor: '#f5f5f5',
    borderTopWidth: 1,
    borderTopColor: '#e0e0e0',
    paddingVertical: 8,
    paddingHorizontal: 15,
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
  },
  recordingContent: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff',
    borderRadius: 30,
    paddingHorizontal: 15,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: '#e0e0e0'
  },
  recordingIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#ef5350',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 15
  },
  recordingInfo: {
    flex: 1
  },
  recordingDuration: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 3
  },
  recordingHint: {
    fontSize: 12,
    color: '#999'
  },
  recordingSend: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#25D366',
    justifyContent: 'center',
    alignItems: 'center'
  }
});

export default ChatScreen;