# Quyết định Kiến trúc & Lựa chọn Công nghệ 

Tài liệu này trình bày ngắn gọn các quyết định lựa chọn công nghệ, kiến trúc dữ liệu và giải pháp UX/UI cho dự án **VibeNotes — Markdown & Google Keep Workspace**.

---

## 1. Kiến trúc Ứng dụng: React 19 + TypeScript + Vite (SPA)
- **Quyết định**: Xây dựng dưới dạng Single-Page Application (SPA) với **React 19**, **TypeScript**, và **Vite**.
- **Lý do**:
  - Tốc độ phản hồi tức thì khi chuyển đổi giữa các ghi chú, tìm kiếm thời gian thực (real-time search) theo **Tiêu đề / Nội dung / Filter** và chuyển chế độ xem (`Edit` / `Split` / `Preview`) mà không phải tải lại trang.
  - TypeScript đảm bảo an toàn kiểu dữ liệu cho cấu trúc ghi chú (`NoteItem`), bộ lọc (`NoteTag`), lịch sử chỉnh sửa (`EditorHistoryState`) và trạng thái đồng bộ Google Keep, giảm thiểu lỗi runtime khi phát triển nhanh trong 1 tuần.

## 2. Lưu trữ Dữ liệu Cục bộ: Browser `localStorage` (Local-First)
- **Quyết định**: Sử dụng **`localStorage`** làm tầng lưu trữ chính kết hợp cơ chế tự động lưu (auto-save) ngay trên mỗi thao tác gõ phím.
- **Lý do**:
  - **Không cần cài đặt database server phức tạp**, độ trễ lưu trữ bằng `0ms`, dữ liệu bền vững ngay cả khi làm mới trang (F5) hoặc mất kết nối mạng.
  - Rất phù hợp với phạm vi phát triển nhanh trong thời gian ngắn nhưng vẫn đảm bảo trải nghiệm mượt mà, khởi chạy lập tức.

## 3. Xử lý & Soạn thảo Markdown: `marked` + Floating Toolbar, Auto-complete & Undo/Redo Stack
- **Quyết định**: Kết hợp thư viện **`marked`** để render HTML với bộ công cụ tự xây dựng gồm **Floating Formatting Toolbar**, **Cursor-aware Markdown Auto-completion**, và **Ngăn xếp Lịch sử Undo/Redo (`EditorHistoryState`)** ngay trên `<textarea>` gốc.
- **Lý do**:
  - **`marked`** cực kỳ nhẹ, tốc độ parse nhanh, hỗ trợ đầy đủ GitHub Flavored Markdown (bảng biểu, danh sách công việc `- [x]`, trích dẫn, code block).
  - Tự xây dựng thanh công cụ nổi (`Undo`, `Redo`, `H1`, `H2`, `H3`, `Bold`, `Italic`, `List`, `Task`, `Quote`, `Code`, `Link`) và bộ gợi ý cú pháp theo vị trí con trỏ (`/`, `#`, `-`, `1.`, `>`) giúp kiểm soát chính xác vị trí con trỏ (`selectionStart`/`selectionEnd`), nhẹ hơn nhiều lần so với việc nhúng các bộ soạn thảo nặng như Monaco hay ProseMirror.
  - Quản lý ngăn xếp `past / present / future` riêng cho từng ghi chú giúp chức năng **Undo (`Ctrl/⌘+Z`)** và **Redo (`Ctrl+Y` / `⌘⇧Z`)** hoạt động xuyên suốt cho cả thao tác gõ phím lẫn chèn cú pháp từ thanh công cụ.

## 4. Đồng bộ Cuộn Hai chiều ở Chế độ Split (Bidirectional Scroll Sync)
- **Quyết định**: Tính toán vị trí cuộn tỷ lệ thuận (`computeSyncedScrollTop`) kết hợp cơ chế khoá nguồn cuộn tạm thời (`activeScrollSourceRef` + `setTimeout 60ms`).
- **Lý do**:
  - Khi người dùng cuộn khung `Preview`, khung `Edit` tự động cuộn theo đúng tỷ lệ phần trăm và ngược lại.
  - Cơ chế khoá nguồn cuộn ngăn chặn triệt để hiện tượng vòng lặp sự kiện `onScroll` vô hạn (scroll bounce) giữa hai khung mà không cần thư viện ngoài.

