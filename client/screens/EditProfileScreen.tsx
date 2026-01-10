import React, { useState } from "react";
import { View, StyleSheet, Pressable, Alert, ActivityIndicator } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useNavigation } from "@react-navigation/native";
import * as ImagePicker from "expo-image-picker";
import { Feather } from "@expo/vector-icons";

import { ThemedText } from "@/components/ThemedText";
import { KeyboardAwareScrollViewCompat } from "@/components/KeyboardAwareScrollViewCompat";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation();
  const { user, updateUser } = useAuth();
  
  const [photos, setPhotos] = useState<string[]>(user?.photos || []);
  const [name, setName] = useState(user?.name || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [isLoading, setIsLoading] = useState(false);

  const pickImage = async () => {
    if (photos.length >= 6) {
      Alert.alert("Maximum Photos", "You can only have up to 6 photos.");
      return;
    }

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
    if (photos.length <= 1) {
      Alert.alert("Minimum Photos", "You need at least 1 photo.");
      return;
    }
    setPhotos(photos.filter((_, i) => i !== index));
  };

  const handleSave = async () => {
    if (!name.trim()) {
      Alert.alert("Name Required", "Please enter your name.");
      return;
    }

    if (photos.length === 0) {
      Alert.alert("Photo Required", "Please add at least one photo.");
      return;
    }

    setIsLoading(true);
    try {
      await updateUser({
        name: name.trim(),
        bio: bio.trim() || undefined,
        photos,
      });
      navigation.goBack();
    } catch (error) {
      Alert.alert("Error", "Failed to update profile. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <KeyboardAwareScrollViewCompat
        contentContainerStyle={[
          styles.scrollContent,
          { paddingBottom: insets.bottom + 100 },
        ]}
      >
        <ThemedText style={styles.sectionTitle}>Photos</ThemedText>
        <ThemedText style={styles.sectionSubtitle}>
          Add up to 6 photos. Drag to reorder.
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
                    <Feather name="x" size={14} color={Colors.dark.text} />
                  </View>
                  {index === 0 ? (
                    <View style={styles.mainBadge}>
                      <ThemedText style={styles.mainBadgeText}>MAIN</ThemedText>
                    </View>
                  ) : null}
                </>
              ) : (
                <View style={styles.addPhotoPlaceholder}>
                  <Feather name="plus" size={24} color={Colors.dark.gold} />
                </View>
              )}
            </Pressable>
          ))}
        </View>

        <ThemedText style={styles.sectionTitle}>Name</ThemedText>
        <View style={styles.inputContainer}>
          <input
            type="text"
            value={name}
            onChange={(e: any) => setName(e.target.value)}
            placeholder="Your name"
            style={{
              width: "100%",
              backgroundColor: "transparent",
              border: "none",
              outline: "none",
              color: Colors.dark.text,
              fontSize: 16,
            }}
          />
        </View>

        <ThemedText style={styles.sectionTitle}>About</ThemedText>
        <View style={styles.textAreaContainer}>
          <textarea
            value={bio}
            onChange={(e: any) => setBio(e.target.value.slice(0, 150))}
            placeholder="Tell others about yourself..."
            maxLength={150}
            style={{
              width: "100%",
              height: 100,
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
      </KeyboardAwareScrollViewCompat>

      <View style={[styles.footer, { paddingBottom: insets.bottom + Spacing.lg }]}>
        <Pressable
          style={({ pressed }) => [styles.saveButton, pressed && styles.buttonPressed]}
          onPress={handleSave}
          disabled={isLoading}
        >
          {isLoading ? (
            <ActivityIndicator color={Colors.dark.backgroundRoot} />
          ) : (
            <ThemedText style={styles.saveButtonText}>Save Changes</ThemedText>
          )}
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
    paddingHorizontal: Spacing.xl,
    paddingTop: Spacing.lg,
  },
  sectionTitle: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
    marginBottom: Spacing.xs,
    marginTop: Spacing.lg,
  },
  sectionSubtitle: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    marginBottom: Spacing.md,
  },
  photoGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: Spacing.sm,
  },
  photoSlot: {
    width: "31%",
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
    top: 6,
    right: 6,
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.dark.error,
    justifyContent: "center",
    alignItems: "center",
  },
  mainBadge: {
    position: "absolute",
    bottom: 6,
    left: 6,
    backgroundColor: Colors.dark.gold,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    borderRadius: BorderRadius.xs,
  },
  mainBadgeText: {
    ...Typography.caption,
    color: Colors.dark.backgroundRoot,
    fontWeight: "700",
    fontSize: 9,
  },
  inputContainer: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
  },
  textAreaContainer: {
    backgroundColor: Colors.dark.backgroundDefault,
    borderRadius: BorderRadius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: Colors.dark.border,
    minHeight: 120,
  },
  charCount: {
    ...Typography.small,
    color: Colors.dark.textSecondary,
    textAlign: "right",
    marginTop: Spacing.xs,
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
  saveButton: {
    backgroundColor: Colors.dark.gold,
    height: Spacing.buttonHeight,
    borderRadius: BorderRadius.full,
    justifyContent: "center",
    alignItems: "center",
  },
  buttonPressed: {
    opacity: 0.8,
  },
  saveButtonText: {
    ...Typography.body,
    color: Colors.dark.backgroundRoot,
    fontWeight: "600",
  },
});
