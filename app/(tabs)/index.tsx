import { ScrollView, Text, View, FlatList, Pressable, TextInput } from "react-native";
import { ScreenContainer } from "@/components/screen-container";
import { useNotes } from "@/lib/context/notes-context";
import { useState, useMemo } from "react";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { useColors } from "@/hooks/use-colors";

interface NoteListItemProps {
  id: number;
  title: string;
  content: string;
  updatedAt: Date;
  onPress: () => void;
}

function NoteListItem({ id, title, content, updatedAt, onPress }: NoteListItemProps) {
  const colors = useColors();
  const preview = content.substring(0, 60).replace(/\n/g, " ");
  const formattedDate = new Date(updatedAt).toLocaleDateString();

  return (
    <Pressable
      onPress={onPress}
      style={({ pressed }) => [
        {
          backgroundColor: colors.surface,
          borderRadius: 12,
          padding: 16,
          marginBottom: 12,
          opacity: pressed ? 0.7 : 1,
        },
      ]}
    >
      <Text
        className="text-lg font-semibold text-foreground mb-2"
        numberOfLines={1}
      >
        {title || "Untitled"}
      </Text>
      <Text
        className="text-sm text-muted mb-2"
        numberOfLines={2}
      >
        {preview || "No content"}
      </Text>
      <Text className="text-xs text-muted">
        {formattedDate}
      </Text>
    </Pressable>
  );
}

export default function HomeScreen() {
  const colors = useColors();
  const router = useRouter();
  const { notes, loading, searchNotes } = useNotes();
  const [searchQuery, setSearchQuery] = useState("");

  const filteredNotes = useMemo(() => {
    if (!searchQuery.trim()) {
      return notes.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    }
    return searchNotes(searchQuery).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
  }, [notes, searchQuery, searchNotes]);

  const handleCreateNote = () => {
    router.push("/note-create");
  };

  const handleNotePress = (noteId: number) => {
    router.push(`/note/${noteId}`);
  };

  return (
    <ScreenContainer className="flex-1 bg-background">
      {/* Header */}
      <View className="pb-4 border-b border-border">
        <Text className="text-3xl font-bold text-foreground mb-4">
          Notes
        </Text>

        {/* Search Bar */}
        <View
          className="flex-row items-center bg-surface rounded-full px-4 py-3"
          style={{ borderColor: colors.border, borderWidth: 1 }}
        >
          <Ionicons name="search" size={18} color={colors.muted} />
          <TextInput
            className="flex-1 ml-3 text-foreground"
            placeholder="Search notes..."
            placeholderTextColor={colors.muted}
            value={searchQuery}
            onChangeText={setSearchQuery}
          />
          {searchQuery.length > 0 && (
            <Pressable onPress={() => setSearchQuery("")}>
              <Ionicons name="close-circle" size={18} color={colors.muted} />
            </Pressable>
          )}
        </View>
      </View>

      {/* Notes List */}
      <FlatList
        data={filteredNotes}
        keyExtractor={(item) => item.id.toString()}
        renderItem={({ item }) => (
          <NoteListItem
            id={item.id}
            title={item.title}
            content={item.content}
            updatedAt={item.updatedAt}
            onPress={() => handleNotePress(item.id)}
          />
        )}
        contentContainerStyle={{ paddingVertical: 16, paddingHorizontal: 16 }}
        scrollEnabled={true}
        ListEmptyComponent={
          <View className="flex-1 items-center justify-center py-12">
            <Ionicons name="document-text-outline" size={48} color={colors.muted} />
            <Text className="text-muted text-center mt-4">
              {searchQuery ? "No notes found" : "No notes yet. Create one to get started!"}
            </Text>
          </View>
        }
      />

      {/* Floating Action Button */}
      <Pressable
        onPress={handleCreateNote}
        style={({ pressed }) => [
          {
            position: "absolute",
            bottom: 24,
            right: 24,
            width: 56,
            height: 56,
            borderRadius: 28,
            backgroundColor: colors.primary,
            justifyContent: "center",
            alignItems: "center",
            opacity: pressed ? 0.8 : 1,
            transform: [{ scale: pressed ? 0.95 : 1 }],
          },
        ]}
      >
        <Ionicons name="add" size={28} color="white" />
      </Pressable>
    </ScreenContainer>
  );
}
