---
name: "vnr-mobile-auto-test"
description: >-
  Sinh và chạy auto tests cho Flutter app theo 3 cấp độ: Unit → Widget → Integration.
  Dùng feature spec + source code để generate test files, sau đó chạy và báo cáo kết quả.
argument-hint: "<feature-id> [--level=unit|widget|integration|all] [--run] [--gen-only]"
compatibility: "Requires specs/<feature-id>/ and src/app-mobile/"
user-invocable: true
---

## User Input

```text
$ARGUMENTS
```

Parse `$ARGUMENTS`:

- `<feature-id>` (bắt buộc) — ví dụ: `001-submit-approval-form`
- `--level=<level>` (mặc định: `all`) — `unit`, `widget`, `integration`, `all`
- `--run` (tuỳ chọn) — chạy tests ngay sau khi generate
- `--gen-only` (tuỳ chọn) — chỉ generate, không chạy

---

## Hiểu kiến trúc App trước khi làm bất cứ điều gì

### Flavor System (4 flavors)

App chạy theo **2 lớp kiểm soát** để bật/tắt module:

```
Lớp 1 — Flavor (runtime):     local | dev | pilot | prod
Lớp 2 — Dart Define (compile): --dart-define=ENABLE_EVA=true
                                --dart-define=ENABLE_ATT=true
                                --dart-define=ENABLE_HRE=true
                                --dart-define=ENABLE_PROCESS=true

Module chỉ ACTIVE khi: isModuleEnabledInFlavor(name) AND isModuleEnabledByBuildConfig(name)
```

| Flavor  | Modules trong flavor                                | Entry point           |
| ------- | --------------------------------------------------- | --------------------- |
| `local` | dashboard, ai_assistant, att, **eva**, process      | `lib/main_local.dart` |
| `dev`   | dashboard, ai_assistant, att, **eva**, process      | `lib/main_dev.dart`   |
| `pilot` | dashboard, ai_assistant, att, **eva**, process      | `lib/main_pilot.dart` |
| `prod`  | dashboard, ai_assistant, att, **eva**, process, hre | `lib/main_prod.dart`  |

> **Hiện tại**: Chỉ module `eva` được hoạt động thực tế. Các module khác (att, process, hre) là stub/test.

### Module System (GetX + ModuleRegistry)

```
AppInitializer.initialize()
  └── ModuleInitializer.initialize()
        ├── _registerModuleFactories(registry)  ← lazy factory cho mỗi module
        ├── FlavorConfig.getEnabledModulesForFlavor()
        │     └── for each moduleName:
        │           if FlavorConfig.isModuleEnabled(name) → registry.enableModule(name)
        └── manager.loadConfiguredModules()
              └── module.initialize()  ← EVA: Get.put(EvaConfigLoader())
                    └── routes + bindings available via GetMaterialApp.getPages
```

### GetX Binding per Module (EVA example)

```dart
// EvaGoalsFormBindings.dependencies():
Get.lazyPut<EvaGoalFormAction>(() => EvaGoalFormActionImpl());
Get.lazyPut(() => GetGoalPeriods(Get.find()));
Get.lazyPut(() => SaveGoalForm(Get.find()));
Get.lazyPut<EvaGoalsFormController>(() => EvaGoalsFormController());
```

Bindings chỉ chạy khi navigate tới route đó — **không phải lúc app start**.

### Cấu trúc file test

```
src/app-mobile/
├── test/
│   ├── unit/<feature-id>/          ← Level 1: Pure Dart
│   └── widget/<feature-id>/        ← Level 2: WidgetTester
└── integration_test/<feature-id>/  ← Level 3: Device/Emulator
```

---

## Kiến trúc 3 cấp độ test

