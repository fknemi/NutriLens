import { config } from './config';
import { GluestackUIProvider as GluestackProvider } from '@gluestack-ui/themed';
import React from 'react';
import { View } from 'react-native';

export function GluestackUIProvider({
  mode = 'light',
  children,
}: {
  mode?: 'light' | 'dark' | 'system';
  children: React.ReactNode;
}) {
  return (
    <GluestackProvider config={config}>
      <View
        style={{ flex: 1 }}
        className={mode === 'dark' ? 'dark' : ''}
      >
        {children}
      </View>
    </GluestackProvider>
  );
}
