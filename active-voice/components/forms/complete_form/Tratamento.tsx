import { ControlledCheckboxGroup } from '@/components/inputs/ControlledCheckboxGroup';
import { ControlledRadioGroup } from '@/components/inputs/ControlledRadioGroup';
import { ControlledDatePicker } from '@/components/inputs/ControlledDatePicker';
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
import { ControlledTextInput } from '@/components/inputs/ControlledTextInput';
import { useIsFocused } from '@react-navigation/native';
import { FieldConfig } from '@/types/fieldConfig';
import { useDynamicRefs } from '@/hooks/useDynamicRefs';
import styles from './Stylesheet.styles';
import { processFormDataWithAssistant, processStartRecording, speakAndScrollMissingFields } from './utils';

export interface TreatmentData {
    limpeza: string[];
    desbridamento: string;
    tipoDesbridamento?: string[];
    principiosAtivos: string;
    cjtoPrincipiosAtivos?: string[];
    principiosAtivosOutros?: string;
    terapiasComplementares: string;
    cjtoTerapiasComplementares?: string[];
    terapiasComplementaresOutro?: string;
    fixaçãoComplementar: string;
    cjtoFixaçãoComplementar?: string[];
    fixaçãoComplementarOutro?: string;
    freqTratamento: string;
    variasVezesPorDia?: string[];
    variasVezesPorSemana?: string[];
    proxMonitorização: string;
}

const TreatmentSchema = yup.object().shape({
    limpeza: yup.array().of(yup.string().required()).min(1, "Selecione pelo menos uma opção").required("Indique o tipo de limpeza"),
    desbridamento: yup.string().required("Indique se tem desbridamento"),
    tipoDesbridamento: yup.array().of(yup.string().required()).min(1, "Selecione pelo menos uma opção").when("desbridamento", {
        is: (desbridamento: string) => desbridamento == "yes",
        then: schema => schema.required("Selecione pelo menos uma opção"),
    }),
    principiosAtivos: yup.string().required("Indique os princípios ativos"),
    cjtoPrincipiosAtivos: yup.array().of(yup.string().required()).min(1, "Selecione pelo menos uma opção").when("principiosAtivos", {
        is: (principiosAtivos: string) => principiosAtivos == "yes",
        then: schema => schema.required("Selecione pelo menos uma opção"),
    }),
    principiosAtivosOutros: yup.string().when("cjtoPrincipiosAtivos", {
        is: (cjtoPrincipiosAtivos: string[] | undefined) => cjtoPrincipiosAtivos ? cjtoPrincipiosAtivos.includes("Outro") : false,
        then: schema => schema.required("Indique qual"),
    }),
    terapiasComplementares: yup.string().required("Indique se tem terapias complementares"),
    cjtoTerapiasComplementares: yup.array().of(yup.string().required()).min(1, "Selecione pelo menos uma opção").when("terapiasComplementares", {
        is: (terapiasComplementares: string) => terapiasComplementares == "yes",
        then: schema => schema.required("Selecione pelo menos uma opção"),
    }),
    terapiasComplementaresOutro: yup.string().when("cjtoTerapiasComplementares", {
        is: (cjtoTerapiasComplementares: string[] | undefined) => cjtoTerapiasComplementares ? cjtoTerapiasComplementares.includes("Outro") : false,
        then: schema => schema.required("Indique qual"),
    }),
    fixaçãoComplementar: yup.string().required("Indique se tem fixação complementar"),
    cjtoFixaçãoComplementar: yup.array().of(yup.string().required()).min(1, "Selecione pelo menos uma opção").when("fixaçãoComplementar", {
        is: (fixaçãoComplementar: string) => fixaçãoComplementar == "yes",
        then: schema => schema.required("Selecione pelo menos uma opção"),
    }),
    fixaçãoComplementarOutro: yup.string(),
    freqTratamento: yup.string().required("Indique a frequência do tratamento"),
    variasVezesPorDia: yup.array().of(yup.string().required()).min(1, "Selecione pelo menos uma opção").when("freqTratamento", {
        is: (freqTratamento: string) => freqTratamento == "Várias Vezes Por Dia",
        then: schema => schema.required("Seleciona pelo menos uma opção"),
    }),
    variasVezesPorSemana: yup.array().of(yup.string().required()).min(1, "Selecione pelo menos uma opção").when("freqTratamento", {
        is: (freqTratamento: string) => freqTratamento == "Várias Vezes por Semana",
        then: schema => schema.required("Seleciona pelo menos uma opção"),
    }),
    proxMonitorização: yup.string().required("Indique para quando está marcada a próxima monitorização completa"),
});

