# Mobile — Architecture & Structure Standards

**Applies to**: Flutter mobile app (`src/app-mobile/`)  
**Mandatory**: YES  
**Deep-dive khi cần** (không cần đọc mặc định — standards này đã tóm đủ để implement):
- `src/app-mobile/docs/architecture/PROJECT_OVERVIEW.md` — module system, super app structure (đọc khi onboard hoặc thêm module mới)
- `src/app-mobile/docs/guides/DIRECTORY_STRUCTURE.md` — full folder tree chi tiết (đọc khi không chắc path)
- `src/app-mobile/docs/architecture/getxDocArchitect.md` — GetX tutorial có ví dụ Todo (đọc khi cần ví dụ đầy đủ)

---

## Clean Architecture (3 Layers)

Tuân thủ Clean Architecture của Uncle Bob — dependencies chỉ được point **inward** (outer → inner).

```
Presentation → Domain ← Data
     ↓            ↑        ↓
   Bindings   Usecases  Repositories
                  ↑
              Entities
```

### Folder structure mỗi feature

```
pages/<feature>/
├── domain/
│   ├── model/                 # Freezed entities (business objects)
│   ├── repositories/          # Abstract interfaces
│   └── usecases/              # Business logic use cases
├── data/
│   ├── datasources/           # API calls (remote_data_source.dart)
│   ├── models/                # DTOs (nếu khác domain model)
│   └── repositories/          # Repository implementations
├── bindings/                  # Dependency Injection setup
├── controller/                # GetX controllers
├── state/                     # Reactive state (Rx variables)
├── view/                      # UI pages/screens
└── widgets/                   # Reusable UI components
```

---

## Layer Rules

### Domain Layer — Pure Dart, NO Flutter

```
pages/<feature>/domain/
├── model/
├── repositories/
└── usecases/
```

| Rule | Detail |
|------|--------|
| ✅ Pure Dart only | Không import `package:flutter` |
| ✅ Abstract interfaces | Repository là interface, không phải implementation |
| ✅ Freezed models | Entities dùng `@freezed` |
| ✅ One usecase per action | Mỗi API action có đúng 1 usecase riêng |
| ❌ NEVER import | Dio, HTTP clients, Flutter packages |
| ❌ NEVER contain | Implementation details |

### Data Layer — Implementation Details

```
pages/<feature>/data/
├── datasources/
├── models/
└── repositories/
```

| Rule | Detail |
|------|--------|
| ✅ Implement domain repository interfaces | |
| ✅ Handle API serialization/deserialization | |
| ✅ Transform Models ↔ Entities | |
| ✅ Handle network errors | |

### Presentation Layer — UI + State

```
pages/<feature>/
├── bindings/
├── controller/
├── state/
├── view/
└── widgets/
```

| Rule | Detail |
|------|--------|
| ✅ Controller gọi usecases từ Domain | Không gọi trực tiếp Repository/DataSource |
| ✅ State chứa reactive variables (`.obs`) | Tách biệt khỏi Controller |
| ✅ View chỉ render | Không chứa business logic |
| ✅ Bindings setup toàn bộ DI chain | |

---

## GetX Patterns

GetX cung cấp 3 trụ cột:
1. **State Management**: Reactive programming với `.obs`, `Obx`, `GetBuilder`
2. **Route Management**: `Get.toNamed`, deep linking, middlewares
3. **Dependency Injection**: `Bindings`, `Get.lazyPut`, `Get.find`

### Controller + State Pattern

```dart
// State class — chứa tất cả observables
class MyState {
  final RxBool isLoading = false.obs;
  final RxList<MyData> items = <MyData>[].obs;
}

// Controller — business logic coordinator
class MyController extends GetxController with MSControllerMixin {
  final state = MyState();
  final GetMyData getMyData; // usecase injected

  MyController(this.getMyData);

  Future<void> loadData() async {
    state.isLoading.value = true;
    showLoading();
    try {
      state.items.value = await getMyData();
    } catch (e) {
      VnRSnackbar.showError('Lỗi tải dữ liệu');
    } finally {
      state.isLoading.value = false;
      hideLoading();
    }
  }
}

// View — chỉ render
class MyPage extends GetView<MyController> {
  @override
  Widget build(BuildContext context) {
    return Scaffold(
      body: Obx(() {
        if (controller.state.isLoading.value) return const LoadingWidget();
        return ListView(
          children: controller.state.items.map((e) => MyItemWidget(e)).toList(),
        );
      }),
    );
  }
}
```

