# Mobile — Dynamic Form & Permissions Patterns

**Applies to**: Flutter mobile app (`src/app-mobile/`)  
**Mandatory**: YES — Lấy từ source code thực tế module Eva  
**Source của truth**: `src/app-mobile/lib/modules/eva/pages/eva_goals/controller/eva_goal_create_controller.dart`

> ⚠️ File này document patterns **low-code / no-code** của form động và hệ thống phân quyền.  
> Agent PHẢI đọc file này trước khi implement bất kỳ form create/edit hoặc phân quyền nào.

---

## 1. Config-Driven Form — Tại sao cần?

BE điều khiển form qua JSON config (dynamic store). Mỗi field có thể bật/tắt, ẩn/hiện, bắt buộc/không bắt buộc mà **không cần release app**. Đây là mô hình **low-code no-code**.

```
eva_config.json  ←──────────────  BE config (storeName làm key)
     │
     ▼
EvaConfigMixin.getValidateConfig(storeName)
     │
     ▼
Map<String, ValidateFieldConfig>   (field key → config)
     │
     ▼
buildController(config) → FormDynamicController.register(FieldBinder)
     │
     ▼
View render theo registerController.binders
```

---

## 2. StoreName — Key của Dynamic Config

`eva_config.json` chứa nhiều section, mỗi section dùng **storeName làm key**. Có 2 loại section:

| Loại | Key pattern | Method đọc | Trả về |
|------|-------------|------------|--------|
| List / Grid | `"sp_eva_get_my_goal_personal"` | `getAllConfig(storeKey)` | `listApiConfig, groupApiConfig, fieldMapping` |
| Form validate | `"goal-period-form"` | `getValidateConfig(storeKey)` | `Map<String, ValidateFieldConfig>` |

### Cấu trúc `eva_config.json` — Form section

```json
{
  "goal-period-form": {
    "validate": {
      "GoalType": {
        "typeControl": "comboBox",
        "hidden": false,
        "disabled": false,
        "validation": { "nullable": false },
        "translateValue": "objEval.GoalPeriod.GoalType",
        "order": 1,
        "businessRules": [
          {
            "name": "Hide Weight when GoalType is 2",
            "trigger": {
              "field": "GoalType",
              "operator": "OR",
              "conditions": [
                { "field": "GoalType", "operator": "==", "value": 2 }
              ]
            },
            "actions": [
              { "field": "Weight", "action": "hide" }
            ]
          }
        ]
      },
      "Name": {
        "typeControl": "text",
        "hidden": false,
        "validation": { "nullable": false },
        "translateValue": "objEval.GoalPeriod.GoalName",
        "order": 2
      }
    }
  }
}
```

### `ValidateFieldConfig` — Freezed model

```dart
@freezed
class ValidateFieldConfig with _$ValidateFieldConfig {
  const factory ValidateFieldConfig({
    String? typeControl,          // 'text' | 'number' | 'comboBox' | 'radioButton' | 'treeView' | 'datePicker' | 'file'
    @Default(false) bool hidden,  // ẩn field khỏi form
    @Default(false) bool disabled, // disable (read-only) field
    @Default(<String, dynamic>{}) Map<String, dynamic> validation, // {'nullable': false} = required
    String? translateValue,       // translation key cho label
    List<BusinessRule>? businessRules, // rules trigger khi field thay đổi
    int? order,                   // thứ tự hiển thị
    dynamic defaultValue,
    // ...
  }) = _ValidateFieldConfig;
}
```

**Đọc validation required:**

```dart
final isRequired = field.validation['nullable'] == false;
```

---

## 3. `FormDynamicController` — Registry cho form fields

`FormDynamicController` là registry trung tâm quản lý tất cả VnR widget controller trong form.

