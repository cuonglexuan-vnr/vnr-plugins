# Vnr Backend — Internal Framework & Request Flow

---

## 1. Tổng quan kiến trúc tầng Presentation → Business → Data

```
Browser / Angular MFE
    │
    ▼
[Presentation Layer]   HRM.Presentation.Main / HRM.Presentation.*.Service
    ASP.NET MVC 5 Controllers  ─── ActionService ─── RestServiceClient
    │
    ▼
[Business Layer]       HRM.Business.<Module>.Domain
    *Services classes (e.g. Hre_CommonServices, Att_CommonServices)
    │
    ▼
[Data Layer]           HRM.Data.BaseRepository
    UnitOfWork  ─── VnrHrmDataContext (EF6 DbContext)
    │
    ▼
SQL Server  (Stored Procedures là nguồn sự thật cho mọi query phức tạp)
```

---

## 2. Controller Hierarchy

```
System.Web.Mvc.Controller
    └── HrmMvcController                [HRM.Infrastructure.Utilities]
            └── BaseController          [HRM.Presentation.Service]
                    └── *Controller     (domain controllers — Hre_, Att_, Sal_, v.v.)
```

### `HrmMvcController` (`HRM.Infrastructure.Utilities/HrmMvcController.cs`)
- Override `Json()` → bỏ giới hạn 4MB (`MaxJsonLength = Int32.MaxValue`).
- Override `OnResultExecuted` (CORS hook — hiện commented out).

### `BaseController` (`HRM.Presentation.Service/BaseController.cs`)
- `OnActionExecuting`: set `LanguageCode`, cấu hình tenant log path từ `HrmClaims.TenantCode`.
- Lấy identity từ HTTP headers: `HeaderObject.UserLogin`, `HeaderObject.LanguageCode`, `HeaderObject.UserID`.
- Tạo `ActionService` per-request.

**Các method helper chính của `BaseController`:**

| Method | Mục đích |
|--------|---------|
| `GetListDataAndReturn<TModel,TEntity,TSearch>` | Fetch danh sách cho Kendo Grid (main pattern) |
| `New_GetListDataAndReturn` | Variant với cơ chế mới hơn |
| `GetListDataAndReturnDynamicCol` | Variant hỗ trợ dynamic columns |
| `GetDatatable` | Variant trả DataTable |
| `GetData` / `GetDataForControl` | Fetch single record hoặc dropdown data |
| `ExportSelectedAndReturn` / `ExportAllAndReturn` | Luồng xuất Excel |
| `RemoveOrDeleteAndReturn<TModel>` | Soft-delete hoặc hard-delete |
| `ExecuteQuery` | Chạy query trực tiếp |
| `CheckPermission` / `SysPermissionCheck` | Kiểm tra UI-level privilege |
| `ExtractFilterAttributes` | Parse Kendo `DataSourceRequest` → FilterAttribute list |
| `ExtractSortAttributes` | Parse Kendo sort → SortAttribute list |
| `ExtractAdvanceFilterAttributes` | Parse domain-specific advance filters |

### `MainBaseController` (`HRM.Presentation.Main/Controllers/MainBaseController.cs`)
Controller base riêng của web app chính, đọc identity từ **Session** thay vì header:

| Property | Session Key |
|----------|------------|
| `UserLogin` | `SessionObjects.LoginUserName` |
| `UserId` | `SessionObjects.UserId` |
| `LanguageCode` | `SessionObjects.LanguageCode` |
| `IsSupperAdmin` | `SessionObjects.IsSupperAdmin` |

Các variant controller khác: `BasePortalController` (EmpPortal), `BaseApiController` (ServiceCenter).

---

## 3. Luồng Request đầy đủ — Read (Kendo Grid)

