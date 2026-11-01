# AccesoPro · Motor de contenido en vídeo

Sistema en **n8n** que produce, revisa y publica vídeo educativo de Matemáticas (acceso a Grado Superior, Comunitat Valenciana) a partir de dos fuentes, con un **único disparador**:

1. **El texto del tema** (T1_S01, Números reales) → ideas → guiones de 30-60 s → voz clonada → vídeo.
2. **Una clase grabada en directo** → transcripción → momentos con valor propio → clips.

Entre generar y publicar hay un **agente revisor**: un modelo distinto del que escribe comprueba cada guion y cada clip contra el temario oficial y rechaza los que tengan errores. Todo queda en una **tabla de control** con estado, coste real y enlace.

## Cómo se usa (sin conocimientos técnicos)

1. Abre el formulario: **<http://localhost:5679/form/d55cd4a1-b370-4222-a5ec-2898fdb2d1aa>** (con el sistema arrancado).
2. Pega el enlace de la clase de YouTube, elige comunidad, prueba y asignatura, y decide si se publica.
3. Pulsa enviar. En 10-20 minutos los resultados aparecen en la tabla `accesopro_piezas` (n8n → _Data tables_).

El sistema **deduce solo el tema de la clase** (por ejemplo T1_S01) leyendo la transcripción y el temario, y busca los temarios de esa comunidad y prueba en `data/temarios/`. Si no está seguro del tema, no produce nada y lo anota en la tabla.

Para añadir otra comunidad, prueba o asignatura solo hay que dejar sus ficheros en `data/temarios/<comunidad>/<prueba>/<asignatura>/` (ver más abajo) y añadir esa opción en el desplegable del formulario.

## Resultado de la prueba

|                                            |                                                                                         |
| ------------------------------------------ | --------------------------------------------------------------------------------------- |
| Guiones publicados (no listados)           | 5                                                                                       |
| Clips de la clase publicados (no listados) | 3                                                                                       |
| Clips rechazados por el revisor            | 19 de 22 candidatos (motivo registrado)                                                 |
| Coste registrado en la tabla               | 4,51 $ (el gasto total de pruebas fue algo mayor; todo muy por debajo del tope de 30 €) |

Enlaces, estados y costes por pieza: [data/tabla_de_control.csv](data/tabla_de_control.csv) (o la tabla `accesopro_piezas` en n8n).
Ejemplos del revisor: [docs/ejemplos_revisor.md](docs/ejemplos_revisor.md). Arquitectura y escalado: [docs/arquitectura.md](docs/arquitectura.md).

| Pieza        | Tipo         | Enlace                                      |
| ------------ | ------------ | ------------------------------------------- |
| T1S01-idea-1 | guion (9:16) | https://www.youtube.com/watch?v=dOJ5dtxsoPw |
| T1S01-idea-2 | guion (9:16) | https://www.youtube.com/watch?v=j1rmCSn32hQ |
| T1S01-idea-3 | guion (9:16) | https://www.youtube.com/watch?v=VUvULnrsEEg |
| T1S01-idea-4 | guion (9:16) | https://www.youtube.com/watch?v=nVM8rfrLjjU |
| T1S01-idea-5 | guion (9:16) | https://www.youtube.com/watch?v=jKKNUdkoJXI |
| CLASE-01     | clip (16:9)  | https://www.youtube.com/watch?v=OR3HEclKZOo |
| CLASE-02     | clip (16:9)  | https://www.youtube.com/watch?v=iK8uBmPTBck |
| CLASE-2458   | clip (16:9)  | https://www.youtube.com/watch?v=dzbI6xNbbuc |

## Qué hay en el repositorio

