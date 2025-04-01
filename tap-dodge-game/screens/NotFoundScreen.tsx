import React from 'react';
import { StyleSheet, TouchableOpacity } from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function NotFoundScreen() {
  const navigation = useNavigation<NativeStackNavigationProp<any>>();
  
  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">This screen doesn't exist.</ThemedText>
      <TouchableOpacity 
        style={styles.link} 
        onPress={() => navigation.navigate('Home')}
      >
        <ThemedText type="link">Go to home screen!</ThemedText>
      </TouchableOpacity>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 20,
  },
  link: {
    marginTop: 15,
    paddingVertical: 15,
  },
});
