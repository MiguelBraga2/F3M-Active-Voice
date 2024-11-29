import React, { forwardRef } from 'react';
import { View, StyleSheet } from 'react-native';
import { Controller, Control } from 'react-hook-form';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedCheckbox } from './ThemedCheckbox';
import { ThemedText } from '../ThemedText';

interface ControlledThemedCheckboxProps {
    control: Control<any>;
    name: string;
    label: string;
    defaultValue?: boolean;
}

const ControlledCheckbox = forwardRef<View, ControlledThemedCheckboxProps>(({ control, name, label, defaultValue = true }, ref) => {
    const borderColor = useThemeColor({}, 'placeholder');

    return (
        <View style={[styles.container, { borderColor }]}>
            <Controller
                control={control}
                name={name}
                defaultValue={defaultValue}
                render={({ field: { value, onChange } }) => (
                    <View ref={ref} style={styles.checkboxContainer}>
                        <ThemedCheckbox
                            status={value ? 'unchecked' : 'checked'}
                            onPress={() => onChange(!value)}
                        />
                        <ThemedText>{label}</ThemedText>
                    </View>
                )}
            />
        </View>
    );
});

export default ControlledCheckbox;

const styles = StyleSheet.create({
    checkboxContainer: {
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    container: {
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 10,
    },
});
