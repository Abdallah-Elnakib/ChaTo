import AsyncStorage from '@react-native-async-storage/async-storage';

export const saveToken = async (token: string) => {
  try {
    await AsyncStorage.setItem('userToken', token);
  } catch (error) {
    console.error('Error saving token:', error);
    throw error;
  }
};

export const getToken = async () => {
  try {
    return await AsyncStorage.getItem('userToken');
  } catch (error) {
    console.error('Error getting token:', error);
    throw error;
  }
};

export const removeToken = async () => {
  try {
    await AsyncStorage.removeItem('userToken');
  } catch (error) {
    console.error('Error removing token:', error);
    throw error;
  }
}; 