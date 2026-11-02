# Kế hoạch Dự án & Bảng Phân rã Công việc (WBS — 1-Week Sprint)

Dự án: **VibeNotes — Markdown & Google Keep Workspace**  
Thời lượng Sprint: **7 Ngày (Tuần 1)**  
Trạng thái tổng thể: **Hoàn thành 100% MVP (Done)**  
Vị trí lưu trữ: **`/docs/PROJECT_PLAN_WBS.md`**

> **Mẹo sử dụng cho Excel / Notion / Trello**: Trong cùng thư mục `/docs` đã đính kèm sẵn file **[`PROJECT_PLAN_WBS.csv`](./PROJECT_PLAN_WBS.csv)** cùng cấu trúc bảng bên dưới và nhật ký hàng ngày **[`DAILY_LOG.md`](./DAILY_LOG.md)**. Bạn có thể mở trực tiếp file CSV bằng **Excel / Google Sheets** hoặc dùng tính năng **Import CSV** của **Notion / Trello** để tạo bảng Quản lý Tiến độ chỉ trong 10 giây.

---

## 1. Bảng Phân rã Công việc (WBS) & Định nghĩa Hoàn thành (Definition of Done - DoD)

| Mã WBS | Giai đoạn (Phase) | Tên công việc (Task) | Mốc thời gian | Độ ưu tiên | Trạng thái | Định nghĩa Hoàn thành (Definition of Done - DoD) | File / Đầu ra nghiệm thu |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **WBS-1.1** | **1. Khởi tạo & Thiết kế MVP** | Phân tích bài toán, chốt phạm vi MVP 1 tuần & kiến trúc dữ liệu | Ngày 1 (Sáng) | Cao (P0) | **Done** | - Xác định rõ vấn đề thực tế cần giải quyết.<br>- Chốt model `NoteItem`, `NoteTag`, `NoteMetrics`, `ShortcutInfoItem`.<br>- Liệt kê rõ các tính năng trong/ngoài phạm vi (Out of Scope). | `README.md`, `DECISIONS.md` |
| **WBS-1.2** | **1. Khởi tạo & Thiết kế MVP** | Thiết lập khung React + TypeScript + Tailwind CSS v4 & Editorial Theme | Ngày 1 (Chiều) | Cao (P0) | **Done** | - Ứng dụng biên dịch thành công trên cổng 3000.<br>- Khai báo bộ biến màu CSS (`--bg`, `--surface`, `--ink`) cho cả Light Mode và Dark Mode.<br>- Tích hợp 3 font chữ *Cormorant Garamond*, *DM Sans*, *Space Mono*. | `index.html`, `src/index.css`, `metadata.json` |
| **WBS-2.1** | **2. Core CRUD & Lưu trữ Cục bộ** | Xây dựng các hàm xử lý CRUD ghi chú & tự động lưu `localStorage` | Ngày 2 (Sáng) | Cao (P0) | **Done** | - Tạo, đọc, cập nhật tiêu đề/nội dung, ghim (`Pin`) ghi chú hoạt động tức thì.<br>- Tự động lưu vào `localStorage` (`vibenotes_workspace_notes_v1`) ngay khi gõ phím.<br>- Tải lại trang (F5) không mất dữ liệu. | `src/utils/notesLogic.ts`, `src/App.tsx` |
| **WBS-2.2** | **2. Core CRUD & Lưu trữ Cục bộ** | Xây dựng hộp thoại xác nhận xoá ghi chú an toàn (`ConfirmDialog`) | Ngày 2 (Chiều) | Cao (P0) | **Done** | - Khi nhấn nút xoá ở Sidebar hoặc thanh công cụ, hiển thị modal xác nhận rõ tên ghi chú.<br>- Xoá xong tự động chuyển sang ghi chú kế tiếp hoặc màn hình trống. | `src/components/ConfirmDialog.tsx` |
| **WBS-3.1** | **3. Hệ thống Filter & Tìm kiếm** | Xây dựng chức năng tạo/xoá Filter động & gắn Filter cho ghi chú | Ngày 3 (Sáng) | Cao (P0) | **Done** | - Tạo mới filter tuỳ chỉnh và lưu vào `localStorage`.<br>- Mọi filter (trừ `All`) đều có nút xoá `×`; khi xoá filter, các ghi chú thuộc filter đó tự động chuyển về filter đầu tiên còn lại.<br>- Gắn filter qua dropdown gọn nhẹ (không có chữ "Move" dư thừa) hoặc kéo-thả (`Drag & Drop`). | `src/components/Sidebar.tsx`, `src/utils/notesLogic.ts` |
| **WBS-3.2** | **3. Hệ thống Filter & Tìm kiếm** | Tìm kiếm thời gian thực theo Tiêu đề / Nội dung / Filter | Ngày 3 (Chiều) | Cao (P0) | **Done** | - Ô tìm kiếm hỗ trợ phím tắt `⌘K` / `Ctrl+K`.<br>- Lọc danh sách ghi chú tức thì không phân biệt hoa thường khớp theo cả 3 trường: Tiêu đề, Nội dung, và Tên Filter. | `src/utils/notesLogic.ts`, `src/components/Sidebar.tsx` |
| **WBS-4.1** | **4. Trình soạn thảo Markdown & Phím tắt** | Tích hợp `marked` & xây dựng Thanh công cụ định dạng nổi (Floating Toolbar) | Ngày 4 (Sáng) | Cao (P0) | **Done** | - Render trực tiếp Markdown sang HTML chuẩn xác.<br>- Thanh công cụ nổi chèn nhanh `H1`, `H2`, `H3`, `Bold`, `Italic`, `List`, `Num`, `Task`, `Quote`, `Code`, `Link` đúng vị trí bôi đen. | `src/components/NoteWorkspace.tsx` |
| **WBS-4.2** | **4. Trình soạn thảo Markdown & Phím tắt** | Xây dựng Auto-complete, Undo/Redo & Bảng Phím tắt Cheat-Sheet (`ShortcutsModal`) | Ngày 4 (Chiều) | Cao (P0) | **Done** | - Gõ `/`, `#`, `-`, `1.`, `>` hiển thị popover gợi ý cú pháp.<br>- Hỗ trợ `Undo` (`Ctrl/⌘+Z`) và `Redo` (`Ctrl+Y`/`⌘⇧Z`).<br>- Hộp thoại `ShortcutsModal` (mở bằng nút `Shortcuts` hoặc `Cmd/Ctrl + /`, `?`) hiển thị 10 phím tắt; hoạt động đầy đủ `Cmd/Ctrl + N` (tạo mới), `Cmd/Ctrl + E` (đổi chế độ xem), `Cmd/Ctrl + P` (ghim ghi chú). | `src/components/ShortcutsModal.tsx`, `src/utils/notesLogic.ts`, `src/App.tsx` |
| **WBS-5.1** | **5. Đồng bộ Cuộn Split & Xuất File** | Đồng bộ cuộn hai chiều (Bidirectional Scroll Sync) ở chế độ `SPLIT` | Ngày 5 (Sáng) | Trung bình (P1) | **Done** | - Cuộn khung `Preview` thì khung `Edit` tự động cuộn theo đúng tỷ lệ phần trăm và ngược lại.<br>- Có cơ chế khoá chống lặp vô hạn (`Anti-bounce Lock`). | `src/components/NoteWorkspace.tsx`, `src/utils/notesLogic.ts` |
| **WBS-5.2** | **5. Đồng bộ Cuộn Split & Xuất File** | Xuất ghi chú ra file `.MD` và `.PDF` khổ A4 chuẩn tiếng Việt | Ngày 5 (Chiều) | Trung bình (P1) | **Done** | - Xuất file `.md` giữ nguyên mã nguồn Markdown.<br>- Xuất file `.pdf` bằng `html2canvas` + `jsPDF` hiển thị đầy đủ tiếng Việt có dấu, tiêu đề, metadata và bảng biểu. | `src/utils/pdfExport.ts`, `src/App.tsx` |
| **WBS-6.1** | **6. Tích hợp Đám mây & Backup** | Tích hợp Google Keep REST API + Firebase OAuth & Import/Export JSON | Ngày 6 (Sáng) | Trung bình (P1) | **Done** | - Đăng nhập Google OAuth, liệt kê/đẩy/xoá ghi chú Google Keep có xác nhận.<br>- Có tính năng Import/Export JSON dự phòng khi dùng tài khoản Gmail cá nhân. | `src/services/keepService.ts`, `src/components/GoogleKeepDrawer.tsx` |
| **WBS-6.2** | **6. Tối ưu Đa thiết bị (Mobile & Tablet)** | Thiết kế lại giao diện Mobile & Tablet kiểu Notion (Drawer, Touch Toolbar, Smooth Scroll) | Ngày 6 (Chiều) | Cao (P0) | **Done** | - Sidebar dạng ngăn kéo trượt (`Slide-over Drawer`) dưới `1024px` và cố định trên Desktop.<br>- Thanh công cụ định dạng vuốt ngang 1 hàng (`no-scrollbar`).<br>- Chế độ `Split` chia 50/50 dọc trên Mobile (`grid-rows-2`) và 50/50 ngang trên Tablet/Desktop (`md:grid-cols-12`), cuộn cảm ứng mượt `100dvh`. | `src/App.tsx`, `src/components/Sidebar.tsx`, `src/components/NoteWorkspace.tsx`, `src/index.css` |
| **WBS-7.1** | **7. Kiểm thử & Đóng gói Tài liệu** | Viết Unit Tests, Integration Tests, Manual Test Cases & đóng gói `/docs` | Ngày 7 | Cao (P0) | **Done** | - Toàn bộ 11/11 test suites tự động trong `/tests` chạy PASS 100% (`npm test`).<br>- Đóng gói gọn các file tiến độ vào `/docs` và cập nhật đầy đủ `README.md`, `DECISIONS.md`. | `tests/`, `docs/`, `README.md`, `DECISIONS.md` |

