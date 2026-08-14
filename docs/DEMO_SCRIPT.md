# Сценарии демонстрации

## Сокращённая версия на 90 секунд

### 0–10 секунд — задача

Открыть главную и сказать:

> Это один набор реальных новостей. Пользователь меняет эмоциональную оптику, но приложение не разрешает модели менять конкретные факты.

### 10–25 секунд — moods

Переключить `neutral → hopeful → concerned → ironic`. Источник, URL и время публикации остаются теми же.

### 25–45 секунд — comparison

Открыть одну новость. Слева показать неизменяемый source fragment, справа — прошедший проверку rewrite. Подчеркнуть: при отсутствии accepted-версии интерфейс показывает original, а не сырой AI-ответ.

### 45–60 секунд — Fact Lock

Показать ledger имён, дат, чисел, мест и цитат. Объяснить pipeline: extraction → placeholders → generation → exact restoration → repeat scan.

### 60–75 секунд — fallback и evidence

Открыть `/ops`: primary DeepSeek, fallback Luna, фактические токены/стоимость, validation pass rate и последний импорт. Luna включается не только при HTTP-ошибке, но и после невалидного JSON или Fact Lock failure.

### 75–90 секунд — проверка и ограничения

Показать `npm run test` или benchmark report. Закончить честным ограничением: Fact Lock сохраняет конкретные факты источника, но не доказывает истинность самой новости и не заменяет полную semantic verification.

---

## Полная версия на 5–7 минут

### 0:00–0:35 — framing

«Это constrained news transformation. AI отвечает за тон, а код решает, можно ли публиковать результат».

### 0:35–1:15 — реальные данные

- открыть нейтральный grid;
- показать 10+ карточек;
- открыть source link;
- назвать publication/fetched times;
- объяснить five-minute poll.

### 1:15–2:00 — один dataset, разные moods

Переключить:

```text
neutral → concerned → ironic
```

Подчеркнуть: source set не изменился.

### 2:00–3:00 — comparison

Открыть статью:

- original слева;
- rewrite справа;
- model/prompt metadata;
- Fact Lock badge;
- exact fact ledger.

### 3:00–3:50 — rejection

Показать тест:

```text
The chance is 99%.
```

Запустить targeted test и показать `ADDED_CONCRETE_FACTS`.

### 3:50–4:40 — fallback

Открыть `src/modules/ai/model-router.ts`:

```text
DeepSeek
→ schema + Fact Lock
→ Luna after failure
```

Объяснить, почему gateway failover недостаточен для business validation.

### 4:40–5:30 — данные и audit

Открыть `/ops` и/или `npm run db:inspect`:

- imported articles;
- snapshots/version;
- model attempts;
- tokens/cost;
- validation pass rate.

### 5:30–6:15 — измеримый выбор модели

Показать benchmark report:

```bash
npm run evaluate:ai -- --limit=10
```

Объяснить, что model выбрана по pass rate, latency и cost, а не по бренду.

### 6:15–7:00 — ограничения

Честно сказать:

- система не проверяет истинность источника;
- Fact Lock не доказывает semantic equivalence;
- entity extraction эвристическая;
- следующий production step — sensitivity + semantic guard + PostgreSQL queue.
