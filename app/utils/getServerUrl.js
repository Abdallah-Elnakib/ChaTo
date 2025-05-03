import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LOCAL_SERVER_IP = '192.168.1.5'; // عدل هذا للـ IP الصحيح لجهازك
const LOCAL_SERVER_PORT = '5000';

export default function getServerUrl() {
  const extraUrl = (Constants.manifest?.extra?.SERVER_URL);
  if (extraUrl) return extraUrl;
  if (Platform.OS === 'android') {
    return `http://10.0.2.2:${LOCAL_SERVER_PORT}/api`;
  }
  return `http://${LOCAL_SERVER_IP}:${LOCAL_SERVER_PORT}/api`;
}
