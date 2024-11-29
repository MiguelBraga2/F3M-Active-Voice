// ThemedRadioGroup.tsx
import React from 'react';
import { View, StyleSheet } from 'react-native';
import { RadioButton } from 'react-native-paper';

interface ThemedRadioGroupProps {
    value: string;
    onValueChange: (value: string) => void;
    options: { label: string; value: string }[];
}

export function ThemedRadioGroup({ value, onValueChange, options }: ThemedRadioGroupProps) {
    return (
        <View style={styles.container}>
            <RadioButton.Group onValueChange={onValueChange} value={value}>
                {options.map((option) => (
                    <RadioButton.Item key={option.value} label={option.label} value={option.value} />
                ))}
            </RadioButton.Group>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        marginBottom: 10,
    },
});
