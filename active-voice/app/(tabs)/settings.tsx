import React from 'react';
import { Image, StyleSheet } from 'react-native';
import { Picker } from '@react-native-picker/picker';
import ParallaxScrollView from '@/components/views/ParallaxScrollView';
import { ThemedView } from '@/components/views/ThemedView';
import { useLanguage } from '../../hooks/useLanguage';
import { ThemedText } from '@/components/ThemedText';

export default function Settings() {
    const {language, setLanguage} = useLanguage();

    return (
        <ParallaxScrollView
            headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
            headerImage={
                <Image
                    source={require('@/assets/images/settings.png')}
                    style={styles.settingsLogo}
                />
            }
        >
            <ThemedView style={styles.container}>
                <ThemedText style={styles.title}>Seleciona a linguagem</ThemedText>
                <ThemedView style={styles.pickerContainer}>
                    <Picker
                        selectedValue={language}
                        style={styles.picker}
                        onValueChange={(itemValue: any) => setLanguage(itemValue)}
                    >
                        <Picker.Item label="Inglês" value="en-US" />
                        <Picker.Item label="Português" value="pt-BR" />
                    </Picker>
                </ThemedView>
            </ThemedView>
        </ParallaxScrollView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    form: {
        width: '90%',
        maxWidth: 600
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 20,
    },    
    pickerContainer: {
        width: '80%',
        marginBottom: 30,
    },    
    picker: {
        height: 50,
        width: '100%',
        backgroundColor: '#e8e9eb', 
        color: '#000000',
    },
    selectedLanguage: {
        marginTop: 20,
        fontSize: 16,
        color: '#333',
    },
    settingsLogo: {
        flex: 1,
        width: '100%',
        height: '100%',
        resizeMode: 'contain',
        position: 'absolute',
    }
});