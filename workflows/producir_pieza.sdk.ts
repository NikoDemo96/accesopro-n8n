import { workflow, node, trigger, ifElse, newCredential, expr } from '@n8n/workflow-sdk';

const tableRef = { __rl: true, mode: 'id', value: 'pDESRFfLEkDjWfOE' };
const colSchema = [
  { id: 'piece_id', displayName: 'piece_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'run_id', displayName: 'run_id', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'kind', displayName: 'kind', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'title', displayName: 'title', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'status', displayName: 'status', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'review_verdict', displayName: 'review_verdict', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'review_reason', displayName: 'review_reason', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'attempts', displayName: 'attempts', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
  { id: 'cost_llm_usd', displayName: 'cost_llm_usd', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
  { id: 'cost_voice_usd', displayName: 'cost_voice_usd', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
  { id: 'cost_stt_usd', displayName: 'cost_stt_usd', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
  { id: 'cost_total_usd', displayName: 'cost_total_usd', required: false, defaultMatch: false, display: true, type: 'number', canBeUsedToMatch: true },
  { id: 'youtube_url', displayName: 'youtube_url', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'source_ref', displayName: 'source_ref', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'script_text', displayName: 'script_text', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true },
  { id: 'error', displayName: 'error', required: false, defaultMatch: false, display: true, type: 'string', canBeUsedToMatch: true }
];

const sample = {
  piece_id: 'T1S01-idea-1',
  run_id: 'RUN_20261031',
  kind: 'script',
  title: 'El error que más puntos cuesta con fracciones',
  source_ref: 'T1_S01 idea 1',
  text: 'Texto del guion',
  attempts: 0,
  approved: true,
  review_reason: 'Aprobado',
  costs: { llm: 0.01, voice: 0.02, stt: 0 },
  script: { gancho: 'g', explicacion: 'e', cierre: 'c' },
  yt: { titulo: 'Título', descripcion: 'Descripción', etiquetas: ['a', 'b'], texto_miniatura: 'ERROR TÍPICO' },
  cfg: { publish_enabled: true, max_corrections: 1 },
  publish_video_path: '/data/video/T1S01-idea-1_9x16.mp4',
  thumb_path: '/data/thumbs/T1S01-idea-1.jpg',
  final: { piece_id: 'T1S01-idea-1', run_id: 'RUN', kind: 'script', title: 'T', status: 'publicada', review_verdict: 'aprobada', review_reason: 'Aprobado', attempts: 0, cost_llm_usd: 0.01, cost_voice_usd: 0.02, cost_stt_usd: 0, cost_total_usd: 0.03, youtube_url: 'https://youtu.be/x', source_ref: 'ref', script_text: 'txt', error: '' }
};

const receivePiece = trigger({
  type: 'n8n-nodes-base.executeWorkflowTrigger',
  version: 1.2,
  config: { name: 'Recibe pieza', parameters: { inputSource: 'passthrough' }, position: [0, 400] },
  output: [sample]
});

const isScript = ifElse({
  version: 2.3,
  config: {
    name: '¿Es guion de texto?',
    position: [220, 400],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'script' }],
        combinator: 'and'
      }
    }
  }
});

const promptScript = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prompt guion',
    position: [460, 240],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = $json;
