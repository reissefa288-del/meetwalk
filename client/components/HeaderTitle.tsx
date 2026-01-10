import React from "react";
import { View, StyleSheet, Image } from "react-native";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Typography, Spacing } from "@/constants/theme";

interface HeaderTitleProps {
  title?: string;
  showLogo?: boolean;
}

export function HeaderTitle({ title, showLogo = true }: HeaderTitleProps) {
  if (showLogo) {
    return (
      <View style={styles.container}>
        <Image
          source={require("../../assets/images/icon.png")}
          style={styles.icon}
          resizeMode="contain"
        />
        <ThemedText style={styles.logoTitle}>MeetWalk</ThemedText>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <ThemedText style={styles.title}>{title}</ThemedText>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-start",
  },
  icon: {
    width: 28,
    height: 28,
    marginRight: Spacing.sm,
    borderRadius: 6,
  },
  title: {
    ...Typography.h4,
    fontWeight: "600",
  },
  logoTitle: {
    ...Typography.h4,
    color: Colors.dark.gold,
    fontWeight: "700",
  },
});