```
Level 0 — COMPLIANCE CHECK (bắt buộc nếu có widget mới)
  Static scan: kiểm tra widget/view/modal mới có tuân thủ 01-vnr-app-ui-standards.md
  Không cần build, không cần device — đọc source code
  Output: PASS / VIOLATION (block) / WARNING (non-block)
  Thời gian: ~2-5s

Level 1 — UNIT (bắt buộc)
  Logic thuần: validation, state machine, data mapping
  Không cần device, không cần GetX DI, không cần HTTP
  Thời gian: ~0.1s/test
  Run: flutter test test/unit/<feature-id>/

Level 2 — WIDGET (tùy chọn — chỉ khi feature có widget mới)
  UI components: button visibility, modal, form input, counter
  Không cần device, dùng WidgetTester + fake bindings
  Chỉ chạy sau khi Level 0 PASS hoặc chỉ có WARNING
  Thời gian: ~1-2s/test
  Run: flutter test test/widget/<feature-id>/

Level 3 — INTEGRATION (tùy chọn — cần device + cần Key trên widget)
  End-to-end flow: tap button → API → UI update → assert
  CẦN: emulator/device, flavor, module enable flags, Key trên widget thật
  Thời gian: ~10-30s/test
  Run: flutter test integration_test/<feature-id>/ --flavor <f> --dart-define=...
```

---

## Bước 1: Đọc Context

1. Đọc `specs/<feature-id>/spec.md` → user stories, acceptance criteria
2. Đọc `specs/<feature-id>/tasks.md` → task list, có widget mới không?
3. Đọc `specs/<feature-id>/test-cases.md` → manual test cases (nếu có)
4. Scan source code:
   - Controller: `src/app-mobile/lib/modules/**/controller/*controller.dart`
   - Widgets mới: `src/app-mobile/lib/modules/**/widgets/**/*.dart`
   - Use cases: `src/app-mobile/lib/modules/**/domain/usecases/*.dart`
   - Repository: `src/app-mobile/lib/modules/**/data/repositories/*impl.dart`
5. Kiểm tra test hiện có: `src/app-mobile/test/`, `src/app-mobile/integration_test/`

**Quyết định level cần generate:**

- Unit: **luôn luôn**
- Widget: chỉ khi tasks.md có task tạo widget mới (StatefulWidget/StatelessWidget)
- Integration: chỉ khi có yêu cầu E2E flow test

---

## Bước 2: Generate Unit Test (bắt buộc)

File: `test/unit/<feature-id>/<feature>_unit_test.dart`

### Template

```dart
// ignore_for_file: library_doc_comment
library;

/// Unit Test — Feature <feature-id>: <Feature Name>
///
/// Coverage:
///   TC-U-001 <description>
///
/// Strategy: Pure-Dart. No HTTP, no GetX DI, no emulator.
/// Run: flutter test test/unit/<feature-id>/

import 'package:flutter_test/flutter_test.dart';
import 'package:domain/model/response/response_api.dart';

// ─── Fake dependencies (NO mockito) ──────────────────────────────────────────

class _Fake<ClassName> {
  <ReturnType> result = <default>;
  int callCount = 0;
  <ArgType>? lastArg;

  Future<<ReturnType>> <methodName>(<ArgType> arg) async {
    callCount++;
    lastArg = arg;
    return result;
  }

  void reset() { callCount = 0; lastArg = null; }
}

// ─── Extracted testable logic (mirrors controller, no GetX) ──────────────────

class _<Feature>Logic {
  final _Fake<Dep> dep;
  // Side effects become list.add() for assertion:
  final List<String> errorDialogs = [];
  final List<String> errorSnackbars = [];
  final List<String> successSnackbars = [];
  final List<String> warningToasts = [];
  bool refreshCalled = false;
  bool isSubmitting = false;

  _<Feature>Logic({required this.dep});

  // Mirror controller public methods exactly
  Future<void> onSomeAction() async { ... }

  void reset() { /* clear all lists */ }
}

// ─── Tests ────────────────────────────────────────────────────────────────────

void main() {
  late _Fake<Dep> fakeDep;
  late _<Feature>Logic logic;

  setUp(() {
    fakeDep = _Fake<Dep>();
    logic = _<Feature>Logic(dep: fakeDep);
  });

  tearDown(() { fakeDep.reset(); logic.reset(); });

  group('Happy Path', () {
    test('TC-U-001: ...', () async { ... });
  });

  group('Validation Errors', () {
    test('TC-U-002: ...', () async { ... });
  });

  group('State Management', () {
    test('TC-U-003: ...', () { ... });
  });
}
```