const NL = String.fromCharCode(10);
const idea = s.idea;
const system = 'Eres guionista de microvídeos educativos de AccesoPro, que prepara a personas adultas para las pruebas de acceso a Grado Superior (Matemáticas, Comunidad Valenciana). Escribes en español de España, con tono cercano, claro y motivador, tuteando al alumno. REGLAS: 1) Usa SOLO contenido y cifras que aparezcan en el temario o en el guion de podcast que te doy como fuente; no inventes datos, normas, estadísticas ni ejemplos que no puedas comprobar. 2) Cada operación matemática que escribas debe ser correcta: calcúlala paso a paso antes de escribirla y usa ejemplos sencillos. 3) El texto se leerá en voz alta: escribe todo como se pronuncia (por ejemplo "cinco sextos", "dos elevado a menos tres", "equis"), sin símbolos matemáticos, sin markdown y sin emojis. 4) Estructura: GANCHO (1-2 frases, máximo 8 segundos, abre con un error típico, una pregunta o una promesa concreta), EXPLICACIÓN (clara y ordenada, con un ejemplo numérico), CIERRE (1-2 frases con llamada a la acción: practica este tema con los cursos de AccesoPro y sigue el canal). 5) Duración total de 30 a 60 segundos al ritmo de lectura: entre 85 y 140 palabras en total.';
const user = 'TEMARIO ACCESOPRO DEL TEMA:' + NL + s.ctx.temario + NL + NL + 'FUENTE ELABORADA (guion de podcast del mismo tema):' + NL + s.ctx.podcast + NL + NL + 'IDEA A DESARROLLAR: ' + idea.titulo + NL + 'Puntos clave: ' + (idea.puntos_clave || []).join('; ') + NL + 'Error típico a destacar: ' + (idea.error_tipico || 'ninguno') + NL + NL + 'Entrega el guion con la herramienta.';
const tool = {
  name: 'entregar_guion',
  description: 'Entrega el guion final del vídeo dividido en gancho, explicación y cierre',
  input_schema: {
    type: 'object',
    properties: {
      gancho: { type: 'string', description: 'Gancho inicial, 1-2 frases' },
      explicacion: { type: 'string', description: 'Explicación con ejemplo numérico correcto' },
      cierre: { type: 'string', description: 'Cierre con llamada a la acción' }
    },
    required: ['gancho', 'explicacion', 'cierre']
  }
};
const req = { model: s.cfg.writer_model, max_tokens: 1500, temperature: 0.4, system: system, messages: [{ role: 'user', content: user }], tools: [tool], tool_choice: { type: 'tool', name: 'entregar_guion' } };
return { json: Object.assign({}, s, { req: req, costs: s.costs || { llm: 0, voice: 0, stt: 0 }, attempts: s.attempts || 0 }) };`
    }
  },
  output: [sample]
});

const claudeScript = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Claude · Escribir guion',
    position: [700, 240],
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    parameters: {
      method: 'POST',
      url: 'https://api.anthropic.com/v1/messages',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'anthropicApi',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'anthropic-version', value: '2023-06-01' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ $json.req }}'),
      options: { timeout: 180000 }
    },
    credentials: { anthropicApi: { id: 'olVcoY7AU7oJpytv', name: 'Anthropic account - accesopro-n8n' } }
  },
  output: [{ content: [{ type: 'tool_use', input: { gancho: 'g', explicacion: 'e', cierre: 'c' } }], usage: { input_tokens: 100, output_tokens: 100 } }]
});

const parseScript = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Interpretar guion',
    position: [940, 240],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = $('Prompt guion').item.json;
const r = $json;
const block = (r.content || []).find((b) => b.type === 'tool_use');
if (!block) throw new Error('Claude no devolvió el guion');
const g = block.input;
const u = r.usage || {};
const cost = ((u.input_tokens || 0) * s.cfg.price_writer_in + (u.output_tokens || 0) * s.cfg.price_writer_out) / 1000000;
const out = Object.assign({}, s);
delete out.req;
out.script = { gancho: g.gancho, explicacion: g.explicacion, cierre: g.cierre };
out.text = [g.gancho, g.explicacion, g.cierre].join(' ');
out.word_count = out.text.split(' ').length;
out.costs = { llm: (s.costs.llm || 0) + cost, voice: s.costs.voice || 0, stt: s.costs.stt || 0 };
return { json: out };`
    }
  },
  output: [sample]
});

const pieceReady = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pieza generada',
    position: [1180, 400],
    parameters: { mode: 'runOnceForEachItem', language: 'javaScript', jsCode: `return { json: $json };` }
  },
  output: [sample]
});

const tableGenerated = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Tabla · estado generada',
    position: [1400, 400],
    parameters: {
      resource: 'row',
      operation: 'upsert',
      dataTableId: tableRef,
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'piece_id', condition: 'eq', keyValue: expr('{{ $json.piece_id }}') }] },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          piece_id: expr('{{ $json.piece_id }}'),
          run_id: expr('{{ $json.run_id }}'),
          kind: expr('{{ $json.kind }}'),
          title: expr('{{ $json.title }}'),
          status: 'generada',
          source_ref: expr('{{ $json.source_ref }}'),
          script_text: expr('{{ $json.text }}'),
          cost_llm_usd: expr('{{ $json.costs.llm }}')
        },
        matchingColumns: ['piece_id'],
        schema: colSchema
      }
    }
  },
  output: [{ id: 1 }]
});