```dart
class FormDynamicController {
  final Map<String, dynamic> controllers = {};    // key → VnR widget controller
  final Map<String, FieldBinder> binders = {};    // key → FieldBinder (metadata)

  void register(FieldBinder binder);             // đăng ký field
  T? get<T>(String key);                         // lấy controller theo type
  Map<String, dynamic> collectFormData();        // thu thập giá trị hiện tại của form
  void dispose();                                // dispose tất cả controllers
}
```

### `FieldBinder` — Metadata của 1 field

```dart
class FieldBinder {
  final String key;           // tên field, match với key trong config
  final String typeControl;   // loại control ('text', 'comboBox', ...)
  final String label;         // translation key cho label
  final bool isRequired;
  final bool hidden;
  final dynamic controller;   // VnR widget controller instance
}
```

### Khởi tạo trong Controller

```dart
class MyFormController extends GetxController with MSControllerMixin, EvaConfigMixin {
  late final FormDynamicController registerController;

  MyFormController() {
    registerController = FormDynamicController();   // khởi tạo trong constructor
  }

  @override
  void onInit() {
    super.onInit();
    loadValidateForm();   // async — đọc config và build controllers
  }

  @override
  void onClose() {
    registerController.dispose();   // PHẢI dispose
    super.onClose();
  }
}
```

---

## 4. `buildController` — Build FieldBinder từ config

Sau khi đọc config, gọi `buildController` để tạo FieldBinder cho mỗi field:

```dart
Future<void> buildController(Map<String, ValidateFieldConfig> config) async {
  for (final entry in config.entries.toList()) {
    final builder = buildBinder(entry.key, entry.value);
    if (builder != null) registerController.register(builder);
  }
}
```

### `buildBinder` — Switch/case theo field key

Mỗi field key có logic tạo VnR controller riêng:

```dart
FieldBinder? buildBinder(String key, ValidateFieldConfig field) {
  final isRequired = field.validation['nullable'] == false;
  final label = field.translateValue ?? key;   // fallback về key nếu không có translation
  final hidden = field.hidden;
  final typeControl = field.typeControl;

  switch (key) {
    case 'Name':
      final ctrl = VnRTextController(
        label: label,
        isRequired: isRequired,
        isVisible: !hidden,
        initialValue: dataItem?.Name ?? '',
      );
      return FieldBinder(
        key: key,
        typeControl: typeControl ?? 'text',
        label: label,
        isRequired: isRequired,
        hidden: hidden,
        controller: ctrl,
      );

    case 'GoalType':
      final ctrl = VnRDropdownController<int>(
        onChanged: (value) => onchangeAllController(key, field), // ← trigger business rules
        dataLocal: [/* ... */],
        textField: 'Text',
        valueField: 'Value',
        isVisible: !hidden,
        label: label,
        isRequired: isRequired,
      );
      return FieldBinder(
        key: key,
        typeControl: typeControl ?? 'comboBox',
        label: label,
        isRequired: isRequired,
        hidden: hidden,
        controller: ctrl,
      );

    // ... các case khác ...

    default:
      // Fallback cho field không biết type
      final ctrl = VnRTextController(
        label: label,
        isRequired: isRequired,
        isVisible: !hidden,
      );
      return FieldBinder(
        key: key,
        typeControl: typeControl ?? 'text',
        label: label,
        isRequired: isRequired,
        hidden: hidden,
        controller: ctrl,
      );
  }
}
```

### typeControl → VnR Widget mapping

| `typeControl` | VnR Controller | Widget |
|---------------|----------------|--------|
| `'text'` | `VnRTextController` | `VnRInputText` |
| `'number'` | `VnRNumberController` | `VnRInputNumber` |
| `'comboBox'` | `VnRDropdownController<T>` | `VnRDropdown<T>` |
| `'radioButton'` | `VnRRadioController<T>` | `VnRRadio<T>` |
| `'treeView'` | `VnRTreeViewController` | `VnRTreeView` |
| `'datePicker'` | `VnRDatePickerController` | `VnRDatePicker` |
| `'file'` | `VnRAttachFileController` | `VnRAttachFile` |

