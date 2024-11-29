import React, { forwardRef } from 'react';
import { Controller, Control } from 'react-hook-form';
import { ThemedSlider } from './ThemedSlider';
import { Text, View } from 'react-native';
import { ThemedText } from '../ThemedText';

interface ControlledSliderProps {
    control: Control<any>;
    name: string;
    minimumValue?: number;
    maximumValue?: number;
    step?: number;
}

export const ControlledSlider = forwardRef<Text, ControlledSliderProps>(({
    control,
    name,
    minimumValue = 0,
    maximumValue = 10,
    step = 1,
}, ref) => {
    return (
        <Controller
            control={control}
            name={name}
            rules={{ required: true }}
            render={({ field: { onChange, value }, fieldState: { error } }) => (
                <>
                <ThemedSlider
                    ref={ref}
                    value={value || minimumValue}
                    minimumValue={minimumValue}
                    maximumValue={maximumValue}
                    step={step}
                    onValueChange={onChange}
                />
                <View style={{marginBottom: 10}}>
                    {error && <ThemedText type="error">{error.message}</ThemedText>}
                </View>
                </>
            )}
        />
    );
});
