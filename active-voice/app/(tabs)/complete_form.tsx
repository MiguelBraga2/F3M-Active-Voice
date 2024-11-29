import ParallaxScrollView from '@/components/views/ParallaxScrollView';
import { ThemedView } from '@/components/views/ThemedView';
import { StyleSheet, Image } from 'react-native';
import { CompleteForm } from '@/components/CompleteForm';
import React, { useRef } from 'react';

export default function FormScreen() {
  const scrollViewRef = useRef<{ scrollToPosition: (yPosition: number) => void }>(null);

  return (
    <ParallaxScrollView ref={scrollViewRef} headerBackgroundColor={{ light: '#D0D0D0', dark: '#353636' }} headerImage={
      <Image source={require('@/assets/images/patient.png')} style={styles.patient} />
    }>
      <ThemedView style={styles.container}>
        <CompleteForm scrollToPosition={(yPosition) => {
          if (scrollViewRef.current) {
            scrollViewRef.current?.scrollToPosition(yPosition);
          }
        }}/>
      </ThemedView>
    </ParallaxScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  patient: {
    flex: 1,
    width: '100%',
    height: '100%',
    resizeMode: 'contain',
    position: 'absolute',
  },
  loading: {
    marginTop: 10,
  }
});

