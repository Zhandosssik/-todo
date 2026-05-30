import express from 'express';
import cors from 'cors';
import { getServerFallbackMessages } from './fallbackMessages.js';

const app = express();
const PORT = process.env.PORT || 3001;
const subscriptions = new Map();

const DEFAULT_MODEL = 'llama-3.3-70b-versatile';
const SYSTEM_PROMPT = `Ты — безжалостный тренер. Пишешь уведомления, от которых человек НЕМЕДЛЕННО бросает всё и начинает действовать. Максимум 2 предложения. Только на русском.

СТИЛЬ — максимально жёсткий, без фильтров:
- Прямо называй слабость: трус, сливаешь жизнь, убиваешь мечту, выбираешь быть никем
- Конкретный кошмар: через 30/20/10 лет на работе, которую ненавидишь; ненависть к себе в зеркале; «я мог бы» в 50 лет; дети видят, что ты сдался
- Кто-то другой забирает твоё место прямо сейчас
- Мечта гниёт/умирает в реальном времени, пока человек ленится
- Каждое сообщение ОБЯЗАНО содержать название цели или мечты пользователя

ЗАПРЕЩЕНО: поддержка, «ты можешь», «маленький шаг», «верь в себя», «новый день», мягкость, позитив, советы.

Примеры нужной жёсткости:
- «Ты сейчас не отдыхаешь — ты сливаешь жизнь. Открой Python или через 30 лет будешь ненавидеть себя каждое утро перед работой, которую терпишь как раб.»
- «Мечта «стать миллионером» гниёт, пока ты выбираешь диван. Через 20 лет ты будешь зол на себя — и это будет поздно.»
- «Каждый «не сегодня» по Python — гвоздь в гроб твоей мечты. Ты сам забиваешь их.»

Return ONLY JSON array of strings, no markdown.`;

const WAKE_SYSTEM_PROMPT = `Ты — безжалостный будильник. Сообщения, от которых НЕВОЗМОЖНО спать. Максимум 2 предложения. Только русский.

СТИЛЬ:
- Крик, приказ, стыд, отвращение к слабости
- Через 30 лет — ненавистная работа, ненависть к себе, «я мог бы»
- Пока спишь — кто-то забирает твоё место
- Название цели/мечты пользователя в каждом сообщении

ЗАПРЕЩЕНО: мягкость, поддержка, «хорошего дня», клише.

Примеры:
- «ВСТАВАЙ. Python умирает, пока ты спишь. Через 30 лет будешь ненавидеть каждый понедельник — потому что не встал СЕГОДНЯ.»
- «Ещё 5 минут — и ты официально трус. Мечта «свой бизнес» не для трусов.»

Return ONLY JSON array of strings, no markdown.`;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