interface TreatmentFormProps {
    initData: TreatmentData;
    onSubmit: (data: TreatmentData) => void;
    onPrevious: (data: TreatmentData) => void;
    scrollToPosition: (yPosition: number) => void;
}

const options = [
    { label: 'Não', value: 'no' },
    { label: 'Sim', value: 'yes' },
];

const freqOptions = [
    { label: 'Várias Vezes Por Dia', value: 'Várias Vezes Por Dia' },
    { label: 'Diário', value: 'Diário' },
    { label: 'Dias Alternados', value: 'Dias Alternados' },
    { label: 'Uma vez por semana', value: 'Uma vez por semana' },
    { label: 'Várias Vezes por semana', value: 'Várias Vezes por Semana' },
];

const limpezaOptions = [
    'Água da torneira',
    'Água esterilizada',
    'Dicloridrato de Octenidina (OCT)',
    'Iodopovidona',
    'Polihexametileno de Biguanida (PHMB)',
    'Solução superoxidade [(Ácido hipocloroso (HOCL) e Hipoclorito de sódio (NAOCL)]',
    'Soro fisiológico 0,9%',
    'Surfactantes (poloxamer 407, betaína)',
    'Outro',
    'Não se aplica (N/A)',
];

const tipoDesbridamentoOptions = [
    'Autolítico',
    'Cirúrgico',
    'Cortante',
    'Enzimático',
    'Larvar',
    'Mecânico',
    'Químico',
];

const fixaçãoOptions = [
    'Adesivo',
    'Ligadura',
    'Terapia compressiva moderada (40mmHg)/curta tração',
    'Terapia compressiva leve (20mmHg)/curta tração',
    'Ligadura elástica/longa tração',
    'Meias de compressão elástica',
    'Dispositivo de compressão ajustável',
    'Ligadura de óxido de Zinco ou Bota de Unna',
    'Outro',
]

const principiosAtivosOptions = [ // Penso que não estão todos
    'Poliacrilato com solução de Ringer',
    'Poliacrilatos com PHMB',
    'Colagenase',
    'Fibras de Poliacrilato com núcleo acrílico',
    'Alginogel',
    'Alginato de cálcio',
    'Fibras Gelificantes de Alta Densidade',
    'Espuma de poliuretano para transferência de exsudado',
    'Espuma de poliuretano cavitária',
    'Espuma de poliuretano com 3 camadas - Interface não aderente',
    'Espuma de poliuretano com 3 camadas - Interface não aderente em silicone',
    'Espuma de poliuretano com 3 camadas - Interface não aderente lipofílica',
    'Espuma de poliuretano com mais de 3 camadas - Interface não aderente',
    'Espuma de poliuretano com mais de 3 camadas - Interface não aderente em silicone',
    'Espuma de poliuretano com mais de 3 camadas - Interface não aderente lipofílica',
    'Poliacrilatos',
    'Superabsorventes',
    'Matriz de cadexómero de iodo',
    'Prata simples',
    'Alginato de cálcio com prata',
    'Fibras gelifiantes de alta densidade com prata',
    'Fibras de poliacrilato com núcleo acrílico com prata',
    'Espuma de poliuretano para transferência de exsudado com prata',
    'Espuma de poliuretano com 3 camadas com prata - Interface não aderente',
    'Espuma de poliuretano com 3 camadas com prata - Interface não aderente em silicone',
    'Espuma de poliuretano com mais de 3 camadas com prata - Interface não aderente',
    'Carvão com prata',
    'Material de penso impregnado com Polihexametileno Biguanida (PHMB)',
    'Penso Hidrofóbico Antimiocrobiano',
    'Mel em gel/pasta',
    'Alginato impregnado com mel',
    'Matriz impregnada com mel',
    'Material com octenidina',
    'Carvão ativado simples',
    'Fibras gelifiantes de alta densidade e alginatos com carvão',
    'Ácido Hialurónico',
    'Hemoglobina',
    'Maltodextrina',
    'Colagénio',	
    'Octosulfato de sacaroso (TLC-NOSF)',
    'Modulador não biodegradável',
    'Fibras biodegradáveis de quitosano',
    'Película de poliuretano estéril',
    'Material de penso impregnado com parafina',
    'Material de penso impregnado com vaselina',
    'Material de penso impregnado com petrolato',
    'Penso não aderente de silicone',
    'Trolamina',
    'Sucralfato',
    'Película de poliuretano não estéril',
    'Ácidos gordos hiperoxigenados',
    'Soluções polimérica',
    'Cremes barreira compostos com dimeticona',
    'Pomadas à base de petrolato',
    'Pomadas à base de zinco',
    'Compresas gaze',
    'Compressas tecido/não tecido',
    'Outro' 
]

