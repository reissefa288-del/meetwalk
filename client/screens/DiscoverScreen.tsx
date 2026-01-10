import React, { useState, useCallback, useRef } from "react";
import { View, StyleSheet, Pressable, Dimensions, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  runOnJS,
  interpolate,
} from "react-native-reanimated";
import { Gesture, GestureDetector } from "react-native-gesture-handler";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { HeaderTitle } from "@/components/HeaderTitle";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/query-client";
import type { User } from "@shared/schema";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get("window");
const SWIPE_THRESHOLD = SCREEN_WIDTH * 0.3;

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

function SwipeCard({
  userProfile,
  currentUser,
  onSwipe,
  onPress,
}: {
  userProfile: User;
  currentUser: User;
  onSwipe: (direction: "left" | "right", isSuperLike?: boolean) => void;
  onPress: () => void;
}) {
  const translateX = useSharedValue(0);
  const translateY = useSharedValue(0);
  const rotation = useSharedValue(0);
  const scale = useSharedValue(1);

  const handleSwipeComplete = useCallback(
    (direction: "left" | "right") => {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onSwipe(direction);
    },
    [onSwipe]
  );

  const panGesture = Gesture.Pan()
    .onUpdate((event) => {
      translateX.value = event.translationX;
      translateY.value = event.translationY * 0.5;
      rotation.value = interpolate(event.translationX, [-SCREEN_WIDTH, SCREEN_WIDTH], [-15, 15]);
    })
    .onEnd((event) => {
      if (Math.abs(event.translationX) > SWIPE_THRESHOLD) {
        const direction = event.translationX > 0 ? "right" : "left";
        translateX.value = withTiming(
          direction === "right" ? SCREEN_WIDTH * 1.5 : -SCREEN_WIDTH * 1.5,
          { duration: 200 },
          () => {
            runOnJS(handleSwipeComplete)(direction);
          }
        );
      } else {
        translateX.value = withSpring(0);
        translateY.value = withSpring(0);
        rotation.value = withSpring(0);
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(onPress)();
  });

  const composedGesture = Gesture.Race(panGesture, tapGesture);

  const animatedCardStyle = useAnimatedStyle(() => ({
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotation.value}deg` },
      { scale: scale.value },
    ],
  }));

  const likeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [0, SWIPE_THRESHOLD], [0, 1]),
  }));

  const nopeOpacity = useAnimatedStyle(() => ({
    opacity: interpolate(translateX.value, [-SWIPE_THRESHOLD, 0], [1, 0]),
  }));

  const distance =
    currentUser.latitude && currentUser.longitude && userProfile.latitude && userProfile.longitude
      ? calculateDistance(
          currentUser.latitude,
          currentUser.longitude,
          userProfile.latitude,
          userProfile.longitude
        ).toFixed(1)
      : null;

  const photoUri = userProfile.photos?.[0] || "https://via.placeholder.com/400x600";

  return (
    <GestureDetector gesture={composedGesture}>
      <Animated.View style={[styles.card, animatedCardStyle]}>
        <Image source={{ uri: photoUri }} style={styles.cardImage} contentFit="cover" />
        <LinearGradient
          colors={["transparent", "rgba(0,0,0,0.8)"]}
          style={styles.cardGradient}
        />
        <Animated.View style={[styles.likeLabel, likeOpacity]}>
          <ThemedText style={styles.likeLabelText}>BEĞEN</ThemedText>
        </Animated.View>
        <Animated.View style={[styles.nopeLabel, nopeOpacity]}>
          <ThemedText style={styles.nopeLabelText}>PAS</ThemedText>
        </Animated.View>
        <View style={styles.cardInfo}>
          <View style={styles.cardNameRow}>
            <ThemedText style={styles.cardName}>
              {userProfile.name}, {userProfile.age}
            </ThemedText>
            {userProfile.isPremium ? (
              <View style={styles.premiumBadge}>
                <Feather name="star" size={12} color={Colors.dark.backgroundRoot} />
              </View>
            ) : null}
          </View>
          {distance ? (
            <View style={styles.distanceRow}>
              <Feather name="map-pin" size={14} color={Colors.dark.textSecondary} />
              <ThemedText style={styles.distanceText}>{distance} km uzakta</ThemedText>
            </View>
          ) : null}
          {userProfile.bio ? (
            <ThemedText style={styles.cardBio} numberOfLines={2}>
              {userProfile.bio}
            </ThemedText>
          ) : null}
        </View>
      </Animated.View>
    </GestureDetector>
  );
}

export default function DiscoverScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [history, setHistory] = useState<number[]>([]);

  const { data: nearbyUsers = [], isLoading, error } = useQuery<User[]>({
    queryKey: ["/api/users", user?.id, "nearby"],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/nearby`);
      if (response.status === 403) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Limit Reached");
      }
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.id,
    retry: false,
  });

  // ... (inside the return statement, before !currentProfile check)
  if (error && error.message.includes("limit")) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <HeaderTitle showLogo />
        </View>
        <View style={styles.emptyContainer}>
          <View style={[styles.emptyIcon, { backgroundColor: 'rgba(212, 175, 55, 0.1)' }]}>
            <Feather name="clock" size={48} color={Colors.dark.gold} />
          </View>
          <ThemedText style={styles.emptyTitle}>Günlük Sınır Doldu</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Ücretsiz kullanım süreniz olan 2 saati doldurdunuz. Yarın tekrar bekleriz!
          </ThemedText>
          <Pressable
            style={({ pressed }) => [styles.matchButton, { marginTop: Spacing.xl }, pressed && styles.buttonPressed]}
            onPress={() => navigation.navigate("Premium")}
          >
            <LinearGradient
              colors={[Colors.dark.goldLight, Colors.dark.gold]}
              style={styles.matchButtonGradient}
            >
              <ThemedText style={styles.matchButtonText}>Sınırsız Gold'a Geç (₺69)</ThemedText>
            </LinearGradient>
          </Pressable>
        </View>
      </View>
    );
  }

  const likeMutation = useMutation({
    mutationFn: async ({ toUserId, isSuperLike }: { toUserId: string; isSuperLike?: boolean }) => {
      const response = await apiRequest("POST", "/api/likes", {
        fromUserId: user?.id,
        toUserId,
        isSuperLike: isSuperLike || false,
      });
      return response.json();
    },
    onSuccess: (data) => {
      if (data.isMatch) {
        Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      }
      queryClient.invalidateQueries({ queryKey: ["/api/users", user?.id, "matches"] });
    },
  });

  const handleSwipe = useCallback(
    (direction: "left" | "right", isSuperLike?: boolean) => {
      const currentProfile = nearbyUsers[currentIndex];
      if (!currentProfile) return;

      if (direction === "right") {
        likeMutation.mutate({ toUserId: currentProfile.id, isSuperLike });
      }

      setHistory((prev) => [...prev, currentIndex]);
      setCurrentIndex((prev) => prev + 1);
    },
    [nearbyUsers, currentIndex, likeMutation]
  );

  const handleRewind = () => {
    if (history.length === 0) return;
    if (!user?.isPremium) {
      navigation.navigate("Premium");
      return;
    }
    
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const lastIndex = history[history.length - 1];
    setHistory((prev) => prev.slice(0, -1));
    setCurrentIndex(lastIndex);
  };

  const handlePass = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    handleSwipe("left");
  };

  const handleLike = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    handleSwipe("right");
  };

  const handleSuperLike = () => {
    Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    handleSwipe("right", true);
  };

  const currentProfile = nearbyUsers[currentIndex];

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <HeaderTitle showLogo />
        <Pressable style={styles.filterButton}>
          <Feather name="sliders" size={20} color={Colors.dark.text} />
        </Pressable>
      </View>

      <View style={[styles.cardContainer, { marginBottom: tabBarHeight + 80 }]}>
        {isLoading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={Colors.dark.gold} />
            <ThemedText style={styles.loadingText}>Yakındaki kişiler bulunuyor...</ThemedText>
          </View>
        ) : !currentProfile ? (
          <View style={styles.emptyContainer}>
            <View style={styles.emptyIcon}>
              <Feather name="map-pin" size={48} color={Colors.dark.gold} />
            </View>
            <ThemedText style={styles.emptyTitle}>Yakında kimse yok</ThemedText>
            <ThemedText style={styles.emptySubtitle}>
              Mesafeyi genişletmeyi deneyin veya daha sonra tekrar kontrol edin
            </ThemedText>
          </View>
        ) : (
          <SwipeCard
            key={currentProfile.id}
            userProfile={currentProfile}
            currentUser={user!}
            onSwipe={handleSwipe}
            onPress={() => navigation.navigate("ProfileDetail", { user: currentProfile })}
          />
        )}
      </View>

      {currentProfile ? (
        <View style={[styles.actionButtons, { bottom: tabBarHeight + Spacing.xl }]}>
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.rewindButton, pressed && styles.buttonPressed]}
            onPress={handleRewind}
          >
            <Feather name="rotate-ccw" size={20} color={Colors.dark.gold} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.passButton, pressed && styles.buttonPressed]}
            onPress={handlePass}
          >
            <Feather name="x" size={28} color={Colors.dark.error} />
          </Pressable>
          <Pressable
            style={({ pressed }) => [styles.actionButton, styles.superLikeButton, pressed && styles.buttonPressed]}
            onPress={handleSuperLike}
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
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
  },
  cardContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: Spacing.lg,
  },
  card: {
    width: SCREEN_WIDTH - Spacing.xl * 2,
    height: SCREEN_HEIGHT * 0.6,
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    backgroundColor: Colors.dark.backgroundDefault,
  },
  cardImage: {
    width: "100%",
    height: "100%",
  },
  cardGradient: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    height: "50%",
  },
  likeLabel: {
    position: "absolute",
    top: 40,
    left: 20,
    borderWidth: 3,
    borderColor: Colors.dark.success,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    transform: [{ rotate: "-15deg" }],
  },
  likeLabelText: {
    ...Typography.h3,
    color: Colors.dark.success,
    fontWeight: "700",
  },
  nopeLabel: {
    position: "absolute",
    top: 40,
    right: 20,
    borderWidth: 3,
    borderColor: Colors.dark.error,
    borderRadius: BorderRadius.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    transform: [{ rotate: "15deg" }],
  },
  nopeLabelText: {
    ...Typography.h3,
    color: Colors.dark.error,
    fontWeight: "700",
  },
  cardInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.xl,
  },
  cardNameRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  cardName: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  premiumBadge: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  distanceRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  matchOverlay: {
    zIndex: 1000,
    justifyContent: "center",
    alignItems: "center",
  },
  matchContent: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    width: "100%",
  },
  matchTitle: {
    fontSize: 48,
    fontWeight: "900",
    color: Colors.dark.gold,
    marginBottom: Spacing.xl,
    textAlign: "center",
    letterSpacing: 2,
    ...Shadows.gold,
  },
  matchAvatars: {
    flexDirection: "row",
    alignItems: "center",
    gap: -20,
    marginBottom: Spacing["2xl"],
  },
  matchAvatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 4,
    borderColor: Colors.dark.gold,
  },
  matchHeart: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.dark.backgroundRoot,
    justifyContent: "center",
    alignItems: "center",
    zIndex: 10,
    ...Shadows.gold,
  },
  matchSubtitle: {
    ...Typography.h4,
    color: Colors.dark.text,
    textAlign: "center",
    marginBottom: Spacing["2xl"],
    opacity: 0.9,
  },
  matchButton: {
    width: "100%",
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginBottom: Spacing.lg,
    ...Shadows.gold,
  },
  matchButtonGradient: {
    height: 56,
    justifyContent: "center",
    alignItems: "center",
  },
  matchButtonText: {
    ...Typography.body,
    color: Colors.dark.backgroundRoot,
    fontWeight: "700",
  },
  matchCloseButton: {
    padding: Spacing.md,
  },
  matchCloseText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    fontWeight: "600",
  },
  distanceText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  cardBio: {
    ...Typography.body,
    color: Colors.dark.text,
    marginTop: Spacing.sm,
    opacity: 0.9,
  },
  actionButtons: {
    position: "absolute",
    left: 0,
    right: 0,
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.lg,
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
  rewindButton: {
    width: 44,
    height: 44,
    backgroundColor: Colors.dark.backgroundDefault,
    borderWidth: 2,
    borderColor: Colors.dark.gold,
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
  loadingContainer: {
    alignItems: "center",
    gap: Spacing.lg,
  },
  loadingText: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
  },
  emptyContainer: {
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  emptyTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
});
