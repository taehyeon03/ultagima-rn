import React, { useState, useEffect } from 'react';
import { View, Text, Image, StyleSheet, TouchableOpacity } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { NavigationContainer } from '@react-navigation/native';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { SafeAreaProvider, useSafeAreaInsets } from 'react-native-safe-area-context';
import { StatusBar } from 'expo-status-bar';

import HomeScreen from './src/screens/HomeScreen';
import TimerScreen from './src/screens/TimerScreen';
import SurveyScreen from './src/screens/SurveyScreen';
import RecommendScreen from './src/screens/RecommendScreen';
import CleansingScreen from './src/screens/CleansingScreen';
import AbsenceBanner from './src/components/AbsenceBanner';
import { useAbsenceTracker, STAGE_ICONS, AbsenceLevel } from './src/hooks/useAbsenceTracker';

const Tab = createBottomTabNavigator();

const TAB_ICONS: Record<string, string> = {
  홈: '☀️', 타이머: '⏱', 피부설정: '✨', 추천: '⭐', 세안법: '💧',
};

const ringColor: Record<AbsenceLevel, string> = {
  0: 'transparent', 1: '#FF9500', 2: '#e07000', 3: '#ba1a1a',
};

function AppContent() {
  const [uvIndex, setUvIndex] = useState(0);
  const [userSkinType, setUserSkinType] = useState('DSPW');
  const { absenceLevel, bannerLevel, showBanner, dismissBanner } = useAbsenceTracker();
  const insets = useSafeAreaInsets();

  // 앱 시작 시 저장된 피부 타입을 불러와 추천/세안법 화면에 즉시 반영
  useEffect(() => {
    AsyncStorage.getItem('skinTypeCode').then(c => { if (c) setUserSkinType(c); });
  }, []);

  return (
    <>
      <StatusBar style="dark" />
      {showBanner && <AbsenceBanner level={bannerLevel} onDismiss={dismissBanner} />}
      <NavigationContainer>
        <Tab.Navigator
          screenOptions={({ route }) => ({
            header: () => (
              <View style={[styles.header, { paddingTop: insets.top + 8 }]}>
                <View style={styles.logoGroup}>
                  <View style={[styles.iconWrap, { borderColor: ringColor[absenceLevel] }]}>
                    <Image source={STAGE_ICONS[absenceLevel]} style={styles.iconImg} />
                    {absenceLevel > 0 && (
                      <View style={[styles.badge, { backgroundColor: ringColor[absenceLevel] }]}>
                        <Text style={styles.badgeTxt}>{absenceLevel === 3 ? '!' : absenceLevel}</Text>
                      </View>
                    )}
                  </View>
                  <Text style={styles.appName}>얼타지마</Text>
                </View>
              </View>
            ),
            tabBarStyle: {
              backgroundColor: '#fff',
              borderTopWidth: 0,
              elevation: 20,
              shadowColor: '#000',
              shadowOpacity: 0.1,
              shadowRadius: 16,
              height: 60 + insets.bottom,
              paddingBottom: insets.bottom,
            },
            tabBarActiveTintColor: '#8c5000',
            tabBarInactiveTintColor: '#aaa',
            tabBarLabelStyle: { fontSize: 10, fontWeight: '700' },
            tabBarIcon: ({ focused }) => (
              <Text style={{ fontSize: focused ? 22 : 18, opacity: focused ? 1 : 0.55 }}>
                {TAB_ICONS[route.name]}
              </Text>
            ),
          })}
        >
          <Tab.Screen name="홈">
            {({ navigation }) => (
              <HomeScreen
                uvIndex={uvIndex}
                setUvIndex={setUvIndex}
                onNavigate={(s) => {
                  if (s === 'survey') navigation.navigate('피부설정' as never);
                  else if (s === 'timer') navigation.navigate('타이머' as never);
                }}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="타이머">
            {() => <TimerScreen uvIndex={uvIndex} />}
          </Tab.Screen>
          <Tab.Screen name="피부설정">
            {({ navigation }) => (
              <SurveyScreen
                setUserSkinType={setUserSkinType}
                onNavigate={(s) => s === 'recommend' && navigation.navigate('추천' as never)}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="추천">
            {({ navigation }) => (
              <RecommendScreen
                userSkinType={userSkinType}
                onNavigate={(s) => s === 'survey' && navigation.navigate('피부설정' as never)}
              />
            )}
          </Tab.Screen>
          <Tab.Screen name="세안법">
            {({ navigation }) => (
              <CleansingScreen
                onNavigate={(s) => s === 'survey' && navigation.navigate('피부설정' as never)}
              />
            )}
          </Tab.Screen>
        </Tab.Navigator>
      </NavigationContainer>
    </>
  );
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  header: {
    backgroundColor: 'rgba(255,255,255,0.97)',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderColor: '#eee',
  },
  logoGroup: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  iconWrap: {
    width: 36, height: 36, borderRadius: 18,
    borderWidth: 2, overflow: 'hidden',
  },
  iconImg: { width: '100%', height: '100%' },
  badge: {
    position: 'absolute', top: -2, right: -2,
    width: 14, height: 14, borderRadius: 7,
    justifyContent: 'center', alignItems: 'center',
  },
  badgeTxt: { color: '#fff', fontSize: 8, fontWeight: '900' },
  appName: { fontSize: 22, fontWeight: '800', color: '#8c5000' },
});