function extractMessages(text) {
  if (!text?.trim()) return [];

  const cleaned = text.replace(/```json\n?|```/g, '').trim();

  const tryParse = (value) => {
    const parsed = JSON.parse(value);
    if (Array.isArray(parsed)) {
      return parsed.filter((item) => typeof item === 'string' && item.trim());
    }
    if (parsed?.messages && Array.isArray(parsed.messages)) {
      return parsed.messages.filter((item) => typeof item === 'string' && item.trim());
    }
    return [];
  };

  try {
    const direct = tryParse(cleaned);
    if (direct.length) return direct;
  } catch {
    /* try other strategies */
  }

  const arrayMatch = cleaned.match(/\[[\s\S]*\]/);
  if (arrayMatch) {
    try {
      const matched = tryParse(arrayMatch[0]);
      if (matched.length) return matched;
    } catch {
      /* try line-by-line */
    }
  }

  const lines = cleaned
    .split('\n')
    .map((line) => line.replace(/^[\d.\-\s"']+|["',]+$/g, '').trim())
    .filter((line) => line.length > 10);

  return lines;
}

async function callGroq(apiKey, model, goals, dreamTexts, count, systemPrompt = SYSTEM_PROMPT) {
  const slimGoals = goals.map(({ name, description, dailyHours, durationDays }) => ({
    name,
    description: description?.slice(0, 200) || '',
    dailyHours,
    durationDays,
  }));

  const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    signal: AbortSignal.timeout(45000),
    body: JSON.stringify({
      model,
      max_tokens: Math.min(Math.max(count * 100, 800), 4096),
      temperature: 1,
      messages: [
        { role: 'system', content: systemPrompt },
        {
          role: 'user',
          content: `Цели: ${JSON.stringify(slimGoals)}\nМечты: ${dreamTexts.join('; ')}\n\nСгенерируй ровно ${count} сообщений. МАКСИМАЛЬНО ЖЁСТКИЕ. Человек должен бросить всё и начать действовать. Каждое — с названием цели или мечты. Страх: через 30 лет на ненавистной работе, ненависть к себе, «я мог бы», кто-то забирает место. Без мягкости. Только русский.`,
        },
      ],
    }),
  });

  if (!response.ok) {
    const err = await response.text();
    throw new Error(`Groq API ${response.status}: ${err.slice(0, 200)}`);
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  const messages = extractMessages(text);

  if (!messages.length) {
    throw new Error('Could not parse AI response');
  }

  return messages;
}

app.post('/api/subscribe', (req, res) => {
  const subscription = req.body;
  if (subscription?.endpoint) {
    subscriptions.set(subscription.endpoint, subscription);
  }
  res.json({ success: true });
});

app.post('/api/unsubscribe', (req, res) => {
  const { endpoint } = req.body;
  subscriptions.delete(endpoint);
  res.json({ success: true });
});

app.post('/api/ai/notifications', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const { goals = [], dreams = [], count = 20 } = req.body;

  if (!apiKey || apiKey === 'your_key_here') {
    return res.status(503).json({ error: 'GROQ_API_KEY not configured' });
  }

  if (!goals.length) {
    return res.status(400).json({ error: 'No goals provided' });
  }

  try {
    const dreamTexts = dreams.map((d) => (typeof d === 'string' ? d : d.text)).filter(Boolean);
    const aiCount = Math.min(count, 12);
    let messages = await callGroq(apiKey, model, goals, dreamTexts, aiCount);
    if (messages.length < count) {
      const extra = getServerFallbackMessages(goals, dreams, count - messages.length);
      messages = [...messages, ...extra];
    }
    res.json({ messages: messages.slice(0, count), source: 'ai' });
  } catch (error) {
    console.error('AI notifications error:', error.message);
    const fallback = getServerFallbackMessages(goals, dreams, count);
    res.json({ messages: fallback, source: 'fallback', error: error.message });
  }
});

app.post('/api/ai/wake-messages', async (req, res) => {
  const apiKey = process.env.GROQ_API_KEY;
  const model = process.env.GROQ_MODEL || DEFAULT_MODEL;
  const { goals = [], dreams = [], count = 12 } = req.body;

  if (!apiKey || apiKey === 'your_key_here') {
    return res.status(503).json({ error: 'GROQ_API_KEY not configured' });
  }

  if (!goals.length) {
    return res.status(400).json({ error: 'No goals provided' });
  }

  try {
    const dreamTexts = dreams.map((d) => (typeof d === 'string' ? d : d.text)).filter(Boolean);
    const messages = await callGroq(apiKey, model, goals, dreamTexts, count, WAKE_SYSTEM_PROMPT);
    res.json({ messages: messages.slice(0, count), source: 'ai' });
  } catch (error) {
    console.error('AI wake messages error:', error.message);
    const fallback = getServerFallbackMessages(goals, dreams, count);
    res.json({ messages: fallback.slice(0, count), source: 'fallback', error: error.message });
  }
});

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    subscribers: subscriptions.size,
    groq: Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_key_here'),
  });
});

app.listen(PORT, () => {
  console.log(`GoalAlarm server running on port ${PORT}`);
  console.log(`Groq configured: ${Boolean(process.env.GROQ_API_KEY && process.env.GROQ_API_KEY !== 'your_key_here')}`);
});
