import { useColorScheme } from 'react-native';
import { colors, darkColors } from '../utils/theme';

export const useTheme = () => {
  const colorScheme = useColorScheme();
  const isDark = colorScheme === 'dark';
  
  return {
    isDark,
    colors: isDark ? darkColors : colors,
  };
};
