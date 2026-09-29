# LocalDock — المعمارية التقنية

## 1. المبدأ الحاكم

> **التقنية قوية في الخلفية، والتجربة بسيطة في الواجهة.**

كل قرار معماري مشتق من ثلاثة أولويات: الجمال، السهولة القصوى، الفعالية والاعتمادية — بهذا الترتيب عند التعارض.

## 2. الطبقات

```text
┌─────────────────────────────────────────────────────────┐
│ UI (SPA)            src/components/localdock/*           │
│  AppShell · Dashboard · Shares · Files · Transfers ·     │
│  Devices · Websites · Settings · Onboarding · Guest       │
├─────────────────────────────────────────────────────────┤
│ Client Engine       src/lib/localdock/client/*            │
│  api.ts (fetch + أخطاء ودّية) · transfer-engine.ts        │
│  (queue, chunks, resume, speedometer, persistence, IDB)   │
├─────────────────────────────────────────────────────────┤
│ HTTP API            src/app/api/*   (25+ route handlers)  │
├─────────────────────────────────────────────────────────┤
│ Domain              src/lib/localdock/*                   │
│  auth · registry · uploads · files · paths · metrics ·    │
│  static-site · seed · store                               │
├─────────────────────────────────────────────────────────┤
│ Infrastructure      node:fs (streaming) + JSON registries │
└─────────────────────────────────────────────────────────┘
```

قواعد صارمة:

- الـ UI لا يلمس `node:fs` إطلاقًا ولا يعرف شيئًا عن البروتوكولات.
- كل دخول للقرص يمر عبر `resolveSafe()` — لا استثناء واحد.
- النواة (`src/lib/localdock/*` عدا `client/`) لا تعرف شيئًا عن React — قابلة لإعادة الاستخدام في غلاف Tauri أو أي عميل.

## 3. نموذج البيانات

**الفايلسیستم هو قاعدة البيانات الحقيقية.** الميتاداتا في ملفات JSON كتابةً ذرّية (tmp + rename):

```text
localdock/
  data/settings.json     serverId, serverName, ownerKey, onboarded, …
  data/shares.json       [{ id, name, slug, rootPath, access, guestEnabled, allowedDevices, sizeBytes, itemCount }]
  data/devices.json      [{ id, name, platform, tokenHash (SHA-256), lastSeenAt }]
  data/pairing.json      [{ code, expiresAt }]  — أحادي الاستخدام، TTL 5 دقائق
  data/websites.json     [{ id, name, slug, rootPath, enabled }]
  data/activity.json     آخر 300 حدث (ring buffer)
  Shares/…               مجلدات المشاركة الفعلية
  Websites/…             مجلدات المواقع (تتطلب index.html)
  .uploads/              جلسات الرفع ({id}.part مُخصَّص مسبقًا + {id}.json)
```

لماذا لا Prisma/SQLite؟ بيانات الميتاداتا صغيرة، والقيمة الحقيقية للمنتج هي الملفات نفسها؛ ملفات JSON محمولة (انسخ مجلد `localdock/` = نسخ خادمك كاملًا) وقابلة للفحص بالعين، والكتابة الذرّية عبر rename آمنة ضد الانقطاع. أقصر حل احترافي يعطي النتيجة الممتازة.

## 4. بروتوكول النقل

### رفع (Upload) — مجزّأ قابل للاستكمال

```text
POST /api/upload/init        { shareId, dirPath, name, size, chunkSize, resumeUploadId? }
  → preallocate sparse file (.part) + session meta
  → عند تمرير resumeUploadId حي: يرد بالأجزاء الموجودة (لا يبدأ من جديد)
PUT  /api/upload/chunk?uploadId&index   (raw body ≤ 16MB)
  → كتابة موضعية عند offset = index × chunkSize — بلا نسخ مؤقتة، بلا تجميع بالذاكرة
POST /api/upload/complete    { uploadId, sha256? }
  → تحقق من اكتمال الأجزاء + الحجم
  → SHA-256 ببثّ واحد على الملف النهائي
  → rename إلى الوجهة (نفس الفايلسیستم = لحظي حتى للملفات العملاقة)
```

**لماذا الاستكمال حقيقي؟** الملف يُكتب موضعيًا في مكانه النهائي منذ أول بايت. انقطاع بعد 6.2GB = 6.2GB على القرص فعليًا؛ العميل يسأل `/api/upload/status` ويكمل الأجزاء الناقصة فقط. الجلسات تعيش 24 ساعة مع GC تلقائي، فالاستكمال يعمل عبر إعادة تحميل الصفحة وتحتاج إعادة اختيار الملف فقط (قيد منصة المتصفح — تطبيق Android لا يواجهه).

### تنزيل (Download) — بثّ + Range

- `streamFileResponse` يبثّ `createReadStream` (512KB chunks) عبر `Readable.toWeb` — لا يُقرأ الملف بالذاكرة أبدًا، مناسب لملفات 50GB.
- `Range: bytes=a-b` → 206 مع `Content-Range` — أساس استكمال التنزيل ومعاينة الفيديو بالتقديم.
- عدّاد البايتات يغذي `metrics.ts` (نافذة منزلقة 3 ثوانٍ) = "سرعة النقل الحالية" في اللوحة، من بيانات الشبكة الفعلية.