### Remote source dropdown

Khi dropdown cần load data từ API:

```dart
final dropdownSource = VnRDropdownSourceConfig<String>(
  endpoint: '/proxy/shared/api/v1/Dynamic/GetDataSourceComboboxEntity?EntityName=Cat_xxx',
  method: VnRApiMethod.get,
);

final ctrl = VnRDropdownController<String>(
  remoteSource: dropdownSource,
  textField: 'Text',
  valueField: 'Value',
  isVisible: !hidden,
  label: label,
  isRequired: isRequired,
  onChanged: (value) => onchangeAllController(key, field),
);
```

### Fields không có trong config — thêm thủ công

Fields không do BE config (ví dụ attachment, description bổ sung) → thêm sau khi `buildController()`:

```dart
void buildControllerOther() {
  final ctrlDescription = VnRTextAreaController(
    label: 'objEval.GoalPeriod.Description',
    isRequired: false,
    isVisible: true,
  );
  registerController.register(FieldBinder(
    key: 'Description',
    typeControl: 'text',
    label: 'objEval.GoalPeriod.Description',
    isRequired: false,
    hidden: false,
    controller: ctrlDescription,
  ));
}
```

---

## 5. Business Rules — Trigger → Action

Business rules được định nghĩa **trong `ValidateFieldConfig.businessRules`** của từng field, chạy khi giá trị field đó thay đổi.

### Cấu trúc Business Rule

```dart
// BusinessRule: 1 rule = 1 trigger + nhiều actions
class BusinessRule {
  String? name;           // tên rule (debug)
  RuleTrigger? trigger;   // điều kiện kích hoạt
  List<RuleAction> actions; // hành động thực thi khi trigger match
}

// RuleTrigger: field nào thay đổi, điều kiện gì
class RuleTrigger {
  String? field;              // field gây ra trigger (key trong form)
  TriggerOperator? operator;  // OR: bất kỳ condition nào true | AND: tất cả đều true
  List<RuleCondition> conditions; // danh sách điều kiện
}

// RuleCondition: điều kiện check giá trị của 1 field trong form
class RuleCondition {
  String? field;               // field để check
  ConditionOperator? operator; // == | != | isEmpty | hasValue
  dynamic value;               // giá trị so sánh
}

// RuleAction: thay đổi field khác
class RuleAction {
  String? field;     // field bị ảnh hưởng
  ActionType? action; // loại hành động
  dynamic value;     // giá trị (cho assignValue)
}
```

### Enums

```dart
enum TriggerOperator { or, and }

enum ConditionOperator { equals, notEquals, isEmpty, hasValue }
// JSON mapping: '==' → equals, '!=' → notEquals, 'isEmpty', 'hasValue'

enum ActionType { hide, show, readOnly, write, required, notRequired, assignValue }
```

### JSON example trong `eva_config.json`

```json
"businessRules": [
  {
    "name": "Ẩn Weight khi GoalType = PIP",
    "trigger": {
      "field": "GoalType",
      "operator": "OR",
      "conditions": [
        { "field": "GoalType", "operator": "==", "value": 1 }
      ]
    },
    "actions": [
      { "field": "Weight", "action": "hide" }
    ]
  },
  {
    "name": "Bắt buộc ApproverId khi có AssignedToProfileId",
    "trigger": {
      "field": "AssignedToProfileId",
      "operator": "OR",
      "conditions": [
        { "field": "AssignedToProfileId", "operator": "hasValue" }
      ]
    },
    "actions": [
      { "field": "ApproverId", "action": "required" }
    ]
  }
]
```

---

## 6. `onchangeAllController` — Entry Point khi field thay đổi

Mỗi VnR controller có `onChanged` callback. Khi field thay đổi → gọi `onchangeAllController`:

```dart
// Trong buildBinder — truyền onChanged vào controller
final ctrl = VnRDropdownController<int>(
  onChanged: (value) => onchangeAllController(key, field),  // ← hook này
  // ...
);
```

