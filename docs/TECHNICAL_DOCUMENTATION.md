# 2. Tài liệu Kỹ thuật & Kiến trúc Hệ thống (Technical & Architecture Documentation)

Dự án: **VibeNotes — Không gian Ghi chú Kỹ thuật Markdown & Đồng bộ Google Keep**  
Phiên bản Kiến trúc: **2.0 (Local-First Per-Account Workspace)**  
Vị trí lưu trữ: **`/docs/TECHNICAL_DOCUMENTATION.md`**

> **Liên kết Hệ thống Tài liệu Dự án (4 Phần)**:
> 1. **Tổng quan Dự án & Kế hoạch Tiến độ**: [`/README.md`](../README.md) · [`/docs/PROJECT_PLAN_WBS.md`](./PROJECT_PLAN_WBS.md) · [`/docs/DAILY_LOG.md`](./DAILY_LOG.md)
> 2. **Tài liệu Kỹ thuật & Kiến trúc (File này)**: [`/docs/TECHNICAL_DOCUMENTATION.md`](./TECHNICAL_DOCUMENTATION.md) · [`/DECISIONS.md`](../DECISIONS.md)
> 3. **Tài liệu Hướng dẫn Sử dụng & Quản trị (User Manual & Admin Guide)**: [`/docs/USER_MANUAL_ADMIN_GUIDE.md`](./USER_MANUAL_ADMIN_GUIDE.md)
> 4. **Tài liệu Kiểm thử & Đảm bảo Chất lượng (Testing & QA)**: [`/tests/MANUAL_TEST_CASES.md`](../tests/MANUAL_TEST_CASES.md)

---

## 1. Sơ đồ Kiến trúc Tổng quan Hệ thống (High-Level System Architecture)

**VibeNotes** được thiết kế theo kiến trúc **Client-Side Local-First SPA (Single-Page Application)** tách biệt hoàn toàn giữa **Tầng Giao diện (Presentation Layer)**, **Tầng Xử lý Nghiệp vụ Thuần túy (Pure Domain & State Engine Layer)** và **Tầng Lưu trữ & Tích hợp Ngoài (Persistence & External Integration Layer)**.

```mermaid
flowchart TB
    subgraph Client["Trình duyệt Người dùng (Desktop / Tablet / Mobile - 100dvh)"]
        subgraph UI["1. Tầng Giao diện (Presentation Layer - React 19 + Tailwind CSS v4)"]
            LoginUI["LoginView.tsx\n(Notion-Style Sign In / Sign Up / Google / Guest)"]
            HeaderUI["App Header & Footer\n(Navigation, Theme Toggle, Left-Corner Sign Out)"]
            SidebarUI["Sidebar.tsx\n(Search ⌘K, Sort By Dropdown, Dynamic Filters, Note Cards)"]
            EditorUI["NoteWorkspace.tsx\n(Floating Toolbar, Auto-complete, Split Scroll Sync, 'Saved' Toast)"]
            ModalsUI["Modals & Drawers\n(ShortcutsModal, ConfirmDialog, GoogleKeepDrawer)"]
        end

        subgraph Engine["2. Tầng Nghiệp vụ Thuần túy (Pure Logic Layer - src/utils/)"]
            AuthLogic["Account & Auth Engine\n(validateEmailSignUpInput, validateEmailLoginInput,\nnormalizeAccountStorageKey, initializeAccountNotesOnAuth)"]
            NoteLogic["Note, Filter & Sort Engine\n(createNewNoteItem, filterAndSortNotes,\nsortNotesByOption, createCustomFilter, deleteFilterFromList)"]
            MarkdownLogic["Markdown & History Engine\n(marked Parser, applyMarkdownInsertion,\ngetMarkdownAutocompleteSuggestions, Undo/Redo Stack)"]
            VersionToastLogic["Version History & Save Toast State Machine\n(recordNoteVersionSnapshot, restorePreviousNoteVersion,\nEditorSaveToastState — 2000ms Debounce)"]
            PdfEngine["PDF & Print Engine\n(pdfExport.ts — html2canvas + jsPDF A4 Unicode)"]
        end

        subgraph Storage["3. Tầng Lưu trữ Cục bộ Cô lập theo Tài khoản (Browser LocalStorage)"]
            LS_Users[("vibenotes_registered_users_v1\nvibenotes_user_profile_v1")]
            LS_Notes[("vibenotes_account_notes_v2\n(Keyed by normalized email — New Account = [])")]
            LS_Filters[("vibenotes_account_filters_v2\nvibenotes_sort_by_v1")]
            LS_Versions[("vibenotes_account_version_history_v2\n(Max 10 snapshots / note)")]
        end
    end

    subgraph Cloud["4. Dịch vụ Đám mây Tích hợp (External Cloud Services)"]
        FirebaseAuth["Firebase Authentication\n(Google OAuth 2.0 Popup)"]
        KeepAPI["Google Keep REST API\n(https://keep.googleapis.com/v1/notes)"]
    end

    LoginUI --> AuthLogic
    SidebarUI --> NoteLogic
    EditorUI --> MarkdownLogic
    EditorUI --> VersionToastLogic
    EditorUI --> PdfEngine
    HeaderUI --> AuthLogic

    AuthLogic <--> LS_Users
    AuthLogic <--> LS_Notes
    NoteLogic <--> LS_Notes
    NoteLogic <--> LS_Filters
    VersionToastLogic <--> LS_Versions

    ModalsUI <--> FirebaseAuth
    ModalsUI <--> KeepAPI
```

