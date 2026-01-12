import { View, Text, TextInput, Pressable, ScrollView, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useRouter, useLocalSearchParams } from "expo-router";
import { useState, useEffect } from "react";
import { useNotes } from "@/lib/context/notes-context";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

export default function NoteDetailScreen() {
  const router = useRouter();
  const colors = useColors();
  const { id } = useLocalSearchParams();
  const { notes, updateNote, deleteNote, loading } = useNotes();
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [isSaving, setIsSaving] = useState(false);

  const noteId = parseInt(id as string);
  const note = notes.find((n) => n.id === noteId);

  useEffect(() => {
    if (note) {
      setTitle(note.title);
      setContent(note.content);
    }
  }, [note]);

  const handleSave = async () => {
    if (!title.trim()) {
      alert("Please enter a title");
      return;
    }

    setIsSaving(true);
    try {
      await updateNote(noteId, {
        title,
        content,
      });
    } catch (error) {
      alert("Failed to save note");
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = () => {
    alert("Delete note?", "This action cannot be undone.", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteNote(noteId);
            router.back();
          } catch (error) {
            alert("Failed to delete note");
          }
        },
      },
    ]);
  };

  if (!note) {
    return (
      <ScreenContainer className="flex-1 items-center justify-center">
        <ActivityIndicator size="large" color={colors.primary} />
      </ScreenContainer>
    );
  }

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
            {note.type === "todo" ? "To-Do List" : "Note"}
          </Text>
          <Pressable
            onPress={handleDelete}
            style={({ pressed }) => ({ opacity: pressed ? 0.6 : 1 })}
          >
            <Ionicons name="trash-outline" size={24} color={colors.error} />
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
            onBlur={handleSave}
            multiline
          />

          {/* Content Input */}
          <TextInput
            className="flex-1 text-base text-foreground p-0"
            placeholder="Start typing..."
            placeholderTextColor={colors.muted}
            value={content}
            onChangeText={setContent}
            onBlur={handleSave}
            multiline
            textAlignVertical="top"
            style={{ minHeight: 200 }}
          />

          {/* Metadata */}
          <View className="mt-8 pt-4 border-t border-border">
            <Text className="text-xs text-muted mb-2">
              Created: {new Date(note.createdAt).toLocaleDateString()}
            </Text>
            <Text className="text-xs text-muted">
              Modified: {new Date(note.updatedAt).toLocaleDateString()}
            </Text>
          </View>
        </ScrollView>

        {/* Save Indicator */}
        {isSaving && (
          <View className="flex-row items-center justify-center py-2 bg-surface rounded-lg">
            <ActivityIndicator size="small" color={colors.primary} />
            <Text className="ml-2 text-sm text-muted">Saving...</Text>
          </View>
        )}
      </ScreenContainer>
    </KeyboardAvoidingView>
  );
}
