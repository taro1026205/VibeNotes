# Quyết định Kiến trúc & Lựa chọn Công nghệ 

Tài liệu này trình bày ngắn gọn các quyết định lựa chọn công nghệ, kiến trúc dữ liệu và giải pháp UX/UI cho dự án **VibeNotes — Markdown & Google Keep Workspace**.

---

## 1. Kiến trúc Ứng dụng: React 19 + TypeScript + Vite (SPA)
- **Quyết định**: Xây dựng dưới dạng Single-Page Application (SPA) với **React 19**, **TypeScript**, và **Vite**.
- **Lý do**:
  - Tốc độ phản hồi tức thì khi chuyển đổi giữa các ghi chú, tìm kiếm thời gian thực (real-time search) và chuyển chế độ xem (`Edit` / `Split` / `Preview`) mà không phải tải lại trang.
  - TypeScript đảm bảo an toàn kiểu dữ liệu cho cấu trúc ghi chú (`NoteItem`), bộ lọc (`NoteTag`), và trạng thái đồng bộ Google Keep, giảm thiểu lỗi runtime khi phát triển nhanh.

## 2. Lưu trữ Dữ liệu Cục bộ: Browser `localStorage` (Local-First)
- **Quyết định**: Sử dụng **`localStorage`** làm tầng lưu trữ chính kết hợp cơ chế tự động lưu (auto-save) ngay trên mỗi thao tác gõ phím.
- **Lý do**:
  - **Không cần cài đặt database server phức tạp**, độ trễ lưu trữ bằng `0ms`, dữ liệu bền vững ngay cả khi làm mới trang (F5) hoặc mất kết nối mạng.
  - Rất phù hợp với phạm vi phát triển nhanh trong thời gian ngắn nhưng vẫn đảm bảo trải nghiệm mượt mà, khởi chạy lập tức.

## 3. Đồng bộ Đám mây: Google Keep REST API + Firebase Google OAuth
- **Quyết định**: Tích hợp trực tiếp **Google Keep API (`keep.googleapis.com/v1/notes`)** thông qua xác thực **Firebase Authentication (Google Sign-In popup)** phía client và bổ sung công cụ Import/Export JSON dự phòng.
- **Lý do**:
  - Cho phép người dùng liên kết tài khoản Google thực tế để xem, đẩy (push) ghi chú Markdown lên Google Keep hoặc xoá ghi chú đồng bộ.
  - Mọi thao tác làm thay đổi dữ liệu đám mây (Push / Delete) đều đi qua hộp thoại xác nhận rõ ràng (`ConfirmDialog`) để tránh mất dữ liệu ngoài ý muốn.
  - Bổ sung chế độ Import/Export JSON giúp người dùng tài khoản Gmail cá nhân vẫn sao lưu/khôi phục được dữ liệu ngay cả khi miền Workspace chưa bật quyền Enterprise Keep API.

## 4. Xử lý & Soạn thảo Markdown: `marked` + Custom Floating Toolbar & Auto-complete
- **Quyết định**: Kết hợp thư viện **`marked`** để render HTML với bộ công cụ tự xây dựng gồm **Floating Formatting Toolbar** và **Cursor-aware Markdown Auto-completion** ngay trên `<textarea>` gốc.
- **Lý do**:
  - **`marked`** cực kỳ nhẹ, tốc độ parse nhanh, hỗ trợ đầy đủ GitHub Flavored Markdown (bảng biểu, danh sách công việc `- [x]`, trích dẫn, code block).
  - Tự xây dựng thanh công cụ nổi (`H1`, `H2`, `H3`, `Bold`, `Italic`, `List`, `Task`, `Quote`, `Code`, `Link`) và bộ gợi ý cú pháp theo vị trí con trỏ (`/`, `#`, `-`, `1.`, `>`) trên `<textarea>` giúp kiểm soát chính xác vị trí con trỏ (`selectionStart`/`selectionEnd`), nhẹ hơn nhiều lần so với việc nhúng các bộ soạn thảo nặng như Monaco hay ProseMirror.

## 5. Tổ chức & Phân loại Ghi chú: Hệ thống Filter Động + Kéo thả (Drag & Drop)
- **Quyết định**: Lưu danh sách Filter tách biệt trong `localStorage` và cho phép tạo mới, xoá bất kỳ filter nào (trừ `All`), hoặc di chuyển ghi chú giữa các filter bằng menu chọn trực tiếp (`<select>`) lẫn kéo-thả HTML5 (`Drag & Drop`).
- **Lý do**:
  - Linh hoạt hơn hệ thống nhãn cố định: khi một filter bị xoá, các ghi chú thuộc filter đó được tự động chuyển về filter hợp lệ tiếp theo để không làm mồ côi dữ liệu.
  - Bỏ các nhãn chữ rườm rà trên thẻ ghi chú, chỉ giữ dropdown chọn filter gọn nhẹ giúp giao diện sạch sẽ, thao tác 1 chạm.

## 6. Thiết kế Giao diện (Design System): Tailwind CSS v4 + Editorial Typography
- **Quyết định**: Sử dụng **Tailwind CSS v4** kết hợp biến CSS (`--bg`, `--surface`, `--ink`, `--accent`) và bộ ba phông chữ **Cormorant Garamond** (tiêu đề), **DM Sans** (nội dung), **Space Mono** (nhãn kỹ thuật, bộ đếm từ & trình sửa Markdown).
- **Lý do**:
  - Tạo phong cách **Editorial Workspace** tối giản, sắc nét (lấy cảm hứng từ Notion & Apple Notes kết hợp báo chí hiện đại), có độ tương phản cao và hỗ trợ chuyển đổi tức thì giữa **Light Mode** (giấy ấm `#f8f7f4`) và **Dark Mode** (`#121210`).

## 7. Kiểm thử Logic Cốt lõi: Tách biệt Pure Functions (`notesLogic.ts`) + Node Test Runner
- **Quyết định**: Tách toàn bộ nghiệp vụ tìm kiếm, lọc, sắp xếp, tính toán thống kê từ/ký tự, chèn cú pháp Markdown và quản lý filter thành các hàm thuần túy (pure functions) trong `src/utils/notesLogic.ts` và kiểm thử bằng `node:test`.
- **Lý do**:
  - Dễ dàng chạy unit test tự động dưới 1 giây mà không phụ thuộc vào DOM phức tạp, đảm bảo mọi thao tác CRUD, auto-complete và quản lý filter hoạt động chính xác 100%.
