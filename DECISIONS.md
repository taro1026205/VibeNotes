# Quyết định Kiến trúc & Lựa chọn Công nghệ (Architecture Decision Records)

Tài liệu này trình bày các quyết định lựa chọn công nghệ, kiến trúc dữ liệu và giải pháp UX/UI cho dự án **VibeNotes — Markdown & Google Keep Workspace**. Các file kế hoạch tiến độ (WBS) và nhật ký công việc hàng ngày được đóng gói tại thư mục **[`/docs`](docs/)**.

---

## 1. Kiến trúc Ứng dụng: React 19 + TypeScript + Vite (SPA)
- **Quyết định**: Xây dựng dưới dạng Single-Page Application (SPA) với **React 19**, **TypeScript**, và **Vite**.
- **Lý do**:
  - Tốc độ phản hồi tức thì khi chuyển đổi giữa các ghi chú, tìm kiếm thời gian thực (real-time search) theo **Tiêu đề / Nội dung / Filter**, sắp xếp danh sách ghi chú theo **3 chế độ (`Date Modified`, `Title`, `Pinned`)** và chuyển chế độ xem (`Edit` / `Split` / `Preview`) mà không phải tải lại trang.
  - TypeScript đảm bảo an toàn kiểu dữ liệu cho cấu trúc ghi chú (`NoteItem`), bộ lọc (`NoteTag`), tuỳ chọn sắp xếp (`NoteSortOption`, `NoteSortMetadata`), hồ sơ người dùng (`WorkspaceUserProfile`, `RegisteredWorkspaceAccount`), lịch sử chỉnh sửa (`EditorHistoryState`), lịch sử phiên bản cục bộ (`NoteVersionSnapshot`), trạng thái thông báo lưu (`EditorSaveToastState`), danh mục phím tắt (`ShortcutInfoItem`) và trạng thái đồng bộ Google Keep.

## 2. Lưu trữ Dữ liệu Cục bộ theo Tài khoản, Thông báo `'Saved'` (2s Debounce) & Hệ thống Lịch sử Phiên bản (`localStorage` + `Restore previous version`)
- **Quyết định**:
  - Sử dụng **`localStorage`** làm tầng lưu trữ chính và **cô lập dữ liệu riêng biệt theo từng tài khoản** (`normalizeAccountStorageKey(email)`): danh sách ghi chú theo tài khoản (`vibenotes_account_notes_v2`), danh sách filter theo tài khoản (`vibenotes_account_filters_v2`), ngăn xếp lịch sử phiên bản theo tài khoản (`vibenotes_account_version_history_v2`, giới hạn `MAX_NOTE_VERSIONS = 10` bản/ghi chú) kèm nút **`Restore previous version`**, tuỳ chọn sắp xếp Sidebar (`vibenotes_sort_by_v1`), và hồ sơ phiên đăng nhập & danh sách tài khoản đăng ký mức View (`vibenotes_user_profile_v1`, `vibenotes_registered_users_v1`).
  - Khi một **tài khoản mới** đăng ký (`Sign Up — New User`) hoặc đăng nhập lần đầu (`initializeAccountNotesOnAuth`), danh sách ghi chú của tài khoản đó luôn được khởi tạo rỗng **`[]` (`0 notes`)**, không bị lẫn ghi chú của tài khoản khác hay dữ liệu mẫu.
  - Xây dựng máy trạng thái thuần túy **`EditorSaveToastState`** (`createInitialSaveToastState`, `transitionSaveToastOnEdit`, `transitionSaveToastOnDebounceComplete`, `transitionSaveToastOnReset`) với thời gian trễ **`SAVE_TOAST_DEBOUNCE_MS = 2000`** (`2 giây`) và thời gian hiển thị **`SAVE_TOAST_VISIBLE_MS = 2600`**, kết hợp thông báo **`'Saved'`** tinh tế (`data-testid="editor-saved-toast"`, `role="status"`, `aria-live="polite"`) neo ở góc trên bên phải của khung soạn thảo (`NoteWorkspace.tsx`).
