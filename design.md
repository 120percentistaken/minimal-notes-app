# Minimal Notes App - Design Document

## Design Philosophy

The Minimal Notes App follows Apple's Human Interface Guidelines (HIG) with a focus on **clarity, simplicity, and efficiency**. The design prioritizes **one-handed mobile usage** in portrait orientation (9:16) with a clean, decluttered interface free of gradients and unnecessary visual noise.

## Color Palette

| Token | Light Mode | Dark Mode | Purpose |
|-------|-----------|-----------|---------|
| `background` | #FFFFFF | #151718 | Screen background |
| `surface` | #F5F5F5 | #1E2022 | Cards, elevated surfaces |
| `foreground` | #11181C | #ECEDEE | Primary text |
| `muted` | #687076 | #9BA1A6 | Secondary text, hints |
| `primary` | #0A7EA4 | #0A7EA4 | Accent, buttons, interactive elements |
| `border` | #E5E7EB | #334155 | Dividers, borders |
| `success` | #22C55E | #4ADE80 | Completion, success states |
| `error` | #EF4444 | #F87171 | Errors, destructive actions |

## Screen List

### 1. **Home Screen (Notes List)**
   - Primary content area showing all notes/to-do lists
   - Floating action button (FAB) to create new note
   - Search bar at top for quick access
   - Notes displayed as clean list items with preview text
   - Swipe actions: delete, archive, share
   - Long-press: multi-select for batch operations

### 2. **Note Detail Screen**
   - Full note editor with title and content area
   - Toolbar: formatting options (bold, italic, underline)
   - Attachment button: add images, audio, video
   - Share button: invite collaborators
   - Tags/labels section for organization
   - Timestamps: created, last modified
   - Back button to return to list

### 3. **To-Do List Screen**
   - Similar to note detail but optimized for tasks
   - Checkbox-based task items with drag-and-drop reordering
   - Add new task input at bottom or top
   - Progress indicator showing completed/total tasks
   - Subtasks support (nested items)
   - Priority levels: high, medium, low (color-coded)

### 4. **Search Results Screen**
   - Search query input with clear button
   - Filtered results showing matching notes/tasks
   - Filter options: by date, type (note/task), tags
   - Result count display
   - Tap to open note detail

### 5. **Collaboration & Sharing Sheet**
   - Modal overlay showing share options
   - List of collaborators with permission levels
   - Add collaborator input (email/username)
   - Permission selector: view-only, edit, admin
   - Share link generation
   - Remove collaborator option

### 6. **Settings Screen**
   - Appearance: light/dark mode toggle
   - Notifications: toggle, sound, vibration
   - Sync settings: auto-save interval
   - Data export/backup
   - About & version info

### 7. **Media Viewer Screen**
   - Full-screen image/video/audio player
   - Pinch-to-zoom for images
   - Audio player controls: play, pause, seek
   - Video player with standard controls
   - Back button to return to note

## Primary Content and Functionality

### Notes
- **Rich text editing**: Bold, italic, underline, lists
- **Media support**: Images, audio recordings, video clips
- **Automatic saving**: Debounced auto-save to local storage
- **Versioning**: Keep track of edit history (optional)

### To-Do Lists
- **Task management**: Create, edit, delete, complete tasks
- **Drag-and-drop**: Reorder tasks by dragging
- **Subtasks**: Nest tasks within tasks
- **Priority levels**: Visual indicators for task importance
- **Due dates**: Optional date picker for deadlines

### Organization
- **Tags/Labels**: Categorize notes and tasks
- **Folders**: Organize by project or category
- **Search**: Full-text search across all notes
- **Filters**: By date, type, tags, collaborators

### Collaboration
- **Share notes**: Invite collaborators via email
- **Permissions**: View-only, edit, admin roles
- **Real-time sync**: Changes sync across devices
- **Comments**: Collaborators can leave comments on notes

### Offline Support
- **Local-first**: All data stored locally in AsyncStorage
- **Sync queue**: Pending changes queued when offline
- **Conflict resolution**: Last-write-wins strategy
- **Sync status**: Visual indicator of sync state

### Media Features
- **Audio notes**: Record and playback audio
- **Image notes**: Capture or upload images
- **Video notes**: Record or upload video clips
- **Transcription**: Convert audio to text (via server LLM)

## Key User Flows

### Flow 1: Create a New Note
1. User taps FAB on home screen
2. App opens note detail screen with empty title/content
3. User types title and content
4. Auto-save triggers after 2 seconds of inactivity
5. User taps back to return to home screen
6. New note appears in list

### Flow 2: Create a To-Do List
1. User taps FAB and selects "To-Do List" option
2. App opens to-do detail screen
3. User enters list title
4. User adds tasks by typing in input field
5. User can reorder tasks by dragging
6. Auto-save persists changes
7. User marks tasks complete by tapping checkbox

