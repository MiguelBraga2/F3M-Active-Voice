import { ControlledCheckboxGroup } from '../../inputs/ControlledCheckboxGroup';
import { ControlledRadioGroup } from '../../inputs/ControlledRadioGroup';
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
import { useLanguage } from '@/hooks/useLanguage';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import styles from './Stylesheet.styles';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './utils';

export interface injuryCharactData {
    tecidoEpitelial: string;
    bordosIntactos: string;
    noBordosIntactos?: string[];
    pelePerilesional: string;
    yesPelePerilesional?: string[];
    sintomas: string;
    noSintomas?: string[];
}

const injuryCharactSchema = yup.object().shape({
    tecidoEpitelial: yup.string().required("Indique se tem tecido epitelial"),
    bordosIntactos: yup.string().required("Indique se tem bordos intactos"),
    noBordosIntactos: yup.array().of(yup.string().required("Indique quais os bordos intactos")).min(1, 'Deve selecionar pelo menos uma opção').when('bordosIntactos', {
        is: (bordosIntactos: string) => bordosIntactos == 'no',
        then: schema => schema.required('Deve selecionar pelo menos uma opção'),
    }),
    pelePerilesional: yup.string().required("Indique se tem pele perilesional"),
    yesPelePerilesional: yup.array().of(yup.string().required("Indique quais as peles perilesional")).min(1, 'Deve selecionar pelo menos uma opção').when('pelePerilesional', {
        is: (pelePerilesional: string) => pelePerilesional == 'yes',
        then: schema => schema.required('Deve selecionar pelo menos uma opção'),
    }),
    sintomas: yup.string().required("Indique se tem algum destes sintomas"),
    noSintomas: yup.array().of(yup.string().required("Indique quais os sintomas relatados")).min(1, 'Deve selecionar pelo menos uma opção').when('sintomas', {
        is: (sintomas: string) => sintomas == 'no',
        then: schema => schema.required('Deve selecionar pelo menos uma opão'),
    }),
});

interface injuryCharactFormProps {
    initData: injuryCharactData;
    onSubmit: (data: injuryCharactData) => void;
    onPrevious: (data: injuryCharactData) => void;
    scrollToPosition: (yPosition: number) => void;
}

const options = [
    { label: 'Não', value: 'no' },
    { label: 'Sim', value: 'yes' },
];

const noBordosIntactosOptions = ['Macerados', 'Desidratos', 'Soltos', 'Enrolados/espessados']
const yesPelePerilesionalOptions = ['Maceração', 'Escoriação', 'Hiperqueratose', 'Seca', 'Eczema', 'Calo']
const noSintomasOptions = ['Odor intenso ou desagradável', 'Presença de tecido necrosado ou desvitalizado', 
    'Aumentado exsudado', 'Tecido de granulação vermelho, frível ou facilmente sangrante', 
    'Ferida sem evolução nas últimas 2 a 4 semanas', 'Aumento de temperatura da pele perilesional', 
    'Exposição de tecido ósseo','Aumento do tamanho da ferida', 'Edeme e eritema da pele perilesional', 
    'Lesão satélite ou novas áreas de tecido necrosado','Aparecimento ou aumento da dor local na ferida', 'Nenhuma das Anteriores'    
]

const fieldConfig: FieldConfig[] = [
    { name: 'tecidoEpitelial', component: ControlledRadioGroup, label: 'Tecido epitelial presente?', props: { options: options }, isRequired: true },
    { name: 'bordosIntactos', component: ControlledRadioGroup, label: 'Bordos intactos, aderentes e nivelados com o leito da ferida?', props: { options: options }, isRequired: true },
    { name: 'noBordosIntactos', component: ControlledCheckboxGroup, label: 'Motivos pelos quais os bordos não estão intactos', props: { options: noBordosIntactosOptions }, isRequired: false, isConditional: true, dependsOn: { field: 'bordosIntactos', value: 'no' } },
    { name: 'pelePerilesional', component: ControlledRadioGroup, label: 'Pele perilesional com alterações?', props: { options: options }, isRequired: true },
    { name: 'yesPelePerilesional', component: ControlledCheckboxGroup, label: 'Alterações na pele perilesional', props: { options: yesPelePerilesionalOptions }, isRequired: false, isConditional: true, dependsOn: { field: 'pelePerilesional', value: 'yes' } },
    { name: 'sintomas', component: ControlledRadioGroup, label: 'Apresenta alguns destes sintomas?', props: { options: options }, isRequired: true },
    { name: 'noSintomas', component: ControlledCheckboxGroup, label: 'Avalie os sintomas e sinais de infeção', props: { options: noSintomasOptions }, isRequired: false, isConditional: true, dependsOn: { field: 'sintomas', value: 'no' } }
];

const formRequestSchema = {
    type: "object",
    properties: {
        tecidoEpitelial: {type: "string", enum: options.map(option => option.value)},
        bordosIntactos: {type: "string", enum: options.map(option => option.value)},
        noBordosIntactos: { type: "array", items: { type: "string", enum: noBordosIntactosOptions } },
        pelePerilesional: {type: "string", enum: options.map(option => option.value)},
        yesPelePerilesional: { type: "array", items: { type: "string", enum: yesPelePerilesionalOptions } },
        sintomas: {type: "string", enum: options.map(option => option.value)},
        noSintomas: { type: "array", items: { type: "string", enum: noSintomasOptions} },
    },
    required: []
}

export function InjuryCharact2Form({ initData, onSubmit, onPrevious, scrollToPosition}: injuryCharactFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const { refs, getRef } = useDynamicRefs();
    const isFocused = useIsFocused();
    
    const { control, handleSubmit, setValue, getValues, trigger, watch } = useForm<injuryCharactData>({
        resolver: yupResolver(injuryCharactSchema),
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
            Object.keys(data).forEach(key => trigger(key as keyof injuryCharactData)); // To trigger resolver errors 
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
    
    const setFormValue = (key: string, value: any) => {
        if (key == 'noBordosIntactos') {
            setValue('bordosIntactos', 'no');
        }
        if (key == 'yesPelePerilesional') {
            setValue('pelePerilesional', 'yes');
        }
        if (key == 'noSintomas') {
            setValue('sintomas', 'no');
        }

        setValue(key as keyof injuryCharactData, value);
    }

    const bordosIntactosWatch = watch("bordosIntactos");
    const pelePerilesionalWatch = watch("pelePerilesional");
    const sintomasWatch = watch("sintomas");
    useEffect(() => {
        if (getValues('bordosIntactos') === 'yes') {
            setValue('noBordosIntactos', undefined);
        }
    }, [bordosIntactosWatch]);

    useEffect(() => {
        if (getValues('pelePerilesional') === 'no') {
            setValue('yesPelePerilesional', undefined);
        }
    }, [pelePerilesionalWatch]);

    useEffect(() => {
        if (getValues('sintomas') === 'yes') {
            setValue('noSintomas', undefined);
        }
    }, [sintomasWatch]);

    return (
        <>
            <ThemedText type="title" style={styles.title}>Caraterização da Ferida (COMPLETO)</ThemedText>
            {fieldConfig.map(({ name, component: Component, label, props, isConditional, dependsOn, isRequired }) => {
                const shouldRender = !isConditional || (dependsOn && watch(dependsOn.field as keyof injuryCharactData) === dependsOn.value);
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