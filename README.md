<div align="center">

  <img src="src-tauri/icons/icon.png" width="128" height="128" alt="LocalDock Logo" />

  <h1>LocalDock</h1>
  <p><strong>Turn Any Computer into a Private Personal Cloud for Your Local Network</strong><br/>
  حوّل أي حاسوب إلى سحابة شخصية خاصة داخل شبكتك المحلية — بلا Cloud، بلا حسابات، وبلا قيود</p>

[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%20x64-0078D6?logo=windows&logoColor=white)](https://github.com/Youssef-Alaa-Hamdy/LocalDock/releases)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri&logoColor=black)](https://tauri.app/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-Stable-DEA584?logo=rust&logoColor=black)](https://www.rust-lang.org/)
[![Languages](https://img.shields.io/badge/UI%20Languages-10%20%7C%20RTL%20ready-E4405F?logo=googletranslate&logoColor=white)](#-global-localization--التعريب-العالمي)
[![Themes](https://img.shields.io/badge/Theme%20Packs-4%20%C3%97%20Light%2FDark-8B5CF6?logo=palettor)](#-theming--الثيمات)
[![Local-First](https://img.shields.io/badge/Architecture-100%25%20Local--First-22c55e?logo=shield)](https://github.com/Youssef-Alaa-Hamdy/LocalDock)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](#-english-overview) • [العربية — النسخة الكاملة](README.ar.md) • [What's New](#-whats-new--أحدث-التحسينات) • [Features](#-key-features--أبرز-المميزات) • [Transfers](#-transfer-engine--محرك-النقل) • [Architecture](#-architecture--المعمارية-التقنية) • [Security](#-security--privacy--الأمان-والخصوصية) • [Releases](https://github.com/Youssef-Alaa-Hamdy/LocalDock/releases)

---

</div>

<br/>

## 🌟 English Overview

**LocalDock** makes local networking feel invisible. It is a modern, privacy-first personal cloud server and desktop application designed to bridge all your devices (phones, tablets, laptops) over your home or office Wi-Fi.

Unlike traditional cloud providers (Google Drive, Dropbox) or complex NAS setups, **LocalDock stores files directly in the real folders of your computer** — no subscription, no tracking, zero internet bandwidth consumed, and zero third-party dependencies. The entire experience ships in **10 languages** (with full RTL support for Arabic) and **4 theme packs × light/dark modes**, so every device on your network feels like it was built for you.

```text
Select Real Folder on PC (e.g. D:\Projects)
                   ↓
      Set Permissions (Read/Write)
                   ↓
Scan QR with Phone → Available on the Entire Network Instantly!
```

---

## 🇸🇦 نظرة عامة بالعربية

**LocalDock** يجعل التخزين والربط عبر الشبكة المحلية في غاية السهولة والأناقة. حوّل حاسوبك الشخصي إلى سيرفر سحابي خاص فائق السرعة لجميع أجهزتك (الهاتف، التابلت، الحواسيب الأخرى) داخل شبكتك المحلية (Wi-Fi).

بخلاف الخدمات السحابية التقليدية أو أنظمة NAS المعقدة، **LocalDock يعمل مباشرة على المجلدات الحقيقية على جهازك** (في أي قرص مثل `C:\` أو `D:\`) — بدون اشتراكات، بدون إنترنت، وبأعلى سرعة ممكنة لشبكتك المنزلية. والواجهة كاملة **مُعرّبة بالكامل مع دعم RTL** إلى جانب **10 لغات عالمية** و**4 حزم ثيمات** بوضعَي فاتح وداكن.

> 📖 **النسخة العربية الكاملة من هذا الملف:** [README.ar.md](README.ar.md)

---

## 🆕 What's New | أحدث التحسينات

LocalDock has gone through a full series of professional upgrade rounds. Here is what each round delivered:

| Round | Highlights |
| :--- | :--- |
| **v1 — Smart LAN Foundations** | Share links & QR codes resolve to the machine's **real LAN address** (smart scoring of private IPs), live folder watching, mobile bottom sheets. |
| **v2 — Media Experience** | In-app previews for **images / video / audio / PDF**, server-side thumbnails, and a live cross-device transfer screen. |
| **v3 — Thumbnails & Polish** | Client-side thumbnail fallbacks so tiles always render, plus UI density refinements. |
| **v4 — Device-Side Uploads** | Upload folders **from the device itself** (browser-native folder picker), companion-device detection, transfer-engine hardening. |
| **v5 — العربية & Theming** | Full **Arabic localization with RTL**, a type-safe i18n foundation, and a complete **theme system**. |
| **v6 — Global 10-Language UI** | **ES · FR · DE · PT · RU · ZH · HI · JA** added — every screen, dialog, toast, and error fully localized. |
| **v6.1 — Mobile Layout Overhaul** | A slide-over **sidebar drawer** replaces the bottom bar; horizontal overflow eliminated on every screen. |
| **v6.2 — Zero-Config Networking** | LocalDock **registers its own Windows Firewall inbound rules** at server start — no manual setup. |
| **v6.3 — Hardened Auth** | Paired companion devices are consistently authorized on system, shares, devices, and activity routes. |

---

## ✨ Key Features | أبرز المميزات

| Feature | Description | الميزة بالعربية |
| :--- | :--- | :--- |
| 📁 **True Native Folder Sharing** | Share any real folder across any drive (`C:\`, `D:\`, etc.) without virtual sandboxes or fake paths. | **مشاركة مجلدات حقيقية:** اختر أي مجلد على أي قرص دون مجلدات وهمية. |
| 🔒 **100% Local-First & Air-Gapped** | All data stays strictly within your LAN. Works completely without an active internet connection. | **محلي 100% وبلا إنترنت:** خصوصية تامة ولا تخرج بياناتك خارج شبكتك إطلاقاً. |
| 📱 **Zero-Friction Device Pairing** | Pair any smartphone or tablet instantly via dynamic QR codes with single-use 5-minute TTL tokens. | **اقتران فوري عبر الـ QR:** اقرن هاتفك بثوانٍ عبر مسح رمز الاستجابة السريعة. |
| 🌍 **10-Language UI + RTL** | Every screen, dialog, toast, and error message fully localized in 10 languages; Arabic ships with complete RTL mirroring. | **واجهة بعشر لغات مع RTL:** تعريب شامل 100% لكل الشاشات والنوافذ والإشعارات، مع انعكاس كامل للاتجاه. |
| 🎨 **Theme Packs × Light/Dark** | 4 professional color packs (Teal, Ocean, Amethyst, Sunset), each with first-class light and dark modes. | **حزم ثيمات احترافية:** 4 ثيمات × وضعَي فاتح وداكن بإجمالي 8 توليفات مصقولة. |
| 🚀 **Chunked Resumable Uploads** | 4 MB chunks uploaded **3 in parallel** per file, SHA-256 verified, pause/resume, and auto-retry — the queue even survives page reloads. | **رفع متقطع قابل للاستئناف:** تشانكات 4 ميجابايت متوازية مع تحقق SHA-256 واستئناف بعد إعادة التحميل. |
| ⚡ **IDM-Style Parallel Downloads** | Large files are downloaded through **up to 4 parallel HTTP-Range connections** and streamed straight to disk. | **تحميل متوازٍ بنمط IDM:** حتى 4 اتصالات Range متوازية للملف الواحد لاستغلال كامل سرعة الشبكة. |
| 📊 **Live Cross-Device Transfer Activity** | Every connected device sees *who is transferring what* — live percentage, speed, and ETA — in real time. | **نشاط النقل الحي بين الأجهزة:** كل جهاز يرى من ينقل ماذا الآن بنسبة وسرعة ووقت متبقٍ. |
| 🖼️ **Cinematic Media Previews** | Zoom/rotate image viewer, video and audio players, PDF viewer — plus generated thumbnails with caching. | **معاينات وسائط احترافية:** عارض صور بتكبير وتدوير، مشغّل فيديو وصوت، قارئ PDF، ومصغّرات مولّدة. |
| 📂 **Device-Side Folder Upload** | Pick an entire folder **from the phone or laptop itself** with the browser-native picker; system junk files are filtered automatically. | **رفع مجلدات من الجهاز نفسه:** اختر مجلداً كاملاً من هاتفك أو حاسوبك مع فلترة تلقائية للملفات العشوائية. |
| 📱 **Adaptive Mobile Layout** | A slide-over sidebar drawer, compact top bar, and bottom sheets — zero horizontal overflow on any screen size. | **تخطيط محمول متكيف:** درج جانبي منسدل وشريط علوي مدمج وبلا أي تجاوز أفقي على أي حجم شاشة. |
| 🌐 **Static Website Hosting** | Host HTML/CSS/JS websites directly from any directory under `localdock.local/sites/{slug}`. | **استضافة مواقع ثابتة:** استضف مواقع الويب فوراً لجميع أجهزة الشبكة. |
| 🔗 **Smart LAN URLs** | Share links and QR codes automatically resolve to the LAN address proven reachable on your network. | **روابط شبكة ذكية:** روابط المشاركة تُبنى تلقائياً على عنوان الـ IP المحلي الصحيح. |
| 🖥️ **Windows Desktop Shell** | Native Tauri v2 app with System Tray, auto-start on boot, mDNS discovery, and **automatic Firewall rules**. | **تطبيق مكتبي متكامل لويندوز:** شريط مهام، بدء تلقائي، اكتشاف mDNS، وقواعد جدار حماية تلقائية. |

---

## 🌍 Global Localization | التعريب العالمي

LocalDock ships with a **fully-localized experience in 10 languages**. Nothing is left untranslated — dashboards, dialogs, toasts, onboarding, error strings, and even transfer-engine messages are covered:

| Code | Language | Native name | Direction |
| :--- | :--- | :--- | :---: |
| 🇬🇧 `en` | English | English | LTR |
| 🇸🇦 `ar` | Arabic | **العربية** | **RTL** |
| 🇪🇸 `es` | Spanish | Español | LTR |
| 🇫🇷 `fr` | French | Français | LTR |
| 🇩🇪 `de` | German | Deutsch | LTR |
| 🇧🇷 `pt` | Portuguese (Brazil) | Português | LTR |
| 🇷🇺 `ru` | Russian | Русский | LTR |
| 🇨🇳 `zh` | Chinese (Simplified) | 简体中文 | LTR |
| 🇮🇳 `hi` | Hindi | हिन्दी | LTR |
| 🇯🇵 `ja` | Japanese | 日本語 | LTR |

**How it works — engineered for quality:**

* **Type-enforced 100% coverage.** Every dictionary must match the English shape exactly (`SameShape<typeof en>`) — the TypeScript compiler rejects a build with even one missing key. No half-translated UI, ever.
* **Native names in their own script.** The language switcher always shows each language as its speakers write it (العربية, Español, 日本語…).
* **Smart detection.** On first visit the UI follows the browser's language; the saved preference (persisted in `localStorage`) wins afterwards.
* **Real RTL, not a flip hack.** Arabic switches `<html dir="rtl">` and the entire layout is built on logical CSS properties, so spacing, borders, drawers, and icons mirror naturally.
* **Adding a language is a two-file affair:** create `src/lib/localdock/i18n/<code>.ts` typed against the English dictionary, register it in `locales.ts` — the switcher, RTL handling, fonts, and formatting pick it up automatically.

---

## 🎨 Theming | الثيمات

Beyond the classic **Light / Dark / System** modes, LocalDock offers **4 professional theme packs** — and every combination is a first-class citizen with fully tuned variable sets:

| Pack | Accent ramp | Mood |
| :--- | :--- | :--- |
| 🟢 **Teal** *(default)* | `#0F766E` → `#14B8A6` → `#99F6E4` | The signature calm, focused LocalDock look |
| 🔵 **Ocean** | `#1D4ED8` → `#3B82F6` → `#BFDBFE` | Deep, productive blues |
| 🟣 **Amethyst** | `#7E22CE` → `#A855F7` → `#E9D5FF` | Creative violet energy |
| 🟠 **Sunset** | `#B45309` → `#F59E0B` → `#FDE68A` | Warm amber comfort |

The pack identity lives on `<html data-theme="…">` next to next-themes' `.dark` class, the choice persists in `localStorage`, and even the **browser chrome color** (`<meta name="theme-color">`) stays in lock-step with your pack × mode combination.

---

## 🖼️ Media Experience | تجربة الوسائط

* **Professional in-app previews.** Images open in a full viewer with zoom, rotate, and keyboard shortcuts (`+` / `-` / `0` / `R`); video and audio play in dedicated players; PDFs render inline — no downloads needed just to *look* at a file.
* **Server-side thumbnails.** Images are resized with **sharp** (EXIF-aware, WebP output); videos get a one-frame grab via **ffmpeg** when available, with automatic client-side fallbacks otherwise.
* **Aggressive caching.** An in-memory LRU plus a per-installation disk cache (`~/.thumbs/`, keyed by path + mtime + size + target size) means repeated folder views and multiple devices never re-encode the same file.
* **Auth that media elements can't break.** `<img>`/`<video>` tags can't send auth headers, so private shares authenticate media with short-lived share-scoped tokens (sliding 15-minute TTL, refreshed ahead of expiry) — previews work everywhere without weakening security.
* **HTTP Range streaming.** 4K video, audio, and large PDFs stream with smooth seeking directly inside the browser.

---

## ⚡ Transfer Engine | محرك النقل

A single client-side engine (built on zustand) powers every byte that moves:

| | Pipeline |
| :--- | :--- |
| **⬆️ Uploads** | Init session → **3 parallel 4 MB chunk PUTs** per file → SHA-256 verified finalize. Up to 2 files concurrently, auto-retry (×4, capped exponential backoff), and sessions reconcile with the server — reload the page and resume from where you stopped ("resume from 6.2 GB"). |
| **⬇️ Downloads** | **IDM-style: up to 4 parallel HTTP-Range connections** per file. With the File System Access API the stream writes straight to real disk (pause/resume supported); a blob fallback covers every other browser. The queue and resume state survive reloads via IndexedDB. |
| **📊 Live Activity** | Every upload and download is reported to an in-memory server-side bus — **every open device sees the same live picture**: who is transferring what, at what percentage, speed, and ETA. Stale entries are garbage-collected automatically (20 s heartbeat TTL). |

---

## 📱 Responsive by Design | تجاوب كامل

* **Desktop (≥ lg):** a fixed 240 px sidebar keeps navigation and device status one glance away.
* **Tablet & Phone:** the sidebar becomes a **slide-over drawer** (285–320 px, max 85 vw) triggered from a compact top bar — with a status footer inside the drawer.
* **Zero horizontal overflow** on any screen width; modals scale with `dvh` units; bottom sheets handle mobile actions.
* The icon-size **zoom control** in the file browser (Explorer-style presets + slider) adapts grid density from thumbnail galleries to dense list views.

---

## 📊 Feature Comparison | مقارنة مع البدائل

| Feature | **LocalDock** | **Google Drive / Dropbox** | **Syncthing** | **AirDrop** |
| :--- | :---: | :---: | :---: | :---: |
| **Storage Location** | Real local PC folders | Remote corporate servers | Synced duplicate folders | Ephemeral transfer |
| **Requires Internet** | ❌ No (LAN only) | ✅ Yes (mandatory) | ❌ No | ❌ No |
| **Speed Limit** | ⚡ Full LAN/Wi-Fi speed | 🐌 Limited by ISP upload | ⚡ Full LAN speed | ⚡ Wi-Fi Direct |
| **Accounts / Sign-up** | ❌ None | ✅ Required | ❌ None | ❌ None |
| **UI Languages** | ✅ **10 built-in + RTL** | ✅ Many (cloud-dependent) | ⚠️ Community-driven | ❌ OS-bound |
| **Theme System** | ✅ 4 packs × Light/Dark | ⚠️ Basic | ❌ None | ❌ OS-bound |
| **Resumable + Parallel Transfers** | ✅ Chunked, multi-connection | ✅ Yes | ✅ Yes | ❌ All-or-nothing |
| **Live Cross-Device Transfer View** | ✅ Built-in | ⚠️ Upload progress only | ⚠️ Technical UI | ❌ No |
| **Cross-Platform (Android/iOS/PC)** | ✅ Yes (Web + Apps) | ✅ Yes | ⚠️ Complex on iOS | ❌ Apple only |
| **Static Site Hosting** | ✅ Yes built-in | ❌ No | ❌ No | ❌ No |
| **Zero Setup / Instant UI** | ✅ 60-second wizard | ⚠️ Requires login | ⚠️ Technical UI | ✅ Seamless |

---

## 🏗️ Architecture | المعمارية التقنية

```text
 ┌─────────────────────────────────────────────────────────────┐
 │                    Local Network (LAN / Wi-Fi)              │
 └──────────────┬───────────────────────────────┬──────────────┘
                │                               │
       ┌────────▼────────┐             ┌────────▼────────┐
       │   Phone / Tablet│             │ Other Computers │
       │  (Web / PWA UI) │             │ (Browsers / PWA)│
       │  10 languages · │             │  10 languages · │
       │  RTL · 4 themes │             │  RTL · 4 themes │
       └────────▲────────┘             └────────▲────────┘
                │                               │
                └───────────────┬───────────────┘
                                │ HTTP / REST / mDNS
 ┌──────────────────────────────▼──────────────────────────────┐
 │                      LocalDock Host Machine                 │
 │                                                             │
 │   ┌─────────────────────────────────────────────────────┐   │
 │   │               Tauri v2 Desktop Shell                │   │
 │   │  • System Tray & Minimized Background Engine        │   │
 │   │  • Native Windows Folder Dialogs                    │   │
 │   │  • mDNS Broadcaster (localdock.local)               │   │
 │   │  • Auto-launch on Windows Startup (Registry)        │   │
 │   │  • Auto Windows Firewall Inbound Rules (netsh)      │   │
 │   └──────────────────────────┬──────────────────────────┘   │
 │                              │ Loopback Bridge              │
 │   ┌──────────────────────────▼──────────────────────────┐   │
 │   │             Next.js 16 Standalone Server            │   │
 │   │  • Chunked Upload Engine (4 MB, SHA-256 verified)   │   │
 │   │  • HTTP Range Streaming (206, multi-connection)     │   │
 │   │  • Thumbnail Service (sharp + optional ffmpeg)      │   │
 │   │  • Live Transfer Activity Bus (cross-device)        │   │
 │   │  • Pairing Token Store (5m TTL Single-Use)          │   │
 │   │  • Media Access Tokens (15m sliding TTL)            │   │
 │   │  • Static Site Hosting (/sites/{slug})              │   │
 │   └──────────────────────────┬──────────────────────────┘   │
 │                              │ Real Filesystem I/O          │
 │   ┌──────────────────────────▼──────────────────────────┐   │
 │   │    Your Real Hard Drives & Folders (C:\, D:\, etc.) │   │
 │   └─────────────────────────────────────────────────────┘   │
 └─────────────────────────────────────────────────────────────┘
```

---

## 🚀 Quick Start | البدء السريع

### 1. Download Windows App (Recommended)
Grab the latest release from the [Releases page](https://github.com/Youssef-Alaa-Hamdy/LocalDock/releases):
* **Installer:** `LocalDock_1.0.0_x64-setup.exe` (Recommended)
* **Portable:** `LocalDock-portable.zip` (No installation needed)

Windows builds are produced automatically by CI on every version tag.

### 2. Run from Source (Developers)

Ensure you have [Bun](https://bun.sh) (or Node.js 20+) installed:

```bash
# Clone the repository
git clone https://github.com/Youssef-Alaa-Hamdy/LocalDock.git
cd LocalDock

# Install dependencies
bun install

# Run development server
bun run dev
```

Open `http://localhost:3000` in your browser. The initial setup wizard will guide you in 60 seconds!

### 3. Build Windows Executable & Installer

```bash
# Build production web app + Tauri NSIS bundle
bun run build:windows
```

The resulting installer is generated at:
`src-tauri/target/release/bundle/nsis/LocalDock_1.0.0_x64-setup.exe`

---

## 📱 Pairing Mobile Devices | ربط الهواتف والأجهزة

1. Open LocalDock on your host computer.
2. Go to **Devices** → Click **Add Device** (or use the Setup Wizard).
3. A QR code containing a secure, single-use 5-minute pairing token is displayed.
4. Scan the QR code using your phone's camera:
   - Your phone immediately opens LocalDock in the browser.
   - It is granted a cryptographic device token and saved in local storage.
   - You can now browse, upload, download, and stream directly from your phone!

---

## 🛡️ Security & Privacy | الأمان والخصوصية

LocalDock is engineered with a strict **safe-by-default** security posture:

* **Strict LAN Scoping:** The server only accepts traffic from private IPv4/IPv6 address blocks (`10.0.0.0/8`, `172.16.0.0/12`, `192.168.0.0/16`, `127.0.0.1`).
* **Owner Authentication:** Server settings, share creation, and device revocation are strictly guarded by an `X-LocalDock-Owner` key generated on first launch.
* **Companion Device Authorization:** Paired devices are authorized consistently across system, shares, devices, and activity routes — no privilege gaps between owner console and companions.
* **Single-Use Pairing Tokens:** Pairing codes expire automatically after 5 minutes and are destroyed upon first redemption.
* **Short-Lived Media Tokens:** Private-share media elements authenticate via share-scoped tokens with a sliding 15-minute TTL — expiring previews without exposing credentials.
* **Path Traversal Protection:** Absolute path sanitization and boundary checks prevent arbitrary file access outside authorized shares.
* **Per-Share Permissions:** Every share can be configured as **Read Only** or **Read & Write**, with optional guest access.
* **Firewall Handled For You:** On Windows, LocalDock registers its own inbound allow rules (port + server runtime) at start — correct networking with zero manual setup.

---

## 📚 Documentation | الوثائق

Deeper documentation lives in the [`docs/`](docs/) folder (written in Arabic):

| Document | Description |
| :--- | :--- |
| [`docs/USER_GUIDE.md`](docs/USER_GUIDE.md) | دليل المستخدم بلغة الحياة اليومية — من أول 60 ثانية حتى الإتقان |
| [`docs/ARCHITECTURE.md`](docs/ARCHITECTURE.md) | المعمارية التقنية الكاملة والمبدأ الحاكم وراء كل قرار |
| [`docs/SECURITY.md`](docs/SECURITY.md) | نموذج الأمان: Safe by Default، الاقتران، والصلاحيات |
| [`docs/WINDOWS_APP.md`](docs/WINDOWS_APP.md) | تفاصيل غلاف Tauri v2 وتشغيل السيرفر كعملية خلفية |

---

## 🛠️ Tech Stack | التقنيات المستخدمة

* **Frontend:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/)
* **State & Transfers:** [zustand](https://zustand.docs.pmnd.rs/) transfer engine, File System Access API, IndexedDB persistence
* **i18n Engine:** Custom type-safe localization (`SameShape` compiler-enforced dictionaries), RTL via logical CSS properties — zero runtime dependencies
* **Theming:** [next-themes](https://github.com/pacocoursey/next-themes) (light/dark/system) + `data-theme` variable packs
* **Media Pipeline:** [sharp](https://sharp.pixelplumbing.com/) (image thumbnails), optional [ffmpeg](https://ffmpeg.org/) (video posters)
* **Desktop Shell:** [Tauri v2](https://tauri.app/) (Rust 2021 edition)
* **Local Networking:** mDNS / DNS-SD (`mdns-sd`), WebSocket / Server-Sent polling
* **Runtime:** [Node.js 22 LTS](https://nodejs.org/) & [Bun](https://bun.sh/)
* **Packaging & CI:** NSIS x64, GitHub Actions (`windows-build.yml`)

---

## 🤝 Contributing | المساهمة في المشروع

Contributions, bug reports, and feature suggestions are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

### 🌐 Adding a New Language

Thanks to the type-safe i18n architecture, contributing a translation is deliberately simple:

1. Create `src/lib/localdock/i18n/<code>.ts` exporting a dictionary typed as `SameShape<typeof en>` — the compiler will walk you through every key that needs a translation.
2. Register it in the `dictionaries` and `LOCALES` maps inside `src/lib/localdock/i18n/locales.ts`.

That's it — the switcher, RTL detection, fonts, and formatting adopt the new language automatically.

---

## 📄 License | الترخيص

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Youssef-Alaa-Hamdy">Youssef Alaa Hamdy</a>. Designed for local privacy and high performance.</sub>
</div>