### Flow 3: Search for Notes
1. User taps search bar on home screen
2. Search input becomes active with keyboard open
3. User types search query
4. Results filter in real-time as user types
5. User taps result to open note detail
6. User can modify or close note

### Flow 4: Share Note with Collaborator
1. User opens note detail
2. User taps share button
3. Collaboration sheet opens
4. User enters collaborator email
5. User selects permission level
6. User taps "Invite"
7. Collaborator receives notification and can access note

### Flow 5: Add Audio to Note
1. User opens note detail
2. User taps attachment/media button
3. Options appear: record audio, upload image, upload video
4. User selects "Record Audio"
5. Recording interface appears with record/stop buttons
6. User records audio message
7. Audio is embedded in note with playback controls
8. Auto-save persists the attachment

### Flow 6: Drag and Drop Tasks
1. User opens to-do list
2. User long-presses task item
3. Task becomes draggable
4. User drags task to new position
5. Other tasks shift to accommodate
6. User releases to drop task
7. New order is auto-saved

## Layout Specifications

### Home Screen Layout
```
┌─────────────────────────┐
│ [Search Bar]            │ ← Search input, 44pt height
├─────────────────────────┤
│ [Note 1 Preview]        │ ← List item, 72pt height
│ [Note 2 Preview]        │
│ [To-Do List Preview]    │
│ [Note 3 Preview]        │
│                         │
│                    [+]  │ ← FAB, 56pt diameter
└─────────────────────────┘
```

### Note Detail Layout
```
┌─────────────────────────┐
│ [< Back] [Share] [More] │ ← Header, 56pt height
├─────────────────────────┤
│ [Title Input Field]     │ ← 44pt height
├─────────────────────────┤
│ [Content Area]          │ ← Flexible, scrollable
│ Rich text editing       │
│ with formatting         │
│ and media support       │
│                         │
│ [Image/Audio/Video]     │
│                         │
├─────────────────────────┤
│ [B] [I] [U] [List] [+]  │ ← Toolbar, 44pt height
└─────────────────────────┘
```

### To-Do List Layout
```
┌─────────────────────────┐
│ [< Back] [Share] [More] │ ← Header
├─────────────────────────┤
│ [Title Input Field]     │
│ Progress: 3/5 ▓▓▓░░    │ ← Progress bar
├─────────────────────────┤
│ [☐] Task 1             │ ← Task item, 56pt height
│ [☑] Task 2             │
│ [☐] Task 3             │
│ [☐] Task 4             │
│ [☐] Task 5             │
├─────────────────────────┤
│ [+ Add Task]            │ ← Input field
└─────────────────────────┘
```

## Interaction Patterns

### Button States
- **Default**: Full opacity, normal scale
- **Pressed**: 0.97 scale, light haptic feedback
- **Disabled**: 0.5 opacity, no interaction

### List Item Interactions
- **Tap**: Open note/task detail
- **Long-press**: Multi-select or drag-and-drop
- **Swipe left**: Reveal delete/archive actions
- **Swipe right**: Archive or mark complete

### Text Input
- **Auto-save**: 2 seconds after last keystroke
- **Placeholder**: Subtle gray text guiding input
- **Character limit**: None for notes, optional for tasks

### Animations
- **Screen transitions**: Fade in/out (150ms)
- **List updates**: Smooth item insertion/deletion (200ms)
- **Press feedback**: Quick scale animation (80ms)
- **Drag-and-drop**: Smooth reordering (150ms)

## Minimalistic Design Principles

1. **No gradients**: Use solid colors only
2. **Ample whitespace**: Generous padding and margins
3. **Clear hierarchy**: Typography and color establish importance
4. **Subtle shadows**: Minimal depth cues, no harsh shadows
5. **System fonts**: Use native system fonts (SF Pro on iOS, Roboto on Android)
6. **Icon consistency**: Use consistent icon style and sizing
7. **Reduced motion**: Respect system motion preferences
8. **High contrast**: Ensure text is readable in all modes

## Accessibility

- **Color contrast**: WCAG AA compliant (4.5:1 for text)
- **Touch targets**: Minimum 44pt × 44pt for interactive elements
- **VoiceOver/TalkBack**: Full screen reader support
- **Dynamic type**: Support system font size preferences
- **Haptic feedback**: Optional, respects system settings

## Branding

- **App name**: Minimal Notes
- **App slug**: minimal-notes-app
- **Icon**: Clean, minimalist icon reflecting note-taking
- **Typography**: System fonts (SF Pro Display/Text on iOS, Roboto on Android)
- **Tone**: Professional, clear, helpful
