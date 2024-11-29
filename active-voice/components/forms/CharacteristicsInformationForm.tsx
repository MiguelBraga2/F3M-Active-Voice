import { recordAudioAndGetFormData,recordAudioAndGetAnswer } from "@/hooks/useActiveVoice";
import { scrollToFirstMissingField } from '@/hooks/useScrollToFirstMissingField';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { yupResolver } from '@hookform/resolvers/yup';
import React, { useEffect } from 'react';
import { useRef, useState } from 'react';
import { useForm } from 'react-hook-form';
import * as yup from 'yup';
import { StyleSheet, View, Text } from 'react-native';
import { ThemedText } from '../ThemedText';
import { ControlledRadioGroup } from '../inputs/ControlledRadioGroup';
import { ControlledPicker } from '../inputs/ControlledPicker';
import { ControlledTextInput } from '../inputs/ControlledTextInput';
import { ThemedButton } from '../ThemedButton';
import { TranscriptionBox } from '../TranscriptionBox';
import { useThemeColor } from '@/hooks/useThemeColor';
import { ThemedCheckbox } from '../inputs/ThemedCheckbox';
import { useIsFocused } from '@react-navigation/native';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import Tts from 'react-native-tts';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './complete_form/utils';


export interface CharacteristicsInformationData {
    authorization: boolean;
    skinPhototype: string;
    associatedDiseases: string;
    associatedDiseasesDetails?: string;
    historyVascularSurgeries: string;
    tobacco: string;
    actualMedication: string;
    actualMedicationDetails?: string;
    allergies: string;
    allergiesDetails?: string;
    seriouslyIll: string;
    weight?: string;
    height?: string;
    weightPossible: boolean;
    heightPossible: boolean;
}

interface CharacteristicsInformationFormProps {
    initData: CharacteristicsInformationData;
    onSubmit: (data: CharacteristicsInformationData) => void;
    onPrevious: (data: CharacteristicsInformationData) => void;
    scrollToPosition: (yPosition: number) => void;
}

const formRequestSchema = {
    type: "object",
    properties: {
        authorization: { type: "boolean", description: "Autorização para estudo" },
        skinPhototype: { type: "string", enum: ["Fototipo 1", "Fototipo 2", "Fototipo 3", "Fototipo 4", "Fototipo 5"],cdescription: "Fototipo de pele" },
        associatedDiseases: { type: "string", enum: ["yes", "no"],description: "Doenças ou condições associadas" },
        associatedDiseasesDetails: { type: "string", enum: ["Diabetes", "Doença Renal e/ou diálise", "Doença Autoimune", "Doença arterial periférica", "Doença venosa periférica", "Episódio Atual ou História de Trombose Venosa Profunda", "Insuficiência Cardíaca Congestiva", "Anemia", "Doença Aterosclerótica", "Hipertensão Arterial", "Doença oncológica", "Malnutrição", "Outro"], description: "Detalhes das doenças ou condições associadas" },
        historyVascularSurgeries: { type: "string", enum: ["yes", "no", "can't get"],description: "História de cirurgia vascular prévia" },
        tobacco: { type: "string", enum: ["yes", "no", "can't get"], description: "Se consumiu ou não tabaco nos últimos 6 meses" },
        actualMedication: { type: "string", enum: ["yes", "no"],description: "Medicação atual" },
        actualMedicationDetails: { type: "string", enum: ["Corticóides", "Anti-Inflamatórios não Esteróides", "Vasopresssores", "Anti-Coagulantes", "Imunosupressores", "Quimioterapia", "Insulina", "Outro"], description: "Detalhes da medicação atual" },
        allergies: { type: "string", enum: ["unaware", "yes", "can't get"],description: "Alergias e sensibilidades de pele" },
        allergiesDetails: { type: "string", description: "Indique quais"},
        seriouslyIll: { type: "string", enum: ["yes", "no"], description: "Gravemente doente e falta de ingestão nutricional ou probabilidade de não haver ingestão nutricional há mais de 5 dias" },
        weight: { type: "string", description: "Peso (Kg)" },
        height: { type: "string", description: "Altura (m)" },
        weightPossible: { type: "boolean", description: "É possível obter o peso" },
        heightPossible: { type: "boolean", description: "É possível obter a altura" },
    },
    required: []
};

