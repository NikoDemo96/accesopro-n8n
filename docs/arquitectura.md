# Arquitectura y escalado a 1.000 vídeos al mes

## Cómo está construido hoy

```
Disparador único (n8n)
 ├─ Rama texto:  temario + podcast + PDF oficial ─► Claude: ideas ─► piezas "guion"
 └─ Rama clase:  yt-dlp ─► FFmpeg (audio) ─► Whisper ─► Claude: momentos ─► piezas "clip"
                      │
        tabla de control (estado, costes) ─► filtro: sin duplicados, presupuesto, cuota
                      │
   Producir pieza (una por vez): [Claude guion] ─► Agente revisor (GPT) ─► corrección (1 vez)
        ─► metadatos ─► [ElevenLabs voz] ─► FFmpeg 9:16 y 16:9 + miniatura ─► YouTube ─► tabla
```

Tres workflows de n8n (principal, producción de pieza, revisor), tres scripts de medios y una _data table_ como estado. Un fallo en una pieza no detiene el resto y queda registrado.

## Coste por vídeo (medido)

| Concepto                          | Guion             | Clip                  |
| --------------------------------- | ----------------- | --------------------- |
| Claude (escribir, metadatos)      | 0,04-0,06 $       | 0,02-0,03 $           |
| GPT (revisión, hasta 2 pasadas)   | 0,01-0,03 $       | 0,01-0,02 $           |
| ElevenLabs (≈ 800 caracteres)     | ≈ 0,15 $          | —                     |
| Whisper (reparto de 1 h de clase) | —                 | ≈ 0,06 $ (0,35 $ / 6) |
| **Total por pieza producida**     | **≈ 0,18-0,24 $** | **≈ 0,08-0,10 $**     |

Con las tasas de la prueba (4 de 4 guiones aprobados; 3 de 12 clips), el coste efectivo por **clip publicado** es unas 4 veces el unitario (≈ 0,35 $), porque el rechazo también cuesta. Estimación para 1.000 vídeos al mes (mitad guiones, mitad clips): **≈ 150-250 $ al mes**, dominado por ElevenLabs y por los candidatos de clip rechazados. YouTube no cobra por subir.

## Cuellos de botella previstos

1. **Cuota de la API de YouTube.** Subir consume cuota y hay un tope diario; hoy limita a unas decenas de subidas al día. Para ≈ 33 vídeos al día hay que solicitar ampliación de cuota (auditoría de la API) y verificar el proyecto de Google (si no, YouTube puede forzar los vídeos a privados).
2. **Ejecución secuencial.** Hoy una pieza tarda 1-2 min y se procesan una a una. A 1.000 al mes cabe, pero conviene n8n en **modo cola** (Redis + varios workers) para paralelizar renderizado y llamadas a APIs.
3. **FFmpeg.** Es CPU: un worker dedicado o un servicio de renderizado en contenedores. El audio y el vídeo de origen se reutilizan.
4. **Estado.** La _data table_ sirve para esta escala; con cola y varios workers pasaría a PostgreSQL con restricción única por `piece_id` (idempotencia real) y un registro de coste acumulado por llamada.
5. **Concurrencia y límites de ElevenLabs y de los LLM.** Reintentos con espera exponencial y un presupuesto diario por proveedor (ya existe un tope diario global).
6. **Transcripción.** Whisper API es barata, pero con muchas clases conviene transcribir una vez y guardar el resultado en caché.

## Calidad: lo que el sistema comprueba y lo que no

- Comprueba: que el contenido esté dentro de los saberes básicos del temario oficial, que las cuentas estén bien y que los clips se entiendan solos.
- **Límite importante:** el PDF oficial solo lista temas, no fórmulas ni ejemplos. La corrección matemática depende del conocimiento del modelo revisor. Para 6 pruebas × 17 comunidades hay que alimentar al revisor con **fuentes de contenido validadas** (libros de texto, banco de ejercicios resuelto, el temario propio de AccesoPro) mediante recuperación de fragmentos, y registrar la cita.
- El revisor no es determinista: el mismo clip puede recibir veredictos distintos entre ejecuciones. Se mitiga con criterios estrictos y estructurados, y se vigila con muestreo humano.

## Qué dejaría a revisión humana

- **Todo clip cuya revisión falle por errores de la profesora**, para que la academia lo sepa (es un aviso de calidad de la clase, no solo un descarte).
- **Muestreo del 10 % de lo aprobado** y revisión completa de los 20-30 primeros vídeos de cada tema, comunidad o prueba nueva.
- **Cualquier pieza con datos legales o normativos** (plazos, requisitos de acceso), que el modelo no puede garantizar.
- **Aprobación previa a la publicación en abierto** (hoy todo es _no listado_): un enlace de aprobar o rechazar por pieza, activable y desactivable.

## Siguientes pasos para escalar

Cola con workers → PostgreSQL con idempotencia por clave → caché de transcripciones → revisor con recuperación de fragmentos validados → variantes A/B de gancho y bucle de aprendizaje con YouTube Analytics → adaptación por comunidad reutilizando lo común del temario.
