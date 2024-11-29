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
import React from 'react';
import { useIsFocused } from '@react-navigation/native';
import { FieldConfig } from '@/types/fieldConfig';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import styles from './Stylesheet.styles';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './utils';

export interface injuryTipologyData {
    tipologiaFerida: string;
    ulceraPeDiabetico?: string;
    ulceraPerna?: string;
    ulceraPressao?: string;
    outro?: string;
}

const injuryTipologySchema = yup.object().shape({
    tipologiaFerida: yup.string().required("Indique a tipologia da ferida"),
    ulceraPeDiabetico: yup.string().when('tipologiaFerida', {
        is: (tipologiaFerida: string) => tipologiaFerida === 'Úlcera em pé diabético',
        then: schema => schema.required("Campo obrigatório para úlcera em pé diabético"),
    }),
    ulceraPerna: yup.string().when('tipologiaFerida', {
        is:  (tipologiaFerida: string) => tipologiaFerida === 'Úlcera de perna',
        then: schema => schema.required("Campo obrigatório para úlcera de perna"),
    }),
    ulceraPressao: yup.string().when('tipologiaFerida', {
        is:  (tipologiaFerida: string) => tipologiaFerida === 'Úlcera por pressão',
        then: schema => schema.required("Campo obrigatório para úlcera por pressão"),
    }),
    outro: yup.string().when('tipologiaFerida', {
        is: (tipologiaFerida: string) => tipologiaFerida === 'Outro',
        then: schema => schema.required("Campo obrigatório para outro tipo de ferida"),
    })
});

interface injuryTipologyFormProps {
    initData: injuryTipologyData;
    onSubmit: (data: injuryTipologyData) => void;
    onPrevious: (data: injuryTipologyData) => void;
    scrollToPosition: (yPosition: number) => void;
}

const optionsTipologia = [
    { label: 'Úlcera em pé diabético', value: 'Úlcera em pé diabético'},
    { label: 'Úlcera por pressão', value: 'Úlcera por pressão'},
    { label: 'Úlcera por pressão associada a dispositivos médicos', value: 'Úlcera por pressão associada a dispositivos médicos'},
    { label: 'Úlcera por pressão nas mucosas', value: 'Úlcera por pressão nas mucosas'},
    { label: 'Úlcera arterial', value: 'Úlcera arterial'},
    { label: 'Úlcera de perna', value: 'Úlcera de perna'},
    { label: 'Ferida traumática', value: 'Ferida traumática'},
    { label: 'Ferida cirúrgica', value: 'Ferida cirúrgica'},
    { label: 'Queimadura', value: 'Queimadura'},
    { label: 'Quebra cutânea', value: 'Quebra cutânea'},
    { label: 'Dermatite associada à incontinência', value: 'Dermatite associada à incontinência'},
    { label: 'Ferida Maligna', value: 'Ferida Maligna'},
    { label: 'Outro', value: 'Outro'},
]

const ulceraPressaoOptions = [
    { label: 'UPP 1 - Eritema não branqueável (através de pressão manual ou método de disco transparente durante 3 segundos)', value: 'UPP 1 - Eritema não branqueável (através de pressão manual ou método de disco transparente durante 3 segundos)'},
    { label: 'UPP 2 - Perda parcial da espessura da pele', value: 'UPP 2 - Perda parcial da espessura da pele'},
    { label: 'UPP 3 - Perda total da espessura da pele', value: 'UPP 3 - Perda total da espessura da pele'},
    { label: 'UPP 4 - Perda total da espessura dos tecidos', value: 'UPP 4 - Perda total da espessura dos tecidos'},
    { label: 'Inclassificável - Profundidade Indeterminada', value: 'Inclassificável - Profundidade Indeterminada'},
    { label: 'Suspeita de lesão dos tecidos profundos - Profundidade Indeterminada', value: 'Suspeita de lesão dos tecidos profundos - Profundidade Indeterminada'},
]

const peDiabeticoOptions = [
    { label: 'Isquémico', value: 'Isquémico'},
    { label: 'Neuroisquémico', value: 'Neuroisquémico'},
    { label: 'Neuropático', value: 'Neuropático'},
    { label: 'Etiologia Desconhecida', value: 'Etiologia Desconhecida'},
]

const pernaOptions = [
    { label: 'Mista', value: 'Mista'},
    { label: 'Arterial', value: 'Arterial'},
    { label: 'Venosa', value: 'Venosa'},
    { label: 'Etiologia Desconhecida', value: 'Etiologia Desconhecida'},
]

