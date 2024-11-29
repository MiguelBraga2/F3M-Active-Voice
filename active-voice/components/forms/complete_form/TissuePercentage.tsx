import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { ControlledSlider } from '../../inputs/ControlledSlider';
import { TranscriptionBox } from '../../TranscriptionBox';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState, useRef } from 'react';
import { ThemedButton } from '../../ThemedButton';
import { ThemedText } from '../../ThemedText';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import React from 'react';
import { useIsFocused } from '@react-navigation/native';
import { FieldConfig } from '@/types/fieldConfig';
import { useLanguage } from '@/hooks/useLanguage';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import styles from './Stylesheet.styles';
import { processFormDataWithAssistant, processStartRecording } from './utils';

export interface TissuesPercentageData {
    tecidoGranulação: number;
    tecidoDesvitalizado: number;
    tecidoNecrosado: number;
}

interface TissuesPercentageFormProps {
    initData: TissuesPercentageData;
    onSubmit: (data: TissuesPercentageData) => void;
    onPrevious: (data: TissuesPercentageData) => void;
    scrollToPosition: (yPosition: number) => void;
}

const fieldConfig: FieldConfig[] = [
    { name: 'tecidoGranulação', component: ControlledSlider, label: 'Tecido granulação', props: { minimumValue: 0, maximumValue: 100, step: 10 }, isRequired: true },
    { name: 'tecidoDesvitalizado', component: ControlledSlider, label: 'Tecido Desvitalizado', props: { minimumValue: 0, maximumValue: 100, step: 10 }, isRequired: true },
    { name: 'tecidoNecrosado', component: ControlledSlider, label: 'Tecido Necrosado', props: { minimumValue: 0, maximumValue: 100, step: 10 }, isRequired: true }
];

const formRequestSchema = {
    type: "object",
    properties: {
        tecidoGranulação: { type: "number", description: "The tissue granulation (between 0 and 100)" },
        tecidoDesvitalizado: { type: "number", description: "The tissue desvitalization (between 0 and 100)" },
        tecidoNecrosado: { type: "number", description: "The tissue necrotization (between 0 and 100)" },
    },
    required: []
}

export function TissuePercentageForm({ initData, onSubmit, onPrevious, scrollToPosition}: TissuesPercentageFormProps) {    
    const tissuesPercentageSchema = yup.object().shape({
        tecidoGranulação: yup.number().min(0, "O valor deve ser entre 0 e 100").max(100, "O valor deve ser entre 0 e 100").required(),
        tecidoDesvitalizado: yup.number().min(0, "O valor deve ser entre 0 e 100").max(100, "O valor deve ser entre 0 e 100").required(),
        tecidoNecrosado: yup.number().min(0, "O valor deve ser entre 0 e 100").max(100, "O valor deve ser entre 0 e 100").required(),
    }).test("sum-100", "A soma dos valores deve ser exatamente 100", (values, context) => { 
            const sum = (values.tecidoGranulação ?? 0) + (values.tecidoDesvitalizado ?? 0) + (values.tecidoNecrosado ?? 0);
            if (sum !== 100) {
                return context.createError({
                    path: "tecidoNecrosado",
                    message: "A soma dos valores deve ser exatamente 100",
                });
            }
            return true;
        }
    );

    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { setCommands,speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const { refs, getRef } = useDynamicRefs();
    const isFocused = useIsFocused();
    
    const { control, handleSubmit, setValue, getValues, trigger, watch } = useForm<TissuesPercentageData>({
        resolver: yupResolver(tissuesPercentageSchema),
        defaultValues: {
            tecidoGranulação: initData.tecidoGranulação ?? 0,
            tecidoDesvitalizado: initData.tecidoDesvitalizado ?? 0,
            tecidoNecrosado: initData.tecidoNecrosado ?? 0,
        },
    });

    const setFormValue = (key: string, value: any) => {
        setValue(key as keyof TissuesPercentageData, value);
    }

    const handleAdvance = () => {
        const onError = async (errors: any) => {
            if (errors.tecidoNecrosado) await speakMessage(errors.tecidoNecrosado?.message);
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
            Object.keys(data).forEach(key => trigger(key as keyof TissuesPercentageData)); // To trigger resolver errors 
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
            <ThemedText type="title" style={styles.title}>Percentagem de Tecidos (COMPLETO)</ThemedText>
            {fieldConfig.map(({ name, component: Component, label, props, isConditional, dependsOn, isRequired }) => {
                const shouldRender = !isConditional || (dependsOn && watch(dependsOn.field as keyof TissuesPercentageData) === dependsOn.value);
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