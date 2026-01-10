import React, { useState, useRef, useEffect } from "react";
import { View, StyleSheet, FlatList, Pressable, TextInput, ActivityIndicator, Platform } from "react-native";
import { Image } from "expo-image";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useRoute, useNavigation } from "@react-navigation/native";
import type { RouteProp } from "@react-navigation/native";
import type { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Feather } from "@expo/vector-icons";
import * as Haptics from "expo-haptics";

import { ThemedText } from "@/components/ThemedText";
import { Colors, Spacing, BorderRadius, Typography } from "@/constants/theme";
import { useAuth } from "@/lib/auth-context";
import { apiRequest } from "@/lib/query-client";
import type { Message, User } from "@shared/schema";
import type { RootStackParamList } from "@/navigation/RootStackNavigator";

type ChatScreenRouteProp = RouteProp<RootStackParamList, "Chat">;

const ICEBREAKERS = [
  "En sevdiğin hafta sonu aktivitesi nedir?",
  "En son hangi kitabı okudun veya filmi izledin?",
  "Hayalindeki tatil rotası neresi?",
  "En sevdiğin yemek nedir?",
  "Seni en çok ne güldürür?",
];

function MessageBubble({ message, isOwn }: { message: Message; isOwn: boolean }) {
  return (
    <View style={[styles.messageBubble, isOwn ? styles.ownMessage : styles.otherMessage]}>
      <ThemedText style={[styles.messageText, isOwn && styles.ownMessageText]}>
        {message.content}
      </ThemedText>
      <View style={styles.messageFooter}>
        <ThemedText style={[styles.messageTime, isOwn && styles.ownMessageTime]}>
          {new Date(message.createdAt!).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
        </ThemedText>
        {isOwn && (
          <Feather 
            name={message.isRead ? "check-circle" : "check"} 
            size={12} 
            color={message.isRead ? Colors.dark.success : "rgba(10,10,10,0.4)"} 
            style={styles.readStatus}
          />
        )}
      </View>
    </View>
  );
}

export default function ChatScreen() {
  const insets = useSafeAreaInsets();
  const route = useRoute<ChatScreenRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const queryClient = useQueryClient();
  const { user } = useAuth();
  const [message, setMessage] = useState("");
  const flatListRef = useRef<FlatList>(null);

  const { matchId, otherUser } = route.params;

  useEffect(() => {
    // Mark messages as read when entering chat
    const markRead = async () => {
      try {
        await apiRequest("POST", `/api/matches/${matchId}/read`, { receiverId: user?.id });
        queryClient.invalidateQueries({ queryKey: ["/api/matches", matchId, "messages"] });
      } catch (e) {
        console.error("Failed to mark messages as read", e);
      }
    };
    markRead();
  }, [matchId, user?.id]);

  useEffect(() => {
    navigation.setOptions({
      headerTitle: () => (
        <Pressable
          style={styles.headerTitle}
          onPress={() => navigation.navigate("ProfileDetail", { user: otherUser })}
        >
          <Image
            source={{ uri: otherUser.photos?.[0] || "https://via.placeholder.com/40" }}
            style={styles.headerAvatar}
            contentFit="cover"
          />
          <ThemedText style={styles.headerName}>{otherUser.name}</ThemedText>
        </Pressable>
      ),
      headerRight: () => (
        <Pressable
          style={styles.headerButton}
          onPress={() => navigation.navigate("ProfileDetail", { user: otherUser })}
        >
          <Feather name="info" size={20} color={Colors.dark.text} />
        </Pressable>
      ),
    });
  }, [navigation, otherUser]);

  const { data: messages = [], isLoading } = useQuery<Message[]>({
    queryKey: ["/api/matches", matchId, "messages"],
    queryFn: async () => {
      const response = await fetch(`/api/matches/${matchId}/messages`);
      if (!response.ok) return [];
      return response.json();
    },
    refetchInterval: 3000,
  });

  const sendMutation = useMutation({
    mutationFn: async (content: string) => {
      const response = await apiRequest("POST", "/api/messages", {
        matchId,
        senderId: user?.id,
        receiverId: otherUser.id,
        content,
      });
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/matches", matchId, "messages"] });
    },
  });

  const handleSend = () => {
    if (!message.trim() || !user?.isPremium) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    sendMutation.mutate(message.trim());
    setMessage("");
  };

  const handleIcebreaker = (text: string) => {
    if (!user?.isPremium || sendMutation.isPending) return;
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    sendMutation.mutate(text);
  };

  const renderItem = ({ item }: { item: Message }) => (
    <MessageBubble message={item} isOwn={item.senderId === user?.id} />
  );

  const isPremium = user?.isPremium;

  return (
    <View style={[styles.container, { paddingBottom: insets.bottom }]}>
      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={Colors.dark.gold} />
        </View>
      ) : messages.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Image
            source={{ uri: otherUser.photos?.[0] || "https://via.placeholder.com/80" }}
            style={styles.emptyAvatar}
            contentFit="cover"
          />
          <ThemedText style={styles.emptyTitle}>
            {otherUser.name} ile eşleştiniz!
          </ThemedText>
          <ThemedText style={styles.emptySubtitle}>
            {isPremium ? "Konuşma başlatmak için bir soru seçin veya merhaba deyin" : "Sohbet etmeye başlamak için Gold'a yükseltin"}
          </ThemedText>
          
          {isPremium && (
            <View style={styles.icebreakerContainer}>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.icebreakerList}>
                {ICEBREAKERS.map((text, index) => (
                  <Pressable 
                    key={index} 
                    style={({ pressed }) => [styles.icebreakerItem, pressed && styles.buttonPressed]}
                    onPress={() => handleIcebreaker(text)}
                  >
                    <ThemedText style={styles.icebreakerText}>{text}</ThemedText>
                  </Pressable>
                ))}
              </ScrollView>
            </View>
          )}
        </View>
      ) : (
        <FlatList
          ref={flatListRef}
          data={messages}
          renderItem={renderItem}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.messageList}
          showsVerticalScrollIndicator={false}
          inverted={false}
          onContentSizeChange={() => flatListRef.current?.scrollToEnd({ animated: true })}
        />
      )}

      <View style={styles.inputContainer}>
        {isPremium ? (
          <>
            <TextInput
              style={styles.textInput}
              value={message}
              onChangeText={setMessage}
              placeholder="Mesaj yazın..."
              placeholderTextColor={Colors.dark.textSecondary}
              maxLength={500}
              multiline
            />
            <Pressable
              style={({ pressed }) => [
                styles.sendButton,
                !message.trim() && styles.sendButtonDisabled,
                pressed && message.trim() && styles.buttonPressed,
              ]}
              onPress={handleSend}
              disabled={!message.trim() || sendMutation.isPending}
            >
              {sendMutation.isPending ? (
                <ActivityIndicator size="small" color={Colors.dark.backgroundRoot} />
              ) : (
                <Feather
                  name="send"
                  size={20}
                  color={message.trim() ? Colors.dark.backgroundRoot : Colors.dark.textSecondary}
                />
              )}
            </Pressable>
          </>
        ) : (
          <Pressable
            style={({ pressed }) => [styles.upgradePrompt, pressed && styles.buttonPressed]}
            onPress={() => navigation.navigate("Premium")}
          >
            <Feather name="lock" size={16} color={Colors.dark.gold} />
            <ThemedText style={styles.upgradeText}>Mesaj göndermek için Gold'a yükseltin</ThemedText>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.dark.backgroundRoot,
  },
  headerTitle: {
    flexDirection: "row",
    alignItems: "center",
    gap: Spacing.sm,
  },
  headerAvatar: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  headerName: {
    ...Typography.body,
    color: Colors.dark.text,
    fontWeight: "600",
  },
  headerButton: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.dark.backgroundDefault,
    justifyContent: "center",
    alignItems: "center",
  },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  emptyContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: Spacing.xl,
  },
  emptyAvatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
    marginBottom: Spacing.lg,
    borderWidth: 3,
    borderColor: Colors.dark.gold,
  },
  emptyTitle: {
    ...Typography.h4,
    color: Colors.dark.text,
    marginBottom: Spacing.sm,
    textAlign: "center",
  },
  emptySubtitle: {
    ...Typography.body,
    color: Colors.dark.textSecondary,
    textAlign: "center",
  },
  messageList: {
    padding: Spacing.lg,
  },
  messageBubble: {
    maxWidth: "80%",
    padding: Spacing.md,
    borderRadius: BorderRadius.md,
    marginBottom: Spacing.sm,
  },
  ownMessage: {
    alignSelf: "flex-end",
    backgroundColor: Colors.dark.gold,
    borderBottomRightRadius: BorderRadius.xs,
  },
  otherMessage: {
    alignSelf: "flex-start",
    backgroundColor: Colors.dark.backgroundSecondary,
    borderBottomLeftRadius: BorderRadius.xs,
  },
  messageText: {
    ...Typography.body,
    color: Colors.dark.text,
  },
  ownMessageText: {
    color: Colors.dark.backgroundRoot,
  },
  messageTime: {
    ...Typography.caption,
    color: Colors.dark.textSecondary,
    marginTop: Spacing.xs,
    alignSelf: "flex-end",
  },
  ownMessageTime: {
    color: "rgba(10,10,10,0.6)",
  },
  messageFooter: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "flex-end",
    gap: 4,
    marginTop: 2,
  },
  readStatus: {
    marginLeft: 2,
  },
  icebreakerContainer: {
    marginTop: Spacing.xl,
    width: "100%",
  },
  icebreakerList: {
    paddingHorizontal: Spacing.xl,
    gap: Spacing.sm,
  },
  icebreakerItem: {
    backgroundColor: Colors.dark.backgroundSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: BorderRadius.full,
    borderWidth: 1,
    borderColor: Colors.dark.gold,
    marginRight: Spacing.sm,
  },
  icebreakerText: {
    ...Typography.small,
    color: Colors.dark.gold,
    fontWeight: "600",
  },
  inputContainer: {
    flexDirection: "row",
    alignItems: "flex-end",
    padding: Spacing.md,
    backgroundColor: Colors.dark.backgroundDefault,
    borderTopWidth: 1,
    borderTopColor: Colors.dark.border,
  },
  textInput: {
    flex: 1,
    minHeight: 44,
    maxHeight: 100,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    color: Colors.dark.text,
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  sendButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.dark.gold,
    justifyContent: "center",
    alignItems: "center",
  },
  sendButtonDisabled: {
    backgroundColor: Colors.dark.backgroundSecondary,
  },
  buttonPressed: {
    opacity: 0.8,
  },
  upgradePrompt: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    backgroundColor: Colors.dark.backgroundSecondary,
    borderRadius: BorderRadius.lg,
  },
  upgradeText: {
    ...Typography.small,
    color: Colors.dark.gold,
  },
});