const fieldConfig: FieldConfig[] = [
    { name: 'tipologiaFerida', component: ControlledRadioGroup, label: 'Tipologia da Ferida', props: { options: optionsTipologia }, isRequired: true },
    { name: 'ulceraPeDiabetico', component: ControlledRadioGroup, label: 'Úlcera em pé diabético', props: { options: peDiabeticoOptions }, isRequired: false , isConditional:true, dependsOn: { field: 'tipologiaFerida', value: 'Úlcera em pé diabético' } },
    { name: 'ulceraPerna', component: ControlledRadioGroup, label: 'Úlcera de perna', props: { options: pernaOptions }, isRequired: false , isConditional:true, dependsOn: { field: 'tipologiaFerida', value: 'Úlcera de perna' } },
    { name: 'ulceraPressao', component: ControlledRadioGroup, label: 'Úlcera por pressão', props: { options: ulceraPressaoOptions }, isRequired: false , isConditional:true, dependsOn: { field: 'tipologiaFerida', value: 'Úlcera por pressão' } },
    { name: 'outro', component: ControlledTextInput, label: 'Qual tipologia?', props: { keyboardType: 'default', placeholder: 'Outra Topologia' }, isRequired: false , isConditional:true, dependsOn: { field: 'tipologiaFerida', value: 'Outro' } }
];

const formRequestSchema = {
    type: "object",
    properties: {
        tipologiaFerida: {type: "string", enum: optionsTipologia.map(option => option.value)},
        ulceraPeDiabetico: {type: "string", enum: peDiabeticoOptions.map(option => option.value)},
        ulceraPerna: {type: "string", enum: pernaOptions.map(option => option.value)},
        ulceraPressao: {type: "string", enum: ulceraPressaoOptions.map(option => option.value)},
        outro: {type: "string", description: "Another tipology"},
    },
    required: []
}

export function InjuryTipologyForm({ initData, onSubmit, onPrevious, scrollToPosition }: injuryTipologyFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const { refs, getRef } = useDynamicRefs();
    const isFocused = useIsFocused();

    const { control, handleSubmit, setValue, getValues, trigger, watch } = useForm<injuryTipologyData>({
        resolver: yupResolver(injuryTipologySchema),
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
            Object.keys(data).forEach(key => trigger(key as keyof injuryTipologyData)); // To trigger resolver errors 
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
        if (key == 'ulceraPeDiabetico') {
            setValue('ulceraPeDiabetico', value);
            setValue('tipologiaFerida', 'Úlcera em pé diabético');
        } else if (key == 'ulceraPerna') {
            setValue('ulceraPerna', value);
            setValue('tipologiaFerida', 'Úlcera de perna');
        } else if (key == 'ulceraPressao') {
            setValue('ulceraPressao', value);
            setValue('tipologiaFerida', 'Úlcera por pressão');
        } else if (key == 'outro') {
            setValue('outro', value);
            setValue('tipologiaFerida', 'Outro');
        } else if (key == 'tipologiaFerida') {
            setValue('tipologiaFerida', value);
        }

        setValue(key as keyof injuryTipologyData, value);
    }

    const tipologiaFeridaWatch = watch('tipologiaFerida');
    useEffect(() => {
        const tipologia = getValues('tipologiaFerida');
        if (!(tipologia === 'Úlcera em pé diabético'))
            setValue('ulceraPeDiabetico', undefined);
        if (!(tipologia === 'Úlcera de perna'))
            setValue('ulceraPerna', undefined);
        if (!(tipologia === 'Úlcera por pressão'))
            setValue('ulceraPressao', undefined);
        if (!(tipologia === 'Outro'))
            setValue('outro', undefined);
    }, [tipologiaFeridaWatch]);

    return (
        <>
            <ThemedText type="title" style={styles.title}>Tipologia da Ferida (AMBOS)</ThemedText>
            {fieldConfig.map(({ name, component: Component, label, props, isConditional, dependsOn, isRequired }) => {
                const shouldRender = !isConditional || (dependsOn && watch(dependsOn.field as keyof injuryTipologyData) === dependsOn.value);
                if (!shouldRender) return null;

                return (
                    <React.Fragment key={name}>
                        {label === '' ? <ThemedText>{label}</ThemedText> : null}
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