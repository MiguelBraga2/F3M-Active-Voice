import { useSpeechRecognition } from "@/hooks/useSpeechRecognition";
import { yupResolver } from "@hookform/resolvers/yup";
import { useEffect, useRef, useState } from "react";
import { StyleSheet } from 'react-native';
import { useForm } from "react-hook-form";
import * as yup from 'yup';
import { ThemedText } from "../ThemedText";
import { ControlledTextInput } from "../inputs/ControlledTextInput";
import { ControlledPicker } from "../inputs/ControlledPicker";
import React from "react";
import { ControlledDatePicker } from "../inputs/ControlledDatePicker";
import { ThemedButton } from "../ThemedButton";
import { TranscriptionBox } from "../TranscriptionBox";
import { useIsFocused } from "@react-navigation/native";
import { FieldConfig } from "@/types/fieldConfig";
import { useDynamicRefs } from "@/hooks/useDynamicRefs";
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './complete_form/utils';


export interface ClinicalInformationData {
    clinicalHistory: string;
    episodeType: string;
    episodeStartDate: string;
    internmentLocal?: string;
    consultationLocal?: string;
    episodeRoom?: string;
    episodeBed?: string;
    reasonForInternment?: string;
    reasonForFollowUp?: string;
}

interface ClinicalInformationFormProps {
    scrollToPosition: (yPosition: number) => void;
    initData: ClinicalInformationData;
    onSubmit: (data: ClinicalInformationData) => void;
    onPrevious: (data: ClinicalInformationData) => void;
}

const clinicalSchema = yup.object().shape({
    clinicalHistory: yup.string().required("O histórico clínico é obrigatório"),
    episodeType: yup.string().required("O tipo de episódio é obrigatório"),
    episodeStartDate: yup.string().required("A data de início do episódio é obrigatória"),
    internmentLocal: yup.string().when('episodeType', {
        is: (episodeType: string) => episodeType === "Internamento",
        then: schema => schema.required("O local de internamento é obrigatório"),
    }),
    consultationLocal: yup.string().when('episodeType', {
        is: (episodeType: string) => episodeType === "Consulta",
        then: schema => schema.required("O local de consulta é obrigatório"),
    }),
    episodeRoom: yup.string().matches(/^\d+$/, "O campo é um número").when('episodeType', {
        is: (episodeType: string) => episodeType === "Internamento",
        then: schema => schema.required("O quarto do paciente é obrigatório"),
    }),
    episodeBed: yup.string().matches(/^\d+$/, "O campo é um número").when('episodeType', {
        is: (episodeType: string) => episodeType === "Internamento",
        then: schema => schema.required("A cama do paciente é obrigatória"),
    }),
    reasonForInternment: yup.string().when('episodeType', {
        is: (episodeType: string) => episodeType === "Internamento",
        then: schema => schema.required("O motivo para internamento é obrigatório"),
    }),
    reasonForFollowUp: yup.string().when('episodeType', {
        is: (episodeType: string) => episodeType === "Consulta",
        then: schema => schema.required("O motivo para acompanhamento é obrigatório"),
    }),
});

var internmentLocalOptions = ["Hospital", "Rede Nacional de Cuidados Continuados Integrados", "Rede Nacional de Cuidados Paliativos", "Estrutura Residencial para Pessoas Idosas", "Unidade de Cuidados na Comunidade"];
var consultationLocalOptions = ["Unidade de Cuidados na Comunidade", "Consulta Ambulatório", "Domicílio"];
var episodeTypeOptions = ["Consulta", "Internamento"];
    
