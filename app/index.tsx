import { Redirect } from 'expo-router';
import { ActivityIndicator, View } from 'react-native';
import { useEffect, useState } from 'react';

export default function Index() {
  const [isReady, setIsReady] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [hasCompletedOnboarding, setHasCompletedOnboarding] = useState(false);

  useEffect(() => {
    // 💡 TODO: Replace this with your actual auth/store check!
    // Example: const user = await checkUserSession();
    // Example: const onboardingStatus = await AsyncStorage.getItem('onboardingComplete');
    
    // Simulating a fast local storage check
    setTimeout(() => {
      setIsLoggedIn(false); // Change to test routing
      setHasCompletedOnboarding(false); // Change to test routing
      setIsReady(true);
    }, 100);
  }, []);

  // Show nothing (or a loading spinner) while we check local storage
  if (!isReady) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: '#F5F8F7' }}>
        <ActivityIndicator size="large" color="#2C3E50" />
      </View>
    );
  }

  // Routing Logic
  if (!isLoggedIn && !hasCompletedOnboarding) {
    return <Redirect href="/(onboarding)/intro" />;
  }

  if (!isLoggedIn && hasCompletedOnboarding) {
    return <Redirect href="/(auth)/login" />;
  }

  // If logged in and onboarding is done, send them to the main app
  return <Redirect href="/(tabs)" />;
}
