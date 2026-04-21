# Mobile — API Integration & Module Patterns

**Applies to**: Flutter mobile app (`src/app-mobile/`)  
**Mandatory**: YES — Lấy từ source code thực tế của module Eva  
**Source của truth**: `src/app-mobile/lib/modules/eva/`

> ⚠️ File này document patterns **thực tế trong codebase**, không phải lý thuyết.  
> Agent PHẢI đọc file này trước khi implement bất kỳ API call hoặc module mới nào.

---

## 1. API Call Pattern — `HttpService.dio`

### Cách gọi API chuẩn

**KHÔNG** dùng Dio trực tiếp hay tạo HTTP client riêng. Dùng `HttpService.dio`:

```dart
import 'package:vnr_super_hrm/shared/utils/http_service.dart';

// GET
final response = await HttpService.dio.get(
  '/proxy/{module}/api/v1/{Controller}/{action}',
  queryParameters: {'Key': 'value'},
);

// POST
final response = await HttpService.dio.post(
  '/proxy/{module}/api/v1/{Controller}/{action}',
  body: {'Key': 'value'},
);

// DELETE
final response = await HttpService.dio.delete(
  '/proxy/{module}/api/v1/{Controller}/{id}',
  body: {},
);
```

### URL Format

```
/proxy/{module}/api/v1/{Controller}/{action}

Ví dụ thực tế:
/proxy/eva/api/v1/Cat_GoalPeriod/year_period
/proxy/eva/api/v1/Eva_GoalResult/overview_chart
/proxy/eva/api/v1/Eva_Goal/ConfirmApprove
/proxy/eva/api/v1/Eva_Goal/SendMail
/proxy/shared/api/v1/Dynamic/GetDataSourceByDynamicStore
```

### Response Parsing — Wrapper chuẩn `{Status, Data}`

**Mọi response** từ backend đều có format:

```dart
{
  'Status': 'SUCCESS' | 'ERROR',
  'Data': [...] | {...} | null,
  'Message': '...',   // khi có lỗi
}
```

**Pattern xử lý bắt buộc nhất quán:**

```dart
// 1. List response — trả về empty list khi fail, KHÔNG throw
if (response != null && response['Status'] == 'SUCCESS') {
  final List<dynamic> data = response['Data'] as List<dynamic>;
  return data.map((json) => MyModel.fromJson(json)).toList();
}
return [];   // ← trả về [] khi fail, không throw

// 2. Action response (POST mutation) — luôn trả về ResponseApi dù fail
final response = await HttpService.dio.post('/proxy/...', body: {...});
if (response != null && response['Status'] == 'SUCCESS') {
  return ResponseApi.fromJson(response);
}
return ResponseApi.fromJson(response);  // ← vẫn fromJson dù fail, caller tự check

// 3. Single object response — trả về empty/const object khi không có data
if (response.data.total <= 0 || response.data.data.isEmpty) {
  return const MyModel(raw: {});  // ← empty object, không throw
}
```

**Quy tắc chọn:**

| Loại response | Khi fail |
|---|---|
| List data | `return []` |
| Action/mutation (POST) | `return ResponseApi.fromJson(response)` |
| Single detail fetch | `return const MyModel(raw: {})` |
| ❌ Không bao giờ | `throw Exception(...)` từ repository |

### `ResponseApi` — import từ domain package

```dart
import 'package:domain/model/response/response_api.dart';
```

---

## 2. DI Pattern — 2 loại trong Eva

Eva dùng **2 pattern DI khác nhau** tùy độ phức tạp:

### Pattern A — Simple: Controller tự khởi tạo Repository

Dùng khi feature đơn giản (list read-only, không có form/action phức tạp).

```dart
// Bindings — chỉ register Controller
class EvaResultsBindings extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<EvaResultsController>(() => EvaResultsController());
  }
}

// Controller — tự new Repository
class EvaResultsController extends GetxController with MSControllerMixin {
  final EvaResultsRepository _repository = EvaResultsRepositoryImpl();
  // ...
}
```

### Pattern B — Full Chain: Bindings inject toàn bộ

Dùng khi feature có DataSource riêng, UseCase, hoặc cần DI đầy đủ (form, approve/reject/create).

```dart
class EvaAssignGoalsDetailBindings extends Bindings {
  @override
  void dependencies() {
    Get.lazyPut<VnRListApiService>(() => VnRListApiService());
    Get.lazyPut<EvaAssignGoalDetailRemoteDataSource>(
      () => EvaAssignGoalDetailRemoteDataSourceImpl(Get.find()),
    );
    Get.lazyPut<EvaAssignGoalDetailRepository>(
      () => EvaAssignGoalDetailImpl(Get.find()),
    );
    Get.lazyPut(() => EvaAssignGoalGetDetail(Get.find()));
    Get.lazyPut<EvaAssignGoalsDetailController>(
      () => EvaAssignGoalsDetailController(Get.find()),
    );
  }
}
```

