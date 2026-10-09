# Bàn giao sang Codex Desktop

Ngày chốt: 07/10/2026 (Asia/Bangkok)

## 1. Nguồn sự thật

- Dự án hiện hành là `gsheet-product-factory-v2`.
- Repo `ggia38928-bot/google-sheet` và các phiên bản cũ chỉ dùng để tham chiếu.
- Chuỗi triển khai bắt buộc: `catalog → group base → product → evidence → asset registry → storefront`.
- Không tạo hàng loạt sản phẩm trước khi template gốc của nhóm đạt G2 hoàn chỉnh.
- Không đánh dấu `LIVE`, `PRODUCTION`, `READY_FOR_SALE` hoặc `publishable=true` nếu chưa có URL thật và evidence runtime.

## 2. Trạng thái hiện tại

Pilot hiện tại: `GS-007 — Quản lý Báo giá`
Base: `GROUP-C-SALES-CORE@1.0.0-vi`
Gate: `G2_GOOGLE_PARTIAL`
Publishable: `false`

Đã hoàn thành:

1. Catalog 229 sản phẩm: 153 Google Sheets và 76 Web App.
2. Workbook tiếng Việt 15 sheet, 50 bản ghi mô phỏng.
3. Apps Script installer Demo/Sạch, backup, workflow và health check.
4. Web App gồm `Code.gs`, `Index.html`, `appsscript.json`.
5. Kiểm thử local: 52/52 PASS.
6. Google Sheet thật đã được tạo và kiểm tra:
   - Spreadsheet ID: `1iq5ufr1kXNrdrqI7avhDXk7Kl3dlEDSh7snOUYt5a7Q`
   - URL: https://docs.google.com/spreadsheets/d/1iq5ufr1kXNrdrqI7avhDXk7Kl3dlEDSh7snOUYt5a7Q/edit
   - 15 sheet, locale `vi_VN`, timezone Google chuẩn hóa `Asia/Saigon`.
   - Oracle `CHI_TIẾT_BÁO_GIÁ!N2 = 194.400 ₫`.
   - Không có lỗi công thức trong phạm vi kiểm tra `A1:Z100` trên 15 sheet.
7. Source Apps Script đã được tải lên Drive:
   - https://drive.google.com/drive/folders/16GHCyNRUyRPplJMynVU3v_xdIq-T8eja

Chưa hoàn thành:

1. Chưa tạo dự án Apps Script thật gắn với Spreadsheet.
2. Chưa chạy `caiDatDemoBaoGiaDonHang()` / `setupFirstWebAppTemplate()` trên Google.
3. Chưa chạy `kiemTraHeThongBaoGiaDonHang()` / `healthCheckWebApp()` trên Google.
4. Chưa deploy Web App và chưa có Deployment ID hoặc URL `/exec`.
5. Chưa tạo link `/copy` hoặc `/template/preview` để bán sản phẩm.
6. Chưa cập nhật storefront.

## 3. File phải đọc trước khi sửa

1. `AGENTS.md`
2. `README.md`
3. `delivery/PROJECT_STATUS_2026-10-07.md`
4. `delivery/NEXT_G2_GOOGLE_DEPLOYMENT.md`
5. `registry/assets.json`
6. `groups/c-crm-sales/base/template.json`
7. `groups/c-crm-sales/base/web-app/README.md`
8. `groups/c-crm-sales/base/web-app/DEPLOY_CHECKLIST.md`

## 4. Quy trình Git mới

Khuyến nghị tạo repo GitHub **private** tên `web-app-template-v2` cho đến khi xóa hoặc thay các URL Drive riêng tư.

```powershell
cd D:\WEB-APP-TEMPLATE-V2
git init -b main
git add .
git commit -m "chore: bootstrap V2 at G2 Google partial"
git remote add origin https://github.com/<GITHUB_USERNAME>/web-app-template-v2.git
git push -u origin main
git switch -c feat/gs-007-g2-webapp
git push -u origin feat/gs-007-g2-webapp
```

Không force-push. Không push vào repo legacy. Không commit token, cookie, mật khẩu, OTP hoặc file `.env`.

## 5. Cách mở trong Codex Desktop

1. Giải nén repo vào `D:\WEB-APP-TEMPLATE-V2`.
2. Trong project `Web App Template V2`, mở menu project → **Edit project**.
3. Chọn **Add folder** và trỏ đến `D:\WEB-APP-TEMPLATE-V2`.
4. Chọn thư mục đó làm **Make primary**.
5. Tạo chat mới trong project và dán nội dung `PROMPT_CONTINUE_GS007.md`.

Codex sẽ tự phát hiện `AGENTS.md` từ thư mục primary. Lịch sử chat không thay thế code và tài liệu đã commit; mọi quyết định bền vững phải nằm trong repo.

## 6. Điều kiện hoàn thành giai đoạn kế tiếp

- Apps Script project tồn tại thật và gắn đúng Spreadsheet ID.
- Installer Demo/Sạch chạy thành công.
- `healthCheckWebApp()` và các oracle nghiệp vụ chạy thật đạt.
- Web App deploy yêu cầu người dùng đăng nhập, không anonymous.
- Registry có Script ID, Deployment ID, `/exec` URL, template/copy URL và evidence.
- Chỉ khi đó mới nâng gate lên `G2_GOOGLE_WEB_APP` và cho phép storefront sử dụng link.
