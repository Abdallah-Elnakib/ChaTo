import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, TouchableOpacity, View } from 'react-native';
import { api } from './services/api';

export default function VerifyEmailScreen() {
  const { email } = useLocalSearchParams();
  const [code, setCode] = useState('');
  const [loading, setLoading] = useState(false);
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? 'light'];

  const handleVerify = async () => {
    if (!code) {
      Alert.alert('Error', 'Please enter the verification code');
      return;
    }

    setLoading(true);
    try {
      await api.verifyEmail({ email: email as string, code });
      Alert.alert('Success', 'Email verified successfully!');
      router.replace('/(tabs)' as any);
    } catch (error: any) {
      Alert.alert('Error', error.response?.data?.message || 'Invalid verification code. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText style={styles.title}>Verify Your Email</ThemedText>
      <ThemedText style={styles.subtitle}>
        Please enter the verification code sent to {email}
      </ThemedText>
      <View style={styles.inputContainer}>
        <TextInput
          style={[styles.input, { color: colors.text, backgroundColor: colorScheme === 'dark' ? '#333' : '#fff' }]}
          placeholder="Verification Code"
          placeholderTextColor={colorScheme === 'dark' ? '#999' : '#666'}
          value={code}
          onChangeText={setCode}
          keyboardType="number-pad"
          maxLength={6}
        />
      </View>
      <TouchableOpacity 
        style={[styles.button, loading && styles.buttonDisabled]} 
        onPress={handleVerify}
        disabled={loading}
      >
        <ThemedText style={styles.buttonText}>
          {loading ? 'Verifying...' : 'Verify'}
        </ThemedText>
      </TouchableOpacity>
      <TouchableOpacity onPress={() => router.back()}>
        <ThemedText style={styles.link}>Back to Register</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: 10,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 16,
    marginBottom: 30,
    textAlign: 'center',
    opacity: 0.7,
  },
  inputContainer: {
    marginBottom: 20,
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ccc',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    textAlign: 'center',
  },
  button: {
    backgroundColor: '#007AFF',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 15,
  },
  buttonDisabled: {
    opacity: 0.7,
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: 'bold',
  },
  link: {
    color: '#007AFF',
    textAlign: 'center',
  },
}); 