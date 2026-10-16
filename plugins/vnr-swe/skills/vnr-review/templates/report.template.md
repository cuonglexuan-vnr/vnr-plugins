Đây là khuôn đầu ra của `CLI report`. Orchestrator dán stdout NGUYÊN VĂN trong một khối ``` — không chuyển sang bullet, không gộp finding,
không dịch/đổi từ (`vs`, `·`, `→`), không thêm cột, không thêm bảng. Chỉ được thêm đúng một dòng sau khối: `Gõ "sửa theo báo cáo" để tôi sửa các finding FAIL/WARN.`

## Khuôn (mục nào rỗng thì bỏ cả mục; thứ tự cố định)
```
Tổng: <repo1> <FAIL|WARN|PASS> · <repo2> <…>          (chỉ khi review nhiều repo; sau đó là từng repo như dưới)

KẾT LUẬN: <FAIL|WARN|PASS> — <a> FAIL · <b> WARN · <c> nghi ngờ · <d> cần ngữ cảnh
Review  <repo> @ <nhánh>  (vs <baseline> · <N> file · <m>m<ss>s)
Luật: <aspect> v<ver> · <aspect> v<ver>        (plugin vnr-swe <version>)

FAIL                                  (rồi tới WARN, cùng khuôn)
  <MÃ>  <tên luật>  (<n> chỗ)         (nhóm theo mã luật: Vì và → in một lần cho cả nhóm)
    Vì: <why của checker, không có thì Lý do tồn tại của luật; ≤ 200 ký tự>
    → <gợi ý sửa>
    <file>:<dòng>   `<trích ≤ 100 ký tự>`
    <file>:<dòng>   `<trích>`  (chưa chắc)     (verifier hạ FAIL xuống WARN thì đánh dấu ở dòng vị trí)
      Vì: <lý do riêng>                        (chỉ khi lý do của vị trí này khác lý do chung của nhóm)

Nghi ngờ (<tổng>) — chưa kiểm sâu; /vnr-review --full để kiểm
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
KẾT LUẬN: FAIL — 3 FAIL · 1 WARN · 2 nghi ngờ · 1 cần ngữ cảnh
Review  vnr.hrm.web @ feat/x  (vs origin/feat/x · 14 file · 2m50s)
Luật: arch-fe v1 · name v1 · slop v2        (plugin vnr-swe 1.1.0)

FAIL
  NAME-20  Khoá i18n 4 cấp `{module}.{screen}.{function}.{element}` camelCase  (3 chỗ)
    Vì: Khoá lồng có lá snake_case và chuỗi đường dẫn sâu hơn 4 cấp camelCase, không thuộc Ngoại lệ hay allowlist.
    → Đặt khoá `{module}.{screen}.{function}.{element}` camelCase; chạy `npm run validate:i18n`.
    apps/supertool/public/assets/i18n/EN.json:6270   `"host_action_after_apply": "Verb run after apply",`
    apps/supertool/public/assets/i18n/EN.json:6271   `"host_action_after_apply_hint": "Only verbs in the catalogue…`
    apps/supertool/public/assets/i18n/VN.json:6270   `"host_action_after_apply": "Động từ chạy sau khi áp dụng",`

WARN
  ARCH-FE-04  Thay đổi lib lõi đi PR riêng  (1 chỗ)
    Vì: Sửa lib lõi lẫn vào PR tính năng khó review.
    → Tách PR.
    libs/ui/x.ts:18   `x`  (chưa chắc)

Nghi ngờ (2) — chưa kiểm sâu; /vnr-review --full để kiểm
  UIUX-28  Thao tác hàng loạt gửi theo khoá đã chọn  (1)
    Vì sao: Lưới phân trang server giữ lựa chọn qua các trang, nhưng chỉ có bản ghi của trang đã nạp.
    apps/supertool/src/app/core/verdi-widget/supertool-verdi-host-actions.ts:90   `runtime.execute(parsed.key, { selectedIds })`
  NAME-17  Interface FE của miền nghiệp vụ có tiền tố `I`  (1)
    Vì sao: FE quy định `IEmployee`; phân biệt interface với class cùng tên.
    apps/supertool/src/app/core/verdi-widget/supertool-verdi-widget.contract.ts:135   `export interface VerdiHostSaved {`

Cần ngữ cảnh (1)   SLOP-10 apps/x/e.ts — thiếu {be}/…/UserController.cs

VERDICT:FAIL
```
