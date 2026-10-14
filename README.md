<p align="center"><img src="build/logo.png" width="160" alt="AI DECK"></p>

<h1 align="center">AI DECK</h1>

App de escritorio para Windows que abre una consola real por cada CLI de IA (Claude Code, Antigravity,
DeepSeek via OpenCode, OpenCode y PowerShell) dentro de una sola ventana, con un gestor de ventanas
estilo Windows 11 (ajuste a zonas, mosaico, cascada) y un panel de consumo / cuota de cada agente.

- Cada consola es un PTY real (ConPTY via `node-pty`) con `xterm.js`.
- Al reabrir la app se restauran las consolas y cada CLI retoma su ultima conversacion en la carpeta.
- Deteccion en caliente: un CLI recien instalado aparece sin reiniciar la app.
- Instalacion asistida de los CLI que faltan, siempre mostrando el comando exacto antes de correrlo.
- Espanol / ingles, cinco paletas en modo claro y oscuro.

## Requisitos

- Windows 10/11 x64
- [Node.js](https://nodejs.org) 20 o superior (solo para desarrollar o compilar)
- Los CLI que quieras usar; la app ofrece instalarlos si no los encuentra

## Desarrollo

```powershell
npm install
npm start
```

No hay bundler ni transpilador: se edita y se recarga la ventana con `Ctrl+R`.

## Compilar

```powershell
npm run dist   # instalador + portable en C:\AI-DECK\dist, y copia del instalador en C:\AI-DECK\AI-DECK-Setup.exe
npm run pack   # solo la version desempaquetada, para probar rapido
```

El instalador (`AI-DECK-Setup-<version>.exe`) es la forma recomendada: instala por usuario, sin
permisos de administrador, y arranca en menos de un segundo. El portable descomprime la app en
`%TEMP%` en cada arranque y tarda unos 30 s.

Los builds no estan firmados, asi que SmartScreen avisa la primera vez en otro equipo.

## Seguridad

- Renderer con `contextIsolation`, `sandbox` y sin Node; todo pasa por un preload minimo.
- Content-Security-Policy: solo scripts locales, nada remoto.
- Navegacion, ventanas nuevas, `<webview>` y permisos del navegador bloqueados.
- Cada mensaje IPC se valida contra la pagina propia; las instalaciones exigen confirmacion en un
  dialogo nativo.
- Electron Fuses en el ejecutable: sin `NODE_OPTIONS`, sin `--inspect`, carga solo desde `app.asar`
  con verificacion de integridad.
- La API key de DeepSeek se guarda en el entorno del usuario y nunca pasa por la app ni por su log.

## Datos locales

Configuracion y log en `%USERPROFILE%\.config\ai-hub\` (`config.json`, `ai-hub.log`); la carpeta conserva el nombre
anterior del proyecto para no perder la configuracion existente. Ahi tambien se
pueden sumar agentes propios:

```json
{
  "agents": [{ "id": "mi-cli", "title": "MI CLI", "exe": "mi-cli", "tag": "propio" }]
}
```

## Descarga e instalacion

Los ejecutables estan en [Releases](../../releases). Se compilan con GitHub Actions
([`.github/workflows/build.yml`](.github/workflows/build.yml)) a partir de este codigo, en un runner limpio.

## Desinstalar

- **Instalador:** Configuracion de Windows > Aplicaciones > Aplicaciones instaladas > **AI DECK** >
  Desinstalar.
- **Portable:** basta con borrar el `.exe`.
- La configuracion y el log no se borran solos. Para eliminarlos tambien, borra la carpeta
  `%USERPROFILE%\.config\ai-hub\`.
- Si la app guardo tu clave de DeepSeek, sigue en la variable de entorno de usuario `DEEPSEEK_API_KEY`;
  quitala desde "Editar las variables de entorno de esta cuenta" si ya no la usas.

## Privacy

AI DECK does not collect telemetry, analytics or crash reports, and has no server of its own.
The app itself only makes these network requests:

- **DeepSeek balance:** when the usage panel refreshes and `DEEPSEEK_API_KEY` is set, it queries
  `https://api.deepseek.com/user/balance` with that key. The key is read from the user environment
  inside PowerShell and is never written to the app's log or config.
- **Installing a missing CLI:** only after the user confirms a dialog showing the exact command, which
  then downloads that CLI from its official source (winget or the vendor's installer).

The AI CLIs launched inside the consoles (Claude Code, Antigravity, OpenCode) and their usage commands
talk to their own providers under those providers' terms. AI DECK does not read or forward that traffic.
Settings and logs stay on the local machine in `%USERPROFILE%\.config\ai-hub\`.

## Code signing policy

Windows release binaries are built from this repository by GitHub Actions; nothing built on a personal
machine is signed.

Free code signing provided by [SignPath.io](https://about.signpath.io), certificate by
[SignPath Foundation](https://signpath.org). *(Pending approval: current releases are unsigned.)*

Team roles:

- Committers and reviewers: [JereR1621](https://github.com/JereR1621)
- Approvers: [JereR1621](https://github.com/JereR1621)

Every signing request is approved manually for each release.

## Licencia

[MIT](LICENSE)