const restoreGenerated = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Restaurar estado tras tabla',
    position: [1620, 400],
    parameters: { mode: 'runOnceForEachItem', language: 'javaScript', jsCode: `return { json: $('Pieza generada').item.json };` }
  },
  output: [sample]
});

const review1 = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Agente revisor · revisión 1',
    position: [1840, 400],
    parameters: {
      mode: 'each',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'P6n0FqYmoOM6j6E2' },
      options: { waitForSubWorkflow: true }
    }
  },
  output: [sample]
});

const approved1 = ifElse({
  version: 2.3,
  config: {
    name: '¿Aprobado en revisión 1?',
    position: [2060, 400],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.approved }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    }
  }
});

const canFix = ifElse({
  version: 2.3,
  config: {
    name: '¿Se puede corregir?',
    position: [2300, 560],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr("{{ $json.kind === 'script' && ($json.attempts || 0) < $json.cfg.max_corrections }}"), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    }
  }
});

const promptFix = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prompt corrección',
    position: [2540, 480],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = $json;
const NL = String.fromCharCode(10);
const system = 'Eres guionista de microvídeos educativos de AccesoPro (preparación de pruebas de acceso para adultos, Matemáticas de Grado Superior, Comunidad Valenciana). Un agente revisor ha RECHAZADO tu guion. Corrige exactamente los problemas señalados: recalcula cada operación, elimina o sustituye cualquier dato no respaldado por el temario, y mantén gancho, explicación y cierre, el tono cercano, el texto pronunciable (sin símbolos matemáticos) y una duración de 85 a 140 palabras. No añadas contenido nuevo que no puedas respaldar.';
const user = 'TEMARIO OFICIAL:' + NL + s.ctx.official + NL + NL + 'TEMARIO ACCESOPRO DEL TEMA:' + NL + s.ctx.temario + NL + NL + 'GUION RECHAZADO:' + NL + 'GANCHO: ' + s.script.gancho + NL + 'EXPLICACIÓN: ' + s.script.explicacion + NL + 'CIERRE: ' + s.script.cierre + NL + NL + 'INFORME DEL REVISOR:' + NL + s.review_reason + NL + NL + 'Entrega el guion corregido con la herramienta.';
const tool = {
  name: 'entregar_guion',
  description: 'Entrega el guion corregido dividido en gancho, explicación y cierre',
  input_schema: {
    type: 'object',
    properties: { gancho: { type: 'string' }, explicacion: { type: 'string' }, cierre: { type: 'string' } },
    required: ['gancho', 'explicacion', 'cierre']
  }
};
const req = { model: s.cfg.writer_model, max_tokens: 1500, temperature: 0.2, system: system, messages: [{ role: 'user', content: user }], tools: [tool], tool_choice: { type: 'tool', name: 'entregar_guion' } };
return { json: Object.assign({}, s, { req: req, attempts: (s.attempts || 0) + 1, script_rechazado: s.script }) };`
    }
  },
  output: [sample]
});

const claudeFix = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Claude · Corregir guion',
    position: [2780, 480],
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    parameters: {
      method: 'POST',
      url: 'https://api.anthropic.com/v1/messages',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'anthropicApi',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'anthropic-version', value: '2023-06-01' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ $json.req }}'),
      options: { timeout: 180000 }
    },
    credentials: { anthropicApi: { id: 'olVcoY7AU7oJpytv', name: 'Anthropic account - accesopro-n8n' } }
  },
  output: [{ content: [{ type: 'tool_use', input: { gancho: 'g', explicacion: 'e', cierre: 'c' } }], usage: { input_tokens: 100, output_tokens: 100 } }]
});

const parseFix = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Interpretar corrección',
    position: [3020, 480],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = $('Prompt corrección').item.json;
const r = $json;
const block = (r.content || []).find((b) => b.type === 'tool_use');
if (!block) throw new Error('Claude no devolvió el guion corregido');
const g = block.input;
const u = r.usage || {};
const cost = ((u.input_tokens || 0) * s.cfg.price_writer_in + (u.output_tokens || 0) * s.cfg.price_writer_out) / 1000000;
const out = Object.assign({}, s);
delete out.req;
out.script = { gancho: g.gancho, explicacion: g.explicacion, cierre: g.cierre };
out.text = [g.gancho, g.explicacion, g.cierre].join(' ');
out.word_count = out.text.split(' ').length;
out.costs = { llm: (s.costs.llm || 0) + cost, voice: s.costs.voice || 0, stt: s.costs.stt || 0 };
return { json: out };`
    }
  },
  output: [sample]
});

