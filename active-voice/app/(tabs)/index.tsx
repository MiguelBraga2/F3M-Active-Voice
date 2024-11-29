import React from 'react';
import { Image, StyleSheet } from 'react-native';
import ParallaxScrollView from '@/components/views/ParallaxScrollView';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/views/ThemedView';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { useEffect} from 'react';
import { recordAudioAndGetAnswerManualInstructions } from './../../hooks/useActiveVoice';
import { useLanguage } from '@/hooks/useLanguage';
import { useIsFocused } from '@react-navigation/native';
export const introductionText = `
        Finalidade: Esta aplicação foi criada para simplificar o processo de preenchimento de formulários na área médica, utilizando para tal comandos de voz. 
        Descrição da Aplicação: Nesta aplicação, possuímos as seguintes janelas:
        1. Na janela "Home" encontra-se um manual de instruções da aplicação.
        2. Na janela "Form" encontram-se os formulários possíveis de ser preenchidos.
        3. Na janela "Complete Form" encontra-se a totalidade dos formulários a serem preenchidos.
        4. Na janela "Settings" encontra-se a opção de utilizar a aplicação em diversas linguagens.
        Funcionalidades: Nesta aplicação é captada a voz do utilizador, que responde às perguntas existentes no formulário. 
        De uma forma automática e sem interação tátil, o formulário é totalmente preenchido. Quando o utilizador responde às questões do formulário e o submete, 
        é avisado auditivamente e visualmente se algum dos campos se encontra sem resposta.
        Features a saber: A navegação entre os formulários é efetuada da seguinte forma:
        1. Comando de voz para avançar de página: Avança, Avançar, Próximo, Submete, Submeter.
        2. Comando de voz para recuar de página: Recua, Recuar, Volta, Voltar, Retroceder, Volta Atrás, Voltar Atrás.
        3. Comando de voz para iniciar uma gravação: Começa a gravar, Começar a gravar, Começa a gravação, Começar a gravação, Começa gravar, 
           Começar gravar, Começa gravação, Começar gravação, Iniciar, Iniciar a gravação, Iniciar gravação.
        4. Comando de voz para exibir a transcrição: Mostrar, Mostra, Exibe a transcrição, Exibir a transcrição, Exibir transcrição, Exibe transcrição.
        5. Comando de voz para exibir a ajuda: Ajuda, Assistente.
        6. Comando de voz para ditar o manual de instruções: Ditar instruções, Ditar manual.
        7. Comando de voz para parar o ditado do manual de instruções: Para, Stop;
        
        Para terminar a gravação da voz, basta parar de falar, pois a aplicação deteta o silêncio e termina a captura de voz automaticamente.
        A aplicação possui uma ajuda semelhante a uma assistente virtual. Assim, você pode fazer qualquer tipo de pergunta para a assistente virtual sobre a página onde se encontra, bem como sobre o manual de instruções. 
        Esperamos ter ajudado na sua interação com a aplicação!
    `;