const terapiasComplementaresOptions = [
    'Terapia tópica de pressão negativa',
    'Oxigenoterapia hiperbárica',
    'Oxigenoterapia Tópica',
    'Fatores de crescimento derivados de plaquetas',
    'Fatores de crescimento',
    'Enxerto de pele',
    'Retalho',
    'Produtos à base de células e tecidos',
    'Outro',
]

const variasVezesPorDiaOptions = [
    '06:00 Às 14:00',
    '14:00 Às 22:00',
    '22:00 Às 06:00',
]

const variasVezesPorSemanaOptions = [
    'Segunda-Feira',
    'Terça-Feira',
    'Quarta-Feira',
    'Quinta-feira',
    'Sexta-feira',
    'Sábado',
    'Domingo',
]

const fieldConfig: FieldConfig[] = [
    { name: 'limpeza', component: ControlledCheckboxGroup, label: 'Limpeza', props: { options: limpezaOptions }, isRequired: true },
    { name: 'desbridamento', component: ControlledRadioGroup, label: 'Desbridamento', props: { options }, isRequired: true },
    { name: 'tipoDesbridamento', component: ControlledCheckboxGroup, label: 'Tipo de Desbridamento', props: { options: tipoDesbridamentoOptions }, isConditional: true, dependsOn: { field: 'desbridamento', value: 'yes' }, isRequired: false },
    { name: 'principiosAtivos', component: ControlledRadioGroup, label: 'Princípios ativos ou opções terapêuticas', props: { options }, isRequired: true },
    { name: 'cjtoPrincipiosAtivos', component: ControlledCheckboxGroup, label: 'Conjunto de Princípios Ativos', props: { options: principiosAtivosOptions }, isConditional: true, dependsOn: { field: 'principiosAtivos', value: 'yes' }, isRequired: false },
    { name: 'principiosAtivosOutros', component: ControlledTextInput, label: 'Princípios Ativos (Outro)', props: { keyboardType: 'default', placeholder: 'Indique qual' }, isConditional: true, dependsOn: { field: 'cjtoPrincipiosAtivos', value: (value: string[]) => value?.includes('Outro') }, isRequired: false },
    { name: 'terapiasComplementares', component: ControlledRadioGroup, label: 'Terapias complementares ou coadjuvantes', props: { options }, isRequired: true },
    { name: 'cjtoTerapiasComplementares', component: ControlledCheckboxGroup, label: 'Conjunto de Terapias Complementares', props: { options: terapiasComplementaresOptions }, isConditional: true, dependsOn: { field: 'terapiasComplementares', value: 'yes' }, isRequired: false },
    { name: 'terapiasComplementaresOutro', component: ControlledTextInput, label: 'Terapias Complementares (Outro)', props: { keyboardType: 'default', placeholder: 'Indique qual' }, isConditional: true, dependsOn: { field: 'cjtoTerapiasComplementares', value: (value: string[]) => value?.includes('Outro') }, isRequired: false },
    { name: 'fixaçãoComplementar', component: ControlledRadioGroup, label: 'Fixação Complementar', props: { options }, isRequired: true },
    { name: 'cjtoFixaçãoComplementar', component: ControlledCheckboxGroup, label: 'Conjunto de Fixação Complementar', props: { options: fixaçãoOptions }, isConditional: true, dependsOn: { field: 'fixaçãoComplementar', value: 'yes' }, isRequired: false },
    { name: 'fixaçãoComplementarOutro', component: ControlledTextInput, label: 'Fixação Complementar (Outro)', props: { keyboardType: 'default', placeholder: 'Indique qual' }, isConditional: true, dependsOn: { field: 'cjtoFixaçãoComplementar', value: (value: string[]) => value?.includes('Outro') }, isRequired: false },
    { name: 'freqTratamento', component: ControlledRadioGroup, label: 'Frequência do Tratamento', props: { options: freqOptions }, isRequired: true },
    { name: 'variasVezesPorDia', component: ControlledCheckboxGroup, label: 'Várias Vezes Por Dia', props: { options: variasVezesPorDiaOptions }, isConditional: true, dependsOn: { field: 'freqTratamento', value: 'Várias Vezes Por Dia' }, isRequired: false },
    { name: 'variasVezesPorSemana', component: ControlledCheckboxGroup, label: 'Várias Vezes Por Semana', props: { options: variasVezesPorSemanaOptions }, isConditional: true, dependsOn: { field: 'freqTratamento', value: 'Várias Vezes por Semana' }, isRequired: false },
    { name: 'proxMonitorização', component: ControlledDatePicker, label: 'Próxima Monitorização Completa', props: { placeholder: 'dd/mm/aaaa' }, isRequired: true }
];