const review2 = node({
  type: 'n8n-nodes-base.executeWorkflow',
  version: 1.3,
  config: {
    name: 'Agente revisor · revisión 2',
    position: [3260, 480],
    parameters: {
      mode: 'each',
      source: 'database',
      workflowId: { __rl: true, mode: 'id', value: 'P6n0FqYmoOM6j6E2' },
      options: { waitForSubWorkflow: true }
    }
  },
  output: [sample]
});

const approved2 = ifElse({
  version: 2.3,
  config: {
    name: '¿Aprobado en revisión 2?',
    position: [3500, 480],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.approved }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    }
  }
});

const rejectedResult = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resultado · rechazada',
    position: [3740, 700],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = $json;
const c = s.costs || { llm: 0, voice: 0, stt: 0 };
const final = {
  piece_id: s.piece_id, run_id: s.run_id, kind: s.kind, title: s.title, status: 'rechazada', review_verdict: 'rechazada',
  review_reason: s.review_reason, attempts: s.attempts || 0, cost_llm_usd: c.llm, cost_voice_usd: c.voice, cost_stt_usd: c.stt,
  cost_total_usd: c.llm + c.voice + c.stt, youtube_url: '', source_ref: s.source_ref, script_text: s.text, error: ''
};
return { json: Object.assign({}, s, { final: final }) };`
    }
  },
  output: [sample]
});

const approvedPiece = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Pieza aprobada',
    position: [3740, 280],
    parameters: { mode: 'runOnceForEachItem', language: 'javaScript', jsCode: `return { json: Object.assign({}, $json, { review_verdict: 'aprobada' }) };` }
  },
  output: [sample]
});

const promptMeta = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prompt metadatos',
    position: [3980, 280],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = $json;
const NL = String.fromCharCode(10);
const system = 'Eres el responsable de YouTube de AccesoPro (preparación online de pruebas de acceso para adultos). Generas metadatos honestos, claros y útiles en español de España, sin clickbait engañoso y sin prometer aprobar el examen.';
const origen = s.kind === 'script' ? 'vídeo corto generado a partir del temario' : 'clip recortado de una clase en directo (' + ((s.clip && s.clip.type) || 'momento clave') + ')';
const user = 'Pieza: ' + origen + NL + 'Tema: Matemáticas, prueba de acceso a Grado Superior, Comunidad Valenciana. Título interno: ' + s.title + NL + 'Contenido hablado:' + NL + s.text + NL + NL + 'Genera: título (máximo 70 caracteres, concreto y con gancho), descripción (máximo 1200 caracteres: primeras dos líneas con el valor para el alumno, qué se explica, mención a AccesoPro y llamada a la acción, y 3-4 hashtags al final), 8 a 12 etiquetas y un texto corto para la miniatura (máximo 6 palabras).';
const tool = {
  name: 'entregar_metadatos',
  description: 'Entrega los metadatos de YouTube',
  input_schema: {
    type: 'object',
    properties: {
      titulo: { type: 'string' },
      descripcion: { type: 'string' },
      etiquetas: { type: 'array', items: { type: 'string' } },
      texto_miniatura: { type: 'string' }
    },
    required: ['titulo', 'descripcion', 'etiquetas', 'texto_miniatura']
  }
};
const req = { model: s.cfg.writer_model, max_tokens: 1200, temperature: 0.5, system: system, messages: [{ role: 'user', content: user }], tools: [tool], tool_choice: { type: 'tool', name: 'entregar_metadatos' } };
return { json: Object.assign({}, s, { req: req }) };`
    }
  },
  output: [sample]
});

