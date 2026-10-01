# تطبيق LocalDock لأندرويد — الرفيق المحمول

> **المبدأ:** الحاسوب يبقى هو السيرفر والقلب النابض للمشروع. تطبيق الأندرويد **رفيق بلا خادم (Serverless Companion)**: يكتشف خوادم LocalDock على الشبكة المحلية، يقترن بها برمز، ثم يفتح واجهة المنتج كاملة داخل الـ WebView — فمن تلك اللحظة يصبح الهاتف جهازاً مقترناً موثوقاً تماماً كأي متصفح على الشبكة.

لماذا هذا التصميم؟ لأن تشغيل خادم Node.js داخل الهاتف يخالف فلسفة LocalDock (المجلدات الحقيقية على حاسوبك) ويستهلك بطارية وموارد بلا داعٍ. الرفيق يعطيك تجربة تطبيق أصلي كاملة: أيقونة على الشاشة الرئيسية، اكتشاف تلقائي بلا كتابة عناوين، وشاشة انطلاق بالهوية البصرية للمنتج.

---

## ماذا يفعل التطبيق

1. **اكتشاف تلقائي للخوادم** عبر استراتيجيتين متكاملتين:
   - **mDNS:** تصفح خدمة `_localdock._tcp.local.` التي يبثها غلاف سطح المكتب — فوري وصامت.
   - **مسح TCP للشبكة الفرعية:** فحص unicast بسيط لمنفذ 3000 على نطاق `/24` الذي ينتمي إليه الهاتف (تعمل هذه الطريقة على **كل** أجهزة أندرويد لأنها لا تحتاج صلاحيات multicast)، ثم **تحقق حقيقي** لكل مرشح عبر `GET /api/bootstrap` ومطابقة بصمة الاستجابة (`serverId` + `serverName`) — لن يظهر في القائمة إلا خادم LocalDock حقيقي.
2. **اقتران برمز من 6 أحرف:** اقرأ الرمز من الحاسوب (الأجهزة ← إضافة جهاز) وأدخله في التطبيق — يفتح رابط المطالبة `/?pair=CODE` وواجهة المنتج المعرّبة تكمل الباقي وتخزّن رمز الجهاز في الـ WebView.
3. **فتح كامل الواجهة:** التصفح، الرفع بالتشانكات، التحميل المتوازي بنمط IDM، المعاينات، النشاط الحي — كل شيء يعمل كما في المتصفح.
4. **ذاكرة خوادم:** الخوادم المعروفة تُحفظ محلياً وتُفحص تلقائياً عند الإقلاع (متصل / لا يستجيب).
5. **10 لغات + RTL:** المُطلق نفسه مترجم بالكامل بنفس جودة منتج الويب، والعربية بانعكاس كامل للاتجاه.

---

## المتطلبات

