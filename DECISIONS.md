# Quyết định Kiến trúc & Lựa chọn Công nghệ (Architecture Decision Records)

Tài liệu này trình bày các quyết định lựa chọn công nghệ, kiến trúc dữ liệu và giải pháp UX/UI cho dự án **VibeNotes — Markdown & Google Keep Workspace**. Các file kế hoạch tiến độ (WBS) và nhật ký công việc hàng ngày được đóng gói tại thư mục **[`/docs`](docs/)**.

---

## 1. Kiến trúc Ứng dụng: React 19 + TypeScript + Vite (SPA)
- **Quyết định**: Xây dựng dưới dạng Single-Page Application (SPA) với **React 19**, **TypeScript**, và **Vite**.
- **Lý do**:
  - Tốc độ phản hồi tức thì khi chuyển đổi giữa các ghi chú, tìm kiếm thời gian thực (real-time search) theo **Tiêu đề / Nội dung / Filter** và chuyển chế độ xem (`Edit` / `Split` / `Preview`) mà không phải tải lại trang.
  - TypeScript đảm bảo an toàn kiểu dữ liệu cho cấu trúc ghi chú (`NoteItem`), bộ lọc (`NoteTag`), lịch sử chỉnh sửa (`EditorHistoryState`), lịch sử phiên bản cục bộ (`NoteVersionSnapshot`), danh mục phím tắt (`ShortcutInfoItem`) và trạng thái đồng bộ Google Keep.

## 2. Lưu trữ Dữ liệu Cục bộ & Hệ thống Lịch sử Phiên bản (`localStorage` + `Restore previous version`)
- **Quyết định**: Sử dụng **`localStorage`** làm tầng lưu trữ chính cho danh sách ghi chú (`vibenotes_workspace_notes_v1`), danh sách filter (`vibenotes_custom_filters_v1`), và ngăn xếp lịch sử phiên bản của từng ghi chú (`vibenotes_version_history_v1`, giới hạn `MAX_NOTE_VERSIONS = 10` bản/ghi chú) kèm nút **`Restore previous version`** trên thanh điều khiển trình soạn thảo.
- **Lý do**:
  - **Không cần cài đặt database server phức tạp**, độ trễ lưu trữ bằng `0ms`, dữ liệu và lịch sử phiên bản bền vững ngay cả khi làm mới trang (F5) hoặc mất kết nối mạng.
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

## 7. Tổ chức & Phân loại Ghi chú: Hệ thống Filter Động + Kéo thả (Drag & Drop)
- **Quyết định**: Lưu danh sách Filter tách biệt trong `localStorage` và cho phép tạo mới, xoá bất kỳ filter nào (trừ `All`), hoặc di chuyển ghi chú giữa các filter bằng menu chọn trực tiếp (`<select>`) lẫn kéo-thả HTML5 (`Drag & Drop`).
- **Lý do**:
  - Linh hoạt hơn hệ thống nhãn cố định: khi một filter bị xoá, các ghi chú thuộc filter đó được tự động chuyển về filter hợp lệ tiếp theo để không làm mồ côi dữ liệu.
  - Bỏ các nhãn chữ rườm rà trên thẻ ghi chú, chỉ giữ dropdown chọn filter gọn nhẹ giúp giao diện sạch sẽ, thao tác 1 chạm.

## 8. Đồng bộ Đám mây: Google Keep REST API + Firebase Google OAuth
- **Quyết định**: Tích hợp trực tiếp **Google Keep API (`keep.googleapis.com/v1/notes`)** thông qua xác thực **Firebase Authentication (Google Sign-In popup)** phía client và bổ sung công cụ Import/Export JSON dự phòng.
- **Lý do**:
  - Cho phép người dùng liên kết tài khoản Google thực tế để xem, đẩy (push) ghi chú Markdown lên Google Keep hoặc xoá ghi chú đồng bộ sau khi xác nhận qua `ConfirmDialog`.
  - Bổ sung chế độ Import/Export JSON giúp người dùng tài khoản Gmail cá nhân vẫn sao lưu/khôi phục được dữ liệu ngay cả khi miền Workspace chưa bật quyền Enterprise Keep API.

## 9. Thiết kế Giao diện & Đa thiết bị (Responsive Notion-Style UX cho Mobile, Tablet & Desktop)
- **Quyết định**: Sử dụng **Tailwind CSS v4** kết hợp bộ biến CSS (`--bg`, `--surface`, `--ink`, `--accent`), chiều cao khung nhìn động **`100dvh`**, cơ chế cuộn cảm ứng quán tính **`.smooth-touch-scroll`**, và bố cục thích ứng đa thiết bị lấy cảm hứng từ **Notion**:
  - **Slide-over Sidebar Drawer (`< 1024px`)**: Trên điện thoại và máy tính bảng dọc, Sidebar tự động chuyển thành ngăn kéo trượt mượt (`transition-transform duration-300 ease-out`) có lớp phủ mờ `backdrop-blur-xs`, tự đóng khi người dùng chọn ghi chú để nhường 100% diện tích cho trình soạn thảo. Trên Desktop (`>= 1024px`), Sidebar tự động neo cố định bên trái thông qua `window.matchMedia('(min-width: 1024px)')`.
  - **Thanh công cụ định dạng 1 hàng vuốt ngang (`Touch-Swipeable Single-Row Toolbar`)**: Toàn bộ nút `Undo`, `Redo`, `H1`–`H3`, `Bold`, `Italic`, `List`, `Task`, `Quote`, `Code`, `Link` và cụm chuyển chế độ `edit | split | preview` được bố trí trên một hàng ngang có thể vuốt mượt (`overflow-x-auto no-scrollbar`), không bị rớt dòng làm che khuất vùng viết trên màn hình nhỏ.
  - **Chế độ `Split` thích ứng thông minh**: Trên Mobile (`< 768px`), chế độ `split` tự động chia đôi màn hình theo chiều dọc `50/50` (`grid-rows-2`) để cả khung viết lẫn khung xem trước đều rộng rãi; trên Tablet & Desktop (`>= 768px`), tự động chuyển sang 2 cột song song `50/50` (`md:grid-cols-12`), giữ nguyên đồng bộ cuộn hai chiều trên mọi thiết bị.

## 10. Kiểm thử Logic Cốt lõi (`/tests`) & Quản lý Tiến độ (`/docs`)
- **Quyết định**:
  - Tách toàn bộ nghiệp vụ tìm kiếm, lọc, sắp xếp, thống kê từ, chèn Markdown, auto-complete, Undo/Redo, lịch sử phiên bản `localStorage` (`recordNoteVersionSnapshot`, `restorePreviousNoteVersion`), đồng bộ cuộn, phân giải phím tắt và xuất PDF thành các hàm thuần túy (pure functions) trong `src/utils/notesLogic.ts` và tổ chức kiểm thử tập trung trong thư mục **`/tests`**.
  - Đóng gói toàn bộ tài liệu kế hoạch phân rã công việc (`PROJECT_PLAN_WBS.md`, `PROJECT_PLAN_WBS.csv`) và nhật ký tiến độ hàng ngày (`DAILY_LOG.md`) vào thư mục **`/docs`** để giữ thư mục gốc gọn gàng.
- **Lý do**:
  - Chạy toàn bộ 9 Unit Test Suites (`tests/unit/notesLogic.unit.test.ts`) và 3 Integration Test Suites (`tests/integration/workspaceFlow.integration.test.ts`) qua `npm test` dưới 1 giây, kết hợp bảng 11 kịch bản kiểm thử thủ công (`tests/MANUAL_TEST_CASES.md`) giúp đảm bảo chất lượng đầu-cuối.
