import { TranscriptionBox } from '../../TranscriptionBox';
import { yupResolver } from '@hookform/resolvers/yup';
import BodyPartSelector from '../../BodyPartSelector';
import { ThemedButton } from '../../ThemedButton';
import { useEffect, useRef, useState } from 'react';
import { ThemedText } from '../../ThemedText';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { ControlledRadioGroup } from '../../inputs/ControlledRadioGroup';
import { ControlledTextInput } from '../../inputs/ControlledTextInput';
import { ControlledCheckboxGroup } from '../../inputs/ControlledCheckboxGroup';
import React from 'react';
import { useIsFocused } from '@react-navigation/native';
import { FieldConfig } from '@/types/fieldConfig';
import { painLocationOptions } from '../painLocation/painLocationOptins';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import { useLanguage } from '@/hooks/useLanguage';
import styles from './Stylesheet.styles';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './utils';

export interface LocationData {
    painLocation: string;
    observations?: string;
    boneOrMucosa: string;
    conditions?: string[];  // Only if boneOrMucosa is "no"
}

const locationSchema = yup.object().shape({
    painLocation: yup.string().required("A localização da dor é obrigatória"),
    observations: yup.string(),
    boneOrMucosa: yup.string().required("A resposta sobre a proeminência é obrigatória"),
    conditions: yup.array().of(yup.string().required()).min(1, "Pelo menos uma condição deve ser selecionada").when('boneOrMucosa', {
        is: (boneOrMucosa: string) => boneOrMucosa === 'yes',
        then: schema => schema.required("Selecione pelo menos uma condição"),
    }),
});

interface LocationFormProps {
    initData: LocationData;
    onSubmit: (data: LocationData) => void;
    onPrevious: (data: LocationData) => void;
    scrollToPosition: (yPosition: number) => void;
}

const options = [
    { label: 'Não', value: 'no' },
    { label: 'Sim', value: 'yes' },
];

const conditionsOptions = [
    'Imobilidade (parcial ou total)',
    'Mucosa',
    'Lesão limitada a uma localização',
    'Nenhuma das anteriores'
];

export const fieldConfig: FieldConfig[] = [
    { name: 'observations', component: ControlledTextInput, label: 'Observações', props: { placeholder: 'Introduza observações que considere relevantes', keyboardType: 'default', multiline: true, numberOfLines: 3 }, isRequired: false },
    { name: 'boneOrMucosa', component: ControlledRadioGroup, label: 'A ferida está numa proeminência óssea ou mucosa?', props: { options: options }, isRequired: true },
    { name: 'conditions', component: ControlledCheckboxGroup, label: 'Condições associadas (se aplicável)', props: { options: conditionsOptions}, isConditional: true, dependsOn: { field: 'boneOrMucosa', value: 'yes', }, isRequired: false },
];

const formRequestSchema = {
    type: "object",
    properties: {
        painLocation: { type: "string", enum: painLocationOptions },
        observations: { type: "string", description: "Other observations related to the injury and not used to fill other fields" },
        boneOrMucosa: { type: "string", enum: options.map(option => option.value), description: "If the injury is on a bony or mucosal prominence" },
        conditions: { type: "array", items: { type: "string", enum: conditionsOptions} },
    },
    required: []
}

export function LocationForm({ initData, onSubmit, onPrevious, scrollToPosition }: LocationFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const { refs, getRef } = useDynamicRefs<any>();
    const isFocused = useIsFocused();
    
    const { control, handleSubmit, setValue, getValues, trigger, watch } = useForm<LocationData>({
        resolver: yupResolver(locationSchema),
        defaultValues: initData,
    });

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
            Object.keys(data).forEach(key => trigger(key as keyof LocationData)); // To trigger resolver errors 
        }
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

    const setFormValue = (key: string, value: any) => {
        if (key == 'conditions') {
            setValue('boneOrMucosa', 'yes');
            setValue('conditions', value);
        }

        setValue(key as keyof LocationData, value);
    }

    const boneOrMucosaWatch = watch('boneOrMucosa');
    useEffect(() => {
        if (getValues('boneOrMucosa') === 'no') {
            setValue('conditions', undefined); 
        }
    }, [boneOrMucosaWatch]);

    return (
        <>
            <ThemedText type="title" style={styles.title}>Localização (AMBOS)</ThemedText>
            <BodyPartSelector
                ref={getRef('painLocation')}
                control={control}
                name="painLocation"
            />
            {fieldConfig.map(({ name, component: Component, label, props, isConditional, dependsOn, isRequired }) => {
                const shouldRender = !isConditional || (dependsOn && watch(dependsOn.field as keyof LocationData) === dependsOn.value);
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