const claudeMeta = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'Claude · Metadatos de YouTube',
    position: [4220, 280],
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 5000,
    parameters: {
      method: 'POST',
      url: 'https://api.anthropic.com/v1/messages',
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'anthropicApi',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'anthropic-version', value: '2023-06-01' }] },
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ $json.req }}'),
      options: { timeout: 120000 }
    },
    credentials: { anthropicApi: { id: 'olVcoY7AU7oJpytv', name: 'Anthropic account - accesopro-n8n' } }
  },
  output: [{ content: [{ type: 'tool_use', input: { titulo: 'T', descripcion: 'D', etiquetas: ['a'], texto_miniatura: 'M' } }], usage: { input_tokens: 100, output_tokens: 100 } }]
});

const parseMeta = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Interpretar metadatos',
    position: [4460, 280],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = $('Prompt metadatos').item.json;
const r = $json;
const block = (r.content || []).find((b) => b.type === 'tool_use');
if (!block) throw new Error('Claude no devolvió los metadatos');
const m = block.input;
const u = r.usage || {};
const cost = ((u.input_tokens || 0) * s.cfg.price_writer_in + (u.output_tokens || 0) * s.cfg.price_writer_out) / 1000000;
const out = Object.assign({}, s);
delete out.req;
out.yt = { titulo: String(m.titulo).slice(0, 95), descripcion: m.descripcion, etiquetas: m.etiquetas, texto_miniatura: m.texto_miniatura };
out.costs = { llm: (s.costs.llm || 0) + cost, voice: s.costs.voice || 0, stt: s.costs.stt || 0 };
return { json: out };`
    }
  },
  output: [sample]
});

const isScriptVoice = ifElse({
  version: 2.3,
  config: {
    name: '¿Necesita voz?',
    position: [4700, 280],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.kind }}'), operator: { type: 'string', operation: 'equals' }, rightValue: 'script' }],
        combinator: 'and'
      }
    }
  }
});

const promptVoice = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Prompt voz',
    position: [4940, 160],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = $json;
const req = { text: s.text, model_id: s.cfg.tts_model, voice_settings: { stability: 0.5, similarity_boost: 0.8, style: 0.2, use_speaker_boost: true } };
const url = 'https://api.elevenlabs.io/v1/text-to-speech/' + s.cfg.voice_id + '/with-timestamps?output_format=mp3_44100_64';
return { json: Object.assign({}, s, { req: req, tts_url: url }) };`
    }
  },
  output: [sample]
});

const elevenLabs = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'ElevenLabs · Voz clonada con marcas de tiempo',
    position: [5180, 160],
    retryOnFail: true,
    maxTries: 3,
    waitBetweenTries: 8000,
    parameters: {
      method: 'POST',
      url: expr('{{ $json.tts_url }}'),
      authentication: 'genericCredentialType',
      genericAuthType: 'httpHeaderAuth',
      sendBody: true,
      contentType: 'json',
      specifyBody: 'json',
      jsonBody: expr('{{ $json.req }}'),
      options: { timeout: 180000 }
    },
    credentials: { httpHeaderAuth: newCredential('ElevenLabs (cabecera xi-api-key)') }
  },
  output: [{ audio_base64: 'AAAA', alignment: { characters: ['H', 'o', 'l', 'a'], character_start_times_seconds: [0, 0.1, 0.2, 0.3], character_end_times_seconds: [0.1, 0.2, 0.3, 0.4] } }]
});

const parseAudio = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Interpretar audio y palabras',
    position: [5420, 160],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = $('Prompt voz').item.json;
