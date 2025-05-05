import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { Text, TextProps } from 'react-native';

export function ThemedText(props: TextProps) {
  const colorScheme = useColorScheme();
  const color = Colors[colorScheme ?? 'light'].text;

  return (
    <Text
      {...props}
      style={[
        { color },
        props.style,
      ]}
    />
  );
} 