import React from "react";
import { View, StyleSheet, ScrollView, Pressable } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import { useNavigation } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

export default function ProfileScreen() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const { user } = useAuth();

  const photoUri = user?.photos?.[0] || "https://via.placeholder.com/200";

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.lg }]}>
      <View style={styles.header}>
        <ThemedText style={styles.title}>Profil</ThemedText>
        <Pressable
          style={styles.settingsButton}
          onPress={() => navigation.navigate("Settings")}
        >
          <Feather name="settings" size={20} color={Colors.dark.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: tabBarHeight + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.profileHeader}>
          <View style={styles.photoContainer}>
            <Image source={{ uri: photoUri }} style={styles.profilePhoto} contentFit="cover" />
            {user?.isPremium ? (
              <View style={styles.premiumBadge}>
                <Feather name="star" size={16} color={Colors.dark.backgroundRoot} />
              </View>
            ) : null}
          </View>
          <ThemedText style={styles.userName}>
            {user?.name || "İsminiz"}, {user?.age || "--"}
          </ThemedText>
          <Pressable
            style={({ pressed }) => [styles.editButton, pressed && styles.buttonPressed]}
            onPress={() => navigation.navigate("EditProfile")}
          >
            <Feather name="edit-2" size={16} color={Colors.dark.gold} />
            <ThemedText style={styles.editButtonText}>Profili Düzenle</ThemedText>
          </Pressable>
        </View>

        {user?.bio ? (
          <Card elevation={1} style={styles.bioCard}>
            <ThemedText style={styles.sectionTitle}>Hakkında</ThemedText>
            <ThemedText style={styles.bioText}>{user.bio}</ThemedText>
          </Card>
        ) : null}

        <View style={styles.tagsContainer}>
          <ThemedText style={styles.sectionTitle}>İlgi Alanları</ThemedText>
          <View style={styles.tagsList}>
            {["Seyahat", "Müzik", "Sinema", "Spor", "Kahve"].map((tag) => (
              <View key={tag} style={styles.tag}>
                <ThemedText style={styles.tagText}>{tag}</ThemedText>
              </View>
            ))}
          </View>
        </View>

        <View style={styles.photoGrid}>
          <ThemedText style={styles.sectionTitle}>Fotoğraflar</ThemedText>
          <View style={styles.photoGridContent}>
            {(user?.photos || []).map((photo, index) => (
              <View key={index} style={styles.gridPhoto}>
                <Image source={{ uri: photo }} style={styles.gridPhotoImage} contentFit="cover" />
              </View>
            ))}
            {(user?.photos?.length || 0) < 6 ? (
              <Pressable
                style={styles.addPhotoButton}
                onPress={() => navigation.navigate("EditProfile")}
              >
                <Feather name="plus" size={24} color={Colors.dark.gold} />
              </Pressable>
            ) : null}
          </View>
        </View>

        {!user?.isPremium ? (
          <Pressable
            style={({ pressed }) => [styles.premiumCard, pressed && styles.buttonPressed]}
            onPress={() => navigation.navigate("Premium")}
          >
            <LinearGradient
              colors={[Colors.dark.goldLight, Colors.dark.gold, Colors.dark.goldDark]}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.premiumGradient}
            >
              <View style={styles.premiumContent}>
                <View style={styles.premiumIcon}>
                  <Feather name="star" size={24} color={Colors.dark.gold} />
                </View>
                <View style={styles.premiumTextContainer}>
                  <ThemedText style={styles.premiumTitle}>MeetWalk Gold</ThemedText>
                  <ThemedText style={styles.premiumSubtitle}>
                    Sınırsız mesajlaşma ve daha fazlasının kilidini açın
                  </ThemedText>
                </View>
                <Feather name="chevron-right" size={24} color={Colors.dark.backgroundRoot} />
              </View>
            </LinearGradient>
          </Pressable>
        ) : (
          <Card elevation={1} style={styles.premiumActiveCard}>
            <View style={styles.premiumActiveContent}>
              <View style={styles.premiumActiveBadge}>
                <Feather name="star" size={20} color={Colors.dark.backgroundRoot} />
              </View>
              <View style={styles.premiumTextContainer}>
                <ThemedText style={styles.premiumActiveTitle}>MeetWalk Gold</ThemedText>
                <ThemedText style={styles.premiumActiveSubtitle}>Aktif abonelik</ThemedText>
              </View>
            </View>
          </Card>
        )}

        <View style={styles.statsContainer}>
          <Card elevation={1} style={styles.statCard}>
            <ThemedText style={styles.statValue}>{user?.maxDistance || 3}</ThemedText>
            <ThemedText style={styles.statLabel}>km çap</ThemedText>
          </Card>
          <Card elevation={1} style={styles.statCard}>
            <ThemedText style={styles.statValue}>{user?.minAge || 18}-{user?.maxAge || 50}</ThemedText>
            <ThemedText style={styles.statLabel}>yaş aralığı</ThemedText>
          </Card>
        </View>
      </ScrollView>
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
  settingsButton: {
    width: 40,
    height: 40,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
  },
  scrollContent: {
    paddingHorizontal: Spacing.xl,
  },
  profileHeader: {
    alignItems: "center",
    marginBottom: Spacing.xl,
  },
  photoContainer: {
    position: "relative",
    marginBottom: Spacing.lg,
  },
  profilePhoto: {
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 3,
    borderColor: Colors.dark.gold,
  },
  premiumBadge: {
    position: "absolute",
    bottom: 0,
    right: 0,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.gold,
    justifyContent: "center",
    alignItems: "center",
    borderWidth: 3,
    borderColor: Colors.dark.backgroundRoot,
  },
  userName: {
    ...Typography.h3,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
  },
  editButton: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundDefault,
    borderWidth: 1,
    borderColor: Colors.dark.gold,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  editButtonText: {
    ...Typography.body,
    color: Colors.dark.gold,
  },
  bioCard: {
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  bioText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  tagsContainer: {
    marginBottom: Spacing.xl,
  },
  tagsList: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  tag: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundDefault,
    borderWidth: 1,
    borderColor: Colors.dark.gold,
  },
  tagText: {
    ...Typography.small,
    color: Colors.dark.gold,
  },
  photoGrid: {
    marginBottom: Spacing.xl,
  },
  photoGridContent: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  gridPhoto: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: BorderRadius.sm,
    overflow: "hidden",
  },
  gridPhotoImage: {
    width: "100%",
    height: "100%",
  },
  addPhotoButton: {
    width: "31%",
    aspectRatio: 1,
    borderRadius: BorderRadius.sm,
    backgroundColor: Colors.dark.backgroundDefault,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: "dashed",
    justifyContent: "center",
    alignItems: "center",
  },
  premiumCard: {
    borderRadius: BorderRadius.xl,
    overflow: "hidden",
    marginBottom: Spacing.xl,
    ...Shadows.gold,
  },
  premiumGradient: {
    padding: Spacing.lg,
  },
  premiumContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: Colors.dark.backgroundRoot,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  premiumTextContainer: {
    flex: 1,
  },
  premiumTitle: {
    ...Typography.body,
    color: Colors.dark.backgroundRoot,
    fontWeight: "700",
  },
  premiumSubtitle: {
    ...Typography.small,
    color: Colors.dark.backgroundRoot,
    opacity: 0.8,
  },
  premiumActiveCard: {
    marginBottom: Spacing.xl,
  },
  premiumActiveContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  premiumActiveBadge: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.gold,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  premiumActiveTitle: {
    ...Typography.body,
    color: Colors.dark.gold,
    fontWeight: "600",
  },
  premiumActiveSubtitle: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  statsContainer: {
    flexDirection: "row",
    gap: Spacing.md,
  },
  statCard: {
    flex: 1,
    alignItems: "center",
  },
  statValue: {
    ...Typography.h3,
    color: Colors.dark.gold,
  },
  statLabel: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
  },
});
