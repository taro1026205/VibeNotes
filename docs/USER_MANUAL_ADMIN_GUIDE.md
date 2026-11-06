# 3. Tài liệu Hướng dẫn Sử dụng & Quản trị Hệ thống (User Manual & Admin Guide)

Dự án: **VibeNotes — Không gian Ghi chú Kỹ thuật Markdown & Đồng bộ Google Keep**  
Đối tượng sử dụng: **Người dùng cuối (End Users) & Quản trị viên / Giảng viên đánh giá (Admins & Evaluators)**  
Vị trí lưu trữ: **`/docs/USER_MANUAL_ADMIN_GUIDE.md`**

> **Liên kết Hệ thống Tài liệu Dự án (4 Phần)**:
> 1. **Tổng quan Dự án & Kế hoạch Tiến độ**: [`/README.md`](../README.md) · [`/docs/PROJECT_PLAN_WBS.md`](./PROJECT_PLAN_WBS.md) · [`/docs/DAILY_LOG.md`](./DAILY_LOG.md)
> 2. **Tài liệu Kỹ thuật & Kiến trúc**: [`/docs/TECHNICAL_DOCUMENTATION.md`](./TECHNICAL_DOCUMENTATION.md) · [`/DECISIONS.md`](../DECISIONS.md)
> 3. **Tài liệu Hướng dẫn Sử dụng & Quản trị (File này)**: [`/docs/USER_MANUAL_ADMIN_GUIDE.md`](./USER_MANUAL_ADMIN_GUIDE.md)
> 4. **Tài liệu Kiểm thử & Đảm bảo Chất lượng**: [`/tests/MANUAL_TEST_CASES.md`](../tests/MANUAL_TEST_CASES.md)

---

# PHẦN I — THÔNG TIN TRUY CẬP, MẬT KHẨU & HƯỚNG DẪN SỬ DỤNG (CREDENTIALS & USER MANUAL)

## 0. Thông tin Truy cập & Mật khẩu (Credentials & Access Control)

Để thuận tiện cho Giảng viên chấm bài và người dùng kiểm thử, hệ thống đã cấu hình sẵn **2 tài khoản mẫu** hoạt động ngay lập tức trên mọi trình duyệt cùng cơ chế phân quyền cô lập dữ liệu theo từng tài khoản:

| Vai trò / Loại Tài khoản | Email Đăng nhập | Mật khẩu | Trạng thái Dữ liệu Khởi tạo | Mục đích Kiểm thử / Sử dụng |
| :--- | :--- | :--- | :--- | :--- |
| **1. Tài khoản Demo Chấm bài (Evaluator / Demo Account)** | `demo@vibenotes.io` | `demo1234` | **Có sẵn 4 ghi chú Markdown mẫu** (đầy đủ bảng biểu, checklist, code block, ghi chú đã ghim) | Giúp Giảng viên đăng nhập ở tab **`Sign In`** là có ngay dữ liệu phong phú để kiểm tra Tìm kiếm, Sắp xếp, Split Scroll Sync, Xuất PDF A4. |
| **2. Tài khoản Người dùng Mới (Fresh Student Account)** | `student@vibenotes.io` | `student1234` | **Trống hoàn toàn (`0` ghi chú — `No Notes Yet`)** | Kiểm tra trạng thái khởi tạo sạch (`All (0)`) của tài khoản mới và luồng tạo ghi chú đầu tiên. |
| **3. Tự Đăng ký Tài khoản Mới (`Sign Up — New User`)** | *Email bất kỳ do bạn tạo* | *Tối thiểu 4 ký tự* | **Trống hoàn toàn (`0` ghi chú — `[]`)** | Kiểm tra luồng đăng ký tài khoản mới, kiểm tra trùng email, đối chiếu mật khẩu và cô lập dữ liệu giữa các tài khoản. |
| **4. Truy cập Nhanh 1 Chạm (Google / Guest)** | Nhấn nút `Continue with Google Account` hoặc `Continue as Guest` | *Không cần mật khẩu* | **Trống hoàn toàn (`0` ghi chú — `[]`)** | Vào thẳng Workspace trong 1 giây không cần nhập biểu mẫu. |

