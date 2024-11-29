import { Audio } from 'expo-av';
import { fetchFormData, fetchHelp, fetchHelpInstructionsManual } from './useNLPModel';
import { transcribeAudio } from './useSTTModel';
import Tts from 'react-native-tts';

const SAMPLING_INTERVAL = 1000; // Intervalo de monitoramento
const SILENCE_DURATION = 2000; // Duração do silêncio necessária para parar a gravação
const SAMPLE_WINDOW_SIZE = 15; // Janela de amostras para a média móvel
const VOLUME_THRESHOLD_OFFSET = 10; // Ajusta o limiar dinâmico para não ser muito sensível

const calculateAverage = (samples: any[]) => {
    return samples.length ? samples.reduce((a, b) => a + b, 0) / samples.length : 0;
};

const startAudioRecording = async () => {
    await Audio.setAudioModeAsync({
        allowsRecordingIOS: true,
        playsInSilentModeIOS: true,
    });

    const audio = new Audio.Recording();
    await audio.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
    const { sound } = await Audio.Sound.createAsync(require('@/assets/sounds/start.mp3'));
    await sound.playAsync();
    await audio.startAsync();
    console.log('Gravação iniciada...');
    return audio;
};

const monitorSilenceAndStop = async (audio: Audio.Recording, samples: any[]) => {
    return new Promise((resolve) => {
        const checkSilence = async () => {
            const status = await audio.getStatusAsync();
            const volume = status.metering || 0;
            //console.log("volume ", volume);

            samples.push(volume);
            if (samples.length > SAMPLE_WINDOW_SIZE) samples.shift();

            const averageVolume = calculateAverage(samples);
            const dynamicThreshold = averageVolume - VOLUME_THRESHOLD_OFFSET;

            if (volume < dynamicThreshold) {
                setTimeout(async () => {
                    console.log('Silêncio detectado, parando gravação...');
                    await audio.stopAndUnloadAsync();
                    const { sound } = await Audio.Sound.createAsync(require('@/assets/sounds/end.mp3'));
                    await sound.playAsync();
                    const uri = audio.getURI() as string | null;
                    resolve(uri);
                }, SILENCE_DURATION);
            } else {
                setTimeout(checkSilence, SAMPLING_INTERVAL);
            }
        };

        checkSilence();
    });
};

const transcribeAndFetchFormData = async (uri: string, schema: any) => {
    try {
        console.log('Transcrevendo áudio...');
        const text = await transcribeAudio(uri); // Call to the WHISPER API
        console.log('Obtendo dados do formulário...');
        const data = await fetchFormData(schema, text); // Call to the ChatGPT
        return {
            data: data,
            text: text,
        }
    } catch (error) {
        console.error('Erro ao transcrever ou obter dados:', error);
        return null;
    }
};

export const recordAudioAndGetFormData = async (schema: any) => {
    const samples: never[] = [];
    return startAudioRecording()
        .then(audio =>
            monitorSilenceAndStop(audio, samples)
                .then(uri => {
                    if (uri && typeof uri === 'string') {
                        return transcribeAndFetchFormData(uri, schema);
                    }
                    return null;
                })
        )
        .catch(error => {
            console.error("Error during audio recording or processing:", error);
            return null;
        });
};

/* Help Assistant */

const startHelpAssistantRecording = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  
    const audio = new Audio.Recording();
    await audio.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  
    try {
      await audio.startAsync();
      console.log('Gravação iniciada...');
      return audio;
    } catch (error) {
      console.error('Erro ao iniciar a gravação:', error);
      throw error;
    }
};

// Instructions Manual Helper
const startInstructionsManualRecording = async () => {
    await Audio.setAudioModeAsync({
      allowsRecordingIOS: true,
      playsInSilentModeIOS: true,
    });
  
    const audio = new Audio.Recording();
    await audio.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
  
    try {
      await audio.startAsync();
      console.log('Gravação iniciada...');
      return audio;
    } catch (error) {
      console.error('Erro ao iniciar a gravação:', error);
      throw error;
    }
};

const transcribeAndFetchQuestion = async (uri: string, schema: any, currentFormData: any) => {
    try {
        console.log('Transcrevendo áudio...');
        const text = await transcribeAudio(uri);
        console.log('Obtendo resposta à questão...');
        const data = await fetchHelp(schema, text, currentFormData);
        return {
            data: data,
            text: text,
        }
    } catch (error) {
        console.error('Erro ao transcrever ou obter dados:', error);
        return null;
    }
};

export const recordAudioAndGetAnswer = async (currentFormData: any, schema: any) => {
    const samples: never[] = [];
    const audio = await startHelpAssistantRecording();
    const uri = await monitorSilenceAndStop(audio, samples);

    if (uri && typeof uri === 'string') {
        return await transcribeAndFetchQuestion(uri, schema, currentFormData);
    }
    return null;
};

export const recordAudioAndGetAnswerManualInstructions = async (referenceText: string) => {
    const samples: never[] = [];
    const audio = await startInstructionsManualRecording();
    const uri = await monitorSilenceAndStop(audio, samples);

    if (uri && typeof uri === 'string') {
        return await transcribeAndFetchQuestionManualInstructions(uri, referenceText);
    }
    return null;
};

const transcribeAndFetchQuestionManualInstructions = async (uri: string, referenceText: string) => {
    try {
        console.log('Transcrevendo áudio...');
        const text = await transcribeAudio(uri);  // Função que transcreve o áudio
        console.log('Obtendo resposta à questão...');
        
        // Gerar a resposta baseada na pergunta transcrita e no texto de referência
        const data = await fetchHelpInstructionsManual(referenceText, text);  // Agora passando o texto de referência e a pergunta

        return {
            data: data,
            text: text,
        };
    } catch (error) {
        console.error('Erro ao transcrever ou obter dados:', error);
        return null;
    }
};

