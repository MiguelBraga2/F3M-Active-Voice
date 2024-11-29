import React, { forwardRef } from "react"
import { Controller, Control } from "react-hook-form"
import { ThemedTextInput } from "./ThemedTextInput";
import { KeyboardTypeOptions, StyleSheet, TextInput, View } from "react-native";
import { ThemedText } from "../ThemedText";
import { ThemedView } from "../views/ThemedView";

interface ControlledTextInputProps {
    control: Control<any>; 
    name: string;
    rules?: object;
    placeholder: string;
    keyboardType?: KeyboardTypeOptions;
    multiline?: boolean;
    numberOfLines?: number;
}

export const ControlledTextInput = forwardRef<TextInput, ControlledTextInputProps> (({ 
    control, 
    name, 
    rules,
    placeholder, 
    keyboardType = "default",
    multiline,
    numberOfLines,
    ...textInputProps 
    }, ref) => {
    return (
        <Controller
            control={control}
            name={name}
            rules={rules}
            defaultValue=""
            render={({ 
                field: { onChange, onBlur, value }, 
                fieldState : { error } 
            }) => (
                <ThemedView style={styles.input}>
                    <ThemedTextInput
                        ref={ref}
                        onBlur={onBlur}
                        onChangeText={onChange}
                        value={value}
                        placeholder={placeholder}
                        keyboardType={keyboardType}
                        multiline={multiline}
                        numberOfLines={numberOfLines}
                        {...textInputProps}
                    />
                    {error && <ThemedText type="error">{error.message}</ThemedText>}
                </ThemedView>
            )}
        />
    );
});

const styles = StyleSheet.create({
    input: {
        marginTop: 5,
        marginBottom: 10,
    }
});