```
Browser (Kendo Grid)
    │  GET /Hre_Profile/GetListData?page=1&pageSize=50&filters=...
    ▼
[1] *Controller.GetListData(DataSourceRequest request, TSearch model)
    │  inherits BaseController
    │
    ├── OnActionExecuting: LanguageCode, tenant config
    ├── ExtractFilterAttributes(request)      → List<FilterAttribute>
    ├── ExtractSortAttributes(request)        → List<SortAttribute>
    ├── ExtractAdvanceFilterAttributes(model) → List<FilterAttribute>
    │
    └── GetListDataAndReturn<TModel, TEntity, TSearch>(request, model, "hrm_xxx_sp_get_Xxx")
            │
            ├── new ActionService(UserLogin, LanguageCode)
            │
[2]         └── ActionService.GetData<TEntity>(ListQueryModel, storeName, ref status)
                    │
                    └── new BaseService(UserID, UserLogin)
                            │
[3]                         └── BaseService.GetData<TEntity>(...)
                                    │
                                    └── using (VnrHrmDataContext context)
                                            │
[4]                                         └── EXEC hrm_xxx_sp_get_Xxx
                                                    @PageIndex, @PageSize,
                                                    @UserLogin,         ← SP tự filter data permission
                                                    @OrgStructureID,    ← từ AdvanceFilters
                                                    @DateFrom, @DateTo,
                                                    ...
                                                Returns rows + TotalRow column
            │
            ├── Sys_FieldInfoCustomServices: map enum code → display label
            ├── .ToDataSourceResult(request)  → { Data: [...], Total: N }
            └── JavaScriptSerializer.Serialize → ContentResult("application/json")
    ▼
Browser: { data: [...], total: N }
```

---

## 4. `ListQueryModel` — Universal Query DTO

**File:** `HRM.Infrastructure.Utilities/ListQueryModel.cs`

Mọi SP list đều nhận tham số qua object này:

```csharp
public class ListQueryModel
{
    public int PageIndex { get; set; }
    public int PageSize { get; set; }
    public int TotalCount { get; set; }
    public string UserLogin { get; set; }
    public List<SortAttribute> Sorts { get; set; }
    public List<FilterAttribute> Filters { get; set; }       // Kendo column filters
    public List<FilterAttribute> AdvanceFilters { get; set; } // Domain search fields
}

public class FilterAttribute
{
    public string Member { get; set; }    // tên field
    public object Value { get; set; }
    public object Value2 { get; set; }   // dùng cho range (from/to)
    public string Operator { get; set; } // "eq", "contains", "gte", v.v.
}

public class SortAttribute
{
    public string Member { get; set; }
    public ListSortDirection SortDirection { get; set; }
}
```

**Quy tắc:** Khi thêm search field mới, phải thêm vào `AdvanceFilters` trong controller VÀ nhận tham số tương ứng trong SP.

---

## 5. `ActionService` — Bridge giữa Presentation và Business

**File:** `HRM.Presentation.Service/ActionService.cs`

Được tạo per-request bởi `BaseController`. Mang `UserLogin`, `UserID`, `LanguageCode`.

> Khi `Constant.UseRedisServer = true`, identity đến từ `ApplicationAuth.AccessData` (Redis session); ngược lại đến từ HTTP headers.

**Các method chính:**

| Method | Mục đích |
|--------|---------|
| `GetData<TEntity>(ListQueryModel, storeName)` | Fetch list qua SP |
| `GetData<TEntity,TModel>(id, storeName)` | Fetch single record |
| `UpdateOrCreate(model, storeName)` | Save (insert/update) |
| `DeleteOrRemove(ids, storeName)` | Xóa / soft-delete |
| `GetById` / `GetByIdUseStore` | Lookup by ID |
| `GetDataGrid` / `GetDataByListParameter` | Specialized grid fetch |

---

## 6. `UnitOfWork` — Data Gateway duy nhất

**File:** `HRM.Data.BaseRepository/UnitOfWork.cs`  
**Interface:** `HRM.Data.BaseRepository/IUnitOfWork.cs`

Luôn dùng trong `using` block:

