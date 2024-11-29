// ControlledRadioGroup.tsx
import React, { forwardRef } from 'react';
import { View, StyleSheet, Text } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { RadioButton } from 'react-native-paper';
import { ThemedText } from './../ThemedText';
import { ThemedView } from '../views/ThemedView';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ControlledRadioGroupProps {
    control: Control<any>;
    name: string;
    options: { label: React.ReactNode; value: string }[];
    onValueChange?: (value: string) => void; // Adicionando a prop onValueChange
}

export const ControlledRadioGroup = forwardRef<Text, ControlledRadioGroupProps>(({ control, name, options, onValueChange }, ref) => {
    const borderColor = useThemeColor({}, 'placeholder');
    const accent = useThemeColor({}, 'accent');

    return (
        <Controller
            control={control}
            name={name}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                <ThemedView style={[styles.container, { borderColor: borderColor }]}>
                    <RadioButton.Group
                        onValueChange={(newValue) => {
                            onChange(newValue);
                            if (onValueChange) onValueChange(newValue); // Chama a função se estiver presente
                        }}
                        value={value}
                    >
                        {options.map((option, index) => (
                            <View key={option.value}>
                                <View style={styles.radioContainer}>
                                    <RadioButton value={option.value} color={accent} />
                                    <ThemedText ref={ref} style={styles.textContainer}>{option.label}</ThemedText>
                                </View>
                                {index < options.length - 1 && <View style={[styles.separator, { backgroundColor: borderColor} ]} />}
                            </View>
                        ))}
                    </RadioButton.Group>
                </ThemedView>
                <View style={{marginBottom: 10}}>
                {error && <ThemedText type="error">{error.message}</ThemedText>}
                </View>
                </>
            )}
        />
    );
});

const styles = StyleSheet.create({
    radioContainer: {
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center'
    },
    textContainer: {
        paddingRight: 30
    },
    container: {
        marginTop: 5,
        borderWidth: 1,
        borderRadius: 5,
    },
    separator: {
        height: 1, 
        width: '100%', 
    },
});
