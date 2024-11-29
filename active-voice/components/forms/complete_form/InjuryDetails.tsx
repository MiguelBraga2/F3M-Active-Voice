import { ControlledRadioGroup } from '../../inputs/ControlledRadioGroup';
import { ControlledTextInput } from '../../inputs/ControlledTextInput';
import { ControlledSlider } from '../../inputs/ControlledSlider';
import { TranscriptionBox } from '../../TranscriptionBox';
import { ThemedButton } from '../../ThemedButton';
import { ThemedText } from '../../ThemedText';

import React, { useEffect, useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { yupResolver } from '@hookform/resolvers/yup';

import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useLanguage } from '@/hooks/useLanguage';
import { scrollToFirstMissingField } from '@/hooks/useScrollToFirstMissingField';
import { useIsFocused } from '@react-navigation/native';
import ControlledCheckbox from '@/components/inputs/ControlledCheckbox';
import { FieldConfig } from '@/types/fieldConfig';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import styles from './Stylesheet.styles';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './utils';

export interface InjuryDetailsData {
    sintomas: string;
    dorPensoOuDesbridamento?: number;
    dorMudançasPensoOuDesbridamento?: number;
    drenagemOuEnxudado?: number;
    odor?: number;
    prurido?: number;
    hemorragia?: number;
    preocEstetica?: number;
    edemaOuTumefação?: number;
    volumeCausFerida?: number;
    volumeCausPenso?: number;
    tempoDesdeInicio?: string;
    possivelObterEstimativaTempo: boolean;
    recorrente: string;
}

const injurySchema = yup.object().shape({
    sintomas: yup.string().required("Indique a existência de sintomas (ou não) nas últimas 24h"),
    dorPensoOuDesbridamento: yup.number().min(0, "O valor deve ser entre 0 e 10").max(10, "O valor deve ser entre 0 e 10").when('sintomas', {
        is: (sintomas: string) => sintomas === 'yes',
        then: schema => schema.required("Campo obrigatório"),
    }),
    dorMudançasPensoOuDesbridamento: yup.number().min(0, "O valor deve ser entre 0 e 10").max(10, "O valor deve ser entre 0 e 10").when('sintomas', {
        is: (sintomas: string) => sintomas === 'yes',
        then: schema => schema.required("Campo obrigatório"),
    }),
    drenagemOuEnxudado: yup.number().min(0, "O valor deve ser entre 0 e 10").max(10, "O valor deve ser entre 0 e 10").when('sintomas', {
        is: (sintomas: string) => sintomas === 'yes',
        then: schema => schema.required("Campo obrigatório"),
    }),
    odor: yup.number().min(0, "O valor deve ser entre 0 e 10").max(10, "O valor deve ser entre 0 e 10").when('sintomas', {
        is: (sintomas: string) => sintomas === 'yes',
        then: schema => schema.required("Campo obrigatório"),
    }),
    prurido: yup.number().min(0, "O valor deve ser entre 0 e 10").max(10, "O valor deve ser entre 0 e 10").when('sintomas', {
        is: (sintomas: string) => sintomas === 'yes',
        then: schema => schema.required("Campo obrigatório"),
    }),
    hemorragia: yup.number().min(0, "O valor deve ser entre 0 e 10").max(10, "O valor deve ser entre 0 e 10").when('sintomas', {
        is: (sintomas: string) => sintomas === 'yes',
        then: schema => schema.required("Campo obrigatório"),
    }),
    preocEstetica: yup.number().min(0, "O valor deve ser entre 0 e 10").max(10, "O valor deve ser entre 0 e 10").when('sintomas', {
        is: (sintomas: string) => sintomas === 'yes',
        then: schema => schema.required("Campo obrigatório"),
    }),
    edemaOuTumefação: yup.number().min(0, "O valor deve ser entre 0 e 10").max(10, "O valor deve ser entre 0 e 10").when('sintomas', {
        is: (sintomas: string) => sintomas === 'yes',
        then: schema => schema.required("Campo obrigatório"),
    }),
    volumeCausFerida: yup.number().min(0, "O valor deve ser entre 0 e 10").max(10, "O valor deve ser entre 0 e 10").when('sintomas', {
        is: (sintomas: string) => sintomas === 'yes',
        then: schema => schema.required("Campo obrigatório"),
    }),
    volumeCausPenso: yup.number().min(0, "O valor deve ser entre 0 e 10").max(10, "O valor deve ser entre 0 e 10").when('sintomas', {
        is: (sintomas: string) => sintomas === 'yes',
        then: schema => schema.required("Campo obrigatório"),
    }),
    tempoDesdeInicio: yup.string().matches(/^[0-9]+$/, "O Campo deve ser um número válido").when('possivelObterEstimativaTempo', {
        is: (possivelObterEstimativaTempo: boolean) => possivelObterEstimativaTempo,
        then: schema => schema.required("Campo obrigatório se a checkbox estiver desmarcada"), 
    }),
    possivelObterEstimativaTempo: yup.boolean().required("Campo obrigatório"),
    recorrente: yup.string().required("A resposta sobre a recorrência da dor é obrigatória"),
});

