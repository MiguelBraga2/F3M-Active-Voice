import React, { useState , useEffect} from 'react';
import { View, StyleSheet, Text, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import axios from 'axios';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/views/ThemedView';
import ParallaxScrollView from '@/components/views/ParallaxScrollView';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedTextInput } from '@/components/inputs/ThemedTextInput';
import { useFormData } from '@/app/formData-context'; 
import { useTextData } from '@/app/formText-context'; 

export default function App() {
  const [formCode, setFormCode] = useState(''); // Código do formulário (schema)
  const { text, setText } = useTextData();
  const [schema, setSchema] = useState(null);  // Resposta com informações extraídas
  const [loading, setLoading] = useState(false);  // Estado de carregamento
  const [error, setError] = useState<string | null>(null);  // Armazenar erros
  const { setFormData } = useFormData();

  const fetchSchemaFromAPI = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://10.0.2.2:3000/fields', {
        schema: JSON.parse(formCode),
        text: text  
      });

      // Armazenar a resposta com o esquema processado
      const answer = JSON.parse(response.data);
      setSchema(response.data)
      setFormData(answer); // Preenche os campos do formulário
    } catch (error) {
      console.error('Erro ao processar o esquema:', error);
      setError('Erro ao processar o esquema. Verifique o código do formulário e o texto.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <ParallaxScrollView
      headerBackgroundColor={{ light: '#A1CEDC', dark: '#1D3D47' }}
      headerImage={
        <Image
          source={require('@/assets/images/ollama.png')}
          style={styles.ollamaLogo}
        />
      }>
      
      <ThemedView style={styles.container}>
        <ThemedView style={styles.form}>
          <ThemedText type="title" style={styles.title}>Insira o Schema do Formulário React</ThemedText>

          {/* Campo de entrada para o código do formulário */}
          <ThemedTextInput
            style={styles.input}
            multiline
            value={formCode}
            onChangeText={setFormCode}
            placeholder="Insira o schema do formulário aqui"
          />

          <ThemedText type="title" style={styles.title}>Insira o Texto para Análise</ThemedText>

          {/* Campo de entrada para o texto a ser analisado */}
          <ThemedTextInput
            style={styles.input}
            multiline
            value={text}
            onChangeText={setText}
            placeholder="Insira o texto para análise"
          />

          {/* Botão para enviar a requisição */}
          <ThemedButton title="Preencher o formulário" onPress={fetchSchemaFromAPI} />

          {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />}

          {/* Exibir erros, se houver */}
          {error && <ThemedText type='error'>{error}</ThemedText>}

          {/* Exibir o esquema JSON gerado */}
          {schema && (
            <View style={styles.schemaContainer}>
              <Text style={styles.title}>Resposta Gerada (JSON):</Text>
              <Text style={styles.schema}>{JSON.stringify(schema, null, 2)}</Text>
            </View>
          )}
        </ThemedView>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center'
  }, 
  form: {
      width: '90%',
      maxWidth: 600
  },
  title: {
      textAlign: 'center',
      marginBottom : 20
  },
  input: {
    height: 200,
    borderRadius: 5,
  },
  loading: {
    marginVertical: 20,
  },
  schemaContainer: {
    marginTop: 20,
    width: '100%',
  },
  schema: {
    fontSize: 14,
    backgroundColor: '#f0f0f0',
    padding: 10,
    borderRadius: 8,
    fontFamily: 'monospace',
    marginTop: 10,
    width: '100%',
  },
  ollamaLogo: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    position: 'absolute',
  }
});
/*
Para colocar na segunda tab da implementação da API :

{
  "formSchema": {
    "name": {
      "type": "string",
      "description": "The patient's name"
    },
    "defaultValue": {
      "type": "string",
      "description": "Default value for the name field"
    }
  }
}

"O nome da paciente é Ana."
*/