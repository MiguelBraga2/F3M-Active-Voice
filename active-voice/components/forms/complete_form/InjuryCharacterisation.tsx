import { ControlledRadioGroup } from '../../inputs/ControlledRadioGroup';
import { ControlledSlider } from '@/components/inputs/ControlledSlider';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { TranscriptionBox } from '../../TranscriptionBox';
import { yupResolver } from '@hookform/resolvers/yup';
import { useEffect, useState, useRef } from 'react';
import { ThemedButton } from '../../ThemedButton';
import { useLanguage } from '@/hooks/useLanguage';
import { ThemedText } from '../../ThemedText';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import React from 'react';
import { useIsFocused } from '@react-navigation/native';
import { FieldConfig } from '@/types/fieldConfig';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import styles from './Stylesheet.styles';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './utils';

export interface injuryCharactData {
    apresentaExsudado: string;
    quantidade?: string;
    tipoECor?: string;
    peleCircundante: string;
    apresentaDor: string;
    intensidade?: number;
    frequencia?: string;
    tipo?: string;
}

const injuryCharactSchema = yup.object().shape({
    apresentaExsudado: yup.string().required('Indique se apresenta exsudado'),
    quantidade: yup.string().when('apresentaExsudado', {
        is: (apresentaExsudado: string) => apresentaExsudado === 'yes',
        then: schema => schema.required("Indique a quantidade de exsudado"),
    }),
    tipoECor: yup.string().when('apresentaExsudado', {
        is: (apresentaExsudado: string) => apresentaExsudado === 'yes',
        then: schema => schema.required("Indique o tipo e dor de exsudado"),
    }),
    peleCircundante: yup.string().required("Indique o tipo de pele circundante"),
    apresentaDor: yup.string().required("Indique se apresenta dor"),
    intensidade: yup.number().min(0,'Indique um número entre 0 e 10').max(10,'Indique um número entre 0 e 10').when('apresentaDor', {
        is: (apresentaDor: string) => apresentaDor === 'yes',
        then: schema => schema.required("Indique a intensidade da dor"),
    }),
    frequencia: yup.string().when('apresentaDor', {
        is: (apresentaDor: string) => apresentaDor === 'yes',
        then: schema => schema.required("Indique a frequencia da dor"),
    }),
    tipo: yup.string().when('apresentaDor', {
        is: (apresentaDor: string) => apresentaDor === 'yes',
        then: schema => schema.required("Indique o tipo da dor"),
    }), 
});

interface injuryCharactFormProps {
    initData: injuryCharactData;
    onSubmit: (data: injuryCharactData) => void;
    onPrevious: (data: injuryCharactData) => void;
    scrollToPosition: (yPosition: number) => void;
}

const optionsPele = [
    { label: 'Normotérmica', value: 'Normotérmica'},
    { label: 'Fria', value: 'Fria'},
    { label: 'Quente', value: 'Quente'},
]

const options = [
    { label: 'Não', value: 'no' },
    { label: 'Sim', value: 'yes' },
];

const optionsTipo = [
    { label: 'Moedeira', value: 'Moedeira'}, 
    { label: 'Lacerante', value: 'Lacerante'}, 
    { label: 'Profunda', value: 'Profunda'}, 
    { label: 'Pontada', value: 'Pontada'}, 
    { label: 'Fantasma', value: 'Fantasma'}, 
    { label: 'Contratura Muscular', value: 'Contratura Muscular'}, 
]
const optionsFrequencia = [
    { label: 'Contínua', value: 'Contínua'}, 
    { label: 'Intermitente', value: 'Intermitente'}, 
]
const optionsTipoECor = [
    { label: 'Seroso (Âmbar ou claro)', value: 'Seroso (Âmbar ou claro)',}, 
    { label: 'Serohemático (Claro ou rosa avermelhado)', value: 'Serohemático (Claro ou rosa avermelhado)'}, 
    { label: 'Sanguinolento (Vermelho)', value: 'Sanguinolento (Vermelho)'}, 
    { label: 'Seropurulento (Escuro, leitoso, amarelo ou acastanhado)', value: 'Seropurulento (Escuro, leitoso, amarelo ou acastanhado)'}, 
    { label: 'Fibrinoso (Escuro)', value: 'Fibrinoso (Escuro)'}, 
    { label: 'Purulento (Opaco, leitoso, amarelo, castanho ou verde)', value: 'Purulento (Opaco, leitoso, amarelo, castanho ou verde)'}, 
    { label: 'Hematopurulento (Avermelhado, leitoso ou opaco)', value: 'Hematopurulento (Avermelhado, leitoso ou opaco)'}, 
    { label: 'Hemorrágico (Vermelho opaco)', value: 'Hemorrágico (Vermelho opaco)'},         
]
const optionsQuantidade = [
    { label: 'Leve (penso ligeiramente marcado)', value: 'Leve (penso ligeiramente marcado)'}, 
    { label: 'Moderada (penso encontra-se molhado, mas sem fuga de exsudado)', value: 'Moderada (penso encontra-se molhado, mas sem fuga de exsudado)'}, 
    { label: 'Elevada (penso encontra-se molhado e há fuga de exsudado', value: 'Elevada (penso encontra-se molhado e há fuga de exsudado'}, 
]