```dart
// Luồng xử lý business rules
void onchangeAllController(String key, ValidateFieldConfig field) {
  // 1. Lấy rules được trigger bởi field này
  final rules = getTriggerByKey(key, field);
  if (rules == null || rules.isEmpty) return;

  // 2. Evaluate conditions và execute actions (1 lần update)
  checkTriggerAndExecute(rules);
}

void checkTriggerAndExecute(List<BusinessRule> businessRules) {
  final formData = registerController.collectFormData(); // thu thập giá trị hiện tại
  bool hasChanges = false;

  for (final rule in businessRules) {
    final trigger = rule.trigger;
    if (trigger == null || trigger.conditions.isEmpty) continue;

    // Evaluate OR hoặc AND
    bool shouldExecute = trigger.operator == TriggerOperator.or
        ? trigger.conditions.any((c) => _evaluateCondition(c, formData))
        : trigger.conditions.every((c) => _evaluateCondition(c, formData));

    if (shouldExecute) {
      // Execute từng action
      for (final action in rule.actions) {
        final success = _executeActionByType(action.action!, action.field!, action.value);
        if (success) hasChanges = true;
      }
    }
  }

  // Batch update UI — chỉ 1 lần sau khi tất cả actions chạy xong
  if (hasChanges) update(['key_form_info']);
}
```

### `_executeActionByType` — Map ActionType → controller method

```dart
bool _executeActionByType(ActionType actionType, String field, dynamic value) {
  final binder = getBinder(field);   // getBinder(key) = registerController.binders[key]
  if (binder == null) return false;
  final controller = binder.controller;

  switch (actionType) {
    case ActionType.required:
      controller.setRequired(true);
    case ActionType.notRequired:
      controller.setRequired(false);
    case ActionType.readOnly:
      controller.setDisabled(true);
    case ActionType.write:
    case ActionType.assignValue:
      controller.setValue(value);
    case ActionType.hide:
      controller.setVisible(false);
    case ActionType.show:
      controller.setVisible(true);
  }
  return true;
}
```

---

## 7. `executeAllBusinessRules` — Áp dụng rules khi form khởi tạo

Khi form load xong (đặc biệt khi edit mode với dữ liệu có sẵn), cần chạy toàn bộ business rules một lần để đồng bộ trạng thái form:

```dart
// Gọi trong loadValidateForm() sau khi buildController() xong
Future<void> loadValidateForm() async {
  setLoading(true);
  try {
    final cfg = await getValidateConfig('goal-period-form');  // storeName
    state.validateFormRx.value = cfg;

    if (cfg.isNotEmpty) {
      await buildController(cfg);           // tạo controllers từ config
      buildControllerOther();               // thêm fields thủ công nếu cần
    }

    executeAllBusinessRules();              // áp dụng tất cả rules với giá trị hiện tại
  } finally {
    setLoading(false);
  }
}

void executeAllBusinessRules() {
  final config = state.validateFormRx.value;
  if (config == null || config.isEmpty) return;

  final formData = registerController.collectFormData();
  bool hasChanges = false;

  for (final entry in config.entries) {
    final businessRules = entry.value.businessRules;
    if (businessRules == null || businessRules.isEmpty) continue;

    final triggeredRules = businessRules
        .where((rule) => rule.trigger?.field == entry.key)
        .toList();

    for (final rule in triggeredRules) {
      // Evaluate và execute (không update UI)
      if (_shouldExecuteRule(rule, formData)) {
        final executed = _executeActionsInternal(rule.actions);
        if (executed) hasChanges = true;
      }
    }
  }

  // Batch UI update cuối
  if (hasChanges) update(['key_form_info']);
}
```

---

## 8. `update(['key_form_info'])` — Batched GetBuilder update

Form view dùng `GetBuilder` với id `'key_form_info'` để rebuild khi có thay đổi từ business rules:

