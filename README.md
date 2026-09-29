<div align="center">

# ⚓ LocalDock

### Turn Any Computer into a Private Personal Cloud for Your Local Network
**حوّل أي كمبيوتر إلى سحابة شخصية محلية خاصة — بلا Cloud، بلا حسابات، وبلا قيود**

[![Platform: Windows](https://img.shields.io/badge/Platform-Windows%20x64-0078D6?logo=windows&logoColor=white)](https://github.com/Youssef-Alaa-Hamdy/LocalDock/releases)
[![Tauri v2](https://img.shields.io/badge/Tauri-v2-FFC131?logo=tauri&logoColor=black)](https://tauri.app/)
[![Next.js 16](https://img.shields.io/badge/Next.js-16%20(Turbopack)-black?logo=next.js&logoColor=white)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.x-3178C6?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Rust](https://img.shields.io/badge/Rust-Stable-DEA584?logo=rust&logoColor=black)](https://www.rust-lang.org/)
[![Local-First](https://img.shields.io/badge/Architecture-100%25%20Local--First-22c55e?logo=shield)](https://github.com/Youssef-Alaa-Hamdy/LocalDock)
[![License: MIT](https://img.shields.io/badge/License-MIT-blue.svg)](LICENSE)

[English](#-english-overview) • [العربية](#-نظرة-عامة-بالعربية) • [Quick Start](#-quick-start) • [Architecture](#-architecture) • [Security](#-security--privacy) • [Releases](https://github.com/Youssef-Alaa-Hamdy/LocalDock/releases)

---

</div>

<br/>

## 🌟 English Overview

**LocalDock** makes local networking feel invisible. It is a modern, privacy-first personal cloud server and desktop application designed to bridge all your devices (phones, tablets, laptops) over your home or office Wi-Fi.

Unlike traditional cloud providers (Google Drive, Dropbox) or complex NAS setups, **LocalDock stores files directly in the real folders of your computer** — no subscription, no tracking, zero internet bandwidth consumed, and zero third-party dependencies.

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

بخلاف الخدمات السحابية التقليدية أو أنظمة NAS المعقدة، **LocalDock يعمل مباشرة على المجلدات الحقيقية على جهازك** (في أي قرص مثل `C:\` أو `D:\`) — بدون اشتراكات، بدون إنترنت، وبأعلى سرعة ممكنة لشبكتك المنزلية.

---

## ✨ Key Features | أبرز المميزات

| Feature | Description | الميزة بالعربية |
| :--- | :--- | :--- |
| 📁 **True Native Folder Sharing** | Share any real folder across any drive (`C:\`, `D:\`, etc.) without virtual sandboxes or fake paths. | **مشاركة مجلدات حقيقية:** اختر أي مجلد على أي قرص دون مجلدات وهمية. |
| 🔒 **100% Local-First & Air-Gapped** | All data stays strictly within your LAN. Works completely without an active internet connection. | **محلي 100% وبلا إنترنت:** خصوصية تامة ولا تخرج بياناتك خارج شبكتك إطلاقاً. |
| 📱 **Zero-Friction Device Pairing** | Pair any smartphone or tablet instantly via dynamic QR codes with single-use 5-minute TTL tokens. | **اقتران فوري عبر الـ QR:** اقرن هاتفك بثوانٍ عبر مسح رمز الاستجابة السريعة. |
| 🚀 **Chunked Resumable Transfers** | 4MB chunked streaming engine with SHA-256 checksum verification, pause/resume, and auto-retry. | **محرك نقل متقطع واستئناف ذكي:** يدعم إيقاف واستئناف الرفع والتحميل حتى للملفات الضخمة. |
| 🎬 **HTTP Range Streaming** | Stream 4K video, audio, and large PDFs with smooth seeking directly inside your browser. | **بث الوسائط (Range Streaming):** تشغيل الفيديو والصوت فوراً مع إمكانية التقديم والتأخير. |
| 🌐 **Static Website Hosting** | Host HTML/CSS/JS websites directly from any directory under `localdock.local/sites/{slug}`. | **استضافة مواقع ثابتة:** استضف مواقع الويب فوراً لجميع أجهزة الشبكة. |
| 🖥️ **Windows Desktop Shell** | Native Tauri v2 app with System Tray, auto-start on Windows boot, and automatic mDNS discovery. | **تطبيق مكتبي متكامل لويندوز:** خفيف وسريع، يعمل في شريط المهام (Tray) ويبدأ مع النظام. |

---

## 📊 Feature Comparison | مقارنة مع البدائل

| Feature | **LocalDock** | **Google Drive / Dropbox** | **Syncthing** | **AirDrop** |
| :--- | :---: | :---: | :---: | :---: |
| **Storage Location** | Real local PC folders | Remote corporate servers | Synced duplicate folders | Ephemeral transfer |
| **Requires Internet** | ❌ No (LAN only) | ✅ Yes (mandatory) | ❌ No | ❌ No |
| **Speed Limit** | ⚡ Full LAN/Wi-Fi speed | 🐌 Limited by ISP upload | ⚡ Full LAN speed | ⚡ Wi-Fi Direct |
| **Accounts / Sign-up** | ❌ None | ✅ Required | ❌ None | ❌ None |
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
 │   └──────────────────────────┬──────────────────────────┘   │
 │                              │ Loopback Bridge              │
 │   ┌──────────────────────────▼──────────────────────────┐   │
 │   │             Next.js 16 Standalone Server            │   │
 │   │  • Chunked Transfer Engine (4MB SHA-256 verified)   │   │
 │   │  • Range Streaming Service (Video / Audio / PDF)    │   │
 │   │  • Pairing Token Store (5m TTL Single-Use)          │   │
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
* **Single-Use Pairing Tokens:** Pairing codes expire automatically after 5 minutes and are destroyed upon first redemption.
* **Path Traversal Protection:** Absolute path sanitization and boundary checks prevent arbitrary file access outside authorized shares.
* **Per-Share Permissions:** Every share can be configured as **Read Only** or **Read & Write**, with optional guest access.

---

## 🛠️ Tech Stack | التقنيات المستخدمة

* **Frontend:** [Next.js 16](https://nextjs.org/) (App Router, Turbopack), [React 19](https://react.dev/), [Tailwind CSS](https://tailwindcss.com/), [Radix UI](https://www.radix-ui.com/), [Lucide Icons](https://lucide.dev/)
* **Desktop Shell:** [Tauri v2](https://tauri.app/) (Rust 2021 edition)
* **Local Networking:** mDNS / DNS-SD (`mdns-sd`), WebSocket / Server-Sent polling
* **Runtime:** [Node.js 22 LTS](https://nodejs.org/) & [Bun](https://bun.sh/)
* **Packaging:** NSIS (Nullsoft Scriptable Install System) x64

---

## 🤝 Contributing | المساهمة في المشروع

Contributions, bug reports, and feature suggestions are welcome!

1. Fork the Project
2. Create your Feature Branch (`git checkout -b feature/AmazingFeature`)
3. Commit your Changes (`git commit -m 'Add some AmazingFeature'`)
4. Push to the Branch (`git push origin feature/AmazingFeature`)
5. Open a Pull Request

---

## 📄 License | الترخيص

Distributed under the **MIT License**. See [`LICENSE`](LICENSE) for more information.

---

<div align="center">
  <sub>Built with ❤️ by <a href="https://github.com/Youssef-Alaa-Hamdy">Youssef Alaa Hamdy</a>. Designed for local privacy and high performance.</sub>
</div>
