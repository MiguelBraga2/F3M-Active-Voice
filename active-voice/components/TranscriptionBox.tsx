import React, { forwardRef, useImperativeHandle, useState } from 'react';
import { StyleSheet, ScrollView } from 'react-native';
import { ThemedButton } from './ThemedButton';
import { ThemedView } from './views/ThemedView';
import { ThemedText } from './ThemedText';
import { useThemeColor } from '@/hooks/useThemeColor';

export const TranscriptionBox = forwardRef(({ text }: { text: string }, ref) => {
  const [showTranscription, setShowTranscription] = useState(false);
  const placeholderColor = useThemeColor({}, 'placeholder');


  useImperativeHandle(ref, () => ({
    toggleExpand: () => {
      setShowTranscription(!showTranscription);
    },
  }));


  return (
    <ThemedView style={styles.view}>
      <ThemedButton onPress={() => setShowTranscription(!showTranscription)} variant='secondary' title={showTranscription ? "Hide Transcription" : "Show Transcription"} />
      {showTranscription && (
        <ThemedView style={[
          styles.transcriptionBox,
          { borderColor: placeholderColor }
        ]}>
          <ScrollView>
            <ThemedText> {text === '' ? "Nenhuma transcrição disponível." : text.trim()}</ThemedText>
          </ScrollView>
        </ThemedView>
      )}
    </ThemedView>
  );
});

const styles = StyleSheet.create({
  view: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
  },
  transcriptionBox: {
    flex: 1,
    width: '100%',
    maxWidth: 600,
    borderWidth: 1,
    padding: 10,
    borderRadius: 5,
    marginTop: 10,
    maxHeight: 150,
  }
});
