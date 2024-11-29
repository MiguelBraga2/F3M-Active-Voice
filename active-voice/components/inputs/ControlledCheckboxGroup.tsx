import React, { forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { ThemedText } from './../ThemedText';
import { ThemedCheckbox } from './ThemedCheckbox';
import { useThemeColor } from '@/hooks/useThemeColor';

interface ControlledCheckboxGroupProps {
    control: Control<any>;
    name: string;
    options: string[];
}

export const ControlledCheckboxGroup = forwardRef<View, ControlledCheckboxGroupProps>(({ control, name, options }, ref) => {
    const borderColor = useThemeColor({}, 'placeholder');

    return (
        <Controller
            control={control}
            name={name}
            render={({ field: { onChange, value = [] }, fieldState: { error } }) => (
                <>
                <View ref={ref} style={[styles.container, {borderColor: borderColor}]}>
                    {options.map((option, index) => (
                        <View key={option}>
                            <View style={styles.checkboxContainer}>
                                <ThemedCheckbox
                                    status={value.includes(option) ? 'checked' : 'unchecked'}
                                    onPress={() => {
                                        const newValue = value.includes(option)
                                            ? value.filter((item: string) => item !== option)
                                            : [...value, option];
                                        onChange(newValue);
                                    }}
                                />
                                <ThemedText>{option}</ThemedText>
                            </View>
                            {/* Separador entre opções */}
                            {index < options.length - 1 && <View style={[styles.separator, {backgroundColor : borderColor}]} />}
                        </View>
                    ))}
                </View>
                <View style={{marginBottom: 10}}>
                {error && <ThemedText type="error">{error.message}</ThemedText>}
                </View>
                </>
            )}
        />
    );
});

const styles = StyleSheet.create({
    container: {
        marginTop: 5,
        borderWidth: 1,
        borderRadius: 5,
    },
    checkboxContainer: {
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    separator: {
        height: 1, // Altura do separador
        marginVertical: 5, // Espaço vertical ao redor do separador
        width: '100%', // Largura do separador
    },
});