```dart
// ✅ Đúng — batch update, chỉ rebuild GetBuilder có id này
update(['key_form_info']);  // gọi SAU KHI tất cả actions chạy xong

// ❌ Sai — update từng lần sau mỗi action (gây rebuild nhiều lần)
controller.setVisible(false);
update(['key_form_info']);  // ← không gọi trong loop
controller.setRequired(true);
update(['key_form_info']);  // ← chỉ gọi 1 lần ở cuối
```

**View pattern với GetBuilder:**

```dart
// Trong View — dùng GetBuilder với id để lắng nghe update từ business rules
GetBuilder<MyFormController>(
  id: 'key_form_info',
  builder: (ctrl) {
    return Column(
      children: ctrl.registerController.binders.entries.map((entry) {
        final binder = entry.value;
        if (binder.controller?.isVisible == false) return const SizedBox.shrink();
        // render widget theo typeControl của binder
        return _buildFieldWidget(binder);
      }).toList(),
    );
  },
)
```

---

## 9. Helpers trong Controller

```dart
// Lấy FieldBinder theo key
FieldBinder? getBinder(String key) => registerController.binders[key];

// Lấy VnR controller theo type
T? getCtrl<T>(String key) => registerController.get<T>(key);

// Ví dụ sử dụng
void someAction() {
  final dropCtrl = getCtrl<VnRDropdownController<String>>('AssignedToProfileId');
  dropCtrl?.setValue('some-id');
  dropCtrl?.setDisabled(true);

  final treeCtrl = getCtrl<VnRTreeViewController>('AssignedToOrgStructureId');
  treeCtrl?.setVisible(false);

  update(['key_form_info']);
}
```

---

## 10. Permissions — `PermissionService`

### Pattern cơ bản

```dart
import 'package:vnr_super_hrm/shared/utils/permission_service.dart';
import 'package:domain/domain.dart';  // PrivilegeNumberType

// Static check — dùng được ở bất cứ đâu
bool canView = PermissionService.can('HRM_EVA_GOAL_FORM_PERSONAL', PrivilegeNumberType.view);
bool canCreate = PermissionService.can('HRM_EVA_GOAL', PrivilegeNumberType.create);
bool canModify = PermissionService.can('HRM_EVA_GOAL_CHECKIN', PrivilegeNumberType.modify);
bool canDelete = PermissionService.can('HRM_EVA_GOAL', PrivilegeNumberType.delete);
```

### `PrivilegeNumberType` — Các loại quyền

```dart
enum PrivilegeNumberType {
  view,    // Xem
  create,  // Tạo mới
  modify,  // Sửa
  delete,  // Xóa
  // ...
}
```

### Cách check quyền trong Tab Bar

```dart
// Định nghĩa tab với resource + privilege
final allTabs = [
  TabInfo(
    page: const EvaGoalsPageIndex(),
    privilege: PrivilegeNumberType.view,
    resource: 'HRM_EVA_GOAL_FORM_PERSONAL',
  ),
];

// Filter tab theo quyền
List<TabInfo> get visibleTabs =>
    allTabs.where((tab) => PermissionService.can(tab.resource, tab.privilege)).toList();
```

### Cách check quyền trong Action Bar (config-driven)

Khi dùng `EvaConfigMixin.getListActions`, truyền `checkPermission` callback:

```dart
final actions = await getListActions(
  storeKey,
  onActionPressed: (confirmConfig, selectedItems, statusAction) { /* ... */ },
  checkPermission: PermissionService.can,   // ← truyền static method
);
```

### Resource naming convention

```
HRM_{MODULE}_{FEATURE}
Ví dụ:
  HRM_EVA_GOAL_FORM_PERSONAL  → Phiếu mục tiêu cá nhân
  HRM_EVA_GOAL                → Mục tiêu
  HRM_EVA_GOAL_CHECKIN        → Check-in tiến độ
  HRM_EVA_GOAL_CHECKIN_EMPLOYEE  → Check-in nhân viên
  HRM_EVA_GOAL_CHECKIN_DEPARTMENT → Check-in phòng ban
  HRM_EVA_GOAL_RESULT         → Kết quả đánh giá
  HRM_EVA_EVALUATION          → Đánh giá cuối kỳ
```

