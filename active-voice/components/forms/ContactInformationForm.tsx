import { ControlledTextInput } from '../inputs/ControlledTextInput';
import { TranscriptionBox } from '../TranscriptionBox';
import { yupResolver } from '@hookform/resolvers/yup';
import { ThemedButton } from '../ThemedButton';
import { useEffect, useRef, useState } from 'react';
import { ThemedText } from '../ThemedText';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import * as yup from 'yup';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import React from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import { FieldConfig } from '@/types/fieldConfig';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './complete_form/utils';


export interface ContactInformationData {
    email: string;
    phone: string;
    city: string;
}

const contactSchema = yup.object().shape({
    email: yup.string().email("Email inválido").required("O email é obrigatório"),
    phone: yup.string().matches(/^\+?[1-9][0-9]{1,14}$/, "Telefone inválido").required("O telefone é obrigatório"),
    city: yup.string().min(2, "A cidade deve ter pelo menos dois caracteres").required("A cidade é obrigatória"),
});

interface ContactInformationFormProps {
    initData: ContactInformationData;
    onSubmit: (data: ContactInformationData) => void;
    onPrevious: (data: ContactInformationData) => void;
    scrollToPosition: (yPosition: number) => void;
}

const fieldConfig: FieldConfig[] = [
    { name: 'phone', label: 'Telefone', component: ControlledTextInput, props: { keyboardType: 'phone-pad', placeholder: 'Introduza o seu número de telefone' }, isRequired: true },
    { name: 'email', label: 'Email', component: ControlledTextInput, props: { keyboardType: 'email-address', placeholder: 'Introduza o seu endereço de email' }, isRequired: true },
    { name: 'city', label: 'Cidade', component: ControlledTextInput, props: { placeholder: 'Introduza a sua cidade' }, isRequired: true },
];

const formRequestSchema = {
    type: "object",
    properties: {
        city: { type: "string", description: "The city where the person lives" },
        phone: { type: "string", description: "The person's telephone number, can be a number with or without the '+' symbol" },
        email: { type: "string", description: "The person's email address" },
    },
    required: []
};


export function ContactInformationForm({ initData, onSubmit, onPrevious, scrollToPosition }: ContactInformationFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { refs, getRef } = useDynamicRefs();
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const isFocused = useIsFocused();
    
    const { control, handleSubmit, setValue, getValues, trigger } = useForm<ContactInformationData>({
        resolver: yupResolver(contactSchema),
        defaultValues: initData,
    });

    const setFormValue = (key: string, value: any) => {
        setValue(key as keyof ContactInformationData, value);
    }

    const handleAdvance = async () => {
        const onError = async () => {
            await speakAndScrollMissingFields(fieldConfig, getValues, refs, scrollToPosition, speakMissingFields);
        }
        handleSubmit(onSubmit, onError)();
    };

    const handleGoBack = () => onPrevious(getValues());
    const handleShowTranscription = () => transcriptionBoxRef.current?.toggleExpand();

    const handleStartRecording = async () => {
        const result = await processStartRecording(formRequestSchema, fieldConfig, setFormValue, getValues, refs, scrollToPosition, setTranscriptionText);

        if (result) {
            const data = result.data ?? {};
            Object.keys(data).forEach(key => trigger(key as keyof ContactInformationData)); // To trigger resolver errors 
        }
    };

    const handleHelpAssistant = async () => {
        await processFormDataWithAssistant(getValues(), formRequestSchema, speakMessage);
    };

    useEffect(() => {
        if (isFocused) {
            setCommands([
                { regex: /\b(começa(?:r)?|grava(?:r)?|inicia(?:r)?)\b/i, action: "startRecording", handler: handleStartRecording },
                { regex: /\b(avança(?:r)?|próximo|submete(?:r)?)\b/i, action: "advance", handler: handleAdvance },
                { regex: /\b(?:mostra(?:r)?|exib(?:ir|e))(?: a)? transcrição\b/i, action: "showTranscription", handler: handleShowTranscription },
                { regex: /\b(recua(?:r)?|volta(?:r)?|retroceder|volta(?:r)? atrás)\b/i, action: "goBack", handler: handleGoBack },
                { regex: /\b(?:ajuda|assistente)\b/i, action: "helpAssistant", handler: handleHelpAssistant },
            ]);
        }
    }, [isFocused]);  

    return (
        <>
            <ThemedText type="title" style={styles.title}>Contact Information Form</ThemedText>
            {fieldConfig.map(({ name, label, component: Component, props, isRequired }) => (
                <React.Fragment key={name}>
                    <ThemedText>{label}</ThemedText>
                    <Component {...props} name={name} control={control} ref={isRequired ? getRef(name) : undefined}/>
                </React.Fragment>
            ))}
            <ThemedButton title="Próximo" onPress={handleAdvance} />
            <ThemedButton title="Voltar" variant='secondary' onPress={handleGoBack} />
            { isSpeaking && <ThemedButton title="Parar" onPress={stopSpeaking} style={styles.loading} /> }
            <TranscriptionBox ref={transcriptionBoxRef} text={transcriptionText} />
        </>
    );
}

const styles = StyleSheet.create({
    title: {
        textAlign: 'center',
        marginBottom: 20,
    },
    loading: {
        marginTop: 10,
    },
});