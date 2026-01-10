import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Dimensions } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH } = Dimensions.get("window");

type ProfileDetailRouteProp = RouteProp<RootStackParamList, "ProfileDetail">;

function calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371;
  const dLat = (lat2 - lat1) * (Math.PI / 180);
  const dLon = (lon2 - lon1) * (Math.PI / 180);
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * (Math.PI / 180)) *
      Math.cos(lat2 * (Math.PI / 180)) *
      Math.sin(dLon / 2) *
      Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  return R * c;
}

export default function ProfileDetailScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<ProfileDetailRouteProp>();
  const navigation = useNavigation();
  const { user: currentUser } = useAuth();
  const [currentPhotoIndex, setCurrentPhotoIndex] = useState(0);

  const { user: profileUser } = route.params;
  const photos = profileUser.photos || [];

  const distance =
    currentUser?.latitude &&
    currentUser?.longitude &&
    profileUser.latitude &&
    profileUser.longitude
      ? calculateDistance(
          currentUser.latitude,
          currentUser.longitude,
          profileUser.latitude,
          profileUser.longitude
        ).toFixed(1)
      : null;

  const handlePass = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    navigation.goBack();
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    navigation.goBack();
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <Pressable style={styles.headerButton} onPress={() => navigation.goBack()}>
          <Feather name="chevron-down" size={24} color={Colors.dark.text} />
        </Pressable>
        <Pressable style={styles.headerButton}>
          <Feather name="flag" size={20} color={Colors.dark.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.photoContainer}>
          <ScrollView
            horizontal
            pagingEnabled
            showsHorizontalScrollIndicator={false}
            onMomentumScrollEnd={(e) => {
              const index = Math.round(e.nativeEvent.contentOffset.x / SCREEN_WIDTH);
              setCurrentPhotoIndex(index);
            }}
          >
            {photos.length > 0 ? (
              photos.map((photo, index) => (
                <Image
                  key={index}
                  source={{ uri: photo }}
                  style={styles.photo}
                  contentFit="cover"
                />
              ))
            ) : (
              <View style={[styles.photo, styles.noPhoto]}>
                <Feather name="user" size={80} color={Colors.dark.textSecondary} />
              </View>
            )}
          </ScrollView>
          <LinearGradient
            colors={["transparent", "rgba(0,0,0,0.7)"]}
            style={styles.photoGradient}
          />
          {photos.length > 1 ? (
            <View style={styles.photoIndicators}>
              {photos.map((_, index) => (
                <View
                  key={index}
                  style={[
                    styles.photoIndicator,
                    index === currentPhotoIndex && styles.photoIndicatorActive,
                  ]}
                />
              ))}
            </View>
          ) : null}
        </View>

        <View style={styles.infoContainer}>
          <View style={styles.nameRow}>
            <ThemedText style={styles.name}>
              {profileUser.name}, {profileUser.age}
            </ThemedText>
            {profileUser.isPremium ? (
              <View style={styles.premiumBadge}>
                <Feather name="star" size={14} color={Colors.dark.backgroundRoot} />
              </View>
            ) : null}
          </View>

          {distance ? (
            <View style={styles.distanceRow}>
              <Feather name="map-pin" size={16} color={Colors.dark.gold} />
              <ThemedText style={styles.distanceText}>{distance} km away</ThemedText>
            </View>
          ) : null}

          {profileUser.bio ? (
            <View style={styles.bioSection}>
              <ThemedText style={styles.sectionTitle}>About</ThemedText>
              <ThemedText style={styles.bioText}>{profileUser.bio}</ThemedText>
            </View>
          ) : null}
        </View>
      </ScrollView>

      <View style={[styles.actionButtons, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [styles.actionButton, styles.passButton, pressed && styles.buttonPressed]}
          onPress={handlePass}
        >
          <Feather name="x" size={28} color={Colors.dark.error} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionButton, styles.superLikeButton, pressed && styles.buttonPressed]}
          onPress={handleLike}
        >
          <Feather name="star" size={24} color={Colors.dark.gold} />
        </Pressable>
        <Pressable
          style={({ pressed }) => [styles.actionButton, styles.likeButton, pressed && styles.buttonPressed]}
          onPress={handleLike}
        >
          <Feather name="heart" size={28} color={Colors.dark.success} />
        </Pressable>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  header: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    zIndex: 10,
    flexDirection: "row",
    justifyContent: "space-between",
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
  },
  headerButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: "rgba(0,0,0,0.5)",
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    flexGrow: 1,
  },
  photoContainer: {
    position: "relative",
    height: SCREEN_WIDTH * 1.2,
  },
  photo: {
    width: SCREEN_WIDTH,
    height: SCREEN_WIDTH * 1.2,
  },
  noPhoto: {
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
  },
  photoGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: 200,
  },
  photoIndicators: {
    position: "absolute",
    top: 80,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.xs,
  },
  photoIndicator: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: "rgba(255,255,255,0.5)",
  },
  photoIndicatorActive: {
    backgroundColor: Colors.dark.text,
    width: 20,
  },
  infoContainer: {
    padding: Spacing.xl,
  },
  nameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  name: {
    ...Typography.h1,
    color: Colors.dark.text,
  },
  premiumBadge: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.dark.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginBottom: Spacing.xl,
  },
  distanceText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  bioSection: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.sm,
    textTransform: "uppercase",
    letterSpacing: 1,
  },
  bioText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  actionButtons: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  actionButton: {
    width: 60,
    height: 60,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
    ...Shadows.medium,
  },
  passButton: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderWidth: 2,
    borderColor: Colors.dark.error,
  },
  superLikeButton: {
    width: 48,
    height: 48,
    backgroundColor: Colors.dark.backgroundDefault,
    borderWidth: 2,
    borderColor: Colors.dark.gold,
  },
  likeButton: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderWidth: 2,
    borderColor: Colors.dark.success,
  },
  buttonPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.95 }],
  },
});
