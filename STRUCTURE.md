# هيكلية مشروع المشرف (بعد التعديل)

## ماذا غيّرنا؟

لم نضف ميزات جديدة. أعدنا ترتيب الموجود ليصبح مثل فكرة المفوتر:

```
الصفحة
  ↓ تطلب بيانات
getXxxDatasource()
  ↓
Mock (الآن)   أو   Remote (لاحقاً)
```

## المجلدات الجديدة

```
src/core/
  config.ts              ← مفاتيح Mock/Remote
  api/apiEndpoints.ts    ← مسارات API
  api/httpClient.ts      ← طلبات الشبكة للـ Remote

src/features/auth/
  domain/user.ts
  data/authDatasource.ts
  data/authMockDatasource.ts
  data/authRemoteDatasource.ts
  data/index.ts          ← getAuthDatasource()
  AuthContext.tsx        ← يستدعي الـ datasource فقط
  pages/LoginPage.tsx

src/features/dashboard/
  domain/ + data/ (mock/remote) + pages/

src/features/users/
  domain/ + data/ (mock/remote) + pages/
```

## كيف تختار Mock أو Remote؟

الافتراضي Mock. لاحقاً عند التشغيل:

```bash
VITE_USE_REMOTE_AUTH=true npm run dev
```

## جملة مهمة

الصفحة لا تعرف مصدر البيانات.  
تعرف فقط: «أعطني البيانات» عبر `get...Datasource()`.
