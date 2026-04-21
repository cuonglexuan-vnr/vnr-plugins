# Mobile — Naming Conventions

**Applies to**: Flutter mobile app (`src/app-mobile/`)  
**Mandatory**: YES  
**Deep-dive khi cần** (không cần đọc mặc định — standards này đã tóm đủ để implement):
- `src/app-mobile/docs/guides/CODING_STANDARDS.md` — full coding conventions bao gồm Dart style, null safety, async patterns (đọc khi cần rule ngoài naming)

---

## File & Folder Naming

| Type | Pattern | Example |
|------|---------|---------|
| Dart files | `snake_case.dart` | `eva_goals_controller.dart` |
| Folders | `snake_case/` | `eva_goals/` |
| Classes | `PascalCase` | `EvaGoalsController` |
| Variables | `camelCase` | `isLoading` |
| Private members | `_camelCase` | `_initControllers()` |
| Enums | `PascalCase` | `ButtonType` |
| Enum values | `camelCase` | `ButtonType.primary` |

---

## File Naming Patterns

| Role | Pattern | Example |
|------|---------|---------|
| Controller | `{feature}_controller.dart` | `leave_request_controller.dart` |
| State | `{feature}_state.dart` | `leave_request_state.dart` |
| View/Page | `{feature}_page.dart` | `leave_request_page.dart` |
| Bindings | `{feature}_bindings.dart` | `leave_request_bindings.dart` |
| Model (Freezed) | `{model_name}.dart` | `leave_request.dart` |
| Repository interface | `{feature}_repository.dart` | `leave_request_repository.dart` |
| Repository impl | `{feature}_repository_impl.dart` | `leave_request_repository_impl.dart` |
| UseCase | `{verb}_{entity}.dart` | `get_leave_request_detail.dart` |
| Remote DataSource interface | `{feature}_remote_data_source.dart` | `leave_request_remote_data_source.dart` |
| Remote DataSource impl | `{feature}_remote_data_source_impl.dart` | `leave_request_remote_data_source_impl.dart` |
| Index (barrel) | `{feature}_index.dart` | `leave_request_index.dart` |

---

## UseCase Naming

Verb prefix chuẩn:

| Verb | Dùng khi | Example |
|------|---------|---------|
| `get_` | Fetch single entity | `get_leave_request_detail.dart` |
| `get_list_` | Fetch list | `get_list_leave_request.dart` |
| `create_` | Create entity | `create_leave_request.dart` |
| `update_` | Update entity | `update_leave_request.dart` |
| `delete_` | Delete entity | `delete_leave_request.dart` |
| `submit_` | Submit for approval | `submit_leave_request.dart` |
| `approve_` | Approve | `approve_leave_request.dart` |
| `reject_` | Reject | `reject_leave_request.dart` |

---

## Index Files (Barrel Exports)

**Mỗi feature folder MUST có một index file** để export public API.

```dart
// leave_request_index.dart

// ✅ Export public APIs
export 'controller/leave_request_controller.dart';
export 'state/leave_request_state.dart';
export 'view/leave_request_page.dart';
export 'bindings/leave_request_bindings.dart';
export 'domain/model/leave_request.dart';
export 'domain/repositories/leave_request_repository.dart';
export 'domain/usecases/get_leave_request_detail.dart';
export 'domain/usecases/get_list_leave_request.dart';
export 'domain/usecases/create_leave_request.dart';

// ❌ KHÔNG export internal implementations
// export 'data/repositories/leave_request_repository_impl.dart';
// export 'view/widgets/_internal_widget.dart';
```

---

## Translation Key Naming

Format: `{module}.{feature}.{key}`

```dart
// ✅ Correct — static string
Text('leave_request.form.title'.tr)
Text('leave_request.list.empty_state'.tr)
Text('common.cancel'.tr)
Text('common.confirm'.tr)

// ❌ Wrong
Text('Leave Request')        // hardcoded string
Text('leaveRequest.title')   // camelCase key (dùng snake_case)
```

### Strings có tham số — dùng `trParams`

Khi string cần embed giá trị động, dùng `@paramName` trong lang file và `.trParams({})` khi gọi.

**Lang file** — placeholder dùng `@`:

```dart
// vi.dart
'leave_request.form.max_length': 'Tối đa @maxLength ký tự',
'leave_request.list.selected_count': 'Đã chọn @count mục',
'leave_request.detail.month_year': 'Tháng @month năm @year',
'common.file.hint_other': 'File @ext không được hỗ trợ',
```

**Dart code** — gọi `.trParams({'key': value})`, value phải là `String`:

```dart
// ✅ Correct
Text('leave_request.form.max_length'.trParams({'maxLength': '500'}))
Text('leave_request.list.selected_count'.trParams({'count': selectedItems.length.toString()}))
Text('leave_request.detail.month_year'.trParams({
  'month': month.toString(),
  'year': year.toString(),
}))

// ❌ Wrong
Text('leave_request.form.max_length'.trParams({'maxLength': 500}))  // value phải là String, không phải int
Text('Tối đa 500 ký tự')                                            // hardcoded
```

File locations:
- `lib/modules/{module}/lang/vi.dart`
- `lib/modules/{module}/lang/en.dart`

---

## Class Naming Patterns

| Role | Pattern | Example |
|------|---------|---------|
| Controller | `{Feature}Controller` | `LeaveRequestController` |
| State | `{Feature}State` | `LeaveRequestState` |
| Page/View | `{Feature}Page` | `LeaveRequestPage` |
| Bindings | `{Feature}Bindings` | `LeaveRequestBindings` |
| Domain model | `{Entity}` | `LeaveRequest` |
| DTO | `{Entity}Dto` | `LeaveRequestDto` |
| Repository interface | `{Feature}Repository` | `LeaveRequestRepository` |
| Repository impl | `{Feature}RepositoryImpl` | `LeaveRequestRepositoryImpl` |
| DataSource interface | `{Feature}RemoteDataSource` | `LeaveRequestRemoteDataSource` |
| DataSource impl | `{Feature}RemoteDataSourceImpl` | `LeaveRequestRemoteDataSourceImpl` |
| UseCase | `{VerbEntity}` | `GetLeaveRequestDetail`, `CreateLeaveRequest` |
| Modal widget | `{Feature}Modal` | `LeaveRequestFormModal` |
| Internal widget | `_{Feature}Widget` hoặc file đặt trong `view/widgets/` | |

---

**Last Updated**: 2026-04-15  
**Version**: 1.0
