# El Banquillo — Modo Carrera

Manager de fútbol de un solo componente React (`src/App.jsx`), desplegado como
sitio estático en GitHub Pages con Vite.

## Correr en local

```bash
npm install
npm run dev
```

Abre la URL que imprime Vite (normalmente http://localhost:5173).

Para probar el build de producción tal como queda en GitHub Pages:

```bash
npm run build
npm run preview
```

## Guardado de partida

El juego usa `window.storage.get/set/delete/list`, la API del entorno de
artifacts de Claude.ai. Como este sitio corre fuera de ese entorno,
`src/storage-polyfill.js` implementa esas mismas cuatro funciones usando
`localStorage` del navegador. Se importa al inicio de `src/App.jsx`, así que
la partida (y la configuración del motor de IA) persisten entre recargas
igual que en el original.

## Motores de IA

El juego permite elegir motor de IA en la pantalla de inicio:

- **📦 Local** y **🖥 Mi servidor** — funcionan sin ninguna configuración
  adicional una vez desplegado el sitio (Local no llama a ninguna API
  externa; Mi servidor llama al endpoint que tú indiques).
- **🧠 IA total** y **⭐ Momentos clave** — llaman directo a
  `https://api.anthropic.com/v1/messages` desde el navegador. Fuera del
  entorno de artifacts de Claude.ai eso requiere tu propia API key de
  Anthropic, que puedes pegar en el campo que aparece al elegir uno de estos
  dos motores. La key se guarda solo en `localStorage` de tu navegador (nunca
  se escribe en el código ni se envía a ningún servidor propio) y se manda
  como header `x-api-key` en cada llamada.

### Conectar "Mi servidor" con Ollama + túnel SSH

Si tienes [Ollama](https://ollama.com) corriendo en tu propia máquina y
quieres usarlo como motor de IA sin exponerlo permanentemente a internet,
puedes abrir un túnel temporal con `localhost.run`:

```bash
# 1. Asegúrate de tener un modelo descargado, por ejemplo:
ollama pull qwen2.5:3b

# 2. Abre el túnel (expone tu puerto 11434 de Ollama por HTTPS público):
ssh -R 80:localhost:11434 nokey@localhost.run
```

El comando imprimirá una URL pública tipo `https://xxxxx.lhr.life`. En la
pantalla de inicio del juego, elige el motor **🖥 Mi servidor** y pega:

- URL: `https://xxxxx.lhr.life/api/chat`
- Modelo: el nombre del modelo que descargaste (ej. `qwen2.5:3b`)

El túnel solo vive mientras el comando `ssh` siga corriendo, así que déjalo
abierto en una terminal mientras juegas.

## Despliegue a GitHub Pages

El repositorio incluye un workflow de GitHub Actions
(`.github/workflows/deploy.yml`) que en cada push a `main`:

1. Instala dependencias (`npm ci`)
2. Compila el sitio (`npm run build`)
3. Publica el contenido de `dist/` en GitHub Pages

Para que funcione, en el repositorio de GitHub hay que activar
**Settings → Pages → Source: GitHub Actions** (solo la primera vez).

El `base` en `vite.config.js` está configurado como `/el-banquillo/`, que
debe coincidir con el nombre del repositorio en GitHub para que los assets
carguen correctamente en `https://<usuario>.github.io/el-banquillo/`.
