import React from "react";
import { View, StyleSheet, FlatList, Pressable, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { BlurView } from "expo-blur";
import { LinearGradient } from "expo-linear-gradient";
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

function ChatListItem({ match, onPress }: { match: MatchWithUser; onPress: () => void }) {
  const photoUri = match.otherUser?.photos?.[0] || "https://via.placeholder.com/60";

  return (
    <Pressable
      style={({ pressed }) => [styles.chatItem, pressed && styles.chatItemPressed]}
      onPress={onPress}
    >
      <Image source={{ uri: photoUri }} style={styles.avatar} contentFit="cover" />
      <View style={styles.chatInfo}>
        <View style={styles.chatHeader}>
          <ThemedText style={styles.chatName}>{match.otherUser?.name || "Bilinmiyor"}</ThemedText>
          <ThemedText style={styles.chatTime}>Sohbete başla</ThemedText>
        </View>
        <ThemedText style={styles.lastMessage} numberOfLines={1}>
          Bir konuşma başlatmak için merhaba deyin!
        </ThemedText>
      </View>
    </Pressable>
  );
}

function PremiumPaywall({ onPress }: { onPress: () => void }) {
  return (
    <View style={styles.paywallContainer}>
      <BlurView intensity={20} tint="dark" style={styles.paywallBlur}>
        <View style={styles.paywallContent}>
          <View style={styles.lockIcon}>
            <Feather name="lock" size={32} color={Colors.dark.gold} />
          </View>
          <ThemedText style={styles.paywallTitle}>Mesajların Kilidini Aç</ThemedText>
          <ThemedText style={styles.paywallSubtitle}>
            Eşleşmelerinizle sohbet etmeye başlamak için Gold'a yükseltin
          </ThemedText>
          <View style={styles.featureList}>
            <View style={styles.featureItem}>
              <Feather name="check" size={16} color={Colors.dark.gold} />
              <ThemedText style={styles.featureText}>Sınırsız mesaj</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check" size={16} color={Colors.dark.gold} />
              <ThemedText style={styles.featureText}>Okundu bilgisi</ThemedText>
            </View>
            <View style={styles.featureItem}>
              <Feather name="check" size={16} color={Colors.dark.gold} />
              <ThemedText style={styles.featureText}>Öncelikli eşleşme</ThemedText>
            </View>
          </View>
          <Pressable
            style={({ pressed }) => [styles.upgradeButton, pressed && styles.buttonPressed]}
            onPress={onPress}
          >
            <LinearGradient
              colors={[Colors.dark.goldLight, Colors.dark.gold, Colors.dark.goldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <ThemedText style={styles.upgradeButtonText}>Gold'a Yükselt</ThemedText>
            </LinearGradient>
          </Pressable>
        </View>
      </BlurView>
    </View>
  );
}

export default function MessagesScreen() {
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

  const isPremium = user?.isPremium;

  const renderItem = ({ item }: { item: MatchWithUser }) => (
    <ChatListItem
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
        <ThemedText style={styles.title}>Mesajlar</ThemedText>
        <Pressable style={styles.infoButton}>
          <Feather name="info" size={20} color={Colors.dark.text} />
        </Pressable>
      </View>

      {!isPremium ? (
        <View style={styles.lockedContainer}>
          <FlatList
            data={matches.slice(0, 3)}
            renderItem={renderItem}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContent}
            scrollEnabled={false}
            style={styles.blurredList}
          />
          <PremiumPaywall onPress={() => navigation.navigate("Premium")} />
        </View>
      ) : isLoading ? (
        <View style={styles.centerContainer}>
          <ActivityIndicator size="large" color={Colors.dark.gold} />
        </View>
      ) : matches.length === 0 ? (
        <View style={styles.centerContainer}>
          <View style={styles.emptyIcon}>
            <Feather name="message-circle" size={48} color={Colors.dark.gold} />
          </View>
          <ThemedText style={styles.emptyTitle}>Henüz konuşma yok</ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            Sohbete başlamak için biriyle eşleşin
          </ThemedText>
        </View>
      ) : (
        <FlatList
          data={matches}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
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
  infoButton: {
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
  chatItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.md,
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  chatItemPressed: {
    opacity: 0.8,
  },
  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
  },
  chatInfo: {
    flex: 1,
    marginLeft: Spacing.md,
  },
  chatHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  chatName: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  chatTime: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
  },
  lastMessage: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  lockedContainer: {
    flex: 1,
    position: "relative",
  },
  blurredList: {
    opacity: 0.3,
  },
  paywallContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  paywallBlur: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    width: "100%",
  },
  paywallContent: {
    padding: Spacing["2xl"],
    alignItems: "center",
    backgroundColor: "rgba(26, 26, 26, 0.9)",
  },
  lockIcon: {
    width: 72,
    height: 72,
    borderRadius: 36,
    backgroundColor: Colors.dark.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  paywallTitle: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  paywallSubtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginBottom: Spacing.xl,
  },
  featureList: {
    width: "100%",
    marginBottom: Spacing.xl,
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  featureText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  upgradeButton: {
    width: "100%",
    borderRadius: BorderRadius.full,
    overflow: "hidden",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  gradientButton: {
    height: Spacing.buttonHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  upgradeButtonText: {
    ...Typography.body,
    color: Colors.dark.backgroundRoot,
    fontWeight: "600",
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
