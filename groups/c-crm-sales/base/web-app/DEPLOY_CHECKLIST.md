# Checklist deploy Web App đầu tiên

- [ ] Import workbook thành Google Sheets, không đổi tên sheet/header.
- [ ] Dán `Code.gs` và tạo HTML file tên `Index`.
- [ ] Cập nhật manifest `appsscript.json`.
- [ ] Chạy `setupFirstWebAppTemplate()` và cấp quyền.
- [ ] Chạy `healthCheckWebApp()` nhận `ok: true`.
- [ ] Thay email `.invalid` trong `NGƯỜI_DÙNG` bằng email Google thật của người kiểm thử.
- [ ] Deploy với `Execute as: User accessing the web app`.
- [ ] Không cho phép truy cập anonymous.
- [ ] Tạo báo giá oracle: 2 × 100.000, CK 10%, VAT 8% = 194.400 ₫.
- [ ] Kiểm tra nhân viên không xem được báo giá không thuộc quyền.
- [ ] Kiểm tra người tạo không tự duyệt.
- [ ] Chuyển báo giá chấp nhận thành đơn hai lần nhưng chỉ sinh một đơn.
- [ ] Lưu URL `/exec`, Deployment ID, Spreadsheet ID và ảnh evidence.
- [ ] Chỉ sau các bước trên mới cập nhật `web_app_url` và nâng gate lên G2.