### Conventions bắt buộc

- TC ID: `TC-U-<NNN>`
- Group theo concern: Happy Path, Validation Errors, Submit Errors, State Management, Button Visibility, API Payload
- Mỗi `expect()` có `reason:` để dễ debug
- `setUp` + `tearDown` để isolate state
- Coverage target: ≥80% public methods
- **KHÔNG dùng mockito** — dùng `_Fake*` class inline

---

## Bước 2.5: VNR Standards Compliance Check (bắt buộc nếu có widget mới)

**Chạy trước Widget Test.** Scan toàn bộ file widget/view/modal mới được tạo trong feature, kiểm tra vi phạm chuẩn `01-vnr-app-ui-standards.md`. Đây là **static analysis** — đọc source code, không cần build app.

### 2.5.1 Xác định files cần scan

Từ `tasks.md`, lấy tất cả file paths thuộc layer View/Widget/Modal:
- `**/view/*.dart`
- `**/widgets/*.dart`
- `**/pages/**/*.dart`

Đọc từng file đã tạo trong feature. **Không scan** domain/, data/, usecases/.

### 2.5.2 Checklist vi phạm cần kiểm tra

Với mỗi file, scan theo 8 nhóm sau:

#### ❌ GROUP 1 — Banned Widgets (dùng Flutter standard thay VNR)

| Pattern tìm kiếm | Vi phạm | Thay bằng |
|---|---|---|
| `AlertDialog(` | ❌ Banned | `VnRConfirmDialog` hoặc `Get.bottomSheet + VnRTopModal` |
| `showDialog(` | ❌ Banned | `Get.dialog(VnRConfirmDialog(...))` |
| `ElevatedButton(` | ❌ Banned | `VnRButton(type: ButtonType.primary, ...)` |
| `TextButton(` | ❌ Banned | `VnRButton(type: ButtonType.text, ...)` |
| `OutlinedButton(` | ❌ Banned | `VnRButton(type: ButtonType.outline, ...)` |
| `TextField(` | ❌ Banned | `VnRInputText(controller: ...)` |
| `TextFormField(` | ❌ Banned | `VnRInputText(controller: ...)` |
| `SnackBar(` | ❌ Banned | `VnRSnackbar.show*()` |
| `ScaffoldMessenger` | ❌ Banned | `VnRSnackbar.show*()` |
| `showModalBottomSheet(` | ❌ Banned | `Get.bottomSheet(VnRTopModal(...))` |
| `showBottomSheet(` | ❌ Banned | `Get.bottomSheet(VnRTopModal(...))` |
| `FloatingActionButton(` | ❌ Banned | `VnRFloatingButton(...)` |
| `Checkbox(` | ❌ Banned | `VnRCheckbox(...)` |
| `Switch(` | ❌ Banned | `VnRSwitch(...)` |
| `Radio(` | ❌ Banned | `VnRRadio(...)` |

#### ❌ GROUP 2 — Banned Colors

| Pattern tìm kiếm | Vi phạm | Thay bằng |
|---|---|---|
| `Colors\.grey` | ❌ Hardcoded | `context.borderColor` / `context.textSecondary` |
| `Colors\.white` (trong widget content) | ❌ Hardcoded | `context.white` |
| `Colors\.black` | ❌ Hardcoded | `context.black` |
| `Colors\.red` | ❌ Hardcoded | `context.red` |
| `Colors\.blue` | ❌ Hardcoded | `context.blue` |
| `Colors\.green` | ❌ Hardcoded | `context.green` |
| `Color(0x` | ❌ Hex hardcode | `AppColor.*` hoặc `context.*` |
| `Color(0xFF` | ❌ Hex hardcode | `AppColor.*` hoặc `context.*` |
| `\.withOpacity(` | ❌ Deprecated | `.withValues(alpha: ...)` |

> **Exception được phép**: `Colors.white` CHỈ trong `backgroundColor:` của `Get.bottomSheet(...)` hoặc `Get.dialog(...)` — không phải trong widget content.

