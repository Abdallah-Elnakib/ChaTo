import { Redirect } from 'expo-router';
import React from 'react';

// Redirect any direct navigation to /chat to the chat screen
export default function ChatRedirect() {
  return <Redirect href="./screens/ChatScreen" />;
}