const characteristicsSchema = yup.object().shape({
    authorization: yup.boolean().required("Por favor informe a autorização para estudo"),
    skinPhototype: yup.string().required("Por favor informe o fototipo de pele"),
    associatedDiseases: yup.string().required("Por favor informe se existem patologias associadas"),
    associatedDiseasesDetails: yup.string(),
    historyVascularSurgeries: yup.string().required("Por favor innforme se existe história de cirurgia vascular prévia"),
    tobacco: yup.string().required("Por favor informe se consumiu tabaco nos últimos 6 meses"),
    actualMedication: yup.string().required("Por favor informe se toma medicação atualmente"),
    actualMedicationDetails: yup.string(),
    allergies: yup.string().required("Por favor informe se tem alergias ou sensibilidades de pele"),
    allergiesDetails: yup.string(),
    seriouslyIll: yup.string().required("Por informe se está gravemente doente"),
    weight: yup.string().matches(/^\d+(\.\d+)?$/, "Por favor insira um valor numérico").when('weightPossible', {
        is: (weightPossible: boolean) => weightPossible,
        then: schema => schema.required("Por favor informe o peso")
    }),
    height: yup.string().matches(/^\d+(\.\d+)?$/, "Por favor insira um valor numérico").when('heightPossible', {
        is: (heightPossible: boolean) => heightPossible,
        then: schema => schema.required("Por favor informe a altura")
    }),
    weightPossible: yup.boolean().required(),
    heightPossible: yup.boolean().required(),
});

const ttsMapping: Record<string, string> = {
    authorization: "Autorização para estudo",
    skinPhototype: "Fototipo de pele",
    associatedDiseases: "Doenças ou condições associadas",
    associatedDiseasesDetails: "Detalhes das doenças ou condições associadas",
    historyVascularSurgeries: "História de cirurgia vascular prévia",
    tobacco: "Tabaco nos últimos 6 meses",
    actualMedication: "Medicação atual",
    actualMedicationDetails: "Detalhes da medicação atual",
    allergies: "Alergias e sensibilidades de pele",
    allergiesDetails: "Indique quais",
    seriouslyIll: "Gravemente doente e falta de ingestão nutricional ou probabilidade de não haver ingestão nutricional há mais de 5 dias",
    weight: "Peso (Kg)",
    height: "Altura (m)",
    weightPossible: "É possível obter o peso",
    heightPossible: "É possível obter a altura",
};