const formRequestSchema = {
    type: "object",
    properties: {
        limpeza: { type: "array", items: { type: "string", enum: limpezaOptions, description: "An array that can contain the values present in the enum limpezaOptions" } }, 
        desbridamento: {type: "string", enum: options.map(option => option.value)},
        tipoDesbridamento: { type: "array", items: { type: "string", enum: tipoDesbridamentoOptions } },
        principiosAtivos: {type: "string", enum: options.map(option => option.value)},
        cjtoPrincipiosAtivos: {type: "string", enum: options.map(option => option.value), description: "An array containing values from the following list: ['Poliacrilato com solução de Ringer','Poliacrilatos com PHMB','Colagenase','Fibras de Poliacrilato com núcleo acrílico','Alginogel','Alginato de cálcio','Fibras Gelificantes de Alta Densidade','Espuma de poliuretano para transferência de exsudado','Espuma de poliuretano cavitária','Espuma de poliuretano com 3 camadas - Interface não aderente','Espuma de poliuretano com 3 camadas - Interface não aderente em silicone','Espuma de poliuretano com 3 camadas - Interface não aderente lipofílica','Espuma de poliuretano com mais de 3 camadas - Interface não aderente','Espuma de poliuretano com mais de 3 camadas - Interface não aderente em silicone','Espuma de poliuretano com mais de 3 camadas - Interface não aderente lipofílica','Poliacrilatos','Superabsorventes','Matriz de cadexómero de iodo','Prata simples','Alginato de cálcio com prata','Fibras gelifiantes de alta densidade com prata','Fibras de poliacrilato com núcleo acrílico com prata','Espuma de poliuretano para transferência de exsudado com prata','Espuma de poliuretano com 3 camadas com prata - Interface não aderente','Espuma de poliuretano com 3 camadas com prata - Interface não aderente em silicone','Espuma de poliuretano com mais de 3 camadas com prata - Interface não aderente','Carvão com prata','Material de penso impregnado com Polihexametileno Biguanida (PHMB)','Penso Hidrofóbico Antimiocrobiano','Mel em gel/pasta','Alginato impregnado com mel','Matriz impregnada com mel','Material com octenidina','Carvão ativado simples','Fibras gelifiantes de alta densidade e alginatos com carvão','Ácido Hialurónico','Hemoglobina','Maltodextrina','Colagénio','Octosulfato de sacaroso (TLC-NOSF)','Modulador não biodegradável','Fibras biodegradáveis de quitosano','Película de poliuretano estéril','Material de penso impregnado com parafina','Material de penso impregnado com vaselina','Material de penso impregnado com petrolato','Penso não aderente de silicone','Trolamina','Sucralfato','Película de poliuretano não estéril','Ácidos gordos hiperoxigenados','Soluções polimérica','Cremes barreira compostos com dimeticona','Pomadas à base de petrolato','Pomadas à base de zinco','Compresas gaze','Compressas tecido/não tecido','Outro' ]"},
        principiosAtivosOutros: {type: "string", description: "If there are another active ingredients"},
        terapiasComplementares: {type: "string", enum: options.map(option => option.value)},
        cjtoTerapiasComplementares: { type: "array", items: { type: "string", enum: terapiasComplementaresOptions, description: "An array that can contain the values present in the enum terapiasComplementaresOptions" }},
        terapiasComplementaresOutro: {type: "string", description: "If there is another complementary therapy"},
        fixaçãoComplementar: {type: "string", enum: options.map(option => option.value)},
        cjtoFixaçãoComplementar: { type: "array", items: { type: "string", enum: fixaçãoOptions}, description: "An array that can contain the values present in the enum fixaçãoOptions" },
        fixaçãoComplementarOutro: {type: "string", description: "If there is another complementary fixation"},
        freqTratamento: {type: "string", enum: freqOptions.map(option => option.value)},
        variasVezesPorDia: { type: "array", items: { type: "string", enum: variasVezesPorDiaOptions} },
        variasVezesPorSemana: { type: "array", items: { type: "string", enum: variasVezesPorSemanaOptions } },
        proxMonitorização: { type: "string", description: "The date of the next injury monitoring in the format (dd/MM/yyyy)" },
    },
    required: []
}

