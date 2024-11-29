import { useThemeColor } from '@/hooks/useThemeColor';
import Slider from '@react-native-community/slider';
import { ThemedView } from '../views/ThemedView';
import { StyleSheet, Text, View } from 'react-native'; // Importando View
import React, { forwardRef } from 'react';
import { ThemedText } from '../ThemedText';

interface ThemedSliderProps {
    value: number;
    minimumValue?: number;
    maximumValue?: number;
    step?: number;
    onValueChange: (value: number) => void;
    minimumTrackColor?: string;
    maximumTrackColor?: string;
    thumbColor?: string;
}

export const ThemedSlider = forwardRef<Text, ThemedSliderProps>(({
    value,
    minimumValue = 0,
    maximumValue = 10,
    step = 1,
    onValueChange,
    minimumTrackColor,
    maximumTrackColor,
    thumbColor,
},  ref) => {
    const defaultMinimumTrackColor = useThemeColor({}, 'primary');
    const defaultMaximumTrackColor = useThemeColor({}, 'placeholder');
    const defaultThumbColor = useThemeColor({}, 'accent');

    return (
        <ThemedView style={[styles.container, {borderColor: defaultMaximumTrackColor}]}>
            <View style={styles.rowContainer}>
                <Slider
                    style={styles.slider}
                    minimumValue={minimumValue}
                    maximumValue={maximumValue}
                    step={step}
                    value={value}
                    onValueChange={onValueChange}
                    minimumTrackTintColor={minimumTrackColor || defaultMinimumTrackColor}
                    maximumTrackTintColor={maximumTrackColor || defaultMaximumTrackColor}
                    thumbTintColor={thumbColor || defaultThumbColor}
                />
                <ThemedText ref={ref} style={styles.valueText}>{value}</ThemedText>
            </View>
        </ThemedView>
    );
});

const styles = StyleSheet.create({
    container: {
        marginTop: 5,
        width: '100%',
        height: 45,
        borderWidth: 1,
        borderRadius: 5,
    },
    rowContainer: {
        padding: 10,
        flexDirection: 'row',
        alignItems: 'center', 
        justifyContent: 'space-between', 
        alignContent: 'center', 
        width: '100%',
    },
    slider: {
        flex: 1, 
        backgroundColor: 'transparent',
    },
    valueText: {
        marginRight: 5, 
    },
});