---

## 2. Sơ đồ Use Case Tổng thể (System Use Case Diagram)

```mermaid
flowchart LR
    User(["Người dùng\n(New User / Existing User / Guest)"])

    subgraph AuthGroup["1. Xác thực & Không gian Tài khoản"]
        UC_Auth1("Đăng ký tài khoản mới (Sign Up — Khởi tạo 0 Notes)")
        UC_Auth2("Đăng nhập Email / Google / Guest (Sign In)")
        UC_Auth3("Xem hồ sơ góc trái & Đăng xuất (Sign Out)")
    end

    subgraph NoteGroup["2. Quản lý & Tổ chức Ghi chú"]
        UC_Note1("Tạo / Sửa / Xoá ghi chú (Cmd/Ctrl + N)")
        UC_Note2("Ghim / Bỏ ghim ghi chú ưu tiên (Cmd/Ctrl + P)")
        UC_Note3("Tạo / Xoá Filter động & Kéo-thả phân loại")
        UC_Note4("Sắp xếp theo Date Modified / Title / Pinned")
        UC_Note5("Tìm kiếm tức thì theo Tiêu đề / Nội dung / Filter (Cmd/Ctrl + K)")
    end

    subgraph EditorGroup["3. Soạn thảo Markdown & Lịch sử"]
        UC_Edit1("Định dạng nhanh qua Floating Toolbar & Auto-complete (/)")
        UC_Edit2("Hoàn tác / Làm lại (Undo / Redo — Cmd/Ctrl + Z, Y)")
        UC_Edit3("Nhận thông báo 'Saved' sau 2 giây ngừng gõ (2s Debounce)")
        UC_Edit4("Khôi phục phiên bản cũ (Restore Previous Version)")
        UC_Edit5("Chuyển chế độ Edit / Split / Preview & Cuộn đồng bộ (Cmd/Ctrl + E)")
        UC_Edit6("Tra cứu Bảng Phím tắt Cheat-Sheet (Cmd/Ctrl + /)")
    end

    subgraph ExportGroup["4. Trích xuất & Đồng bộ"]
        UC_Exp1("Xuất tài liệu PDF khổ A4 chuẩn tiếng Việt & file .MD")
        UC_Exp2("Đồng bộ Google Keep REST API & Sao lưu JSON")
    end

    User --> UC_Auth1
    User --> UC_Auth2
    User --> UC_Auth3
    User --> UC_Note1
    User --> UC_Note2
    User --> UC_Note3
    User --> UC_Note4
    User --> UC_Note5
    User --> UC_Edit1
    User --> UC_Edit2
    User --> UC_Edit3
    User --> UC_Edit4
    User --> UC_Edit5
    User --> UC_Edit6
    User --> UC_Exp1
    User --> UC_Exp2
```