## 5. Xuất Tài liệu Đa Định dạng: `html2canvas` + `jsPDF` (Export PDF) & Blob (Export Markdown)
- **Quyết định**: Kết hợp **`html2canvas` + `jsPDF`** để xuất file `.pdf` khổ A4 nhiều trang và `Blob` để xuất file `.md`.
- **Lý do**:
  - Phương thức vẽ chữ mặc định của `jsPDF` dễ bị lỗi dấu tiếng Việt và mất định dạng bảng biểu/code block. Việc kết xuất trang tài liệu chuẩn Editorial ra canvas độ phân giải cao (`scale: 2`) trước khi đóng gói vào `jsPDF` giúp bảo toàn 100% tiếng Việt có dấu, phông chữ và bố cục Markdown, đồng thời tải trực tiếp file `.pdf` về máy mà không bị chặn popup trong môi trường iframe.

## 6. Tổ chức & Phân loại Ghi chú: Hệ thống Filter Động + Kéo thả (Drag & Drop)
- **Quyết định**: Lưu danh sách Filter tách biệt trong `localStorage` và cho phép tạo mới, xoá bất kỳ filter nào (trừ `All`), hoặc di chuyển ghi chú giữa các filter bằng menu chọn trực tiếp (`<select>`) lẫn kéo-thả HTML5 (`Drag & Drop`).
- **Lý do**:
  - Linh hoạt hơn hệ thống nhãn cố định: khi một filter bị xoá, các ghi chú thuộc filter đó được tự động chuyển về filter hợp lệ tiếp theo để không làm mồ côi dữ liệu.
  - Bỏ các nhãn chữ rườm rà trên thẻ ghi chú, chỉ giữ dropdown chọn filter gọn nhẹ giúp giao diện sạch sẽ, thao tác 1 chạm.

## 7. Đồng bộ Đám mây: Google Keep REST API + Firebase Google OAuth
- **Quyết định**: Tích hợp trực tiếp **Google Keep API (`keep.googleapis.com/v1/notes`)** thông qua xác thực **Firebase Authentication (Google Sign-In popup)** phía client và bổ sung công cụ Import/Export JSON dự phòng.
- **Lý do**:
  - Cho phép người dùng liên kết tài khoản Google thực tế để xem, đẩy (push) ghi chú Markdown lên Google Keep hoặc xoá ghi chú đồng bộ sau khi xác nhận qua `ConfirmDialog`.
  - Bổ sung chế độ Import/Export JSON giúp người dùng tài khoản Gmail cá nhân vẫn sao lưu/khôi phục được dữ liệu ngay cả khi miền Workspace chưa bật quyền Enterprise Keep API.

## 8. Thiết kế Giao diện (Design System): Tailwind CSS v4 + Editorial Typography
- **Quyết định**: Sử dụng **Tailwind CSS v4** kết hợp biến CSS (`--bg`, `--surface`, `--ink`, `--accent`) và bộ ba phông chữ **Cormorant Garamond** (tiêu đề), **DM Sans** (nội dung), **Space Mono** (nhãn kỹ thuật, bộ đếm từ & trình sửa Markdown).
- **Lý do**:
  - Tạo phong cách **Editorial Workspace** tối giản, sắc nét, có độ tương phản cao và hỗ trợ chuyển đổi tức thì giữa **Light Mode** (giấy ấm `#f8f7f4`) và **Dark Mode** (`#121210`).

## 9. Kiểm thử Logic Cốt lõi: Thư mục `/tests` (Unit Tests, Integration Tests & Manual Test Cases)
- **Quyết định**: Tách toàn bộ nghiệp vụ tìm kiếm, lọc, sắp xếp, thống kê từ, chèn Markdown, auto-complete, Undo/Redo, đồng bộ cuộn và xuất PDF thành các hàm thuần túy (pure functions) trong `src/utils/notesLogic.ts` và tổ chức kiểm thử tập trung trong thư mục **`/tests`**.
- **Lý do**:
  - Chạy toàn bộ Unit Tests (`tests/unit/notesLogic.unit.test.ts`) và Integration Tests (`tests/integration/workspaceFlow.integration.test.ts`) qua `npm test` dưới 1 giây mà không phụ thuộc vào DOM nặng, kết hợp bảng kịch bản kiểm thử thủ công (`tests/MANUAL_TEST_CASES.md`) giúp đảm bảo chất lượng đầu-cuối.
