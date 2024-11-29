import DateTimePicker from '@react-native-community/datetimepicker';
import { TouchableOpacity, StyleSheet, View } from 'react-native';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedView } from '../views/ThemedView';
import { ThemedText } from './../ThemedText';
import React, { forwardRef, useState } from 'react';
import { format, parse } from 'date-fns';
import { Text } from 'react-native';


interface ThemedDatePickerProps {
    date: string;
    placeholder?: string;
    onDateChange: (date: String) => void;
}

export const ThemedDatePicker = forwardRef<Text, ThemedDatePickerProps>(({ date, placeholder = "Select Date", onDateChange }, ref) => {
    const [showPicker, setShowPicker] = useState(false);
    const placeholderColor = useThemeColor({}, 'placeholder');
    const textColor = useThemeColor({}, 'text');

    const handleDateChange = (event: any, selectedDate?: Date) => {
        setShowPicker(false);
        if (selectedDate) {
            const formattedDate = format(selectedDate, 'dd/MM/yyyy'); 
            onDateChange(formattedDate);
        }
    };

    return (
        <ThemedView style={styles.container}>
            <TouchableOpacity
                style={[styles.input, { borderColor: placeholderColor }]}
                onPress={() => setShowPicker(true)}
                activeOpacity={0.7}
            >
                <ThemedText ref={ref} style={[styles.placeholder, { color: date ? textColor : placeholderColor }]}>
                    {date ? date : placeholder}
                </ThemedText>
            </TouchableOpacity>
            {showPicker && (
                <DateTimePicker
                    value={date ? parse(date, 'dd/MM/yyyy', new Date()) : new Date()}
                    mode="date"
                    display="default"
                    onChange={handleDateChange}
                />
            )}
        </ThemedView>
    );
});

const styles = StyleSheet.create({
    container: {
        marginTop: 5,
        marginBottom: 10,
    },
    input: {
        height: 40,
        borderWidth: 1,
        paddingHorizontal: 10,
        borderRadius: 5,
        fontSize: 16,
        justifyContent: 'center',
    },
    placeholder: {
        fontSize: 16,
    },
});