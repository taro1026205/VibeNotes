# Nhật ký Công việc Hàng ngày (Daily Standup Log & Commit Progress)

Dự án: **VibeNotes — Markdown & Google Keep Workspace**  
Chu kỳ phát triển: **Sprint 1 Tuần (Ngày 1 $\rightarrow$ Ngày 7)**  
Thư mục lưu trữ: **`/docs/DAILY_LOG.md`** (Đi kèm kế hoạch **[`PROJECT_PLAN_WBS.md`](./PROJECT_PLAN_WBS.md)** và **[`PROJECT_PLAN_WBS.csv`](./PROJECT_PLAN_WBS.csv)**)

---

## Ngày 1 — Khởi tạo Dự án, Chốt Phạm vi MVP & Thiết kế Giao diện Editorial
- **Hôm qua làm gì**: Khảo sát nhu cầu thực tế về công cụ ghi chú Markdown tốc độ cao kết hợp đồng bộ Google Keep.
- **Hôm nay làm gì**:
  - Chốt phạm vi MVP 1 tuần, xác định rõ các tính năng cốt lõi và các hạng mục Ngoài phạm vi (Out of Scope).
  - Thiết lập cấu trúc dự án React 19 + TypeScript + Tailwind CSS v4.
  - Xây dựng hệ thống giao diện **Editorial Workspace** (bố cục 2 khung, hỗ trợ chuyển đổi Light Mode `#f8f7f4` và Dark Mode `#121210`).
- **Vướng mắc & Giải pháp**:
  - *Vướng mắc*: Khi bật Dark Mode bằng class `.dark` trên thẻ `<html>`, các biến màu cần đồng bộ tức thì trên cả khung soạn thảo và khung xem trước.
  - *Giải pháp*: Sử dụng `@custom-variant dark` trong Tailwind CSS v4 kết hợp bộ biến CSS gốc (`--bg`, `--surface`, `--ink`, `--ink-faint`, `--ink-medium`).
- **Commit tiêu biểu**:
  - `feat(init): bootstrap VibeNotes workspace with Editorial light/dark theme and typography`

---

## Ngày 2 — Xây dựng Core CRUD Ghi chú, Lưu trữ `localStorage` & Hệ thống Lịch sử Phiên bản (`Restore previous version`)
- **Hôm qua làm gì**: Hoàn thành khung giao diện 2 cột, cấu hình phông chữ và chế độ Sáng/Tối.
- **Hôm nay làm gì**:
  - Cài đặt đầy đủ chức năng Thêm mới (`+ New Note`), Đọc, Sửa tiêu đề/nội dung, Ghim (`Pin`/`Pinned`) và Xoá ghi chú.
  - Kết nối tầng lưu trữ tự động vào `localStorage` (`vibenotes_workspace_notes_v1`).
  - Xây dựng hệ thống lưu trữ **ngăn xếp lịch sử phiên bản cục bộ (`vibenotes_version_history_v1`)** trong `localStorage` (`recordNoteVersionSnapshot`, `restorePreviousNoteVersion`, tối đa 10 bản ghi/ghi chú) và bổ sung nút **`Restore previous version`** trên thanh điều khiển trình soạn thảo.
  - Xây dựng hộp thoại xác nhận `ConfirmDialog` trước khi xoá ghi chú để tránh mất dữ liệu ngoài ý muốn.
- **Vướng mắc & Giải pháp**:
  - *Vướng mắc 1*: Không thể dùng `window.confirm` mặc định của trình duyệt vì ứng dụng chạy trong môi trường khung nhúng (iFrame) và thiếu tính thẩm mỹ.
  - *Giải pháp 1*: Tự xây dựng component `ConfirmDialog.tsx` hỗ trợ phím `Escape` và quản lý trạng thái đóng/mở bằng React state.
  - *Vướng mắc 2*: Nếu lưu vô hạn mọi phiên bản cũ của ghi chú vào `localStorage`, bộ nhớ trình duyệt có thể bị đầy.
  - *Giải pháp 2*: Giới hạn ngăn xếp ở mức `MAX_NOTE_VERSIONS = 10` bản ghi gần nhất cho mỗi ghi chú và tự động xoá lịch sử phiên bản khi ghi chú bị xoá.
- **Commit tiêu biểu**:
  - `feat(notes): implement full note CRUD, localStorage version history stack, and Restore previous version action`

---

## Ngày 3 — Hệ thống Filter Động, Di chuyển Ghi chú & Tìm kiếm Đa trường
- **Hôm qua làm gì**: Hoàn thiện CRUD ghi chú, tự động lưu `localStorage`, lịch sử phiên bản và hộp thoại xác nhận xoá.
- **Hôm nay làm gì**:
  - Xây dựng tính năng tạo Filter mới (`+ New Filter`) và lưu danh sách Filter vào `localStorage` (`vibenotes_custom_filters_v1`).
  - Cho phép xoá bất kỳ Filter nào ngoại trừ filter gốc `All` bằng nút `×`.
  - Hỗ trợ gắn/chuyển Filter cho ghi chú qua menu chọn `<select>` gọn nhẹ trên từng thẻ ghi chú hoặc kéo-thả (`Drag & Drop`).
  - Nâng cấp thanh tìm kiếm (`⌘K`) hỗ trợ tìm đồng thời theo **Tiêu đề / Nội dung / Tên Filter**.