#### ❌ GROUP 3 — Banned Spacing/Radius

| Pattern tìm kiếm | Vi phạm | Thay bằng |
|---|---|---|
| `EdgeInsets\.all\([0-9]` | ❌ Hardcoded | `EdgeInsets.all(AppSpacing.*)` |
| `EdgeInsets\.symmetric\(.*[0-9]` | ❌ Hardcoded | `EdgeInsets.symmetric(AppSpacing.*)` |
| `SizedBox\(height: [0-9]` | ❌ Hardcoded | `SizedBox(height: AppSpacing.*)` |
| `SizedBox\(width: [0-9]` | ❌ Hardcoded | `SizedBox(width: AppSpacing.*)` |
| `BorderRadius\.circular\([0-9]` | ❌ Hardcoded | `BorderRadius.circular(AppRadius.*)` |
| `Padding\(.*EdgeInsets.*[0-9]` | ❌ Hardcoded | Dùng `AppSpacing.*` |

#### ❌ GROUP 4 — Banned Typography

| Pattern tìm kiếm | Vi phạm | Thay bằng |
|---|---|---|
| `TextStyle\(fontSize:` | ❌ Hardcoded | `context.body14Regular` / `context.h1` / ... |
| `TextStyle\(color: Colors` | ❌ Hardcoded | `context.textColor` |
| `fontWeight: FontWeight\.` (trực tiếp trong widget) | ❌ Hardcoded | Dùng `context.*` text styles |

#### ❌ GROUP 5 — Banned Bottom Sheet Structure

Khi file có `Get.bottomSheet(`, kiểm tra **bắt buộc** phải có:
- `VnRTopModal` — nếu không có → **VIOLATION**
- `isScrollControlled: true` — nếu không có → **WARNING**

#### ✅ GROUP 6 — VNR Widget Required (kiểm tra theo loại màn hình)

Nếu file là form page (có `Form(` hoặc nhiều input):
- Phải có ít nhất 1 `VnRInputText` / `VnRInputNumber` / `VnRTextArea` / `VnRDropdown` / `VnRDatePicker`
- Nếu chỉ thấy `TextField`/`TextFormField` → flag violation

Nếu file là list page (tên chứa `_list_`, `_view_all`, `vnr_list`):
- Phải có `VnRListView` / `VnRApiListView` — nếu dùng `ListView.builder` trực tiếp → **WARNING**

#### ✅ GROUP 7 — Context Theme Extensions (kiểm tra positive)

Kiểm tra file CÓ dùng ít nhất 1 trong:
- `context.white`, `context.black`, `context.textColor`, `context.bgLevel1`, v.v.
- `AppSpacing.*`, `AppRadius.*`

Nếu không có bất kỳ context extension nào → **WARNING: có thể đang dùng hardcoded values**

#### ✅ GROUP 8 — Translation Keys

Các string literal dài (>3 ký tự, chứa chữ) không kết thúc bằng `.tr` → **WARNING: có thể thiếu i18n**

Ví dụ:
```dart
Text('Lưu lại')          // ❌ → Text('eva.save'.tr)
Text('save'.tr)          // ✅ OK
Text('S')                // ✅ OK — quá ngắn
const Key('btn_save')    // ✅ OK — Key không cần .tr
```

### 2.5.3 Output: Compliance Report

Sau khi scan xong, xuất báo cáo:

```
╔══════════════════════════════════════════════════════════════════════╗
║       VNR STANDARDS COMPLIANCE CHECK                                 ║
║       Feature: <feature-id>                                          ║
╠══════════════════════════════════════════════════════════════════════╣
║  Files scanned: N                                                    ║
╠═══════════════╦══════════════╦═════════════════════════════════════╣
║  Severity     ║  Count       ║  Status                              ║
╠═══════════════╬══════════════╬══════════════════════════════════════╣
║  ❌ VIOLATION ║  X           ║  FAIL — phải fix trước khi merge    ║
║  ⚠️  WARNING  ║  Y           ║  WARN — nên fix, không block merge   ║
║  ✅ PASS      ║  Z files     ║  Clean                               ║
╚═══════════════╩══════════════╩══════════════════════════════════════╝

❌ VIOLATIONS (phải fix):

  [V001] lib/modules/eva/pages/.../view/some_form.dart:42
    ElevatedButton( → dùng VnRButton(type: ButtonType.primary, ...)

  [V002] lib/modules/eva/pages/.../widgets/some_modal.dart:18
    Get.bottomSheet( không có VnRTopModal → bắt buộc dùng VnRTopModal làm header

  [V003] lib/modules/eva/pages/.../view/some_view.dart:67
    Color(0xFF333333) → dùng context.textColor hoặc AppColor.*

⚠️  WARNINGS (nên fix):

  [W001] lib/modules/eva/pages/.../view/some_list.dart:33
    Text('Danh sách') không có .tr → kiểm tra có cần i18n không

  [W002] lib/modules/eva/pages/.../view/some_form.dart:88
    isScrollControlled: true thiếu trong Get.bottomSheet

╔══════════════════════════════════════════════════════════════════════╗
║  Kết quả: ❌ FAIL — X violations cần fix trước khi chạy Widget Test  ║
╚══════════════════════════════════════════════════════════════════════╝
```

### 2.5.4 Xử lý kết quả

- **Có VIOLATION**: **DỪNG** — không chuyển sang Widget Test. Liệt kê từng violation với line number + cách sửa. Hỏi user: `"Fix tự động? (yes / no / show diff)"`.
  - Nếu `yes`: tự edit file, fix từng violation, chạy lại scan, tiếp tục.
  - Nếu `no`: dừng, báo user phải fix thủ công rồi chạy lại.
- **Chỉ có WARNING**: tiếp tục sang Widget Test, liệt kê warnings cuối report.
- **PASS hoàn toàn**: tiếp tục sang Widget Test, hiển thị `✅ All files comply with VNR standards`.

---

## Bước 3: Generate Widget Test (tùy chọn)

**Chỉ generate khi**: tasks.md có task tạo `StatefulWidget` hoặc `StatelessWidget` mới.  
**Chỉ chạy sau khi** Bước 2.5 Compliance Check kết quả PASS hoặc chỉ có WARNING.

File: `test/widget/<feature-id>/<widget>_widget_test.dart`

### Template

```dart
// ignore_for_file: library_doc_comment
library;

/// Widget Test — Feature <feature-id>
///
/// Coverage:
///   TC-W-001 <widget> renders correctly
///
/// Strategy: WidgetTester, no device, no real HTTP.
/// Run: flutter test test/widget/<feature-id>/

import 'package:flutter/material.dart';
import 'package:flutter_test/flutter_test.dart';

/// Stub widget nếu import thật gặp theme/GetX dependency issues
/// Khi dependency resolved → thay bằng import thật
class _StubWidget extends StatefulWidget { ... }

Widget _buildTestApp({required Widget child}) =>
    MaterialApp(home: Scaffold(body: child));

void main() {
  group('<WidgetName>', () {
    testWidgets('TC-W-001: renders correctly', (tester) async {
      await tester.pumpWidget(_buildTestApp(child: _StubWidget(...)));
      await tester.pump();
      expect(find.byKey(const Key('...')), findsOneWidget,
          reason: '...');
    });
  });
}
```

### Conventions

- TC ID: `TC-W-<NNN>`
- Dùng `Key(...)` để find widget — không dùng `find.text` cho dynamic content
- Stub widget nếu import thật có quá nhiều transitive deps (GetX, theme)
- **KHÔNG** dùng real GetX binding trong widget test

---

## Bước 4: Generate Integration Test + Xin quyền gắn Key

File: `integration_test/<feature-id>/<feature>_integration_test.dart`

### 4.1 Generate stubs trước