---

## 3. Mô hình Cơ sở Dữ liệu & Lược đồ Thực thể (ERD & Class Diagram)

### 3.1. Sơ đồ Quan hệ Thực thể Dữ liệu (Entity-Relationship Diagram - ERD)

Mặc dù sử dụng `localStorage` để đạt độ trễ `0ms`, dữ liệu của **VibeNotes** được chuẩn hoá chặt chẽ theo mô hình quan hệ thực thể cô lập theo từng tài khoản (`account_key = normalizeAccountStorageKey(email)`):

```mermaid
erDiagram
    REGISTERED_ACCOUNT ||--o| USER_SESSION_PROFILE : "authenticates as"
    USER_SESSION_PROFILE ||--o{ NOTE_ITEM : "owns (0..N notes, new account = 0)"
    USER_SESSION_PROFILE ||--o{ NOTE_TAG_FILTER : "customizes (1..N filters)"
    NOTE_TAG_FILTER ||--o{ NOTE_ITEM : "categorizes (tag -> id)"
    NOTE_ITEM ||--o{ NOTE_VERSION_SNAPSHOT : "maintains (0..10 snapshots)"
    NOTE_ITEM ||--|| EDITOR_HISTORY_STATE : "tracks in-memory Undo/Redo"
    NOTE_ITEM ||--|| EDITOR_SAVE_TOAST_STATE : "triggers 2000ms debounce toast"

    REGISTERED_ACCOUNT {
        string email PK "Normalized lowercase email"
        string name "Full display name"
        string password "View-level credential"
        string createdAt "ISO-8601 timestamp"
    }

    USER_SESSION_PROFILE {
        string email PK "Account storage key"
        string name "Active user display name"
        string provider "email | google | guest"
        string signedInAt "ISO-8601 timestamp"
        boolean isNewUser "True on fresh Sign Up -> initializes []"
    }

    NOTE_ITEM {
        string id PK "note-{timestamp}-{hash}"
        string title "Document display title"
        string content "Raw Markdown body"
        string tag FK "References NOTE_TAG_FILTER.id"
        boolean pinned "Priority pin flag"
        string createdAt "ISO-8601 timestamp"
        string updatedAt "ISO-8601 timestamp"
        string keepResourceName "Optional Google Keep resource ID"
    }

    NOTE_TAG_FILTER {
        string id PK "indigo | emerald | filter-{slug}"
        string label "Display name (e.g. Engineering)"
        string dotClass "Tailwind color indicator"
        string activeTextClass "Tailwind active text style"
        boolean isCustom "True for user-created filters"
    }

    NOTE_VERSION_SNAPSHOT {
        string id PK "ver-{timestamp}-{hash}"
        string noteId FK "References NOTE_ITEM.id"
        string title "Previous title snapshot"
        string content "Previous Markdown content"
        string savedAt "ISO-8601 timestamp"
    }

    EDITOR_SAVE_TOAST_STATE {
        string status "idle | typing | saved"
        string noteId FK "Active note ID being edited"
        string savedAt "ISO-8601 save confirmation time"
    }
```

---

### 3.2. Sơ đồ Lớp Chi tiết (Detailed Class Diagram)

