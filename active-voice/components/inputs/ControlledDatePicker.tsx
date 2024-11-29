import React, { forwardRef } from 'react';
import { Controller, Control } from 'react-hook-form';
import { ThemedDatePicker } from './ThemedDatePicker';
import { ThemedText } from '../ThemedText';
import { Text } from 'react-native';

interface ControlledDatePickerProps {
    control: Control<any>;
    name: string;
    placeholder?: string;
}

export const ControlledDatePicker = forwardRef<Text, ControlledDatePickerProps>(({ control, name, placeholder }, ref) => {
    return (
        <Controller
            control={control}
            name={name}
            defaultValue={null}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                    <ThemedDatePicker ref={ref} date={value} placeholder={placeholder} onDateChange={onChange} />
                    {error && <ThemedText type="error">{error.message}</ThemedText>}
                </>
            )}
        />
    );
});