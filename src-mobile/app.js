/* LocalDock — Android companion launcher.
 *
 * Vanilla, dependency-free static frontend bundled by Tauri for Android.
 * Talks to the Rust shell through two commands:
 *   discover_hosts({ timeoutMs }) -> { subnet, scanned, hosts: [...] }
 *   probe_host({ baseUrl })       -> { reachable, name, serverId, version }
 *
 * "Open" simply navigates the webview to the host UI — the product's own
 * web pairing flow (?pair=CODE) does the rest and stores the device token
 * in the webview's localStorage, exactly like a regular browser.
 */
"use strict";

/* ------------------------------ i18n ----------------------------------- */

const LANG_META = [
  ["en", "English"],
  ["ar", "العربية"],
  ["es", "Español"],
  ["fr", "Français"],
  ["de", "Deutsch"],
  ["pt", "Português"],
  ["ru", "Русский"],
  ["zh", "简体中文"],
  ["hi", "हिन्दी"],
  ["ja", "日本語"],
];

const I18N = {
  en: {
    tagline: "Your personal local cloud",
    discoveryTitle: "Servers on this network",
    looking: "Looking for LocalDock servers…",
    lookingHint: "Make sure LocalDock is running on your computer and connected to the same Wi-Fi.",
    rescan: "Rescan",
    online: "Online",
    offline: "No response",
    open: "Open",
    pairCta: "Pair",
    forget: "Forget",
    saved: "Saved",
    sourceMdns: "mDNS",
    sourceScan: "Scan",
    noneFound: "No servers found yet",
    noneFoundHint: "Check that LocalDock runs on the computer on the same network, or connect manually below.",
    pairTitle: "Pair with a code",
    pairHint: "On the computer: Devices → Add device shows a 6-character code.",
    hostLabel: "Server",
    hostManual: "Enter manually…",
    codeLabel: "Pairing code",
    deviceLabel: "This device's name",
    devicePlaceholder: "My phone",
    pairGo: "Pair & open",
    errBadCode: "Enter the 6-character code shown on the computer.",
    errNoHost: "Choose or enter a server first.",
    errProbe: "The server didn't respond.",
    manualTitle: "Connect manually",
    manualHint: "Enter the address shown in LocalDock on the computer (e.g. 192.168.1.3:3000).",
    connect: "Connect",
    errAddress: "That address doesn't look right — try host:port.",
    footerHint: "Works only on your local network — nothing ever leaves it.",
    footerCompanion: "Companion app",
    browserNotice: "The launcher was opened outside the LocalDock app, so discovery is unavailable — use manual connect.",
  },
  ar: {
    tagline: "سحابتك المحلية الخاصة",
    discoveryTitle: "الخوادم على هذه الشبكة",
    looking: "أبحث عن خوادم LocalDock…",
    lookingHint: "تأكد من تشغيل LocalDock على حاسوبك ومن اتصاله بنفس شبكة Wi-Fi.",
    rescan: "إعادة البحث",
    online: "متصل",
    offline: "لا يستجيب",
    open: "فتح",
    pairCta: "اقتران",
    forget: "نسيان",
    saved: "محفوظ",
    sourceMdns: "mDNS",
    sourceScan: "مسح الشبكة",
    noneFound: "لا خوادم حتى الآن",
    noneFoundHint: "تحقق من تشغيل LocalDock على الحاسوب وعلى نفس الشبكة، أو اتصل يدوياً بالأسفل.",
    pairTitle: "الاقتران برمز",
    pairHint: "على الحاسوب: الأجهزة ← إضافة جهاز يعرض رمزاً من 6 أحرف.",
    hostLabel: "الخادم",
    hostManual: "إدخال يدوي…",
    codeLabel: "رمز الاقتران",
    deviceLabel: "اسم هذا الجهاز",
    devicePlaceholder: "هاتفي",
    pairGo: "اقتران وفتح",
    errBadCode: "أدخل الرمز المكوّن من 6 أحرف المعروض على الحاسوب.",
    errNoHost: "اختر خادماً أو أدخله أولاً.",
    errProbe: "الخادم لم يستجب.",
    manualTitle: "اتصال يدوي",
    manualHint: "أدخل العنوان الظاهر في LocalDock على الحاسوب (مثال: 192.168.1.3:3000).",
    connect: "اتصال",
    errAddress: "العنوان غير صحيح — جرّب host:port.",
    footerHint: "يعمل على شبكتك المحلية فقط — لا شيء يخرج منها أبداً.",
    footerCompanion: "التطبيق المرافق",
    browserNotice: "فُتح المُطلق خارج تطبيق LocalDock، لذا الاكتشاف غير متاح — استخدم الاتصال اليدوي.",
  },
  es: {
    tagline: "Tu nube local personal",
    discoveryTitle: "Servidores en esta red",
    looking: "Buscando servidores de LocalDock…",
    lookingHint: "Asegúrate de que LocalDock esté en ejecución en tu ordenador y conectado a la misma Wi-Fi.",
    rescan: "Volver a buscar",
    online: "En línea",
    offline: "Sin respuesta",
    open: "Abrir",
    pairCta: "Vincular",
    forget: "Olvidar",
    saved: "Guardado",
    sourceMdns: "mDNS",
    sourceScan: "Escaneo",
    noneFound: "Aún no hay servidores",
    noneFoundHint: "Comprueba que LocalDock se ejecute en el ordenador y en la misma red, o conéctate manualmente abajo.",
    pairTitle: "Vincular con código",
    pairHint: "En el ordenador: Dispositivos → Añadir dispositivo muestra un código de 6 caracteres.",
    hostLabel: "Servidor",
    hostManual: "Introducir manualmente…",
    codeLabel: "Código de vinculación",
    deviceLabel: "Nombre de este dispositivo",
    devicePlaceholder: "Mi teléfono",
    pairGo: "Vincular y abrir",
    errBadCode: "Introduce el código de 6 caracteres que muestra el ordenador.",
    errNoHost: "Elige o introduce un servidor primero.",
    errProbe: "El servidor no respondió.",
    manualTitle: "Conexión manual",
    manualHint: "Introduce la dirección que muestra LocalDock en el ordenador (p. ej. 192.168.1.3:3000).",
    connect: "Conectar",
    errAddress: "Esa dirección no parece válida — prueba host:puerto.",
    footerHint: "Funciona solo en tu red local — nada sale de ella.",
    footerCompanion: "Aplicación complementaria",
    browserNotice: "Abriste el lanzador fuera de la app de LocalDock; el descubrimiento no está disponible — usa la conexión manual.",
  },
  fr: {
    tagline: "Votre cloud local personnel",
    discoveryTitle: "Serveurs sur ce réseau",
    looking: "Recherche de serveurs LocalDock…",
    lookingHint: "Assurez-vous que LocalDock tourne sur l'ordinateur et qu'il est connecté au même Wi-Fi.",
    rescan: "Relancer la recherche",
    online: "En ligne",
    offline: "Injoignable",
    open: "Ouvrir",
    pairCta: "Associer",
    forget: "Oublier",
    saved: "Enregistré",
    sourceMdns: "mDNS",
    sourceScan: "Analyse",
    noneFound: "Aucun serveur pour l'instant",
    noneFoundHint: "Vérifiez que LocalDock tourne sur l'ordinateur et sur le même réseau, ou connectez-vous manuellement ci-dessous.",
    pairTitle: "Associer avec un code",
    pairHint: "Sur l'ordinateur : Appareils → Ajouter un appareil affiche un code à 6 caractères.",
    hostLabel: "Serveur",
    hostManual: "Saisie manuelle…",
    codeLabel: "Code d'association",
    deviceLabel: "Nom de cet appareil",
    devicePlaceholder: "Mon téléphone",
    pairGo: "Associer et ouvrir",
    errBadCode: "Saisissez le code à 6 caractères affiché sur l'ordinateur.",
    errNoHost: "Choisissez ou saisissez d'abord un serveur.",
    errProbe: "Le serveur n'a pas répondu.",
    manualTitle: "Connexion manuelle",
    manualHint: "Saisissez l'adresse affichée dans LocalDock sur l'ordinateur (ex. 192.168.1.3:3000).",
    connect: "Se connecter",
    errAddress: "Cette adresse semble invalide — essayez hôte:port.",
    footerHint: "Fonctionne uniquement sur votre réseau local — rien n'en sort jamais.",
    footerCompanion: "Application compagne",
    browserNotice: "Vous avez ouvert le lanceur hors de l'application LocalDock : la découverte est indisponible — utilisez la connexion manuelle.",
  },
  de: {
    tagline: "Deine persönliche lokale Cloud",
    discoveryTitle: "Server in diesem Netzwerk",
    looking: "Suche nach LocalDock-Servern…",
    lookingHint: "Stelle sicher, dass LocalDock auf dem Computer läuft und im selben WLAN angemeldet ist.",
    rescan: "Erneut suchen",
    online: "Online",
    offline: "Keine Antwort",
    open: "Öffnen",
    pairCta: "Koppeln",
    forget: "Vergessen",
    saved: "Gespeichert",
    sourceMdns: "mDNS",
    sourceScan: "Scan",
    noneFound: "Noch keine Server gefunden",
    noneFoundHint: "Prüfe, ob LocalDock auf dem Computer im selben Netzwerk läuft, oder verbinde dich unten manuell.",
    pairTitle: "Mit Code koppeln",
    pairHint: "Am Computer: Geräte → Gerät hinzufügen zeigt einen 6-stelligen Code.",
    hostLabel: "Server",
    hostManual: "Manuell eingeben…",
    codeLabel: "Kopplungscode",
    deviceLabel: "Name dieses Geräts",
    devicePlaceholder: "Mein Handy",
    pairGo: "Koppeln und öffnen",
    errBadCode: "Gib den 6-stelligen Code ein, der am Computer angezeigt wird.",
    errNoHost: "Wähle oder gib zuerst einen Server ein.",
    errProbe: "Der Server hat nicht geantwortet.",
    manualTitle: "Manuell verbinden",
    manualHint: "Gib die Adresse ein, die LocalDock am Computer anzeigt (z. B. 192.168.1.3:3000).",
    connect: "Verbinden",
    errAddress: "Diese Adresse wirkt ungültig — versuche Host:Port.",
    footerHint: "Funktioniert nur in deinem lokalen Netzwerk — nichts verlässt es.",
    footerCompanion: "Begleit-App",
    browserNotice: "Der Launcher wurde außerhalb der LocalDock-App geöffnet; die Suche ist nicht verfügbar — nutze die manuelle Verbindung.",
  },
  pt: {
    tagline: "Sua nuvem local pessoal",
    discoveryTitle: "Servidores nesta rede",
    looking: "Procurando servidores do LocalDock…",
    lookingHint: "Verifique se o LocalDock está em execução no computador e conectado ao mesmo Wi-Fi.",
    rescan: "Buscar de novo",
    online: "On-line",
    offline: "Sem resposta",
    open: "Abrir",
    pairCta: "Parear",
    forget: "Esquecer",
    saved: "Salvo",
    sourceMdns: "mDNS",
    sourceScan: "Varredura",
    noneFound: "Nenhum servidor por enquanto",
    noneFoundHint: "Confira se o LocalDock está em execução no computador e na mesma rede, ou conecte-se manualmente abaixo.",
    pairTitle: "Parear com código",
    pairHint: "No computador: Dispositivos → Adicionar dispositivo mostra um código de 6 caracteres.",
    hostLabel: "Servidor",
    hostManual: "Inserir manualmente…",
    codeLabel: "Código de pareamento",
    deviceLabel: "Nome deste dispositivo",
    devicePlaceholder: "Meu celular",
    pairGo: "Parear e abrir",
    errBadCode: "Digite o código de 6 caracteres mostrado no computador.",
    errNoHost: "Escolha ou insira um servidor primeiro.",
    errProbe: "O servidor não respondeu.",
    manualTitle: "Conexão manual",
    manualHint: "Insira o endereço exibido no LocalDock do computador (ex.: 192.168.1.3:3000).",
    connect: "Conectar",
    errAddress: "Esse endereço parece inválido — tente host:porta.",
    footerHint: "Funciona apenas na sua rede local — nada sai dela.",
    footerCompanion: "Aplicativo complementar",
    browserNotice: "Você abriu o iniciador fora do app do LocalDock; a descoberta não está disponível — use a conexão manual.",
  },
  ru: {
    tagline: "Ваше личное локальное облако",
    discoveryTitle: "Серверы в этой сети",
    looking: "Поиск серверов LocalDock…",
    lookingHint: "Убедитесь, что LocalDock запущен на компьютере и подключён к той же сети Wi-Fi.",
    rescan: "Искать снова",
    online: "В сети",
    offline: "Нет ответа",
    open: "Открыть",
    pairCta: "Связать",
    forget: "Забыть",
    saved: "Сохранено",
    sourceMdns: "mDNS",
    sourceScan: "Сканирование",
    noneFound: "Пока серверов нет",
    noneFoundHint: "Проверьте, что LocalDock запущен на компьютере в той же сети, или подключитесь вручную ниже.",
    pairTitle: "Связать по коду",
    pairHint: "На компьютере: Устройства → Добавить устройство — появится код из 6 символов.",
    hostLabel: "Сервер",
    hostManual: "Ввести вручную…",
    codeLabel: "Код сопряжения",
    deviceLabel: "Имя этого устройства",
    devicePlaceholder: "Мой телефон",
    pairGo: "Связать и открыть",
    errBadCode: "Введите 6-символьный код, показанный на компьютере.",
    errNoHost: "Сначала выберите или введите сервер.",
    errProbe: "Сервер не ответил.",
    manualTitle: "Ручное подключение",
    manualHint: "Введите адрес из LocalDock на компьютере (например, 192.168.1.3:3000).",
    connect: "Подключить",
    errAddress: "Адрес выглядит неверным — попробуйте host:port.",
    footerHint: "Работает только в вашей локальной сети — ничего не выходит за её пределы.",
    footerCompanion: "Сопутствующее приложение",
    browserNotice: "Лаунчер открыт вне приложения LocalDock: обнаружение недоступно — используйте ручное подключение.",
  },
  zh: {
    tagline: "你的专属本地云",
    discoveryTitle: "此网络中的服务器",
    looking: "正在查找 LocalDock 服务器…",
    lookingHint: "请确保电脑正在运行 LocalDock，并且连接到同一个 Wi-Fi。",
    rescan: "重新扫描",
    online: "在线",
    offline: "无响应",
    open: "打开",
    pairCta: "配对",
    forget: "忽略",
    saved: "已保存",
    sourceMdns: "mDNS",
    sourceScan: "扫描",
    noneFound: "暂未发现服务器",
    noneFoundHint: "请确认电脑上的 LocalDock 正在运行并处于同一网络，或在下方手动连接。",
    pairTitle: "使用配对码",
    pairHint: "在电脑上：设备 → 添加设备，会显示 6 位配对码。",
    hostLabel: "服务器",
    hostManual: "手动输入…",
    codeLabel: "配对码",
    deviceLabel: "本设备名称",
    devicePlaceholder: "我的手机",
    pairGo: "配对并打开",
    errBadCode: "请输入电脑上显示的 6 位配对码。",
    errNoHost: "请先选择或输入服务器。",
    errProbe: "服务器没有响应。",
    manualTitle: "手动连接",
    manualHint: "输入电脑上 LocalDock 显示的地址（如 192.168.1.3:3000）。",
    connect: "连接",
    errAddress: "地址似乎不正确——请尝试 主机:端口。",
    footerHint: "仅在本地网络内工作——数据绝不离开你的网络。",
    footerCompanion: "伴侣应用",
    browserNotice: "启动器是在 LocalDock 应用之外打开的，无法自动发现——请使用手动连接。",
  },
  hi: {
    tagline: "आपका निजी लोकल क्लाउड",
    discoveryTitle: "इस नेटवर्क पर सर्वर",
    looking: "LocalDock सर्वर खोजे जा रहे हैं…",
    lookingHint: "सुनिश्चित करें कि आपके कंप्यूटर पर LocalDock चल रहा है और वह उसी Wi-Fi से जुड़ा है।",
    rescan: "फिर खोजें",
    online: "ऑनलाइन",
    offline: "कोई जवाब नहीं",
    open: "खोलें",
    pairCta: "जोड़ें",
    forget: "भूलें",
    saved: "सहेजा गया",
    sourceMdns: "mDNS",
    sourceScan: "स्कैन",
    noneFound: "अभी कोई सर्वर नहीं मिला",
    noneFoundHint: "जाँचें कि कंप्यूटर पर LocalDock चल रहा है और वही नेटवर्क है, या नीचे मैन्युअल रूप से कनेक्ट करें।",
    pairTitle: "कोड से जोड़ें",
    pairHint: "कंप्यूटर पर: डिवाइस → डिवाइस जोड़ें — 6 अक्षरों का कोड दिखेगा।",
    hostLabel: "सर्वर",
    hostManual: "मैन्युअल रूप से दर्ज करें…",
    codeLabel: "पेयरिंग कोड",
    deviceLabel: "इस डिवाइस का नाम",
    devicePlaceholder: "मेरा फ़ोन",
    pairGo: "जोड़ें और खोलें",
    errBadCode: "कंप्यूटर पर दिखाया गया 6 अक्षरों का कोड दर्ज करें।",
    errNoHost: "पहले कोई सर्वर चुनें या दर्ज करें।",
    errProbe: "सर्वर ने जवाब नहीं दिया।",
    manualTitle: "मैन्युअल कनेक्शन",
    manualHint: "कंप्यूटर पर LocalDock में दिखाया गया पता दर्ज करें (जैसे 192.168.1.3:3000)।",
    connect: "कनेक्ट",
    errAddress: "यह पता सही नहीं लगता — host:port आज़माएँ।",
    footerHint: "केवल आपके लोकल नेटवर्क पर काम करता है — कुछ भी बाहर नहीं जाता।",
    footerCompanion: "साथी ऐप",
    browserNotice: "आपने लॉन्चर को LocalDock ऐप के बाहर खोला है, इसलिए खोज उपलब्ध नहीं है — मैन्युअल कनेक्शन इस्तेमाल करें।",
  },
  ja: {
    tagline: "あなた専用のローカルクラウド",
    discoveryTitle: "このネットワーク上のサーバー",
    looking: "LocalDock サーバーを探しています…",
    lookingHint: "パソコンで LocalDock が起動し、同じ Wi-Fi に接続していることを確認してください。",
    rescan: "再スキャン",
    online: "オンライン",
    offline: "応答なし",
    open: "開く",
    pairCta: "ペアリング",
    forget: "削除",
    saved: "保存済み",
    sourceMdns: "mDNS",
    sourceScan: "スキャン",
    noneFound: "サーバーはまだ見つかりません",
    noneFoundHint: "パソコンで LocalDock が同じネットワークで動作しているか確認するか、下から手動で接続してください。",
    pairTitle: "コードでペアリング",
    pairHint: "パソコン側：デバイス → デバイスを追加 に 6 文字のコードが表示されます。",
    hostLabel: "サーバー",
    hostManual: "手動で入力…",
    codeLabel: "ペアリングコード",
    deviceLabel: "このデバイスの名前",
    devicePlaceholder: "自分のスマホ",
    pairGo: "ペアリングして開く",
    errBadCode: "パソコンに表示された 6 文字のコードを入力してください。",
    errNoHost: "先にサーバーを選択または入力してください。",
    errProbe: "サーバーが応答しません。",
    manualTitle: "手動で接続",
    manualHint: "パソコンの LocalDock に表示されるアドレスを入力してください（例：192.168.1.3:3000）。",
    connect: "接続",
    errAddress: "アドレスが正しくないようです — ホスト:ポート を試してください。",
    footerHint: "ローカルネットワーク内でのみ動作します — データは外に出ません。",
    footerCompanion: "コンパニオンアプリ",
    browserNotice: "LocalDock アプリの外でランチャーが開かれたため、検出は利用できません — 手動接続をご利用ください。",
  },
};

