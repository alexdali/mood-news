# Чек-лист сдачи

## Репозиторий

- [ ] понятное имя и описание;
- [ ] чистая история коммитов;
- [ ] `.env` отсутствует;
- [ ] DB/API keys отсутствуют;
- [ ] license добавлена;
- [ ] README отображается корректно.

## Запуск

- [ ] проверен Node version;
- [ ] `npm install` проходит;
- [ ] `npm run bootstrap` проходит;
- [ ] `npm run dev` стартует;
- [ ] worker стартует отдельно;
- [ ] Docker Compose проверен;
- [ ] health endpoint отвечает.

## Данные

- [ ] минимум 10 реальных news records;
- [ ] два source adapters реализованы;
- [ ] original URLs сохранены;
- [ ] publication/fetch time сохранены;
- [ ] raw и normalized data разделены;
- [ ] повторный ingestion не дублирует records.

## AI

- [ ] DeepSeek primary;
- [ ] Luna fallback;
- [ ] один request на четыре moods;
- [ ] strict JSON;
- [ ] reasoning отключён;
- [ ] usage/cost сохраняются;
- [ ] budget guard настроен;
- [ ] model IDs проверены в день сдачи.

## Fact Lock

- [ ] exact round trip;
- [ ] числа/даты/цитаты защищены;
- [ ] entities защищены;
- [ ] missing/duplicate/moved/reordered rejected;
- [ ] new facts rejected;
- [ ] invalid output не показывается;
- [ ] fallback test проходит.

## UI

- [ ] grid desktop;
- [ ] grid mobile;
- [ ] mood switch;
- [ ] original/rewrite compare;
- [ ] source link;
- [ ] protected facts table;
- [ ] no-rewrite state;
- [ ] operations page;
- [ ] loading/error/empty states.

## Evidence

- [ ] unit tests;
- [ ] integration tests;
- [ ] e2e tests;
- [ ] benchmark report;
- [ ] evidence report;
- [ ] 4–6 screenshots;
- [ ] 90-second demo rehearsed;
- [ ] limitations stated explicitly.