### Cơ chế Kiểm soát Truy cập (Access Control Policy)
- **Cô lập dữ liệu theo từng tài khoản (`Per-Account Isolation`)**: Mỗi tài khoản đăng nhập sở hữu không gian lưu trữ riêng biệt (`vibenotes_account_notes_v2[email]`, `vibenotes_account_filters_v2[email]`, `vibenotes_account_version_history_v2[email]`). Ghi chú tạo ở tài khoản A sẽ không hiển thị ở tài khoản B.
- **Xác thực thông tin đăng nhập**: Kiểm tra định dạng email, độ dài mật khẩu tối thiểu (`>= 4` ký tự), kiểm tra khớp mật khẩu xác nhận khi `Sign Up`, chặn đăng ký trùng email đã tồn tại và kiểm tra đúng mật khẩu đã đăng ký khi `Sign In`.

---

## 1. Đăng ký Tài khoản Mới (`Sign Up`), Đăng nhập (`Sign In`) & Đăng xuất (`Sign Out`)

Khi mở ứng dụng lần đầu, màn hình xác thực phong cách Notion (**100% tiếng Anh**) sẽ xuất hiện:

1. **Đăng ký Tài khoản mới (`Sign Up — New User`)**:
   - Nhấp vào tab **`Sign Up (New User)`** ở phía trên khung đăng nhập (hoặc liên kết `Sign Up — New User` ở cuối biểu mẫu).
   - Nhập **Full Name** (tối thiểu 2 ký tự), **Work or Personal Email**, **Create Password** (tối thiểu 4 ký tự) và **Confirm Password**.
   - Nhấn **`Create VibeNotes Account`**:
     - Hệ thống tự động tạo không gian làm việc riêng biệt cho email của bạn với **`0` ghi chú (`No Notes Yet` / `All (0)`)** để bạn bắt đầu viết từ trang trắng.
2. **Đăng nhập Tài khoản đã có (`Sign In`)**:
   - Chọn tab **`Sign In`**, nhập **Email Address** và **Password** đã đăng ký rồi nhấn **`Sign In with Email`**.
   - Toàn bộ ghi chú, bộ lọc (Filters) và lịch sử phiên bản của riêng tài khoản đó sẽ được khôi phục tức thì.
3. **Đăng nhập nhanh qua Google hoặc Chế độ Khách (`Guest`)**:
   - Nhấn **`Continue with Google Account`** để vào nhanh bằng hồ sơ Google, hoặc nhấn **`Continue as Guest`** ở cuối biểu mẫu để trải nghiệm nhanh không cần tạo tài khoản.
4. **Xem Hồ sơ & Đăng xuất (`Sign Out` ở góc trái màn hình)**:
   - Sau khi đăng nhập, tên và chữ viết tắt (Avatar Initials) của bạn hiển thị tại **góc trên bên trái của Sidebar** và **góc dưới bên trái của thanh Footer**.
   - Nhấp vào tên của bạn ở một trong hai vị trí trên để mở menu tài khoản, sau đó nhấn nút **`Sign Out`** để kết thúc phiên làm việc và quay về màn hình đăng nhập.

---

## 2. Quản lý Ghi chú Cơ bản (Tạo mới, Chỉnh sửa, Ghim & Xoá)

1. **Tạo ghi chú mới**:
   - Nhấn nút **`+ New Note`** trên Sidebar (hoặc nút **`Create First Note`** khi danh sách đang trống), hoặc bấm tổ hợp phím **`Cmd + N`** (macOS) / **`Ctrl + N`** (Windows/Linux).
2. **Đặt tiêu đề & Soạn thảo nội dung**:
   - Nhấp vào ô **`Note Title...`** ở đầu trang để sửa tiêu đề.
   - Nhập nội dung Markdown ở khung soạn thảo bên dưới. Mọi thay đổi được lưu tức thì (`0ms`) vào bộ nhớ riêng của tài khoản trong trình duyệt.