- **Lý do**:
  - **Không cần cài đặt database server phức tạp**, độ trễ lưu trữ bằng `0ms`, dữ liệu và lịch sử phiên bản bền vững ngay cả khi làm mới trang (F5) hoặc mất kết nối mạng.
  - Vì việc ghi vào `localStorage` diễn ra tức thì mà không có nút "Save" thủ công, người dùng cần một tín hiệu thị giác tinh tế nhưng không gây xao nhãng khi đang gõ liên tục. Cơ chế debounce `2000ms` đảm bảo thông báo **`'Saved'`** chỉ xuất hiện ở góc trên bên phải khung soạn thảo khi người dùng thực sự tạm dừng gõ 2 giây, tự động ẩn đi nếu người dùng gõ tiếp hoặc khi chuyển sang ghi chú khác.
  - Khi người dùng sửa nội dung hoặc tiêu đề, hàm thuần túy `recordNoteVersionSnapshot` tự động đẩy bản ghi trước đó vào ngăn xếp (loại bỏ trùng lặp liên tiếp và giới hạn 10 phiên bản gần nhất để bảo vệ dung lượng `localStorage`). Khi nhấn **`Restore previous version`**, hàm `restorePreviousNoteVersion` lấy ra bản ghi gần nhất và khôi phục tức thì.

## 3. Xử lý & Soạn thảo Markdown: `marked` + Floating Toolbar, Auto-complete & Undo/Redo Stack
- **Quyết định**: Kết hợp thư viện **`marked`** để render HTML với bộ công cụ tự xây dựng gồm **Floating Formatting Toolbar**, **Cursor-aware Markdown Auto-completion**, và **Ngăn xếp Lịch sử Undo/Redo (`EditorHistoryState`)** ngay trên `<textarea>` gốc.
- **Lý do**:
  - **`marked`** cực kỳ nhẹ, tốc độ parse nhanh, hỗ trợ đầy đủ GitHub Flavored Markdown (bảng biểu, danh sách công việc `- [x]`, trích dẫn, code block).
  - Tự xây dựng thanh công cụ nổi (`Undo`, `Redo`, `H1`, `H2`, `H3`, `Bold`, `Italic`, `List`, `Task`, `Quote`, `Code`, `Link`) và bộ gợi ý cú pháp theo vị trí con trỏ (`/`, `#`, `-`, `1.`, `>`) giúp kiểm soát chính xác vị trí con trỏ (`selectionStart`/`selectionEnd`), nhẹ hơn nhiều lần so với việc nhúng các bộ soạn thảo nặng như Monaco hay ProseMirror.
  - Quản lý ngăn xếp `past / present / future` riêng cho từng ghi chú giúp chức năng **Undo (`Ctrl/⌘+Z`)** và **Redo (`Ctrl+Y` / `⌘⇧Z`)** hoạt động xuyên suốt cho cả thao tác gõ phím lẫn chèn cú pháp từ thanh công cụ.

## 4. Hệ thống Phím tắt Toàn cục & Bảng Tra cứu Nhanh (`ShortcutsModal` + `resolveGlobalShortcutAction`)
- **Quyết định**: Xây dựng hộp thoại **`ShortcutsModal.tsx`** hiển thị bảng Cheat-Sheet 2 cột kết hợp hàm phân giải thuần túy **`resolveGlobalShortcutAction`** và **`cycleEditorViewMode`** trong `src/utils/notesLogic.ts`.
- **Lý do**:
  - Cho phép người dùng thao tác nhanh hoàn toàn bằng bàn phím cho các tác vụ phổ biến: tạo ghi chú mới (`Cmd/Ctrl + N`), chuyển đổi vòng lặp chế độ xem `Edit → Split → Preview` (`Cmd/Ctrl + E`), ghim/bỏ ghim ghi chú đang mở (`Cmd/Ctrl + P`), đưa con trỏ vào thanh tìm kiếm (`Cmd/Ctrl + K`), và bật/tắt bảng Cheat-Sheet (`Cmd/Ctrl + /` hoặc phím `?` khi không đứng trong ô nhập liệu).
  - Việc tách logic kiểm tra sự kiện bàn phím (`isEditableTarget`, `metaKey`, `ctrlKey`) ra hàm thuần túy `resolveGlobalShortcutAction` giúp kiểm thử đơn vị (Unit Test) chính xác và ngăn chặn xung đột khi người dùng đang gõ dấu `?` trong nội dung ghi chú.