```dart
// ignore_for_file: library_doc_comment
library;

/// Integration Test — Feature <feature-id>
///
/// Prerequisites:
///   - Emulator/device running
///   - Flavor + dart-define configured (xem Bước 5)
///   - Key constants đã được gắn vào widget thật (xem danh sách bên dưới)
///
/// Key cần gắn vào widget thật:
///   Key('<key-name>') — <widget description> — file: <source file path>
///
/// Run: (xem output của skill sau khi user chọn flavor/module)

import 'package:flutter_test/flutter_test.dart';
import 'package:integration_test/integration_test.dart';
// import 'package:vnr_super_hrm/main_<flavor>.dart' as app;

void main() {
  IntegrationTestWidgetsFlutterBinding.ensureInitialized();

  group('<Flow Name>', () {
    testWidgets('TC-I-001: <description>', (tester) async {
      // STEP 1: app.main();
      // STEP 2: await tester.pumpAndSettle(const Duration(seconds: 3));
      // STEP 3: Navigate...
      // STEP 4: tap(find.byKey(const Key('...')));
      // STEP 5: expect(...)

      // STUB — uncomment khi đã wire app.main() và gắn Keys
      expect(true, isTrue, reason: 'TC-I-001 stub');
    }, timeout: const Timeout(Duration(minutes: 2)));
  });
}
```

### 4.2 Xin quyền gắn Key vào widget thật

Sau khi generate integration test, skill **PHẢI** xuất bảng sau và xin phép user:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  🔑 CẦN GẮN KEY VÀO WIDGET — Integration Test sẽ không chạy nếu thiếu     ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Feature: <feature-id>                                                       ║
╠══════════════════╦═══════════════════════════╦══════════════════════════════╣
║  Key constant    ║  Widget / Mục đích        ║  File cần sửa                ║
╠══════════════════╬═══════════════════════════╬══════════════════════════════╣
║  '<key-1>'       ║  <mô tả>                  ║  lib/modules/.../view.dart   ║
║  '<key-2>'       ║  <mô tả>                  ║  lib/modules/.../modal.dart  ║
║  ...             ║  ...                      ║  ...                         ║
╚══════════════════╩═══════════════════════════╩══════════════════════════════╝

Skill sẽ tự động thêm Key vào các widget trên.
Bạn có muốn tiếp tục không? (yes / no / show diff trước)
```

- Nếu user **yes**: skill tự edit từng file, thêm `key: const Key('...')` vào đúng widget
- Nếu user **show diff trước**: show từng edit dưới dạng diff, sau đó hỏi lại
- Nếu user **no**: ghi chú trong integration test file, bỏ qua bước này

**Cách thêm Key vào widget** (ví dụ):

```dart
// TRƯỚC
ElevatedButton(
  onPressed: controller.onSubmitForApproval,
  child: Text('Gửi phê duyệt'),
)

