import { Tabs } from 'expo-router';
import React, { useEffect, useRef, useState } from 'react';

import { TabBarIcon } from '@/components/navigation/TabBarIcon';
import { useThemeColor } from '@/hooks/useThemeColor';
import { useSpeechRecognition } from '@/hooks/useSpeechRecognition';
import { AppState, NativeEventSubscription } from 'react-native';

export default function TabLayout() {

  const { startRecording, stopRecording, requestPermissions } = useSpeechRecognition(); 
  const appState = useRef(AppState.currentState);
  const [appStateVisible, setAppStateVisible] = useState(appState.current);

  useEffect(() => {
    let subscription: NativeEventSubscription;

    requestPermissions().then(() => {

      startRecording();
      subscription = AppState.addEventListener('change', nextAppState => {
        if (appState.current.match(/background/) && nextAppState === 'active') {
          console.log('App has come to the foreground!');
          startRecording();
        } else if (appState.current.match(/active/) && nextAppState === 'background') {
          console.log('App has gone to the background!');
          stopRecording();
        }

        appState.current = nextAppState;
        setAppStateVisible(appState.current);
      });
    });

    return () => {
      if (subscription) {
        subscription.remove();
      }
    };
  }, []);

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: useThemeColor({}, 'tint'),
        tabBarStyle: {
          backgroundColor: useThemeColor({}, 'background'),
        },
        headerShown: false,
      }}>
      <Tabs.Screen
        name="index"
        options={{
          title: 'Home',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'home' : 'home-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="form"
        options={{
          title: 'Form',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="complete_form"
        options={{
          title: 'Complete Form',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'code-slash' : 'code-slash-outline'} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Settings',
          tabBarIcon: ({ color, focused }) => (
            <TabBarIcon name={focused ? 'settings' : 'settings-outline'} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}
