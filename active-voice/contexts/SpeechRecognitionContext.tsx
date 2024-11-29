import { useLanguage } from '@/hooks/useLanguage';
import { ExpoSpeechRecognitionModule, useSpeechRecognitionEvent } from 'expo-speech-recognition';
import React, { createContext, useState, useRef, useEffect, useCallback, ReactNode } from 'react';
import Tts from 'react-native-tts';
import { Platform } from 'react-native';

export interface CommandPattern {
    regex: RegExp;
    action: string;
    handler: () => Promise<void> | void;
}

interface SpeechRecognitionHandlerProps {
    children: ReactNode;
}

interface SpeechRecognitionContextType {
    startRecording: () => void;
    stopRecording: () => void;
    setCommands: React.Dispatch<React.SetStateAction<CommandPattern[]>>;
    requestPermissions: () => Promise<void>;
    speakMessage: (message: string) => Promise<void>;
    speakMissingFields: (missingFields: string[]) => Promise<void>;
    stopSpeaking: () => void;
    isSpeaking: boolean;
}

const messages: Record<string, { missingFields: (fields: string) => string; singleMissingField: (field: string) => string }> = {
    "pt-PT": {
        missingFields: (fields: string) => `Os campos ${fields} não foram preenchidos.`,
        singleMissingField: (field: string) => `O campo ${field} não foi preenchido.`,
    },
    "pt-BR": {
        missingFields: (fields: string) => `Os campos ${fields} não foram preenchidos.`,
        singleMissingField: (field: string) => `O campo ${field} não foi preenchido.`,
    },
    "en-US": {
        missingFields: (fields: string) => `The fields ${fields} were not filled.`,
        singleMissingField: (field: string) => `The field ${field} was not filled.`,
    },
};

export const SpeechRecognitionContext = createContext<SpeechRecognitionContextType | undefined>(undefined);

export function SpeechRecognitionProvider({ children }: SpeechRecognitionHandlerProps) {
    const [commands, setCommands] = useState<CommandPattern[]>([]);
    const [isSpeaking, setIsSpeaking] = useState(false);
    const commandsRef = useRef(commands);
    const { language } = useLanguage();
    const languageRef = useRef(language);
    const [premissionsGranted, setPremissionsGranted] = useState(false);
    const premissionsGrantedRef = useRef(premissionsGranted);

    useEffect(() => {
        commandsRef.current = commands;
    }, [commands]);

    useEffect(() => {
        languageRef.current = language;
    }, [language]);

    async function identifyVoiceCommand(commandPatterns: CommandPattern[], command: string): Promise<CommandPattern | null> {
        for (const pattern of commandPatterns) {
            if (pattern.regex.test(command)) {
                console.log("Interpreted command locally:", pattern.action);
                return pattern;
            }
        }
        return null;
    }

    Tts.setDefaultLanguage('pt-PT');
    const getMessages = () => messages["pt-PT"];

    const speakMissingFields = async (missingFields: string[]) => {
        const localizedMessages = getMessages();

        if (missingFields.length > 1) {
            const missingFieldsText = missingFields.join(", ");
            await speakMessage(localizedMessages.missingFields(missingFieldsText));
        } else if (missingFields.length === 1) {
            await speakMessage(localizedMessages.singleMissingField(missingFields[0]));
        }
    };

    const speakMessage = async (message: string): Promise<void> => {
        return new Promise((resolve, reject) => {
            setIsSpeaking(true);
            // Configura os listeners para eventos de início e término do TTS
            // Cria as referências dos listeners
            const onSpeakFinish = () => {
                // Remove o listener quando terminar
                Tts.removeAllListeners('tts-finish');
                setIsSpeaking(false);
                resolve();
            };

            const onSpeakError = (error: any) => {
                // Remove o listener em caso de erro
                Tts.removeAllListeners('tts-error');
                setIsSpeaking(false);
                reject(error);
            };

            // Adiciona os listeners usando addListener
            Tts.addEventListener('tts-finish', onSpeakFinish);
            Tts.addEventListener('tts-error', onSpeakError);
            Tts.addEventListener('tts-cancel', onSpeakFinish);

            // Inicia a fala
            Tts.speak(message);
        });
    };

    const stopSpeaking = async () => {
        await Tts.stop();
    }

    useSpeechRecognitionEvent('start', () => console.log('Started'));
    useSpeechRecognitionEvent('error', (event) => {
        console.log('error code:', event.error, 'error message:', event.message)
        if (Platform.OS === 'android' && Platform.Version < 33 && event.error === 'no-speech') {
            ExpoSpeechRecognitionModule.start({ lang: language});
        }
    });
    useSpeechRecognitionEvent('end', () => console.log('Ended'));
    useSpeechRecognitionEvent('result', async (event) => {
        console.log('Result:', event.results[0]?.transcript);
        if (event.isFinal === false) return;

        const text = event.results[0]?.transcript;
        const matchedCommand = await identifyVoiceCommand(commandsRef.current, text);

        if (matchedCommand) {
            ExpoSpeechRecognitionModule.abort();
            await matchedCommand.handler();
            startRecording();
        } else if (Platform.OS === 'android' && Platform.Version < 33)  {
            ExpoSpeechRecognitionModule.start({ lang: language });
        }
    });

    const requestPermissions = useCallback(async () => {
        if (premissionsGranted) return;
        const result = await ExpoSpeechRecognitionModule.requestPermissionsAsync();
        if (result.granted) {
            setPremissionsGranted(true);
            premissionsGrantedRef.current = true;
        } else {
            console.warn('Permissions not granted', result);
        }
    }, [premissionsGranted]);

    const startRecording = useCallback(async () => {
        if (!premissionsGrantedRef.current) {
            console.warn('Permissions have not been granted');
            return;
        }

        if (Platform.OS === 'ios') {
            ExpoSpeechRecognitionModule.start({ lang: language, continuous: true, requiresOnDeviceRecognition: true, contextualStrings: ["perilesional"] });
            return;
        }

        if (Platform.OS !== 'android') return;

        if (Platform.Version < 33)  {
            ExpoSpeechRecognitionModule.start({ lang: language});
            return;
        }
        
        if (!ExpoSpeechRecognitionModule.supportsOnDeviceRecognition()) {
            ExpoSpeechRecognitionModule.start({ lang: language, continuous: true });
            return;
        }

        const locale = await ExpoSpeechRecognitionModule.getSupportedLocales({});
        if (locale.installedLocales.includes(languageRef.current)) {
            ExpoSpeechRecognitionModule.start({ lang: languageRef.current, continuous: true, requiresOnDeviceRecognition: true });
            return;
        }

        if (locale.locales.includes(languageRef.current)) {
            console.log('Language not installed, you can install it');
        } 

        ExpoSpeechRecognitionModule.start({ lang: languageRef.current, continuous: true });

    }, [premissionsGranted, language]);

    const stopRecording = useCallback(() => {
        ExpoSpeechRecognitionModule.abort();
    }, []);

    return (
        <SpeechRecognitionContext.Provider value={{ startRecording, stopRecording, requestPermissions, setCommands, speakMessage, speakMissingFields, stopSpeaking, isSpeaking }}>
            {children}
        </SpeechRecognitionContext.Provider>
    );
}