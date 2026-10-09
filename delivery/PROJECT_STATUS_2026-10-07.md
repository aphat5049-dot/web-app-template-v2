# Trạng thái dự án ngày 07/10/2026

## Quyết định còn hiệu lực

- Repo cũ chỉ dùng tham chiếu; hệ thống mới đi theo V2.
- Chuỗi bắt buộc: catalog → group base → product → evidence → asset registry → storefront.
- Danh mục đã khóa 229 sản phẩm: 153 Google Sheets, 76 Web App.
- Không tạo hàng loạt file rỗng hoặc link giả.
- Mỗi sản phẩm chỉ được bán khi có asset thật, URL thật và evidence riêng.

## Đã hoàn thành

1. Danh mục chuẩn 229 sản phẩm.
2. Template gốc Nhóm C `GROUP-C-SALES-CORE@1.0.0-vi` cho pilot `GS-007`.
3. Workbook 15 sheet, 50 bản ghi mô phỏng, Dashboard và công thức tiếng Việt.
4. Apps Script installer Demo/Sạch, backup, workflow và kiểm tra hệ thống.
5. Web App đầu tiên:
   - `Code.gs`: backend, phân quyền, khóa ghi, workflow, audit.
   - `Index.html`: dashboard, tạo báo giá nhiều dòng, xem chi tiết và chuyển trạng thái.
   - `appsscript.json`: Apps Script V8, timezone Việt Nam, scope không gồm Google Drive/Gmail.
6. Kiểm thử local: 52/52 PASS.

## Đã hoàn thành trên Google Drive

1. Tạo cây thư mục `ChatGPT/GSheet Product Factory V2/C - CRM & Bán hàng/GS-007 - Quản lý Báo giá`.
2. Import workbook thành Google Sheets gốc, Spreadsheet ID `1iq5ufr1kXNrdrqI7avhDXk7Kl3dlEDSh7snOUYt5a7Q`.
3. Xác minh đủ 15 sheet, locale `vi_VN`, múi giờ Google chuẩn hóa `Asia/Saigon`.
4. Xác minh oracle `CHI_TIẾT_BÁO_GIÁ!N2 = 194.400 ₫`, KPI Dashboard và `DH-001` đúng.
5. Quét 15 sheet trong phạm vi `A1:Z100`: không có `#REF!`, `#VALUE!`, `#N/A`, `#DIV/0!`, `#NAME?`.
6. Tải nguồn `installer.gs`, `Code.gs`, `Index.html`, manifest, checklist và ZIP vào thư mục `02 - Apps Script Source`.
7. Cập nhật registry ở trạng thái `G2_GOOGLE_PARTIAL`, vẫn `publishable=false`.

## Pending để đạt G2_GOOGLE_WEB_APP

1. Tạo dự án Apps Script gắn với Spreadsheet thật.
2. Chạy installer và `setupFirstWebAppTemplate()`.
3. Chạy `healthCheckWebApp()` và test nghiệp vụ thật.
4. Deploy Web App với người dùng đăng nhập, không anonymous.
5. Ghi template/copy URL, Deployment ID và `/exec` URL vào registry.
6. Lưu evidence runtime rồi mới nâng lên `G2_GOOGLE_WEB_APP`.
7. Chỉ sau đó mới gắn nút Trải nghiệm/Tải xuống của GS-007 trên storefront.

## Blocker thực tế

Google Drive đã kết nối và Spreadsheet thật đã được tạo. Connector hiện không có API tạo dự án Apps Script hoặc triển khai Web App; phiên Cloud Browser chưa đăng nhập Google. Vì vậy chưa có Script ID, Deployment ID hay URL `/exec` thật. Trạng thái là `G2_GOOGLE_PARTIAL`, `publishable=false`.
