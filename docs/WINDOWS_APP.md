# تطبيق LocalDock لويندوز — غلاف Tauri v2

يحول هذا الغلاف نواة LocalDock (السيرفر + واجهة الويب) إلى **تطبيق ويندوز أصلي** بنفس منطق المنتج وبلا أي إعادة كتابة: نافذة WebView2 تعرض واجهة LocalDock، وخلفها يعمل السيرفر المجمّد (Next.js standalone + node.exe) كعملية خلفية تديرها القشرة.

---

## ١. المزايا المدمجة

| الميزة | كيف تعمل |
|---|---|
| **أيقونة System Tray** | إظهار/إخفاء النافذة، Open in Browser، Re-announce on Network، Start with Windows (صندوق اختيار حقيقي)، Quit. النقر الأيسر المزدوج على الأيقونة يفتح النافذة. |
| **الإغلاق إلى الخلفية** | عند إغلاق النافذة تُخفى فقط — السيرفر يستمر في خدمة الأجهزة المقترنة. الخروج الفعلي من قائمة Tray فقط. |
| **Start with Windows** | عبر `tauri-plugin-autostart` (سجل Run الحقيقي لويندوز). الحالة تُحفظ في `settings.json` وتتقارب معها عند كل إقلاع، والمصدر الواحد للحقيقة هو ما يراه المستخدم في تبويب Settings. |
| **منتقي مجلدات أصلي** | زر "Select folder on this computer" في Add Share وHost Website يفتح نافذة ويندوز الحقيقية (plugin-dialog). المسار المطلق الناتج يُقبَل من السيرفر **فقط** في وضع سطح المكتب (`LOCALDOCK_DESKTOP=1`) وبعد `realpath` لقنعه من الروابط الرمزية — وراءه تعمل نفس حواجز traversal الموجودة. |
| **mDNS / محلي بالاسم** | تعلن القشرة عن خدمة `_localdock._tcp.local.` مع خاصية الاسم + عن الاسم `localdock.local.` عبر `mdns-sd` (بدون Bonjour خارجي). الأنظمة التي تحل أسماء `.local` (iOS/macOS/أغلب لينكس) تفتح `http://localdock.local:PORT` مباشرة؛ حيث لا تدعمه المتصفحات (مثل كروم على أندرويد) تبقى روابط IP — وهي الموضوعة في كل QR — هي الطريق الشامل دائمًا. |
| **منفذ ذكي** | تختار القشرة أول منفذ حر بدلًا من 3000 وتتمرر عبر `PORT` — لا تصادم مع تطبيقات أخرى. |
| **Single Instance** | النقر على الأيقونة مرتين يُعيد النافذة القائمة للواجهة بدل فتح نسخة ثانية. |
| **بيانات في مكانها الصحيح** | `LOCALDOCK_HOME=%APPDATA%\LocalDock` — تشاركاتك وإعداداتك وأجهزتك تنجو من التحديثات ولا تُكتب داخل Program Files. |

## ٢. بنية القشرة

```text
src-tauri/
├─ src/
│  ├─ main.rs            # نقطة الدخول (windows_subsystem = "windows")
│  ├─ lib.rs             # Tray + النافذة + الأوامر + autostart + الإغلاق النظيف
│  ├─ server.rs          # تشغيل السيرفر المجمّد + فحص الصحة + منفذ حر + LAN IPs
│  └─ mdns.rs            # الإعلان على الشبكة المحلية (mdns-sd)
├─ tauri.conf.json       # NSIS (currentUser)، أيقونات، موارد السيرفر
├─ capabilities/         # صلاحيات IPC — تشمل remote loopback فقط
├─ frontend-dist/        # صفحة تحميل بعلامة LocalDock حتى يقوم السيرفر
└─ icons/                # مجموعة الأيقونات الكاملة (icon.ico + PNG)
```

