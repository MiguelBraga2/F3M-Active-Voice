import { ControlledCheckboxGroup } from '../inputs/ControlledCheckboxGroup';
import { ControlledRadioGroup } from '../inputs/ControlledRadioGroup';
import { ControlledTextInput } from '../inputs/ControlledTextInput';
import { ControlledSlider } from '../inputs/ControlledSlider';
import { TranscriptionBox } from '../TranscriptionBox';
import { yupResolver } from '@hookform/resolvers/yup';
import BodyPartSelector from '../BodyPartSelector';
import { ThemedButton } from '../ThemedButton';
import { useEffect, useRef, useState } from 'react';
import { ThemedText } from '../ThemedText';
import { StyleSheet } from 'react-native';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import React from 'react';
import { useIsFocused } from '@react-navigation/native';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import { FieldConfig } from '@/types/fieldConfig';
import { painLocationOptions } from './painLocation/painLocationOptins';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './complete_form/utils';


export interface MedicalHistoryData {
    painLevel: number;
    painLocation: string;
    observations?: string;
    boneOrMucosa: string;
    conditions?: string[];  // Only if boneOrMucosa is "yes"
    time: string;
    recurrent: string;
    recurrentTime?: string;  // Only if recurrent is "yes"
}

const medicalSchema = yup.object().shape({
    painLevel: yup.number().min(0, "O nível de dor deve ser entre 0 e 10").max(10, "O nível de dor deve ser entre 0 e 10").required("O nível de dor é obrigatório"),
    painLocation: yup.string().required("A localização da dor é obrigatória"),
    observations: yup.string(),
    boneOrMucosa: yup.string().required("A resposta sobre a proeminência é obrigatória"),
    conditions: yup.array().of(yup.string().required()).min(1, "Pelo menos uma condição deve ser selecionada").when('boneOrMucosa', {
        is: (boneOrMucosa: string) => boneOrMucosa === 'yes',
        then: schema => schema.required("Pelo menos uma condição deve ser selecionada"),
    }),
    time: yup.string().matches(/^\d+$/, "O tempo estimado deve ser um número").required("O tempo estimado é obrigatório"),
    recurrent: yup.string().required("A resposta sobre a recorrência da dor é obrigatória"),
    recurrentTime: yup.string().matches(/^\d+$/, "O tempo estimado de recorrência deve ser um número").when('recurrent', {
        is: (recurrent: string) => recurrent === 'yes',
        then: schema => schema.required("O tempo estimado de recorrência é obrigatório"),
    }),
});

interface MedicalHistoryFormProps {
    initData: MedicalHistoryData;
    onSubmit: (data: MedicalHistoryData) => void;
    onPrevious: (data: MedicalHistoryData) => void;
    scrollToPosition: (yPosition: number) => void;
}

export const fieldConfig: FieldConfig[] = [
    { name: 'painLevel', component: ControlledSlider, label: 'Nível de Dor', props: { minimumValue: 0, maximumValue: 10, step: 1 }, isRequired: true },
    { name: 'time', component: ControlledTextInput, label: 'Qual é o tempo estimado, desde que a ferida apareceu?', props: { placeholder: 'Introduza o tempo estimado (meses)', keyboardType: 'number-pad' }, isRequired: true },
    { name: 'boneOrMucosa', component: ControlledRadioGroup, label: 'A ferida está numa proeminência óssea ou mucosa?', props: { options: [{ label: 'Não', value: 'no' }, { label: 'Sim', value: 'yes' }] }, isRequired: true },
    { name: 'conditions', component: ControlledCheckboxGroup, label: 'Condições associadas (se aplicável)', props: { options: ['Imobilidade (parcial ou total)', 'Mucosa', 'Lesão limitada a uma localização', 'Nenhuma das anteriores'] }, isConditional: true, dependsOn: { field: 'boneOrMucosa', value: 'yes', }, isRequired: false },
    { name: 'recurrent', component: ControlledRadioGroup, label: 'A ferida é recorrente?', props: { options: [{ label: 'Não', value: 'no' }, { label: 'Sim', value: 'yes' },], }, isRequired: true },
    { name: 'recurrentTime', component: ControlledTextInput, label: 'Qual é o tempo estimado, desde que a ferida tem sido recorrente?', props: { placeholder: 'Introduza o tempo estimado (meses)', keyboardType: 'number-pad' }, isConditional: true, dependsOn: { field: 'recurrent', value: 'yes' }, isRequired: false },
    { name: 'observations', component: ControlledTextInput, label: 'Observações', props: { placeholder: 'Introduza observações que considere relevantes', keyboardType: 'default', multiline: true, numberOfLines: 3 }, isRequired: false },
];

