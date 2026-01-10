import React from "react";
import { View, StyleSheet, Pressable } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Feather } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";

import DiscoverScreen from "@/screens/DiscoverScreen";
import MatchesScreen from "@/screens/MatchesScreen";
import MessagesScreen from "@/screens/MessagesScreen";
import ProfileScreen from "@/screens/ProfileScreen";
import { useTheme } from "@/hooks/useTheme";
import { Colors, Spacing, BorderRadius, Shadows } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export type MainTabParamList = {
  Discover: undefined;
  Matches: undefined;
  Messages: undefined;
  Profile: undefined;
};

const Tab = createBottomTabNavigator<MainTabParamList>();

function PremiumFAB() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  if (user?.isPremium) return null;

  return (
    <Pressable
      style={({ pressed }) => [
        styles.fab,
        { bottom: 70 + insets.bottom + Spacing.lg },
        pressed && styles.fabPressed,
      ]}
      onPress={() => navigation.navigate("Premium")}
    >
      <View style={styles.fabInner}>
        <Feather name="star" size={24} color={Colors.dark.backgroundRoot} />
      </View>
    </Pressable>
  );
}

export default function MainTabNavigator() {
  const { theme } = useTheme();

  return (
    <View style={{ flex: 1, backgroundColor: Colors.dark.backgroundRoot }}>
      <Tab.Navigator
        initialRouteName="Discover"
        screenOptions={{
          tabBarActiveTintColor: Colors.dark.gold,
          tabBarInactiveTintColor: Colors.dark.tabIconDefault,
          tabBarStyle: {
            position: "absolute",
            backgroundColor: Platform.select({
              ios: "transparent",
              android: Colors.dark.backgroundDefault,
            }),
            borderTopWidth: 0,
            elevation: 0,
          },
          tabBarBackground: () =>
            Platform.OS === "ios" ? (
              <BlurView
                intensity={80}
                tint="dark"
                style={StyleSheet.absoluteFill}
              />
            ) : null,
          headerShown: false,
        }}
      >
        <Tab.Screen
          name="Discover"
          component={DiscoverScreen}
          options={{
            title: "Discover",
            tabBarIcon: ({ color, size }) => (
              <Feather name="compass" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Matches"
          component={MatchesScreen}
          options={{
            title: "Matches",
            tabBarIcon: ({ color, size }) => (
              <Feather name="heart" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Messages"
          component={MessagesScreen}
          options={{
            title: "Messages",
            tabBarIcon: ({ color, size }) => (
              <Feather name="message-circle" size={size} color={color} />
            ),
          }}
        />
        <Tab.Screen
          name="Profile"
          component={ProfileScreen}
          options={{
            title: "Profile",
            tabBarIcon: ({ color, size }) => (
              <Feather name="user" size={size} color={color} />
            ),
          }}
        />
      </Tab.Navigator>
      <PremiumFAB />
    </View>
  );
}

const styles = StyleSheet.create({
  fab: {
    position: "absolute",
    right: Spacing.xl,
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.gold,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.gold,
  },
  fabPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
  fabInner: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
