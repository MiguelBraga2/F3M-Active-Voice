import { ControlledRadioGroup } from '../../inputs/ControlledRadioGroup';
import { ControlledTextInput } from '../../inputs/ControlledTextInput';
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
import { useIsFocused } from '@react-navigation/native';
import { FieldConfig } from '@/types/fieldConfig';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import styles from './Stylesheet.styles';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './utils';

export interface FotoData {
    observadosRealidade: string;
    alteraçõesRealidade?: string;
    observações?: string;
}

const fotoSchema = yup.object().shape({
    observadosRealidade: yup.string().required("Indique se os tecido observados correspondem à realidade"),
    alteraçõesRealidade: yup.string(),
    observações: yup.string(),
});

interface FotoFormProps {
    initData: FotoData;
    onSubmit: (data: FotoData) => void;
    onPrevious: (data: FotoData) => void;
    scrollToPosition: (yPosition: number) => void; 
}

const options = [
    { label: 'Não', value: 'no' },
    { label: 'Sim', value: 'yes' },
];

const fieldConfig: FieldConfig[] = [
    { name: 'observadosRealidade', component: ControlledRadioGroup, label: 'Os tecidos no leito da ferida observados na imagem correspondem aos observados na realidade?', props: { options: options }, isRequired: true },
    { name: 'alteraçõesRealidade', component: ControlledRadioGroup, label: 'As alterações de pele perilesional observadas na imagem correspondem às observadas na realidade?', props: { options: options }, isRequired: false },
    { name: 'observações', component: ControlledTextInput, label: 'Observações', props: { placeholder: 'Introduza observações que considere relevantes', multiline: true, numberOfLines: 3 }, isRequired: false }
];

const formRequestSchema = {
    type: "object",
    properties: {
        observadosRealidade: { type: "string", enum: options.map(option => option.value) },
        alteraçõesRealidade: { type: "string", enum: options.map(option => option.value) },
        observações: { type: "string", description: "Observations relative to the injury" },
    },
    required: []
}

export function FotoForm({ initData, onSubmit, onPrevious, scrollToPosition }: FotoFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const { refs, getRef } = useDynamicRefs();
    const isFocused = useIsFocused();
    
    const { control, handleSubmit, setValue, getValues, trigger, watch } = useForm<FotoData>({
        resolver: yupResolver(fotoSchema),
        defaultValues: initData,
    });

    const setFormValue = (key: string, value: any) => {
        setValue(key as keyof FotoData, value);
    }

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
            Object.keys(data).forEach(key => trigger(key as keyof FotoData)); // To trigger resolver errors 
        }
    };

    return (
        <>
            <ThemedText type="title" style={styles.title}>Detalhes da Ferida (COMPLETO)</ThemedText>
            {fieldConfig.map(({ name, component: Component, label, props, isConditional, dependsOn, isRequired }) => {
                const shouldRender = !isConditional || (dependsOn && watch(dependsOn.field as keyof FotoData) === dependsOn.value);
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