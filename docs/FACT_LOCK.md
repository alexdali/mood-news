# Fact Lock

## Задача

Сохранить проверяемые конкретные элементы source fragment при изменении тона. Fact Lock не проверяет истинность самого источника.

## Pipeline

```text
extract candidates
→ resolve overlaps by priority
→ assign placeholders
→ rewrite protected text
→ validate placeholders
→ restore exact values
→ scan restored text for additions
```

## Типы

- URL;
- quote;
- money;
- percentage;
- date;
- time;
- number;
- organization;
- person;
- place;
- generic entity.

## Overlaps

Более специфичный extractor имеет больший priority. Например `$12.5 million` блокируется целиком как money, а внутреннее `12.5` отбрасывается.

## Placeholders

```text
[[FACT_001]]
```

Нумерация идёт сначала по title, затем по summary. В БД сохраняются offsets исходного текста.

## Проверки

- missing placeholder;
- duplicate placeholder;
- unknown placeholder;
- placeholder moved between fields;
- added concrete fact после restore;
- abnormal length ratio;
- model meta text.

## Batch rule

Все четыре moods принимаются или отклоняются вместе.

## Score

Score вычисляется из детерминированных violations. Он не является вероятностью истинности. В UI предпочтительнее показывать `preserved/expected`.

## Ограничения

Regex/heuristic подход может не заметить:

- изменение отрицания;
- причинности;
- направления;
- атрибуции pronoun;
- неявное добавленное утверждение.

Поэтому корректная формулировка: formal concrete-fact preservation, а не полная semantic equivalence.