```csharp
using (var context = new VnrHrmDataContext())
{
    var unitOfWork = (IUnitOfWork)new UnitOfWork(context);
    // thực hiện operations
    unitOfWork.SaveChanges(userId);
}
```

**API chính của `IUnitOfWork`:**

| Nhóm | Method | Mô tả |
|------|--------|-------|
| **Query** | `CreateQueryable<TEntity>(predicates[])` | LINQ queryable với IsDelete filter tự động |
| | `CreateQueryable<TEntity>(Guid userID, predicates[])` | Kèm user context |
| | `CreateQueryablePermissionKey<TEntity>(userID, keyPermission, predicates)` | Bake data permission vào LINQ |
| | `CreateQueryableIsdelete` / `CreateQueryableNoPermission` | Variants bỏ qua soft-delete / permission |
| **Permission** | `GetDataPermission<TEntity>(userLogin)` | Trả `List<Guid>` ProfileIDs được phép |
| | `GetUserPermissionByResourceName(userId, resourceName)` | Lấy PrivilegeNumber từ cache |
| | `GetConditionString(userId, privilegeType, entityType, key, out condStr, out params)` | Build raw WHERE string cho SP |
| **Persistence** | `SaveChanges()` / `SaveChanges(Guid userId)` | Persist với audit trail |
| | `SaveChanges(Guid userId, DataSaveOptions)` | Persist với options |
| **Lock** | `CheckLock(...)` / `CheckLockObject(...)` | Kiểm tra khóa record |
| **Audit** | `LogTracking(userName, trackingName, state, ip, moreInfo)` | Ghi audit log |
| **Metadata** | `GetMaxLength`, `GetFieldConstraint`, `GetNotNullFields` | EF metadata |
| **Org** | `SetCorrectOrgStructureID(...)` | Chuẩn hóa OrgStructure |

**Auto audit fields (`OnExecuteModifyData`):**  
Trước khi `SaveChanges()`, `UnitOfWork` tự động set qua reflection:
- `ID` → `Guid.NewGuid()` (nếu Insert)
- `DateCreate`, `UserCreate` (Insert)
- `DateUpdate`, `UserUpdate` (Insert + Update)

---

## 7. Business Service Pattern

**Nơi chứa:** `HRM.Business.<Module>.Domain/<FeatureName>Features/`

**Cấu trúc tiêu biểu:**

```csharp
// Feature service class — không kế thừa interface (pattern cũ)
public class Hre_CommonServices
{
    public List<Guid> GetProfilePermission(string userLogin)
    {
        using (var context = new VnrHrmDataContext())
        {
            var unitOfWork = (IUnitOfWork)new UnitOfWork(context);
            return unitOfWork.GetDataPermission<Hre_Profile>(userLogin);
        }
    }

    public string UpdateContract(Hre_ContractModel model, string userLogin)
    {
        using (var context = new VnrHrmDataContext())
        {
            var unitOfWork = (IUnitOfWork)new UnitOfWork(context);
            var entity = unitOfWork.CreateQueryable<Hre_Contract>(
                s => s.ID == model.ID && s.IsDelete == null
            ).FirstOrDefault();

            if (entity == null) return DataErrorCode.NotFound.ToString();
            // ... business logic
            return unitOfWork.SaveChanges(userId).ToString();
        }
    }
}
```

**DIServices pattern (các service mới hơn):**

```
HRM.Business.Hr.Domain/DIServices/
├── IServices/Hre/IHre_XxxServiceDI.cs   ← interface
└── Services/Hre/Hre_XxxServiceDI.cs     ← implementation : BaseService, IHre_XxxServiceDI
```

```csharp
public interface IHre_XxxServiceDI
{
    string DoSomething(List<Guid> ids);
    XxxEntity GetById(Guid id);
}

public class Hre_XxxServiceDI : BaseService, IHre_XxxServiceDI { ... }
```

> **Không dùng IoC container** — tất cả service được `new` thủ công ở controller hoặc `ActionService`. Không Autofac, không Unity.

---

## 8. Stored Procedure Calling Patterns