## 5. Đồng bộ Cuộn Hai chiều ở Chế độ Split (Bidirectional Scroll Sync)
- **Quyết định**: Tính toán vị trí cuộn tỷ lệ thuận (`computeSyncedScrollTop`) kết hợp cơ chế khoá nguồn cuộn tạm thời (`activeScrollSourceRef` + `setTimeout 60ms`).
- **Lý do**:
  - Khi người dùng cuộn khung `Preview`, khung `Edit` tự động cuộn theo đúng tỷ lệ phần trăm và ngược lại.
  - Cơ chế khoá nguồn cuộn ngăn chặn triệt để hiện tượng vòng lặp sự kiện `onScroll` vô hạn (scroll bounce) giữa hai khung mà không cần thư viện ngoài.

## 6. Xuất Tài liệu Đa Định dạng: `html2canvas` + `jsPDF` (Export PDF) & Blob (Export Markdown)
- **Quyết định**: Kết hợp **`html2canvas` + `jsPDF`** để xuất file `.pdf` khổ A4 nhiều trang và `Blob` để xuất file `.md`.
- **Lý do**:
  - Phương thức vẽ chữ mặc định của `jsPDF` dễ bị lỗi dấu tiếng Việt và mất định dạng bảng biểu/code block. Việc kết xuất trang tài liệu chuẩn Editorial ra canvas độ phân giải cao (`scale: 2`) trước khi đóng gói vào `jsPDF` giúp bảo toàn 100% tiếng Việt có dấu, phông chữ và bố cục Markdown, đồng thời tải trực tiếp file `.pdf` về máy mà không bị chặn popup trong môi trường iframe.

## 7. Tổ chức, Phân loại & Sắp xếp Ghi chú Đa chế độ (`Sort By: Date Modified / Title / Pinned`)
- **Quyết định**:
  - Lưu danh sách Filter tách biệt trong `localStorage` và cho phép tạo mới, xoá bất kỳ filter nào (trừ `All`), hoặc di chuyển ghi chú giữa các filter bằng menu chọn trực tiếp (`<select>`) lẫn kéo-thả HTML5 (`Drag & Drop`).
  - Bổ sung thanh chọn **`Sort By`** (`data-testid="sidebar-sort-select"`) ngay trên Sidebar kết hợp hàm thuần túy **`sortNotesByOption(notes, sortBy)`** hỗ trợ 3 chế độ sắp xếp: **`Date Modified`** (`dateModified` — mới chỉnh sửa nhất lên đầu), **`Title`** (`title` — bảng chữ cái A–Z không phân biệt hoa thường, có nhận diện số `numeric: true`), và **`Pinned`** (`pinned` — tách nhóm `Pinned` lên trên nhóm `Notes`).
- **Lý do**:
  - Khi số lượng ghi chú tăng lên, người dùng có thể chuyển nhanh giữa việc xem các ghi chú quan trọng đã ghim (`Pinned`), tra cứu theo tên tài liệu (`Title A–Z`), hoặc xem các ghi chú vừa cập nhật gần nhất (`Date Modified`).
  - Khi một filter bị xoá, các ghi chú thuộc filter đó được tự động chuyển về filter hợp lệ tiếp theo để không làm mồ côi dữ liệu.

## 8. Xác thực Mức View Kiểu Notion (`LoginView`: `Sign In` / `Sign Up` / `Google`) & Đồng bộ Google Keep
- **Quyết định**:
  - Thiết kế màn hình **`LoginView.tsx`** (giao diện 100% tiếng Anh lấy cảm hứng từ Notion) hỗ trợ chuyển đổi mượt giữa 2 chế độ **`Sign In`** và **`Sign Up (New User)`**, đăng nhập nhanh qua **`Continue with Google`** hoặc **`Explore Guest Workspace`**.
  - Hiển thị tên User kèm Avatar viết tắt ở góc trái màn hình (trên đỉnh Sidebar `data-testid="sidebar-user-profile"` và dưới góc trái thanh trạng thái `data-testid="footer-user-profile"`), khi click vào sẽ mở popover hiển thị thông tin tài khoản và nút **`Sign Out`**.
  - Tích hợp **Google Keep API (`keep.googleapis.com/v1/notes`)** thông qua **Firebase Authentication (Google Sign-In popup)** trong ngăn kéo đồng bộ kèm công cụ Import/Export JSON dự phòng.