### Bindings Pattern

Bindings phải inject **đủ chuỗi**: DataSource → Repository → UseCase → Controller.

```dart
class FeatureBindings extends Bindings {
  @override
  void dependencies() {
    // Data layer
    Get.lazyPut<FeatureRemoteDataSource>(
      () => FeatureRemoteDataSourceImpl(),
    );
    Get.lazyPut<FeatureRepository>(
      () => FeatureRepositoryImpl(remote: Get.find()),
    );
    // Domain layer (one per action)
    Get.lazyPut(() => GetFeatureList(Get.find()));
    Get.lazyPut(() => CreateFeature(Get.find()));
    Get.lazyPut(() => UpdateFeature(Get.find()));
    Get.lazyPut(() => DeleteFeature(Get.find()));
    // Presentation layer
    Get.lazyPut(() => FeatureController(
      Get.find(), Get.find(), Get.find(), Get.find(),
    ));
  }
}
```

### Controller Pattern cho VnR Widgets

Tất cả VnR input/dropdown/picker dùng Controller pattern. Khởi tạo trong State, lifecycle quản lý bởi Controller.

```dart
// 1. Khai báo trong State
class MyFormState {
  late final VnRInputTextController nameController;
  late final VnRDropdownController<String> typeController;
  late final VnRDatePickerController dateController;

  void initControllers() {
    nameController = VnRInputTextController(
      label: 'Tên',
      isRequired: true,
      textEditingController: TextEditingController(),
    );
    typeController = VnRDropdownController<String>(
      label: 'Loại',
      dataLocal: const [],
    );
    dateController = VnRDatePickerController(
      type: VnRDatePickerType.date,
      label: 'Ngày',
    );
  }

  void dispose() {
    nameController.dispose();
    typeController.dispose();
    dateController.dispose();
  }
}

// 2. Lifecycle trong Controller
class MyFormController extends GetxController {
  final state = MyFormState();

  @override
  void onInit() {
    super.onInit();
    state.initControllers();
  }

  @override
  void onClose() {
    state.dispose();
    super.onClose();
  }
}
```

---

## Strict Rules

| Rule | Detail |
|------|--------|
| ✅ State class riêng | Tách Rx variables khỏi Controller |
| ✅ Bindings for DI | Không dùng `Get.put` trực tiếp trong controllers |
| ✅ GetView for pages | Auto-inject controller |
| ✅ MSControllerMixin | Sử dụng cho toast/loading helpers |
| ✅ One usecase per action | `domain/usecases/` phải thể hiện đủ tất cả actions |
| ❌ Controller không khởi tạo trực tiếp | Repository/DataSource phải qua Bindings |

---

## Bottom Sheet Standard Structure

```dart
// Mở bottom sheet
await Get.bottomSheet(
  const YourModalWidget(),
  isScrollControlled: true,
  backgroundColor: Colors.white,   // Colors.white là exception cho phép
  // shape là optional — thêm nếu muốn rounded corners
  shape: const RoundedRectangleBorder(
    borderRadius: BorderRadius.vertical(
      top: Radius.circular(AppRadius.xxl),
    ),
  ),
);
```

> **Về `shape`**: optional, không bắt buộc. Khi thêm feature mới, follow style của feature xung quanh trong cùng module để nhất quán.

