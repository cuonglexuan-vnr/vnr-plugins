# VnR App UI Standards (Flutter/Mobile)

**Purpose**: Enforce VnR widget and theme standards across all mobile implementations  
**Applies to**: All UI components, modals, dialogs, forms in Flutter app  
**Mandatory**: YES - All code must comply  
**Deep-dive khi cần** (không cần đọc mặc định — standards này đã tóm đủ để implement):

- `docs/wiki/concepts/widget-mobile-catalog.md` — full widget API với mọi props/variants, design tokens, layout patterns, bottom sheet template (đọc khi cần widget ít dùng, edge case, hoặc tra cứu props chính xác)

---

## ❌ Common Violations

### 1. Using Standard Flutter Widgets Instead of VnR Widgets

**WRONG** ❌:

```dart
// Using AlertDialog
await Get.dialog(
  AlertDialog(
    title: Text('Title'),
    content: Text('Content'),
    actions: [
      TextButton(...),
      ElevatedButton(...),
    ],
  ),
);
```

**CORRECT** ✅:

```dart
// Using VnR bottom sheet + VnRTopModal + VnRListActionBar
await Get.bottomSheet(
  Container(
    child: Column(
      children: [
        VnRTopModal(
          title: 'Title',
          type: VnRTopModalType.label,
          onClose: () => Navigator.of(context).pop(),
        ),
        // ... content ...
        VnRListActionBar(
          actions: [
            VnRListAction(
              label: 'Cancel',
              styleButton: VnRListActionType.secondary,
              onPressed: (items) => Navigator.pop(context),
            ),
            VnRListAction(
              label: 'Confirm',
              styleButton: VnRListActionType.primary,
              onPressed: (items) => handleConfirm(),
            ),
          ],
        ),
      ],
    ),
  ),
  isScrollControlled: true,
  backgroundColor: Colors.white,
  shape: RoundedRectangleBorder(
    borderRadius: BorderRadius.vertical(top: Radius.circular(AppRadius.xxl)),
  ),
);
```

---

### 2. Using Non-VnR Theme Properties

**WRONG** ❌:

```dart
// Direct color access
color: Colors.grey,
color: Color(0xFF757575),

// Non-existent context properties
color: context.gray50,      // ❌ Doesn't exist
color: context.gray400,     // ❌ Doesn't exist
color: context.primary,     // ❌ Doesn't exist

// Deprecated methods
color: Colors.red.withOpacity(0.5),  // ❌ Deprecated
```

**CORRECT** ✅:

```dart
// VnR theme context extensions
color: context.white,
color: context.bgLevel2,
color: context.borderColor,
color: context.textColor,
color: context.red,

// Proper opacity
color: context.textColor.withValues(alpha: 0.5),  // ✅ Modern API

// Theme.of(context) for standard properties
color: Theme.of(context).primaryColor,
```

---

### 3. Using Standard Buttons Instead of VnRButton

**WRONG** ❌:

```dart
ElevatedButton(
  onPressed: () {},
  child: Text('Submit'),
)

TextButton(
  onPressed: () {},
  child: Text('Cancel'),
)
```

**CORRECT** ✅:

```dart
VnRButton(
  label: 'Submit',
  type: ButtonType.primary,
  size: ButtonSize.medium,
  onPressed: () {},
)

VnRButton(
  label: 'Cancel',
  type: ButtonType.secondary,
  size: ButtonSize.medium,
  onPressed: () {},
)
```

---

## ✅ VnR Widget Library

### Available Context Theme Extensions

From `theme/app_theme.dart`:

**Colors**:

- `context.white`
- `context.black`
- `context.bgLevel1`
- `context.bgLevel2`
- `context.borderColor`
- `context.textColor`
- `context.red`
- `context.green`
- `context.blue`
- `context.yellow`
- `context.orange`

**Typography**:

- `context.title1` - Large titles
- `context.title2` - Medium titles
- `context.h1`, `context.h2`, `context.h3` - Headers
- `context.body14Regular` - Body text
- `context.body14Semibold` - Bold body text
- `context.body12Regular` - Small text
- `context.caption12Regular` - Caption text

**DO NOT use**:

- ❌ `context.gray50`, `context.gray400`, `context.primary` (these don't exist)
- ❌ Direct color hex codes
- ❌ `Colors.grey[50]`, `Colors.grey[400]`

---

### Required VnR Widgets

For complete API reference and usage examples, see `src/app-mobile/docs/widgets/VNR_WIDGETS_GUIDE.md`.

#### 1. Buttons

**VnRButton**:

```dart
VnRButton(
  label: 'Submit',
  type: ButtonType.primary,    // primary | outline | outlineGray | danger | dash | dashGray | text | grayBackground | link
  size: ButtonSize.medium,     // small | medium | large
  isDisabled: false,
  onPressed: () {},
)
```

**VnRFloatingButton**:

```dart
VnRFloatingButton(
  type: VnRFloatingButtonType.primary,  // primary | selectAll | custom
  onPressed: () => addNew(),
)
```

#### 2. Inputs (Controller Pattern Required)

**VnRInputText**:

```dart
final controller = VnRInputTextController(
  label: 'Full Name',
  isRequired: true,
  placeholder: 'Enter your name',
  textEditingController: TextEditingController(),
);

VnRInputText(
  controller: controller,
  validator: (value) => (value?.isEmpty ?? true) ? 'Required' : null,
)
```

**VnRInputNumber**:

```dart
final controller = VnRInputNumberController(
  label: 'Amount',
  isRequired: true,
  isFormatNumber: true,  // Add thousand separators
  currencySymbol: 'VNĐ',
);

VnRInputNumber(controller: controller)
```

**VnRTextArea**:

```dart
final controller = VnRTextAreaController(
  label: 'Description',
  placeholder: 'Enter description...',
  isRequired: true,
  maxLines: 5,
  maxLength: 500,
);

VnRTextArea(controller: controller)
```

#### 3. Dropdowns (Controller Pattern Required)

**VnRDropdown - Single Selection**:

```dart
final controller = VnRDropdownController<String>(
  label: 'Type',
  isRequired: true,
  placeholder: 'Select type',
  isSearchable: true,
  dataLocal: const [
    {'value': 'type_a', 'label': 'Type A'},
    {'value': 'type_b', 'label': 'Type B'},
  ],
  textField: 'label',
  valueField: 'value',
);

VnRDropdown<String>(
  controller: controller,
  validator: (v) => VnRDropdown.validatorDefault(v: v),
  onChanged: (value) => controller.setValue(value),
)
```

**VnRDropdown - Multi Selection**:

```dart
final controller = VnRDropdownController<int>(
  label: 'Employees',
  isRequired: true,
  isMultiSelection: true,
  isSearchable: true,
  dataLocal: [...],
  textField: 'name',
  valueField: 'id',
);

VnRDropdown<int>(
  controller: controller,
  validatorMulti: (v) => VnRDropdown.validatorDefault(v: v, isMultiSelection: true),
  onChangedMulti: (selectedIds) => controller.setValues(selectedIds!),
)
```

#### 4. Date/Time Pickers (Controller Pattern Required)

**VnRDatePicker**:

```dart
final controller = VnRDatePickerController(
  type: VnRDatePickerType.date,        // date | fromToDate | multiDate
  label: 'Birth Date',
  isRequired: true,
);

VnRDatePicker(
  controller: controller,
  validator: (date) => date == null ? 'Select date' : null,
  onChange: (date) => print('Selected: $date'),
)
```

**VnRTimePicker**:

```dart
final controller = VnRTimePickerController(
  label: 'Start Time',
  isRequired: true,
);

VnRTimePicker(controller: controller)
```

#### 5. Tree View (Controller Pattern Required)

**VnRTreeView**:

```dart
final controller = VnRTreeViewController(
  type: VnRTreeViewSelectType.single,  // single | multiple
  label: 'Department',
  isRequired: true,
  dataLocal: [...],  // or remoteSource: VnRTreeViewSourceConfig(...)
);

VnRTreeView(
  controller: controller,
  validator: (v) => VnRTreeView.validatorDefault(v: v),
  onChange: (selectedId) => print('Selected: $selectedId'),
)
```

#### 6. Modals/Dialogs

**Top Modal Header**:

```dart
VnRTopModal(
  title: 'Title'.tr,
  type: VnRTopModalType.label,
  onClose: () => Navigator.of(context).pop(),
)
```

**Action Bar** (replaces AlertDialog actions):

```dart
VnRListActionBar(
  actions: [
    VnRListAction(
      label: 'Cancel',
      styleButton: VnRListActionType.secondary,
      onPressed: (items) => Navigator.pop(context),
    ),
    VnRListAction(
      label: 'Confirm',
      styleButton: VnRListActionType.primary,
      onPressed: (items) => handleAction(),
    ),
  ],
  selectedItems: const [],
  isVisibleCount: false,
  isVisible: true,
  onActionPressed: (action) => action.onPressed([]),
)
```

**Confirm Dialog**:

```dart
Get.dialog(
  VnRConfirmDialog(
    title: 'Title',
    content: 'Message',
    confirmText: 'Confirm',
    cancelText: 'Cancel',
    isDestructive: true,  // Red confirm button
    onConfirm: () => handleConfirm(),
  ),
);
```

#### 7. Displays

**VnRAvatar**:

```dart
const VnRAvatar(
  name: 'Nguyen Van A',
  title: 'Nguyễn Văn A',
  subtitle: 'Developer',
  size: VnRAvatarSize.avt40,  // avt24 | avt32 | avt40 | avt48 | avt56 | avt64
)
```

**VnRBadge**:

```dart
const VnRBadge(
  type: VnRBadgeType.number,  // dot | number
  number: 5,
)
```

**VnRStatus**:

```dart
VnRStatus(
  title: 'Approved',
  backgroundColor: context.green50,
  textColor: context.green,
  size: VnRStatusSize.medium,  // small | medium
)
```

**VnRTags**:

```dart
VnRTags(
  title: 'Flutter',
  type: VnRTagsType.neutralGreen,  // neutralGreen | pink | orange | blue | purple
  size: VnRTagsSize.medium,        // small | medium | large
  onCancel: () => removeTag(),
)
```

#### 8. Selections

**VnRCheckbox**:

```dart
VnRCheckbox(
  title: 'Accept terms',
  value: isAccepted,
  onChanged: (value) => setState(() => isAccepted = value!),
)
```

**VnRRadio**:

```dart
VnRRadio(
  title: 'Option A',
  value: selectedOption == 'A',
  onChanged: (selected) {
    if (selected!) setState(() => selectedOption = 'A');
  },
)
```

**VnRSwitch**:

```dart
VnRSwitch(
  title: 'Enable notifications',
  value: isEnabled,
  onChanged: (value) => setState(() => isEnabled = value),
)
```

**VnRChecklist** (Controller Pattern Required):

```dart
final controller = VnRChecklistController(
  label: 'Select items',
  dataLocal: [...],
);

VnRChecklist(controller: controller)
```

#### 9. Snackbars/Toasts

```dart
// Success
VnRSnackbar.showSuccess('Message');

// Error
VnRSnackbar.showError('Message');

// Warning
VnRSnackbar.showWarning('Message');

// Info
VnRSnackbar.showInfo('Message');
```

---

## 🎨 VnR Theme Usage Rules

### Rule 1: Always Use Context Extensions

**DON'T**:

```dart
Container(color: Colors.white)
Text('Hello', style: TextStyle(fontSize: 14))
```

**DO**:

```dart
Container(color: context.white)
Text('Hello', style: context.body14Regular)
```

### Rule 2: Use VnR Spacing Constants

**DON'T**:

```dart
padding: EdgeInsets.all(16)
SizedBox(height: 8)
```

**DO**:

```dart
padding: EdgeInsets.all(AppSpacing.xl)  // 16
SizedBox(height: AppSpacing.s)          // 8
```

Available spacing:

- `AppSpacing.xxs` = 2
- `AppSpacing.xs` = 4
- `AppSpacing.s` = 8
- `AppSpacing.m` = 12
- `AppSpacing.l` = 16
- `AppSpacing.xl` = 20
- `AppSpacing.xxl` = 24

### Rule 3: Use VnR Border Radius

**DON'T**:

```dart
borderRadius: BorderRadius.circular(8)
```

**DO**:

```dart
borderRadius: BorderRadius.circular(AppRadius.m)
```

Available radius:

- `AppRadius.xs` = 2
- `AppRadius.s` = 4
- `AppRadius.m` = 8
- `AppRadius.l` = 12
- `AppRadius.xl` = 16
- `AppRadius.xxl` = 20

### Rule 4: Bottom Sheet Standard Structure

```dart
await Get.bottomSheet(
  YourModalWidget(),
  isScrollControlled: true,
  backgroundColor: Colors.white,
  shape: const RoundedRectangleBorder(
    borderRadius: BorderRadius.vertical(
      top: Radius.circular(AppRadius.xxl),
    ),
  ),
);
```

---

## 🚫 Banned Patterns

### Never Use These:

1. ❌ `AlertDialog` - Use `Get.bottomSheet` + `VnRTopModal`
2. ❌ `showDialog` - Use `Get.dialog(VnRConfirmDialog(...))`
3. ❌ `ElevatedButton` / `TextButton` - Use `VnRButton`
4. ❌ `SnackBar` - Use `VnRSnackbar.show*`
5. ❌ Direct Colors (hex, `Color(0xFF...)`, `Colors.grey`) - Use `context.*` colors
6. ❌ `withOpacity()` - Use `withValues(alpha: ...)`
7. ❌ Hardcoded spacing/radius numbers - Use `AppSpacing.*` / `AppRadius.*`

**Exception cho `Colors.white`:**

`Colors.white` được phép dùng **CHỈ** cho `backgroundColor` của bottom sheet và dialog overlay — vì đây là overlay màu cố định, không thuộc về theme:

```dart
// ✅ OK — Colors.white cho overlay background
await Get.bottomSheet(
  MyModal(),
  isScrollControlled: true,
  backgroundColor: Colors.white,  // ← exception cho phép
);

// ❌ KHÔNG OK — Colors.white cho widget content
Container(color: Colors.white)   // ← phải dùng context.white
Text('...', style: TextStyle(color: Colors.white))  // ← phải dùng context.white
```

---

## 📋 Pre-Implementation Checklist

Before creating any UI component, verify:

- [ ] Using VnR widgets (not standard Flutter widgets)
- [ ] Using `context.*` for colors
- [ ] Using `context.*` for typography
- [ ] Using `AppSpacing.*` for spacing
- [ ] Using `AppRadius.*` for border radius
- [ ] Using `Get.bottomSheet` for modals (not AlertDialog)
- [ ] Using `VnRTopModal` for bottom sheet headers
- [ ] Using `VnRListActionBar` for action buttons
- [ ] Using `VnRButton` for all buttons
- [ ] Using `VnRSnackbar` for notifications
- [ ] All strings use `.tr` translation
- [ ] No hardcoded colors/sizes

---

## 🔍 Code Review Checklist

Reviewers must verify:

- [ ] No `AlertDialog` usage
- [ ] No `ElevatedButton` / `TextButton` usage
- [ ] No direct `Colors.*` usage
- [ ] No `withOpacity()` (use `withValues()`)
- [ ] All context theme extensions valid
- [ ] VnR widget patterns followed
- [ ] Spacing/radius constants used
- [ ] Bottom sheet follows standard structure

---

## 📚 Reference Examples

### Good Modal Example

See: `widgets/actions/eva_modal_submit_approval.dart`

Structure:

```dart
class EvaModalSubmitApproval extends StatefulWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      child: Column(
        children: [
          VnRTopModal(...),        // Header
          Divider(...),            // Separator
          Flexible(                // Content
            child: SingleChildScrollView(...),
          ),
          VnRListActionBar(...),   // Actions
        ],
      ),
    );
  }
}
```

### Good Error Modal Example

```dart
Get.dialog(
  VnRConfirmDialog(
    title: 'vnr_app_eva.validation.error_title'.tr,
    content: errors.join('\n'),
    confirmText: 'vnr_app.ok'.tr,
    isDestructive: true,
    onConfirm: () => Get.back(),
  ),
);
```

---

## 🛠️ Enforcement

**vnr-mobile-developer agent** will:

1. Reject code using banned patterns
2. Require VnR widgets for all UI
3. Validate theme usage
4. Check spacing/radius constants
5. Verify bottom sheet structure

**vnr-arch-reviewer agent** will:

- Flag violations in code reviews
- Mark as FAIL if VnR standards not met

---

**Last Updated**: 2026-04-14  
**Version**: 1.0