// SAU
ElevatedButton(
  key: const Key('btn_submit_approval'),  // ← thêm dòng này
  onPressed: controller.onSubmitForApproval,
  child: Text('Gửi phê duyệt'),
)
```

---

## Bước 5: Chạy Tests

### 5.1 Unit Test (bắt buộc, không hỏi thêm)

```bash
cd src/app-mobile
flutter test test/unit/<feature-id>/ --reporter=expanded
```

Chạy ngay, không cần device, không cần flavor.

### 5.2 Widget Test (nếu có)

```bash
cd src/app-mobile
flutter test test/widget/<feature-id>/ --reporter=expanded
```

Chạy ngay, không cần device, không cần flavor.

### 5.3 Integration Test — Hỏi user trước khi chạy

**Bước 5.3.1 — Hỏi flavor:**

```
╔══════════════════════════════════════════════════╗
║  🚀 INTEGRATION TEST — Cấu hình trước khi chạy  ║
╠══════════════════════════════════════════════════╣
║  Chọn FLAVOR:                                    ║
║    1. local  — dev local machine, API: localhost ║
║    2. dev    — dev server, debug logging         ║
║    3. pilot  — staging server, pilot users       ║
║    4. prod   — production (KHÔNG khuyến nghị)    ║
╚══════════════════════════════════════════════════╝
Nhập số (1-4):
```

**Bước 5.3.2 — Hỏi module:**

```
╔══════════════════════════════════════════════════╗
║  Chọn MODULE cần enable:                         ║
╠══════════════════════════════════════════════════╣
║  Module đang test: eva (bắt buộc)                ║
║  Enable thêm modules khác?                       ║
║    [ ] att      --dart-define=ENABLE_ATT=true    ║
║    [ ] process  --dart-define=ENABLE_PROCESS=true║
║  (Các module khác: dashboard luôn on)            ║
╚══════════════════════════════════════════════════╝
Nhập tên module cách nhau bằng dấu phẩy (hoặc Enter để bỏ qua):
```

**Bước 5.3.3 — Tạo lệnh và xin accept:**

Dựa trên flavor + module user chọn, skill tạo lệnh và hiển thị:

```
╔══════════════════════════════════════════════════════════════════════════════╗
║  📋 LỆNH SẼ CHẠY — Vui lòng kiểm tra trước khi accept                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║                                                                              ║
║  flutter test integration_test/001-submit-approval-form/ \                  ║
║    --flavor dev \                                                            ║
║    --dart-define=ENABLE_EVA=true \                                           ║
║    --device-id=<auto-detect> \                                               ║
║    --reporter=expanded \                                                     ║
║    --timeout=120                                                             ║
║                                                                              ║
║  Entry point: lib/main_dev.dart                                              ║
║  Modules active: dashboard (always) + eva                                   ║
║  Device: <danh sách từ flutter devices>                                      ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  ⚠️  Lưu ý:                                                                 ║
║  • Test sẽ mở app thật trên device/emulator                                 ║
║  • API calls sẽ đi đến server thật (flavor: dev)                            ║
║  • Cần user đã login sẵn HOẶC test có bước login                            ║
╠══════════════════════════════════════════════════════════════════════════════╣
║  Accept và chạy? (yes / no / copy lệnh)                                     ║
╚══════════════════════════════════════════════════════════════════════════════╝
```

**Logic tạo lệnh theo flavor:**

```
flavor=local  → --flavor local --dart-define=ENABLE_EVA=true
                entry: lib/main_local.dart
                API: localhost (cần backend chạy local)

flavor=dev    → --flavor dev --dart-define=ENABLE_EVA=true
                entry: lib/main_dev.dart
                API: dev server

flavor=pilot  → --flavor pilot --dart-define=ENABLE_EVA=true
                entry: lib/main_pilot.dart
                API: staging server

flavor=prod   → --flavor prod --dart-define=ENABLE_EVA=true
                entry: lib/main_prod.dart
                API: production ⚠️ CẢNH BÁO