const fieldConfig: FieldConfig[] = [
    { name: 'clinicalHistory', component: ControlledTextInput, label: 'Introduza o histórico clínico do paciente', props: { placeholder: 'Introduza o histórico clínico do paciente' }, isRequired: true },
    { name: 'episodeType', component: ControlledPicker, label: 'Selecione o tipo de episódio', props: { placeholder: 'Selecione o tipo de episódio', options: episodeTypeOptions }, isRequired: true },
    { name: 'episodeStartDate', component: ControlledDatePicker, label: 'Introduza a data de início do episódio', props: { placeholder: 'Introduza o início do episódio' }, isRequired: true },
    { name: 'consultationLocal', component: ControlledPicker, label: 'Selecione o local de consulta', props: { placeholder: 'Selecione o local de consulta', options: consultationLocalOptions }, isConditional: true, dependsOn: { field: 'episodeType', value: 'Consulta' }, isRequired: false },
    { name: 'reasonForFollowUp', component: ControlledTextInput, label: 'Introduza o motivo de acompanhamento', props: { placeholder: 'Introduza o motivo de acompanhamento' }, isConditional: true, dependsOn: { field: 'episodeType', value: 'Consulta' }, isRequired: false },
    { name: 'internmentLocal', component: ControlledPicker, label: 'Selecione o local de internamento', props: { placeholder: 'Selecione o local de internamento', options: internmentLocalOptions }, isConditional: true, dependsOn: { field: 'episodeType', value: 'Internamento' }, isRequired: false },
    { name: 'episodeRoom', component: ControlledTextInput, label: 'Introduza o número do quarto do paciente', props: { placeholder: 'Introduza o quarto do paciente' }, isConditional: true, dependsOn: { field: 'episodeType', value: 'Internamento' }, isRequired: false },
    { name: 'episodeBed', component: ControlledTextInput, label: 'Introduza o número da cama do paciente', props: { placeholder: 'Introduza a cama do paciente' }, isConditional: true, dependsOn: { field: 'episodeType', value: 'Internamento' }, isRequired: false },
    { name: 'reasonForInternment', component: ControlledTextInput, label: 'Introduza o motivo para internamento', props: { placeholder: 'Introduza o motivo de admissão' }, isConditional: true, dependsOn: { field: 'episodeType', value: 'Internamento' }, isRequired: false },
];

const formRequestSchema = {
    type: "object",
    properties: {
        clinicalHistory: { type: "string", description: "O histórico clínico do paciente." },
        episodeType: { type: "string", enum: episodeTypeOptions, description: 'One of the values: "Consulta", "Internamento"' },
        episodeStartDate: { type: "string", description: "A data de início do episódio no formato (dd/MM/yyyy)." },
        internmentLocal: { type: "string", enum: internmentLocalOptions, description: 'One of the values: "Hospital", "Rede Nacional de Cuidados Continuados Integrados", "Rede Nacional de Cuidados Paliativos", "Estrutura Residencial para Pessoas Idosas", "Unidade de Cuidados na Comunidade"'},
        consultationLocal: { type: "string", enum: consultationLocalOptions , description: 'One of the values: "Unidade de Cuidados na Comunidade", "Consulta Ambulatório", "Domicílio"'},
        episodeRoom: { type: "number", description: "The room number where the patient is staying." },
        episodeBed: { type: "number", description: "The bed number where the patient is staying." },
        reasonForInternment: { type: "string", description: "The reason for admission." },
        reasonForFollowUp: { type: "string", description: "The reason for follow-up." },
    }
}

export function ClinicalInformationForm({ initData, onSubmit, onPrevious, scrollToPosition }: ClinicalInformationFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const { refs, getRef } = useDynamicRefs();
    const isFocused = useIsFocused(); 
    
    const { control, handleSubmit, setValue, getValues, trigger, watch } = useForm<ClinicalInformationData>({
        resolver: yupResolver(clinicalSchema),
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
        const result = await processStartRecording(formRequestSchema, fieldConfig, setFormValue, getValues, refs, scrollToPosition, setTranscriptionText, ['episodeBed', 'episodeRoom']);

        if (result) {
            const data = result.data ?? {};
            Object.keys(data).forEach(key => trigger(key as keyof ClinicalInformationData)); // To trigger resolver errors 
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

    useEffect(() => {
        if (getValues('episodeType') === "Consulta") {
            setValue('internmentLocal', undefined);
            setValue('episodeRoom', undefined);
            setValue('episodeBed', undefined);
            setValue('reasonForInternment', undefined);
        } 
        if (getValues('episodeType') === "Internamento") {
            setValue('consultationLocal', undefined);
            setValue('reasonForFollowUp', undefined);
        }
    }, [watch('episodeType')]);

    const setFormValue = (key: string, value: any) => {
        if (key === 'episodeBed' || key === 'episodeRoom' || key === 'consultationLocal' || key === 'reasonForFollowUp') {
            setValue('episodeType', 'Consulta');
        } else if (key === 'internmentLocal' || key === 'reasonForInternment') {
            setValue('episodeType', 'Internamento');
        }

        setValue(key as keyof ClinicalInformationData, value);    
    }
    
    return (
        <>
            <ThemedText type="title" style={styles.title}>Clinical Information Form</ThemedText>
            {fieldConfig.map(({ name, component: Component, label, props, isConditional, dependsOn, isRequired }) => {
                const shouldRender = !isConditional || (dependsOn && watch(dependsOn.field as keyof ClinicalInformationData) === dependsOn.value);
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
