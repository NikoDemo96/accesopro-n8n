# AccesoPro · Motor de contenido en vídeo (prueba técnica AI Engineer)

Sistema que **produce, revisa y publica vídeo educativo** de forma automática a partir de dos fuentes:

1. **El texto del temario** → ideas → guiones cortos (30-60 s) → voz clonada → vídeo 9:16 y 16:9.
2. **Una clase grabada en directo** → transcripción → detección de 5-8 momentos con valor propio → clips 9:16 y 16:9.

Entre la generación y la publicación hay un **agente revisor** (un modelo distinto del que escribe) que comprueba cada guion y cada clip contra el **temario oficial de la Generalitat Valenciana** y rechaza lo que tenga errores o datos inventados.

Todo se lanza con **un solo botón** (_Execute workflow_ en el workflow principal) y deja una **tabla de control** con el estado, el coste y el enlace de cada pieza.

---

## 1. Qué hay en este repositorio

| Ruta                                                    | Qué es                                                                                                                           |
| ------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.yml`, `Dockerfile`                      | n8n local con FFmpeg y yt-dlp ya instalados                                                                                      |
| `workflows/*.json`                                      | Exportación de los 3 workflows de n8n (importables)                                                                              |
| `data/scripts/`                                         | Scripts de medios: `render.js` (montaje, subtítulos, miniatura), `download.sh` (yt-dlp), `prepare_audio.sh` (audio para Whisper) |
| `data/brand/`                                           | Brand book, logos y tipografía Inter (licencia OFL)                                                                              |
| `data/in/`                                              | Entradas: temario TXT, guion de podcast JSON, temario oficial PDF (la clase se descarga sola)                                    |
| `data/audio`, `data/video`, `data/thumbs`, `data/clips` | Salidas generadas                                                                                                                |

### Los 3 workflows de n8n

| Workflow                                              | Función                                                                                                                                         |
| ----------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **AccesoPro · Motor de contenido en vídeo (Nivel 1)** | El que se lanza. Lee las fuentes, divide el tema en ideas, descarga y transcribe la clase, elige los clips y lanza la producción de cada pieza. |
| **AccesoPro · Producir pieza**                        | Se ejecuta una vez por pieza: guion → revisión → (corrección) → metadatos → voz → montaje → YouTube → tabla.                                    |
| **AccesoPro · Agente revisor**                        | Revisa una pieza contra el temario oficial y devuelve veredicto con los errores citados.                                                        |

---

## 2. Puesta en marcha (sin perfil técnico)

### 2.1 Arrancar n8n

1. Instala **Docker Desktop**.
2. En esta carpeta ejecuta: `docker compose up -d --build`
3. Abre <http://localhost:5679> y crea tu usuario de n8n.

### 2.2 Importar los workflows

En n8n: _Workflows → Import from file_ y carga, **en este orden**, los tres ficheros de `workflows/`:
`1_agente_revisor.json`, `2_producir_pieza.json`, `3_motor_video.json`.

> Si los IDs cambian al importar, abre los nodos _Execute Workflow_ (“Agente revisor · revisión 1/2” y “Producir pieza”) y vuelve a seleccionar el workflow correspondiente.

### 2.3 Crear la tabla de control

_Data tables → Create_ con el nombre **`accesopro_piezas`** y estas columnas:
`piece_id, run_id, kind, title, status, review_verdict, review_reason` (texto), `attempts` (número), `cost_llm_usd, cost_voice_usd, cost_stt_usd, cost_total_usd` (número), `youtube_url, source_ref, script_text, error` (texto). Después selecciónala en los nodos “Tabla · …”.

### 2.4 Credenciales (tus propias claves)

| Credencial en n8n                         | Para qué                                                 |
| ----------------------------------------- | -------------------------------------------------------- |
| **Anthropic**                             | Escribir guiones, dividir ideas, elegir clips, metadatos |
| **OpenAI**                                | Agente revisor (GPT) y transcripción Whisper             |
| **Header Auth** con cabecera `xi-api-key` | ElevenLabs (voz clonada)                                 |
| **YouTube OAuth2**                        | Subir los vídeos como _no listados_ a tu canal de prueba |

### 2.5 Tu voz

1. En ElevenLabs crea un **clon de voz instantáneo** (_Voices → Add voice → Instant Voice Clone_) con 1-2 minutos de tu audio.
2. Copia el **Voice ID**.
3. Abre el nodo **Configuración** del workflow principal y pega el ID en `voice_id`.

### 2.6 Lanzar

1. En **Configuración** deja `publish_enabled: false` para una primera prueba (monta los vídeos pero no publica). Cuando todo esté bien, pon `true`.
2. Pulsa **Execute workflow** en el workflow principal.
3. Mira el resultado en la tabla `accesopro_piezas` y los vídeos en `data/video/` y las miniaturas en `data/thumbs/`.

---

## 3. Cómo funciona (resumen)

```
Disparador único
  ├─ Texto: temario TXT + podcast JSON + PDF oficial
  │     └─ Claude divide el tema en 4 ideas
  └─ Clase: yt-dlp → audio en trozos → Whisper (palabras con tiempos)
        └─ Claude elige 5-8 momentos (explicación completa / truco / error típico)
              └─ se ajustan a límites de frase y se validan (duración, solapes)

Por cada pieza (workflow “Producir pieza”):
  guion (Claude) ─► Agente revisor (GPT + temario oficial) ─► ¿aprobado?
        │ no, y es guion: Claude corrige con el informe ─► segunda revisión
        │ sigue rechazado: se descarta y se guarda el motivo
        └ sí: metadatos (título, descripción, etiquetas, texto de miniatura)
              ─► voz ElevenLabs con marcas de tiempo (solo guiones)
              ─► FFmpeg: 9:16 y 16:9, subtítulos quemados palabra a palabra, logo, miniatura
              ─► YouTube (no listado) ─► tabla de control
```

**Estados de la tabla:** `generada` → `revisada` (aprobada y montada) → `publicada`; o `rechazada` (con motivo) o `error`.

**Coste real por pieza:** se calcula con los tokens reales devueltos por las APIs (Claude, GPT, Whisper) y los caracteres enviados a ElevenLabs. Los precios están en el nodo _Configuración_ (`price_*`) y se pueden actualizar.

---

## 4. Decisiones y por qué

- **n8n como orquestador, FFmpeg/yt-dlp como herramientas de medios.** n8n da visibilidad (cada paso es un nodo), reintentos y credenciales; el montaje pesado queda en scripts reproducibles.
- **Escritor y revisor son modelos distintos (Claude vs GPT).** Un revisor del mismo modelo tiende a validar sus propios errores.
- **El revisor recibe el temario oficial y recalcula cada operación.** Devuelve un veredicto estructurado (errores con cita literal, cálculos verificados, datos no respaldados). Solo se aprueba si no hay ningún problema.
- **Corrección acotada.** Un guion rechazado se corrige una vez con el informe del revisor; si sigue mal, se descarta. Los clips no se “corrigen” (no se puede cambiar lo que dijo la profesora): se descartan.
- **Subtítulos con tiempos reales.** Guiones: ElevenLabs `with-timestamps`. Clips: Whisper con marcas por palabra. Se queman con subtítulos ASS resaltando la palabra actual.
- **Clips elegidos con criterio pedagógico,** no por tiempo: el modelo ve la transcripción con tiempos, y el código ajusta inicio/fin a límites de frase y descarta solapes y duraciones fuera de rango.
- **Idempotencia.** Cada pieza tiene un identificador estable (`T1S01-idea-1`, `CLASE-01`…) y la tabla se escribe con _upsert_: relanzar el proceso no duplica filas ni vuelve a publicar piezas ya `publicada`.
- **Límites.** Presupuesto diario (`daily_budget_usd`), tope de subidas diarias (`max_uploads_per_day`, por la cuota de YouTube) y máximo de piezas por ejecución.

## 5. Lo que dejé fuera (y por qué)

- **Avatar (HeyGen):** el reto evalúa la clonación de voz, no la cara; añade coste y tiempo de generación.
- **Aprobación humana, variantes A/B, cola de trabajos (Nivel 2) y bucle de analítica / adaptación por comunidad (Nivel 3):** prioricé un Nivel 1 sólido y bien explicado. En el documento de arquitectura explico cómo los añadiría.
- **Caché de la transcripción:** la clase se transcribe en cada ejecución (≈ 0,35 € por clase de 1 h); el vídeo y el audio sí se reutilizan si ya existen.

## 6. Avisos importantes

- **Cuota de YouTube Data API:** cada subida cuesta 1 600 unidades de las 10 000 diarias → unas **6 subidas al día**. Por eso se publica un formato por pieza (guiones en 9:16, clips en 16:9; configurable) aunque se monten los dos.
- **Proyectos de Google sin verificar** pueden forzar los vídeos subidos a _privado_. Si pasa, verifica el proyecto o cambia la visibilidad desde YouTube Studio.
- **Miniaturas personalizadas** requieren un canal verificado por teléfono; si no, el sistema continúa y lo anota.
- **Confidencialidad:** el material es de Grupo Mentor; mantén los vídeos como _no listados_ y elimina el material y los vídeos generados 15 días después de la entrega.