```

Với mỗi module user chọn thêm, append `--dart-define=ENABLE_<MODULE>=true`.

**Detect device tự động:**

```bash
flutter devices
```

Nếu có nhiều device → hỏi user chọn. Nếu chỉ 1 → dùng luôn. Nếu không có → báo lỗi và dừng.

---

## Bước 6: Báo cáo kết quả

### Khi `--gen-only`

```
╔══════════════════════════════════════════════════════╗
║       VNR AUTO TEST — Generated Files                ║
╠══════════════════════════════════════════════════════╣
║ Feature : <feature-id>                               ║
║ Generated: <timestamp>                               ║
╠════════════════╦═════════════════════════╦═══════════╣
║ Level          ║ File                    ║ TCs       ║
╠════════════════╬═════════════════════════╬═══════════╣
║ 1 — Unit       ║ test/unit/...           ║ <N> cases ║
║ 2 — Widget     ║ test/widget/...         ║ <N> cases ║
║ 3 — Integration║ integration_test/...    ║ <N> stubs ║
╠════════════════╩═════════════════════════╩═══════════╣
║ Run unit now:                                        ║
║   flutter test test/unit/<feature-id>/               ║
╚══════════════════════════════════════════════════════╝
```

### Khi `--run` (sau khi chạy)

```
╔══════════════════════════════════════════════════════╗
║       VNR AUTO TEST — Execution Report               ║
╠══════════════════════════════════════════════════════╣
║ LEVEL 1 — UNIT                           ✅ PASSED   ║
║   ✅ TC-U-001 <desc>                                 ║
║   ❌ TC-U-002 <desc>                                 ║
║      └─ Error: expected 0, got 1                    ║
║   Total: X passed, Y failed                         ║
╠══════════════════════════════════════════════════════╣
║ LEVEL 2 — WIDGET                         ✅ PASSED   ║
║   ✅ TC-W-001 ...                                    ║
║   Total: X passed, Y failed                         ║
╠══════════════════════════════════════════════════════╣
║ LEVEL 3 — INTEGRATION          ⏭️ SKIPPED / RESULT  ║
║   Flavor: dev | Modules: eva                        ║
║   ✅ TC-I-001 ...                                    ║
║   Total: X passed, Y failed                         ║
╠══════════════════════════════════════════════════════╣
║ OVERALL: X passed, Y failed                         ║
╚══════════════════════════════════════════════════════╝
```

---

## Quy tắc cứng (Hard Rules)

1. **Unit test LUÔN được generate và LUÔN được chạy** — không có exception
2. **Compliance Check LUÔN chạy** khi feature có widget/view/modal mới — trước Widget Test
3. **Compliance VIOLATION → BLOCK**: không chạy Widget Test cho đến khi fix hết violations
4. **Widget test chỉ generate khi** tasks.md có widget mới (`StatefulWidget`/`StatelessWidget`)
5. **Integration test**: sau khi generate stubs → **PHẢI hỏi user** xin thêm Key vào widget
6. **Integration run**: **PHẢI hỏi** flavor + module → **PHẢI show lệnh** → **PHẢI xin accept** trước khi chạy
7. **KHÔNG dùng mockito** trong unit/widget test — dùng `_Fake*` class inline
8. **KHÔNG import GetX DI / HTTP** vào unit và widget test
9. **TC ID unique** toàn feature: `TC-U-NNN`, `TC-W-NNN`, `TC-I-NNN`
10. **Nếu file test đã tồn tại** → đọc trước, tìm TC IDs hiện có, **MERGE không overwrite**
11. **Coverage target ≥ 80%** public methods của controller
12. **prod flavor** → hiển thị cảnh báo đỏ, yêu cầu user confirm thêm lần nữa
13. **Compliance auto-fix**: khi user đồng ý fix tự động → edit file, chạy lại scan, **không tiếp tục nếu scan lần 2 vẫn fail**

---

## Demo Reference: Feature 001-submit-approval-form

### Unit test đã generate & chạy thành công

- File: `test/unit/001-submit-approval-form/submit_approval_unit_test.dart`
- 17/17 TC passed ✅

### Widget test đã generate

- File: `test/widget/001-submit-approval-form/submit_approval_widget_test.dart`
- 9 TC (EvaModalSubmitApproval là widget mới → đủ điều kiện)

### Integration test stubs

- File: `integration_test/001-submit-approval-form/submit_approval_integration_test.dart`
- 3 TC stubs (TC-I-001, TC-I-002, TC-I-003)
- Keys cần gắn:

| Key                       | Widget                         | File                                    |
| ------------------------- | ------------------------------ | --------------------------------------- |
| `btn_submit_approval`     | ElevatedButton "Gửi phê duyệt" | `eva_goals_form_detail_view.dart`       |
| `modal_submit_approval`   | VnRTopModal title              | `eva_modal_submit_approval.dart`        |
| `modal_note_field`        | TextField note                 | `eva_modal_submit_approval.dart`        |
| `modal_confirm_button`    | VnRListAction "Xác nhận"       | `eva_modal_submit_approval.dart`        |
| `modal_cancel_button`     | VnRListAction "Hủy"            | `eva_modal_submit_approval.dart`        |
| `validation_error_dialog` | VnRConfirmDialog error         | `eva_goals_form_detail_controller.dart` |

### Lệnh integration test cho feature này

```bash
# flavor=dev, module=eva (recommended cho dev)
flutter test integration_test/001-submit-approval-form/ \
  --flavor dev \
  --dart-define=ENABLE_EVA=true \
  --reporter=expanded

# flavor=local (cần backend chạy local)
flutter test integration_test/001-submit-approval-form/ \
  --flavor local \
  --dart-define=ENABLE_EVA=true \
  --reporter=expanded
```
