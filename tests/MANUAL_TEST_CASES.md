# Kịch bản Kiểm thử Thủ công & Tự động (Manual & Automated Test Cases)

Thư mục `/tests` bao gồm cả **bộ kiểm thử tự động (Unit & Integration Tests)** và **danh mục kịch bản kiểm thử thủ công (Manual Test Cases)** cho các chức năng cốt lõi của **VibeNotes**.

---

## 1. Cách Chạy Bộ Kiểm thử Tự động (Automated Tests)

Hệ thống sử dụng trình chạy test tích hợp sẵn của Node.js (`node:test` kết hợp `tsx`) để kiểm tra các hàm xử lý logic trong `src/utils/notesLogic.ts`.

```bash
# Chạy toàn bộ Unit Tests & Integration Tests trong thư mục /tests (14/14 test suites)
npm test

# Hoặc chạy riêng từng bộ test:
npx tsx --test tests/unit/notesLogic.unit.test.ts
npx tsx --test tests/integration/workspaceFlow.integration.test.ts
```

### Danh sách File Kiểm thử Tự động trong `/tests`
- **`tests/unit/notesLogic.unit.test.ts`** (10 Unit Test Suites): Kiểm thử đơn vị cho từng hàm xử lý độc lập:
  - `createNewNoteItem`: Khởi tạo ghi chú mới với giá trị mặc định và tuỳ chỉnh.
  - `filterAndSortNotes`, `sortNotesByOption` & `NOTE_SORT_OPTIONS`: Tìm kiếm kết hợp theo **Tiêu đề / Nội dung / Tên Filter**, lọc theo danh mục và sắp xếp linh hoạt theo **3 chế độ (`Date Modified`, `Title`, `Pinned`)**.
  - `createCustomFilter` & `deleteFilterFromList`: Tạo filter mới, chặn trùng tên, xoá bất kỳ filter nào ngoài `All` và tự động chuyển ghi chú sang filter hợp lệ tiếp theo.
  - `applyMarkdownInsertion`: Chèn cú pháp Markdown (`H1`–`H3`, `Bold`, `Italic`, `List`, `Task`, `Quote`, `Code`, `Link`) từ thanh công cụ nổi.
  - `getMarkdownAutocompleteSuggestions` & `applyAutocompleteSuggestion`: Gợi ý và chèn cú pháp tự động khi gõ `/`, `#`, `-`, `1.`, `>`, `` ` ``.
  - `createInitialHistoryState`, `pushEditorHistory`, `undoEditorHistory`, `redoEditorHistory`: Quản lý ngăn xếp lịch sử hoàn tác/làm lại (`Undo` / `Redo`) trong phiên soạn thảo.
  - `computeSyncedScrollTop`, `formatPdfFilename` & `buildPrintableNoteHtml`: Tính toán vị trí cuộn đồng bộ hai chiều ở chế độ `Split`, chuẩn hoá tên file `.pdf` tiếng Việt không dấu và dựng tài liệu HTML chuẩn A4.
  - `KEYBOARD_SHORTCUTS`, `cycleEditorViewMode` & `resolveGlobalShortcutAction`: Kiểm tra danh mục 10 phím tắt, hàm xoay vòng chế độ xem (`edit` $\rightarrow$ `split` $\rightarrow$ `preview` $\rightarrow$ `edit`) và bộ phân giải phím tắt toàn cục (`Cmd/Ctrl + N`, `Cmd/Ctrl + E`, `Cmd/Ctrl + P`, `Cmd/Ctrl + K`, `Cmd/Ctrl + /`, `?`).
  - `recordNoteVersionSnapshot`, `restorePreviousNoteVersion`, `getNoteVersionStack` & `MAX_NOTE_VERSIONS`: Lưu trữ ngăn xếp phiên bản ghi chú trước đó trong `localStorage` (tối đa 10 bản ghi/ghi chú) và khôi phục phiên bản trước qua nút `Restore previous version`.
  - `deriveUserNameFromEmail`, `validateEmailLoginInput`, `validateEmailSignUpInput` & `createGoogleDemoUserProfile`: Kiểm tra validation **Sign In** và **Sign Up (New User)**, chống trùng lặp email đã đăng ký (`vibenotes_registered_users_v1`), kiểm tra mật khẩu khớp và khởi tạo hồ sơ Google Account ở mức View.
- **`tests/integration/workspaceFlow.integration.test.ts`** (4 Integration Test Suites): Kiểm thử tích hợp mô phỏng luồng thao tác đầu-cuối của người dùng:
  - **Luồng 1**: Tạo ghi chú $\rightarrow$ Định dạng bằng Floating Toolbar $\rightarrow$ Chèn checklist qua Auto-complete `/task` $\rightarrow$ Khôi phục phiên bản cũ từ `localStorage` (`Restore previous version`) $\rightarrow$ Undo / Redo $\rightarrow$ Xuất tài liệu PDF HTML.
  - **Luồng 2**: Tạo Filter mới $\rightarrow$ Di chuyển ghi chú vào Filter $\rightarrow$ Tìm kiếm theo tên Filter $\rightarrow$ Chuyển đổi sắp xếp Sidebar giữa `Pinned`, `Date Modified`, `Title` $\rightarrow$ Xoá Filter & kiểm tra tự động chuyển ghi chú.
  - **Luồng 3**: Thao tác bằng Phím tắt Toàn cục (`Cmd/Ctrl + N` tạo ghi chú mới $\rightarrow$ `Cmd/Ctrl + E` chuyển đổi chế độ xem $\rightarrow$ `Cmd/Ctrl + P` ghim ghi chú lên đầu danh sách $\rightarrow$ `Cmd/Ctrl + /` mở bảng Cheat-Sheet phím tắt).
  - **Luồng 4**: Đăng ký tài khoản mới (`Sign Up — New User`) $\rightarrow$ Đăng xuất (`Sign Out`) $\rightarrow$ Đăng nhập lại (`Sign In`) $\rightarrow$ Đăng nhập nhanh Google Demo $\rightarrow$ Sắp xếp ghi chú theo `Date Modified`, `Title` và `Pinned`.

---

## 2. Bảng Kịch bản Kiểm thử Thủ công (Manual Test Cases)

| Mã TC | Nhóm chức năng | Tên kịch bản kiểm thử | Các bước thực hiện (Steps) | Kết quả mong đợi (Expected Result) | Kết quả |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **TC-01** | **CRUD Ghi chú** | Thêm, sửa tiêu đề & nội dung ghi chú | 1. Nhấn nút `+ New Note` ở Sidebar (hoặc `Cmd/Ctrl + N`).<br>2. Nhập tiêu đề `"Ghi chú kiểm thử"` và nội dung Markdown.<br>3. Nhấn `F5` để tải lại trang. | Ghi chú mới xuất hiện đầu danh sách, nội dung hiển thị trực tiếp bên khung Preview và giữ nguyên 100% sau khi `F5` (`localStorage`). | **PASS** |
| **TC-02** | **CRUD Ghi chú** | Xoá ghi chú có xác nhận | 1. Nhấn nút `Delete` trên thanh công cụ hoặc biểu tượng thùng rác trên thẻ ghi chú.<br>2. Kiểm tra hộp thoại xác nhận `Delete Note?` và nhấn `Delete Note`. | Hộp thoại xác nhận hiển thị rõ tên ghi chú; sau khi xác nhận, ghi chú và lịch sử phiên bản của nó bị xoá khỏi `localStorage`. | **PASS** |
| **TC-03** | **Filter** | Tạo Filter mới, gắn Filter & Xoá Filter | 1. Nhấn `+ New Filter`, nhập `"Sprint 15"`, nhấn `Add`.<br>2. Chọn `"Sprint 15"` từ dropdown trên thẻ ghi chú.<br>3. Nhấn nút `×` cạnh filter `"Sprint 15"` (hoặc bất kỳ filter nào ngoài `All`). | Filter được tạo mới, ghi chú chuyển vào `"Sprint 15"`. Khi xoá filter bằng nút `×`, chỉ có `All` không có nút xoá; ghi chú trong filter bị xoá tự chuyển về filter đầu tiên còn lại. | **PASS** |
| **TC-04** | **Tìm kiếm** | Tìm kiếm theo Tiêu đề / Nội dung / Filter | 1. Nhấn `⌘K` (hoặc `Ctrl+K`) để đưa con trỏ vào ô tìm kiếm.<br>2. Lần lượt gõ từ khóa có trong Tiêu đề, Nội dung, hoặc tên Filter (ví dụ: `"Engineering"`). | Danh sách ghi chú bên trái lọc tức thì theo thời gian thực khớp với cả 3 trường Tiêu đề, Nội dung và tên Filter. | **PASS** |
| **TC-05** | **Markdown & Auto-complete** | Thanh công cụ nổi & Gợi ý cú pháp (`/`) | 1. Bôi đen một đoạn chữ, nhấn nút `Bold` trên thanh công cụ nổi.<br>2. Xuống dòng mới, gõ `/ta` rồi nhấn `Enter`. | Đoạn chữ được bọc `**...**`. Khi gõ `/ta`, menu gợi ý hiện ra và chèn bảng Markdown hoặc Task list ngay tại vị trí con trỏ. | **PASS** |
| **TC-06** | **Undo / Redo** | Hoàn tác & Làm lại bằng nút bấm và phím tắt | 1. Nhập thêm văn bản hoặc chèn `H1` từ thanh công cụ.<br>2. Nhấn nút `Undo` trên thanh công cụ (hoặc `Ctrl+Z` / `⌘Z`).<br>3. Nhấn nút `Redo` (hoặc `Ctrl+Y` / `⌘⇧Z`). | Nội dung và vị trí con trỏ quay lại trạng thái trước đó khi `Undo`, và khôi phục lại chính xác khi `Redo`. | **PASS** |
| **TC-07** | **Split Scroll Sync** | Đồng bộ cuộn hai chiều ở chế độ `SPLIT` | 1. Chọn chế độ xem `split`.<br>2. Cuộn khung `Preview` (bên phải) xuống cuối trang.<br>3. Cuộn khung `Edit` (bên trái) ngược lên đầu trang. | Khi cuộn khung `Preview`, khung `Edit` tự động cuộn theo đúng tỷ lệ; khi cuộn khung `Edit`, khung `Preview` cũng tự động cuộn theo mượt mà. | **PASS** |
| **TC-08** | **Export** | Xuất ghi chú ra file `.PDF` và `.MD` | 1. Mở một ghi chú có tiếng Việt có dấu, bảng biểu và code block.<br>2. Nhấn `Export PDF` và `Export Markdown`. | Trình duyệt tải về file `.pdf` (định dạng trang A4, hiển thị đầy đủ tiếng Việt và bảng biểu) và file `.md` tương ứng. | **PASS** |
| **TC-09** | **Responsive Mobile & Tablet** | Ngăn kéo trượt Notion-style, Thanh công cụ vuốt ngang & Bố cục `Split` thích ứng | 1. Mở ứng dụng ở khung nhìn Điện thoại (`390×844`) và Tablet (`820×1080`).<br>2. Nhấn nút mở ngăn kéo Sidebar (`Notes`), chọn một ghi chú.<br>3. Chuyển sang chế độ `split` và cuộn thử khung `Preview`. | - Dưới `1024px`, Sidebar mở dưới dạng ngăn kéo trượt có lớp nền mờ và tự đóng khi chọn ghi chú.<br>- Thanh công cụ định dạng nằm gọn trên 1 hàng vuốt ngang mượt.<br>- Chế độ `split` chia `50/50` dọc trên Mobile (`< 768px`) và `50/50` ngang trên Tablet (`>= 768px`), giữ nguyên đồng bộ cuộn hai chiều mượt mà. | **PASS** |
| **TC-10** | **Shortcuts Modal & Global Keys** | Bảng tra cứu phím tắt (`ShortcutsModal`) & Phím tắt toàn cục (`Cmd/Ctrl + N, E, P, /`) | 1. Nhấn nút `Shortcuts` (biểu tượng `Info`) trên thanh Header hoặc nhấn `Cmd/Ctrl + /` (hoặc `?`).<br>2. Kiểm tra bảng Cheat-Sheet 2 cột và nhấn `Esc` để đóng.<br>3. Nhấn `Cmd/Ctrl + E` để chuyển chế độ xem, `Cmd/Ctrl + P` để ghim/bỏ ghim, và `Cmd/Ctrl + N` để tạo ghi chú mới. | - Hộp thoại `Keyboard Shortcuts Cheat-Sheet` hiển thị đầy đủ 10 phím tắt chia theo 2 nhóm (`Workspace & Common Tasks` và `Markdown Formatting & History`).<br>- Các tổ hợp `Cmd/Ctrl + E`, `Cmd/Ctrl + P`, `Cmd/Ctrl + N`, `Cmd/Ctrl + K` hoạt động tức thì mà không làm gián đoạn trình duyệt. | **PASS** |
| **TC-11** | **Local Version History (`localStorage`)** | Lưu ngăn xếp phiên bản cũ vào `localStorage` & Khôi phục qua nút `Restore previous version` | 1. Chỉnh sửa nội dung hoặc tiêu đề của một ghi chú.<br>2. Quan sát nút `Restore previous version (N)` trên thanh điều khiển được bật sáng (kể cả sau khi nhấn `F5`).<br>3. Nhấn nút `Restore previous version`. | - Mỗi lần thay đổi nội dung/tiêu đề, trạng thái trước đó được đẩy vào ngăn xếp `vibenotes_version_history_v1` trong `localStorage` (tối đa 10 bản ghi/ghi chú).<br>- Khi nhấn `Restore previous version`, nội dung và tiêu đề của ghi chú quay về bản ghi trước đó và giảm số lượng bản lưu đi 1. | **PASS** |
| **TC-12** | **Notion-Style Login / Sign Up & Sign Out** | Đăng nhập (`Sign In`), Đăng ký tài khoản mới (`Sign Up — New User`), Google Account & Click mục tên User góc trái để `Sign Out` (100% English UI) | 1. Trên màn hình `LoginView`, chuyển qua tab `Sign Up (New User)`, nhập Full Name (`Alex Rivera`), Email (`alex@vibenotes.io`), Password & Confirm Password rồi nhấn `Create Account`.<br>2. Kiểm tra tên User (`Alex Rivera`) hiển thị ở góc trái màn hình (trên đầu Sidebar & dưới góc trái Footer).<br>3. Click vào mục tên User ở góc trái và nhấn `Sign Out` (giao diện 100% tiếng Anh).<br>4. Đăng nhập lại ở tab `Sign In` với `alex@vibenotes.io` hoặc `Continue with Google`. | - Tạo tài khoản mới lưu vào `vibenotes_registered_users_v1`, báo lỗi nếu trùng email hoặc lệch mật khẩu xác nhận.<br>- Sau khi đăng nhập/đăng ký, góc trái màn hình hiển thị rõ avatar viết tắt + tên User.<br>- Khi click vào mục tên User ở góc trái, menu tài khoản mở ra với nút **`Sign Out`** thuần tiếng Anh; nhấn vào xoá phiên và quay lại trang `LoginView`. | **PASS** |
| **TC-13** | **Sidebar Note Sorting (`Sort By`)** | Sắp xếp danh sách ghi chú trên Sidebar theo `Date Modified`, `Title`, hoặc `Pinned` | 1. Tại mục `Sort By` trong Sidebar (`data-testid="sidebar-sort-select"`), chọn **`Date Modified`**.<br>2. Tiếp theo chọn **`Title`**.<br>3. Chọn lại **`Pinned`** rồi nhấn `F5` để tải lại trang. | - Khi chọn `Date Modified`: Danh sách hiển thị tiêu đề `Sorted by Date Modified — N` và sắp xếp ghi chú mới chỉnh sửa nhất lên đầu.<br>- Khi chọn `Title`: Danh sách hiển thị `Sorted by Title (A–Z) — N` và sắp xếp theo bảng chữ cái A–Z của tiêu đề.<br>- Khi chọn `Pinned`: Tách rõ 2 nhóm `Pinned — N` và `Notes — M`.<br>- Lựa chọn sắp xếp được lưu bền vững vào `localStorage` (`vibenotes_sort_by_v1`) sau khi `F5`. | **PASS** |