| الأداة | الإصدار |
| :--- | :--- |
| [Bun](https://bun.sh) | 1.1+ |
| [Rust](https://rustup.rs) | 1.77+ مع الأهداف: `aarch64-linux-android`، `armv7-linux-androideabi`، `x86_64-linux-android` |
| Android Studio (أو SDK + NDK فقط) | NDK 27+، JDK 17 |
| متغيرات البيئة | `ANDROID_HOME`، `NDK_HOME` مضبوطة |

```bash
rustup target add aarch64-linux-android armv7-linux-androideabi x86_64-linux-android
```

---

## التهيئة الأولى (مرة واحدة)

```bash
bun install
bun run android:init
```

ينجز هذا الأمر ثلاث خطوات بالترتيب:

1. **`tauri icon`** — توليد كل أحجام أيقونات أندرويد (mipmap + adaptive) من `src-tauri/icons/icon.png`.
2. **`tauri android init`** — توليد مشروع `src-tauri/gen/android` الأصلي (Gradle + Kotlin + Manifest).
3. **`scripts/android-init-patch.mjs`** — رقعة إلزامية تجعل المشروع جاهزاً للشبكة المحلية:
   - `android:usesCleartextTraffic="true"` — أندرويد 9+ يحجب HTTP الصريح افتراضياً، وبدونها سيفشل كل اتصال بـ `http://192.168.x.x:3000`.
   - صلاحيتا `INTERNET` و`ACCESS_NETWORK_STATE` إن لم تكونا موجودتين.

السكربت **idempotent** — آمن لإعادة التشغيل، وسيرفض العمل بلطف إذا لم يُولَّد المشروع بعد.

---

## التطوير والبناء

```bash
# بناء APK تجريبي (موقّع بتصحيح) للتثبيت المباشر على الهاتف
bun run tauri android build --apk --debug --target aarch64

# بناء إصدار نهائي (APKs لثلاث بنيات)
bun run android:build

# حزمة Google Play (AAB)
bun run android:build:aab
```

مخرجات البناء: `src-tauri/gen/android/app/build/outputs/apk/<abi>/release/`.

**ملاحظة حول `tauri android dev`:** نسخة الأندرويد واجهتها ملفات ثابتة (`src-mobile`) بلا خادم تطوير؛ تهيئة الأندرويد (`tauri.android.conf.json`) تلغي `devUrl` و`beforeDevCommand` الخاصين بسطح المكتب. إن احتجت تكراراً أسرع على الجهاز استخدم `--debug` بدل dev loop، أو عدّل الملفات وشغّل بناء debug (ثوانٍ معدودة لأن لا بناء ويب مطلوباً).

### توقيع الإصدار النهائي

مخرجات release **غير موقّعة**. لتوقيعها إما عبر Android Studio (Build → Generate Signed Bundle/APK) أو سطر الأوامر:

```bash
keytool -genkey -v -keystore localdock.keystore -alias localdock -keyalg RSA -keysize 2048 -validity 10000
apksigner sign --ks localdock.keystore --out LocalDock.apk app-universal-release-unsigned.apk
```

---

## بنية الكود

| المسار | الدور |
| :--- | :--- |
| `src-tauri/src/lib.rs` | مُوزِّع المنصات: `#[cfg(desktop)]` → غلاف ويندوز، `#[cfg(mobile)]` → رفيق الأندرويد |
| `src-tauri/src/desktop.rs` | الغلاف المكتبي كما هو: الخادم المضمن، الشريط، Autostart، الإطفاء |
| `src-tauri/src/mobile.rs` | غلاف الأندرويد: بلا خادم ولا شريط — يسجل أمرَي الاكتشاف فقط |
| `src-tauri/src/discovery.rs` | محرك الاكتشاف المشترك: mDNS + مسح TCP + عميل HTTP مصغّر + بصمة الخادم |
| `src-tauri/src/mdns.rs` | `advertise()` لسطح المكتب + `browse()` للأندرويد |
| `src-mobile/` | واجهة المُطلق الثابتة (HTML/CSS/JS بلا اعتماديات، 10 لغات، RTL) |
| `src-tauri/tauri.android.conf.json` | تهيئة الأندرويد: `frontendDist: ../src-mobile`، أهداف `apk` + `aab`، `minSdk 24` |
| `.github/workflows/android-build.yml` | CI: يبني APKs لثلاث بنيات وينشرها مع كل وسم `v*` |

**تدفق الاقتران من طرف إلى طرف:** `pair/start` (المالك) → رمز 6 أحرف → المستخدم يُدخله في المُطلق → فتح `http://host/?pair=CODE` → `PairClaimView` في واجهة المنتج يدّعي الرمز → `pair/claim` يُرجع `deviceToken` → يُخزَّن في localStorage الـ WebView → من الآن الهاتف جهاز موثوق.

---

## استكشاف الأخطاء

- **«لا خوادم حتى الآن» رغم أن الخادم يعمل:**
  - تأكد أن الهاتف والحاسوب على **نفس الشبكة** (بعض شبكات الضيوف تعزل الأجهزة عن بعضها — AP Isolation).
  - إن غيّر الخادم منفذه (3000 مشغول)، الاكتشاف عبر mDNS يجده، والمسح اليدوي بالأسفل يقبل `host:port` مباشرة.
  - على شبكات Wi-Fi الخاصة بالفنادق/الشركات قد تُحجب البثوث multicast — المسح TCP يغطي الحالة لكن بعض الشبكات تعزل كلياً.
- **`localdock.local` لا يعمل في التطبيق:** أندرويد لا يحل أسماء `.local` في WebView غالباً — استخدم عنوان IP (الروابط والـ QR في واجهة الحاسوب تستخدم الـ IP أصلاً).
- **صفحة بيضاء أو فشل اتصال بعد التثبيت:** تأكد أن `android-init-patch.mjs` ركض بعد `tauri android init` (أو أعد تشغيل `bun run android:init`) — الحجب الافتراضي لـ HTTP الصريح هو السبب الأول.
- **بناء Gradle يفشل في CI:** تحقق من ظهور `NDK_HOME` و`JAVA_HOME` (JDK 17) قبل خطوة البناء.
- **البنية غير مدعومة:** الملفات تبني `aarch64` (كل الهواتف الحديثة)، `armv7` (الأقدم)، و`x86_64` (المحاكيات) — لن يعمل i686 القديم.