---

## 2. Checklist Nghiệm thu Cuối Sprint (Final Sprint Checklist)

- [x] **CRUD Ghi chú**: Thêm (`Cmd/Ctrl + N`), xem, sửa, ghim (`Cmd/Ctrl + P`), xoá (có modal xác nhận) hoạt động mượt mà.
- [x] **Lưu trữ `localStorage`**: Tự động lưu ghi chú, filter và giao diện Sáng/Tối.
- [x] **Quản lý Filter**: Tạo filter mới, gắn filter bằng dropdown hoặc kéo-thả, xoá mọi filter trừ `All`.
- [x] **Tìm kiếm đa trường**: Tìm kiếm theo Tiêu đề, Nội dung và tên Filter (`Cmd/Ctrl + K`).
- [x] **Soạn thảo Markdown & Undo/Redo**: Floating Toolbar + Auto-complete (`/`) + Undo/Redo (`Cmd/Ctrl + Z` / `Cmd/Ctrl + Y`).
- [x] **Bảng Phím tắt (`ShortcutsModal`)**: Hộp thoại Cheat-Sheet 2 cột (`Cmd/Ctrl + /` hoặc `?`) hiển thị đầy đủ phím tắt toàn cục và trình soạn thảo.
- [x] **Chế độ Split (`Cmd/Ctrl + E`)**: Đồng bộ cuộn hai chiều giữa khung Edit và khung Preview.
- [x] **Trải nghiệm Mobile & Tablet (Notion UX)**: Ngăn kéo Sidebar trượt mượt, thanh công cụ 1 hàng vuốt ngang, chế độ Split 50/50 dọc (Mobile) / ngang (Tablet) và cuộn mượt `100dvh`.
- [x] **Xuất tài liệu**: Xuất file `.md` và `.pdf` (hỗ trợ đầy đủ tiếng Việt có dấu).
- [x] **Kiểm thử & Tài liệu**: Bộ 11/11 test suites trong `/tests` đạt PASS 100%, đóng gói tiến độ vào `/docs` (`PROJECT_PLAN_WBS.md`, `PROJECT_PLAN_WBS.csv`, `DAILY_LOG.md`) và đồng bộ `README.md`, `DECISIONS.md`.