- **Vướng mắc & Giải pháp**:
  - *Vướng mắc*: Khi người dùng xoá một Filter đang chứa ghi chú, các ghi chú đó có nguy cơ bị mồ côi (`tag` trỏ tới filter không còn tồn tại).
  - *Giải pháp*: Viết hàm `deleteFilterFromList` trong `notesLogic.ts` tự động gán lại các ghi chú bị ảnh hưởng sang filter đầu tiên còn lại (hoặc về `All` nếu xoá hết filter phụ).
- **Commit tiêu biểu**:
  - `feat(filters): add dynamic filter creation/deletion, drag-and-drop assignment, and title/content/filter search`

---

## Ngày 4 — Trình Soạn thảo Markdown: Floating Toolbar, Auto-complete, Undo/Redo & Bảng Phím tắt (`ShortcutsModal`)
- **Hôm qua làm gì**: Hoàn thành hệ thống quản lý Filter động và tìm kiếm đa trường.
- **Hôm nay làm gì**:
  - Tích hợp thư viện `marked` để kết xuất Markdown sang HTML.
  - Xây dựng **Floating Markdown Toolbar** phía trên khung soạn thảo (`H1`–`H3`, `Bold`, `Italic`, `List`, `Num`, `Task`, `Quote`, `Code`, `Link`).
  - Xây dựng bộ **Auto-completion** gợi ý cú pháp theo vị trí con trỏ khi gõ `/`, `#`, `-`, `1.`, `>`.
  - Bổ sung chức năng **Undo / Redo** thông qua cả nút bấm trên thanh công cụ lẫn phím tắt `Ctrl/⌘+Z` và `Ctrl+Y` / `⌘⇧Z`.
  - Xây dựng hộp thoại **Keyboard Shortcuts Cheat-Sheet (`ShortcutsModal.tsx`)** và hệ thống phím tắt toàn cục (`Cmd/Ctrl + N` tạo ghi chú, `Cmd/Ctrl + E` chuyển chế độ xem, `Cmd/Ctrl + P` ghim ghi chú, `Cmd/Ctrl + K` tìm kiếm, `Cmd/Ctrl + /` hoặc `?` mở bảng Cheat-Sheet).
- **Vướng mắc & Giải pháp**:
  - *Vướng mắc 1*: Khi chèn cú pháp Markdown bằng thanh công cụ vào `<textarea>` có điều khiển (controlled component), trình duyệt tự xoá lịch sử Undo mặc định.
  - *Giải pháp 1*: Tự cài đặt cấu trúc ngăn xếp `EditorHistoryState` (`past`, `present`, `future`) trong `notesLogic.ts` để lưu lịch sử nội dung và vị trí con trỏ cho từng ghi chú.
  - *Vướng mắc 2*: Tổ hợp `Cmd/Ctrl + P` mặc định của trình duyệt sẽ mở hộp thoại In trang (Print), và phím `?` nếu bấm khi đang gõ văn bản sẽ mở nhầm bảng phím tắt.
  - *Giải pháp 2*: Viết hàm `resolveGlobalShortcutAction` kiểm tra `isEditableTarget` và gọi `e.preventDefault()` khi khớp phím tắt toàn cục.
- **Commit tiêu biểu**:
  - `feat(editor): add floating markdown toolbar, cursor-aware autocomplete, and undo/redo history stack`
  - `feat(shortcuts): add Keyboard Shortcuts Cheat-Sheet info modal and global shortcuts (Cmd/Ctrl + N, E, P, K, /)`

---

## Ngày 5 — Đồng bộ Cuộn Hai chiều ở Chế độ Split & Xuất File PDF / Markdown
- **Hôm qua làm gì**: Hoàn thành trình soạn thảo Markdown với Floating Toolbar, Auto-complete, Undo/Redo và bảng Cheat-Sheet phím tắt.
- **Hôm nay làm gì**:
  - Xây dựng tính năng **Đồng bộ cuộn hai chiều (Bidirectional Scroll Sync)** ở chế độ `SPLIT`: cuộn khung Preview thì khung Edit tự cuộn theo và ngược lại.
  - Bổ sung tính năng **Export Markdown (`.md`)** và **Export PDF (`.pdf`)** khổ A4 nhiều trang.
- **Vướng mắc & Giải pháp**:
  - *Vướng mắc 1*: Khi đồng bộ `scrollTop` giữa 2 khung, sự kiện `onScroll` của khung đích bị kích hoạt ngược lại gây hiện tượng giật cục (feedback loop).
  - *Giải pháp 1*: Dùng biến khoá nguồn cuộn `activeScrollSourceRef` giải phóng sau `60ms` kết hợp hàm tỷ lệ `computeSyncedScrollTop`.
  - *Vướng mắc 2*: Xuất PDF tiếng Việt bằng font mặc định của `jsPDF` bị lỗi dấu và mất bố cục bảng biểu.
  - *Giải pháp 2*: Kết hợp `html2canvas` (`scale: 2`) và `jsPDF` trong `src/utils/pdfExport.ts` để giữ nguyên 100% tiếng Việt có dấu và định dạng Markdown.