const options = [
    { label: 'Não', value: 'no' },
    { label: 'Sim', value: 'yes' },
];

const options1 = [
    { label: 'Não', value: 'no' },
    { label: 'Sim', value: 'yes' },
    { label: 'Não é possível obter', value: 'cannot obtain' }
];

const formRequestSchema = {
    type: "object",
    additionalProperties: false,
    properties: {
        sintomas: { type: "string", enum: options.map(option => option.value), description: "Indicate if the patient has symptoms" },
        dorPensoOuDesbridamento: { type: "number", description: "The pain level (in a scale from 0 to 10)" },
        dorMudançasPensoOuDesbridamento: { type: "number", description: "The pain level (in a scale from 0 to 10)" },
        drenagemOuEnxudado: { type: "number", description: "The pain level (in a scale from 0 to 10)" },
        odor: { type: "number", description: "The pain level (in a scale from 0 to 10)" },
        prurido: { type: "number", description: "The pain level (in a scale from 0 to 10)" },
        hemorragia: { type: "number", description: "The pain level (in a scale from 0 to 10)" },
        preocEstetica: { type: "number", description: "The pain level (in a scale from 0 to 10)" },
        edemaOuTumefação: { type: "number", description: "The pain level (in a scale from 0 to 10)" },
        volumeCausFerida: { type: "number", description: "The pain level (in a scale from 0 to 10)" },
        volumeCausPenso: { type: "number", description: "The pain level (in a scale from 0 to 10)" },
        tempoDesdeInicio: { type: "number", description: "The estimated time since the injury started. Only the number of months" },
        possivelObterEstimativaTempo: { type: "boolean", description: 'If we can obtain the estimated time since the injury started' },
        recorrente: { type: "string", enum: options1.map(option => option.value), description: "Indicate if the wound is recurrent" },
    },
    required: []
}

interface InjuryDetailsFormProps {
    initData: InjuryDetailsData;
    onSubmit: (data: InjuryDetailsData) => void;
    scrollToPosition: (yPosition: number) => void;
}