const r = $json;
if (!r.audio_base64) throw new Error('ElevenLabs no devolvió audio');
const al = r.alignment || r.normalized_alignment;
const chars = al.characters;
const st = al.character_start_times_seconds;
const en = al.character_end_times_seconds;
const words = [];
let cur = '';
let ws = 0;
let we = 0;
for (let i = 0; i < chars.length; i++) {
  const c = chars[i];
  if (c === ' ' || c === String.fromCharCode(10) || c === String.fromCharCode(9)) {
    if (cur) { words.push({ w: cur, s: ws, e: we }); cur = ''; }
  } else {
    if (!cur) ws = st[i];
    cur += c;
    we = en[i];
  }
}
if (cur) words.push({ w: cur, s: ws, e: we });
const out = Object.assign({}, s);
delete out.req;
delete out.tts_url;
out.audio_b64 = r.audio_base64;
out.words = words;
out.audio_seconds = en.length ? en[en.length - 1] : 0;
out.audio_path = '/data/audio/' + s.piece_id + '.mp3';
out.costs = { llm: s.costs.llm || 0, voice: (s.costs.voice || 0) + (s.text.length * s.cfg.price_tts_per_1k_chars) / 1000, stt: s.costs.stt || 0 };
return { json: out };`
    }
  },
  output: [sample]
});

const audioToBinary = node({
  type: 'n8n-nodes-base.convertToFile',
  version: 1.1,
  config: {
    name: 'Audio a binario',
    position: [5660, 160],
    parameters: {
      operation: 'toBinary',
      sourceProperty: 'audio_b64',
      options: { fileName: expr('{{ $json.piece_id }}.mp3'), mimeType: 'audio/mpeg' }
    }
  },
  output: [{}]
});

const saveAudio = node({
  type: 'n8n-nodes-base.readWriteFile',
  version: 1.1,
  config: {
    name: 'Guardar MP3 en disco',
    position: [5900, 160],
    parameters: { operation: 'write', fileName: expr("{{ $('Interpretar audio y palabras').item.json.audio_path }}"), dataPropertyName: 'data' }
  },
  output: [{ fileName: '/data/audio/x.mp3' }]
});

const restoreAudio = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Restaurar estado tras audio',
    position: [6140, 160],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = Object.assign({}, $('Interpretar audio y palabras').item.json);
delete s.audio_b64;
return { json: s };`
    }
  },
  output: [sample]
});

const prepareRender = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Preparar render',
    position: [6380, 400],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = $json;
let job;
if (s.kind === 'script') {
  job = { id: s.piece_id, kind: 'tts', formats: ['9x16', '16x9'], title: s.title, kicker: 'Matemáticas · Grado Superior · C. Valenciana', thumbText: s.yt.texto_miniatura, audioPath: s.audio_path, words: s.words };
} else {
  job = { id: s.piece_id, kind: 'clip', formats: ['9x16', '16x9'], title: s.title, kicker: 'Clase en directo · ' + (s.clip.type || 'clip'), thumbText: s.yt.texto_miniatura, sourceVideo: s.clip.source_video, start: s.clip.start, end: s.clip.end, words: s.clip.words, crop: s.cfg.clip_crop };
}
const out = Object.assign({}, s, { job_b64: Buffer.from(JSON.stringify(job), 'utf8').toString('base64') });
return { json: out };`
    }
  },
  output: [sample]
});

const renderVideos = node({
  type: 'n8n-nodes-base.executeCommand',
  version: 1,
  config: {
    name: 'FFmpeg · Montar 9:16 y 16:9 + miniatura',
    position: [6620, 400],
    parameters: { executeOnce: false, command: expr('node /data/scripts/render.js b64:{{ $json.job_b64 }}') }
  },
  output: [{ stdout: '{"id":"x","videos":[{"format":"9x16","path":"/data/video/x_9x16.mp4","duration":40,"sizeMB":3}],"thumb":"/data/thumbs/x.jpg"}', stderr: '', exitCode: 0 }]
});

const parseRender = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Interpretar render',
    position: [6860, 400],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = $('Preparar render').item.json;
const r = JSON.parse($json.stdout);
const fmt = s.kind === 'script' ? s.cfg.publish_format_script : s.cfg.publish_format_clip;
const v = r.videos.find((x) => x.format === fmt) || r.videos[0];
const out = Object.assign({}, s, { render: r, publish_video_path: v.path, thumb_path: r.thumb });
delete out.job_b64;
return { json: out };`
    }
  },
  output: [sample]
});