/* ------------------------------ helpers --------------------------------- */

const $ = (sel) => document.querySelector(sel);

const LANG_KEY = "localdock.launcher.lang";
const HOSTS_KEY = "localdock.launcher.hosts";
const CODE_ALPHABET = /^[A-HJ-NP-Z2-9]{6}$/;

function store(key, fallback) {
  try {
    return window.localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
}

function saveStore(key, value) {
  try {
    window.localStorage.setItem(key, value);
  } catch {
    /* private mode */
  }
}

function loadHosts() {
  try {
    return JSON.parse(store(HOSTS_KEY, "[]")) ?? [];
  } catch {
    return [];
  }
}

function saveHosts(list) {
  saveStore(HOSTS_KEY, JSON.stringify(list));
}

function saveHost(url, name) {
  const list = loadHosts().filter((h) => h.url !== url);
  list.unshift({ url, name: name || "LocalDock" });
  saveStore(HOSTS_KEY, JSON.stringify(list.slice(0, 8)));
}

function forgetHost(url) {
  saveStore(HOSTS_KEY, JSON.stringify(loadHosts().filter((h) => h.url !== url)));
}

function t(key) {
  return I18N[lang]?.[key] ?? I18N.en[key] ?? key;
}

function invoke(cmd, args) {
  const fn = window.__TAURI?.core?.invoke;
  if (typeof fn !== "function") {
    return Promise.reject(new Error("no-tauri"));
  }
  return fn(cmd, args);
}

let toastTimer = null;
function toast(message) {
  const el = $("#toast");
  el.textContent = message;
  el.classList.remove("hidden");
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => el.classList.add("hidden"), 3200);
}