export function CharacteristicsInformationForm({ initData, onSubmit, onPrevious, scrollToPosition }: CharacteristicsInformationFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const [formData, setFormData] = useState<any>({});
    const { setCommands, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const { refs, getRef } = useDynamicRefs<any>();
    const isFocused = useIsFocused();
    
    const { control, handleSubmit, setValue, getValues, watch } = useForm<CharacteristicsInformationData>({
        resolver: yupResolver(characteristicsSchema),
        defaultValues: {heightPossible: initData.heightPossible ?? true, weightPossible: initData.weightPossible ?? true},
    });

    const setFormValue = (key: string, value: any) => {
        setValue(key as keyof CharacteristicsInformationData, value);
    }

    const handleAdvance = () => {
        handleSubmit(onSubmit)();

        const missingFields = Object.keys(characteristicsSchema.fields).filter(field => !formData[field]);
        if (missingFields.length > 1) {
            const missingFieldsText = missingFields.map(field => ttsMapping[field]).join(', ');
            Tts.speak(`Os campos ${missingFieldsText} não foram preenchidos. Por favor preencha os campos em falta.`);
        }
        else if (missingFields.length === 1) {
            const missingField = missingFields[0];
            Tts.speak(`O campo ${ttsMapping[missingField]} não foi preenchido. Por favor preencha o campo em falta.`);
        }
    };

    const handleGoBack = () => onPrevious(getValues());
    const handleShowTranscription = () => transcriptionBoxRef.current?.toggleExpand();

    const handleStartRecording = async () => {
        const result = await recordAudioAndGetFormData(formRequestSchema);

        const formData = result?.data ?? {};
        setFormData(formData);
        setTranscriptionText(result?.text ?? '');

        const missingFields = Object.keys(ttsMapping).filter(key => !formData[key]);
        if (missingFields.length > 1) {
            const missingFieldsText = missingFields.map(field => ttsMapping[field]).join(', ');
            Tts.speak(`Os campos ${missingFieldsText} não foram preenchidos`);
        }
        else if (missingFields.length == 1) {
            Tts.speak(`O campo ${ttsMapping[missingFields[0]]} não foi preenchido`);
        }

        scrollToFirstMissingField(missingFields, refs, scrollToPosition);
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

    const optionAuthorization = ["Confirmo que o participante tomou conhecimento e assinou o consentimento informado"]
    const optionsAssociatedDiseases = ["Diabetes", "Doença Renal e/ou diálise", "Doença Autoimune", "Doença arterial periférica", "Doença venosa periférica", "Episódio Atual ou História de Trombose Venosa Profunda", "Insuficiência Cardíaca Congestiva", "Anemia", "Doença Aterosclerótica", "Hipertensão Arterial", "Doença oncológica", "Malnutrição", "Outro"];
    const optionsActualMedication = ["Corticóides", "Anti-Inflamatórios não Esteróides", "Vasopresssores", "Anti-Coagulantes", "Imunosupressores", "Quimioterapia", "Insulina", "Outro"];
    const associatedDiseasesWatch = watch('associatedDiseases');
    const actualMedicationWatch = watch('actualMedication');
    const allergiesWatch = watch('allergies');
    const seriouslyIllWatch = watch('seriouslyIll');
    const weightWatch = watch('weight');
    const heightWatch = watch('height');
    const weightPossibleWatch = watch('weightPossible');
    const heightPossibleWatch = watch('heightPossible');

    useEffect(() => {
        if (weightWatch && typeof weightWatch === 'string') {
            setValue('weightPossible', true);
        }
    }, [weightWatch]);

    useEffect(() => {
        if (!weightPossibleWatch && typeof weightPossibleWatch === 'boolean') {
            setValue('weight', '');
        }
    }, [weightPossibleWatch]);

    useEffect(() => {
        if (heightWatch && typeof heightWatch === 'string') {
            setValue('heightPossible', true);
        }
    }, [heightWatch]);

    useEffect(() => {
        if (!heightPossibleWatch && typeof heightPossibleWatch === 'boolean') {
            setValue('height', '');
        }
    }, [heightPossibleWatch]);

    return (
        <>
            <ThemedText type="title" style={styles.title}>Clinical Information Form</ThemedText>

            <ThemedText type="subtitle">Autorização para estudo</ThemedText>

            <View style={[styles.container, { borderColor: useThemeColor({}, 'placeholder') }]}>
                <View style={styles.checkboxContainer}>
                    <ThemedCheckbox
                        status={watch('authorization') ? 'checked' : 'unchecked'}
                        onPress={() => setValue('authorization', !watch('authorization'))}
                    />
                    <ThemedText>{optionAuthorization}</ThemedText>
                </View>
            </View>

            <ThemedText type="subtitle">Fototipo de pele</ThemedText>

            <ControlledRadioGroup 
                ref={getRef("skinPhototype")}
                control={control}
                name="skinPhototype"
                options={[
                    { value: "Fototipo 1", label: <Text>Fototipo 1: extremamente branca (Pele clara, muitas vezes com sardas; Cabelos loiros ou ruivos; Olhos azuis ou verdes)</Text>},
                    { value: "Fototipo 2", label: <Text>Fototipo 2: branca (Pele clara, mas um pouco mais escura que a do tipo 1; Cabelo loiro a loiro escuro; Olhos azuis ou verdes)</Text>},
                    { value: "Fototipo 3", label: <Text>Fototipo 3: morena clara (Pele um pouco mais escura; Cabelo loiro escuro a castanho; Cor dos olhos variável)</Text>},
                    { value: "Fototipo 4", label: <Text>Fototipo 4: média (Pele castanho claro; Cabelo castanho-escuro ou preto; Olhos escuros)</Text>},
                    { value: "Fototipo 5", label: <Text>Fototipo 5: morena escura (Pele média a escura; Cabelo castanho ou preto; Olhos escuros)</Text>},
                    { value: "Fototipo 6", label: <Text>Fototipo 6: negra (Pele escura ou muito escura; Cabelo preto; Olhos escuros)</Text>},
                  ]}
            />

            <ThemedText type="subtitle">Doenças ou condições associadas</ThemedText>

            <ControlledRadioGroup
                ref={getRef("associatedDiseases")}
                control={control}
                name="associatedDiseases"
                options={[
                    { value: "yes", label: "Sim" },
                    { value: "no", label: "Não" },
                ]}
            />

            {associatedDiseasesWatch === "yes" && (
                <ControlledPicker
                    ref={getRef("associatedDiseasesDetails")}
                    control={control}
                    name="associatedDiseasesDetails"
                    options={optionsAssociatedDiseases}
                />
            )}

            <ThemedText type="subtitle">História de cirurgia vascular prévia</ThemedText>

            <ControlledRadioGroup
                ref={getRef("historyVascularSurgeries")}
                control={control}
                name="historyVascularSurgeries"
                options={[
                    { value: "yes", label: "Sim" },
                    { value: "no", label: "Não" },
                    { value: "can't get", label: "Não é possível obter" },
                ]}
            />

            <ThemedText type="subtitle">Tabaco nos últimos 6 meses</ThemedText>

            <ControlledRadioGroup
                ref={getRef("tobacco")}
                control={control}
                name="tobacco"
                options={[
                    { value: "yes", label: "Sim" },
                    { value: "no", label: "Não" },
                    { value: "can't get", label: "Não é possível obter" },
                ]}
            />

            <ThemedText type="subtitle">Medicação atual</ThemedText>

            <ControlledRadioGroup
                ref={getRef("actualMedication")}
                control={control}
                name="actualMedication"
                options={[
                    { value: "yes", label: "Sim" },
                    { value: "no", label: "Não" },
                ]}
            />

            {actualMedicationWatch === "yes" && (
                <ControlledPicker
                    ref={getRef("actualMedicationDetails")}
                    control={control}
                    name="actualMedicationDetails"
                    options={optionsActualMedication}
                />
            )}

            <ThemedText type="subtitle">Alergias e sensibilidades de pele</ThemedText>

            <ControlledRadioGroup
                ref={getRef("allergies")}
                control={control}
                name="allergies"
                options={[
                    { value: "unaware", label: "Desconhece" },
                    { value: "yes", label: "Sim" },
                    { value: "can't get", label: "Não é possível obter" },
                ]}
            />

            {allergiesWatch === "yes" && (

                <><ThemedText>Indique quais:</ThemedText><ControlledTextInput
                    ref={getRef("allergiesDetails")}
                    control={control}
                    name="allergiesDetails"
                    keyboardType="default"
                    placeholder="Descreva aqui" /></>

            )}

            <ThemedText type="subtitle">Gravemente doente e falta de ingestão nutricional ou probabilidade de não haver ingestão nutricional há mais de 5 dias</ThemedText>

            <ControlledRadioGroup
                ref={getRef("seriouslyIll")}
                control={control}
                name="seriouslyIll"
                options={[
                    { value: "yes", label: "Sim" },
                    { value: "no", label: "Não" },
                ]}
            />

            {seriouslyIllWatch === "yes" && (
                <ThemedText style={styles.textBlack}> Recomenda-se rastreio e avaliação nutricional de acordo com as politicas da Instituição</ThemedText>
            )}

            <ThemedText type="subtitle">Peso, Altura e IMC</ThemedText>

            <ThemedText>Peso (Kg)</ThemedText>
            <ControlledTextInput
                ref={getRef("weight")}
                control={control}
                name="weight"
                keyboardType="numeric"
                placeholder="Insira aqui o peso" />

            <View style={[styles.container, { borderColor: useThemeColor({}, 'placeholder') }]}>
                <View style={styles.checkboxContainer}>
                    <ThemedCheckbox
                        status={weightPossibleWatch ? 'unchecked' : 'checked'}
                        onPress={() =>setValue('weightPossible', !weightPossibleWatch)}
                    />
                    <ThemedText>{'Não é possível obter'}</ThemedText>
                </View>
            </View>

            <ThemedText>Altura (m)</ThemedText>
            <ControlledTextInput
                ref={getRef("height")}
                control={control}
                name="height"
                keyboardType="numeric"
                placeholder="Insira aqui a altura" />

            <View style={[styles.container, { borderColor: useThemeColor({}, 'placeholder') }]}>
                <View style={styles.checkboxContainer}>
                    <ThemedCheckbox
                        status={heightPossibleWatch ? 'unchecked' : 'checked'}
                        onPress={() => setValue('heightPossible', !heightPossibleWatch)}
                    />
                    <ThemedText>{'Não é possível obter'}</ThemedText>
                </View>
            </View>

            {weightWatch && heightWatch && (
                <ThemedText style={styles.textBlack}>IMC: {(parseFloat(weightWatch || '0') / (parseFloat(heightWatch || '1') * parseFloat(heightWatch || '1'))).toFixed(2)} kg/m&#178; </ThemedText>
            )}

            <ThemedButton title="Submeter" onPress={handleAdvance} />
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
    textBlack: {
        color: '#000',
    },
    checkboxContainer: {
        paddingVertical: 5,
        flexDirection: 'row',
        alignItems: 'center',
    },
    container: {
        borderWidth: 1,
        borderRadius: 5,
        marginBottom: 10,
    },
});
