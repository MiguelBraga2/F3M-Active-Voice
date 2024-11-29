import React, { forwardRef } from 'react';
import { StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedView } from '../views/ThemedView';

interface ThemedPickerProps {
    selectedValue: string;
    onValueChange: (value: string) => void;
    placeholder?: string;
    options: { name: string }[]; // Usa diretamente o array `bodyParts`
}

export const ThemedPicker = forwardRef<Picker<string>,ThemedPickerProps>(({ selectedValue, onValueChange, placeholder, options }, ref) => {
    const borderColor = useThemeColor({}, 'placeholder');
    const selectedColor = useThemeColor({}, 'text'); 
    const defaultColor = useThemeColor({}, 'placeholder'); 

    return (
        <ThemedView style={[styles.container, { borderColor }]}>
            <Picker
                ref={ref}
                selectedValue={selectedValue}
                onValueChange={onValueChange}
                style={[
                    styles.picker, 
                    { color: selectedValue ? selectedColor : defaultColor } 
                ]}
            >
                <Picker.Item label={placeholder || "Selecione uma parte"} value="" />
                {options.map((option) => (
                    <Picker.Item key={option.name} label={option.name} value={option.name} />
                ))}
            </Picker>
        </ThemedView>
    );
});

const styles = StyleSheet.create({
    container: {
        marginTop: 5,
        borderWidth: 1,
        borderRadius: 5,
        height: 40,
        justifyContent: 'center',
    },
    picker: {
        fontSize: 16,
        margin: -8,
    },
});
