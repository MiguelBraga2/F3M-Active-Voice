import { ControlledCheckboxGroup } from '../../inputs/ControlledCheckboxGroup';
import { ControlledRadioGroup } from '../../inputs/ControlledRadioGroup';
import { ControlledTextInput } from '../../inputs/ControlledTextInput';
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

export interface TissuesAffectedData {
    tecidosAtingidos: string;
    loca?: string[];
    loc1?: string;
    loc2?: string;
    outros?: string;
}

const moreOptions = [
    'Atingimento ósseo e/ou tecidos anexos (tendões, ligamentos, cápsula articular ou necrose que não permite visualizar os tecidos subjacentes',
    'Atingimento muscular',
    'Atingimento do tecido celular subcutâneo'
]

const options = [
    { label: 'Pele intacta regenerada/cicatrizada ou com equimose', value: 'Pele intacta regenerada/cicatrizada ou com equimose'},
    { label: 'Atingimento da derme e epiderme', value: 'Atingimento da derme e epiderme'},
    { label: 'Atingimento do tecido celular subcutâneo', value: 'Atingimento do tecido celular subcutâneo'},
    { label: 'Atingimento muscular', value: 'Atingimento muscular'},
    { label: 'Atingimento ósseo e/ou tecidos anexos (tendões, ligamentos, cápsula articular ou necrose que não permite visualizar os tecidos subjacentes', value: 'Atingimento ósseo e/ou tecidos anexos (tendões, ligamentos, cápsula articular ou necrose que não permite visualizar os tecidos subjacentes'},
    { label: 'Profundidade indeterminada pela presença de necrose/desvitalizado', value: 'Profundidade indeterminada pela presença de necrose/desvitalizado'},
];

const locaOptions = ['Loca', 'Tunelização', 'Fístula']

const tissuesAffectedSchema = yup.object().shape({
    tecidosAtingidos: yup.string().required("Indique os tecidos atingidos"),
    loca: yup.array().of(yup.string().required()).min(1, "Selecione pelo menos uma opção").when('tecidosAtingidos', {
            is: (value: string) => moreOptions.indexOf(value) >= 0,
            then: schema => schema.required("Indique a localização"),
        }),
    loc1: yup.string().matches(/^(2[0-3]|1[0-9]|0?[0-9])$/, "Por favor, insira um número válido para as horas entre 0 e 23").min(0,"As horas devem ser entre as 0h e as 23h").max(23,"As horas devem ser entre as 0h e as 23h").when('tecidosAtingidos', {
            is: (value: string) => moreOptions.indexOf(value) >= 0,
            then: schema => schema.required("Indique as horas"),
        }),
    loc2: yup.string().matches(/^([0-5]?[0-9])$/, "Por favor, insira um número válido para os minutos entre 0 e 59").min(0,"Os minutos devem ser entre os 0min e os 59min").max(59,"Os minutos devem ser entre os 0min e os 59min").when('tecidosAtingidos', {
            is: (value: string) => moreOptions.indexOf(value) >= 0,
            then: schema => schema.required("Indique os minutos"),
        }),
    outros: yup.string().when('tecidosAtingidos', {
            is: (value: string) => moreOptions.indexOf(value) >= 0,
            then: schema => schema.required("Indique a localização"),
        }),
});

interface InjuryDetailsFormProps {
    initData: TissuesAffectedData;
    onSubmit: (data: TissuesAffectedData) => void;
    onPrevious: (data: TissuesAffectedData) => void;
    scrollToPosition: (yPosition: number) => void;
}

const fieldConfig: FieldConfig[] = [
    { name: 'tecidosAtingidos', component: ControlledRadioGroup, label: 'Tecidos Atingidos', props: { options }, isRequired: true },
    { name: 'loca', component: ControlledCheckboxGroup, label: 'Loca', props: { options: locaOptions }, isConditional: true, dependsOn: { field: 'tecidosAtingidos', value: (value: string) => moreOptions.includes(value) }, isRequired: false},
    { name: 'loc1', component: ControlledTextInput, label: 'Loc1', props: { keyboardType: 'default', placeholder: 'Insira aqui' }, isConditional: true, dependsOn: { field: 'tecidosAtingidos', value: (value: string) => moreOptions.includes(value) }, isRequired: false },
    { name: 'loc2', component: ControlledTextInput, label: 'Loc2', props: { keyboardType: 'default', placeholder: 'Insira aqui' }, isConditional: true, dependsOn: { field: 'tecidosAtingidos', value: (value: string) => moreOptions.includes(value) }, isRequired: false },
    { name: 'outros', component: ControlledTextInput, label: 'Definir outro', props: { keyboardType: 'default', placeholder: 'Definir outro' }, isConditional: true, dependsOn: { field: 'tecidosAtingidos', value: (value: string) => moreOptions.includes(value) }, isRequired: false }
];

const formRequestSchema = {
    type: "object",
    properties: {
        tecidosAtingidos: {type: "string", enum: options.map(option => option.value), description: "Select the option with the higher depth"},
        loca: { type: "array", items: { type: "string", enum: locaOptions}, description: "An array that can contain the values ['Loca', 'Tunelização', 'Fístula']" },
        loc1: { type: "number", description: "The location of the hours pointer" },
        loc2: { type: "number", description: "The location of the minutes pointer" },
        outros: { type: "string", description: 'Another location'},
    },
    required: []
}

export function TissuesAffectedForm({ initData, onSubmit, onPrevious, scrollToPosition}: InjuryDetailsFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const { refs, getRef } = useDynamicRefs();
    const isFocused = useIsFocused();
    
    const { control, handleSubmit, setValue, getValues, trigger, watch } = useForm<TissuesAffectedData>({
        resolver: yupResolver(tissuesAffectedSchema),
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
            Object.keys(data).forEach(key => trigger(key as keyof TissuesAffectedData)); // To trigger resolver errors 
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
        if (key === 'loc1') {
            setValue('loc1', value.toString());
        } else if (key === 'loc2') {
            setValue('loc2', value.toString());
        } else {
            setValue(key as keyof TissuesAffectedData, value);
        }
    }

    const tecidosAtingidosWatch = watch('tecidosAtingidos');

    useEffect(() => {
        if (moreOptions.indexOf(getValues('tecidosAtingidos')) == -1) {
            console.log('Resetting loca, loc1, loc2 and outros');
            setValue('loca', undefined);
            setValue('loc1', undefined);
            setValue('loc2', undefined);
            setValue('outros', undefined);
        }
    }, [tecidosAtingidosWatch]);

    return (
        <>
            <ThemedText type="title" style={styles.title}>Detalhes da Ferida (COMPLETO)</ThemedText>
            {fieldConfig.map(({ name, component: Component, label, props, isConditional, dependsOn, isRequired }) => {
                const shouldRender = !isConditional || 
                    (dependsOn && (
                        typeof dependsOn.value === 'function'
                            ? dependsOn.value(watch(dependsOn.field as keyof TissuesAffectedData))
                            : watch(dependsOn.field as keyof TissuesAffectedData) === dependsOn.value
                    ));

                if (!shouldRender) return null;

                return (
                    <React.Fragment key={name}>
                        {label && <ThemedText>{label}</ThemedText>}
                        <Component control={control} name={name} {...props} ref={isRequired ? getRef(name) : null} />
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