const formRequestSchema = {
    type: "object",
    properties: {
        painLevel: { type: "number", description: "The pain level on a scale from 0 (no pain) to 10 (worst pain imaginable). Acceptable values range from 0 to 10." },
        painLocation: { type: "string", enum: painLocationOptions },
        observations: { type: "string", description: "Observations relative to the injury" },
        boneOrMucosa: { type: "string", enum: ['yes', 'no'], description: "If the injury is on a bony or mucosal prominence" },
        conditions: { type: "array", items: { type: "string", enum: fieldConfig.find(field => field.name === 'conditions')?.props.options } },
        time: { type: "number", description: "The estimated time in months since the injury started. Only an integer value representing the number of months is accepted." },
        recurrent: { type: "string", enum: ['yes', 'no'] },
        recurrentTime: { type: "number", description: "The estimated time in months since the injury has been recurrent. Only an integer value representing the number of months is accepted." }
    },
    required: []
}

export function MedicalHistoryForm({ initData, onSubmit, onPrevious, scrollToPosition }: MedicalHistoryFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const { refs, getRef } = useDynamicRefs<any>();
    const isFocused = useIsFocused();

    const { control, handleSubmit, setValue, getValues, trigger, watch } = useForm<MedicalHistoryData>({
        resolver: yupResolver(medicalSchema),
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

    const handleStartRecording = async () => {
        const result = await processStartRecording(formRequestSchema, fieldConfig, setFormValue, getValues, refs, scrollToPosition, setTranscriptionText, ['time', 'recurrentTime']);

        if (result) {
            const data = result.data ?? {};
            Object.keys(data).forEach(key => trigger(key as keyof MedicalHistoryData)); // To trigger resolver errors 
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
                { regex: /\b(recu(?:ar)?|volta(?:r)?|retroceder|volta(?:r)? atrás)\b/i, action: "goBack", handler: handleGoBack },
                { regex: /\b(?:ajuda|assistente)\b/i, action: "helpAssistant", handler: handleHelpAssistant },
            ]);
        }
    }, [isFocused]);

    const setFormValue = (key: string, value: any) => {
        if (key === 'recurrentTime') {
            setValue('recurrent', 'yes');
        } else if (key === 'conditions'){
            setValue('boneOrMucosa', 'yes');
        }
        setValue(key as keyof MedicalHistoryData, value);
    }

    useEffect(() => {
        if (getValues('boneOrMucosa') === 'no') {
            setValue('conditions', undefined);
        }
    }, [watch('boneOrMucosa')]);

    useEffect(() => {
        if (getValues('recurrent') === 'no') {
            setValue('recurrentTime', undefined);
        }
    }, [watch('recurrent')]);

    return (
        <>
            <ThemedText type="title" style={styles.title}>Medical History Form</ThemedText>
            <BodyPartSelector
                ref={getRef('painLocation')}
                control={control}
                name="painLocation"
            />
            {fieldConfig.map(({ name, component: Component, label, props, isConditional, dependsOn, isRequired }) => {
                const shouldRender = !isConditional || (dependsOn && watch(dependsOn.field as keyof MedicalHistoryData) === dependsOn.value);
                if (!shouldRender) return null;

                return (
                    <React.Fragment key={name}>
                        <ThemedText>{label}</ThemedText>
                        <Component control={control} name={name} {...props} ref={isRequired ? getRef(name) : null}/>
                    </React.Fragment>
                );
            })}
            <ThemedButton title="Próximo" onPress={handleAdvance} />
            <ThemedButton title="Voltar" variant='secondary' onPress={handleGoBack} />
            { isSpeaking && <ThemedButton title="Parar" onPress={stopSpeaking} style={styles.loading} /> }
            <TranscriptionBox ref={transcriptionBoxRef} text={transcriptionText} />
        </>
    );
}


const styles = StyleSheet.create({
    loading: {
        marginTop: 10,
    },
    form: {
        width: '100%',
        maxWidth: 600,
    },
    title: {
        textAlign: 'center',
        marginBottom: 20,
    },
    imageContainer: {
        position: 'relative',
        width: 200,
        height: 400,
    },
});