**تسلسل الإقلاع**: فتح النافذة (صفحة تحميل فورية) → تشغيل `node.exe server.js` بمنفذ حر وبدون نافذة كونسول → فحص `GET /api/system` حتى 45 ثانية → تحويل النافذة إلى `http://127.0.0.1:{port}` → بدء الإعلان mDNS. عند Quit: إيقاف mDNS (رسالة وداع) ثم `kill` للسيرفر.

## ٣. البناء على ويندوز (خطوتان)

المتطلبات: **Bun** أو Node 20+، **Rust stable (MSVC)**، وWebView2 (موجود في ويندوز 10/11 الحديث).

```powershell
git clone <repo> ; cd localdock
bun install
bun run build:windows
# → src-tauri/target/release/bundle/nsis/LocalDock_1.0.0_x64-setup.exe
```

ما يجري داخليًا: `bun run build` (Next standalone) ← ثم `tauri:prep` تلقائيًا (تجميع `resources/server` + تنزيل `node.exe` من nodejs.org مرة واحدة — يمكن تجاوز التنزيل بـ `LOCALDOCK_NODE_EXE`) ← ثم `tauri build` (NSIS، لغة إنجليزية/عربية).

**نسخة محمولة**: الملفات بجوار `LocalDock.exe` داخل `src-tauri/target/release/` (بما فيها `resources/`) تُنسخ كما هي إلى أي مجلد — تشغيل مباشر بلا تثبيت.

## ٤. البناء المؤتمت

`.github/workflows/windows-build.yml` ينتج عند كل tag `v*` (أو يدويًا):
- `LocalDock-Windows-installer` — مثبّت NSIS.
- `LocalDock-Windows-portable` — ZIP محمول.
- يشغّل lint واختبارات الوحدة قبل البناء.

## ٥. التطوير

```bash
# وضع التطوير: bun dev يبقى هو السيرفر، ونافذة Tauri تفتح localhost:3000
bun run dev:windows          # = LOCALDOCK_DESKTOP=1 tauri dev

# لاختبار مزايا سطح المكتب في المتصفح وحده (منتقي المسار المطلق مثلاً):
LOCALDOCK_DESKTOP=1 bun run dev
```

> في وضع `tauri dev` لا يعمل السيرفر المجمّد — القشرة تعلن mDNS وتدير Tray فقط، والمنفذ يُقرأ من `LOCALDOCK_PORT` (افتراضي 3000).

## ٦. أوامر IPC المتاحة للواجهة

| الأمر | الغرض |
|---|---|
| `desktop_status` | المنفذ، الرابط، روابط LAN، PID السيرفر، حالة mDNS، حالة autostart |
| `set_start_with_windows` | مزامنة سجل ويندوز + `settings.json` + صندوق اختيار Tray |
| `open_in_browser` | فتح `http://127.0.0.1:{port}` في المتصفح الافتراضي |
| `announce_mdns` | إعادة الإعلان عند تغير الشبكة (أو زر القائمة) |

الجسر من الواجهة في `src/lib/localdock/client/desktop.ts` — كل نداء يتحول إلى `null` في وضع المتصفح فتعود الواجهة إلى سلوك الويب تلقائيًا (لا تفرّع منطق المنتج بين القناتين).

## ٧. حدود صادقة (بلا مزايا وهمية)

- `localdock.local` يُحل على الأجهزة التي تدعم mDNS في نظامها؛ البديل الشامل (روابط IP في QR) موجود دائمًا ولا يحتاج أي شيء.
- شهادة توقيع الكود غير مرفقة — المثبت غير موقّع، ويندوز قد يعرض SmartScreen عند أول تشغيل (لاستخدام شهادتك: `bundle.windows.certificateThumbprint` في `tauri.conf.json`).
- بناء NSIS/MSI من لينكس غير مدعوم رسميًا من Tauri — البناء يتم على ويندوز أو عبر الـ workflow أعلاه.
