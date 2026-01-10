import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator, Platform } from "react-native";
import { Image } from "expo-image";
import { LinearGradient } from "expo-linear-gradient";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { Feather } from "@expo/vector-icons";
import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/query-client";

type OnboardingStep = "photo" | "bio" | "age" | "location";

export default function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const { user, updateUser, refreshUser } = useAuth();
  const [step, setStep] = useState<OnboardingStep>("photo");
  const [photos, setPhotos] = useState<string[]>([]);
  const [bio, setBio] = useState("");
  const [age, setAge] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
      allowsEditing: true,
      aspect: [3, 4],
      quality: 0.8,
    });

    if (!result.canceled && result.assets[0]) {
      setPhotos([...photos, result.assets[0].uri]);
    }
  };

  const removePhoto = (index: number) => {
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleNext = async () => {
    if (step === "photo") {
      if (photos.length < 1) {
        Alert.alert("Fotoğraf Ekle", "Devam etmek için lütfen en az bir fotoğraf ekleyin.");
        return;
      }
      setStep("bio");
    } else if (step === "bio") {
      setStep("age");
    } else if (step === "age") {
      const ageNum = parseInt(age);
      if (isNaN(ageNum) || ageNum < 18) {
        Alert.alert("Geçersiz Yaş", "MeetWalk'u kullanmak için 18 yaşında veya daha büyük olmalısınız.");
        return;
      }
      setStep("location");
    } else if (step === "location") {
      await requestLocation();
    }
  };

  const requestLocation = async () => {
    setIsLoading(true);
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        Alert.alert(
          "Konum Gerekli",
          "MeetWalk yakındaki kişileri bulmak için konumunuza ihtiyaç duyar. Lütfen Ayarlar'dan konumu etkinleştirin.",
          Platform.OS !== "web"
            ? [
                { text: "İptal", style: "cancel" },
                { text: "Ayarları Aç", onPress: () => Location.enableNetworkProviderAsync?.() },
              ]
            : undefined
        );
        setIsLoading(false);
        return;
      }

      const location = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });

      await updateUser({
        photos,
        bio: bio.trim() || undefined,
        age: parseInt(age),
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
      });

      if (user) {
        await apiRequest("POST", `/api/users/${user.id}/location`, {
          latitude: location.coords.latitude,
          longitude: location.coords.longitude,
        });
      }

      await refreshUser();
    } catch (error) {
      console.error("Konum hatası:", error);
      Alert.alert("Hata", "Konum alınamadı. Lütfen tekrar deneyin.");
    } finally {
      setIsLoading(false);
    }
  };

  const renderStepIndicator = () => (
    <View style={styles.stepIndicator}>
      {["photo", "bio", "age", "location"].map((s, index) => (
        <View
          key={s}
          style={[
            styles.stepDot,
            s === step && styles.stepDotActive,
            ["photo", "bio", "age", "location"].indexOf(step) > index && styles.stepDotCompleted,
          ]}
        />
      ))}
    </View>
  );

  const renderContent = () => {
    if (step === "photo") {
      return (
        <View style={styles.stepContent}>
          <ThemedText style={styles.stepTitle}>Fotoğraflarınızı ekleyin</ThemedText>
          <ThemedText style={styles.stepSubtitle}>
            Başlamak için en az 1 fotoğraf ekleyin
          </ThemedText>
          <View style={styles.photoGrid}>
            {[0, 1, 2, 3, 4, 5].map((index) => (
              <Pressable
                key={index}
                style={styles.photoSlot}
                onPress={() => (photos[index] ? removePhoto(index) : pickImage())}
              >
                {photos[index] ? (
                  <>
                    <Image source={{ uri: photos[index] }} style={styles.photoImage} />
                    <View style={styles.removeButton}>
                      <Feather name="x" size={16} color={Colors.dark.text} />
                    </View>
                  </>
                ) : (
                  <View style={styles.addPhotoPlaceholder}>
                    <Feather name="plus" size={28} color={Colors.dark.gold} />
                  </View>
                )}
              </Pressable>
            ))}
          </View>
        </View>
      );
    }

    if (step === "bio") {
      return (
        <View style={styles.stepContent}>
          <ThemedText style={styles.stepTitle}>Hakkınızda</ThemedText>
          <ThemedText style={styles.stepSubtitle}>
            Kısa bir biyografi yazın (isteğe bağlı)
          </ThemedText>
          <View style={styles.textAreaContainer}>
            <textarea
              value={bio}
              onChange={(e: any) => setBio(e.target.value.slice(0, 150))}
              placeholder="Başkalarına kendinizden bahsedin..."
              maxLength={150}
              style={{
                width: "100%",
                height: 120,
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                color: Colors.dark.text,
                fontSize: 16,
                resize: "none",
                fontFamily: "system-ui",
              }}
            />
          </View>
          <ThemedText style={styles.charCount}>{bio.length}/150</ThemedText>
        </View>
      );
    }

    if (step === "age") {
      return (
        <View style={styles.stepContent}>
          <ThemedText style={styles.stepTitle}>Yaşınız</ThemedText>
          <ThemedText style={styles.stepSubtitle}>
            18 yaşında veya daha büyük olmalısınız
          </ThemedText>
          <View style={styles.inputContainer}>
            <input
              type="number"
              value={age}
              onChange={(e: any) => setAge(e.target.value)}
              placeholder="Yaşınızı girin"
              min={18}
              max={100}
              style={{
                width: "100%",
                backgroundColor: "transparent",
                border: "none",
                outline: "none",
                color: Colors.dark.text,
                fontSize: 24,
                textAlign: "center",
                fontWeight: "600",
              }}
            />
          </View>
        </View>
      );
    }

    return (
      <View style={styles.stepContent}>
        <View style={styles.locationIcon}>
          <Feather name="map-pin" size={48} color={Colors.dark.gold} />
        </View>
        <ThemedText style={styles.stepTitle}>Konumu etkinleştir</ThemedText>
        <ThemedText style={styles.stepSubtitle}>
          MeetWalk, yakınınızdaki kişileri bulmak için konumunuzu kullanır
        </ThemedText>
      </View>
    );
  };

  return (
    <View style={[styles.container, { paddingTop: insets.top + Spacing.xl }]}>
      {renderStepIndicator()}
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        {renderContent()}
      </KeyboardAwareScrollViewCompat>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.xl }]}>
        {step !== "photo" && (
          <Pressable
            style={styles.backButton}
            onPress={() => {
              const steps: OnboardingStep[] = ["photo", "bio", "age", "location"];
              const currentIndex = steps.indexOf(step);
              if (currentIndex > 0) {
                setStep(steps[currentIndex - 1]);
              }
            }}
          >
            <Feather name="arrow-left" size={24} color={Colors.dark.text} />
          </Pressable>
        )}
        <Pressable
          style={({ pressed }) => [
            styles.continueButton,
            pressed && styles.buttonPressed,
          ]}
          onPress={handleNext}
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
                {step === "location" ? "Konumu Etkinleştir" : "Devam Et"}
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
  stepIndicator: {
    flexDirection: "row",
    justifyContent: "center",
    gap: Spacing.sm,
    marginBottom: Spacing["2xl"],
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.dark.backgroundTertiary,
  },
  stepDotActive: {
    backgroundColor: Colors.dark.gold,
    width: 24,
  },
  stepDotCompleted: {
    backgroundColor: Colors.dark.gold,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: Spacing.xl,
  },
  stepContent: {
    flex: 1,
  },
  stepTitle: {
    ...Typography.h2,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
  },
  stepSubtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing["2xl"],
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.md,
  },
  photoSlot: {
    width: "30%",
    aspectRatio: 3 / 4,
    borderRadius: BorderRadius.md,
    backgroundColor: Colors.dark.backgroundDefault,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    borderStyle: "dashed",
    overflow: "hidden",
  },
  photoImage: {
    width: "100%",
    height: "100%",
  },
  addPhotoPlaceholder: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  removeButton: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.dark.error,
    justifyContent: "center",
    alignItems: "center",
  },
  textAreaContainer: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minHeight: 140,
  },
  charCount: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    textAlign: "right",
    marginTop: Spacing.sm,
  },
  inputContainer: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    alignItems: "center",
  },
  locationIcon: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
    alignSelf: "center",
    marginBottom: Spacing["2xl"],
  },
  footer: {
    position: "absolute",
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.xl,
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.md,
    backgroundColor: Colors.dark.backgroundRoot,
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
