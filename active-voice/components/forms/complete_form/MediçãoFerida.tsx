import { ControlledTextInput } from '@/components/inputs/ControlledTextInput'
import { TranscriptionBox } from '../../TranscriptionBox';
import { yupResolver } from '@hookform/resolvers/yup';
import { ThemedButton } from '../../ThemedButton';
import { useEffect, useState, useRef } from 'react';
import { ThemedText } from '../../ThemedText';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import React from 'react';
import { useIsFocused } from '@react-navigation/native';
import { FieldConfig } from '@/types/fieldConfig';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './Stylesheet.styles';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './utils';

// Data to be filled in the form
export interface MedicaoFeridaData {
    largura: string;
    comprimento: string;
    profundidade: string;
}

// Yup Schema for form validation
const MedicaoFeridaSchema = yup.object().shape({
    largura: yup.string().matches(/^\d+([.,]\d+)?$/, "Por favor, insira um número válido para a largura").required("A largura é obrigatória"),
    comprimento: yup.string().matches(/^\d+([.,]\d+)?$/, "Por favor, insira um número válido para o comprimento").required("O comprimento é obrigatório"),
    profundidade: yup.string().matches(/^\d+([.,]\d+)?$/, "Por favor, insira um número válido para a profundidade").required("A profundidade é obrigatória"),
});

// Data passed to this component
interface MedicaoFeridaFormProps {
    initData: MedicaoFeridaData; // The initial data sent to the form
    onSubmit: (data: MedicaoFeridaData) => void; // Callback to execute after submit
    onPrevious: (data: MedicaoFeridaData) => void; // Callback to execute when going back
    scrollToPosition: (yPosition: number) => void; // Function to scroll to given position in the page
}

// Schema for the field of the form
const fieldConfig: FieldConfig[] = [
    { name: 'largura', component: ControlledTextInput, label: 'Largura', props: { keyboardType: 'number-pad', placeholder: 'cm' }, isRequired: true },
    { name: 'comprimento', component: ControlledTextInput, label: 'Comprimento', props: { keyboardType: 'number-pad', placeholder: 'cm' }, isRequired: true },
    { name: 'profundidade', component: ControlledTextInput, label: 'Profundidade', props: { keyboardType: 'number-pad', placeholder: 'cm' }, isRequired: true }
];

// Schema for ChatGPT
const formRequestSchema = {
    type: "object",
    properties: {
        largura: { type: "number", description: "The width of the injury (horizontal)" },
        comprimento: { type: "number", description: "The length of the injury (vertical)" },
        profundidade: { type: "number", description: "The depth of the injury (vertical)" },
    },
    required: []
}

export function MedicaoFeridaForm({ initData, onSubmit, onPrevious, scrollToPosition}: MedicaoFeridaFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null); // Ref to the transcriptionBox
    const [transcriptionText, setTranscriptionText] = useState('');
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition(); 
    const { refs, getRef } = useDynamicRefs(); 
    const isFocused = useIsFocused(); // To know if this component is focused
    
    const { control, handleSubmit, setValue, getValues, trigger, watch } = useForm<MedicaoFeridaData>({ // Manages the entire form
        resolver: yupResolver(MedicaoFeridaSchema), // field validation
        defaultValues: initData, // default values from initData
    });

    const setFormValue = (key: string, value: any) => {
        setValue(key as keyof MedicaoFeridaData, value.toString());
    }

    /* HANDLERS */

    const handleAdvance = () => {
        const onError = async () => {
            await speakAndScrollMissingFields(fieldConfig, getValues, refs, scrollToPosition, speakMissingFields);
        }

        handleSubmit(onSubmit, onError)();
    };

    const handleGoBack = () => onPrevious(getValues()); // Send the filled form values when going back
    const handleShowTranscription = () => transcriptionBoxRef.current?.toggleExpand(); // Toggle on/off transcription box

    const handleHelpAssistant = async () => { // Called when voice assistant is activated
        await processFormDataWithAssistant(getValues(), formRequestSchema, speakMessage);
    };
    

    const handleStartRecording = async () => {
        const result = await processStartRecording(formRequestSchema, fieldConfig, setFormValue, getValues, refs, scrollToPosition, setTranscriptionText);

        if (result) {
            const data = result.data ?? {};
            Object.keys(data).forEach(key => trigger(key as keyof MedicaoFeridaData)); // To trigger resolver errors 
        }
    };

    /* Use effects */ 

    useEffect(() => { // Set commands when this form is focused
        if (isFocused) {
            setCommands([
                { regex: /\b(começa(?:r)?|grava(?:r)?|inicia(?:r)?)\b/i, action: "startRecording", handler: handleStartRecording },
                { regex: /\b(avança(?:r)?|próximo|submete(?:r)?)\b/i, action: "advance", handler: handleAdvance },
                { regex: /\b(?:mostra(?:r)?|exib(?:ir|e))(?: a)? transcrição\b/i, action: "showTranscription", handler: handleShowTranscription },
                { regex: /\b(recu(?:ar)?|volta(?:r)?|retroceder|volta(?:r)? atrás)\b/i, action: "goBack", handler: handleGoBack },
                { regex: /\b(?:ajuda|assistente)\b/i, action: "helpAssistant", handler: handleHelpAssistant },
                { regex: /\b(?:para|stop)\b/i, action: "stopManualInstructions", handler: stopSpeaking },
            ]);
        }
    }, [isFocused]);

    return (
        <>
            <ThemedText type="title" style={styles.title}>Medição da Ferida (COMPLETO)</ThemedText>
            {fieldConfig.map(({ name, component: Component, label, props, isConditional, dependsOn, isRequired }) => {
                const shouldRender = !isConditional || (dependsOn && watch(dependsOn.field as keyof MedicaoFeridaData) === dependsOn.value);
                if (!shouldRender) return null;

                return (
                    <React.Fragment key={name}>
                        <ThemedText>{label}</ThemedText>
                        <Component control={control} name={name} {...props} ref={isRequired ? getRef(name) : null}/>
                    </React.Fragment>
                );
            })}
            <ThemedButton title="Avançar" onPress={handleAdvance} />
            <ThemedButton title="Voltar" variant='secondary' onPress={handleGoBack} />
            { isSpeaking && <ThemedButton title="Parar" onPress={stopSpeaking} style={styles.loading} /> }
            <TranscriptionBox ref={transcriptionBoxRef} text={transcriptionText} />
        </>
    );
}