const fieldConfig: FieldConfig[] = [
    { name: 'sintomas', component: ControlledRadioGroup, label: 'Possível obter (ou quer) responder sintomas?', props: { options: options }, isRequired: true },
    { name: 'dorPensoOuDesbridamento', component: ControlledSlider, label: 'Dor na execução do penso e/ou desbridamento', props: { minimumValue: 0, maximumValue: 10, step: 1 }, isRequired: false, isConditional: true, dependsOn: { field: 'sintomas', value: 'yes' } },
    { name: 'dorMudançasPensoOuDesbridamento', component: ControlledSlider, label: 'Dor entre mudanças do penso e/ou desbridamento', props: { minimumValue: 0, maximumValue: 10, step: 1 }, isRequired: false, isConditional: true, dependsOn: { field: 'sintomas', value: 'yes' } },
    { name: 'drenagemOuEnxudado', component: ControlledSlider, label: 'Drenagem ou exsudado', props: { minimumValue: 0, maximumValue: 10, step: 1 }, isRequired: false, isConditional: true, dependsOn: { field: 'sintomas', value: 'yes' } },
    { name: 'odor', component: ControlledSlider, label: 'Odor', props: { minimumValue: 0, maximumValue: 10, step: 1 }, isRequired: false, isConditional: true, dependsOn: { field: 'sintomas', value: 'yes' } },
    { name: 'prurido', component: ControlledSlider, label: 'Prurido', props: { minimumValue: 0, maximumValue: 10, step: 1 }, isRequired: false, isConditional: true, dependsOn: { field: 'sintomas', value: 'yes' } },
    { name: 'hemorragia', component: ControlledSlider, label: 'Hemorragia', props: { minimumValue: 0, maximumValue: 10, step: 1 }, isRequired: false, isConditional: true, dependsOn: { field: 'sintomas', value: 'yes' } },
    { name: 'preocEstetica', component: ControlledSlider, label: 'Preocupação Estética', props: { minimumValue: 0, maximumValue: 10, step: 1 }, isRequired: false, isConditional: true, dependsOn: { field: 'sintomas', value: 'yes' } },
    { name: 'edemaOuTumefação', component: ControlledSlider, label: 'Edema e/ou tumefação ao redor da ferida', props: { minimumValue: 0, maximumValue: 10, step: 1 }, isRequired: false, isConditional: true, dependsOn: { field: 'sintomas', value: 'yes' } },
    { name: 'volumeCausFerida', component: ControlledSlider, label: 'Volume ou efeito massa causado pela ferida', props: { minimumValue: 0, maximumValue: 10, step: 1 }, isRequired: false, isConditional: true, dependsOn: { field: 'sintomas', value: 'yes' } },
    { name: 'volumeCausPenso', component: ControlledSlider, label: 'Volume ou efeito massa causado pelo penso', props: { minimumValue: 0, maximumValue: 10, step: 1 }, isRequired: false, isConditional: true, dependsOn: { field: 'sintomas', value: 'yes' } },
    { name: 'tempoDesdeInicio', component: ControlledTextInput, label: 'Qual é o tempo estimado, desde que a ferida apareceu?', props: { keyboardType: 'number-pad', placeholder: 'Introduza o tempo estimado (meses)' }, isRequired: false, isConditional: true, dependsOn: { field: 'possivelObterEstimativaTempo', value: true } },
    { name: 'possivelObterEstimativaTempo', component: ControlledCheckbox, label: '', props: { label: 'Não é possível obter' }, isRequired: true },
    { name: 'recorrente', component: ControlledRadioGroup, label: 'A ferida é recorrente?', props: { options: options1 }, isRequired: true }
];