| Ruta                               | Qué es                                                                                                                                                               |
| ---------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `docker-compose.yml`, `Dockerfile` | n8n local con FFmpeg y yt-dlp instalados                                                                                                                             |
| `workflows/1_agente_revisor.json`  | Sub-workflow: revisa una pieza contra el temario oficial                                                                                                             |
| `workflows/2_producir_pieza.json`  | Sub-workflow: una pieza de principio a fin                                                                                                                           |
| `workflows/3_motor_video.json`     | **El que se usa**: formulario → detecta el tema → ideas y clips → procesa todo (también `3b_motor_video_manual_v1.json`, versión anterior con botón y ajustes fijos) |
| `data/temarios/`                   | Biblioteca de temarios por comunidad, prueba y asignatura (ver más abajo)                                                                                            |
| `data/scripts/`                    | `render.js` (montaje, subtítulos, miniatura), `download.sh` (yt-dlp), `prepare_audio.sh` (audio para Whisper)                                                        |
| `docs/`                            | Arquitectura (≤2 páginas) y ejemplos del revisor                                                                                                                     |

El material de Grupo Mentor (temario, podcast, PDF oficial, clase, brand book) **no se incluye**: va en `data/in/`, `data/temarios/` y `data/brand/`, excluidos por `.gitignore`.

## Puesta en marcha

### 1. Arrancar n8n

1. Instala Docker Desktop.
2. En esta carpeta: `docker compose up -d --build`
3. Abre <http://localhost:5679> y crea tu usuario.

### 2. Material de entrada (biblioteca de temarios)

Por cada comunidad, prueba y asignatura, deja los ficheros en `data/temarios/<comunidad>/<prueba>/<asignatura>/`:

```
temario_accesopro.txt          ← temario de AccesoPro (con códigos T1·S01, …)
oficial/temario_oficial.pdf    ← temario oficial (lo usa el revisor)
podcast/T1_S01_podcast.json    ← opcional: material de apoyo por tema
```

Ejemplo ya incluido: `data/temarios/comunidad-valenciana/grado-superior/matematicas/`. En `data/brand/` deja `logo.png` y la carpeta `fonts/` (Inter). La clase se descarga sola con yt-dlp.

### 3. Importar los workflows

_Workflows → Import from file_, en este orden: `1_agente_revisor.json`, `2_producir_pieza.json`, `3_motor_video.json`.

- En `2_producir_pieza`, abre los nodos "Agente revisor · revisión 1/2" y vuelve a seleccionar el workflow _Agente revisor_.
- En `3_motor_video`, abre "Producir pieza (sub-workflow)" y selecciona _Producir pieza_.
- **Publica** (_Publish_) los tres workflows: el 1 y el 2 porque n8n no deja llamar a sub-workflows sin publicar, y el 3 para que el formulario tenga su dirección pública.

### 4. Tabla de control

_Data tables → Create_ con nombre `accesopro_piezas` y columnas: `piece_id, run_id, kind, title, status, review_verdict, review_reason, youtube_url, source_ref, script_text, error` (texto) y `attempts, cost_llm_usd, cost_voice_usd, cost_stt_usd, cost_total_usd` (número). Selecciónala en los nodos "Tabla · …".

### 5. Credenciales (tus propias claves)

| Credencial                 | Para qué                                     |
| -------------------------- | -------------------------------------------- |
| Anthropic                  | Guiones, ideas, elección de clips, metadatos |
| OpenAI                     | Agente revisor (GPT) y transcripción Whisper |
| Header Auth (`xi-api-key`) | ElevenLabs (voz clonada)                     |
| YouTube OAuth2             | Subir como _no listado_ a tu canal de prueba |

Para YouTube: el canal debe estar **verificado por teléfono** (si no, las miniaturas personalizadas dan "Forbidden") y tu cuenta añadida como usuario de prueba en la pantalla de consentimiento de Google.

### 6. Tu voz

Crea un _Instant Voice Clone_ en ElevenLabs (plan de pago) con 1-2 minutos de tu voz y pega su **Voice ID** en el nodo **Configuración** (`voice_id`).

### 7. Lanzar

Abre el formulario del workflow `3_motor_video` (en el nodo _Formulario: nueva clase_ aparece su dirección de producción), rellénalo y envíalo. Para probar sin subir nada a YouTube, elige "No, solo montar los vídeos". Los ajustes avanzados (modelos, precios, límites) están en el nodo **Configuración**; ahí también va tu `voice_id`.

## Cómo funciona