```mermaid
classDiagram
    class WorkspaceUserProfile {
        +string name
        +string email
        +AuthProviderType provider
        +string signedInAt
        +boolean isNewUser
    }

    class RegisteredWorkspaceAccount {
        +string name
        +string email
        +string password
        +string createdAt
    }

    class NoteItem {
        +string id
        +string title
        +string content
        +TagColor tag
        +boolean pinned
        +string createdAt
        +string updatedAt
        +string keepResourceName
    }

    class NoteTag {
        +string id
        +string label
        +string dotClass
        +string activeTextClass
        +boolean isCustom
    }

    class NoteVersionSnapshot {
        +string id
        +string noteId
        +string title
        +string content
        +string savedAt
    }

    class EditorHistoryState {
        +EditorHistoryEntry[] past
        +EditorHistoryEntry present
        +EditorHistoryEntry[] future
    }

    class EditorSaveToastState {
        +string status
        +string noteId
        +string savedAt
    }

    class WorkspaceEngine {
        +normalizeAccountStorageKey(email) string
        +initializeAccountNotesOnAuth(accountNotesMap, profile)
        +getNotesForAccount(accountNotesMap, profile) NoteItem[]
        +validateEmailSignUpInput(fullName, email, pass, confirmPass, accounts)
        +validateEmailLoginInput(email, pass, customName, accounts)
        +sortNotesByOption(notes, sortBy) NoteItem[]
        +filterAndSortNotes(notes, query, selectedTag, allFilters, sortBy) NoteItem[]
        +createCustomFilter(existingFilters, rawLabel) NoteTag
        +deleteFilterFromList(existingFilters, notes, filterId)
        +applyMarkdownInsertion(content, start, end, prefix, suffix)
        +getMarkdownAutocompleteSuggestions(content, cursor)
        +pushEditorHistory(state, nextEntry) EditorHistoryState
        +undoEditorHistory(state) EditorHistoryEntry
        +redoEditorHistory(state) EditorHistoryEntry
        +recordNoteVersionSnapshot(historyMap, prevNote, changes) NoteVersionHistoryMap
        +restorePreviousNoteVersion(historyMap, noteId) NoteVersionSnapshot
        +transitionSaveToastOnEdit(noteId) EditorSaveToastState
        +transitionSaveToastOnDebounceComplete(state, activeNoteId) EditorSaveToastState
        +transitionSaveToastOnReset() EditorSaveToastState
        +computeSyncedScrollTop(srcTop, srcH, srcClientH, tgtH, tgtClientH) number
        +resolveGlobalShortcutAction(event) GlobalShortcutAction
    }

    WorkspaceEngine ..> WorkspaceUserProfile
    WorkspaceEngine ..> RegisteredWorkspaceAccount
    WorkspaceEngine ..> NoteItem
    WorkspaceEngine ..> NoteTag
    WorkspaceEngine ..> NoteVersionSnapshot
    WorkspaceEngine ..> EditorHistoryState
    WorkspaceEngine ..> EditorSaveToastState
```

---

### 3.3. Bảng Đặc tả Lược đồ Lưu trữ `localStorage` (Storage Keys Specification)