/** Normalize manual input to an origin URL with an explicit port. */
function normalizeHost(raw) {
  const trimmed = String(raw || "").trim();
  if (!trimmed) return null;
  const withScheme = /^https?:\/\//i.test(trimmed) ? trimmed : `http://${trimmed}`;
  try {
    const url = new URL(withScheme);
    if (!url.hostname) return null;
    if (url.protocol !== "http:") return null;
    const port = url.port || "3000";
    return { url: `${url.protocol}//${url.hostname}:${port}`, name: url.hostname };
  } catch {
    return null;
  }
}

/* ------------------------------- state ---------------------------------- */

let lang = "en";
/** Whether the out-of-app notice is currently visible (re-translated on
 * language switch). */
let noticeShown = false;
/** url -> {url, name, version?, source, state: online|offline|unknown} */
const hostMap = new Map();
let scanning = false;

function detectLang() {
  const saved = store(LANG_KEY, "");
  if (saved && I18N[saved]) return saved;
  const candidates = navigator.languages ?? [navigator.language];
  for (const candidate of candidates) {
    const base = String(candidate || "").toLowerCase().split("-")[0];
    if (I18N[base]) return base;
  }
  return "en";
}

function applyLang() {
  document.documentElement.lang = lang;
  document.documentElement.dir = lang === "ar" ? "rtl" : "ltr";
  document.querySelectorAll("[data-i]").forEach((el) => {
    el.textContent = t(el.getAttribute("data-i"));
  });
  const notice = $("#notice");
  notice.textContent = noticeShown ? t("browserNotice") : "";
  notice.classList.toggle("hidden", !noticeShown);
  buildLangSelect();
  buildHostSelect();
  renderHosts();
}

