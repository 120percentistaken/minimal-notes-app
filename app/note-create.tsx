import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter } from "expo-router";
import { useState } from "react";
import { useNotes } from "@/lib/context/notes-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function NoteCreateScreen() {
  const router = useRouter();
  const colors = useColors();
  const { createNote, loading } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [noteType, setNoteType] = useState<"note" | "todo">("note");

  const handleCreate = async () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    try {
      await createNote(title, content, noteType);
      router.back();
    } catch (error) {
      alert("Failed to create note");
    }
  };

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      className="flex-1"
    >
      <ScreenContainer className="flex-1 bg-background">
        {/* Header */}
        <View className="flex-row items-center justify-between pb-4 border-b border-border">
          <Pressable
            onPress={() => router.back()}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="chevron-back" size={24} color={colors.foreground} />
          </Pressable>
          <Text className="text-lg font-semibold text-foreground">
            New {noteType === "todo" ? "To-Do List" : "Note"}
          </Text>
          <Pressable
            onPress={handleCreate}
            disabled={loading}
            style={({ pressed }) => ({
              opacity: pressed || loading ? 0.6 : 1,
            })}
          >
            <Text className="text-primary font-semibold">
              {loading ? "Saving..." : "Save"}
            </Text>
          </Pressable>
        </View>

        {/* Type Selector */}
        <View className="flex-row gap-3 py-4">
          <Pressable
            onPress={() => setNoteType("note")}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: noteType === "note" ? colors.primary : colors.border,
                backgroundColor: noteType === "note" ? colors.primary : "transparent",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              className={`text-center font-semibold ${
                noteType === "note" ? "text-white" : "text-foreground"
              }`}
            >
              Note
            </Text>
          </Pressable>
          <Pressable
            onPress={() => setNoteType("todo")}
            style={({ pressed }) => [
              {
                flex: 1,
                paddingVertical: 8,
                paddingHorizontal: 12,
                borderRadius: 8,
                borderWidth: 1,
                borderColor: noteType === "todo" ? colors.primary : colors.border,
                backgroundColor: noteType === "todo" ? colors.primary : "transparent",
                opacity: pressed ? 0.7 : 1,
              },
            ]}
          >
            <Text
              className={`text-center font-semibold ${
                noteType === "todo" ? "text-white" : "text-foreground"
              }`}
            >
              To-Do List
            </Text>
          </Pressable>
        </View>

        {/* Content */}
        <ScrollView className="flex-1" showsVerticalScrollIndicator={false}>
          {/* Title Input */}
          <TextInput
            className="text-2xl font-bold text-foreground mb-4 p-0"
            placeholder="Title"
            placeholderTextColor={colors.muted}
            value={title}
            onChangeText={setTitle}
            multiline
          />

          {/* Content Input */}
          <TextInput
            className="flex-1 text-base text-foreground p-0"
            placeholder={noteType === "todo" ? "Add tasks..." : "Start typing..."}
            placeholderTextColor={colors.muted}
            value={content}
            onChangeText={setContent}
            multiline
            textAlignVertical="top"
            style={{ minHeight: 200 }}
          />
        </ScrollView>
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