```
Disparador único (formulario)
  Transcripción de la clase (yt-dlp → Whisper) → Claude deduce el tema del temario
  ├─ Texto: temario del tema (+ apoyo opcional) → Claude divide el tema en ideas (4 por defecto)
  └─ Clase: Claude elige 5-8 momentos → se ajustan a frases completas y a la duración

Por cada pieza:
  guion (Claude) → revisor (GPT + temario oficial) → ¿aprobado?
     no, y es guion: Claude corrige con el informe → 2.ª revisión → si falla, se descarta
     sí: metadatos → voz ElevenLabs (guiones) → FFmpeg 9:16 y 16:9 + miniatura
         → YouTube (no listado) → tabla de control
```

Estados: `generada` → `revisada` → `publicada`; o `rechazada` (con motivo) o `error`.

## Decisiones y por qué

- **n8n orquesta; FFmpeg/yt-dlp hacen el montaje.** Cada paso es un nodo visible, con reintentos y credenciales. El montaje con subtítulos palabra a palabra es un script (`render.js`) porque es más legible y fácil de probar que comandos largos dentro de nodos.
- **Escritor y revisor son modelos distintos** (Claude y GPT) para que el revisor no valide sus propios errores.
- **El revisor recalcula cada operación.** El PDF oficial solo lista saberes básicos (6.700 caracteres, sin fórmulas ni ejemplos), así que comprueba que la pieza está dentro del temario y verifica la matemática por su cuenta. Devuelve un veredicto estructurado (errores con cita literal, cálculos verificados, datos no respaldados) y, en clips, si se entienden sin el resto de la clase.
- **Los clips no se corrigen, se descartan:** no se puede cambiar lo que dijo la profesora. Por eso la mayoría de los candidatos (19 de 22) se rechazaron: la clase contiene errores reales (por ejemplo "el valor absoluto siempre es positivo").
- **Clips elegidos por criterio pedagógico,** no por tiempo: Claude ve la transcripción y el código ajusta inicio y fin a límites de frase, recorta a la duración máxima y evita solapes.
- **Idempotencia:** cada pieza tiene un identificador estable (los guiones, por tema e idea, p. ej. `T1S01-idea-1`; los clips, por clase y minuto de inicio, p. ej. `CLfQBP-0303`; los tres clips publicados en la primera tanda conservan sus identificadores antiguos `CLASE-01`, `CLASE-02` y `CLASE-2458`) y la tabla se escribe con _upsert_; no se vuelve a producir ni publicar lo ya publicado, ni se repiten fragmentos ya rechazados.
- **Límites:** presupuesto diario, tope de subidas diarias (cuota de YouTube) y piezas por ejecución. Si una pieza falla, las demás continúan y el error queda en la tabla.
- **Duración de guiones:** se piden 85-115 palabras y, si la voz pasa de 60 s, `render.js` la acelera lo justo y reajusta los subtítulos.
- **Imagen de marca:** tipografía Inter y colores del brand book (azul `#111E32`, verde `#59C267`).

## Lo que dejé fuera (y por qué)

- **Avatar (HeyGen):** el reto evalúa la clonación de voz, no la cara.
- **Aprobación humana, variantes A/B y cola de trabajos (Nivel 2); bucle de analítica y adaptación por comunidad (Nivel 3):** prioricé un Nivel 1 sólido. El documento de arquitectura explica cómo se añadirían.
- **Caché de la transcripción:** la clase se transcribe en cada ejecución (≈ 0,35 $).
- **Acumulado de costes de pruebas:** la tabla acumula desde que se añadió esa lógica; el gasto de las primeras pruebas no está sumado.

## Avisos

- **Limitaciones conocidas:** el formulario no comprueba que existan los temarios de la combinación elegida (si faltan, el workflow falla de forma visible); cada desplegable tiene hoy una sola opción y añadir otra requiere editar el formulario; la importación en una instancia limpia no se ha probado; y la detección automática del tema solo se ha probado con la clase de ejemplo.
- **Cuota de YouTube:** cada subida consume cuota; de ahí el tope diario configurable.
- **Cada ejecución regenera ideas y candidatos con Claude,** así que el contenido puede variar entre ejecuciones; lo ya publicado se respeta.
- **Confidencialidad:** el material es de Grupo Mentor. Mantén los vídeos como _no listados_ y **elimina el material y los vídeos generados en los 15 días posteriores a la entrega**.