3. **Ghim ghi chú quan trọng (`Pin` / `Pinned`)**:
   - Nhấn nút **`Pin`** trên thanh điều khiển phía trên trình soạn thảo, biểu tượng ghim trên thẻ ghi chú ở Sidebar, hoặc bấm **`Cmd/Ctrl + P`**.
4. **Xoá ghi chú an toàn**:
   - Nhấn nút **`Delete`** màu đỏ trên thanh điều khiển (hoặc biểu tượng thùng rác trên thẻ ghi chú).
   - Một hộp thoại xác nhận **`Delete Note?`** sẽ hiện ra để tránh xoá nhầm; nhấn **`Delete Note`** để xoá vĩnh viễn ghi chú cùng lịch sử phiên bản của nó.

---

## 3. Soạn thảo Markdown Tốc độ cao, Auto-complete & Undo/Redo

1. **Thanh công cụ định dạng nổi (`Floating Markdown Toolbar`)**:
   - Bôi đen đoạn văn bản cần định dạng (hoặc đặt con trỏ tại vị trí bất kỳ) và nhấn các nút trên thanh công cụ:
     - **Hoàn tác / Làm lại**: `Undo` (`Cmd/Ctrl + Z`), `Redo` (`Cmd + Shift + Z` / `Ctrl + Y`).
     - **Tiêu đề**: `H1` (`# `), `H2` (`## `), `H3` (`### `).
     - **Kiểu chữ**: `Bold` (`**chữ đậm**` — `Cmd/Ctrl + B`), `Italic` (`*chữ nghiêng*` — `Cmd/Ctrl + I`).
     - **Danh sách**: `List` (danh sách chấm tròn), `Num` (danh sách đánh số), `Task` (checklist `- [ ] `).
     - **Khối nội dung & Liên kết**: `Quote` (`> `), `Code` (`` `code` ``), `Link` (`[text](url)`).
2. **Gợi ý cú pháp thông minh (`Markdown Auto-Complete`)**:
   - Gõ dấu **`/`** (ví dụ: `/h1`, `/task`, `/table`, `/code`) hoặc gõ `#`, `-`, `1.`, `>` ở đầu dòng (hoặc nhấn nút **`Suggest (/)`** / `Cmd/Ctrl + Space`).
   - Dùng phím mũi tên `↑` / `↓` và nhấn `Enter` (hoặc `Tab`) để chèn nhanh bảng biểu, khối mã hoặc checklist.

---

## 4. Thông báo `'Saved'` (2 giây ngừng gõ) & Khôi phục Phiên bản cũ (`Restore previous version`)

1. **Thông báo xác nhận lưu `'Saved'` (`2-Second Debounce Toast`)**:
   - Khi bạn đang gõ liên tục, trình soạn thảo giữ giao diện hoàn toàn tĩnh để không gây xao nhãng.
   - Ngay khi bạn **ngừng gõ đủ 2 giây (`2000ms`)**, một nhãn thông báo **`✓ SAVED`** sẽ xuất hiện nhẹ nhàng ở **góc trên bên phải của khung soạn thảo** để xác nhận các thay đổi Markdown đã được lưu an toàn vào `localStorage`, sau đó tự động ẩn đi.
2. **Khôi phục phiên bản trước đó (`Restore previous version`)**:
   - Mỗi lần bạn chỉnh sửa nội dung hoặc tiêu đề, trạng thái trước đó của ghi chú được lưu vào ngăn xếp lịch sử phiên bản cục bộ (tối đa **10 phiên bản gần nhất** cho mỗi ghi chú, giữ nguyên kể cả sau khi nhấn `F5`).
   - Nhấn nút **`Restore previous version (N)`** trên thanh điều khiển phía trên trình soạn thảo để quay lại từng phiên bản trước đó.

