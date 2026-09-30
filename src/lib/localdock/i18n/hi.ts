"use client";

/**
 * LocalDock — हिन्दी शब्दकोश।
 * आधुनिक, सहज और पेशेवर हिन्दी में अनूदित; en.ts की हर key से
 * SameShape के ज़रिए संकलन-समय पर पूरा मेल सुनिश्चित होता है।
 */

import type { SameShape } from "./locales";
import type { en } from "./en";

export const hi: SameShape<typeof en> = {
  meta: {
    title: "LocalDock — आपका निजी लोकल क्लाउड",
  },
  brand: {
    tagline: "निजी लोकल क्लाउड",
    localOnly: "केवल लोकल नेटवर्क",
  },

  common: {
    cancel: "रद्द करें",
    save: "सहेजें",
    saveChanges: "बदलाव सहेजें",
    delete: "मिटाएँ",
    rename: "नाम बदलें",
    open: "खोलें",
    download: "डाउनलोड करें",
    back: "वापस",
    continue: "आगे बढ़ें",
    done: "पूर्ण",
    create: "बनाएँ",
    retry: "फिर से कोशिश करें",
    tryAgain: "दोबारा कोशिश करें",
    close: "बंद करें",
    copy: "नाम कॉपी करें",
    dismiss: "खारिज करें",
    pause: "रोकें",
    resume: "फिर से शुरू करें",
    change: "बदलें",
    remove: "हटाएँ",
    search: "खोजें…",
    folder: "फ़ोल्डर",
    optional: "वैकल्पिक",
  },

  nav: {
    main: "मुख्य",
    mobile: "मोबाइल",
    more: "मेनू",
    dashboard: "डैशबोर्ड",
    shares: "साझा",
    files: "फ़ाइलें",
    transfers: "ट्रांसफ़र",
    devices: "डिवाइस",
    websites: "वेबसाइटें",
    settings: "सेटिंग्स",
  },

  /** Compact labels for the mobile bottom bar (full nav.* labels stay in the sidebar). */
  navShort: {
    dashboard: "होम",
    shares: "साझा",
    files: "फ़ाइलें",
    transfers: "ट्रांसफ़र",
    more: "मेनू",
  },

  status: {
    online: "ऑनलाइन",
    offline: "ऑफ़लाइन",
    serverOnline: "सर्वर ऑनलाइन",
    serverOffline: "सर्वर ऑफ़लाइन",
    devices: (n) => `${n} डिवाइस`,
    shares: (n) => `${n} साझा`,
    currentTransfer: "मौजूदा ट्रांसफ़र",
    toggleTheme: "थीम बदलें",
  },

  boot: {
    starting: "आपका लोकल क्लाउड शुरू हो रहा है…",
    title: "LocalDock अपने सर्वर तक नहीं पहुँच पा रहा",
    desc:
      "LocalDock सेवा जवाब नहीं दे रही है। सुनिश्चित करें कि ऐप आपके कंप्यूटर पर चल रहा है, फिर दोबारा कोशिश करें।",
  },

  greeting: {
    night: "शुभ रात्रि",
    morning: "सुप्रभात",
    afternoon: "शुभ अपराह्न",
    evening: "शुभ संध्या",
  },

  dashboard: {
    heroOnline: "आपका लोकल क्लाउड ऑनलाइन है",
    heroReconnect: "आपके क्लाउड से दोबारा जुड़ रहे हैं…",
    heroPrivacy: "· कुछ भी आपके नेटवर्क से बाहर नहीं जाता",
    greetingLine: (greeting) =>
      `${greeting} — सब कुछ वहीं है, जहाँ आपने छोड़ा था।`,
    heroBody: (shares, devices) => {
      const d = devices === 1 ? "1 डिवाइस" : `${devices} डिवाइस`;
      const f = shares === 1 ? "1 साझा फ़ोल्डर" : `${shares} साझा फ़ोल्डर`;
      return `आपका कंप्यूटर चुपचाप अपने नेटवर्क पर ${d} को ${f} उपलब्ध करा रहा है।`;
    },
    statDevices: "डिवाइस",
    statOnline: (n) => `${n} ऑनलाइन`,
    statTrusted: (n) => `${n} भरोसेमंद`,
    statShared: "साझा",
    statShares: (n) => `${n} साझा`,
    statTransfer: "ट्रांसफ़र",
    liveSpeed: "लाइव नेटवर्क स्पीड",
    statSecurity: "सुरक्षा",
    localOnly: "केवल लोकल",
    noCloud: "बिना क्लाउड, बिना अकाउंट",
    sharesAria: "साझा",
    sharesTitle: "साझा",
    allShares: "सभी साझा",
    emptyTitle: "अभी कोई साझा फ़ोल्डर नहीं",
    emptyDesc:
      "आपका कंप्यूटर आपका निजी लोकल क्लाउड बन सकता है।\nफ़ोल्डर जोड़कर शुरुआत करें।",
    addFolder: "फ़ोल्डर जोड़ें",
    readOnly: "केवल पढ़ने के लिए",
    readWrite: "पढ़ें और लिखें",
    shared: "साझा",
    guestOn: "अतिथि लिंक चालू",
    devicesOnly: "केवल डिवाइस",
    quickActions: "त्वरित कार्य",
    qaAdd: "फ़ोल्डर जोड़ें",
    qaAddDesc: "अपना कोई भी फ़ोल्डर अपने डिवाइस के लिए उपलब्ध कराएँ",
    qaPair: "डिवाइस पेयर करें",
    qaPairDesc: "अपने फ़ोन से QR कोड स्कैन करें",
    qaSite: "वेबसाइट होस्ट करें",
    qaSiteDesc: "अपने नेटवर्क पर HTML फ़ोल्डर सर्व करें",
    recentActivity: "हाल की गतिविधि",
    system: "सिस्टम",
    activityEmpty:
      "आपके क्लाउड की गतिविधि यहाँ दिखेगी — अपलोड, नए डिवाइस, होस्ट की गई साइटें।",
  },

  sharesView: {
    title: "साझा",
    subtitle: "हर वह फ़ोल्डर जिसे आपने अपने नेटवर्क पर उपलब्ध कराया है।",
    addShare: "साझा जोड़ें",
    emptyTitle: "अभी कोई साझा फ़ोल्डर नहीं",
    emptyDesc:
      "आपका कंप्यूटर आपका निजी लोकल क्लाउड बन सकता है।\nपहला फ़ोल्डर जोड़ें — बस दस सेकंड लगते हैं।",
    addFolder: "फ़ोल्डर जोड़ें",
    pairDevice: "डिवाइस पेयर करें",
  },

  filesView: {
    emptyTitle: "अभी ब्राउज़ करने को कुछ नहीं",
    emptyDesc:
      "फ़ाइलें आपके साझा फ़ोल्डरों के अंदर रहती हैं।\nकोई फ़ोल्डर जोड़ें और वह तुरंत यहाँ दिखने लगेगा।",
    addFolder: "फ़ोल्डर जोड़ें",
    readOnlyAria: "केवल पढ़ने के लिए",
    readWriteAria: "पढ़ें और लिखें",
    add: "जोड़ें",
  },

  transfersView: {
    active: "चालू",
    activeHint: "अभी ट्रांसफ़र हो रहे हैं",
    paused: "रुके हुए",
    pausedHint: "जब चाहें फिर से शुरू करें",
    completed: "पूर्ण",
    completedHint: "सत्यापित और पूरे हुए",
    failed: "असफल",
    failedHint: "एक क्लिक में दोबारा कोशिश करें",
    emptyTitle: "अभी कोई ट्रांसफ़र नहीं",
    emptyDesc:
      "अपने फ़ोन से कुछ अपलोड करें या यहीं कोई फ़ाइल डाउनलोड करें।\nलाइव प्रगति इसी सेंटर में दिखेगी।",
    movingAtPrefix: "ट्रांसफ़र स्पीड",
    movingAtSuffix: "आपके लोकल नेटवर्क पर",
    allSettled: "सब कुछ निपट गया।",
    nCompleted: (n) =>
      n === 1
        ? "इस सेशन में 1 ट्रांसफ़र पूरा हुआ"
        : `इस सेशन में ${n} ट्रांसफ़र पूरे हुए`,
    allDone: "सभी ट्रांसफ़र सफलतापूर्वक पूरे हुए",
  },

  devicesView: {
    title: "डिवाइस जोड़ें",
    qrExpired: "यह कोड समाप्त हो गया है — नया कोड बनाएँ।",
    qrHint:
      "अपने फ़ोन पर LocalDock खोलें, “QR स्कैन करें” चुनें और कैमरा यहाँ दिखाएँ।",
    thisBrowser: "यह ब्राउज़र",
    pairedToast: (name) =>
      `“${name}” से पेयर हो गया — अब आप भरोसेमंद डिवाइस हैं`,
    revokeToast: (name) =>
      `“${name}” की इस कंप्यूटर तक अब पहुँच नहीं है`,
    title2: "डिवाइस",
    subtitle: "भरोसेमंद डिवाइस जिन्हें आपके साझा तक पहुँच की अनुमति है।",
    addDevice: "डिवाइस जोड़ें",
    cameraHint: "कैमरा नहीं है? कंप्यूटर पर दिखा 6-अक्षरों वाला कोड डालें:",
    codePlaceholder: "ABC123",
    codeAria: "पेयरिंग कोड",
    pair: "पेयर करें",
    emptyTitle: "अभी कोई डिवाइस पेयर नहीं हुआ",
    emptyDesc:
      "अपने फ़ोन से सिर्फ़ एक बार QR स्कैन करें।\nउसके बाद आपका फ़ोन और यह कंप्यूटर एक-दूसरे को अपने-आप पहचान लेंगे।",
    showQr: "QR कोड दिखाएँ",
    onlineNow: "अभी ऑनलाइन",
    lastSeen: (when) => `आख़िरी बार देखा गया: ${when}`,
    pairedAgo: (when) => `· ${when} पेयर हुआ`,
    revoke: "पहुँच हटाएँ",
    revokeTitle: (name) => `“${name}” की पहुँच हटाएँ?`,
    revokeDesc:
      "डिवाइस की हर साझे तक पहुँच तुरंत खत्म हो जाएगी। नए QR कोड से उसे कभी भी दोबारा पेयर किया जा सकता है।",
    revokeConfirm: "डिवाइस की पहुँच हटाएँ",
  },

  websitesView: {
    stoppedToast: (name) => `“${name}” बंद हो गई`,
    liveToast: (name) => `“${name}” अब लाइव है`,
    removedToast: "वेबसाइट हटा दी गई — फ़ाइलें डिस्क पर सुरक्षित रहेंगी",
    copiedToast: "लिंक कॉपी हो गया",
    copyFailToast: "लिंक कॉपी नहीं हो सका।",
    title: "वेबसाइटें",
    subtitle:
      "कोई भी HTML फ़ोल्डर एक क्लिक में पूरे नेटवर्क के लिए साइट बन जाता है।",
    host: "वेबसाइट होस्ट करें",
    hostVerb: "होस्ट करें",
    emptyTitle: "अभी कोई वेबसाइट होस्ट नहीं की गई",
    emptyDesc:
      "index.html वाला कोई फ़ोल्डर है?\nउसे होस्ट करें और सेकंडों में फ़ोन से खोलें।",
    live: "लाइव",
    stopped: "बंद",
    hostedAgo: (when) => `· ${when} होस्ट हुई`,
    stopAria: "होस्टिंग बंद करें",
    startAria: "होस्टिंग शुरू करें",
    open: "खोलें",
    qrAria: "QR दिखाएँ",
    removeAria: "वेबसाइट हटाएँ",
    qrTitle: (name) => `“${name}” साझा करें`,
    qrHint: "इस नेटवर्क का कोई भी डिवाइस इस कोड को स्कैन कर सकता है।",
    removeTitle: (name) => `“${name}” हटाएँ?`,
    removeDesc:
      "साइट ऑफ़लाइन हो जाएगी और सूची से निकल जाएगी। फ़ोल्डर और उसकी फ़ाइलें डिस्क पर वैसे ही रहेंगी — आप कभी भी इसे दोबारा होस्ट कर सकते हैं।",
    removeConfirm: "वेबसाइट हटाएँ",
    dialogTitle: "वेबसाइट होस्ट करें",
    dialogDesc:
      "इस कंप्यूटर पर से वह फ़ोल्डर चुनें जिसमें आपकी स्टैटिक वेबसाइट है (index.html फ़ाइल के साथ)।",
    pickTitle: "कंप्यूटर से वेबसाइट फ़ोल्डर चुनें",
    pickSub: "index.html वाला फ़ोल्डर चुनें",
    orPath: "या सीधे पाथ दर्ज करें:",
    pathPlaceholder: "जैसे D:\\MyWebsite",
    browse: "कंप्यूटर की ड्राइव और फ़ोल्डर ब्राउज़ करें…",
    nameTitle: "अपनी वेबसाइट का नाम दें",
    nameHint: "होस्ट करें दबाते ही यह आपके नेटवर्क पर उपलब्ध हो जाएगी।",
    nameAria: "फ़ोल्डर बदलें",
    nameChange: "बदलें",
    websiteName: "वेबसाइट का नाम",
    namePlaceholder: "मेरा पोर्टफ़ोलियो",
    addressLabel: "पता (वैकल्पिक)",
    addressPlaceholder: "portfolio",
    addressSuffix: ".localdock.local",
    successTitle: "वेबसाइट लाइव है",
    successBody: (name) =>
      `“${name}” इस समय आपके कंप्यूटर से सर्व हो रही है।`,
    openSite: "साइट खोलें",
    pickStepDesc: "index.html वाला फ़ोल्डर चुनें।",
    websiteFallback: "वेबसाइट",
    folderFallback: "फ़ोल्डर",
    pickerTitle: "वेबसाइट का फ़ोल्डर चुनें",
  },

  settings: {
    savedToast: "सेटिंग्स सहेज ली गईं",
    tabGeneral: "सामान्य",
    tabSecurity: "सुरक्षा",
    tabSystem: "सिस्टम",
    identityTitle: "आपके कंप्यूटर की पहचान",
    identityDesc: "नेटवर्क के दूसरे डिवाइस को आपका क्लाउड कैसा दिखेगा।",
    serverName: "सर्वर का नाम",
    serverNamePlaceholder: "मेरा PC",
    serverNameHint:
      "पेयर करते और साझा ब्राउज़ करते समय डिवाइस को यही नाम दिखेगा।",
    appearanceTitle: "दिखावट",
    appearanceDesc: "लाइट, डार्क, या आपके सिस्टम के अनुसार।",
    modeLight: "लाइट",
    modeDark: "डार्क",
    modeSystem: "सिस्टम",
    themePacksTitle: "कलर थीम",
    themePacksDesc: "चार बारीकी से तैयार की गई थीम — हर एक लाइट और डार्क दोनों में।",
    languageTitle: "भाषा",
    languageDesc: "पूरा ऐप तुरंत बदल जाता है, RTL लेआउट समेत।",
    startupTitle: "विंडोज़ स्टार्टअप",
    startupDesc:
      "इस कंप्यूटर के चालू होते ही LocalDock ख़ामोशी से शुरू हो, ताकि आपका क्लाउड हमेशा ऑनलाइन रहे।",
    startWithWindows: "विंडोज़ के साथ शुरू करें",
    startupNote:
      "तब लागू होता है जब LocalDock डेस्कटॉप ऐप विंडोज़ पर चल रहा हो।",
    securityTitle: "केवल लोकल नेटवर्क",
    securityDesc:
      "आपकी सेवाएँ इंटरनेट को कभी छूती नहीं। न क्लाउड, न अकाउंट, न ट्रैकिंग।",
    trustedDevices: "भरोसेमंद डिवाइस",
    guestShares: "अतिथि साझा",
    server: "सर्वर",
    manageDevices: "डिवाइस प्रबंधित करें",
    ownerTitle: "मालिक कंसोल",
    ownerDesc:
      "तय करता है कि यह डैशबोर्ड कौन खोल सकता है और सर्वर कौन प्रबंधित कर सकता है।",
    allowRemote: "किसी भी LAN डिवाइस से डैशबोर्ड खोलने की अनुमति दें",
    allowRemoteNote:
      "बंद = साझा और डिवाइस केवल इसी कंप्यूटर से प्रबंधित किए जा सकते हैं (डेस्कटॉप ऐप का डिफ़ॉल्ट)।",
    protectionsTitle: "बिल्ट-इन सुरक्षा",
    protectionsDesc: "हमेशा चालू — कोई सेटअप नहीं।",
    protections: [
      "डिफ़ॉल्ट रूप से सुरक्षित साझा (केवल पढ़ने के लिए, कोई अतिथि नहीं)",
      "एक बार इस्तेमाल होने वाले कोड से सुरक्षित डिवाइस पेयरिंग",
      "हर साझे के लिए अलग अनुमतियाँ और अनुमत डिवाइसों की सूचियाँ",
      "पाथ-ट्रैवर्सल और फ़ाइल-नाम अटैक से सुरक्षा",
      "ट्रांसफ़र हुई फ़ाइलों का SHA-256 सत्यापन",
      "एक क्लिक में डिवाइस की पहुँच हटाना",
    ],
    statusTitle: "स्थिति",
    statusDesc: "अंदर क्या चल रहा है, इसकी लाइव झलक।",
    storageRow: "स्टोरेज",
    network: "नेटवर्क",
    nInterfaces: (n) => (n === 1 ? "1 इंटरफ़ेस" : `${n} इंटरफ़ेस`),
    localOnly: "केवल लोकल",
    storageFree: (bytes) => `${bytes} ख़ाली`,
    transfers: "ट्रांसफ़र",
    devicesOnlineTrusted: (online, trusted) =>
      `${online} ऑनलाइन / ${trusted} भरोसेमंद`,
    platform: "प्लेटफ़ॉर्म",
    netTitle: "नेटवर्क पते",
    netDesc: "इस नेटवर्क पर आपका क्लाउड कहाँ-कहाँ पहुँचा जा सकता है।",
    netEmpty:
      "कोई बाहरी इंटरफ़ेस नहीं मिला — सर्वर केवल इसी मशीन से पहुँचा जा सकता है।",
    netNote:
      "आपका कंप्यूटर लोकल नेटवर्क पर अपने-आप ख़ुद का ऐलान करता है। डिवाइस को इन पतों की ज़रूरत कभी नहीं पड़ती — पेयरिंग और QR कोड यह काम संभाल लेते हैं। डेस्कटॉप शेल “localdock.local” नाम-रेज़ोल्यूशन (mDNS) जोड़ता है।",
    desktopTitle: "विंडोज़ ऐप",
    desktopDesc: "LocalDock डेस्कटॉप शेल इस सर्वर को प्रबंधित कर रहा है।",
    desktopTray:
      "यह विंडो बंद करने पर भी सर्वर सिस्टम ट्रे में चलता रहता है।",
    desktopRegistry:
      "“विंडोज़ के साथ शुरू करें” वास्तविक रजिस्ट्री एंट्री को नियंत्रित करता है।",
    desktopMdns:
      "सर्वर आपके नेटवर्क पर mDNS के ज़रिए ख़ुद का ऐलान करता है।",
    openInBrowser: "अपने डिफ़ॉल्ट ब्राउज़र में खोलें",
    logTitle: "गतिविधि लॉग",
    logDesc: "आख़िरी 60 इवेंट, सबसे नए पहले।",
    logEmpty: "अभी कुछ लॉग नहीं हुआ।",
    storageTitle: "स्टोरेज लोकेशन",
    storageDesc: "LocalDock साझा, साइटें और मेटाडेटा कहाँ रखता है।",
    storageHome: "LocalDock होम:",
    storageShares: "साझा:",
    storageWebsites: "वेबसाइटें:",
    storageRegistry: "रजिस्ट्री:",
  },

  themePacks: {
    label: "कलर थीम",
    teal: "फ़िरोज़ी धुंध",
    ocean: "आधी रात का सागर",
    amethyst: "जामुनी",
    sunset: "रेगिस्तानी गोधूलि",
  },

  shareCard: {
    copiedToast: "लिंक कॉपी हो गया — आपके नेटवर्क पर कोई भी इसे खोल सकता है",
    copyFailToast: "लिंक कॉपी नहीं हो सका।",
    nItems: (n) => (n === 1 ? "1 आइटम" : `${n} आइटम`),
    manageAria: (name) => `${name} प्रबंधित करें`,
    readOnly: "केवल पढ़ने के लिए",
    readWrite: "पढ़ें और लिखें",
    guestOn: "अतिथि लिंक चालू",
    devicesOnly: "केवल डिवाइस",
    open: "खोलें",
    qrAria: "QR दिखाएँ",
    qrTitle: (name) => `“${name}” साझा करें`,
    qrHint: "इस नेटवर्क के किसी भी डिवाइस से स्कैन करें — या लिंक भेजें।",
    updatedToast: "साझा करने की सेटिंग अपडेट हो गई",
    stoppedToast: "साझा करना बंद कर दिया गया — फ़ाइलें डिस्क पर वैसी ही रहेंगी",
    manageTitle: (name) => `“${name}” प्रबंधित करें`,
    manageDesc: "यह फ़ोल्डर कौन देख सकता है, और उसके साथ क्या कर सकता है।",
    nameLabel: "नाम",
    accessLabel: "पहुँच",
    readWriteTitle: "पढ़ें और लिखें",
    readWriteDesc: "ब्राउज़ करें, डाउनलोड करें, अपलोड करें, व्यवस्थित करें।",
    readOnlyTitle: "केवल पढ़ने के लिए",
    readOnlyDesc: "सिर्फ़ ब्राउज़ और डाउनलोड।",
    guestTitle: "अतिथि ब्राउज़र पहुँच",
    guestDesc: "साझा करने योग्य लिंक — पेयरिंग की ज़रूरत नहीं।",
    deviceAccess: "डिवाइस पहुँच",
    allDevices: "सभी भरोसेमंद डिवाइस",
    specificDevices: "सिर्फ़ चुनिंदा डिवाइस",
    noDevices: "अभी कोई डिवाइस पेयर नहीं हुआ।",
    stopSharing: "साझा करना बंद करें",
    stopSharingNote:
      "साझा हर जगह से हट जाता है। डिस्क पर फ़ाइलें कभी नहीं छूतीं।",
    stopTitle: "इस फ़ोल्डर को साझा करना बंद करें",
    stopConfirmTitle: (name) => `“${name}” साझा करना बंद करें?`,
    stopConfirmDesc:
      "सभी डिवाइस और अतिथि लिंक की पहुँच तुरंत खत्म हो जाएगी। फ़ोल्डर और उसकी फ़ाइलें आपके कंप्यूटर पर वैसे ही रहेंगी जहाँ वे अभी हैं।",
    keepSharing: "साझा जारी रखें",
  },

  transferRow: {
    progressAria: (name, n) => `${name} प्रगति ${n}%`,
    eta: (eta) => ` · बाक़ी ${eta}`,
    links: (n) => ` · ${n} लिंक`,
    queued: "क़तार में इंतज़ार…",
    paused: "रुका हुआ",
    failed: "असफल",
    verified: "ट्रांसफ़र होकर सत्यापित",
    completed: "पूर्ण",
    canceled: "रद्द",
    pickFile: "जारी रखने के लिए फ़ाइल चुनें",
    pause: "रोकें",
    resume: "फिर से शुरू करें",
    retry: "फिर से कोशिश करें",
    cancel: "रद्द करें",
    dismiss: "खारिज करें",
  },

  transferDock: {
    aria: "चालू ट्रांसफ़र",
    transferring: (n) =>
      n === 1
        ? "1 आइटम ट्रांसफ़र हो रहा है"
        : `${n} आइटम ट्रांसफ़र हो रहे हैं`,
    attention: "ध्यान देने की ज़रूरत",
    collapse: "समेटें",
    expand: "फैलाएँ",
    openCenter: "ट्रांसफ़र सेंटर खोलें",
  },

  fileBrowser: {
    breadcrumbAria: "ब्रेडक्रंब",
    searchResults: "खोज परिणाम",
    readOnly: "केवल पढ़ने के लिए",
    nItemsSize: (n, size) =>
      `${n === 1 ? "1 आइटम" : `${n} आइटम`} · ${size}`,
    liveTitle: "यह फ़ोल्डर अपने-आप रिफ़्रेश होता है",
    live: "लाइव",
    searchAria: "फ़ाइलें खोजें",
    clearSearchAria: "खोज साफ़ करें",
    sortAria: "क्रमबद्ध करने के विकल्प",
    sortTitle: "क्रम",
    sortNameAsc: "नाम (A→Z)",
    sortNameDesc: "नाम (Z→A)",
    sortNewest: "सबसे नए पहले",
    sortOldest: "सबसे पुराने पहले",
    sortLargest: "सबसे बड़े पहले",
    sortSmallest: "सबसे छोटे पहले",
    gridAria: "ग्रिड व्यू",
    listAria: "लिस्ट व्यू",
    iconSizeAria: "आइकॉन साइज़",
    iconSizeTitle: "आइकॉन साइज़",
    gridIconSizeAria: "ग्रिड आइकॉन साइज़",
    upload: "अपलोड",
    uploadFolderAria: "इस डिवाइस से फ़ोल्डर अपलोड करें",
    newFolderAria: "नया फ़ोल्डर",
    uploadingN: (n) =>
      n === 1
        ? "1 फ़ाइल अपलोड हो रही है"
        : `${n} फ़ाइलें अपलोड हो रही हैं`,
    uploadingTo: (target) => `${target} में`,
    thisFolder: "इस साझा फ़ोल्डर",
    queued: "क़तार में",
    eta: (eta) => `बाक़ी ${eta}`,
    cancelUploadAria: (name) => `${name} का अपलोड रद्द करें`,
    uploadProgressAria: (name, n) => `${name} अपलोड प्रगति ${n}%`,
    nMore: (n) => `+ ${n} और — विवरण के लिए ट्रांसफ़र सेंटर खोलें`,
    nMoreShort: (n) => `+ ${n} और`,
    uploading: "अपलोड हो रहा है",
    downloading: "डाउनलोड हो रहा है",
    uploaded: "अपलोड हुआ",
    downloaded: "डाउनलोड हुआ",
    upNoun: "अपलोड",
    downNoun: "डाउनलोड",
    clearSelectionAria: "चयन हटाएँ",
    finishedVerb: (verb) => `${verb} पूरा हुआ`,
    failedVerb: (verb) => `${verb} असफल हुआ`,
    nRemoteTransfers: (n) =>
      n === 1
        ? "दूसरे डिवाइस पर 1 ट्रांसफ़र"
        : `दूसरे डिवाइसों पर ${n} ट्रांसफ़र`,
    done: "पूर्ण",
    failedLabel: "असफल",
    failedPrefix: "असफल: ",
    openFolderFail: "यह फ़ोल्डर नहीं खुल सका",
    nothingMatches: (query) => `“${query}” से कुछ मेल नहीं खाता`,
    emptyFolder: "यह फ़ोल्डर ख़ाली है",
    emptyHint:
      "फ़ाइलें यहाँ ड्रॉप करें, टूलबार से अपलोड करें, या चीज़ें व्यवस्थित करने के लिए फ़ोल्डर बनाएँ।",
    nameCol: "नाम",
    sizeCol: "साइज़",
    modifiedCol: "अंतिम बदलाव",
    dropToUpload: "अपलोड के लिए यहाँ ड्रॉप करें",
    nSelected: (n) => (n === 1 ? "1 चुना गया" : `${n} चुने गए`),
    renameTitle: "नाम बदलें",
    newNameSr: "नया नाम",
    newFolderTitle: "नया फ़ोल्डर",
    folderNamePlaceholder: "फ़ोल्डर का नाम",
    deleteOne: (name) => `“${name}” को मिटाएँ?`,
    deleteMany: (n) => `${n} आइटम मिटाएँ?`,
    deleteOneDesc:
      "यह इसे आपके कंप्यूटर की डिस्क से हमेशा के लिए मिटा देगा। इसे वापस नहीं किया जा सकता।",
    deleteManyDesc:
      "यह इन्हें आपके कंप्यूटर की डिस्क से हमेशा के लिए मिटा देगा। इसे वापस नहीं किया जा सकता।",
    keep: "रखें",
    folderType: "फ़ोल्डर",
    actionsAria: (name) => `${name} के लिए कार्य`,
    copyName: "नाम कॉपी करें",
    tileS: "S",
    tileM: "M",
    tileL: "L",
    tileXL: "XL",
    remoteFinishedToast: (device, verb, name) =>
      `${device} ने “${name}” का ${verb} पूरा कर लिया`,
    remoteFailedToast: (device, verb, name) =>
      `${device} का “${name}” ${verb} असफल हुआ`,
    downloadingToast: (name) =>
      `${name} डाउनलोड हो रहा है — ट्रांसफ़र सेंटर में देखें`,
    uploadingToast: (name) => `${name} अपलोड हो रहा है`,
    uploadingNToast: (n, size) =>
      n === 1
        ? `1 फ़ाइल अपलोड हो रही है (${size})`
        : `${n} फ़ाइलें अपलोड हो रही हैं (${size})`,
    uploadingFolderToast: (n, size) =>
      `${n === 1 ? "1 फ़ाइल" : `${n} फ़ाइलें`} वाला फ़ोल्डर अपलोड हो रहा है (${size})`,
    folderCreatedToast: (name) => `फ़ोल्डर “${name}” बन गया`,
    renamedToast: "नाम बदल गया",
    deletedToast: (name) => `“${name}” मिट गया`,
    nDeletedToast: (n) => `${n} आइटम मिट गए`,
  },

  addShare: {
    nameFallback: "साझा फ़ोल्डर",
    pickerTitle: "साझा करने के लिए फ़ोल्डर चुनें",
    pickerFailToast: "सिस्टम का फ़ोल्डर पिकर नहीं खुल सका: ",
    emptyFolderToast: "इस फ़ोल्डर में कोई इस्तेमाल करने योग्य फ़ाइल नहीं है।",
    uploadingOneToast: "इस डिवाइस से 1 फ़ाइल अपलोड हो रही है…",
    uploadingNToast: (n) =>
      `इस डिवाइस से ${n} फ़ाइलें अपलोड हो रही हैं…`,
    needFolderToast: "साझा करने के लिए कृपया कोई फ़ोल्डर चुनें।",
    title: "साझा करने के लिए फ़ोल्डर जोड़ें",
    hostDesc:
      "लोकल नेटवर्क पर अपने डिवाइस के साथ साझा करने के लिए इस कंप्यूटर का कोई भी फ़ोल्डर चुनें।",
    companionDesc:
      "आप एक साथी डिवाइस पर हैं — इसी डिवाइस से फ़ोल्डर चुनें। वह आपके नेटवर्क के ज़रिए कंप्यूटर पर अपलोड होगा, फिर साझा हो जाएगा।",
    nativePickTitle: "इस कंप्यूटर पर फ़ोल्डर चुनें",
    nativePickSub: "आपके PC का कोई भी फ़ोल्डर चुनने के लिए File Explorer खुलेगा",
    orPath: "या सीधे पाथ दर्ज करें:",
    pathPlaceholder: "जैसे D:\\Downloads या C:\\Users\\...",
    quickAccess: "क्विक एक्सेस:",
    browse: "कंप्यूटर की ड्राइव और फ़ोल्डर ब्राउज़ करें…",
    devicePickTitle: "इस डिवाइस से फ़ोल्डर चुनें",
    devicePickSub:
      "इस डिवाइस का फ़ोल्डर पिकर खुलेगा — सामग्री कंप्यूटर पर अपलोड होगी",
    deviceNote:
      "कंप्यूटर पर पहले से मौजूद फ़ोल्डर सिर्फ़ कंप्यूटर से ही साझा किए जा सकते हैं। यहाँ आप जो भी चुनेंगे वह आपके लोकल नेटवर्क से सुरक्षित अपलोड होगा — इंटरनेट का कोई लेना-देना नहीं।",
    configureTitle: (name) => `“${name}” साझा करें`,
    configureDesc: "अपने नेटवर्क के डिवाइस के लिए पहुँच की सेटिंग तय करें।",
    nameSource: "फ़ोल्डर का नाम और स्रोत",
    nameSourcePath: "फ़ोल्डर का नाम और असली पाथ",
    changeFolderAria: "फ़ोल्डर बदलें",
    nFilesUploading: (n, size) =>
      `${n === 1 ? "1 फ़ाइल" : `${n} फ़ाइलें`} · ${size} — इस डिवाइस से अपलोड`,
    namePlaceholder: "फ़ोल्डर का नाम",
    accessLabel: "पहुँच",
    readWriteTitle: "पढ़ें और लिखें",
    readWriteDesc:
      "डिवाइस इस फ़ोल्डर में फ़ाइलें ब्राउज़, डाउनलोड, अपलोड और व्यवस्थित कर सकते हैं।",
    readOnlyTitle: "केवल पढ़ने के लिए",
    readOnlyDesc:
      "डिवाइस सिर्फ़ ब्राउज़ और डाउनलोड कर सकते हैं — कोई बदलाव नहीं।",
    guestTitle: "अतिथि ब्राउज़र पहुँच",
    guestDesc:
      "इस नेटवर्क पर कोई भी साझा लिंक खोल सकता है — पेयरिंग की ज़रूरत नहीं।",
    shareFolder: "फ़ोल्डर साझा करें",
    successToast: "सफलतापूर्वक साझा हो गया",
    successUploading: (name, n) =>
      `“${name}” साझा हो गया — इसकी सामग्री (${n} फ़ाइलें) इस डिवाइस से अपलोड हो रही है। प्रगति ट्रांसफ़र डॉक में देखें।`,
    successPlain: (name) =>
      `“${name}” अब साझा है और आपके नेटवर्क पर उपलब्ध है।`,
    available: "उपलब्ध",
    showQrLink: "QR और लिंक दिखाएँ",
    browserTitle: "कंप्यूटर पर फ़ोल्डर चुनें",
    browserDesc:
      "साझा करने के लिए अपने कंप्यूटर की ड्राइव और फ़ोल्डर देखकर चुनें।",
    browserConfirm: "यही फ़ोल्डर चुनें",
    qrTitle: (name) => `“${name}” साझा करें`,
    qrHint: "इस नेटवर्क के किसी भी डिवाइस से स्कैन करें — या लिंक भेजें।",
  },

  folderBrowser: {
    needPathToast:
      "सब-फ़ोल्डर बनाने से पहले कृपया कोई ड्राइव या फ़ोल्डर दर्ज करें।",
    createdToast: (name) => `फ़ोल्डर “${name}” बन गया`,
    hostNote:
      "ये उस कंप्यूटर की ड्राइव हैं जिस पर LocalDock चल रहा है। इसी डिवाइस से फ़ोल्डर जोड़ने के लिए साझा में “फ़ोल्डर जोड़ें” इस्तेमाल करें — तब सामग्री आपके डिवाइस से अपलोड होगी।",
    thisPc: "💻 यह PC (ड्राइव और फ़ोल्डर)",
    filterPlaceholder: "फ़ोल्डर फ़िल्टर करें…",
    noMatch: "आपके फ़िल्टर से कोई फ़ोल्डर नहीं मिला।",
    empty: "यह फ़ोल्डर ख़ाली है।",
    newNamePlaceholder: "नए फ़ोल्डर का नाम…",
    indexNote: "index.html वाला फ़ोल्डर चुनें।",
  },

  qr: {
    copiedToast: "लिंक कॉपी हो गया",
    copyFailToast:
      "कॉपी नहीं हो सका — नीचे दिए लिंक को देर तक दबाकर कॉपी करें।",
    qrAlt: "QR कोड",
    expiresMin: (n) => `कोड ${n} मिनट में समाप्त हो जाएगा`,
    expiresSec: (n) => `कोड ${n} सेकंड में समाप्त हो जाएगा`,
    copyAria: "लिंक कॉपी करें",
  },

  preview: {
    download: "डाउनलोड करें",
    closeAria: "प्रीव्यू बंद करें",
    largeFile: (size) =>
      `यह फ़ाइल बड़ी है (${size}) — इसका कंटेंट देखने के लिए इसे डाउनलोड करें।`,
    archiveNote:
      "आर्काइव का प्रीव्यू नहीं दिखता — डाउनलोड करके अपने डिवाइस पर खोलें।",
    apkNote: "APK फ़ाइल — डाउनलोड करके किसी Android डिवाइस पर इंस्टॉल करें।",
    noPreview: (mime) =>
      `इस फ़ाइल टाइप (${mime}) का कोई प्रीव्यू नहीं — इसकी जगह डाउनलोड करें।`,
    unknownType: "अज्ञात",
    verifySha: "अखंडता सत्यापित करें (SHA-256)",
    shaLabel: "SHA-256",
    zoomOut: "ज़ूम आउट",
    fitTitle: "फ़िट / 100% टॉगल करें",
    fit: "फ़िट",
    zoomIn: "ज़ूम इन",
    rotateLeft: "बाएँ घुमाएँ",
    rotateRight: "दाएँ घुमाएँ",
    reset: "रीसेट (फ़िट)",
    back10: "10 सेकंड पीछे",
    fwd10: "10 सेकंड आगे",
    mute: "म्यूट करें",
    unmute: "अनम्यूट करें",
    seekAria: "सीक करें",
    playAria: "चलाएँ",
    pauseAria: "रोकें",
    volumeAria: "वॉल्यूम",
    speedTitle: "प्लेबैक स्पीड",
    prevAria: "पिछली फ़ाइल",
    nextAria: "अगली फ़ाइल",
    pdfTitle: (name) => `${name} का PDF प्रीव्यू`,
  },

  guest: {
    unavailable: "यह लिंक उपलब्ध नहीं है।",
    opening: "साझा फ़ोल्डर खुल रहा है…",
    privateTitle: "यह फ़ोल्डर निजी है",
    privateDesc:
      "अपने डिवाइस के पेयर होने या अतिथि पहुँच चालू करने के लिए मालिक से कहें।",
    sharedFrom: "इस नेटवर्क के एक कंप्यूटर से साझा · ",
    readWrite: "पढ़ें और लिखें",
    readOnly: "केवल पढ़ने के लिए",
  },

  pairClaim: {
    incomplete: "यह पेयरिंग लिंक अधूरा है।",
    defaultAndroid: "मेरा Android",
    defaultIphone: "मेरा iPhone",
    defaultBrowser: "मेरा ब्राउज़र",
    yourComputer: "आपका कंप्यूटर",
    defaultDevice: "मेरा डिवाइस",
    reading: "पेयरिंग कोड पढ़ा जा रहा है…",
    title: "इस कंप्यूटर से पेयर करें?",
    deviceName: "डिवाइस का नाम",
    trust: "इस डिवाइस पर भरोसा करें",
    trustedTitle: "भरोसेमंद डिवाइस",
    trustedBody: (server) => `यह ब्राउज़र अब “${server}” से पेयर है।`,
    failedTitle: "पेयरिंग असफल",
    goBack: "वापस जाएँ",
  },

  onboarding: {
    tagline: "आपका निजी लोकल क्लाउड",
    heroTitle: "इस कंप्यूटर को अपना निजी क्लाउड बनाएँ।",
    heroDesc:
      "अपने नेटवर्क के हर डिवाइस से फ़ोल्डर साझा करें — Google Drive जितना आसान, पर आपकी फ़ाइलें इस कमरे से बाहर कभी नहीं जातीं।",
    featPrivate: "निजी",
    featPrivateDesc: "कुछ भी कभी इंटरनेट तक नहीं पहुँचता",
    featFast: "तेज़",
    featFastDesc: "पूरी लोकल नेटवर्क स्पीड, रुककर दोबारा शुरू होने वाले ट्रांसफ़र",
    featLocal: "लोकल",
    featLocalDesc: "इंटरनेट बंद होने पर भी काम करता है",
    getStarted: "शुरू करें",
    nameTitle: "अपने क्लाउड को नाम दें",
    nameDesc: "इसी नाम से आपके डिवाइस इस कंप्यूटर को पहचानेंगे।",
    namePlaceholder: "मेरा PC",
    folderTitle: "अपना पहला फ़ोल्डर जोड़ें",
    folderDescHost:
      "फ़ोल्डर चुनें — वह तुरंत आपके बाक़ी डिवाइस पर उपलब्ध हो जाएगा।",
    folderDescDevice:
      "इस डिवाइस से फ़ोल्डर चुनें — वह कंप्यूटर पर अपलोड होगा, फिर आपके नेटवर्क पर उपलब्ध हो जाएगा।",
    sharedBadge: (name) => `“${name}” साझा किया जा रहा है`,
    sharedNow: "अभी आपके नेटवर्क पर उपलब्ध है।",
    uploadingNow: "इस समय इस डिवाइस से अपलोड हो रहा है।",
    waitingPicker: "फ़ोल्डर पिकर का इंतज़ार…",
    pickHost: "साझा करने के लिए फ़ोल्डर चुनें",
    pickDevice: "इस डिवाइस से फ़ोल्डर चुनें",
    pickHostHint: "डॉक्यूमेंट, तस्वीरें, प्रोजेक्ट — कुछ भी",
    pickDeviceHint: "यह आपके लोकल नेटवर्क से कंप्यूटर पर अपलोड होगा",
    phoneTitle: "अपना फ़ोन जोड़ें",
    phoneDesc:
      "अपने फ़ोन पर LocalDock से QR स्कैन करें — बस एक स्कैन, और हमेशा के लिए याद।",
    showQr: "पेयरिंग QR कोड दिखाएँ",
    takesSeconds: "इसमें लगभग दस सेकंड लगते हैं",
    preparing: "आपका क्लाउड तैयार हो रहा है…",
    ready: "आप तैयार हैं — LocalDock खोलें",
    pairLaterPre: "आप डिवाइस कभी भी पेयर कर सकते हैं, यहाँ से:",
    pairLaterLink: "डिवाइस",
    footer: "केवल लोकल · कोई अकाउंट नहीं · कोई क्लाउड नहीं · कोई ट्रैकिंग नहीं",
    browserTitle: "अपना पहला फ़ोल्डर जोड़ें",
    browserDesc: "इस कंप्यूटर पर फ़ोल्डर चुनें — या नया बनाएँ।",
    browserConfirm: "यह फ़ोल्डर साझा करें",
    folderFallback: "मेरा फ़ोल्डर",
  },

  apiErrors: {
    network:
      "आपके कंप्यूटर तक पहुँच नहीं बन पा रही। जाँचें कि दोनों डिवाइस एक ही नेटवर्क पर हैं — नेटवर्क लौटते ही ट्रांसफ़र अपने-आप फिर शुरू हो जाएँगे।",
    generic: "आपके कंप्यूटर से बात करते समय कुछ गड़बड़ हो गई।",
    thisDevice: "यह डिवाइस",
    unauthorized: "इस काम के लिए LocalDock मालिक कंसोल ज़रूरी है।",
    shareNotFound: "यह साझा फ़ोल्डर अब मौजूद नहीं है।",
    forbidden:
      "आपके पहुँच-स्तर पर इस फ़ोल्डर में यह काम करने की अनुमति नहीं है।",
    privateFolder:
      "यह फ़ोल्डर निजी है। अपना डिवाइस पेयर करें या मालिक से अतिथि पहुँच चालू करने को कहें।",
    notFound: "नहीं मिला।",
    badPath: "यह पाथ इस्तेमाल नहीं किया जा सकता।",
    badBody: "अनुरोध अमान्य था।",
    badName: "यह नाम इस्तेमाल नहीं किया जा सकता।",
    exists: "यहाँ इसी नाम से कोई चीज़ पहले से मौजूद है।",
    permission:
      "सर्वर को इस फ़ोल्डर में यह काम करने की अनुमति नहीं मिली।",
    notFile: "यह पाथ कोई फ़ाइल नहीं है।",
    notDir: "यह पाथ कोई फ़ोल्डर नहीं है।",
    sessionExpired: "अपलोड सेशन समाप्त हो गया या रद्द हो गया।",
    checksumMismatch: "अपलोड हुई फ़ाइल अखंडता जाँच में नहीं टिकी।",
    sizeMismatch: "डिस्क पर फ़ाइल का साइज़ बताए गए साइज़ से मेल नहीं खाता।",
    shareGone: "अपलोड के दौरान साझा फ़ोल्डर हटा दिया गया।",
    noThumb: "इस फ़ाइल टाइप के लिए कोई थंबनेल उपलब्ध नहीं।",
    thumbFailed: "थंबनेल नहीं बन सका।",
    badSlug: "यह लिंक किसी साझा फ़ोल्डर से मेल नहीं खाता।",
    badAddress: "पते में सिर्फ़ अक्षर, अंक और डैश इस्तेमाल करें।",
    startFailed: "अपलोड शुरू नहीं हो सका।",
    badIndex:
      "इस फ़ोल्डर में index.html नहीं है — एक जोड़ें और दोबारा होस्ट करें।",
    createFailed: "फ़ोल्डर नहीं बन सका।",
    writeFailed: "डिस्क पर लिखा नहीं जा सका।",
    readFailed: "डिस्क से पढ़ा नहीं जा सका।",
    renameFailed: "आइटम का नाम नहीं बदला जा सका।",
    deleteFailed: "सिस्टम ने इस आइटम को मिटाने से मना कर दिया।",
    completeFailed: "अपलोड पूरा नहीं हो सका।",
    needCode: "पेयरिंग कोड ज़रूरी है।",
    badCode:
      "यह कोड अमान्य या समाप्त है। कंप्यूटर पर नया कोड बनाएँ।",
    privatePair:
      "यह फ़ोल्डर निजी है। इसे खोलने के लिए अपने डिवाइस को कंप्यूटर से पेयर करें।",
    needWebsiteName: "वेबसाइट को कोई नाम दें।",
    needFolderName: "कृपया इस फ़ोल्डर को कोई नाम दें।",
    chooseFolder: "पहले कोई फ़ोल्डर चुनें।",
    needAbsolutePath:
      "चुना गया पाथ absolute पाथ होना चाहिए (जैसे D:\\MyFolder या C:\\Users\\...)।",
    needValidFolder: "पहले कोई मान्य फ़ोल्डर चुनें।",
    folderExistsHere: (name) => `यहाँ “${name}” पहले से मौजूद है।`,
    itemExists: (name) => `“${name}” पहले से मौजूद है।`,
    emptyServerName: "सर्वर का नाम ख़ाली नहीं रह सकता।",
    deviceNotFound: "डिवाइस नहीं मिला।",
    folderNotOnDisk: "यह फ़ोल्डर इस कंप्यूटर पर नहीं मिला।",
  },

  transferErrors: {
    notFound: "ट्रांसफ़र नहीं मिला।",
    wrongFile:
      "यह कोई और फ़ाइल है — यह ट्रांसफ़र जारी रखने के लिए वही फ़ाइल चुनें।",
    connectionLost: "कनेक्शन टूट गया — नेटवर्क का इंतज़ार…",
    generic: "ट्रांसफ़र असफल हुआ।",
    uploadStalled: "अपलोड अटक गया और पूरा नहीं हो सका।",
    chunkFailed: "फ़ाइल का एक हिस्सा अपलोड नहीं हो सका।",
    downloadFailed: "डाउनलोड असफल हुआ।",
    segmentDropped: "सेगमेंट के बीच कनेक्शन टूटा — दोबारा कोशिश हो रही है।",
    fileKind: "फ़ाइल",
    stopped: "ट्रांसफ़र रोक दिया गया।",
    downloadInterrupted: "डाउनलोड बीच में रुका — दोबारा कोशिश हो रही है।",
    segmentsIncomplete: "डाउनलोड के सेगमेंट अधूरे हैं।",
    reconnectHint: "दोबारा जुड़ें: जारी रखने के लिए वही फ़ाइल फिर से चुनें।",
  },

  activity: {
    devicePaired: (name) => `नया डिवाइस पेयर हुआ: “${name}”`,
    deviceRevoked: (name) => `भरोसेमंद डिवाइस “${name}” की पहुँच हटाई गई`,
    websiteHosted: (name) => `वेबसाइट “${name}” लाइव है`,
    websiteStopped: (name) => `वेबसाइट “${name}” बंद हो गई`,
    websiteRemoved: (name) =>
      `वेबसाइट “${name}” हटा दी गई (फ़ाइलें डिस्क पर सुरक्षित)`,
    folderCreated: (name, share) =>
      `“${share}” में फ़ोल्डर “${name}” बनाया गया`,
    shareUpdated: (name) => `“${name}” की साझा सेटिंग अपडेट हुई`,
    shareDeleted: (name) =>
      `“${name}” साझा करना बंद किया गया (फ़ाइलें डिस्क पर सुरक्षित)`,
    shareCreated: (name) => `साझा “${name}” बनाया गया`,
    fileUploaded: (name, share) =>
      `“${name}” को “${share}” में अपलोड किया गया`,
    fileDownloaded: (name, share) =>
      `“${name}” को “${share}” से डाउनलोड किया गया`,
    entryRenamed: (from, to, share) =>
      `“${share}” में “${from}” का नाम बदलकर “${to}” किया गया`,
    entryDeleted: (name, share) => `“${share}” से “${name}” मिटाया गया`,
    denied: (action, share) => `“${share}” पर ${action} की अनुमति नहीं दी गई`,
  },
};
