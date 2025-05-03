

import Constants from 'expo-constants';
import { Platform } from 'react-native';

const LOCAL_SERVER_IP = '192.168.1.5'; 
const LOCAL_SERVER_PORT = '5000';

function getServerUrl() {
    const extraUrl = (Constants.manifest as any)?.extra?.SERVER_URL;
    if (extraUrl) return extraUrl;
    // Expo Go على الهاتف الفعلي
    if (Platform.OS === 'android' || Platform.OS === 'ios') {
        return `http://192.168.1.6:5000/api`;
    }
    // fallback للمحاكي أو بيئة أخرى
    return `http://10.0.2.2:5000/api`;
}

export default getServerUrl;