---

## 5. Chế độ Xem (`Edit` / `Split` / `Preview`) & Đồng bộ Cuộn Hai chiều

- Nhấp vào cụm nút **`edit | split | preview`** ở góc phải thanh điều khiển (hoặc nhấn phím tắt **`Cmd/Ctrl + E`**) để chuyển đổi giữa 3 chế độ:
  1. **`edit`**: Tập trung 100% diện tích cho khung viết mã Markdown.
  2. **`split`**: Chia đôi màn hình vừa viết Markdown vừa xem kết quả trực tiếp (**Đồng bộ cuộn hai chiều**: cuộn khung bên nào thì khung bên kia tự động cuộn theo đúng tỷ lệ phần trăm).
  3. **`preview`**: Xem bản trình bày hoàn chỉnh như một bài báo Editorial.

---

## 6. Quản lý Filter Động, Sắp xếp Đa chế độ (`Sort By`) & Tìm kiếm Đa trường

1. **Tạo và xoá Filter**:
   - Nhấn **`+ New Filter`** trên Sidebar, nhập tên danh mục (ví dụ: `Sprint 15`) rồi nhấn **`Add`**.
   - Để xoá một filter bất kỳ (ngoại trừ `All`), nhấn nút **`×`** ngay bên cạnh tên filter đó. Các ghi chú thuộc filter bị xoá sẽ tự động chuyển về filter hợp lệ đầu tiên còn lại.
2. **Gắn Filter cho ghi chú**:
   - Chọn trực tiếp từ menu dropdown trên từng thẻ ghi chú ở Sidebar, trên thanh điều khiển của trình soạn thảo, hoặc **kéo-thả (Drag & Drop)** thẻ ghi chú thả vào nhãn Filter mong muốn.
3. **Sắp xếp danh sách ghi chú (`Sort By`)**:
   - Sử dụng menu **`Sort By`** trên Sidebar để sắp xếp ghi chú theo 1 trong 3 tiêu chí:
     - **`Pinned`**: Ưu tiên đưa các ghi chú đã ghim lên nhóm `Pinned` ở đầu danh sách, sau đó xếp theo thời gian cập nhật mới nhất.
     - **`Date Modified`**: Sắp xếp thuần túy theo thời점 chỉnh sửa gần nhất (`updatedAt`), bất kể trạng thái ghim.
     - **`Title`**: Sắp xếp theo bảng chữ cái `A–Z` của tiêu đề ghi chú (không phân biệt chữ hoa/thường, hỗ trợ so sánh số tự nhiên).
4. **Tìm kiếm tức thì (`Search — Cmd/Ctrl + K`)**:
   - Nhấn **`Cmd/Ctrl + K`** để đưa con trỏ vào ô tìm kiếm trên Sidebar. Hệ thống lọc thời gian thực trên cả 3 trường: **Tiêu đề**, **Nội dung Markdown** và **Tên Filter**.

---

## 7. Bảng Tra cứu Phím tắt (`ShortcutsModal`)

Nhấn nút **`Shortcuts`** trên thanh Header hoặc bấm **`Cmd/Ctrl + /`** (hoặc phím **`?`** khi không đứng trong ô nhập liệu) để mở bảng **Keyboard Shortcuts Cheat-Sheet**:

| Tổ hợp phím (Windows / Linux) | Tổ hợp phím (macOS) | Chức năng |
| :--- | :--- | :--- |
| `Ctrl + N` | `⌘ + N` | Tạo ghi chú Markdown mới |
| `Ctrl + E` | `⌘ + E` | Chuyển đổi vòng lặp chế độ xem `Edit → Split → Preview` |
| `Ctrl + P` | `⌘ + P` | Ghim hoặc bỏ ghim ghi chú đang mở |
| `Ctrl + K` | `⌘ + K` | Đưa con trỏ vào thanh tìm kiếm đa trường |
| `Ctrl + /` hoặc `?` | `⌘ + /` hoặc `?` | Mở / Đóng bảng tra cứu phím tắt |
| `Ctrl + Z` | `⌘ + Z` | Hoàn tác (Undo) trong trình soạn thảo |
| `Ctrl + Y` | `⌘ + Shift + Z` | Làm lại (Redo) trong trình soạn thảo |
| `Ctrl + B` | `⌘ + B` | Bọc in đậm (`**bold**`) đoạn văn bản đang chọn |
| `Ctrl + I` | `⌘ + I` | Bọc in nghiêng (`*italic*`) đoạn văn bản đang chọn |
| `Ctrl + Space` hoặc `/` | `⌘ + Space` hoặc `/` | Mở menu gợi ý cú pháp Markdown tại vị trí con trỏ |

---

## 8. Xuất File (`.PDF` / `.MD`) & Đồng bộ Google Keep

1. **Xuất file PDF khổ A4 (`Export PDF`)**:
   - Nhấn **`Export PDF`** trên thanh Header hoặc thanh điều khiển của trình soạn thảo. Hệ thống tự động kết xuất tài liệu sang khổ giấy A4 sắc nét, giữ nguyên 100% tiếng Việt có dấu, bảng biểu và khối mã.
2. **Xuất file Markdown gốc (`Export Markdown`)**:
   - Nhấn **`Export Markdown`** trên thanh Header để tải về file `.md` nguyên bản.
3. **Đồng bộ Google Keep & Sao lưu JSON (`Connect Google Keep`)**:
   - Nhấn nút **`Connect Google Keep`** ở góc phải trên cùng để mở ngăn kéo đồng bộ:
     - Hỗ trợ đăng nhập Google OAuth để tải danh sách ghi chú từ Google Keep REST API hoặc đẩy ghi chú hiện tại lên Google Keep.
     - Hỗ trợ **Export Keep JSON** và **Import Keep JSON** để sao lưu/di chuyển dữ liệu trên mọi tài khoản `@gmail.com` cá nhân.

---

---

# PHẦN II — HƯỚNG DẪN QUẢN TRỊ, VẬN HÀNH & TRIỂN KHAI (ADMIN & DEPLOYMENT GUIDE)

## 1. Yêu cầu Hệ thống & Cài đặt Môi trường (System Requirements)

- **Node.js**: Phiên bản `>= 18.x` (khuyến nghị `Node.js 20 LTS` hoặc `22 LTS`).
- **Trình quản lý gói**: `npm` (`>= 9.x`) hoặc `bun`.
- **Trình duyệt hỗ trợ**: Chrome, Edge, Firefox, Safari (Desktop & Mobile hỗ trợ ES2022 và `localStorage`).

```bash
# 1. Cài đặt toàn bộ gói phụ thuộc
npm install

# 2. Khởi chạy máy chủ phát triển (Mặc định tại http://localhost:3000)
npm run dev
```

---

## 2. Cấu hình Biến Môi trường & Dịch vụ Đám mây (`.env.example` & Firebase)

1. **File `.env.example`**:
   - Dự án hoạt động 100% ở chế độ Local-First ngay lập tức mà **không bắt buộc** phải cấu hình khoá API ngoài.
2. **Cấu hình Firebase & Google Keep OAuth (`firebase-applet-config.json`)**:
   - Khi cần kích hoạt tính năng đồng bộ trực tiếp với Google Keep REST API trên môi trường riêng, quản trị viên cập nhật thông tin Firebase Project (`apiKey`, `authDomain`, `projectId`, `appId`) trong `firebase-applet-config.json` và bật nhà cung cấp **Google Sign-In** trong Firebase Console.

---

## 3. Quản trị Lưu trữ Cục bộ & Khôi phục Dữ liệu (`localStorage` Administration)

Quản trị viên hoặc người dùng nâng cao có thể kiểm tra, sao lưu hoặc đặt lại trạng thái ứng dụng thông qua **Browser DevTools $\rightarrow$ Application $\rightarrow$ Local Storage**:

- **Đặt lại toàn bộ dữ liệu về trạng thái xuất xưởng (Factory Reset)**:
  ```javascript
  localStorage.clear();
  window.location.reload();
  ```
- **Kiểm tra dữ liệu ghi chú theo từng tài khoản**:
  ```javascript
  JSON.parse(localStorage.getItem('vibenotes_account_notes_v2') || '{}');
  ```
- **Giới hạn dung lượng**:
  - Tổng dung lượng `localStorage` trên mỗi tên miền (origin) khoảng `5 MB`. Hệ thống đã tự động giới hạn ngăn xếp lịch sử phiên bản ở mức `MAX_NOTE_VERSIONS = 10` bản ghi/ghi chú để ngăn ngừa lỗi `QuotaExceededError`.

---

## 4. Quy trình Kiểm thử Tự động & Kiểm tra Chất lượng (Testing & QA Pipeline)

Trước khi đóng gói hoặc triển khai phiên bản mới, quản trị viên chạy 3 lệnh kiểm tra chất lượng sau:

```bash
# 1. Chạy toàn bộ 16/16 bộ kiểm thử tự động (12 Unit Tests + 4 Integration Tests)
npm test

# 2. Kiểm tra kiểu dữ liệu TypeScript tĩnh (Zero Lint Errors)
npm run lint

# 3. Đóng gói bản dựng Production vào thư mục /dist
npm run build
```

---

## 5. Hướng dẫn Triển khai Miễn phí lên Môi trường Production (Deployment Guide)

Vì **VibeNotes** là ứng dụng SPA tĩnh biên dịch qua Vite (`dist/`), bạn có thể triển khai miễn phí trong chưa đầy 1 phút trên các nền tảng sau:

### Cách 1: Triển khai trên Vercel (Khuyến nghị — Nhanh nhất)
1. Đẩy mã nguồn lên GitHub repository hoặc dùng Vercel CLI:
   ```bash
   npx vercel --prod
   ```
2. Cấu hình tự động của Vercel cho Vite:
   - **Framework Preset**: `Vite`
   - **Build Command**: `npm run build`
   - **Output Directory**: `dist`

### Cách 2: Triển khai trên Netlify (Kéo-thả hoặc Git)
1. Chạy `npm run build` ở máy cục bộ để sinh thư mục **`dist/`**.
2. Truy cập [app.netlify.com/drop](https://app.netlify.com/drop) và kéo-thả trực tiếp thư mục `dist/` vào trình duyệt để nhận đường dẫn HTTPS ngay lập tức.

---

## 6. Xử lý Sự cố Thường gặp (Troubleshooting FAQ)

| Triệu chứng / Sự cố | Nguyên nhân | Cách khắc phục dành cho Admin / Người dùng |
| :--- | :--- | :--- |
| **Đăng nhập tài khoản nhưng không thấy ghi chú cũ** | Đăng nhập bằng một địa chỉ email khác với email đã tạo ghi chú, hoặc vừa nhấn `Sign Up (New User)`. | Kiểm tra đúng địa chỉ email đã dùng trước đó (vì hệ thống cô lập ghi chú riêng theo từng email trong `vibenotes_account_notes_v2`). |
| **Không thấy thông báo `'Saved'` khi đang gõ** | Tính năng sử dụng cơ chế **2-second debounce** (`2000ms`) để tránh nhấp nháy khi đang gõ nhanh. | Ngừng gõ trong đúng **2 giây**, thông báo `✓ SAVED` sẽ hiện lên ở góc trên bên phải khung soạn thảo. |
| **Lỗi `403 Forbidden` khi gọi Google Keep REST API** | Scope `https://www.googleapis.com/auth/keep` chỉ được Google cấp mặc định cho tài khoản Google Workspace Enterprise. | Sử dụng tính năng **Export / Import Keep JSON Snapshot** tích hợp sẵn ngay trong ngăn kéo `Google Keep` cho tài khoản `@gmail.com` cá nhân. |