| Khóa `localStorage` (Key) | Kiểu Dữ liệu (TypeScript Type) | Phạm vi (Scope) | Mô tả Chi tiết & Cơ chế Khởi tạo |
| :--- | :--- | :--- | :--- |
| `vibenotes_user_profile_v1` | `WorkspaceUserProfile \| null` | Toàn cục (Phiên hiện tại) | Lưu thông tin người dùng đang đăng nhập (`name`, `email`, `provider`, `isNewUser`). Xoá khi nhấn `Sign Out`. |
| `vibenotes_registered_users_v1` | `RegisteredWorkspaceAccount[]` | Toàn cục | Danh sách các tài khoản đã đăng ký qua tab `Sign Up (New User)` để kiểm tra trùng email và xác thực mật khẩu khi `Sign In`. |
| `vibenotes_account_notes_v2` | `Record<string, NoteItem[]>` | **Theo từng Account (`email`)** | Ánh xạ từ email chuẩn hoá (`normalizeAccountStorageKey`) sang mảng ghi chú riêng của tài khoản đó. **Tài khoản mới luôn khởi tạo là `[]` (`0` ghi chú)**. |
| `vibenotes_account_filters_v2` | `Record<string, NoteTag[]>` | **Theo từng Account (`email`)** | Ánh xạ từ email chuẩn hoá sang danh sách Filter của tài khoản đó (mặc định khởi tạo từ `TAG_CATEGORIES`). |
| `vibenotes_account_version_history_v2` | `Record<string, NoteVersionHistoryMap>` | **Theo từng Account (`email`)** | Lưu ngăn xếp tối đa `10` phiên bản cũ (`MAX_NOTE_VERSIONS = 10`) cho mỗi ghi chú thuộc tài khoản đang đăng nhập. |
| `vibenotes_sort_by_v1` | `'pinned' \| 'dateModified' \| 'title'` | Toàn cục | Lưu chế độ sắp xếp danh sách ghi chú trên Sidebar (`Pinned`, `Date Modified`, `Title`). |
| `vibenotes_theme_v2` | `'light' \| 'dark'` | Toàn cục | Lưu giao diện Sáng (`#f8f7f4`) hoặc Tối (`#121210`). |

---

## 4. Sơ đồ Luồng Hoạt động & Máy Trạng thái (Sequence & State Diagrams)

### 4.1. Luồng Đăng ký Tài khoản Mới (`0 Notes`) & Cô lập Dữ liệu theo Tài khoản

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant Login as LoginView.tsx
    participant Logic as notesLogic.ts
    participant App as App.tsx
    participant LS as localStorage

    User->>Login: Chọn tab "Sign Up (New User)", nhập Họ tên, Email, Password
    Login->>Logic: validateEmailSignUpInput(name, email, pass, confirmPass, registeredAccounts)
    Logic-->>Login: Trả về { ok: true, profile (isNewUser: true), updatedAccounts }
    Login->>App: onRegisterAccount(updatedAccounts) & onLoginSuccess(profile)
    App->>Logic: initializeAccountNotesOnAuth(accountNotesMap, profile)
    Logic-->>App: Khởi tạo accountNotesMap[emailKey] = [] (0 ghi chú)
    App->>LS: Lưu vibenotes_registered_users_v1, vibenotes_user_profile_v1, vibenotes_account_notes_v2
    App-->>User: Hiển thị Workspace trống ("No Notes Yet" / "All (0)")
```

---

### 4.2. Máy Trạng thái Thông báo `'Saved'` sau 2 giây ngừng gõ (`2000ms` Debounce)

```mermaid
stateDiagram-v2
    [*] --> idle : Khởi tạo / Chuyển sang ghi chú khác (transitionSaveToastOnReset)
    idle --> typing : Người dùng gõ nội dung hoặc sửa tiêu đề (transitionSaveToastOnEdit)
    typing --> typing : Gõ tiếp khi chưa đủ 2000ms (Reset bộ đếm 2s)
    typing --> saved : Ngừng gõ đủ 2000ms (transitionSaveToastOnDebounceComplete)
    saved --> typing : Người dùng gõ tiếp khi Toast đang hiện (Ẩn Toast ngay lập tức)
    saved --> idle : Sau 2600ms hiển thị hoặc khi đổi ghi chú (transitionSaveToastOnReset)
```

---

### 4.3. Luồng Đồng bộ Cuộn Hai chiều ở Chế độ `Split` (Bidirectional Scroll Sync)

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant Editor as Khung Soạn thảo (<textarea>)
    participant Logic as computeSyncedScrollTop()
    participant Preview as Khung Xem trước (Live Preview)

    User->>Editor: Cuộn chuột / Vuốt cảm ứng trên khung Edit
    Editor->>Editor: Kiểm tra activeScrollSourceRef !== 'preview'
    Editor->>Editor: Khoá nguồn cuộn activeScrollSourceRef = 'editor'
    Editor->>Logic: computeSyncedScrollTop(srcTop, srcScrollH, srcClientH, tgtScrollH, tgtClientH)
    Logic-->>Editor: Trả về vị trí nextScrollTop theo tỷ lệ %
    Editor->>Preview: Gán previewEl.scrollTop = nextScrollTop
    Note over Editor,Preview: Khoá activeScrollSourceRef giữ trong 60ms để chặn sự kiện onScroll dội ngược
```

