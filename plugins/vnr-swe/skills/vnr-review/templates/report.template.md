Đây là khuôn đầu ra của `CLI report`. Orchestrator dán stdout NGUYÊN VĂN trong một khối ``` — không chuyển sang bullet, không gộp finding,
không dịch/đổi từ (`vs`, `·`, `→`), không thêm cột. Chỉ được thêm đúng một dòng sau khối: `Gõ "sửa theo báo cáo" để tôi sửa các finding FAIL/WARN.`

## Khuôn (mục nào rỗng thì bỏ cả mục; thứ tự cố định)
```
Review  <repo> @ <nhánh>  (vs <baseline> · <N> file · <m>m<ss>s)
Luật: <aspect> v<ver> · <aspect> v<ver>        (plugin vnr-swe <version>)

KẾT LUẬN: <FAIL|WARN|PASS> — <a> FAIL · <b> WARN · <c> cảnh báo regex · <d> cần ngữ cảnh

FAIL                                  (rồi tới WARN, cùng khuôn; verifier hạ xuống thì thêm " (chưa chắc)")
  <MÃ>  <tên luật>
    <file>:<dòng>   `<trích ≤ 100 ký tự>`
    Vì: <why của checker, không có thì Lý do tồn tại của luật; ≤ 200 ký tự>
    → <gợi ý sửa>

Cảnh báo regex (<tổng>) — chưa kiểm sâu; /vnr-review --full để kiểm
  <MÃ>  <tên luật>  (<số lần>)
    Vì sao: <Lý do tồn tại của luật; ≤ 200 ký tự, một lần cho mỗi mã>
    <file>:<dòng>   `<trích ≤ 80 ký tự>`
    … và <k> dòng nữa

Cần ngữ cảnh (<n>)   <MÃ> <file> — <ghi chú>
Bỏ qua có lý do (<n>)   <MÃ> <file>:<dòng>  "<lý do>"
Marker không hợp lệ (<n>)   <MÃ> <file>:<dòng> — <lý do>
Chưa kiểm (<n>)   <MÃ> <file>      → chạy lại với --aspect hoặc tăng maxJobs
File bỏ qua (<n>)   <file> (<lý do>)

VERDICT:<FAIL|WARN|PASS>
```

## Ví dụ (đầu ra thật của `renderReport`)
```
Review  vnr.hrm.web @ feat/x  (vs origin/feat/x · 14 file · 2m50s)
Luật: arch-fe v1 · slop v2        (plugin vnr-swe 1.1.0)

KẾT LUẬN: FAIL — 1 FAIL · 2 WARN · 3 cảnh báo regex · 1 cần ngữ cảnh

FAIL
  SLOP-01  Dữ liệu mẫu không nối vào luồng chạy thật
    apps/x/seed.ts:349   `export const WF_MODULES = ['a']`
    Vì: Màn chạy trên dữ liệu mẫu trông như đã xong.
    → Thay nguồn tĩnh bằng adapter HTTP.

WARN
  ARCH-FE-04  Thay đổi lib lõi đi PR riêng (chưa chắc)
    libs/ui/x.ts:18   `x`
    Vì: Sửa lib lõi lẫn vào PR tính năng khó review.
    → Tách PR.
  FW-FE-12  Gọi API qua core service
    apps/x/p.ts:61   `this.http.get`
    Vì: Gọi thẳng HttpClient bỏ qua xử lý lỗi chung.
    → Dùng SupertoolApiClient.

Cảnh báo regex (3) — chưa kiểm sâu; /vnr-review --full để kiểm
  UIUX-28  Màu cứng  (2)
    Vì sao: Màu cứng làm vỡ giao diện tối và theme.
    apps/x/a.component.ts:41   `color: #000`
    apps/x/b.component.ts:9   `color: #fff`
  NAME-17  Tên file  (1)
    Vì sao: Tên không theo quy ước làm khó tìm file.
    libs/y/z.ts:12   `export class foo`

Cần ngữ cảnh (1)   SLOP-10 apps/x/e.ts — thiếu {be}/…/UserController.cs

VERDICT:FAIL
```
