import { ControlledDatePicker } from '../inputs/ControlledDatePicker';
import { ControlledTextInput } from '../inputs/ControlledTextInput';
import { ControlledPicker } from '../inputs/ControlledPicker';
import { TranscriptionBox } from '../TranscriptionBox';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useEffect, useRef, useState } from 'react';
import { ThemedButton } from '../ThemedButton';
import { ThemedText } from '../ThemedText';
import { useForm } from 'react-hook-form';
import { StyleSheet } from 'react-native';
import * as yup from 'yup';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useIsFocused } from '@react-navigation/native';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import { FieldConfig } from '@/types/fieldConfig';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './complete_form/utils';


export interface PersonInformationData {
    firstName: string;
    surname: string;
    age: string;
    gender: 'Masculino' | 'Feminino' | 'Outro';
    birthdate: string;
    profession?: string;
    nationality: string;
}

const personSchema = yup.object().shape({
    firstName: yup.string().min(2, "O primeiro nome deve ter pelo menos dois caracteres").required("O nome é obrigatório"),
    surname: yup.string().min(2, "O apelido deve ter pelo menos dois caracteres").required("O apelido é obrigatório"),
    age: yup.string().matches(/^[0-9]*$/, "A idade deve ser um número válido").required("A idade é obrigatória"),
    gender: yup.string().oneOf(['Masculino', 'Feminino', 'Outro'], "Selecione um gênero válido").required("O género é obrigatório"),
    birthdate: yup.string().required("A data de nascimento é obrigatória"),
    profession: yup.string(),
    nationality: yup.string().required("A nacionalidade é obrigatória")
});

const fieldConfig: FieldConfig[] = [
    { name: 'firstName', component: ControlledTextInput, props: { placeholder: 'Introduza o seu nome' }, label: 'Primeiro Nome', isRequired: true },
    { name: 'surname', component: ControlledTextInput, props: { placeholder: 'Introduza o seu apelido' }, label: 'Apelido', isRequired: true },
    { name: 'birthdate', component: ControlledDatePicker, props: { placeholder: 'Introduza a data de nascimento' }, label: 'Data de Nascimento', isRequired: true },
    { name: 'age', component: ControlledTextInput, props: { placeholder: 'Introduza a sua idade', keyboardType: 'numeric' }, label: 'Idade', isRequired: true },
    { name: 'gender', component: ControlledPicker, props: { placeholder: 'Selecione o seu género', options: ['Masculino', 'Feminino', 'Outro'] }, label: 'Género', isRequired: true },
    { name: 'profession', component: ControlledTextInput, props: { placeholder: 'Introduza a sua profissão' }, label: 'Profissão', isRequired: false },
    { name: 'nationality', component: ControlledTextInput, props: { placeholder: 'Introduza a sua nacionalidade' }, label: 'Nacionalidade', isRequired: true },
];

const formRequestSchema = {
    type: "object",
    properties: {
        firstName: { type: "string", description: "The person's first name" },
        surname: { type: "string", description: "The person's last name" },
        birthdate: { type: "string", description: "The person's date in the format dd/MM/yyyy. Please ensure it follows this format." },
        age: { type: "number", description: "The person's age" },
        gender: { type: "string", enum: fieldConfig.find(field => field.name === 'gender')?.props.options },
        profession: { type: "string", description: "The person's profession or job" },
        nationality: { type: "string", description: "The person's nationality" }
    },
    required: [],
};

interface PersonInformationFormProps {
    initData: PersonInformationData;
    onSubmit: (data: PersonInformationData) => void;
    scrollToPosition: (yPosition: number) => void;
}

export function PersonInformationForm({ initData, onSubmit, scrollToPosition }: PersonInformationFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { refs, getRef } = useDynamicRefs();
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const isFocused = useIsFocused();
    const { control, handleSubmit, setValue, getValues, trigger } = useForm<PersonInformationData>({
        resolver: yupResolver(personSchema),
        defaultValues: initData,
    });

    const handleShowTranscription = () => transcriptionBoxRef.current?.toggleExpand();

    const handleStartRecording = async () => {
        const result = await processStartRecording(formRequestSchema, fieldConfig, setFormValue, getValues, refs, scrollToPosition, setTranscriptionText, ['age']);

        if (result) {
            const data = result.data ?? {};
            Object.keys(data).forEach(key => trigger(key as keyof PersonInformationData)); // To trigger resolver errors 
        }
    };

    const handleAdvance = () => {
        const onError = async () => {
            await speakAndScrollMissingFields(fieldConfig, getValues, refs, scrollToPosition, speakMissingFields);
        }
        handleSubmit(onSubmit, onError)();
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
                { regex: /\b(?:ajuda|assistente)\b/i, action: "helpAssistant", handler: handleHelpAssistant },
            ]);
        }
    }, [isFocused]);

    const setFormValue = (key: string, value: any) => {
        setValue(key as keyof PersonInformationData, value);
    }

    return (
        <>
            <ThemedText type="title" style={styles.title}>Person Information Form</ThemedText>
            {fieldConfig.map(({ name, component: Component, label, props }) => (
                <React.Fragment key={name}>
                    <ThemedText>{label}</ThemedText>
                    <Component {...props} name={name} control={control} ref={getRef(name)} />
                </React.Fragment>
            ))}
            <ThemedButton title="Próximo" onPress={handleAdvance} />
            { isSpeaking && <ThemedButton title="Parar" onPress={stopSpeaking} style={styles.loading} /> }
            <TranscriptionBox ref={transcriptionBoxRef} text={transcriptionText} />
        </>
    );
}

const styles = StyleSheet.create({
    title: {
        textAlign: 'center',
        marginBottom: 20,
    },
    loading: {
        marginTop: 10,
    },
});