# Gym Tracker

Progresywna aplikacja webowa (PWA) do śledzenia treningów siłowych. Działa w 100% offline — dane trzymane są wyłącznie w `localStorage` przeglądarki, nie ma backendu ani konta.

## Jak uruchomić lokalnie

```bash
npm install
npm run dev
```

Aplikacja startuje na `http://localhost:5173`.

## Jak zbudować

```bash
npm run build      # tsc -b && vite build → dist/
npm run preview    # podgląd buildu produkcyjnego
npm run lint       # ESLint
```

Pliki produkcyjne trafiają do folderu `dist/` razem z service workerem. Aplikacja jest w pełni statyczna — można ją hostować na dowolnym CDN.

## Storage (localStorage)

Wszystkie klucze mają prefiks `gym_`:

| Klucz | Zawartość |
|---|---|
| `gym_settings` | Ustawienia (timer, przypięte ćwiczenia) |
| `gym_active_workout` | Trening w toku (jeśli trwa) |
| `gym_active_session` | Wybrane ćwiczenie i aktywny plan trwającego treningu |
| `gym_workouts_emil` | Historia treningów (tablica JSON) |
| `gym_prs_emil` | Rekordy osobiste |
| `gym_plans_emil` | Zapisane plany treningowe |
| `gym_custom_exercises` | Własne ćwiczenia dodane przez użytkownika |

Kopia zapasowa: **Ustawienia → Dane → Eksportuj / Importuj**. Plik JSON zawiera treningi, rekordy, plany, własne ćwiczenia i ustawienia. Import **zastępuje** wszystkie dane i przeładowuje aplikację.

## Jak dodać własne ćwiczenia

### Z poziomu UI

1. Zakładka **Ustawienia** → sekcja **Własne ćwiczenia**
2. **+ Dodaj własne ćwiczenie**
3. Wypełnij nazwę PL/EN, kategorię, sprzęt i sposób zapisu (ciężar × powt., same powtórzenia, czas)

### W kodzie

Aby dodać ćwiczenie na stałe do domyślnej listy, edytuj `src/constants/exercises.ts`:

```ts
{
  id: 'moje-cwiczenie',        // unikalny slug (kebab-case)
  name: 'Moje ćwiczenie',      // nazwa po polsku
  nameEn: 'My Exercise',       // nazwa po angielsku
  category: 'klatka',          // jedna z 8 kategorii
  equipment: 'hantle',         // sztanga | hantle | maszyna | wolny
  isCustom: false,
  description: 'Jak wykonać ćwiczenie.',
  // trackBy: 'reps-only' | 'time'  — domyślnie 'weight-reps'
}
```

Usuwając ćwiczenie, dopisz jego id do `EXERCISE_ALIASES` na końcu pliku, żeby stare serie dalej pokazywały nazwę.

## Wdrożenie na Vercel

1. Wypchnij kod na GitHub
2. Na [vercel.com](https://vercel.com) → **Add New → Project → Import Git Repository**
3. Wybierz repozytorium — Vercel wykryje Vite automatycznie → **Deploy**
4. Wejdź na URL z iPhone'a i dodaj do ekranu głównego: Safari → udostępnianie → **Dodaj do ekranu głównego**
