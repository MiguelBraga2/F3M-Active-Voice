import React, { forwardRef } from 'react';
import { Controller, Control } from 'react-hook-form';
import { ThemedPicker } from './ThemedPicker';
import { ThemedText } from '../ThemedText';
import { Picker } from '@react-native-picker/picker';

interface ControlledPickerProps {
    control: Control<any>;
    name: string;
    placeholder?: string;
    options: string[];
}

export const ControlledPicker = forwardRef<Picker<string>, ControlledPickerProps>(({ control, name, placeholder, options }, ref) => {
    return (
        <Controller
            control={control}
            name={name}
            defaultValue=""
            render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                    <ThemedPicker ref={ref} selectedValue={value} onValueChange={onChange} placeholder={placeholder} options={options} />
                    {error && <ThemedText type="error">{error.message}</ThemedText>}
                </>
            )}
        />
    );
});