// Modal widget
class YourModal extends StatelessWidget {
  @override
  Widget build(BuildContext context) {
    return Container(
      constraints: BoxConstraints(
        maxHeight: MediaQuery.of(context).size.height * 0.7,
      ),
      child: Column(
        mainAxisSize: MainAxisSize.min,
        children: [
          VnRTopModal(
            title: 'modal.title'.tr,
            type: VnRTopModalType.label,
            onClose: () => Navigator.of(context).pop(),
          ),
          Divider(color: context.borderColor, height: 0.5),
          Flexible(
            child: SingleChildScrollView(
              padding: const EdgeInsets.all(AppSpacing.xl),
              child: /* content */,
            ),
          ),
          VnRListActionBar(
            actions: [
              VnRListAction(
                label: 'common.cancel'.tr,
                styleButton: VnRListActionType.secondary,
                onPressed: (_) => Navigator.pop(context),
              ),
              VnRListAction(
                label: 'common.confirm'.tr,
                styleButton: VnRListActionType.primary,
                onPressed: (_) => handleConfirm(),
              ),
            ],
          ),
        ],
      ),
    );
  }
}
```

---

## Lifecycle & Disposal Rules

GetX controller có 2 hook: `onInit` và `onClose`. **Không dùng `dispose()` thay cho `onClose()`**.

```dart
class MyController extends GetxController with MSControllerMixin, EvaConfigMixin {
  late TabController tabController;

  @override
  void onInit() {
    super.onInit();
    tabController = TabController(length: 3, vsync: ...);
    state.initControllers();   // VnR widget controllers
    _loadData();
  }

  @override
  void onClose() {
    // 1. Dispose TabController / AnimationController
    tabController.dispose();

    // 2. Dispose nested VnR list controllers
    state.listController.value?.onClose();

    // 3. Dispose VnR input/dropdown/picker controllers (trong State)
    state.dispose();

    // 4. Dispose EvaConfigMixin nếu dùng
    onCloseEvaConfigLoader();

    super.onClose();  // ← PHẢI gọi cuối
  }
}
```

**Quy tắc:**

| Object | Cách dispose |
|--------|-------------|
| `TabController` | `.dispose()` trong `onClose()` |
| `VnRApiListController` | `.onClose()` trong `onClose()` |
| `VnRInputTextController` / `VnRDropdownController` | `.dispose()` trong `State.dispose()`, gọi từ `onClose()` |
| `EvaConfigMixin` | `onCloseEvaConfigLoader()` trong `onClose()` |
| ❌ KHÔNG | Override `dispose()` của StatefulWidget trong GetX controller |

---

Tất cả strings hiển thị ra UI **MUST** dùng `.tr`:

```dart
Text('module.key'.tr)
```

- Vietnamese: `lib/modules/{module}/lang/vi.dart`
- English: `lib/modules/{module}/lang/en.dart`

---

## Pre-Implementation Checklist

Trước khi viết bất kỳ code nào:

- [ ] Đọc `vnr-plugin/standards/mobile/01-vnr-app-ui-standards.md`
- [ ] Đọc `vnr-plugin/standards/mobile/02-architecture-and-structure.md` (file này)
- [ ] Đọc `vnr-plugin/standards/mobile/03-naming-conventions.md`
- [ ] Đọc `vnr-plugin/standards/mobile/04-api-and-module-patterns.md` ← **bắt buộc trước khi gọi API**
- [ ] Đọc `vnr-plugin/standards/mobile/05-dynamic-form-and-permissions.md` ← **khi có form create/edit hoặc check phân quyền**
- [ ] Domain layer: không import Flutter/Dio
- [ ] Mỗi API action có 1 usecase riêng
- [ ] State class tách biệt khỏi Controller
- [ ] Bindings: chọn Pattern A (simple) hoặc Pattern B (full chain) đúng với độ phức tạp
- [ ] API gọi qua `HttpService.dio`, URL format `/proxy/{module}/api/v1/...`
- [ ] Response check `response['Status'] == 'SUCCESS'`
- [ ] Model dùng `@freezed` + `@JsonKey(name: 'PascalCase')`
- [ ] VnR widgets controller khởi tạo trong State, lifecycle trong Controller
- [ ] Tất cả strings dùng `.tr`, key format `vnr_app_{module}.{feature}.{key}`
- [ ] Bottom sheet theo đúng structure chuẩn

**Nếu bất kỳ check nào fail → STOP và fix trước khi tiếp tục.**

---

**Last Updated**: 2026-04-15  
**Version**: 1.0