const shouldPublish = ifElse({
  version: 2.3,
  config: {
    name: '¿Publicar en YouTube?',
    position: [7100, 400],
    parameters: {
      conditions: {
        options: { caseSensitive: true, leftValue: '', typeValidation: 'strict', version: 2 },
        conditions: [{ leftValue: expr('{{ $json.cfg.publish_enabled }}'), operator: { type: 'boolean', operation: 'true', singleValue: true } }],
        combinator: 'and'
      }
    }
  }
});

const readVideo = node({
  type: 'n8n-nodes-base.readWriteFile',
  version: 1.1,
  config: {
    name: 'Leer vídeo final',
    position: [7340, 300],
    parameters: { operation: 'read', fileSelector: expr('{{ $json.publish_video_path }}'), options: { dataPropertyName: 'data' } }
  },
  output: [{ fileName: 'x.mp4' }]
});

const uploadYoutube = node({
  type: 'n8n-nodes-base.youTube',
  version: 1,
  config: {
    name: 'YouTube · Subir como no listado',
    position: [7580, 300],
    retryOnFail: true,
    maxTries: 2,
    waitBetweenTries: 15000,
    parameters: {
      resource: 'video',
      operation: 'upload',
      title: expr("{{ $('Interpretar render').item.json.yt.titulo }}"),
      regionCode: 'ES',
      categoryId: '27',
      binaryProperty: 'data',
      options: {
        description: expr("{{ $('Interpretar render').item.json.yt.descripcion }}"),
        tags: expr("{{ $('Interpretar render').item.json.yt.etiquetas.join(',') }}"),
        privacyStatus: 'unlisted',
        defaultLanguage: 'es',
        selfDeclaredMadeForKids: false,
        notifySubscribers: false
      }
    },
    credentials: { youTubeOAuth2Api: newCredential('YouTube canal de prueba') }
  },
  output: [{ uploadId: 'abc123' }]
});

const readThumb = node({
  type: 'n8n-nodes-base.readWriteFile',
  version: 1.1,
  config: {
    name: 'Leer miniatura',
    position: [7820, 300],
    parameters: { operation: 'read', fileSelector: expr("{{ $('Interpretar render').item.json.thumb_path }}"), options: { dataPropertyName: 'data' } }
  },
  output: [{ fileName: 'x.jpg' }]
});

const setThumb = node({
  type: 'n8n-nodes-base.httpRequest',
  version: 4.5,
  config: {
    name: 'YouTube · Fijar miniatura',
    position: [8060, 300],
    onError: 'continueRegularOutput',
    parameters: {
      method: 'POST',
      url: expr("https://www.googleapis.com/upload/youtube/v3/thumbnails/set?uploadType=media&videoId={{ $('YouTube · Subir como no listado').item.json.uploadId || $('YouTube · Subir como no listado').item.json.id }}"),
      authentication: 'predefinedCredentialType',
      nodeCredentialType: 'youTubeOAuth2Api',
      sendHeaders: true,
      headerParameters: { parameters: [{ name: 'Content-Type', value: 'image/jpeg' }] },
      sendBody: true,
      contentType: 'binaryData',
      inputDataFieldName: 'data',
      options: { timeout: 60000 }
    },
    credentials: { youTubeOAuth2Api: newCredential('YouTube canal de prueba') }
  },
  output: [{ kind: 'youtube#thumbnailSetResponse' }]
});

const publishedResult = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resultado · publicada',
    position: [8300, 300],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = $('Interpretar render').item.json;
const up = $('YouTube · Subir como no listado').item.json;
const id = up.uploadId || up.id;
const thumbErr = $json && $json.error ? ' (miniatura no aplicada: ' + ($json.error.message || 'error') + ')' : '';
const c = s.costs;
const final = {
  piece_id: s.piece_id, run_id: s.run_id, kind: s.kind, title: s.yt.titulo, status: 'publicada', review_verdict: 'aprobada',
  review_reason: s.review_reason + thumbErr, attempts: s.attempts || 0, cost_llm_usd: c.llm, cost_voice_usd: c.voice, cost_stt_usd: c.stt,
  cost_total_usd: c.llm + c.voice + c.stt, youtube_url: 'https://www.youtube.com/watch?v=' + id, source_ref: s.source_ref, script_text: s.text, error: ''
};
return { json: Object.assign({}, s, { final: final }) };`
    }
  },
  output: [sample]
});

const unpublishedResult = node({
  type: 'n8n-nodes-base.code',
  version: 2,
  config: {
    name: 'Resultado · revisada sin publicar',
    position: [7340, 560],
    parameters: {
      mode: 'runOnceForEachItem',
      language: 'javaScript',
      jsCode: `const s = $json;