function buildLangSelect() {
  const sel = $("#lang");
  sel.innerHTML = "";
  for (const [code, label] of LANG_META) {
    const opt = document.createElement("option");
    opt.value = code;
    opt.textContent = label;
    sel.appendChild(opt);
  }
  sel.value = lang;
}

function knownHosts() {
  return [...hostMap.values()];
}

function buildHostSelect() {
  const sel = $("#pairHost");
  const previous = sel.value;
  sel.innerHTML = "";
  const manual = document.createElement("option");
  manual.value = "__manual__";
  manual.textContent = t("hostManual");
  sel.appendChild(manual);
  for (const host of knownHosts()) {
    const opt = document.createElement("option");
    opt.value = host.url;
    opt.textContent = `${host.name} (${host.url.replace("http://", "")})`;
    sel.appendChild(opt);
  }
  sel.value = [...sel.options].some((o) => o.value === previous) ? previous : knownHosts()[0]?.url ?? "__manual__";
  $("#pairHostManual").classList.toggle("hidden", sel.value !== "__manual__");
}

function chipLabel(source) {
  if (source === "mdns") return t("sourceMdns");
  if (source === "network-scan") return t("sourceScan");
  return t("saved");
}

function renderHosts() {
  const wrap = $("#hosts");
  const hosts = knownHosts();
  wrap.classList.toggle("hidden", hosts.length === 0 && !scanning);

  if (!scanning && hosts.length === 0) {
    wrap.innerHTML = "";
    const empty = document.createElement("div");
    empty.className = "card";
    empty.innerHTML = `<h3></h3><p class="muted"></p>`;
    empty.querySelector("h3").textContent = t("noneFound");
    empty.querySelector("p").textContent = t("noneFoundHint");
    wrap.appendChild(empty);
    return;
  }
  if (hosts.length === 0) return;

  wrap.innerHTML = "";
  for (const host of hosts) {
    const card = document.createElement("article");
    card.className = "card host";

    const head = document.createElement("div");
    head.className = "host-head";
    const title = document.createElement("div");
    title.className = "host-title";
    const name = document.createElement("span");
    name.className = "host-name";
    name.textContent = host.name || "LocalDock";
    const src = document.createElement("span");
    src.className = "chip";
    src.textContent = chipLabel(host.source);
    title.append(name, src);
    if (host.version) {
      const ver = document.createElement("span");
      ver.className = "chip";
      ver.textContent = `v${host.version}`;
      title.append(ver);
    }
    const state = document.createElement("span");
    state.className = `chip state ${host.state === "online" ? "online" : host.state === "offline" ? "offline" : ""}`;
    state.textContent = host.state === "online" ? t("online") : host.state === "offline" ? t("offline") : "…";
    head.append(title, state);
    card.appendChild(head);

    const url = document.createElement("p");
    url.className = "url";
    url.textContent = host.url;
    card.appendChild(url);

    const actions = document.createElement("div");
    actions.className = "host-actions";
    const open = document.createElement("button");
    open.className = "btn primary";
    open.type = "button";
    open.textContent = t("open");
    open.addEventListener("click", () => {
      saveHost(host.url, host.name);
      window.location.href = `${host.url.replace(/\/$/, "")}/`;
    });
    const pair = document.createElement("button");
    pair.className = "btn ghost";
    pair.type = "button";
    pair.textContent = t("pairCta");
    pair.addEventListener("click", () => {
      buildHostSelect();
      $("#pairHost").value = host.url;
      $("#pairHostManual").classList.add("hidden");
      $("#pairCode").focus();
      card.scrollIntoView({ behavior: "smooth", block: "end" });
    });
    const spacer = document.createElement("span");
    spacer.className = "spacer";
    const forget = document.createElement("button");
    forget.className = "btn icon";
    forget.type = "button";
    forget.title = t("forget");
    forget.textContent = "✕";
    forget.addEventListener("click", () => {
      forgetHost(host.url);
      hostMap.delete(host.url);
      buildHostSelect();
      renderHosts();
    });
    actions.append(open, pair, spacer, forget);
    card.appendChild(actions);
    wrap.appendChild(card);
  }
}

