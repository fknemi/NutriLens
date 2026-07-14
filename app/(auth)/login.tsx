import React, { useState } from 'react';
import { View, Text, TextInput, Pressable, ActivityIndicator, Alert } from 'react-native';
import { router } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

export default function LoginScreen() {
  const [countryCode, setCountryCode] = useState('+91');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [otp, setOtp] = useState('');
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSkip = () => {
    router.replace('/(tabs)');
  };

  const handleSendOtp = async () => {
    if (!phoneNumber || phoneNumber.length < 10) {
      return Alert.alert('Invalid Number', 'Please enter a valid phone number.');
    }

    setLoading(true);
    try {
      // TODO: Replace with your SMS/auth API call
      // e.g. await myAuthService.sendOtp(`${countryCode}${phoneNumber}`);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // mock delay
      setOtpSent(true);
    } catch (error) {
      Alert.alert('Error', (error as Error).message);
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async () => {
    if (!otp || otp.length < 6) return;

    setLoading(true);
    try {
      // TODO: Replace with your OTP verification API call
      // e.g. await myAuthService.verifyOtp(otp);
      await new Promise((resolve) => setTimeout(resolve, 1000)); // mock delay
      router.replace('/(tabs)');
    } catch (error) {
      Alert.alert('Invalid Code', 'The code you entered is incorrect.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <SafeAreaView className="flex-1 bg-[#F5F8F7] p-6">
      {/* Top Right Skip Button */}
      <View className="flex-row justify-end mb-8">
        <Pressable onPress={handleSkip}>
          <Text className="font-[Geologica-Medium] text-[#718096] text-base">Skip</Text>
        </Pressable>
      </View>

      <View className="flex-1">
        <Text className="font-[Geologica-Bold] text-3xl text-[#1A202C] mb-2">
          {otpSent ? "Verify Phone" : "Welcome!"}
        </Text>
        <Text className="font-[Geologica-Regular] text-base text-[#718096] mb-8">
          {otpSent
            ? `Enter the OTP sent to ${countryCode} ${phoneNumber}`
            : "Enter your phone number to get started"}
        </Text>

        {!otpSent ? (
          /* ----- PHONE INPUT VIEW ----- */
          <View className="gap-6">
            <View className="flex-row gap-3">
              <Pressable className="bg-white px-4 py-4 rounded-xl border border-[#E2E8F0] justify-center items-center">
                <Text className="font-[Geologica-Medium] text-base text-[#1A202C]">{countryCode}</Text>
              </Pressable>

              <TextInput
                className="flex-1 bg-white p-4 rounded-xl font-[Geologica-Regular] text-base border border-[#E2E8F0] text-[#1A202C]"
                placeholder="Phone Number"
                placeholderTextColor="#A0AEC0"
                keyboardType="phone-pad"
                value={phoneNumber}
                onChangeText={setPhoneNumber}
                editable={!loading}
              />
            </View>

            <Pressable
              className={`bg-[#2C3E50] p-4 rounded-xl items-center ${loading ? 'opacity-70' : ''}`}
              onPress={handleSendOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="font-[Geologica-SemiBold] text-white text-base">Continue</Text>
              )}
            </Pressable>
          </View>
        ) : (
          /* ----- OTP INPUT VIEW ----- */
          <View className="gap-6">
            <TextInput
              className="bg-white p-4 rounded-xl font-[Geologica-SemiBold] text-center text-2xl tracking-[8px] border border-[#E2E8F0] text-[#1A202C]"
              placeholder="000000"
              placeholderTextColor="#A0AEC0"
              keyboardType="number-pad"
              maxLength={6}
              value={otp}
              onChangeText={setOtp}
              editable={!loading}
              autoFocus
            />

            <Pressable
              className={`bg-[#2C3E50] p-4 rounded-xl items-center ${loading ? 'opacity-70' : ''}`}
              onPress={handleVerifyOtp}
              disabled={loading}
            >
              {loading ? (
                <ActivityIndicator color="#FFF" />
              ) : (
                <Text className="font-[Geologica-SemiBold] text-white text-base">Verify & Login</Text>
              )}
            </Pressable>

            <Pressable onPress={() => setOtpSent(false)} className="items-center mt-4">
              <Text className="font-[Geologica-Medium] text-[#2C3E50] text-base">Change Phone Number</Text>
            </Pressable>
          </View>
        )}
      </View>
    </SafeAreaView>
  );
}
