import React from "react";
import { View, StyleSheet, ScrollView, Pressable, Alert } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { Card } from "@/components/Card";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";

interface SettingsItemProps {
  icon: string;
  title: string;
  subtitle?: string;
  onPress?: () => void;
  showChevron?: boolean;
  danger?: boolean;
}

function SettingsItem({ icon, title, subtitle, onPress, showChevron = true, danger = false }: SettingsItemProps) {
  return (
    <Pressable
      style={({ pressed }) => [styles.settingsItem, pressed && styles.itemPressed]}
      onPress={onPress}
    >
      <View style={[styles.settingsIcon, danger && styles.settingsIconDanger]}>
        <Feather name={icon as any} size={20} color={danger ? Colors.dark.error : Colors.dark.gold} />
      </View>
      <View style={styles.settingsContent}>
        <ThemedText style={[styles.settingsTitle, danger && styles.settingsTitleDanger]}>
          {title}
        </ThemedText>
        {subtitle ? (
          <ThemedText style={styles.settingsSubtitle}>{subtitle}</ThemedText>
        ) : null}
      </View>
      {showChevron ? (
        <Feather name="chevron-right" size={20} color={Colors.dark.textSecondary} />
      ) : null}
    </Pressable>
  );
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, logout } = useAuth();

  const handleLogout = () => {
    Alert.alert(
      "Çıkış Yap",
      "Çıkış yapmak istediğinize emin misiniz?",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Çıkış Yap",
          style: "destructive",
          onPress: async () => {
            await logout();
          },
        },
      ]
    );
  };

  const handleDeleteAccount = () => {
    Alert.alert(
      "Hesabı Sil",
      "Hesabınızı silmek istediğinize emin misiniz? Bu işlem geri alınamaz.",
      [
        { text: "İptal", style: "cancel" },
        {
          text: "Sil",
          style: "destructive",
          onPress: () => {
            Alert.alert(
              "Silme İşlemini Onayla",
              "Bu işlem tüm verilerinizi, eşleşmelerinizi ve mesajlarınızı kalıcı olarak silecektir.",
              [
                { text: "İptal", style: "cancel" },
                {
                  text: "Sonsuza Dek Sil",
                  style: "destructive",
                  onPress: async () => {
                    await logout();
                  },
                },
              ]
            );
          },
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      <ScrollView
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
        showsVerticalScrollIndicator={false}
      >
        <ThemedText style={styles.sectionHeader}>Hesap</ThemedText>
        <Card elevation={1} style={styles.card}>
          <SettingsItem
            icon="user"
            title="Profili Düzenle"
            subtitle="Fotoğraflarınızı ve biyografinizi güncelleyin"
            onPress={() => navigation.navigate("EditProfile" as never)}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="mail"
            title="E-posta"
            subtitle={user?.email || "Ayarlanmadı"}
            showChevron={false}
          />
        </Card>

        <ThemedText style={styles.sectionHeader}>Keşfet</ThemedText>
        <Card elevation={1} style={styles.card}>
          <SettingsItem
            icon="map-pin"
            title="Konum"
            subtitle="Konumunuzu güncelleyin"
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="sliders"
            title="Mesafe"
            subtitle={`${user?.maxDistance || 3} km`}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="users"
            title="Yaş Aralığı"
            subtitle={`${user?.minAge || 18} - ${user?.maxAge || 50}`}
          />
        </Card>

        <ThemedText style={styles.sectionHeader}>Bildirimler</ThemedText>
        <Card elevation={1} style={styles.card}>
          <SettingsItem
            icon="bell"
            title="Yeni Eşleşmeler"
            subtitle="Biriyle eşleştiğinizde bildirim alın"
            showChevron={false}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="message-square"
            title="Mesajlar"
            subtitle="Yeni mesaj geldiğinde bildirim alın"
            showChevron={false}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="zap"
            title="MeetWalk Duyuruları"
            subtitle="Kampanya ve güncellemelerden haberdar olun"
            showChevron={false}
          />
        </Card>

        <ThemedText style={styles.sectionHeader}>Gizlilik ve Güvenlik</ThemedText>
        <Card elevation={1} style={styles.card}>
          <SettingsItem
            icon="shield"
            title="Gizlilik Ayarları"
            subtitle="Görünürlüğünüzü kontrol edin"
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="alert-circle"
            title="Engellenenler Listesi"
            subtitle="Engellenen kullanıcıları yönetin"
          />
        </Card>

        <ThemedText style={styles.sectionHeader}>Destek</ThemedText>
        <Card elevation={1} style={styles.card}>
          <SettingsItem
            icon="help-circle"
            title="Yardım ve Destek"
            subtitle="MeetWalk ile ilgili yardım alın"
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="file-text"
            title="Kullanım Koşulları"
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="lock"
            title="Gizlilik Politikası"
          />
        </Card>

        <ThemedText style={styles.sectionHeader}>Hesap İşlemleri</ThemedText>
        <Card elevation={1} style={styles.card}>
          <SettingsItem
            icon="log-out"
            title="Çıkış Yap"
            onPress={handleLogout}
            showChevron={false}
          />
          <View style={styles.divider} />
          <SettingsItem
            icon="trash-2"
            title="Hesabı Sil"
            onPress={handleDeleteAccount}
            showChevron={false}
            danger
          />
        </Card>

        <ThemedText style={styles.version}>MeetWalk v1.0.0</ThemedText>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  scrollContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  sectionHeader: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    textTransform: "uppercase",
    letterSpacing: 1,
    marginBottom: Spacing.sm,
    marginTop: Spacing.lg,
    marginLeft: Spacing.sm,
  },
  card: {
    padding: 0,
    overflow: "hidden",
  },
  settingsItem: {
    flexDirection: "row",
    alignItems: "center",
    padding: Spacing.lg,
  },
  itemPressed: {
    opacity: 0.7,
  },
  settingsIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: Colors.dark.backgroundSecondary,
    justifyContent: "center",
    alignItems: "center",
    marginRight: Spacing.md,
  },
  settingsIconDanger: {
    backgroundColor: "rgba(255, 59, 48, 0.1)",
  },
  settingsContent: {
    flex: 1,
  },
  settingsTitle: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  settingsTitleDanger: {
    color: Colors.dark.error,
  },
  settingsSubtitle: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginTop: 2,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.dark.border,
    marginLeft: 68,
  },
  version: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    marginTop: Spacing["2xl"],
  },
});
