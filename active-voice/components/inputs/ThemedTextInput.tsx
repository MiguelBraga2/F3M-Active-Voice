import React, { forwardRef } from 'react'
import { TextInput, TextInputProps, StyleSheet } from 'react-native'
import { useThemeColor } from '@/hooks/useThemeColor'

export const ThemedTextInput = forwardRef<TextInput, TextInputProps>(({
  placeholder,
  style,
  keyboardType,
  multiline = false,
  numberOfLines = 1,
  ...rest
}, ref) => {
  const placeholderColor = useThemeColor({}, 'placeholder');
  const textColor = useThemeColor({}, 'text');

  return (
    <TextInput
      ref={ref}
      placeholder={placeholder}
      placeholderTextColor={placeholderColor}
      accessible={true}
      multiline={multiline}
      numberOfLines={numberOfLines}
      textAlignVertical={multiline ? 'top' : 'center'}
      style={[
        styles.input,
        style,
        { color: textColor },
        { borderColor: placeholderColor },
        multiline && { height: numberOfLines * 40 },
        multiline && { paddingTop: 10 }
      ]}
      {...rest}
    />
  );
});

const styles = StyleSheet.create({
  input: {
    height: 40,
    borderWidth: 1,
    paddingHorizontal: 10,
    borderRadius: 5,
    fontSize: 16,
  },
});