### محرك العميل

`transfer-engine.ts`: طابور بتزامن 2 ملف، سرعة/ETA لكل عنصر (نافذة 2.5s)، إيقاف/متابعة/إلغاء/إعادة، auto-retry أُسّي مُسقّف لأخطاء الشبكة مع استمرار تلقائي عند العودة، persistence في localStorage + إعادة مزامنة مع الخادم عند الإقلاع. التنزيلات: File System Access API (بثّ للقرص + استكمال عبر نطاقات + حفظ handle في IndexedDB للاستكمال بعد إعادة التحميل) مع fallback إلى Blob للملفات الصغيرة/المتصفحات الأخرى.

## 5. الأمان — Safe by Default

ثلاث هويات: **owner** (لوحة التحكم، ownerKey)، **device** (رمز جهاز مخزّن hashed فقط)، **guest** (فقط إذا فعّل المالك `guestEnabled` لمشاركة بعينها). مصفوفة الصلاحيات لكل مشاركة تُطبَّق على كل مسار — التفاصيل الكاملة وقرارات التهديدات في `docs/SECURITY.md`.

## 6. الاكتشاف والاقتران

- **الاقتران**: `POST /api/pair/start` (owner) → كود 6 حروف من أبجدية بلا لبس، أحادي الاستخدام، 5 دقائق. QR يحمل رابط `?pair=CODE` يفتح شاشة "Pair with this computer?" → اسم الجهاز → `claim` → deviceToken (48 hex) يُخزَّن محليًا ويُخزَّن hashed على الخادم.
- **الاكتشاف**: في بنية الويب يكتشف العميل الخادم بنفس الأصل/الرابط/الـ QR. في غلاف سطح المكتب تُضاف طبقة mDNS (مكتبة ناضجة مثل `bonjour-service` على Node) تعلن `_localdock._tcp` مع serverId — العميل يعرض "My PC 🟢 Online" بلا كتابة أي عنوان. لم تُفرض mDNS في نواة الويب لأن multicast خارج نطاق HTTP داخل هذه البيئة — والفصل يجعل إضافتها لاحقًا شفافة تمامًا.

## 7. استضافة المواقع

`POST /api/websites` يتحقق من وجود `index.html` ثم يسجل الموقع. المسار `/sites/{slug}/[[...path]]` يقدم:

- إعادة توجيه 308 قياسية من الجذر إلى `/sites/{slug}/` حتى تُحل الأصول النسبية (`assets/style.css`) صحيحًا (مع `skipTrailingSlashRedirect`).
- فهرسة `index.html` للمجلدات، MIME صحيح لكل امتداد، بثّ Range للفيديو.
- **صفر directory listing**، احتواء صارم داخل مجلد الموقع، صفحة 404 مخصصة.
- العنوان الودّي `slug.localdock.local` يُعرض للمستخدم ويُربط حرفيًا في غلاف سطح المكتب عبر mDNS wildcard؛ في الويب يُفتح المسار الحقيقي مباشرة.

## 8. الأداء

- بثّ من أول بايت للتنزيل، وكتابة موضعية للرفع: **صفر نسخ مؤقتة، صفر memory spikes** مهما كان حجم الملف.
- تزامن مقيّد (2 ملف متوازٍ، chunks متتالية لكل ملف) = backpressure طبيعي يحمي الذاكرة وشبكة LAN.
- إحصائيات المجلدات: قياس بحدود صلبة (20000 عنصر/عمق 8) + تحديث خلفي بعد الرفع.
- GC دوري لجلسات الرفع المهجورة؛ activity ring buffer ثابت الحجم؛ لا polling ثقيل (أسوأ حالة: استعلام كل 4 ثوانٍ للوحة).

## 9. خرائط الأغلفة الأصلية

### Windows (Tauri v2)
- نفس المشروع يعمل كـ sidecar (`bun build --compile` أو Node SEA) والواجهة تُعرض في نافذة النظام.
- Tray menu (§19) يستدعي نفس إجراءات الشبكة؛ Startup (§20) يقرأ `settings.startWithWindows` المحفوظة فعلًا ويسجّل مفتاح Registry عبر plugin الأوتوستارت؛ منتقي المجلدات الأصلي يستبدل `/api/fs/browse` (الواجهة جاهزة للتبديل — نقطة تكامل واحدة).
- mDNS عبر `bonjour-service` داخل نفس العملية.

### Android (Kotlin/Compose)
- كل شيء واجهات HTTP موثقة في `tests/smoke.mjs` (أدق توثيق ممكن: اختبارات حية).
- الاقتران: مسح QR → `claim` → تخزين token في EncryptedSharedPreferences.
- الرفع: نفس بروتوكول chunks مع ContentResolver streams؛ الاستكمال بلا قيود المتصفح.
- الاكتشاف: NSD/mDNS نظامي يقرأ `_localdock._tcp`.