### `Get.isRegistered` — Khi shared service được dùng ở nhiều Bindings

Một số service (VnRListApiService, GoalRepository) được share giữa nhiều Bindings trong cùng một route. Dùng `Get.isRegistered` để tránh đăng ký lại:

```dart
// ✅ Dùng khi service có thể đã được register bởi Bindings khác
if (!Get.isRegistered<GoalRepository>()) {
  Get.lazyPut<GoalRepository>(() => GoalRepositoryImpl());
}
if (!Get.isRegistered<GetGoalFilesById>()) {
  Get.lazyPut(() => GetGoalFilesById(Get.find()));
}
```

**Quy tắc chọn pattern:**

| Điều kiện | Pattern |
|-----------|---------|
| List view only, không có mutation | A |
| Có form create/edit | B |
| Có approve/reject/action | B |
| Controller có ctor args (usecase/repo) | B |
| Controller có empty ctor | A |
| Service dùng ở nhiều bindings trong cùng route | B + `Get.isRegistered` |

---

## 3. DataSource Pattern — `VnRListApiService`

Khi dùng dynamic store (list view từ config), DataSource dùng `VnRListApiService`.

### Hai loại endpoint dynamic store

```dart
// Endpoint module-specific (dùng cho data của module đó)
'/proxy/eva/api/v1/Eva_GoalResult/overview_chart'

// Endpoint shared dynamic store (dùng khi list view cần stored procedure chung)
'/proxy/shared/api/v1/Dynamic/GetDataSourceByDynamicStore'
'/proxy/shared/api/v1/Dynamic/GetDataSourceByStandardStore'
```

**Khi nào dùng shared endpoint?**  
Khi `listApiConfig.baseUrl` được override sang `/proxy/shared/...` trong config. Không tự đoán — lấy từ `getAllConfig(keyStore).listApiConfig.baseUrl`.

### Merge `defaultDataFormSearch` — PHẢI dùng spread

```dart
// ✅ Đúng — merge, giữ lại filter mặc định từ config
final apiConfig = config.listApiConfig.copyWith(
  defaultDataFormSearch: {
    ...config.listApiConfig.defaultDataFormSearch,  // ← spread trước
    'sp_period_id': periodId,                        // ← thêm override sau
    'period_type': 'MONTH',
  },
);

// ❌ Sai — overwrite toàn bộ defaultDataFormSearch, mất filter mặc định
final apiConfig = config.listApiConfig.copyWith(
  defaultDataFormSearch: {'sp_period_id': periodId},
);
```

### DataSource implementation

```dart
import 'package:vnr_widgets/call_api_service/vnr_list_api_service.dart';

class MyFeatureRemoteDataSourceImpl implements MyFeatureRemoteDataSource {
  final VnRListApiService apiService;

  MyFeatureRemoteDataSourceImpl(this.apiService);

  @override
  Future<MyModel> fetchDetail({
    required VnRListApiConfig apiConfig,
    required String id,
  }) async {
    final request = apiConfig.createRequest(
      page: 1,
      pageSize: 50,
      additionalDataFormSearch: {
        ...apiConfig.defaultDataFormSearch,
        'Id': id,
      },
    );

    final response = await apiService.fetchDataDynamic<Map<String, dynamic>>(
      request: request,
      fromJsonT: (j) => (j as Map).cast<String, dynamic>(),
    );

    if (response.data.total <= 0 || response.data.data.isEmpty) {
      return const MyModel(raw: {});
    }

    return MyModel(raw: response.data.data.first);
  }
}
```

---

## 4. UseCase Pattern

UseCase trong Eva là class đơn giản với `call()`:

```dart
class EvaAssignGoalGetDetail {
  final EvaAssignGoalDetailRepository repository;

  const EvaAssignGoalGetDetail(this.repository);

  Future<EvaAssignGoalDetailRecord> call(String goalId, String keyStore) {
    return repository.getGoalDetail(goalId: goalId, keyStore: keyStore);
  }
}
```

- **Không** extend base class UseCase
- Constructor nhận repository qua DI
- Method tên `call()` để dùng như function: `await useCase(id, key)`

---

## 5. Freezed Model Pattern

Tất cả domain model dùng `@freezed` với `@JsonKey` cho PascalCase fields từ API:

```dart
import 'package:freezed_annotation/freezed_annotation.dart';

part 'my_model.freezed.dart';
part 'my_model.g.dart';

@freezed
class MyModel with _$MyModel {
  @JsonSerializable(explicitToJson: true)
  const factory MyModel({
    @JsonKey(name: 'Id') required String id,
    @JsonKey(name: 'Name') String? name,
    @JsonKey(name: 'Status') String? status,
  }) = _MyModel;

  factory MyModel.fromJson(Map<String, dynamic> json) =>
      _$MyModelFromJson(json);
}
```

> **Lưu ý**: API response dùng `PascalCase` (`Id`, `Name`, `Status`) — phải map qua `@JsonKey(name: 'Id')`.

---

## 6. EvaConfigMixin — Dynamic Config

Với các tính năng dùng dynamic store (list view cấu hình từ JSON), Repository kế thừa `EvaConfigMixin`:

```dart
import 'package:vnr_super_hrm/modules/eva/config/eva_config_loader.dart';

class MyRepositoryImpl with EvaConfigMixin implements MyRepository {
  @override
  Future<MyModel> getData({required String id, required String keyStore}) async {
    // keyStore là key trong eva_config.json, ví dụ: 'sp_GetGoalResultGrid'
    final gridConfig = await getAllConfig(keyStore);
    return remote.fetchDetail(
      apiConfig: gridConfig.listApiConfig,
      id: id,
    );
  }
}
```

Controller dùng `EvaConfigMixin` để load config và tạo list controller:

```dart
class MyController extends GetxController with MSControllerMixin, EvaConfigMixin {
  Future<void> initList() async {
    final config = await getAllConfig('sp_MyStoreKey');
    final apiConfig = config.listApiConfig.copyWith(
      defaultDataFormSearch: {
        ...config.listApiConfig.defaultDataFormSearch,
        'FilterKey': 'value',
      },
    );
    // tạo VnRApiListController từ config
  }
}
```

---

## 7. Module Registration Pattern

Mỗi module kế thừa `ModuleConfig` và đăng ký routes + translations:

```dart
import 'package:vnr_super_hrm/shared/module/module_config.dart';

class MyModule extends ModuleConfig {
  @override
  String get moduleName => 'my_module';

  @override
  String get moduleVersion => '1.0.0';

  @override
  String get moduleDescription => 'Mô tả module';

  @override
  bool get isRequired => false;

  @override
  List<String> get dependencies => [];

  @override
  List<GetPage> get routes => [
    GetPage(
      name: MyRoutes.root,
      page: () => const MyRootPage(),
      bindings: [
        MyBindings(),
      ],
      middlewares: [EnsureAuthMiddleware()],
    ),
    GetPage(
      name: MyRoutes.detail,
      page: () => const MyDetailPage(),
      bindings: [MyDetailBindings()],
      middlewares: [EnsureAuthMiddleware()],
    ),
  ];

  @override
  Map<String, Map<String, String>> get translations =>
      MyTranslations.translations;

  @override
  Map<String, String> get deepLinkMappings => {
    '/my_module': MyRoutes.root,
    '/my_module/detail': MyRoutes.detail,
  };

  @override
  Future<void> initialize() async {
    // Khởi tạo config loader nếu cần
  }

  @override
  Future<void> dispose() async {}

  @override
  bool canLoad() => true;
}
```

### Routes class

```dart
class MyRoutes {
  MyRoutes._();
  static const root = '/my_module';
  static const detail = '/my_module/detail';
}
```

---

## 8. Module Imports — `eva_imports.dart` Pattern

Mỗi module có 1 file import tổng hợp:

```dart
// lib/modules/my_module/my_module_imports.dart
export 'pages/feature_a/feature_a_index.dart';
export 'pages/feature_b/feature_b_index.dart';
export 'my_module_module.dart';
export 'lang/my_module_translations.dart';
export 'shared/my_module_shared_index.dart';
```

Tất cả file trong module chỉ cần import 1 dòng:

```dart
import 'package:vnr_super_hrm/modules/my_module/my_module_imports.dart';
```

---

## 9. Translation — 3 Format tồn tại trong Eva

Eva có **legacy key formats** — codebase có 3 format khác nhau do lịch sử:

```dart
// ❌ Format cũ (legacy — KHÔNG dùng cho feature mới)
'vnr_app_eva_Hrm_Delete': 'Xóa'        // underscore + PascalCase
'objEval.GoalPeriod.GoalType': '...'   // không có module prefix

// ✅ Format chuẩn (dùng cho feature mới)
'vnr_app_eva.{feature}.{key}': '...'  // dot separator, all lowercase
// Ví dụ:
'vnr_app_eva.goals.select_time': 'Chọn chu kỳ'
'vnr_app_eva.results.period_name': 'Chu kỳ mục tiêu'
```

