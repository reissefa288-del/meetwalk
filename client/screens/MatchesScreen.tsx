import React from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useQuery } from "@tanstack/react-query";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import type { Match, User } from "@shared/schema";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

interface MatchWithUser extends Match {
  otherUser?: User;
}

function formatMatchDate(date: Date | string | null): string {
  if (!date) return "";
  const matchDate = new Date(date);
  const now = new Date();
  const diffMs = now.getTime() - matchDate.getTime();
  const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  
  if (diffDays === 0) return "Today";
  if (diffDays === 1) return "Yesterday";
  if (diffDays < 7) return `${diffDays} days ago`;
  return matchDate.toLocaleDateString();
}

function MatchCard({ match, onPress }: { match: MatchWithUser; onPress: () => void }) {
  const isNew = match.createdAt && 
    new Date().getTime() - new Date(match.createdAt).getTime() < 24 * 60 * 60 * 1000;
  
  const photoUri = match.otherUser?.photos?.[0] || "https://via.placeholder.com/150";

  return (
    <Pressable
      style={({ pressed }) => [styles.matchCard, pressed && styles.cardPressed]}
      onPress={onPress}
    >
      <Image source={{ uri: photoUri }} style={styles.matchPhoto} contentFit="cover" />
      {isNew ? (
        <View style={styles.newBadge}>
          <ThemedText style={styles.newBadgeText}>NEW</ThemedText>
        </View>
      ) : null}
      <View style={styles.matchInfo}>
        <ThemedText style={styles.matchName} numberOfLines={1}>
          {match.otherUser?.name || "Unknown"}
        </ThemedText>
        <ThemedText style={styles.matchDate}>
          {formatMatchDate(match.createdAt)}
        </ThemedText>
      </View>
    </Pressable>
  );
}

export default function MatchesScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const { data: matches = [], isLoading } = useQuery<MatchWithUser[]>({
    queryKey: ["/api/users", user?.id, "matches"],
    queryFn: async () => {
      if (!user?.id) return [];
      const response = await fetch(`/api/users/${user.id}/matches`);
      if (!response.ok) return [];
      return response.json();
    },
    enabled: !!user?.id,
  });

  const renderItem = ({ item }: { item: MatchWithUser }) => (
    <MatchCard
      match={item}
      onPress={() => {
        if (item.otherUser) {
          navigation.navigate("Chat", { matchId: item.id, otherUser: item.otherUser });
        }
      }}
    />
  );

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Matches</ThemedText>
        <Pressable style={styles.filterButton}>
          <Feather name="filter" size={20} color={Colors.dark.text} />
        </Pressable>
      </View>

      {isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.dark.gold} />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="heart" size={48} color={Colors.dark.gold} />
          </View>
          <ThemedText style={styles.emptyTitle}>No matches yet</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Start swiping to find your matches
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          numColumns={2}
          columnWrapperStyle={styles.row}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: tabBarHeight + Spacing.xl },
          ]}
          showsVerticalScrollIndicator={false}
        />
      )}
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
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.h2,
    color: Colors.dark.text,
  },
  filterButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
  },
  listContent: {
    paddingHorizontal: Spacing.lg,
  },
  row: {
    justifyContent: "space-between",
    marginBottom: Spacing.md,
  },
  matchCard: {
    width: "48%",
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.lg,
    overflow: "hidden",
    backgroundColor: Colors.dark.backgroundDefault,
  },
  cardPressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
  matchPhoto: {
    width: "100%",
    height: "100%",
  },
  newBadge: {
    position: "absolute",
    top: Spacing.sm,
    right: Spacing.sm,
    backgroundColor: Colors.dark.gold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.xs,
  },
  newBadgeText: {
    ...Typography.caption,
    color: Colors.dark.backgroundRoot,
    fontWeight: "700",
    fontSize: 10,
  },
  matchInfo: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    padding: Spacing.md,
    backgroundColor: "rgba(0,0,0,0.6)",
  },
  matchName: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  matchDate: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
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