### Pattern 1 — ListQueryModel (grid query, qua BaseService/ActionService)

```csharp
// Controller gọi gián tiếp qua GetListDataAndReturn
return GetListDataAndReturn<MyModel, MyEntity, MySearch>(request, model, "hrm_xxx_sp_get_Xxx");
// SP nhận: @PageIndex, @PageSize, @UserLogin, @Filters..., trả TotalRow trong mỗi row
```

### Pattern 2 — SqlQuery trực tiếp (Dapper-style qua EF)

```csharp
using (var context = new VnrHrmDataContext())
{
    var result = context.Database.SqlQuery<MyEntity>(
        "EXEC sp_GetSomething {0}, {1}",
        new object[] { param1, param2 }
    ).ToList();
}
```

### Pattern 3 — SqlQuery với List\<SqlParameter\>

```csharp
var lstPara = new List<SqlParameter>
{
    new SqlParameter("@UserLogin", userLogin),
    new SqlParameter("@DateFrom", dateFrom),
    new SqlParameter("@OrgStructureID", orgId)
};
var result = context.Database.SqlQuery<TEntity>(
    "EXEC hrm_xxx_sp_get_Xxx @UserLogin, @DateFrom, @OrgStructureID",
    lstPara.ToArray()
).ToList();
```

### Pattern 4 — Dynamic Store (lookup/dropdown data)

```csharp
string strDynamicStore = "exec hrm_get_DynamicStore @StoreName, @Para, @Sort, @ParamValueField, @LanguageID, @IsSuperAdmin";
var lstPara = new List<SqlParameter>
{
    new SqlParameter("StoreName", "proc_GetDropdownData"),
    new SqlParameter("Para", encodedParams),
    new SqlParameter("Sort", "Name ASC"),
    new SqlParameter("LanguageID", languageId),
    new SqlParameter("IsSuperAdmin", isSuperAdmin)
};
```

### Pattern 5 — ExecuteSqlCommand (INSERT/UPDATE/DELETE không qua EF)

```csharp
context.Database.ExecuteSqlCommand(
    "EXEC proc_ProcessData @ProfileID, @Data",
    new SqlParameter("@ProfileID", profileId),
    new SqlParameter("@Data", data)
);
```

### Pattern 6 — Data Permission SP (xem mục 03-data-and-auth.md)

```csharp
var profileIds = context.Database.SqlQuery<Guid?>(
    "Get_Data_Permission_New {0}, {1}",
    new object[] { userLogin, "Hre_Profile" }
).Where(s => s != null).Select(s => s.Value).ToList();
```

---

## 9. Permission Integration trong Backend

Hai tầng permission hoạt động song song (chi tiết xem `03-data-and-auth.md`):

### A. UI/Function Permission (PrivilegeType)

```csharp
// BaseController.SysPermissionCheck — gọi trước action nguy hiểm
bool canEdit = SecurityService.CheckPermission(userId, PrivilegeType.Modify, "Hre_Profile");
// Cached in HttpRuntime.Cache by userId + resourceName
```

**PrivilegeType enum:** View=1, Delete=2, Create=4, Modify=8, Export=64, Import=128, Template=512, ChangeColumn=1024.

### B. Data Permission (row-level)

```csharp
// Trong business service — filter ProfileIDs
var allowedProfileIds = unitOfWork.GetDataPermission<Hre_Profile>(userLogin);
var query = unitOfWork.CreateQueryable<Att_LeaveDay>(
    d => allowedProfileIds.Contains(d.ProfileID.Value) && d.IsDelete == null
);
```

**Quy tắc:** Mọi query liên quan đến nhân viên PHẢI áp dụng data permission filter trước khi return. SP tự xử lý nếu `@UserLogin` được truyền vào và SP đã implement logic lọc.

---

## 10. Response Format

### MVC Controller → Kendo Grid

