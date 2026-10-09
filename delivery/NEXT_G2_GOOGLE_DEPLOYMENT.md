# Bước kế tiếp: G2_GOOGLE

## Mục tiêu

Tạo tài sản Google Sheets thật cho `GROUP-C-SALES-CORE@1.0.0-vi`, chạy Apps Script và ghi URL thật vào registry. Không sửa storefront trước khi bước này đạt.

## Đầu vào đã khóa

- Workbook: `releases/groups/C/base/1.0.0-vi/GROUP-C-SALES-CORE-1.0.0-vi.xlsx`
- Apps Script: `groups/c-crm-sales/base/apps-script/installer.gs`
- Asset registry: `registry/assets.json`

## Thao tác bắt buộc

1. Import workbook vào Google Drive thành Google Sheets.
2. Mở Extensions → Apps Script, thay nội dung bằng `installer.gs`.
3. Chạy `caiDatDemoBaoGiaDonHang()` trên một bản test.
4. Chạy `kiemTraHeThongBaoGiaDonHang()` và lưu kết quả.
5. Tạo một bản mới, chạy `caiDatSachBaoGiaDonHang()` để xác nhận chế độ bàn giao sạch.
6. Ghi `spreadsheet_id`, `template_url` và `copy_url` thật vào `registry/assets.json`.
7. Lưu ảnh BẮT_ĐẦU, DASHBOARD, BÁO_GIÁ, ĐƠN_HÀNG và kết quả kiểm tra vào `delivery/evidence/`.

## Tiêu chí PASS

- Locale `vi_VN`, múi giờ `Asia/Ho_Chi_Minh`.
- 15 sheet đúng tên, menu “Báo giá & Đơn hàng” xuất hiện.
- Dòng báo giá oracle bằng `194.400 ₫`.
- Đơn `DH-001`: tổng `800.000 ₫`, thực thu xác nhận `500.000 ₫`, công nợ `300.000 ₫`.
- Thanh toán chờ xác nhận không làm giảm công nợ.
- Giao 6 rồi 4 cho dòng đặt 10 cho kết quả đã giao 10, còn giao 0.
- Không có `#REF!`, `#VALUE!`, `#N/A` ngoài dữ liệu cố ý để trống.

## Prompt tiếp tục khi chuyển sang Codex/Gemini khác

```text
Bạn là Tech Lead thực thi G2_GOOGLE cho repo gsheet-product-factory-v2.
Đọc README.md, AGENTS.md, groups/c-crm-sales/base/template.json,
delivery/NEXT_G2_GOOGLE_DEPLOYMENT.md và release-manifest.json trước khi làm.
Chỉ triển khai asset GROUP-C-SALES-CORE@1.0.0-vi cho pilot GS-007.
Không tạo sản phẩm khác, không tạo URL giả và không sửa storefront.
Import workbook đã khóa vào Google Sheets, gắn installer.gs, chạy Demo/Clean,
kiểm chứng các oracle trong runbook, lưu evidence và chỉ nâng registry lên G2_GOOGLE
khi có Spreadsheet ID cùng URL thật. Nếu bị chặn quyền Google Drive, dừng và báo
đúng blocker; không thay bằng demo HTML hoặc link giả.
```
