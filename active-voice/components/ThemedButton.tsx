import React from 'react';
import { Button, StyleSheet, View, ButtonProps } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';

export type ThemedButtonProps = ButtonProps & {
    style?: any;
    variant?: 'primary' | 'secondary';
};


export function ThemedButton({ title, onPress, style, variant, ...rest }: ThemedButtonProps) {
  const color = useThemeColor({}, variant ? variant : 'primary'); 

  return (
    <View style={[styles.buttonContainer, style]}>
      <Button
        title={title}
        onPress={onPress}
        color={color}
        {...rest}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  buttonContainer: {
    marginTop: 15,
    borderRadius: 5,
    overflow: 'hidden', // Para garantir que o Button siga o borderRadius
  },
});