/* ------------------------------ scanning -------------------------------- */

function setScanning(active) {
  scanning = active;
  document.body.classList.toggle("scanning", active);
  $("#radar").classList.toggle("hidden", !active);
  $("#rescan").disabled = active;
  $("#scanHint").textContent = t("looking");
  if (active) renderHosts();
}

async function scan() {
  if (scanning) return;
  setScanning(true);
  hostMap.clear();
  for (const saved of loadHosts()) {
    hostMap.set(saved.url, { ...saved, source: "saved", state: "unknown" });
  }
  renderHosts();

  let discovered = [];
  try {
    const result = await invoke("discover_hosts", { timeoutMs: 4500 });
    discovered = (result?.hosts ?? []).map((h) => ({
      url: h.baseUrl,
      name: h.name,
      version: h.version,
      source: h.source,
      state: "online",
    }));
  } catch (err) {
    if (String(err).includes("no-tauri")) {
      noticeShown = true;
      const notice = $("#notice");
      notice.textContent = t("browserNotice");
      notice.classList.remove("hidden");
    }
  }

  for (const host of discovered) {
    hostMap.set(host.url, host);
  }

  // Refresh saved hosts that discovery did not find (they may be asleep).
  const savedOnly = loadHosts().filter((h) => !hostMap.has(h.url));
  await Promise.allSettled(
    savedOnly.map(async (saved) => {
      try {
        const probe = await invoke("probe_host", { baseUrl: saved.url });
        const state = probe?.reachable ? "online" : "offline";
        hostMap.set(saved.url, {
          ...saved,
          name: probe?.name || saved.name,
          version: probe?.version,
          source: "saved",
          state,
        });
      } catch {
        /* outside the app — leave as unknown */
      }
    })
  );

  setScanning(false);
  buildHostSelect();
  renderHosts();
}

