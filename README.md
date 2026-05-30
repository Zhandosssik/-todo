# GoalAlarm

PWA для iPhone: трекер целей с AI-уведомлениями каждые 1.5–2 часа и умным будильником.

## Быстрый старт

```bash
cd goal-alarm
npm install
cp .env.example .env
# Добавьте GROQ_API_KEY в .env
npm run dev:all
```

`dev:all` запускает **frontend + backend** одновременно. Без backend AI-уведомления не работают.

Откройте http://localhost:5173 на телефоне или в эмуляторе мобильного браузера.

## Сборка

```bash
npm run build
npm run preview
```

## Backend (Web Push)

```bash
cd server
npm install
npm start
```

## Переменные окружения

| Переменная | Описание |
|---|---|
| `GROQ_API_KEY` | Ключ Groq API (только на сервере, в `.env`) |
| `GROQ_MODEL` | Модель Groq (по умолчанию `llama-3.3-70b-versatile`) |
| `VITE_VAPID_PUBLIC_KEY` | Публичный VAPID-ключ для push |
| `VAPID_PRIVATE_KEY` | Приватный VAPID-ключ (только на сервере) |

## Функции

- **Онбординг** — сбор целей и мечтаний
- **AI-уведомления** — персональные сообщения через Groq AI (или fallback offline)
- **Будильник** — выбор «5 минут» / «Добиться успеха», серия пробуждений
- **Dashboard** — прогресс целей, мотивация дня, streak
- **PWA** — offline через IndexedDB, установка на главный экран

## iOS (установка с интернета)

После деплоя (см. ниже) откройте ссылку **в Safari** (не в Chrome):

1. Откройте ваш URL, например `https://goal-alarm.vercel.app`
2. Пройдите онбординг и разрешите уведомления
3. Нажмите **Поделиться** (квадрат со стрелкой вверх)
4. **На экран «Домой»** → **Добавить**
5. Запускайте GoalAlarm с иконки на главном экране

> На iPhone PWA работает только через Safari. Будильник надёжнее, если разрешены уведомления.

## Деплой в интернет (Vercel + Render)

Нужны бесплатные аккаунты: [GitHub](https://github.com), [Render](https://render.com), [Vercel](https://vercel.com), ключ [Groq API](https://console.groq.com).

### 1. Загрузите код на GitHub

```bash
cd goal-alarm
git init
git add .
git commit -m "GoalAlarm initial"
git branch -M main
git remote add origin https://github.com/ВАШ_ЛОГИН/goal-alarm.git
git push -u origin main
```

### 2. Backend на Render

1. [render.com](https://render.com) → **New** → **Blueprint** (или **Web Service**)
2. Подключите репозиторий `goal-alarm`
3. Если Blueprint — Render подхватит `render.yaml` автоматически
4. Если вручную:
   - **Root Directory:** `server`
   - **Build Command:** `npm install`
   - **Start Command:** `node index.js`
5. **Environment** → добавьте `GROQ_API_KEY` = ваш ключ Groq
6. После деплоя скопируйте URL, например: `https://goal-alarm-api.onrender.com`
7. Проверка: откройте `https://goal-alarm-api.onrender.com/api/health` — должно быть `{"status":"ok",...}`

### 3. Frontend на Vercel

1. [vercel.com](https://vercel.com) → **Add New Project** → импорт репозитория
2. **Framework Preset:** Vite
3. **Root Directory:** `goal-alarm` (если репо — вся папка «Мой проект», укажите подпапку)
4. **Environment Variables:**
   - `VITE_API_BASE` = `https://goal-alarm-api.onrender.com` (ваш URL Render, без `/` в конце)
5. **Deploy**
6. Получите URL, например: `https://goal-alarm.vercel.app`

### 4. Установка на iPhone

Откройте URL Vercel в **Safari** → **Поделиться** → **На экран «Домой»**.

### Локальная разработка с production API

В `.env`:
```
VITE_API_BASE=https://goal-alarm-api.onrender.com
GROQ_API_KEY=ваш_ключ
```

```bash
npm run dev
```

## iOS (локально, без деплоя)

1. Откройте в Safari
2. «Поделиться» → «На экран Домой»
3. Разрешите уведомления после онбординга

## Структура

См. `cursorrules` в корне проекта для полной спецификации.
