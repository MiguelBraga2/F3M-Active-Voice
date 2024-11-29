// ThemedCheckbox.tsx
import React from 'react';
import { Checkbox } from 'react-native-paper';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ThemedCheckboxProps {
    status: 'checked' | 'unchecked';
    onPress: () => void;
}

export function ThemedCheckbox({ status, onPress }: ThemedCheckboxProps) {
    const checkboxColor = useThemeColor({}, 'accent'); // Supondo que você tenha uma cor de tema definida

    return (
        <Checkbox
            status={status}
            onPress={onPress}
            color={checkboxColor}
        />
    );
}