---

## 5. Cấu trúc Thư mục Mã nguồn (Source Code Directory Structure)

```text
/
├── index.html                                # Entry HTML (Fonts: Cormorant Garamond, DM Sans, Space Mono)
├── metadata.json                             # Cấu hình metadata ứng dụng
├── package.json                              # Dependencies & scripts (dev, build, test, lint)
├── DECISIONS.md                              # Hồ sơ quyết định kiến trúc (ADR)
├── README.md                                 # Tài liệu tổng quan dự án (File 1)
├── docs/                                     # Thư mục đóng gói tài liệu dự án
│   ├── TECHNICAL_DOCUMENTATION.md            # Tài liệu Kỹ thuật & Kiến trúc (File 2)
│   ├── USER_MANUAL_ADMIN_GUIDE.md            # Tài liệu Hướng dẫn Sử dụng & Quản trị (File 3)
│   ├── PROJECT_PLAN_WBS.md                   # Bảng phân rã công việc (WBS 7 ngày)
│   ├── PROJECT_PLAN_WBS.csv                  # File CSV tiến độ dùng cho Excel / Notion
│   └── DAILY_LOG.md                          # Nhật ký tiến độ hàng ngày (Daily Standup Log)
├── src/
│   ├── main.tsx                              # Điểm khởi chạy ứng dụng React 19
│   ├── App.tsx                               # Quản lý state theo tài khoản, phím tắt toàn cục & bố cục chính
│   ├── index.css                             # Hệ thống Design Tokens (Light/Dark theme) & Smooth Touch Scroll
│   ├── components/
│   │   ├── LoginView.tsx                     # Màn hình Sign In / Sign Up (New User) / Google / Guest kiểu Notion
│   │   ├── Sidebar.tsx                       # Thanh bên: Hồ sơ User góc trái, Search, Sort By, Filters, Note Cards
│   │   ├── NoteWorkspace.tsx                 # Trình soạn thảo Markdown, Floating Toolbar, Toast 'Saved' (2s), Split View
│   │   ├── ShortcutsModal.tsx                # Hộp thoại tra cứu 10 phím tắt (Cheat-Sheet 2 cột)
│   │   ├── GoogleKeepDrawer.tsx              # Ngăn kéo đồng bộ Google Keep REST API & Import/Export JSON
│   │   └── ConfirmDialog.tsx                 # Hộp thoại xác nhận thao tác xoá an toàn
│   ├── services/
│   │   └── keepService.ts                    # Dịch vụ kết nối Firebase Auth & Google Keep REST API
│   └── utils/
│       ├── notesLogic.ts                     # Toàn bộ hàm thuần túy (Pure Functions) xử lý nghiệp vụ cốt lõi
│       └── pdfExport.ts                      # Bộ kết xuất PDF khổ A4 chuẩn Unicode tiếng Việt (html2canvas + jsPDF)
└── tests/                                    # Bộ kiểm thử tự động & thủ công (File 4)
    ├── MANUAL_TEST_CASES.md                  # 14 kịch bản kiểm thử thủ công (TC-01 -> TC-14)
    ├── unit/
    │   └── notesLogic.unit.test.ts           # 12 Unit Test Suites kiểm thử toàn bộ hàm trong notesLogic.ts
    └── integration/
        └── workspaceFlow.integration.test.ts # 4 Integration Test Suites kiểm thử luồng nghiệp vụ đầu-cuối
```
