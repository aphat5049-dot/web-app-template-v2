# Prompt tiếp tục trong Codex Desktop

Bạn là Tech Lead của dự án `gsheet-product-factory-v2`.

## Bối cảnh bắt buộc

- Đây là repo V2 mới. Repo `ggia38928-bot/google-sheet` và mọi repo cũ chỉ là tài liệu tham chiếu; không push hoặc sao chép thay đổi ngược vào repo legacy.
- Chuỗi kiến trúc bắt buộc: `catalog → group base → product → evidence → asset registry → storefront`.
- Pilot duy nhất hiện tại là `GS-007 — Quản lý Báo giá`, base `GROUP-C-SALES-CORE@1.0.0-vi`.
- Trạng thái hiện tại là `G2_GOOGLE_PARTIAL`, `publishable=false`.
- Google Sheet thật đã tồn tại với Spreadsheet ID `1iq5ufr1kXNrdrqI7avhDXk7Kl3dlEDSh7snOUYt5a7Q`.
- Kiểm thử local đã đạt 52/52; oracle dòng báo giá là `194.400 ₫`.
- Chưa có Apps Script project thật, Deployment ID hoặc URL `/exec`.

## Nhiệm vụ

1. Đọc đầy đủ `AGENTS.md`, `CODEX_DESKTOP_HANDOFF.md`, `delivery/PROJECT_STATUS_2026-10-07.md`, `delivery/NEXT_G2_GOOGLE_DEPLOYMENT.md`, `registry/assets.json` và toàn bộ tài liệu trong `groups/c-crm-sales/base/web-app/` trước khi sửa.
2. Kiểm tra Git status và branch. Làm việc trên `feat/gs-007-g2-webapp`; không sửa `main` trực tiếp.
3. Kiểm tra lại `npm test`; không báo pass nếu chưa chạy.
4. Triển khai Apps Script thật cho Spreadsheet đã khóa:
   - gắn `installer.gs`, `Code.gs`, `Index.html`, `appsscript.json`;
   - chạy installer Demo;
   - chạy `setupFirstWebAppTemplate()` và `healthCheckWebApp()`;
   - kiểm tra workflow báo giá, đơn hàng, thanh toán, giao hàng, phân quyền và audit.
5. Deploy Web App có version, yêu cầu người dùng đăng nhập; không cho phép anonymous.
6. Ghi Script ID, Deployment ID, URL `/exec`, template/copy URL thật và evidence vào registry.
7. Chỉ nâng lên `G2_GOOGLE_WEB_APP` khi toàn bộ runtime evidence đạt. Nếu thiếu quyền Google, dừng và báo đúng blocker; không tạo URL giả hoặc demo thay thế.

## Ràng buộc

- Không tạo thêm sản phẩm ngoài GS-007 trong giai đoạn này.
- Không tạo hàng loạt file rỗng.
- Không force-push, không xóa dữ liệu, không reset thay đổi người dùng.
- Không commit credential, token, cookie, OTP hoặc `.env`.
- Công thức giữ locale `vi_VN`; dữ liệu demo là dữ liệu mô phỏng tiếng Việt, không dùng PII thật.
- Sau mỗi thay đổi: test → review diff → lưu evidence → checkpoint → commit có phạm vi rõ ràng.

## Đầu ra bắt buộc

- Kết quả thực tế đã chạy.
- File đã thay đổi.
- Lệnh test và kết quả.
- URL/ID thật đã xác minh.
- Blocker còn lại nếu có.
- Commit hash và branch đã push; không tự merge `main`.