- **Lý do**:
  - Đáp ứng trọn vẹn trải nghiệm cá nhân hoá Workspace ở mức View (lưu tài khoản đăng ký mới vào `vibenotes_registered_users_v1`, kiểm tra trùng email, đối chiếu mật khẩu và giữ phiên trong `vibenotes_user_profile_v1`) mà không bắt buộc phụ thuộc server backend.
  - Kết hợp chế độ Import/Export JSON trong `GoogleKeepDrawer` giúp mọi tài khoản đều sao lưu/khôi phục dữ liệu trơn tru.

## 9. Thiết kế Giao diện & Đa thiết bị (Responsive Notion-Style UX cho Mobile, Tablet & Desktop)
- **Quyết định**: Sử dụng **Tailwind CSS v4** kết hợp bộ biến CSS (`--bg`, `--surface`, `--ink`, `--accent`), chiều cao khung nhìn động **`100dvh`**, cơ chế cuộn cảm ứng quán tính **`.smooth-touch-scroll`**, và bố cục thích ứng đa thiết bị lấy cảm hứng từ **Notion**:
  - **Slide-over Sidebar Drawer (`< 1024px`)**: Trên điện thoại và máy tính bảng dọc, Sidebar tự động chuyển thành ngăn kéo trượt mượt (`transition-transform duration-300 ease-out`) có lớp phủ mờ `backdrop-blur-xs`, tự đóng khi người dùng chọn ghi chú để nhường 100% diện tích cho trình soạn thảo. Trên Desktop (`>= 1024px`), Sidebar tự động neo cố định bên trái thông qua `window.matchMedia('(min-width: 1024px)')`.
  - **Thanh công cụ định dạng 1 hàng vuốt ngang (`Touch-Swipeable Single-Row Toolbar`)**: Toàn bộ nút `Undo`, `Redo`, `H1`–`H3`, `Bold`, `Italic`, `List`, `Task`, `Quote`, `Code`, `Link` và cụm chuyển chế độ `edit | split | preview` được bố trí trên một hàng ngang có thể vuốt mượt (`overflow-x-auto no-scrollbar`), không bị rớt dòng làm che khuất vùng viết trên màn hình nhỏ.
  - **Chế độ `Split` thích ứng thông minh**: Trên Mobile (`< 768px`), chế độ `split` tự động chia đôi màn hình theo chiều dọc `50/50` (`grid-rows-2`) để cả khung viết lẫn khung xem trước đều rộng rãi; trên Tablet & Desktop (`>= 768px`), tự động chuyển sang 2 cột song song `50/50` (`md:grid-cols-12`), giữ nguyên đồng bộ cuộn hai chiều trên mọi thiết bị.

## 10. Kiểm thử Logic Cốt lõi (`/tests`) & Quản lý Tiến độ (`/docs`)
- **Quyết định**:
  - Tách toàn bộ nghiệp vụ tìm kiếm, lọc, sắp xếp 3 chế độ (`sortNotesByOption`), thống kê từ, chèn Markdown, auto-complete, Undo/Redo, lịch sử phiên bản `localStorage` (`recordNoteVersionSnapshot`, `restorePreviousNoteVersion`), máy trạng thái thông báo `'Saved'` sau 2 giây ngừng gõ (`EditorSaveToastState`), cô lập dữ liệu ghi chú theo từng tài khoản (`normalizeAccountStorageKey`, `getNotesForAccount`, `initializeAccountNotesOnAuth`), xác thực `Sign In` / `Sign Up` (`validateEmailLoginInput`, `validateEmailSignUpInput`), đồng bộ cuộn, phân giải phím tắt và xuất PDF thành các hàm thuần túy (pure functions) trong `src/utils/notesLogic.ts` và tổ chức kiểm thử tập trung trong thư mục **`/tests`**.
  - Đóng gói toàn bộ tài liệu kế hoạch phân rã công việc (`PROJECT_PLAN_WBS.md`, `PROJECT_PLAN_WBS.csv`) và nhật ký tiến độ hàng ngày (`DAILY_LOG.md`) vào thư mục **`/docs`** để giữ thư mục gốc gọn gàng.
- **Lý do**:
  - Chạy toàn bộ **12 Unit Test Suites** (`tests/unit/notesLogic.unit.test.ts`) và **4 Integration Test Suites** (`tests/integration/workspaceFlow.integration.test.ts`) — tổng cộng **16/16 test suites** — qua `npm test` dưới 1 giây, kết hợp bảng **14 kịch bản kiểm thử thủ công** (`tests/MANUAL_TEST_CASES.md`) giúp đảm bảo chất lượng đầu-cuối.

