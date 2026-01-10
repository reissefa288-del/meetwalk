import React, { useState } from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography, Shadows } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/query-client";

type PlanType = "monthly" | "yearly" | "superlikes";

const FEATURES = [
  { icon: "message-circle", title: "Sınırsız Mesaj", description: "Tüm eşleşmelerinizle özgürce sohbet edin" },
  { icon: "eye", title: "Seni Kimlerin Beğendiğini Gör", description: "Kaydırmadan önce kimin ilgilendiğini bilin" },
  { icon: "zap", title: "Sınırsız Kullanım", description: "Günlük 2 saat sınırına takılmadan full vakit eşleşin" },
  { icon: "star", title: "Süper Beğeniler", description: "Fark edilme şansınızı 3 kat artırın" },
  { icon: "x-circle", title: "Reklamları Kaldır", description: "Reklamsız bir deneyimin tadını çıkarın" },
];

export default function PremiumScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, refreshUser } = useAuth();
  const [selectedPlan, setSelectedPlan] = useState<PlanType>("yearly");
  const [isLoading, setIsLoading] = useState(false);

  const handlePurchase = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      if (selectedPlan === "superlikes") {
        await apiRequest("POST", `/api/users/${user.id}/super-likes`, {
          amount: 10
        });
        await refreshUser();
        Alert.alert(
          "Başarılı!",
          "10 adet Süper Beğeni hesabınıza tanımlandı.",
          [{ text: "Tamam", onPress: () => navigation.goBack() }]
        );
      } else {
        const expiresAt = new Date();
        if (selectedPlan === "monthly") {
          expiresAt.setMonth(expiresAt.getMonth() + 1);
        } else {
          expiresAt.setFullYear(expiresAt.getFullYear() + 1);
        }

        await apiRequest("POST", `/api/users/${user.id}/premium`, {
          isPremium: true,
          expiresAt: expiresAt.toISOString(),
        });

        await refreshUser();
        Alert.alert(
          "Gold'a Hoş Geldiniz!",
          "Premium aboneliğiniz artık aktif. Sınırsız mesajlaşma ve özel özelliklerin tadını çıkarın!",
          [{ text: "Keşfetmeye Başla", onPress: () => navigation.goBack() }]
        );
      }
    } catch (error) {
      Alert.alert("Hata", "Satın alma işlemi başarısız oldu. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <View style={styles.placeholder} />
        <Pressable style={styles.closeButton} onPress={() => navigation.goBack()}>
          <Feather name="x" size={24} color={Colors.dark.text} />
        </Pressable>
      </View>

      <ScrollView
        contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.logoContainer}>
          <LinearGradient
            colors={[Colors.dark.goldLight, Colors.dark.gold, Colors.dark.goldDark]}
            style={styles.logoBg}
          >
            <Feather name="star" size={40} color={Colors.dark.backgroundRoot} />
          </LinearGradient>
          <ThemedText style={styles.title}>MeetWalk Gold</ThemedText>
          <ThemedText style={styles.subtitle}>
            Tüm özelliklerin kilidini açın ve mükemmel eşinizi bulun
          </ThemedText>
        </View>

        <View style={styles.featuresContainer}>
          {FEATURES.map((feature, index) => (
            <View key={index} style={styles.featureItem}>
              <View style={styles.featureIcon}>
                <Feather name={feature.icon as any} size={20} color={Colors.dark.gold} />
              </View>
              <View style={styles.featureText}>
                <ThemedText style={styles.featureTitle}>{feature.title}</ThemedText>
                <ThemedText style={styles.featureDescription}>{feature.description}</ThemedText>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.plansContainer}>
          <Pressable
            style={({ pressed }) => [
              styles.planCard,
              selectedPlan === "yearly" && styles.planCardSelected,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setSelectedPlan("yearly")}
          >
            <View style={styles.planBadge}>
              <ThemedText style={styles.planBadgeText}>EN İYİ FİYAT</ThemedText>
            </View>
            <View style={styles.planHeader}>
              <View style={styles.planRadio}>
                {selectedPlan === "yearly" ? (
                  <View style={styles.planRadioSelected} />
                ) : null}
              </View>
              <View style={styles.planDetails}>
                <ThemedText style={styles.planTitle}>Yıllık</ThemedText>
                <ThemedText style={styles.planPrice}>₺399.99/yıl</ThemedText>
                <ThemedText style={styles.planSavings}>%50 Tasarruf</ThemedText>
              </View>
            </View>
          </Pressable>

          <Pressable
            style={({ pressed }) => [
              styles.planCard,
              selectedPlan === "monthly" && styles.planCardSelected,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setSelectedPlan("monthly")}
          >
            <View style={styles.planHeader}>
              <View style={styles.planRadio}>
                {selectedPlan === "monthly" ? (
                  <View style={styles.planRadioSelected} />
                ) : null}
              </View>
              <View style={styles.planDetails}>
                <ThemedText style={styles.planTitle}>Aylık</ThemedText>
                <ThemedText style={styles.planPrice}>₺69.00/ay</ThemedText>
              </View>
            </View>
          </Pressable>

          <View style={styles.divider} />
          
          <ThemedText style={styles.sectionTitle}>Paketler</ThemedText>
          <Pressable
            style={({ pressed }) => [
              styles.planCard,
              selectedPlan === "superlikes" && styles.planCardSelected,
              pressed && styles.buttonPressed,
            ]}
            onPress={() => setSelectedPlan("superlikes")}
          >
            <View style={styles.planBadge}>
              <ThemedText style={styles.planBadgeText}>POPÜLER</ThemedText>
            </View>
            <View style={styles.planHeader}>
              <View style={styles.planRadio}>
                {selectedPlan === "superlikes" ? (
                  <View style={styles.planRadioSelected} />
                ) : null}
              </View>
              <View style={styles.planDetails}>
                <ThemedText style={styles.planTitle}>10 Süper Beğeni</ThemedText>
                <ThemedText style={styles.planPrice}>₺50.00</ThemedText>
              </View>
            </View>
          </Pressable>
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [styles.purchaseButton, pressed && styles.buttonPressed]}
          onPress={handlePurchase}
          disabled={isLoading}
        >
          <LinearGradient
            colors={[Colors.dark.goldLight, Colors.dark.gold, Colors.dark.goldDark]}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={styles.gradientButton}
          >
            {isLoading ? (
              <ActivityIndicator color={Colors.dark.backgroundRoot} />
            ) : (
              <ThemedText style={styles.purchaseButtonText}>
                Gold'a Yükselt
              </ThemedText>
            )}
          </LinearGradient>
        </Pressable>
        <View style={styles.legalLinks}>
          <Pressable>
            <ThemedText style={styles.legalText}>Kullanım Koşulları</ThemedText>
          </Pressable>
          <ThemedText style={styles.legalDivider}>|</ThemedText>
          <Pressable>
            <ThemedText style={styles.legalText}>Satın Alımları Geri Yükle</ThemedText>
          </Pressable>
        </View>
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
  },
  placeholder: {
    width: 40,
  },
  closeButton: {
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
  logoContainer: {
    alignItems: "center",
    marginBottom: Spacing["2xl"],
  },
  logoBg: {
    width: 80,
    height: 80,
    borderRadius: 40,
    justifyContent: "center",
    alignItems: "center",
    marginBottom: Spacing.lg,
    ...Shadows.gold,
  },
  title: {
    ...Typography.h1,
    color: Colors.dark.gold,
    marginBottom: Spacing.sm,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
  featuresContainer: {
    marginBottom: Spacing["2xl"],
  },
  featureItem: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  featureIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  featureDescription: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  plansContainer: {
    gap: Spacing.md,
  },
  planCard: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.lg,
    padding: Spacing.lg,
    borderWidth: 2,
    borderColor: Colors.dark.border,
    position: "relative",
    overflow: "hidden",
  },
  planCardSelected: {
    borderColor: Colors.dark.gold,
  },
  planBadge: {
    position: "absolute",
    top: 0,
    right: 0,
    backgroundColor: Colors.dark.gold,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    borderBottomLeftRadius: BorderRadius.sm,
  },
  planBadgeText: {
    ...Typography.caption,
    color: Colors.dark.backgroundRoot,
    fontWeight: "700",
    fontSize: 10,
  },
  planHeader: {
    flexDirection: "row",
    alignItems: "center",
  },
  planRadio: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: Colors.dark.gold,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  planRadioSelected: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.dark.gold,
  },
  planDetails: {
    flex: 1,
  },
  planTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  planPrice: {
    ...Typography.h4,
    color: Colors.dark.gold,
  },
  planSavings: {
    ...Typography.small,
    color: Colors.dark.success,
    fontWeight: "600",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  sectionTitle: {
    ...Typography.h4,
    color: Colors.dark.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.backgroundDefault,
    marginVertical: Spacing.xl,
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  purchaseButton: {
    borderRadius: BorderRadius.full,
    overflow: "hidden",
    marginBottom: Spacing.md,
    ...Shadows.gold,
  },
  gradientButton: {
    height: Spacing.buttonHeight,
    justifyContent: "center",
    alignItems: "center",
  },
  purchaseButtonText: {
    ...Typography.body,
    color: Colors.dark.backgroundRoot,
    fontWeight: "700",
  },
  legalLinks: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: Spacing.sm,
  },
  legalText: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
  legalDivider: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
  },
});