- **Commit tiêu biểu**:
  - `feat(split-pdf): implement bidirectional split-view scroll sync and A4 Unicode PDF export`

---

## Ngày 6 — Tích hợp Đồng bộ Google Keep & Tối ưu Giao diện Mobile / Tablet kiểu Notion
- **Hôm qua làm gì**: Hoàn thành đồng bộ cuộn ở chế độ Split và tính năng xuất file `.PDF` / `.MD`.
- **Hôm nay làm gì**:
  - Tích hợp xác thực Firebase Google OAuth và kết nối Google Keep REST API (`keep.googleapis.com/v1/notes`) kèm tính năng **Import / Export Keep JSON Snapshot** trong `GoogleKeepDrawer`.
  - Tái cấu trúc giao diện đa thiết bị (Mobile `< 768px` & Tablet `768px–1023px`) lấy cảm hứng từ **Notion**:
    - Chuyển Sidebar thành ngăn kéo trượt (`Slide-over Drawer`) có nền mờ `backdrop-blur-xs` trên màn hình `< 1024px` và tự đóng khi chọn ghi chú.
    - Chuyển thanh công cụ định dạng Markdown và nút chuyển `edit | split | preview` thành 1 hàng vuốt ngang mượt (`overflow-x-auto no-scrollbar`).
    - Cải tiến chế độ `SPLIT`: chia `50/50` theo chiều dọc (`grid-rows-2`) trên điện thoại và `50/50` theo chiều ngang (`md:grid-cols-12`) trên máy tính bảng/máy tính, kết hợp `100dvh` và `.smooth-touch-scroll` (`-webkit-overflow-scrolling: touch`, `overscroll-behavior-y: contain`).
- **Vướng mắc & Giải pháp**:
  - *Vướng mắc 1*: Quyền `https://www.googleapis.com/auth/keep` chỉ mở mặc định cho tài khoản Google Workspace Enterprise.
  - *Giải pháp 1*: Thiết kế cơ chế **Hybrid Sync** kết hợp OAuth API và công cụ Import/Export JSON dự phòng.
  - *Vướng mắc 2*: Trên điện thoại, bố cục cũ để Sidebar chiếm chỗ và các nút công cụ tự xuống dòng gây hẹp vùng soạn thảo, cuộn thiếu độ mượt.
  - *Giải pháp 2*: Áp dụng ngăn kéo trượt `Slide-over Drawer`, thanh công cụ vuốt ngang 1 hàng, khung `100dvh` và class `.smooth-touch-scroll` tách biệt thanh cuộn cho từng khung.
- **Commit tiêu biểu**:
  - `feat(keep-sync): integrate Google Keep REST API with confirmation dialogs and JSON backup fallback`
  - `feat(responsive): redesign mobile & tablet layout with Notion-style slide-over drawer, single-row touch toolbar, and smooth 100dvh split scrolling`

---

## Ngày 7 — Kiểm thử Tự động (`/tests`) & Đóng gói Tài liệu Tiến độ (`/docs`)
- **Hôm qua làm gì**: Hoàn thiện ngăn kéo đồng bộ Google Keep và nâng cấp trải nghiệm Responsive trên Mobile/Tablet.
- **Hôm nay làm gì**:
  - Tổ chức thư mục `/tests` gồm 9 Unit Test Suites (`tests/unit/notesLogic.unit.test.ts`), 3 Integration Test Suites (`tests/integration/workspaceFlow.integration.test.ts`) và tài liệu 11 kịch bản kiểm thử thủ công (`tests/MANUAL_TEST_CASES.md`).
  - Đóng gói toàn bộ file ghi log và kế hoạch tiến độ vào thư mục riêng **`/docs`** (`docs/DAILY_LOG.md`, `docs/PROJECT_PLAN_WBS.md`, `docs/PROJECT_PLAN_WBS.csv`) và đồng bộ `README.md`, `DECISIONS.md` theo code mới nhất.
- **Vướng mắc & Giải pháp**:
  - *Vướng mắc*: Khi hiển thị 10 phím tắt trong `ShortcutsModal` theo 1 cột dọc trên Desktop, mục cuối cùng dễ bị khuất nhẹ ở mép dưới.
  - *Giải pháp*: Chuyển nội dung `ShortcutsModal` sang lưới 2 cột (`md:grid-cols-2`) trên màn hình Desktop để hiển thị trọn vẹn cả 10 phím tắt cùng lúc; toàn bộ 12/12 test suites trong `/tests` và `npm run build` đều đạt PASS 100%.
- **Commit tiêu biểu**:
  - `test(suite): add 12 unit/integration test suites in /tests and package project logs into /docs`