const fieldConfig: FieldConfig[] = [
    { name: 'apresentaExsudado', component: ControlledRadioGroup, label: 'Apresenta exsudado?', props: { options: options }, isRequired: true },
    { name: 'quantidade', component: ControlledRadioGroup, label: 'Quantidade', props: { options: optionsQuantidade }, isRequired: false, isConditional: true, dependsOn : { field: 'apresentaExsudado', value: 'yes' } },
    { name: 'tipoECor', component: ControlledRadioGroup, label: 'Tipo e Cor', props: { options: optionsTipoECor }, isRequired: false, isConditional: true, dependsOn: { field: 'apresentaExsudado', value: 'yes' } },
    { name: 'peleCircundante', component: ControlledRadioGroup, label: 'Pele circundante', props: { options: optionsPele }, isRequired: true },
    { name: 'apresentaDor', component: ControlledRadioGroup, label: 'Apresenta dor?', props: { options: options }, isRequired: true },
    { name: 'intensidade', component: ControlledSlider, label: 'Intensidade', props: { minimumValue: 0, maximumValue: 10, step: 1 }, isRequired: false, isConditional: true, dependsOn: { field: 'apresentaDor', value: 'yes' } },
    { name: 'frequencia', component: ControlledRadioGroup, label: 'Frequência', props: { options: optionsFrequencia }, isRequired: false, isConditional: true, dependsOn: { field: 'apresentaDor', value: 'yes' } },
    { name: 'tipo', component: ControlledRadioGroup, label: 'Tipo', props: { options: optionsTipo }, isRequired: false, isConditional: true, dependsOn: { field: 'apresentaDor', value: 'yes' } }
];

const formRequestSchema = {
    type: "object",
    properties: {
        peleCircundante: {type: "string", enum: optionsPele.map(option => option.value)},
        apresentaDor: {type: "string", enum: options.map(option => option.value)},
        apresentaExsudado: {type: "string", enum: options.map(option => option.value)},
        quantidade: {type: "string", enum: optionsQuantidade.map(option => option.value)},
        tipoECor: {type: "string", enum: optionsTipoECor.map(option => option.value)},
        intensidade: { type: "number", description: "The intensity of the pain (in a scale from 0 to 10)" },
        frequencia: {type: "string", enum: optionsFrequencia.map(option => option.value)},
        tipo: {type: "string", enum: optionsTipo.map(option => option.value)},
    },
    required: []
}

export function InjuryCharact1Form({ initData, onSubmit, onPrevious, scrollToPosition}: injuryCharactFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const { refs, getRef } = useDynamicRefs();
    const isFocused = useIsFocused();
    
    const { control, handleSubmit, setValue, getValues, trigger, watch } = useForm<injuryCharactData>({
        resolver: yupResolver(injuryCharactSchema),
        defaultValues: {
            ...initData,
            intensidade: initData.intensidade ?? 0,
        }

    });

    const handleAdvance = () => {
        if (getValues('apresentaDor') === 'no') {
            setValue('intensidade', undefined);
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
        if (key === 'quantidade' || key === 'tipoECor') {
            setValue('apresentaExsudado', 'yes');
        }
        if (key === 'intensidade' || key === 'frequencia' || key === 'tipo') {
            setValue('apresentaDor', 'yes');
        }

        setValue(key as keyof injuryCharactData, value);
    }
    
    const apresentaExsudadoWatch = watch("apresentaExsudado");
    const apresentaDorWatch = watch("apresentaDor");
    
    useEffect(() => {
        if (apresentaExsudadoWatch === 'no') {
            setValue('quantidade', undefined);
            setValue('tipoECor', undefined);
        }
    }, [apresentaExsudadoWatch]);

    useEffect(() => {
        if (apresentaDorWatch === 'no') {
            setValue('frequencia', undefined);
            setValue('tipo', undefined);
        }
    }, [apresentaDorWatch]);

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