import { ControlledRadioGroup } from '../../inputs/ControlledRadioGroup';
import { ControlledSlider } from '@/components/inputs/ControlledSlider';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
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
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import styles from './Stylesheet.styles';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './utils';

export interface AlertClassificationData {
    classif: string;
    classifValue?: number;
    tempo: string;
}

const AlertClassificationSchema = yup.object().shape({
    classif: yup.string().required("Indique se pretende avaliar os alertas"),
    classifValue: yup.number().min(0,'Deve indicar um valor entre 0 e 10').max(10,'Deve indicar um valor entre 0 e 10').when('classif', {
        is: (classif: string) => classif === 'yes',
        then: schema => schema.required("Indique a classificação dos alertas"),
    }),
    tempo: yup.string().required("Indique se tem desbridamento"),
});

interface AlertClassificationFormProps {
    initData: AlertClassificationData;
    onSubmit: (data: AlertClassificationData) => void;
    onPrevious: (data: AlertClassificationData) => void;
    scrollToPosition: (yPosition: number) => void;
}

const options = [
    { label: 'Não', value: 'no' },
    { label: 'Sim', value: 'yes' },
];

const timeOptions = [
    { label: '0 a 10 minutos', value: '0 a 10 minutos' },
    { label: '11 a 20 minutos', value: '11 a 20 minutos' },
    { label: '21 a 30 minutos', value: '21 a 30 minutos' },
    { label: '31 a 40 minutos', value: '31 a 40 minutos' },
    { label: '41 a 50 minutos', value: '41 a 50 minutos' },
    { label: 'Mais de 50 minutos', value: 'Mais de 50 minutos' },
    { label: 'Prefiro não responder', value: 'Prefiro não responder'},
];

const fieldConfig: FieldConfig[] = [
    { name: 'classif', component: ControlledRadioGroup, label: 'Pretende avaliar os alertas', props: { options: options }, isRequired: true },
    { name: 'classifValue', component: ControlledSlider, label: 'Classificação alertas', props: { minimumValue: 0, maximumValue: 10, step: 1 }, isConditional: true, dependsOn: { field: 'classif', value: 'yes' }, isRequired: false },
    { name: 'tempo', component: ControlledRadioGroup, label: 'Quanto tempo demorou a monitorização e tratamento da ferida', props: { options: timeOptions }, isRequired: true }
];

const formRequestSchema = {
    type: "object",
    properties: {
        classif: {type: "string", enum: options.map(option => option.value)},
        classifValue: {type: "number", description: "The classification of the alerts (in a scale from 0 to 10)"},
        tempo: {type: "string", enum: timeOptions.map(option => option.value)},
    },
    required: []
}

export function AlertClassificationForm({ initData, onSubmit, onPrevious, scrollToPosition}: AlertClassificationFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const { refs, getRef } = useDynamicRefs();
    const isFocused = useIsFocused();
    
    const { control, handleSubmit, setValue, getValues, trigger, watch } = useForm<AlertClassificationData>({
        resolver: yupResolver(AlertClassificationSchema),
        defaultValues: {
            ...initData,
            classifValue: initData.classifValue ?? 0,
        }
    });

    const setFormValue = (key: string, value: any) => {
        if (key == 'classifValue') {
            setValue('classif', 'yes');
        }
        setValue(key as keyof AlertClassificationData, value);
    }

    const handleAdvance = async () => {
        if (getValues('classif') === 'no') {
            setValue('classifValue', undefined);
        }
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
            Object.keys(data).forEach(key => trigger(key as keyof AlertClassificationData)); // To trigger resolver errors 
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
            <ThemedText type="title" style={styles.title}>Avaliação de alertas (AMBOS)</ThemedText>
            {fieldConfig.map(({ name, component: Component, label, props, isConditional, dependsOn, isRequired }) => {
                const shouldRender = !isConditional || (dependsOn && watch(dependsOn.field as keyof AlertClassificationData) === dependsOn.value);
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