/* -------------------------------- wire ---------------------------------- */

function showFieldError(id, messageKey) {
  const el = $(id);
  el.textContent = t(messageKey);
  el.classList.remove("hidden");
}

function currentPairTarget() {
  const sel = $("#pairHost");
  if (sel.value === "__manual__") {
    const manual = normalizeHost($("#pairHostManual").value);
    if (!manual) {
      showFieldError("#pairError", "errAddress");
      return null;
    }
    return manual;
  }
  const host = hostMap.get(sel.value);
  if (!host) {
    showFieldError("#pairError", "errNoHost");
    return null;
  }
  return { url: host.url, name: host.name };
}

function wire() {
  $("#lang").addEventListener("change", (event) => {
    lang = event.target.value;
    saveStore(LANG_KEY, lang);
    applyLang();
  });

  $("#rescan").addEventListener("click", () => scan());

  $("#pairHost").addEventListener("change", (event) => {
    $("#pairHostManual").classList.toggle("hidden", event.target.value !== "__manual__");
    $("#pairError").classList.add("hidden");
  });

  $("#pairCode").addEventListener("input", (event) => {
    const cleaned = event.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "");
    event.target.value = cleaned;
    $("#pairError").classList.add("hidden");
  });

  $("#pairGo").addEventListener("click", () => {
    $("#pairError").classList.add("hidden");
    const code = $("#pairCode").value.trim().toUpperCase();
    if (!CODE_ALPHABET.test(code)) {
      showFieldError("#pairError", "errBadCode");
      return;
    }
    const target = currentPairTarget();
    if (!target) return;
    saveHost(target.url, target.name);
    // The product's own (fully localized) web flow claims the code and
    // stores the device token — the launcher only lands on the claim URL.
    const base = target.url.replace(/\/$/, "");
    window.location.href = `${base}/?pair=${encodeURIComponent(code)}`;
  });

  $("#manualGo").addEventListener("click", async () => {
    $("#manualError").classList.add("hidden");
    const target = normalizeHost($("#manualHost").value);
    if (!target) {
      showFieldError("#manualError", "errAddress");
      return;
    }
    $("#manualGo").disabled = true;
    try {
      const probe = await invoke("probe_host", { baseUrl: target.url });
      if (probe?.reachable) {
        saveHost(target.url, probe.name || target.name);
        const base = target.url.replace(/\/$/, "");
        window.location.href = `${base}/`;
        return;
      }
      showFieldError("#manualError", "errProbe");
    } catch {
      // Outside the app (plain browser): open directly.
      const base = target.url.replace(/\/$/, "");
      window.location.href = `${base}/`;
    } finally {
      $("#manualGo").disabled = false;
    }
  });
}

/* -------------------------------- boot ---------------------------------- */

lang = detectLang();
applyLang();
wire();
scan();