### Check quyền trong View — ẩn/hiện widget

```dart
// Trong View
if (PermissionService.can('HRM_EVA_GOAL', PrivilegeNumberType.create))
  VnRFloatingButton(
    type: VnRFloatingButtonType.primary,
    onPressed: () => controller.openCreateForm(),
  ),
```

---

## 11. Luồng đầy đủ — Dynamic Form

```
onInit()
  └── loadValidateForm()
        ├── getValidateConfig('goal-period-form')  ← đọc từ eva_config.json
        │     └── Map<String, ValidateFieldConfig>
        │
        ├── buildController(config)
        │     └── for each field → buildBinder(key, field)
        │           ├── switch(key) → tạo VnR controller phù hợp
        │           │     └── onChanged: (v) => onchangeAllController(key, field)
        │           └── registerController.register(FieldBinder(...))
        │
        ├── buildControllerOther()          ← fields thủ công không từ config
        │
        └── executeAllBusinessRules()       ← áp dụng rules với giá trị ban đầu
              └── update(['key_form_info'])

User thay đổi field
  └── VnR controller.onChanged(value)
        └── onchangeAllController(key, field)
              ├── getTriggerByKey(key, field) → List<BusinessRule>
              └── checkTriggerAndExecute(rules)
                    ├── collectFormData()        ← lấy toàn bộ giá trị hiện tại
                    ├── evaluateConditions()     ← OR / AND
                    ├── _executeActionByType()   ← hide/show/required/setValue
                    └── update(['key_form_info']) ← 1 lần duy nhất, batch update
```

---

## 12. Quick Reference — Checklist

**Config-driven form:**
- [ ] StoreName lấy từ `eva_config.json` — không hardcode field config trong code
- [ ] `getValidateConfig(storeName)` trong `loadValidateForm()`, không phải trong `onInit` trực tiếp
- [ ] `buildController()` gọi sau khi có config, check guard `_controllersBuilt` nếu cần
- [ ] `buildBinder()`: switch/case theo **field key**, fallback `default` → `VnRTextController`
- [ ] `onChanged` của mỗi VnR controller → `onchangeAllController(key, field)`
- [ ] `executeAllBusinessRules()` gọi sau `buildController()` để áp dụng rules với giá trị ban đầu
- [ ] `registerController.dispose()` trong `onClose()`

**Business rules:**
- [ ] `update(['key_form_info'])` chỉ gọi **1 lần** sau khi toàn bộ actions trong batch chạy xong
- [ ] Dùng `getBinder(key)` để lấy FieldBinder, `getCtrl<T>(key)` để lấy typed controller
- [ ] Logic condition: OR = `any()`, AND = `every()`
- [ ] `ActionType`: hide, show, required, notRequired, readOnly, assignValue (write)

**Permissions:**
- [ ] `PermissionService.can(resourceName, PrivilegeNumberType.xxx)` — static, không cần instance
- [ ] Resource: `HRM_{MODULE}_{FEATURE}` — hỏi BE để lấy đúng resource name
- [ ] Tab visibility: filter danh sách tab theo `PermissionService.can`
- [ ] Config-driven actions: truyền `checkPermission: PermissionService.can` vào `getListActions`

---

**Last Updated**: 2026-04-15  
**Version**: 1.0  
**Source**: `src/app-mobile/lib/modules/eva/pages/eva_goals/controller/eva_goal_create_controller.dart`  
**Source**: `src/app-mobile/lib/modules/eva/shared/controller/form_dynamic_controller.dart`  
**Source**: `src/app-mobile/core/domain/lib/model/base_config/business_rule_models.dart`  
**Source**: `src/app-mobile/lib/shared/utils/permission_service.dart`
