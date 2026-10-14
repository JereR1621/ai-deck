// Textos de la interfaz. Para agregar un idioma, copia un bloque y traducelo.
// Las claves con (args) son plantillas; el resto son textos sueltos.
const I18N = {
  es: {
    // --- cabecera y secciones ---
    secFolder: '01 // CARPETA', secAgents: '02 // AGENTES', secView: '03 // VISTA', secUsage: '04 // CONSUMO',
    browse: 'EXAMINAR', tile: 'MOSAICO', cascade: 'CASCADA', log: 'LOG',
    themeTitle: 'Alternar entre claro y oscuro',
    paletteTitle: 'Elegir tema de colores',
    langTitle: 'Switch to English',
    redetect: 'Buscar de nuevo los agentes instalados',
    tileTitle: 'Repartir las consolas en cuadricula',
    cascadeTitle: 'Soltar las consolas en cascada',
    logTitle: 'Ver la ruta del archivo de registro',
    usageRefresh: 'Actualizar el consumo de cada agente',

    // --- estado ---
    hint: 'arrastra la barra de una consola para moverla · esquina inferior derecha para redimensionar',
    start: 'elige una carpeta y abre un agente',
    consoles: (n) => (n === 1 ? '1 consola' : `${n} consolas`),
    folderSet: (f) => `carpeta: ${f}`,
    opened: (title, f) => `${title} abierto en ${f}`,
    closed: 'consola cerrada',
    cannotOpen: (m) => `no se pudo abrir: ${m}`,
    sessionEnded: (c) => `[sesion terminada con codigo ${c}]`,
    searching: 'buscando agentes...',
    detected: (l) => `detectados: ${l}`,
    noneDetected: 'no se detecto ningun agente',
    installing: (title) => `instalando ${title}...`,
    installCancelled: 'instalacion cancelada',
    installed: (title) => `${title} instalado y listo`,
    installStuck: (title) => `${title} sigue sin aparecer; revisa la consola de instalacion`,
    restoring: (n) => (n === 1 ? 'restaurando 1 consola...' : `restaurando ${n} consolas...`),
    autoTile: 'cuadricula automatica',
    cascadeMsg: 'ventanas en cascada',
    restored: 'tamano restaurado',
    logPath: (p) => `registro: ${p}`,

    // --- agentes ---
    starting: 'iniciando...',
    notInstalled: 'no detectado',
    toInstall: '↓ instalar',
    installHint: (how, cmd) => `No detectado. Haz clic para instalarlo con ${how}:\n${cmd}`,
    notInPath: (exe) => `'${exe}' no esta en el PATH. Puedes intentarlo igual.`,
    anthropic: 'Anthropic', google: 'Google', viaOpenCode: 'via OpenCode',
    openSource: 'codigo abierto', terminal: 'terminal', custom: 'propio',
    winget: 'winget', officialInstaller: 'el instalador oficial',

    // --- ventanas ---
    installWin: (title) => `INSTALAR ${title}`,
    closeWin: 'Cerrar consola',
    snapWin: 'Acomodar esta consola',
    resizeWin: 'Redimensionar',

    // --- consumo ---
    checking: 'consultando...',
    at: (h) => `a las ${h}`,
    noUsage: 'ningun agente informa consumo',
    session: 'sesion', week: 'semana', fiveHour: '5 h', spent: 'gastado', sessions: 'sesiones',
    used: 'usado', balance: 'saldo', accumulated: '',
    balanceDetail: (cur, granted, topped) => `${cur}: ${granted} de regalo, ${topped} recargado`,
    spentDetail: (total) => `costo total acumulado: ${total}`,
    missingKey: 'falta DEEPSEEK_API_KEY',
    noUsageData: 'sin datos de /usage',
    noBalance: 'la respuesta no traia saldo',
    badResponse: 'respuesta ilegible',
    noStats: 'sin estadisticas',

    // --- errores del proceso principal ---
    unknownAgent: 'agente desconocido',
    folderMissing: 'la carpeta de trabajo ya no existe',
    noAutoInstall: 'este agente no tiene instalacion automatica',
    installNotConfirmed: 'la instalacion no fue confirmada',
    badRequest: 'pedido invalido',
    untrusted: 'origen no autorizado',

    // --- distribuciones y temas ---
    lay2col: 'dos columnas', lay3col: 'tres columnas', lay2row: 'dos filas',
    lay2x2: 'cuadricula 2 x 2', laybigL: 'una grande y dos chicas', layfull: 'pantalla completa',
    palSky: 'Celeste', palMatrix: 'Matrix', palNeon: 'Neon', palAmber: 'Ambar', palPaper: 'Papel', palMono: 'Basico',
  },

  en: {
    // --- header and sections ---
    secFolder: '01 // FOLDER', secAgents: '02 // AGENTS', secView: '03 // LAYOUT', secUsage: '04 // USAGE',
    browse: 'BROWSE', tile: 'TILE', cascade: 'CASCADE', log: 'LOG',
    themeTitle: 'Toggle light and dark',
    paletteTitle: 'Choose a colour theme',
    langTitle: 'Cambiar a español',
    redetect: 'Scan again for installed agents',
    tileTitle: 'Arrange the consoles in a grid',
    cascadeTitle: 'Let the consoles float in a cascade',
    logTitle: 'Show the log file path',
    usageRefresh: 'Refresh each agent usage',

    // --- status ---
    hint: 'drag a console title bar to move it · drag the bottom-right corner to resize',
    start: 'choose a folder, then open an agent',
    consoles: (n) => (n === 1 ? '1 console' : `${n} consoles`),
    folderSet: (f) => `folder: ${f}`,
    opened: (title, f) => `${title} opened in ${f}`,
    closed: 'console closed',
    cannotOpen: (m) => `could not open it: ${m}`,
    sessionEnded: (c) => `[session ended with code ${c}]`,
    searching: 'looking for agents...',
    detected: (l) => `found: ${l}`,
    noneDetected: 'no agents found',
    installing: (title) => `installing ${title}...`,
    installCancelled: 'install cancelled',
    installed: (title) => `${title} is installed and ready`,
    installStuck: (title) => `${title} still is not showing up; check the install console`,
    restoring: (n) => (n === 1 ? 'restoring 1 console...' : `restoring ${n} consoles...`),
    autoTile: 'auto grid',
    cascadeMsg: 'cascading windows',
    restored: 'size restored',
    logPath: (p) => `log file: ${p}`,

    // --- agents ---
    starting: 'starting...',
    notInstalled: 'not found',
    toInstall: '↓ install',
    installHint: (how, cmd) => `Not found. Click to install it with ${how}:\n${cmd}`,
    notInPath: (exe) => `'${exe}' is not on your PATH. You can still try to run it.`,
    anthropic: 'Anthropic', google: 'Google', viaOpenCode: 'via OpenCode',
    openSource: 'open source', terminal: 'terminal', custom: 'custom',
    winget: 'winget', officialInstaller: 'the official installer',

    // --- windows ---
    installWin: (title) => `INSTALL ${title}`,
    closeWin: 'Close console',
    snapWin: 'Snap this console',
    resizeWin: 'Resize',

    // --- usage ---
    checking: 'checking...',
    at: (h) => `at ${h}`,
    noUsage: 'no agent reports usage',
    session: 'session', week: 'week', fiveHour: '5 h', spent: 'spent', sessions: 'sessions',
    used: 'used', balance: 'left', accumulated: '',
    balanceDetail: (cur, granted, topped) => `${cur}: ${granted} granted, ${topped} topped up`,
    spentDetail: (total) => `total cost so far: ${total}`,
    missingKey: 'DEEPSEEK_API_KEY is not set',
    noUsageData: 'no /usage data',
    noBalance: 'the response carried no balance',
    badResponse: 'could not read the response',
    noStats: 'no statistics yet',

    // --- main process errors ---
    unknownAgent: 'unknown agent',
    folderMissing: 'the working folder no longer exists',
    noAutoInstall: 'this agent has no automatic installer',
    installNotConfirmed: 'the installation was not confirmed',
    badRequest: 'invalid request',
    untrusted: 'unauthorized origin',

    // --- layouts and themes ---
    lay2col: 'two columns', lay3col: 'three columns', lay2row: 'two rows',
    lay2x2: 'two by two', laybigL: 'one big, two small', layfull: 'full screen',
    palSky: 'Sky', palMatrix: 'Matrix', palNeon: 'Neon', palAmber: 'Amber', palPaper: 'Paper', palMono: 'Basic',
  },
};

let LANG = 'es';
// t('clave') devuelve texto; t('clave', a, b) llama a la plantilla con argumentos.
function t(key, ...args) {
  const v = I18N[LANG]?.[key] ?? I18N.es[key] ?? key;
  return typeof v === 'function' ? v(...args) : v;
}