```csharp
// Standard list response
return Json(result.ToDataSourceResult(request)); // { data: [...], total: N }

// Manual JSON
return Json(new { success = true, data = entity, message = "" });

// ContentResult (JSON string từ JavaScriptSerializer)
return Content(JsonConvert.SerializeObject(dataSourceResult), "application/json");
```

### Cross-service call qua `RestServiceClient`

```csharp
var service = new RestServiceClient<Att_AllowLimitOvertimeModel>(UserLogin, LanguageCode);
service.SetCookies(Request.Cookies, _Hrm_Hre_Service); // forward cookies (SSO)
var result = service.Get(_Hrm_Hre_Service, "api/Att_AllowLimitOvertime/", id);
var list   = service.GetList(_Hrm_Hre_Service, "api/Att_AllowLimitOvertime/");
var saved  = service.Post(_Hrm_Hre_Service, "api/Att_AllowLimitOvertime/", model);
```

### ServiceCenter `BaseApiController` (`HRM.SC.Core.Api`)

```csharp
// Single result
return Result(data);
return Result(data, ErrorCode.NotFound, "Không tìm thấy");

// Grid result (có paging)
return ResultKendoGrid(requestModel, dataList);

// Integration module result
return ResultIntegration(data, ErrorCode.Success);
```

**Response envelope:**
```json
{
  "status": "SUCCESS",
  "code": 0,
  "message": "Success",
  "data": { ... }
}
```

---

## 11. Authentication & Session

### MVC Web App (session-based)

```csharp
// SessionObjects constants
Session["LoginUserName"]   // UserLogin
Session["UserId"]          // Guid
Session["ProfileID"]       // Guid — Hre_Profile.ID của user
Session["LanguageCode"]    // "vi-VN" | "en-US" | ...
Session["IsSupperAdmin"]   // bool
```

Session type: **SQL Server** (`ASPState` database — phải tạo thủ công bằng `aspnet_regsql.exe`).

Cookie name: `Session.Main` (Main), `Session.Portal` (EmpPortal).

### REST API / ServiceCenter (header-based)

```
Request Headers:
  UserLogin: admin
  UserID: <Guid>
  LanguageCode: vi-VN
```

### JWT (IdentityServer4 — HRM.SC.Service.Identity)

Claims chuẩn:
- `hrm_profile_id` → ProfileID trong Hre_Profile
- `hrm_user_id` → UserID trong Sys_UserInfo
- `hrm_username` → UserLogin
- `hrm_is_super_admin` → bool
- `languagecode`

**SSO:** `AuthUtility.Authenticate()` + `KeepSessionAlive.ashx` (giữ session sống, trả JWT).

**Redis (tùy chọn):** Khi `Constant.UseRedisServer = true`, `ApplicationAuth.AccessData` thay thế Session cho identity data.

---

## 12. Caching Patterns

```csharp
// HttpRuntime.Cache — in-process cache (dùng cho permission, master data)
var cached = HttpRuntime.Cache[cacheKey] as List<Cat_EmployeeTypeEntity>;
if (cached == null)
{
    cached = LoadFromDB();
    HttpRuntime.Cache.Insert(cacheKey, cached, null,
        DateTime.Now.AddMinutes(60), Cache.NoSlidingExpiration);
}

// Lazy cache (BaseService helper)
var data = GetOrCreateLazy<List<Cat_EmployeeTypeEntity>>(
    CacheUtility.Keys.CategoryBasic.Cat_EmployeeType,
    60,           // TTL minutes
    entry => LoadFromDB()
);

// Redis (optional — Constant.UseRedisSyncData)
if (Constant.UseRedisSyncData && RedisCaching.TestConnect())
    RedisCaching.AddOrUpdate(key, value);
```

---

## 13. ServiceCenter Module Pattern (kiến trúc mới hơn)

**Namespace:** `HRM.SC.Module.<Abbr>.{Api|Business|Models}`