export function TreatmentForm({ initData, onSubmit, onPrevious, scrollToPosition }: TreatmentFormProps) {
    const transcriptionBoxRef = useRef<{ toggleExpand: () => void } | null>(null);
    const [transcriptionText, setTranscriptionText] = useState('');
    const { setCommands, speakMissingFields, speakMessage, stopSpeaking, isSpeaking } = useSpeechRecognition();
    const { refs, getRef } = useDynamicRefs();
    const isFocused = useIsFocused();
    
    const { control, handleSubmit, setValue, getValues, trigger, watch  } = useForm<TreatmentData>({
        resolver: yupResolver(TreatmentSchema),
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
            Object.keys(data).forEach(key => trigger(key as keyof TreatmentData)); // To trigger resolver errors 
        }
    };

    const desbridamentoWatch = watch("desbridamento");
    const principiosAtivosWatch = watch("principiosAtivos");
    const terapiasComplementaresWatch = watch("terapiasComplementares");
    const cjtoPrincipiosAtivosWatch =  watch("cjtoPrincipiosAtivos");
    const cjtoTerapiasComplementaresWatch = watch("cjtoTerapiasComplementares");
    const fixaçãoComplementarWatch = watch("fixaçãoComplementar");
    const cjtoFixaçãoComplementarWatch = watch("cjtoFixaçãoComplementar");
    const freqTratamentoWatch = watch("freqTratamento");

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
        if (key == 'tipoDesbridamento') {
            setValue("desbridamento", "yes");
            setValue("tipoDesbridamento", value);
        } else if (key == 'cjtoPrincipiosAtivos') {
            setValue("principiosAtivos", "yes");
            setValue("cjtoPrincipiosAtivos", value);
        } else if (key == 'principiosAtivosOutros') {
            setValue("principiosAtivos", "yes");
            const princAtivos = getValues("cjtoPrincipiosAtivos") || [];
            setValue("cjtoPrincipiosAtivos", princAtivos.includes("Outro") ? princAtivos : [...princAtivos, "Outro"]);
            setValue("principiosAtivosOutros", value);
        } else if (key == 'cjtoTerapiasComplementares') {
            setValue("terapiasComplementares", "yes");
            setValue("cjtoTerapiasComplementares", value);
        } else if (key == 'principiosAtivosOutros') {
            setValue("terapiasComplementares", "yes");
            const terapias = getValues("cjtoTerapiasComplementares") || [];
            setValue("cjtoTerapiasComplementares", terapias.includes("Outro") ? terapias : [...terapias, "Outro"]);
            setValue("terapiasComplementaresOutro", value);
        } else if (key == 'cjtoFixaçãoComplementar') {
            setValue("fixaçãoComplementar", "yes");
            setValue("cjtoFixaçãoComplementar", value);
        } else if (key == 'fixaçãoComplementarOutro') {
            setValue("fixaçãoComplementar", "yes");
            const fixacoes = getValues("cjtoFixaçãoComplementar") || [];
            setValue("cjtoFixaçãoComplementar", fixacoes.includes("Outro") ? fixacoes : [...fixacoes, "Outro"]);
            setValue("fixaçãoComplementarOutro", value);
        } else if (key == 'variasVezesPorDia') {
            setValue("freqTratamento", "Várias Vezes Por Dia");
            setValue("variasVezesPorDia", value);
        } else if (key == 'variasVezesPorSemana') {
            setValue("freqTratamento", "Várias Vezes por Semana");
            setValue("variasVezesPorSemana", value);
        }
        
        setValue(key as keyof TreatmentData, value);
    }

    useEffect(() => {
        if (getValues('desbridamento') === 'no') {
            setValue("tipoDesbridamento", undefined);
        }
    }, [desbridamentoWatch]);

    // principiosAtivos
    useEffect(() => {
        if (getValues('principiosAtivos') === 'no') {
            setValue("cjtoPrincipiosAtivos", undefined);
            setValue("principiosAtivosOutros", undefined);
        }
    }, [principiosAtivosWatch]);

    useEffect(() => {
        if (!getValues('cjtoPrincipiosAtivos')?.includes('Outro')) {
            setValue("principiosAtivosOutros", undefined);
        }
    }, [cjtoPrincipiosAtivosWatch]);

    // terapiasComplementares
    useEffect(() => {
        if (getValues('terapiasComplementares') === 'no') {
            setValue("cjtoTerapiasComplementares", undefined);
            setValue("terapiasComplementaresOutro", undefined);
        }
    }, [terapiasComplementaresWatch]);

    useEffect(() => {
        if (!getValues('cjtoTerapiasComplementares')?.includes('Outro')) {
            setValue("terapiasComplementaresOutro", undefined);
        }
    }, [cjtoTerapiasComplementaresWatch]);    

    // fixaçãoComplementar
    useEffect(() => {
        if (getValues('fixaçãoComplementar') === 'no') {
            setValue("cjtoFixaçãoComplementar", undefined);
            setValue("fixaçãoComplementarOutro", undefined);
        }
    }, [fixaçãoComplementarWatch]);

    useEffect(() => {
        if (!getValues('cjtoFixaçãoComplementar')?.includes('Outro')) {
            setValue("fixaçãoComplementarOutro", undefined);
        }
    }, [cjtoFixaçãoComplementarWatch]);

    // freqTratamento
    useEffect(() => {
        if (getValues('freqTratamento') !== 'Várias Vezes Por Dia') {
            setValue("variasVezesPorDia", undefined);
        }
        if (getValues('freqTratamento') !== 'Várias Vezes por Semana') {
            setValue("variasVezesPorSemana", undefined);
        }
    }, [freqTratamentoWatch]);

    return (
        <>
            <ThemedText type="title" style={styles.title}>Tratamento (AMBOS)</ThemedText>

            {fieldConfig.map(({ name, component: Component, label, props, isConditional, dependsOn, isRequired }) => {
                const shouldRender = !isConditional || 
                    (dependsOn && (
                        typeof dependsOn.value === 'function'
                            ? dependsOn.value(watch(dependsOn.field as keyof TreatmentData))
                            : watch(dependsOn.field as keyof TreatmentData) === dependsOn.value
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