**Quy tắc bắt buộc với legacy keys:**

- ❌ **KHÔNG đổi tên / xóa key legacy** — code đang dùng ở nhiều chỗ sẽ mất text
- ❌ **KHÔNG tạo key trùng nghĩa** với key legacy đã có (gây duplicate)
- ✅ **Khi thêm text mới** → tạo key mới theo format chuẩn
- ✅ **Khi cần dùng lại text đã có** → dùng đúng key cũ đó, không tạo key mới

Translation class:

```dart
// lang/eva_translations.dart
class EvaTranslations {
  static Map<String, Map<String, String>> get translations => {
    'vi': vi,
    'en': en,
  };
}
```

---

## 10. View Pattern — `GetView` + `Obx`

```dart
import 'package:flutter/material.dart';
import 'package:get/get.dart';
import 'package:theme/app_theme.dart';        // context.* theme extensions
import 'package:vnr_super_hrm/modules/eva/eva_imports.dart';
import 'package:vnr_widgets/vnr_widgets.dart'; // VnR widgets

class MyFeaturePage extends GetView<MyController> {
  const MyFeaturePage({super.key});

  @override
  Widget build(BuildContext context) {
    return Scaffold(
      appBar: AppBar(
        title: Text(
          'vnr_app_eva.my_feature.title'.tr,
          style: context.title2,
        ),
      ),
      body: Obx(() {
        if (controller.isLoading.value) {
          return const Center(child: CircularProgressIndicator());
        }

        if (controller.state.items.isEmpty) {
          return const VnRListEmpty(title: 'Không có dữ liệu');
        }

        return Column(
          children: [
            Expanded(
              child: ListView.builder(
                itemCount: controller.state.items.length,
                itemBuilder: (_, i) => MyItemWidget(controller.state.items[i]),
              ),
            ),
            // Action bar nếu có actions
            if (controller.state.listActions.isNotEmpty)
              VnRListActionBar(
                actions: controller.state.listActions,
                selectedItems: controller.state.selectedItems,
                isVisibleCount: false,
                isVisible: true,
                onActionPressed: (action) =>
                    action.onPressed(controller.state.selectedItems),
              ),
          ],
        );
      }),
    );
  }
}
```

---

## 11. `AppCredential` — Lấy thông tin user hiện tại

```dart
import 'package:data/data.dart';

// Lấy user session
final user = AppCredential.currentSession.user;
final userId = user?.id;
final userName = user?.fullName;
```

---

## Quick Reference — Checklist trước khi implement

**API:**
- [ ] URL format `/proxy/{module}/api/v1/{Controller}/{action}`
- [ ] Gọi qua `HttpService.dio` — không dùng Dio trực tiếp
- [ ] List response: check `Status == 'SUCCESS'`, fail → `return []`
- [ ] Action response: luôn `return ResponseApi.fromJson(response)` dù fail
- [ ] Merge `defaultDataFormSearch` bằng spread `{...config.defaultDataFormSearch, ...overrides}`
- [ ] Dynamic store URL lấy từ config, không hardcode `/proxy/shared/...`

**DI & Bindings:**
- [ ] List read-only → Pattern A (controller tự new repo)
- [ ] Có form/action → Pattern B (full chain qua Bindings)
- [ ] Controller có ctor args → dùng `Get.lazyPut(() => MyController(Get.find()))`
- [ ] Shared service giữa nhiều Bindings → `Get.isRegistered<T>()` check trước

**Model:**
- [ ] Dùng `@freezed` + `@JsonKey(name: 'PascalCase')` cho API fields
- [ ] Có `part 'xxx.freezed.dart'` và `part 'xxx.g.dart'`

**Module:**
- [ ] Kế thừa `ModuleConfig`, khai báo `routes` + `translations` + `deepLinkMappings`
- [ ] Có file `{module}_imports.dart` tổng hợp exports

**Translation:**
- [ ] Key mới: `vnr_app_{module}.{feature}.{key}` — dot separator, all lowercase
- [ ] KHÔNG đổi/xóa key legacy đang tồn tại
- [ ] KHÔNG tạo key mới trùng nghĩa với key legacy

**Lifecycle:**
- [ ] Dùng `onClose()` (không phải `dispose()`) để cleanup
- [ ] `super.onClose()` ở cuối `onClose()`
- [ ] Dispose đủ: TabController, VnR list controllers, State controllers, ConfigMixin

---

**Last Updated**: 2026-04-15  
**Version**: 1.0  
**Source**: Extracted from `src/app-mobile/lib/modules/eva/`