export default function InstructionManualScreen() {
  const { setCommands, speakMessage, stopSpeaking } = useSpeechRecognition();
  const isFocused = useIsFocused();
  
  const handleHelperManualInstructions = async () => {
    await speakMessage('Olá, em que posso lhe ajudar relativamente ao manual de instruções?');
    const result = await recordAudioAndGetAnswerManualInstructions(introductionText);
    await speakMessage(result?.data ?? 'Desculpe, não consegui entender a sua pergunta.');
  };

  useEffect(() => {
    if (isFocused) {
      setCommands([
          { regex: /\b(?:instruções|manual)\b/i, action: "startManualInstructions", handler: async () => await speakMessage(introductionText) },
          { regex: /\b(?:para|stop)\b/i, action: "stopManualInstructions", handler: stopSpeaking },
          { regex: /\b(?:ajuda|assistente)\b/i, action: "helpManualInstructions", handler: handleHelperManualInstructions },
      ]);
    }
  }, [isFocused]);

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/VUI-voice.png')}
          style={styles.voiceLogo}
        />
      }>

      <ThemedView style={styles.container}>  
        <ThemedView style={styles.form}>
          <ThemedText type="title" style={styles.title}> Active Voice </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>Finalidade</ThemedText>
          <ThemedText style={styles.text}>
            Esta aplicação foi criada, para simplificar o processo de preenchimento de formulários na área médica, utilizando para tal comandos de voz. 
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>Descrição da Aplicação</ThemedText>
          <ThemedText style={styles.text}>
            Nesta aplicação, possuímos as seguintes janelas:
          </ThemedText>
          <ThemedText style={styles.text}>
            1. Na janela "Home" encontra-se um manual de instruções da aplicação; 
          </ThemedText>
          <ThemedText style={styles.text}>
            2. Na janela "Form" encontram-se os formulários possíveis de ser preenchidos;
          </ThemedText>
          <ThemedText style={styles.text}>
            3. Na janela "Complete Form" encontra-se a totalidade dos formulários a serem preenchidos;
          </ThemedText>
          <ThemedText style={styles.text}>
            4. Na janela "Settings" encontra-se a opção de utilizar a aplicação em diversas linguagens;
          </ThemedText>

          <ThemedText type="subtitle" style={styles.sectionTitle}>Funcionalidades</ThemedText>
          <ThemedText style={styles.text}>
          Nesta aplicação é captada a voz do utilizador, que responde às perguntas existentes no formulário. De uma forma automática,
          e sem interação tátil o formulário é totalmente preenchido.

          Quando o utilizador responde às questões do formulário e o submete, é avisado auditivamente e visualmente se algum dos campos se encontra sem resposta.
          </ThemedText>
          <ThemedText type="subtitle" style={styles.sectionTitle}>Features a saber</ThemedText>
          <ThemedText style={styles.text}>
          A navegação entre os formulários é efetuada da seguinte forma:
          </ThemedText>
          <ThemedText style={styles.text}>
            1. <ThemedText style={styles.bold}>Comando de voz para avançar de página</ThemedText>: Avança, Avançar, Próximo, Submete, Submeter;
          </ThemedText>
          <ThemedText style={styles.text}>
            2. <ThemedText style={styles.bold}>Comando de voz para recuar de página</ThemedText>: Recua, Recuar, Volta, Voltar, Retroceder, Volta Atrás, Voltar Atrás;
          </ThemedText>
          <ThemedText style={styles.text}>
            3. <ThemedText style={styles.bold}>Comando de voz para iniciar uma gravação</ThemedText>: Começa a gravar, Começar a gravar , Começa a gravação, Começar a gravação, Começa gravar, Começar gravar, Começa gravação, Começar gravação, Iniciar, Iniciar a gravação, Iniciar gravação;
          </ThemedText>
          <ThemedText style={styles.text}>
            4. <ThemedText style={styles.bold}>Comando de voz para exibir a transcrição</ThemedText>: Mostrar, Mostra, Exibe a transcrição, Exibir a transcrição, Exibir transcrição, Exibe transcrição;
          </ThemedText>
          <ThemedText style={styles.text}>
            5. <ThemedText style={styles.bold}>Comando de voz para exibir a ajuda</ThemedText>: Ajuda, Assistente;
          </ThemedText>
          <ThemedText style={styles.text}>
            6. <ThemedText style={styles.bold}>Comando de voz para ditar o manual de instruções</ThemedText>: Ditar instruções, Ditar manual ;
          </ThemedText>
          <ThemedText style={styles.text}>
            7. <ThemedText style={styles.bold}>Comando de voz para parar o ditado do manual de instruções</ThemedText>: Para, Stop;
          </ThemedText>
          <ThemedText style={styles.text}>
            Para terminar a gravação da voz, apenas basta parar de falar. Uma vez que a aplicação tem a capacidade de detetar silêncio.Quando deteta um silêncio é terminada a captura de voz.
          </ThemedText>
          <ThemedText style={styles.text}>
            A aplicação possui ajuda, semelhante a uma assistente virtual. Assim pode fazer qualquer tipo de pergunta na sua assistente virtual sobre a página onde se encontra, bem como sobre o manual de instruções. 
          </ThemedText>
          <ThemedText style={styles.footer}>Esperamos ter ajudado na sua interação com a aplicação!</ThemedText>
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20
  }, 
  form: {
      width: '90%',
      maxWidth: 600
  },
  title: {
      textAlign: 'center',
      marginBottom: 20
  },
  sectionTitle: {
      fontWeight: 'bold',
      fontSize: 18,
      marginVertical: 10
  },
  text: {
      fontSize: 16,
      marginBottom: 8,
      textAlign: 'justify'
  },
  voiceLogo: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    position: 'absolute',
  },
  footer: {
      textAlign: 'center',
      marginTop: 20,
      fontSize: 16,
      fontStyle: 'italic'
  },
  bold: {
    fontWeight: 'bold',
  },
});
