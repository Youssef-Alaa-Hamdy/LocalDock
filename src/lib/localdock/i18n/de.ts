"use client";

/**
 * LocalDock — deutsches Wörterbuch.
 * Modern, freundlich-professionell und natürlich formuliert (Anrede „du“,
 * wie bei Apple.de), mit korrekten deutschen Pluralformen und den
 * typografischen Anführungszeichen „…“.
 */

import type { SameShape } from "./locales";
import type { en } from "./en";

export const de: SameShape<typeof en> = {
  meta: {
    title: "LocalDock — Deine persönliche lokale Cloud",
  },
  brand: {
    tagline: "Persönliche lokale Cloud",
    localOnly: "Nur lokales Netzwerk",
  },

  common: {
    cancel: "Abbrechen",
    save: "Speichern",
    saveChanges: "Änderungen speichern",
    delete: "Löschen",
    rename: "Umbenennen",
    open: "Öffnen",
    download: "Download",
    back: "Zurück",
    continue: "Weiter",
    done: "Fertig",
    create: "Erstellen",
    retry: "Wiederholen",
    tryAgain: "Erneut versuchen",
    close: "Schließen",
    copy: "Namen kopieren",
    dismiss: "Ausblenden",
    pause: "Pausieren",
    resume: "Fortsetzen",
    change: "ändern",
    remove: "Entfernen",
    search: "Suchen…",
    folder: "Ordner",
    optional: "optional",
  },

  nav: {
    main: "Hauptnavigation",
    mobile: "Mobile Navigation",
    more: "Mehr",
    dashboard: "Dashboard",
    shares: "Freigaben",
    files: "Dateien",
    transfers: "Übertragungen",
    devices: "Geräte",
    websites: "Websites",
    settings: "Einstellungen",
  },

  /** Compact labels for the mobile bottom bar (full nav.* labels stay in the sidebar). */
  navShort: {
    dashboard: "Start",
    shares: "Freigaben",
    files: "Dateien",
    transfers: "Transfers",
    more: "Mehr",
  },

  status: {
    online: "Online",
    offline: "Offline",
    serverOnline: "Server online",
    serverOffline: "Server offline",
    devices: (n) => `${n} Gerät${n === 1 ? "" : "e"}`,
    shares: (n) => `${n} Freigabe${n === 1 ? "" : "n"}`,
    currentTransfer: "aktuelle Übertragung",
    toggleTheme: "Farbschema wechseln",
  },

  boot: {
    starting: "Deine lokale Cloud startet…",
    title: "LocalDock erreicht seinen Server nicht",
    desc: "Der LocalDock-Dienst antwortet nicht. Stelle sicher, dass die App auf deinem Computer läuft, und versuche es dann erneut.",
  },

  greeting: {
    night: "Gute Nacht",
    morning: "Guten Morgen",
    afternoon: "Guten Tag",
    evening: "Guten Abend",
  },

  dashboard: {
    heroOnline: "Deine lokale Cloud ist online",
    heroReconnect: "Verbindung zu deiner Cloud wird wiederhergestellt…",
    heroPrivacy: "· nichts verlässt dein Netzwerk",
    greetingLine: (greeting) =>
      `${greeting} — alles ist noch da, wo du es gelassen hast.`,
    heroBody: (shares, devices) =>
      `Dein Computer stellt im Hintergrund ${
        shares === 1 ? "1 geteilten Ordner" : `${shares} geteilte Ordner`
      } für ${
        devices === 1 ? "1 Gerät" : `${devices} Geräte`
      } in deinem Netzwerk bereit.`,
    statDevices: "Geräte",
    statOnline: (n) => `${n} online`,
    statTrusted: (n) => `${n} vertraut`,
    statShared: "Geteilt",
    statShares: (n) => `${n} Freigabe${n === 1 ? "" : "n"}`,
    statTransfer: "Übertragung",
    liveSpeed: "Netzwerkgeschwindigkeit in Echtzeit",
    statSecurity: "Sicherheit",
    localOnly: "Nur lokal",
    noCloud: "keine Cloud, keine Konten",
    sharesAria: "Freigaben",
    sharesTitle: "Freigaben",
    allShares: "Alle Freigaben",
    emptyTitle: "Noch keine geteilten Ordner",
    emptyDesc:
      "Dein Computer kann deine persönliche lokale Cloud werden.\nFüge zum Start einen Ordner hinzu.",
    addFolder: "Ordner hinzufügen",
    readOnly: "Nur Lesen",
    readWrite: "Lesen & Schreiben",
    shared: "Geteilt",
    guestOn: "Gast-Link aktiv",
    devicesOnly: "Nur Geräte",
    quickActions: "Schnellaktionen",
    qaAdd: "Ordner hinzufügen",
    qaAddDesc: "Jeden Ordner für deine Geräte verfügbar machen",
    qaPair: "Gerät koppeln",
    qaPairDesc: "QR-Code mit dem Smartphone scannen",
    qaSite: "Website hosten",
    qaSiteDesc: "Einen HTML-Ordner in deinem Netzwerk bereitstellen",
    recentActivity: "Letzte Aktivität",
    system: "System",
    activityEmpty:
      "Aktivitäten in deiner Cloud erscheinen hier — Uploads, neue Geräte, gehostete Websites.",
  },

  sharesView: {
    title: "Freigaben",
    subtitle: "Jeder Ordner, den du in deinem Netzwerk verfügbar gemacht hast.",
    addShare: "Freigabe hinzufügen",
    emptyTitle: "Noch keine geteilten Ordner",
    emptyDesc:
      "Dein Computer kann deine persönliche lokale Cloud werden.\nFüge deinen ersten Ordner hinzu — das dauert zehn Sekunden.",
    addFolder: "Ordner hinzufügen",
    pairDevice: "Gerät koppeln",
  },

  filesView: {
    emptyTitle: "Noch nichts zum Durchstöbern",
    emptyDesc:
      "Dateien liegen in deinen geteilten Ordnern.\nFüge einen Ordner hinzu — er erscheint sofort hier.",
    addFolder: "Ordner hinzufügen",
    readOnlyAria: "Nur Lesen",
    readWriteAria: "Lesen und Schreiben",
    add: "Hinzufügen",
  },

  transfersView: {
    active: "Aktiv",
    activeHint: "Wird gerade übertragen",
    paused: "Pausiert",
    pausedHint: "Jederzeit fortsetzen",
    completed: "Abgeschlossen",
    completedHint: "Geprüft & fertig",
    failed: "Fehlgeschlagen",
    failedHint: "Ein Klick zum Wiederholen",
    emptyTitle: "Noch keine Übertragungen",
    emptyDesc:
      "Lade etwas von deinem Smartphone hoch oder lade hier eine Datei herunter.\nDer Live-Fortschritt erscheint in diesem Center.",
    movingAtPrefix: "Wird übertragen mit",
    movingAtSuffix: "in deinem lokalen Netzwerk",
    allSettled: "Alles erledigt.",
    nCompleted: (n) => `${n} in dieser Sitzung abgeschlossen`,
    allDone: "Alle Übertragungen erfolgreich abgeschlossen",
  },

  devicesView: {
    title: "Gerät hinzufügen",
    qrExpired: "Dieser Code ist abgelaufen — generiere einen neuen.",
    qrHint:
      "Öffne LocalDock auf deinem Smartphone, tippe auf „QR scannen“ und richte die Kamera hierher.",
    thisBrowser: "Dieser Browser",
    pairedToast: (name) =>
      `Mit „${name}“ gekoppelt — du bist jetzt ein vertrautes Gerät`,
    revokeToast: (name) =>
      `„${name}“ kann nicht mehr auf diesen Computer zugreifen`,
    title2: "Geräte",
    subtitle: "Vertraute Geräte, die auf deine Freigaben zugreifen dürfen.",
    addDevice: "Gerät hinzufügen",
    cameraHint: "Keine Kamera? Gib den 6-stelligen Code ein, der auf dem Computer angezeigt wird:",
    codePlaceholder: "ABC123",
    codeAria: "Kopplungscode",
    pair: "Koppeln",
    emptyTitle: "Noch keine Geräte gekoppelt",
    emptyDesc:
      "Scanne den QR-Code einmal mit deinem Smartphone.\nDanach erkennen sich dein Smartphone und dieser Computer automatisch.",
    showQr: "QR-Code anzeigen",
    onlineNow: "Jetzt online",
    lastSeen: (when) => `Zuletzt gesehen ${when}`,
    pairedAgo: (when) => `· gekoppelt ${when}`,
    revoke: "Widerrufen",
    revokeTitle: (name) => `„${name}“ widerrufen?`,
    revokeDesc:
      "Das Gerät verliert sofort den Zugriff auf alle Freigaben. Es kann jederzeit mit einem neuen QR-Code wieder gekoppelt werden.",
    revokeConfirm: "Gerät widerrufen",
  },

  websitesView: {
    stoppedToast: (name) => `„${name}“ gestoppt`,
    liveToast: (name) => `„${name}“ ist live`,
    removedToast: "Website entfernt — Dateien bleiben auf dem Datenträger",
    copiedToast: "Link kopiert",
    copyFailToast: "Link konnte nicht kopiert werden.",
    title: "Websites",
    subtitle:
      "Jeder HTML-Ordner wird mit einem Klick zur Website für dein ganzes Netzwerk.",
    host: "Website hosten",
    hostVerb: "Hosten",
    emptyTitle: "Noch keine Websites gehostet",
    emptyDesc:
      "Du hast einen Ordner mit index.html?\nHoste ihn und öffne ihn in Sekunden von deinem Smartphone.",
    live: "Live",
    stopped: "Gestoppt",
    hostedAgo: (when) => `· gehostet ${when}`,
    stopAria: "Hosting stoppen",
    startAria: "Hosting starten",
    open: "Öffnen",
    qrAria: "QR anzeigen",
    removeAria: "Website entfernen",
    qrTitle: (name) => `„${name}“ teilen`,
    qrHint: "Richte ein beliebiges Gerät in diesem Netzwerk auf diesen Code.",
    removeTitle: (name) => `„${name}“ entfernen?`,
    removeDesc:
      "Die Website geht offline und verschwindet aus der Liste. Der Ordner und seine Dateien bleiben unangetastet auf dem Datenträger — du kannst sie jederzeit wieder hosten.",
    removeConfirm: "Website entfernen",
    dialogTitle: "Website hosten",
    dialogDesc:
      "Wähle einen Ordner auf diesem Computer, der deine statische Website enthält (mit einer index.html-Datei).",
    pickTitle: "Website-Ordner vom Computer auswählen",
    pickSub: "Wähle den Ordner mit der index.html",
    orPath: "Oder Pfad direkt eingeben:",
    pathPlaceholder: "z. B. D:\\MyWebsite",
    browse: "Laufwerke & Ordner auf dem Computer durchsuchen…",
    nameTitle: "Benenne deine Website",
    nameHint: "Sie ist in deinem Netzwerk verfügbar, sobald du auf „Hosten“ klickst.",
    nameAria: "Ordner ändern",
    nameChange: "ändern",
    websiteName: "Website-Name",
    namePlaceholder: "Mein Portfolio",
    addressLabel: "Adresse (optional)",
    addressPlaceholder: "portfolio",
    addressSuffix: ".localdock.local",
    successTitle: "Website ist live",
    successBody: (name) =>
      `„${name}“ wird gerade von deinem Computer bereitgestellt.`,
    openSite: "Website öffnen",
    pickStepDesc: "Wähle den Ordner, der deine index.html enthält.",
    websiteFallback: "Website",
    folderFallback: "Ordner",
    pickerTitle: "Website-Ordner auswählen",
  },

  settings: {
    savedToast: "Einstellungen gespeichert",
    tabGeneral: "Allgemein",
    tabSecurity: "Sicherheit",
    tabSystem: "System",
    identityTitle: "Identität deines Computers",
    identityDesc:
      "So erscheint deine Cloud für andere Geräte im Netzwerk.",
    serverName: "Servername",
    serverNamePlaceholder: "Mein PC",
    serverNameHint:
      "Geräte sehen diesen Namen beim Koppeln und beim Durchsehen von Freigaben.",
    appearanceTitle: "Erscheinungsbild",
    appearanceDesc: "Hell, dunkel oder wie dein System.",
    modeLight: "Hell",
    modeDark: "Dunkel",
    modeSystem: "System",
    themePacksTitle: "Farbschema",
    themePacksDesc: "Vier handgefertigte Paletten — jeweils mit hell & dunkel.",
    languageTitle: "Sprache",
    languageDesc: "Die gesamte App wechselt sofort, inklusive RTL-Layout.",
    startupTitle: "Windows-Start",
    startupDesc:
      "Startet LocalDock im Hintergrund, wenn dieser Computer hochfährt — so läuft deine Cloud immer.",
    startWithWindows: "Mit Windows starten",
    startupNote:
      "Gilt, wenn die LocalDock-Desktop-App unter Windows läuft.",
    securityTitle: "Nur lokales Netzwerk",
    securityDesc:
      "Deine Dienste berühren nie das Internet. Keine Cloud, keine Konten, kein Tracking.",
    trustedDevices: "Vertraute Geräte",
    guestShares: "Gast-Freigaben",
    server: "Server",
    manageDevices: "Geräte verwalten",
    ownerTitle: "Besitzer-Konsole",
    ownerDesc:
      "Legt fest, wer dieses Dashboard öffnen und den Server verwalten darf.",
    allowRemote: "Dashboard von jedem LAN-Gerät aus erlauben",
    allowRemoteNote:
      "Aus = nur dieser Computer kann Freigaben und Geräte verwalten (Standard der Desktop-App).",
    protectionsTitle: "Eingebaute Schutzmechanismen",
    protectionsDesc: "Immer aktiv, nichts zu konfigurieren.",
    protections: [
      "Sicheres Teilen ab Werk (Nur Lesen, keine Gäste)",
      "Sichere Gerätekopplung mit Einmal-Codes",
      "Berechtigungen pro Freigabe & Geräte-Zulassungslisten",
      "Schutz vor Path-Traversal- & Dateinamen-Angriffen",
      "SHA-256-Verifizierung übertragener Dateien",
      "Gerätezugriff mit einem Klick widerrufen",
    ],
    statusTitle: "Status",
    statusDesc: "Ein Live-Blick unter die Haube.",
    storageRow: "Speicher",
    network: "Netzwerk",
    nInterfaces: (n) => `${n} ${n === 1 ? "Schnittstelle" : "Schnittstellen"}`,
    localOnly: "Nur lokal",
    storageFree: (bytes) => `${bytes} frei`,
    transfers: "Übertragungen",
    devicesOnlineTrusted: (online, trusted) =>
      `${online} online / ${trusted} vertraut`,
    platform: "Plattform",
    netTitle: "Netzwerkadressen",
    netDesc: "Wo deine Cloud in diesem Netzwerk erreichbar ist.",
    netEmpty:
      "Keine externen Schnittstellen erkannt — der Server ist nur von diesem Rechner aus erreichbar.",
    netNote:
      "Dein Computer macht sich im lokalen Netzwerk automatisch bekannt. Geräte brauchen diese Adressen nie — Kopplung und QR-Codes übernehmen das. Die Desktop-App ergänzt die Namensauflösung von „localdock.local“ (mDNS).",
    desktopTitle: "Windows-App",
    desktopDesc: "Die LocalDock-Desktop-App verwaltet diesen Server.",
    desktopTray:
      "Wenn du dieses Fenster schließt, läuft der Server im Infobereich weiter.",
    desktopRegistry:
      "„Mit Windows starten“ steuert den echten Registrierungseintrag.",
    desktopMdns:
      "Der Server meldet sich per mDNS in deinem Netzwerk an.",
    openInBrowser: "In deinem Standardbrowser öffnen",
    logTitle: "Aktivitätsprotokoll",
    logDesc: "Die letzten 60 Ereignisse, neueste zuerst.",
    logEmpty: "Noch nichts protokolliert.",
    storageTitle: "Speicherort",
    storageDesc: "Wo LocalDock Freigaben, Websites und Metadaten aufbewahrt.",
    storageHome: "LocalDock-Ordner:",
    storageShares: "Freigaben:",
    storageWebsites: "Websites:",
    storageRegistry: "Registrierung:",
  },

  themePacks: {
    label: "Farbschema",
    teal: "Petrolnebel",
    ocean: "Mitternachtsozean",
    amethyst: "Amethyst",
    sunset: "Wüstenabendrot",
  },

  shareCard: {
    copiedToast: "Link kopiert — alle in deinem Netzwerk können ihn öffnen",
    copyFailToast: "Link konnte nicht kopiert werden.",
    nItems: (n) => `${n} Element${n === 1 ? "" : "e"}`,
    manageAria: (name) => `${name} verwalten`,
    readOnly: "Nur Lesen",
    readWrite: "Lesen & Schreiben",
    guestOn: "Gast-Link aktiv",
    devicesOnly: "Nur Geräte",
    open: "Öffnen",
    qrAria: "QR anzeigen",
    qrTitle: (name) => `„${name}“ teilen`,
    qrHint: "Scanne mit einem beliebigen Gerät in diesem Netzwerk — oder sende den Link.",
    updatedToast: "Freigabe-Einstellungen aktualisiert",
    stoppedToast: "Freigabe beendet — Dateien bleiben unangetastet auf dem Datenträger",
    manageTitle: (name) => `„${name}“ verwalten`,
    manageDesc: "Wer diesen Ordner sehen kann und was damit erlaubt ist.",
    nameLabel: "Name",
    accessLabel: "Zugriff",
    readWriteTitle: "Lesen & Schreiben",
    readWriteDesc: "Durchsehen, Herunterladen, Hochladen, Organisieren.",
    readOnlyTitle: "Nur Lesen",
    readOnlyDesc: "Nur Durchsehen und Herunterladen.",
    guestTitle: "Gastzugriff im Browser",
    guestDesc: "Teilbarer Link, keine Kopplung nötig.",
    deviceAccess: "Gerätezugriff",
    allDevices: "Alle vertrauten Geräte",
    specificDevices: "Nur bestimmte Geräte",
    noDevices: "Noch keine gekoppelten Geräte.",
    stopSharing: "Teilen beenden",
    stopSharingNote:
      "Entfernt die Freigabe überall. Dateien auf dem Datenträger werden nie angefasst.",
    stopTitle: "Teilen dieses Ordners beenden",
    stopConfirmTitle: (name) => `„${name}“ nicht mehr teilen?`,
    stopConfirmDesc:
      "Alle Geräte und Gast-Links verlieren sofort den Zugriff. Der Ordner und seine Dateien bleiben genau dort, wo sie auf deinem Computer sind.",
    keepSharing: "Weiter teilen",
  },

  transferRow: {
    progressAria: (name, n) => `${name} Fortschritt ${n} %`,
    eta: (eta) => ` · Restzeit ${eta}`,
    links: (n) => ` · ${n} ${n === 1 ? "Link" : "Links"}`,
    queued: "Wartet in der Warteschlange…",
    paused: "Pausiert",
    failed: "Fehlgeschlagen",
    verified: "Übertragen & geprüft",
    completed: "Abgeschlossen",
    canceled: "Abgebrochen",
    pickFile: "Wähle die Datei zum Fortsetzen aus",
    pause: "Pausieren",
    resume: "Fortsetzen",
    retry: "Wiederholen",
    cancel: "Abbrechen",
    dismiss: "Ausblenden",
  },

  transferDock: {
    aria: "Aktive Übertragungen",
    transferring: (n) =>
      `${n} ${n === 1 ? "Element wird" : "Elemente werden"} übertragen`,
    attention: "Braucht deine Aufmerksamkeit",
    collapse: "Einklappen",
    expand: "Ausklappen",
    openCenter: "Übertragungscenter öffnen",
  },

  fileBrowser: {
    breadcrumbAria: "Breadcrumb-Navigation",
    searchResults: "Suchergebnisse",
    readOnly: "Nur Lesen",
    nItemsSize: (n, size) => `${n} Element${n === 1 ? "" : "e"} · ${size}`,
    liveTitle: "Dieser Ordner aktualisiert sich automatisch",
    live: "Live",
    searchAria: "Dateien durchsuchen",
    clearSearchAria: "Suche löschen",
    sortAria: "Sortieroptionen",
    sortTitle: "Sortieren",
    sortNameAsc: "Name (A→Z)",
    sortNameDesc: "Name (Z→A)",
    sortNewest: "Neueste zuerst",
    sortOldest: "Älteste zuerst",
    sortLargest: "Größte zuerst",
    sortSmallest: "Kleinste zuerst",
    gridAria: "Rasteransicht",
    listAria: "Listenansicht",
    iconSizeAria: "Symbolgröße",
    iconSizeTitle: "Symbolgröße",
    gridIconSizeAria: "Symbolgröße im Raster",
    upload: "Hochladen",
    uploadFolderAria: "Ordner von diesem Gerät hochladen",
    newFolderAria: "Neuer Ordner",
    uploadingN: (n) =>
      `${n} ${n === 1 ? "Datei wird" : "Dateien werden"} hochgeladen`,
    uploadingTo: (target) => `in ${target}`,
    thisFolder: "diesen geteilten Ordner",
    queued: "In Warteschlange",
    eta: (eta) => `Restzeit ${eta}`,
    cancelUploadAria: (name) => `Upload von ${name} abbrechen`,
    uploadProgressAria: (name, n) =>
      `${name} Upload-Fortschritt ${n} %`,
    nMore: (n) => `+ ${n} weitere — Details im Übertragungscenter`,
    nMoreShort: (n) => `+ ${n} weitere`,
    uploading: "Wird hochgeladen",
    downloading: "Wird heruntergeladen",
    uploaded: "hochgeladen",
    downloaded: "heruntergeladen",
    upNoun: "Upload",
    downNoun: "Download",
    clearSelectionAria: "Auswahl aufheben",
    finishedVerb: (verb) => `${verb} abgeschlossen`,
    failedVerb: (verb) => `${verb} fehlgeschlagen`,
    nRemoteTransfers: (n) =>
      `${n} ${n === 1 ? "Übertragung" : "Übertragungen"} auf anderen Geräten`,
    done: "Fertig",
    failedLabel: "Fehlgeschlagen",
    failedPrefix: "Fehlgeschlagen: ",
    openFolderFail: "Ordner konnte nicht geöffnet werden",
    nothingMatches: (query) => `Keine Treffer für „${query}“`,
    emptyFolder: "Dieser Ordner ist leer",
    emptyHint:
      "Ziehe Dateien hierher, lade über die Symbolleiste hoch oder erstelle einen Ordner zum Sortieren.",
    nameCol: "Name",
    sizeCol: "Größe",
    modifiedCol: "Geändert",
    dropToUpload: "Zum Hochladen hier ablegen",
    nSelected: (n) => `${n} ausgewählt`,
    renameTitle: "Umbenennen",
    newNameSr: "Neuer Name",
    newFolderTitle: "Neuer Ordner",
    folderNamePlaceholder: "Ordnername",
    deleteOne: (name) => `„${name}“ löschen?`,
    deleteMany: (n) => `${n} ${n === 1 ? "Element" : "Elemente"} löschen?`,
    deleteOneDesc:
      "Wird endgültig vom Datenträger deines Computers entfernt. Das kann nicht rückgängig gemacht werden.",
    deleteManyDesc:
      "Werden endgültig vom Datenträger deines Computers entfernt. Das kann nicht rückgängig gemacht werden.",
    keep: "Behalten",
    folderType: "Ordner",
    actionsAria: (name) => `Aktionen für ${name}`,
    copyName: "Namen kopieren",
    tileS: "S",
    tileM: "M",
    tileL: "L",
    tileXL: "XL",
    remoteFinishedToast: (device, verb, name) =>
      `${device} hat ${verb} von „${name}“ abgeschlossen`,
    remoteFailedToast: (device, verb, name) =>
      `${device}: ${verb} von „${name}“ fehlgeschlagen`,
    downloadingToast: (name) =>
      `${name} wird heruntergeladen — verfolge den Fortschritt im Übertragungscenter`,
    uploadingToast: (name) => `${name} wird hochgeladen`,
    uploadingNToast: (n, size) =>
      `${n} ${n === 1 ? "Datei wird" : "Dateien werden"} hochgeladen (${size})`,
    uploadingFolderToast: (n, size) =>
      `Ordner mit ${n} ${n === 1 ? "Datei" : "Dateien"} wird hochgeladen (${size})`,
    folderCreatedToast: (name) => `Ordner „${name}“ erstellt`,
    renamedToast: "Umbenannt",
    deletedToast: (name) => `„${name}“ gelöscht`,
    nDeletedToast: (n) => `${n} ${n === 1 ? "Element" : "Elemente"} gelöscht`,
  },

  addShare: {
    nameFallback: "Geteilter Ordner",
    pickerTitle: "Ordner zum Teilen auswählen",
    pickerFailToast: "System-Ordnerauswahl konnte nicht geöffnet werden: ",
    emptyFolderToast: "Dieser Ordner enthält keine verwendbaren Dateien.",
    uploadingOneToast: "1 Datei wird von diesem Gerät hochgeladen…",
    uploadingNToast: (n) =>
      `${n} ${n === 1 ? "Datei wird" : "Dateien werden"} von diesem Gerät hochgeladen…`,
    needFolderToast: "Bitte wähle einen Ordner zum Teilen aus.",
    title: "Ordner zum Teilen hinzufügen",
    hostDesc:
      "Wähle einen beliebigen Ordner auf diesem Computer, um ihn mit deinen Geräten im lokalen Netzwerk zu teilen.",
    companionDesc:
      "Du bist auf einem Begleitgerät — wähle einen Ordner von DIESEM Gerät. Er wird über dein Netzwerk zum Computer hochgeladen und anschließend geteilt.",
    nativePickTitle: "Ordner auf diesem Computer auswählen",
    nativePickSub: "Öffnet den Datei-Explorer, um einen beliebigen Ordner auf deinem PC zu wählen",
    orPath: "Oder Pfad direkt eingeben:",
    pathPlaceholder: "z. B. D:\\Downloads oder C:\\Users\\...",
    quickAccess: "Schnellzugriff:",
    browse: "Laufwerke & Ordner auf dem Computer durchsuchen…",
    devicePickTitle: "Ordner von diesem Gerät auswählen",
    devicePickSub:
      "Öffnet die Ordnerauswahl dieses Geräts — der Inhalt wird zum Computer hochgeladen",
    deviceNote:
      "Ordner, die bereits auf dem Computer liegen, können nur vom Computer selbst geteilt werden. Alles, was du hier auswählst, wird sicher über dein lokales Netzwerk hochgeladen — ganz ohne Internet.",
    configureTitle: (name) => `„${name}“ teilen`,
    configureDesc: "Lege die Zugriffseinstellungen für Geräte in deinem Netzwerk fest.",
    nameSource: "Ordnername & Quelle",
    nameSourcePath: "Ordnername & echter Pfad",
    changeFolderAria: "Ordner ändern",
    nFilesUploading: (n, size) =>
      `${n} ${n === 1 ? "Datei" : "Dateien"} · ${size} — wird von diesem Gerät hochgeladen`,
    namePlaceholder: "Ordnername",
    accessLabel: "Zugriff",
    readWriteTitle: "Lesen & Schreiben",
    readWriteDesc:
      "Geräte können Dateien in diesem Ordner durchsehen, herunterladen, hochladen und organisieren.",
    readOnlyTitle: "Nur Lesen",
    readOnlyDesc:
      "Geräte können durchsehen und herunterladen — keine Änderungen möglich.",
    guestTitle: "Gastzugriff im Browser",
    guestDesc:
      "Jeder in diesem Netzwerk kann den Freigabe-Link öffnen — keine Kopplung nötig.",
    shareFolder: "Ordner teilen",
    successToast: "Erfolgreich geteilt",
    successUploading: (name, n) =>
      `„${name}“ ist geteilt — der Inhalt (${n} ${n === 1 ? "Datei" : "Dateien"}) wird von diesem Gerät hochgeladen. Fortschritt im Übertragungsdock verfolgen.`,
    successPlain: (name) =>
      `„${name}“ ist jetzt geteilt und in deinem Netzwerk verfügbar.`,
    available: "Verfügbar",
    showQrLink: "QR & Link anzeigen",
    browserTitle: "Ordner auf dem Computer auswählen",
    browserDesc:
      "Navigiere durch die Laufwerke und Ordner deines Computers, um zu wählen, was geteilt werden soll.",
    browserConfirm: "Diesen Ordner wählen",
    qrTitle: (name) => `„${name}“ teilen`,
    qrHint: "Scanne mit einem beliebigen Gerät in diesem Netzwerk — oder sende den Link.",
  },

  folderBrowser: {
    needPathToast:
      "Bitte gib zuerst ein Laufwerk oder einen Ordner ein, bevor du einen Unterordner erstellst.",
    createdToast: (name) => `Ordner „${name}“ erstellt`,
    hostNote:
      "Dies sind die Laufwerke des Computers, auf dem LocalDock läuft. Um Ordner von DIESEM Gerät hinzuzufügen, verwende unter Freigaben „Ordner hinzufügen“ — dann wird stattdessen von deinem Gerät hochgeladen.",
    thisPc: "💻 Dieser PC (Laufwerke & Ordner)",
    filterPlaceholder: "Ordner filtern…",
    noMatch: "Keine Ordner entsprechen deinem Filter.",
    empty: "Dieser Ordner ist leer.",
    newNamePlaceholder: "Neuer Ordnername…",
    indexNote: "Wähle einen Ordner, der eine index.html-Datei enthält.",
  },

  qr: {
    copiedToast: "Link kopiert",
    copyFailToast: "Kopieren fehlgeschlagen — halte den Link unten gedrückt, um ihn zu kopieren.",
    qrAlt: "QR-Code",
    expiresMin: (n) => `Code läuft in ${n} ${n === 1 ? "Minute" : "Minuten"} ab`,
    expiresSec: (n) => `Code läuft in ${n} ${n === 1 ? "Sekunde" : "Sekunden"} ab`,
    copyAria: "Link kopieren",
  },

  preview: {
    download: "Download",
    closeAria: "Vorschau schließen",
    largeFile: (size) =>
      `Diese Datei ist groß (${size}) — lade sie herunter, um den Inhalt anzusehen.`,
    archiveNote: "Archive werden nicht in der Vorschau angezeigt — lade sie herunter und öffne sie lokal.",
    apkNote: "APK-Datei — lade sie herunter und installiere sie auf einem Android-Gerät.",
    noPreview: (mime) =>
      `Keine Vorschau für diesen Dateityp (${mime}) — lade die Datei stattdessen herunter.`,
    unknownType: "unbekannt",
    verifySha: "Integrität prüfen (SHA-256)",
    shaLabel: "SHA-256",
    zoomOut: "Herauszoomen",
    fitTitle: "Einpassen / 100 % umschalten",
    fit: "Einpassen",
    zoomIn: "Hineinzoomen",
    rotateLeft: "Nach links drehen",
    rotateRight: "Nach rechts drehen",
    reset: "Zurücksetzen (eingepasst)",
    back10: "10 Sekunden zurück",
    fwd10: "10 Sekunden vor",
    mute: "Stumm",
    unmute: "Ton an",
    seekAria: "Spulen",
    playAria: "Abspielen",
    pauseAria: "Pausieren",
    volumeAria: "Lautstärke",
    speedTitle: "Wiedergabegeschwindigkeit",
    prevAria: "Vorherige Datei",
    nextAria: "Nächste Datei",
    pdfTitle: (name) => `PDF-Vorschau von ${name}`,
  },

  guest: {
    unavailable: "Dieser Link ist nicht verfügbar.",
    opening: "Geteilter Ordner wird geöffnet…",
    privateTitle: "Dieser Ordner ist privat",
    privateDesc: "Bitte den Besitzer, dein Gerät zu koppeln oder den Gastzugriff zu aktivieren.",
    sharedFrom: "Geteilt von einem Computer in diesem Netzwerk · ",
    readWrite: "Lesen & Schreiben",
    readOnly: "Nur Lesen",
  },

  pairClaim: {
    incomplete: "Dieser Kopplungslink ist unvollständig.",
    defaultAndroid: "Mein Android",
    defaultIphone: "Mein iPhone",
    defaultBrowser: "Mein Browser",
    yourComputer: "dein Computer",
    defaultDevice: "Mein Gerät",
    reading: "Kopplungscode wird gelesen…",
    title: "Mit diesem Computer koppeln?",
    deviceName: "Gerätename",
    trust: "Diesem Gerät vertrauen",
    trustedTitle: "Vertrautes Gerät",
    trustedBody: (server) =>
      `Dieser Browser ist jetzt mit „${server}“ gekoppelt.`,
    failedTitle: "Kopplung fehlgeschlagen",
    goBack: "Zurück",
  },

  onboarding: {
    tagline: "Deine persönliche lokale Cloud",
    heroTitle: "Mach diesen Computer zu deiner privaten Cloud.",
    heroDesc:
      "Teile Ordner mit jedem Gerät in deinem Netzwerk — so einfach wie Google Drive, aber deine Dateien verlassen nie diesen Raum.",
    featPrivate: "Privat",
    featPrivateDesc: "Nichts erreicht jemals das Internet",
    featFast: "Schnell",
    featFastDesc: "Volle lokale Netzwerkgeschwindigkeit, fortsetzbare Übertragungen",
    featLocal: "Lokal",
    featLocalDesc: "Funktioniert auch ohne Internet",
    getStarted: "Los geht's",
    nameTitle: "Benenne deine Cloud",
    nameDesc: "So erkennen deine Geräte diesen Computer.",
    namePlaceholder: "Mein PC",
    folderTitle: "Füge deinen ersten Ordner hinzu",
    folderDescHost:
      "Wähle einen Ordner — er ist sofort auf deinen anderen Geräten verfügbar.",
    folderDescDevice:
      "Wähle einen Ordner von diesem Gerät — er wird zum Computer hochgeladen und ist dann in deinem Netzwerk verfügbar.",
    sharedBadge: (name) => `„${name}“ wird geteilt`,
    sharedNow: "Jetzt in deinem Netzwerk verfügbar.",
    uploadingNow: "Wird gerade von diesem Gerät hochgeladen.",
    waitingPicker: "Warte auf die Ordnerauswahl…",
    pickHost: "Ordner zum Teilen auswählen",
    pickDevice: "Ordner von diesem Gerät auswählen",
    pickHostHint: "Dokumente, Fotos, Projekte — alles",
    pickDeviceHint: "Er wird über dein lokales Netzwerk zum Computer hochgeladen",
    phoneTitle: "Verbinde dein Smartphone",
    phoneDesc:
      "Scanne den QR-Code mit LocalDock auf deinem Smartphone — einmal scannen, für immer gemerkt.",
    showQr: "Kopplungs-QR-Code anzeigen",
    takesSeconds: "dauert etwa zehn Sekunden",
    preparing: "Deine Cloud wird vorbereitet…",
    ready: "Du bist bereit — öffne LocalDock",
    pairLaterPre: "Geräte kannst du jederzeit koppeln unter",
    pairLaterLink: "Geräte",
    footer: "Nur lokal · Kein Konto · Keine Cloud · Kein Tracking",
    browserTitle: "Füge deinen ersten Ordner hinzu",
    browserDesc: "Wähle einen Ordner auf diesem Computer — oder erstelle einen neuen.",
    browserConfirm: "Diesen Ordner teilen",
    folderFallback: "Mein Ordner",
  },

  apiErrors: {
    network:
      "Dein Computer ist nicht erreichbar. Prüfe, ob beide Geräte im selben Netzwerk sind — Übertragungen werden automatisch fortgesetzt, sobald er wieder erreichbar ist.",
    generic: "Bei der Kommunikation mit deinem Computer ist etwas schiefgelaufen.",
    thisDevice: "Dieses Gerät",
    unauthorized: "Dieser Vorgang erfordert die LocalDock-Besitzer-Konsole.",
    shareNotFound: "Diesen geteilten Ordner gibt es nicht mehr.",
    forbidden:
      "Deine Zugriffsstufe erlaubt diese Aktion in diesem Ordner nicht.",
    privateFolder:
      "Dieser Ordner ist privat. Kopple dein Gerät oder bitte den Besitzer, den Gastzugriff zu aktivieren.",
    notFound: "Nicht gefunden.",
    badPath: "Dieser Pfad kann nicht verwendet werden.",
    badBody: "Die Anfrage war ungültig.",
    badName: "Dieser Name kann nicht verwendet werden.",
    exists: "Hier existiert bereits etwas mit diesem Namen.",
    permission:
      "Der Server hat nicht die Berechtigung, dies in diesem Ordner zu tun.",
    notFile: "Dieser Pfad ist keine Datei.",
    notDir: "Dieser Pfad ist kein Ordner.",
    sessionExpired: "Upload-Sitzung abgelaufen oder abgebrochen.",
    checksumMismatch:
      "Die hochgeladene Datei hat die Integritätsprüfung nicht bestanden.",
    sizeMismatch: "Die Datei auf dem Datenträger entspricht nicht der angegebenen Größe.",
    shareGone: "Der geteilte Ordner wurde während des Uploads entfernt.",
    noThumb: "Für diesen Dateityp ist kein Vorschaubild verfügbar.",
    thumbFailed: "Vorschaubild konnte nicht erstellt werden.",
    badSlug: "Dieser Link passt zu keinem geteilten Ordner.",
    badAddress: "Verwende für die Adresse Buchstaben, Zahlen und Bindestriche.",
    startFailed: "Der Upload konnte nicht gestartet werden.",
    badIndex: "Dieser Ordner enthält keine index.html — füge eine hinzu und versuche erneut zu hosten.",
    createFailed: "Der Ordner konnte nicht erstellt werden.",
    writeFailed: "Auf den Datenträger konnte nicht geschrieben werden.",
    readFailed: "Vom Datenträger konnte nicht gelesen werden.",
    renameFailed: "Das Element konnte nicht umbenannt werden.",
    deleteFailed: "Das System hat die Löschung dieses Elements verweigert.",
    completeFailed: "Der Upload konnte nicht abgeschlossen werden.",
    needCode: "Ein Kopplungscode ist erforderlich.",
    badCode:
      "Dieser Code ist ungültig oder abgelaufen. Generiere auf dem Computer einen neuen.",
    privatePair:
      "Dieser Ordner ist privat. Kopple dein Gerät mit dem Computer, um darauf zuzugreifen.",
    needWebsiteName: "Gib der Website einen Namen.",
    needFolderName: "Bitte gib diesem Ordner einen Namen.",
    chooseFolder: "Wähle zuerst einen Ordner aus.",
    needAbsolutePath:
      "Der ausgewählte Pfad muss ein absoluter Pfad sein (z. B. D:\\MyFolder oder C:\\Users\\...).",
    needValidFolder: "Bitte wähle zuerst einen gültigen Ordner aus.",
    folderExistsHere: (name) =>
      `„${name}“ existiert an diesem Speicherort bereits.`,
    itemExists: (name) => `„${name}“ existiert bereits.`,
    emptyServerName: "Der Servername darf nicht leer sein.",
    deviceNotFound: "Gerät nicht gefunden.",
    folderNotOnDisk: "Dieser Ordner wurde auf diesem Computer nicht gefunden.",
  },

  transferErrors: {
    notFound: "Übertragung nicht gefunden.",
    wrongFile:
      "Das ist eine andere Datei — wähle dieselbe Datei aus, um diese Übertragung fortzusetzen.",
    connectionLost: "Verbindung verloren — warten auf das Netzwerk…",
    generic: "Die Übertragung ist fehlgeschlagen.",
    uploadStalled: "Der Upload ist steckengeblieben und konnte nicht abgeschlossen werden.",
    chunkFailed: "Ein Block konnte nicht hochgeladen werden.",
    downloadFailed: "Download fehlgeschlagen.",
    segmentDropped: "Verbindung mitten im Segment abgebrochen — wird wiederholt.",
    fileKind: "Datei",
    stopped: "Übertragung gestoppt.",
    downloadInterrupted: "Download unterbrochen — wird wiederholt.",
    segmentsIncomplete: "Die Download-Segmente sind unvollständig.",
    reconnectHint: "Neu verbinden: Wähle dieselbe Datei erneut aus, um fortzusetzen.",
  },

  activity: {
    devicePaired: (name) => `Neues Gerät gekoppelt: „${name}“`,
    deviceRevoked: (name) => `Vertrautes Gerät „${name}“ widerrufen`,
    websiteHosted: (name) => `Website „${name}“ ist live`,
    websiteStopped: (name) => `Website „${name}“ gestoppt`,
    websiteRemoved: (name) =>
      `Website „${name}“ entfernt (Dateien bleiben auf dem Datenträger)`,
    folderCreated: (name, share) =>
      `Ordner „${name}“ in „${share}“ erstellt`,
    shareUpdated: (name) =>
      `Freigabe-Einstellungen für „${name}“ aktualisiert`,
    shareDeleted: (name) =>
      `Teilen von „${name}“ beendet (Dateien bleiben auf dem Datenträger)`,
    shareCreated: (name) => `Freigabe „${name}“ erstellt`,
    fileUploaded: (name, share) =>
      `„${name}“ in „${share}“ hochgeladen`,
    fileDownloaded: (name, share) =>
      `„${name}“ aus „${share}“ heruntergeladen`,
    entryRenamed: (from, to, share) =>
      `„${from}“ in „${to}“ umbenannt (in „${share}“)`,
    entryDeleted: (name, share) =>
      `„${name}“ aus „${share}“ gelöscht`,
    denied: (action, share) =>
      `${action} in „${share}“ verweigert`,
  },
};