const c = s.costs;
const final = {
  piece_id: s.piece_id, run_id: s.run_id, kind: s.kind, title: s.yt.titulo, status: 'revisada', review_verdict: 'aprobada',
  review_reason: s.review_reason + ' | Vídeo montado en ' + s.publish_video_path + ' (publicación desactivada)', attempts: s.attempts || 0, cost_llm_usd: c.llm, cost_voice_usd: c.voice, cost_stt_usd: c.stt,
  cost_total_usd: c.llm + c.voice + c.stt, youtube_url: '', source_ref: s.source_ref, script_text: s.text, error: ''
};
return { json: Object.assign({}, s, { final: final }) };`
    }
  },
  output: [sample]
});

const tableFinal = node({
  type: 'n8n-nodes-base.dataTable',
  version: 1.1,
  config: {
    name: 'Tabla · registrar resultado final',
    position: [8560, 400],
    parameters: {
      resource: 'row',
      operation: 'upsert',
      dataTableId: tableRef,
      matchType: 'allConditions',
      filters: { conditions: [{ keyName: 'piece_id', condition: 'eq', keyValue: expr('{{ $json.final.piece_id }}') }] },
      columns: {
        mappingMode: 'defineBelow',
        value: {
          piece_id: expr('{{ $json.final.piece_id }}'),
          run_id: expr('{{ $json.final.run_id }}'),
          kind: expr('{{ $json.final.kind }}'),
          title: expr('{{ $json.final.title }}'),
          status: expr('{{ $json.final.status }}'),
          review_verdict: expr('{{ $json.final.review_verdict }}'),
          review_reason: expr('{{ $json.final.review_reason }}'),
          attempts: expr('{{ $json.final.attempts }}'),
          cost_llm_usd: expr('{{ $json.final.cost_llm_usd }}'),
          cost_voice_usd: expr('{{ $json.final.cost_voice_usd }}'),
          cost_stt_usd: expr('{{ $json.final.cost_stt_usd }}'),
          cost_total_usd: expr('{{ $json.final.cost_total_usd }}'),
          youtube_url: expr('{{ $json.final.youtube_url }}'),
          source_ref: expr('{{ $json.final.source_ref }}'),
          script_text: expr('{{ $json.final.script_text }}'),
          error: expr('{{ $json.final.error }}')
        },
        matchingColumns: ['piece_id'],
        schema: colSchema
      }
    }
  },
  output: [{ id: 1 }]
});

export default workflow('accesopro-producir-pieza', 'AccesoPro · Producir pieza (guion/clip → revisión → voz → vídeo → YouTube)')
  .add(receivePiece)
  .to(isScript.onTrue(promptScript.to(claudeScript.to(parseScript.to(pieceReady)))).onFalse(pieceReady))
  .add(pieceReady)
  .to(tableGenerated.to(restoreGenerated.to(review1.to(
    approved1
      .onTrue(approvedPiece)
      .onFalse(canFix
        .onTrue(promptFix.to(claudeFix.to(parseFix.to(review2.to(approved2.onTrue(approvedPiece).onFalse(rejectedResult))))))
        .onFalse(rejectedResult))
  ))))
  .add(approvedPiece)
  .to(promptMeta.to(claudeMeta.to(parseMeta.to(
    isScriptVoice
      .onTrue(promptVoice.to(elevenLabs.to(parseAudio.to(audioToBinary.to(saveAudio.to(restoreAudio.to(prepareRender)))))))
      .onFalse(prepareRender)
  ))))
  .add(prepareRender)
  .to(renderVideos.to(parseRender.to(
    shouldPublish
      .onTrue(readVideo.to(uploadYoutube.to(readThumb.to(setThumb.to(publishedResult.to(tableFinal))))))
      .onFalse(unpublishedResult.to(tableFinal))
  )))
  .add(rejectedResult)
  .to(tableFinal);
