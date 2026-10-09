# Quy tắc triển khai

- Luôn đi theo chuỗi: catalog → group base → product → evidence → asset registry → storefront.
- Không sinh hàng loạt sản phẩm khi template gốc của nhóm chưa đạt G2.
- Không khai báo `LIVE`, `PRODUCTION` hoặc `READY_FOR_SALE` nếu thiếu Spreadsheet ID và evidence chạy thật.
- Dữ liệu demo phải là dữ liệu mô phỏng tiếng Việt, không dùng PII thật.
- Công thức Google Sheets dùng locale `vi_VN`; mã Apps Script phải chống formula injection và kiểm tra tham chiếu.
- Mỗi thay đổi nghiệp vụ phải có test; mỗi bản phát hành phải có manifest và checksum.
