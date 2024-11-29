import { recordAudioAndGetFormData, recordAudioAndGetAnswer } from '@/hooks/useActiveVoice';
import { FieldConfig } from '@/types/fieldConfig';
import { UseFormGetValues } from 'react-hook-form';
import { scrollToFirstMissingField } from '@/hooks/useScrollToFirstMissingField';

export const processFormDataWithAssistant = async function processFormDataWithAssistant(data: Record<string, any>, schema: Record<string, any>, speakMessage: (message: string) => Promise<void>) {
    try {
        // Envia os dados e o esquema para o assistente
        const result = await recordAudioAndGetAnswer(data, schema);
        await speakMessage(result?.data ?? 'Desculpe, não consegui entender a sua pergunta.'); // Use text-to-speech to speak the answer
    } catch (error) {
        console.error('Erro ao processar os dados com o assistente:', error);
    }
}

const getMissingFields = (fieldConfig: FieldConfig[], getValues: UseFormGetValues<any>) => {
    return fieldConfig
        .filter(({ name, isRequired }) => isRequired && !getValues(name))
        .map(({ name, label }) => ({ name, label }));
};

export const processStartRecording = async function processStartRecording(schema: Record<string, any>, 
                                                                          fieldConfig: FieldConfig[], 
                                                                          setValue: (key: string, value: any) => void, 
                                                                          getValues: UseFormGetValues<any>, refs: {[key: string]: React.RefObject<unknown>}, 
                                                                          scrollToPosition: (yPosition: number) => void, 
                                                                          setTranscriptionText: (value: React.SetStateAction<string>) => void,
                                                                          fieldsToCast: string[] = []) {
    const result = await recordAudioAndGetFormData(schema);
    if (result) {
        const data = result.data ?? {};
        Object.keys(data).forEach(key => setValue(key, fieldsToCast.includes(key) ? data[key].toString() : data[key]));
        setTranscriptionText(result.text ?? '');
    }

    const missingFields = getMissingFields(fieldConfig, getValues);
    if (missingFields.length) scrollToFirstMissingField(missingFields.map(field => field.name), refs, scrollToPosition);

    return result;
}

export const speakAndScrollMissingFields = async function speakAndScrollMissingFields(fieldConfig: FieldConfig[], getValues: UseFormGetValues<any>, refs: {[key: string]: React.RefObject<unknown>}, scrollToPosition: (yPosition: number) => void, speakMissingFields: (missingFields: string[]) => Promise<void>){
    const missingFields = getMissingFields(fieldConfig, getValues);
    if (missingFields.length) {
        await speakMissingFields(missingFields.map(field => field.label));
        scrollToFirstMissingField(missingFields.map(field => field.name), refs, scrollToPosition);
    }
}