import { ControlledRadioGroup } from '../../inputs/ControlledRadioGroup';
import { TranscriptionBox } from '../../TranscriptionBox';
import { yupResolver } from '@hookform/resolvers/yup';
import { ThemedButton } from '../../ThemedButton';
import { useEffect, useState, useRef } from 'react';
import { ThemedText } from '../../ThemedText';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useLanguage } from '@/hooks/useLanguage';
import React from 'react';
import { scrollToFirstMissingField } from '@/hooks/useScrollToFirstMissingField';
import { useIsFocused } from '@react-navigation/native';
import { FieldConfig } from '@/types/fieldConfig';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import styles from './Stylesheet.styles';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './utils';

export interface CleaningIntermData {
    tecidoDesvitalizadoOuNecrosado: string;
    infeção: string;
    quantExsudado: string;
    maceraçãoPele: string;
}

const cleaningIntermSchema = yup.object().shape({
    tecidoDesvitalizadoOuNecrosado: yup.string().required("Indique se o tecido foi desvitalizado ou necrosado"),
    infeção: yup.string().required("Indique se ocorreu infeção"),
    quantExsudado: yup.string().required("Indique a quantidade de exsudado"),
    maceraçãoPele: yup.string().required("Indique se existe maceração da pele perilesional"),
});

interface CleaningIntermFormProps {
    initData: CleaningIntermData;
    onSubmit: (data: CleaningIntermData) => void;
    onPrevious: (data: CleaningIntermData) => void;
    scrollToPosition: (yPosition: number) => void;
}

const options = [
    { label: 'Não', value: 'no' },
    { label: 'Sim', value: 'yes' },
];

const quantExsudadoOptions = [
    { label: 'Ausente', value: 'ausente'},
    { label: 'Leve', value: 'leve'},
    { label: 'Moderado', value: 'moderado'},
    { label: 'Elevada', value: 'elevada'},
]

const fieldConfig: FieldConfig[] = [
    { name: 'tecidoDesvitalizadoOuNecrosado', component: ControlledRadioGroup, label: 'Tecido Desvitalizado ou Necrosado?', props: { options: options }, isRequired: true },
    { name: 'infeção', component: ControlledRadioGroup, label: 'Infeção?', props: { options: options }, isRequired: true },
    { name: 'quantExsudado', component: ControlledRadioGroup, label: 'Quantidade de exsudado?', props: { options: quantExsudadoOptions }, isRequired: true },
    { name: 'maceraçãoPele', component: ControlledRadioGroup, label: 'Maceração da Pele Perilesional?', props: { options: options }, isRequired: true }
];

const formRequestSchema = {
    type: "object",
    properties: {
        tecidoDesvitalizadoOuNecrosado: {type: "string", enum: options.map(option => option.value)},
        infeção: {type: "string", enum: options.map(option => option.value)},
        quantExsudado: {type: "string", enum: quantExsudadoOptions.map(option => option.value)},
        maceraçãoPele: {type: "string", enum: options.map(option => option.value)},
    },
    required: []
}

export function CleaningIntermForm({ initData, onSubmit, onPrevious, scrollToPosition}: CleaningIntermFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const { refs, getRef } = useDynamicRefs();
    const isFocused = useIsFocused();

    const { control, handleSubmit, setValue, getValues, trigger, watch } = useForm<CleaningIntermData>({
        resolver: yupResolver(cleaningIntermSchema),
        defaultValues: initData,
    });

    const setFormValue = (key: string, value: any) => {
        setValue(key as keyof CleaningIntermData, value);
    }

    const handleAdvance = () => {
        const onError = async () => {
            await speakAndScrollMissingFields(fieldConfig, getValues, refs, scrollToPosition, speakMissingFields);
        }
        handleSubmit(onSubmit, onError)();
    };

    const handleGoBack = () => onPrevious(getValues());
    const handleShowTranscription = () => transcriptionBoxRef.current?.toggleExpand();

    const handleHelpAssistant = async () => { // Called when voice assistant is activated
        await processFormDataWithAssistant(getValues(), formRequestSchema, speakMessage);
    };

    const handleStartRecording = async () => {
        const result = await processStartRecording(formRequestSchema, fieldConfig, setFormValue, getValues, refs, scrollToPosition, setTranscriptionText);

        if (result) {
            const data = result.data ?? {};
            Object.keys(data).forEach(key => trigger(key as keyof CleaningIntermData)); // To trigger resolver errors 
        }
    };

    useEffect(() => {
        if (isFocused) {
            setCommands([
                { regex: /\b(começa(?:r)?|grava(?:r)?|inicia(?:r)?)\b/i, action: "startRecording", handler: handleStartRecording },
                { regex: /\b(avança(?:r)?|próximo|submete(?:r)?)\b/i, action: "advance", handler: handleAdvance },
                { regex: /\b(?:mostra(?:r)?|exib(?:ir|e))(?: a)? transcrição\b/i, action: "showTranscription", handler: handleShowTranscription },
                { regex: /\b(recu(?:ar)?|volta(?:r)?|retroceder|volta(?:r)? atrás)\b/i, action: "goBack", handler: handleGoBack },
                { regex: /\b(?:ajuda|assistente)\b/i, action: "helpAssistant", handler: handleHelpAssistant },
            ]);
        }
    }, [isFocused]);

    return (
        <>
            <ThemedText type="title" style={styles.title}>Detalhes da Ferida (INTERM)</ThemedText>
            {fieldConfig.map(({ name, component: Component, label, props, isConditional, dependsOn, isRequired }) => {
                const shouldRender = !isConditional || (dependsOn && watch(dependsOn.field as keyof CleaningIntermData) === dependsOn.value);
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