/**
 * Below are the colors that are used in the app. The colors are defined in the light and dark mode.
 * There are many other ways to style your app. For example, [Nativewind](https://www.nativewind.dev/), [Tamagui](https://tamagui.dev/), [unistyles](https://reactnativeunistyles.vercel.app), etc.
 */

const tintColorLight = '#0a7ea4';
const tintColorDark = '#fff';

export const Colors = {
  light: {
    accent: '#007BFF',
    text: '#11181C',
    background: '#fff',
    primary: '#007AFF',   
    secondary: '#6C757D',     
    tint: tintColorLight,
    icon: '#687076',
    tabIconDefault: '#687076',
    tabIconSelected: tintColorLight,
    placeholder: '#999'
  },
  dark: {
    accent: '#007BFF',
    text: '#ECEDEE',
    background: '#151718',
    primary: '#0A84FF',
    secondary: '#495057',     
    tint: tintColorDark,
    icon: '#9BA1A6',
    tabIconDefault: '#9BA1A6',
    tabIconSelected: tintColorDark,
    placeholder: '#ccc'
  },
};