**Cấu trúc:**
```
HRM.ServiceCenter/
├── Cores/
│   ├── HRM.SC.Core.Api/            BaseApiController, routing
│   ├── HRM.SC.Core.Business/       Business logic chung (EF6 + Dapper)
│   └── HRM.SC.Core.Models/         Base DTOs, response envelopes
├── Modules/
│   └── HRM.SC.Module.<Abbr>.Api/       Web API controllers
│   └── HRM.SC.Module.<Abbr>.Business/  Service classes
│   └── HRM.SC.Module.<Abbr>.Models/    DTOs
└── IntegrationModules/             Microservice integration modules
    └── HRM.Integration.Module.<Abbr>.Api/
```

**Controller pattern:**
```csharp
[RoutePrefix("api/Hre_Profile")]
public class Hre_ProfileController : BaseApiController
{
    [Route("GetList")]
    [HttpPost]
    public IApiResult<BaseResponseGridModel<Hre_ProfileModel>> GetList(
        KendoGridRequestModel requestModel)
    {
        var service = new Hre_ProfileServices();
        var data = service.GetList(requestModel);
        return ResultKendoGrid(requestModel, data);
    }

    [Route("CreateOrUpdate")]
    [HttpPost]
    public IApiResult<string> CreateOrUpdate(Hre_ProfileModel model)
    {
        var service = new Hre_ProfileServices();
        return Result(service.CreateOrUpdate(model));
    }
}
```

---

## 14. Write Flow (Create / Update / Delete)

```
POST → Controller.Create(model)
    │
    ├── SysPermissionCheck(PrivilegeType.Create, resourceKey)  // optional
    │
    └── ActionService.UpdateOrCreate(model, "hrm_xxx_sp_save_Xxx")
            │
            └── BaseService → using (VnrHrmDataContext context)
                    │
                    └── unitOfWork.SaveChanges(userId)
                            │
                            └── OnExecuteModifyData:
                                    auto-set ID, DateCreate, UserCreate
                                    (hoặc DateUpdate, UserUpdate nếu Update)
                                    └── EF DbContext.SaveChanges()
                                            → SQL INSERT / UPDATE
```

**Soft delete pattern:**
```csharp
entity.IsDelete = true;
entity.UserUpdate = userLogin;
entity.DateUpdate = DateTime.Now;
unitOfWork.SaveChanges(userId);
// Không xóa vật lý — IsDelete IS NULL là điều kiện lọc chuẩn trong mọi query
```

---

## 15. Quy tắc cho AI Agents khi viết Backend code

1. **Mọi controller** phải kế thừa `BaseController` (service layer) hoặc `MainBaseController` (main web) — không kế thừa trực tiếp `Controller`.

2. **Mọi grid/list action** phải dùng `GetListDataAndReturn<TModel,TEntity,TSearch>(request, model, "sp_name")` — không tự fetch data trong controller.

3. **Mọi data access** phải qua `UnitOfWork` trong `using (var context = new VnrHrmDataContext())` block — không dùng EF DbContext trực tiếp ngoài UnitOfWork.

4. **SP là nguồn sự thật** cho mọi query phức tạp — không viết LINQ phức tạp thay thế SP. LINQ chỉ dùng cho in-memory filter hoặc CRUD đơn giản.

5. **Data permission filter bắt buộc** — mọi query nhân viên phải gọi `GetDataPermission<TEntity>()` hoặc pass `@UserLogin` vào SP.

6. **Không dùng IoC container** — service được `new` thủ công. Không import Autofac/Unity.

7. **`IsDelete IS NULL`** là điều kiện filter chuẩn — không dùng `IsDelete == false` hay bỏ qua.

8. **Audit fields tự động** — không tự set `DateCreate`, `UserCreate`, `DateUpdate`, `UserUpdate` trong code — UnitOfWork tự xử lý.

9. **Response format** phải dùng `.ToDataSourceResult(request)` cho Kendo Grid, hoặc `Result(data)` cho ServiceCenter API.

10. **ServiceCenter module mới** dùng `BaseApiController` + `IApiResult<T>` — không mix với MVC response pattern.
