import React, { useState } from 'react';
import { View, Button, StyleSheet, Text, ScrollView, TextInput, ActivityIndicator, Image } from 'react-native';
import axios from 'axios';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/views/ThemedView';
import ParallaxScrollView from '@/components/views/ParallaxScrollView';
import { ThemedButton } from '@/components/ThemedButton';
import { ThemedTextInput } from '@/components/inputs/ThemedTextInput';

export default function App() {
  const [formCode, setFormCode] = useState(''); // Para armazenar o código do formulário React
  const [schema, setSchema] = useState(null);  // Para armazenar o esquema JSON gerado
  const [loading, setLoading] = useState(false);  // Para mostrar o estado de carregamento
  const [error, setError] = useState<string | null>(null);  // Para armazenar erros

  const fetchSchemaFromAPI = async () => {  
    setLoading(true);
    setError(null);
    try {
      const response = await axios.post('http://10.0.2.2:3000/generate-schema', {
        formCode: formCode,
      });

      // Armazenar a resposta do esquema gerado
      setSchema(response.data); 
      console.log(response.data)
    } catch (error) {
      console.error('Erro ao gerar o esquema:', error);
      setError('Erro ao gerar o esquema. Verifique o código do formulário.');
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
          <ThemedText type="title" style={styles.title}>Insira o Código do Formulário React</ThemedText>

          {/* TextInput para inserir o código do formulário */}
          <ThemedTextInput
            style={styles.input}
            multiline
            value={formCode}
            onChangeText={setFormCode}
            placeholder="Introduza o código do formulário aqui"
          />  
      
          {/* Botão para gerar o esquema */}
          <ThemedButton title="Gerar Esquema" onPress={fetchSchemaFromAPI} />

          {loading && <ActivityIndicator size="large" color="#0000ff" style={styles.loading} />}

          {/* Exibir erros */}
          {error && <ThemedText type='error'>{error}</ThemedText>}

          {/* Exibir o esquema JSON gerado */}
          {schema && (
            <View style={styles.schemaContainer}>
              <Text style={styles.title}>Esquema Gerado (JSON):</Text>
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
