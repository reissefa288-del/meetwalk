import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, Image, ActivityIndicator } from "react-native";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/lib/auth-context";
import { Feather } from "@expo/vector-icons";

export default function LoginScreen() {
  const insets = useSafeAreaInsets();
  const { login, isLoading } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [step, setStep] = useState<"welcome" | "email" | "name">("welcome");

  const handleContinue = async () => {
    if (step === "welcome") {
      setStep("email");
    } else if (step === "email") {
      if (!email.includes("@")) {
        Alert.alert("Geçersiz E-posta", "Lütfen geçerli bir e-posta adresi girin.");
        return;
      }
      setStep("name");
    } else if (step === "name") {
      if (name.trim().length < 2) {
        Alert.alert("Geçersiz İsim", "Lütfen isminizi girin.");
        return;
      }
      try {
        await login(email.toLowerCase().trim(), name.trim());
      } catch (error) {
        Alert.alert("Hata", "Hesap oluşturulamadı. Lütfen tekrar deneyin.");
      }
    }
  };

  const renderContent = () => {
    if (step === "welcome") {
      return (
        <View style={styles.welcomeContent}>
          <Image
            source={require("../../assets/images/icon.png")}
            style={styles.logo}
            resizeMode="contain"
          />
          <ThemedText style={styles.title}>MeetWalk</ThemedText>
          <ThemedText style={styles.subtitle}>
            Çevrenizdeki harika insanları bulun ve anlamlı bağlantılar kurun
          </ThemedText>
        </View>
      );
    }

    if (step === "email") {
      return (
        <View style={styles.formContent}>
          <ThemedText style={styles.formTitle}>E-posta adresiniz nedir?</ThemedText>
          <ThemedText style={styles.formSubtitle}>
            Bunu hesabınızı güvende tutmak için kullanacağız
          </ThemedText>
          <View style={styles.inputContainer}>
            <Feather name="mail" size={20} color={Colors.dark.textSecondary} />
            <input
              type="email"
              value={email}
              onChange={(e: any) => setEmail(e.target.value)}
              placeholder="E-postanızı girin"
              style={{
                flex: 1,
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                color: Colors.dark.text,
                fontSize: 16,
                marginLeft: 12,
              }}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.formContent}>
        <ThemedText style={styles.formTitle}>İsminiz nedir?</ThemedText>
        <ThemedText style={styles.formSubtitle}>
          Diğerlerine bu şekilde görüneceksiniz
        </ThemedText>
        <View style={styles.inputContainer}>
          <Feather name="user" size={20} color={Colors.dark.textSecondary} />
          <input
            type="text"
            value={name}
            onChange={(e: any) => setName(e.target.value)}
            placeholder="İsminizi girin"
            style={{
              flex: 1,
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              color: Colors.dark.text,
              fontSize: 16,
              marginLeft: 12,
            }}
          />
        </View>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + Spacing.xl },
        ]}
      >
        {renderContent()}
      </KeyboardAwareScrollViewCompat>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {step !== "welcome" && (
          <Pressable
            style={styles.backButton}
            onPress={() => setStep(step === "name" ? "email" : "welcome")}
          >
            <Feather name="arrow-left" size={24} color={Colors.dark.text} />
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleContinue}
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
              <ThemedText style={styles.buttonText}>
                {step === "welcome" ? "Başla" : step === "email" ? "Devam Et" : "Hesap Oluştur"}
              </ThemedText>
            )}
          </LinearGradient>
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
  scrollContent: {
    flexGrow: 1,
    justifyContent: "center",
    paddingHorizontal: Spacing.xl,
  },
  welcomeContent: {
    alignItems: "center",
  },
  logo: {
    width: 120,
    height: 120,
    borderRadius: 24,
    marginBottom: Spacing["2xl"],
  },
  title: {
    ...Typography.h1,
    color: Colors.dark.gold,
    marginBottom: Spacing.md,
  },
  subtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: "center",
    maxWidth: 280,
  },
  formContent: {
    paddingHorizontal: Spacing.lg,
  },
  formTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  formSubtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing["2xl"],
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    paddingHorizontal: Spacing.lg,
    height: Spacing.inputHeight + 8,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  footer: {
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
  },
  backButton: {
    width: 52,
    height: 52,
    borderRadius: BorderRadius.full,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
  },
  continueButton: {
    flex: 1,
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
  buttonText: {
    ...Typography.body,
    color: Colors.dark.backgroundRoot,
    fontWeight: "600",
  },
});
