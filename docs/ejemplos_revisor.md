# Ejemplos del agente revisor

El revisor (GPT, `gpt-5-mini`) recibe cada pieza junto al temario oficial de la Generalitat Valenciana y al temario de AccesoPro, recalcula las operaciones y devuelve un veredicto estructurado. Estos son ejemplos reales de la tabla de control (`accesopro_piezas`). En total se rechazaron 9 de 12 clips candidatos.

## 1. `CLASE-03` · rechazado por error matemático (clase 15:40-17:05)

**Qué dice la profesora:** al pasar 2,1666… (periodo mixto) a fracción: "número entero 216 menos lo que hay antes del periodo, perdón, del periodo que sería el 2".

**Veredicto del revisor:** rechazado.

- **Error:** se indica restar «2», pero en un decimal periódico mixto hay que restar la parte no periódica completa (entera + anteperiodo), que aquí es **21**.
- **Corrección calculada por el revisor:** numerador 216 − 21 = 195; denominador 90; fracción 195/90 = **13/6**.
- **Además:** el clip depende de la pizarra («el caso de debajo») y no se entiende solo.

## 2. `CLASE-04` · rechazado por afirmaciones incorrectas (clase 31:32-33:17)

**Errores citados:**

- «El valor absoluto siempre va a ser positivo» → falso para el 0: |0| = 0 es no negativo, no positivo.
- «El valor absoluto de 3 son dos números, el negativo y el positivo» → |3| = 3 es un solo valor; lo que tiene dos soluciones es la ecuación |x| = 3.
- «√2 − 2 da −0,5857» → inexactitud numérica: el valor es −0,58578…, que redondea a −0,5858.
- Fragmento cortado: la expresión |−3·(4−6)| queda sin evaluar.

## 3. `CLASE-1237` · rechazado porque no se entiende sin el resto de la clase (12:37-14:19)

El contenido matemático es **correcto** (decimales exactos y periódicos, pertenencia a los racionales), pero el revisor lo rechaza por el criterio de autonomía: «empieza con "Vamos a recordar…" y "Recordábamos…", retoma contenido anterior, y termina planteando "¿Cómo puedo pasarme…?" sin mostrar el procedimiento ni la conclusión».

## 4. `CLASE-06` · rechazado por enunciar una regla incorrecta (42:45-43:52)

La profesora dice «el paréntesis es que está incluido» (en intervalos, el paréntesis significa que **no** está incluido) y lo corrige en el mismo turno. El revisor rechaza igualmente: no se publica material que haya enunciado mal una regla del temario.

## Guiones corregidos tras un rechazo

Los guiones rechazados en la primera revisión se corrigen una vez con el informe del revisor y vuelven a revisarse (campo `attempts` de la tabla). Si siguen rechazados se descartan, con su motivo.