export function InjuryDetailsForm({ initData, onSubmit, scrollToPosition }: InjuryDetailsFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { refs, getRef } = useDynamicRefs();
    const isFocused = useIsFocused();    
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();

    const { control, handleSubmit, setValue, getValues, trigger, watch } = useForm<InjuryDetailsData>({
        resolver: yupResolver(injurySchema),
        defaultValues: {
            ...initData,
            possivelObterEstimativaTempo: initData.possivelObterEstimativaTempo ?? true,
            dorPensoOuDesbridamento: initData.dorPensoOuDesbridamento ?? 0,
            dorMudançasPensoOuDesbridamento: initData.dorMudançasPensoOuDesbridamento ?? 0,
            drenagemOuEnxudado: initData.drenagemOuEnxudado ?? 0,
            odor: initData.odor ?? 0,
            prurido: initData.prurido ?? 0,
            hemorragia: initData.hemorragia ?? 0,
            preocEstetica: initData.preocEstetica ?? 0,
            edemaOuTumefação: initData.edemaOuTumefação ?? 0,
            volumeCausFerida: initData.volumeCausFerida ?? 0,
            volumeCausPenso: initData.volumeCausPenso ?? 0,
        }
    });

    const sintomas = ['dorPensoOuDesbridamento','dorMudançasPensoOuDesbridamento',
        'drenagemOuEnxudado','odor','prurido','hemorragia',
        'preocEstetica','edemaOuTumefação','volumeCausFerida','volumeCausPenso']

    const setFormValue = (key: string, value: any) => {
        if (sintomas.some(v => v === key)){
            setValue('sintomas', 'yes');
        }

        if (key == 'tempoDesdeInicio') {
            setValue('possivelObterEstimativaTempo', true);
            setValue('tempoDesdeInicio', value);
        }
        else {
            setValue(key as keyof InjuryDetailsData, value);
        }
    }

    useEffect(() => {
        if (isFocused) {
            setCommands([
                { regex: /\b(começa(?:r)?|grava(?:r)?|inicia(?:r)?)\b/i, action: "startRecording", handler: handleStartRecording },
                { regex: /\b(avança(?:r)?|próximo|submete(?:r)?)\b/i, action: "advance", handler: handleAdvance },
                { regex: /\b(?:mostra(?:r)?|exib(?:ir|e))(?: a)? transcrição\b/i, action: "showTranscription", handler: handleShowTranscription },
                { regex: /\b(?:ajuda|assistente)\b/i, action: "helpAssistant", handler: handleHelpAssistant },
            ]);
        }
    }, [isFocused]);

    const handleAdvance = async () => {
        if (getValues('sintomas') === 'no') {
            sintomas.map(sintoma => setValue(sintoma as keyof InjuryDetailsData, undefined))
        }

        const onError = async () => {
            await speakAndScrollMissingFields(fieldConfig, getValues, refs, scrollToPosition, speakMissingFields);
        }

        handleSubmit(onSubmit, onError)();
    };

    const handleShowTranscription = () => transcriptionBoxRef.current?.toggleExpand();

    const handleHelpAssistant = async () => { // Called when voice assistant is activated
        await processFormDataWithAssistant(getValues(), formRequestSchema, speakMessage);
    };

    const handleStartRecording = async () => {
        const result = await processStartRecording(formRequestSchema, fieldConfig, setFormValue, getValues, refs, scrollToPosition, setTranscriptionText, ['tempoDesdeInicio']);

        if (result) {
            const data = result.data ?? {};
            Object.keys(data).forEach(key => trigger(key as keyof InjuryDetailsData)); // To trigger resolver errors 
        }
    };

    const possivelObterEstimativaTempoWatch = watch('possivelObterEstimativaTempo');
    useEffect(() => {
        if (!getValues('possivelObterEstimativaTempo')) {
            setValue('tempoDesdeInicio', undefined);
        }
    }, [possivelObterEstimativaTempoWatch]);

    return (
        <>
            <ThemedText type="title" style={styles.title}>Detalhes da Ferida (AMBOS)</ThemedText>
            {fieldConfig.map(({ name, component: Component, label, props, isConditional, dependsOn, isRequired }) => {
                const shouldRender = !isConditional || (dependsOn && watch(dependsOn.field as keyof InjuryDetailsData) === dependsOn.value);
                if (!shouldRender) return null;

                return (
                    <React.Fragment key={name}>
                        {label !== '' ? <ThemedText>{label}</ThemedText> : null}
                        <Component control={control} name={name} {...props} ref={isRequired ? getRef(name) : null}/>
                    </React.Fragment>
                );
            })}
            <ThemedButton title="Avançar" onPress={handleAdvance} />
            { isSpeaking && <ThemedButton title="Parar" onPress={stopSpeaking} style={styles.loading} /> }
            <TranscriptionBox ref={transcriptionBoxRef} text={transcriptionText} />
        </>
    );
}