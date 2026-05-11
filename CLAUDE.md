# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Komendy

```bash
npm run dev          # dev server na localhost:5173
npm run build        # tsc -b && vite build  →  dist/ z service workerem
npm run preview      # podgląd buildu produkcyjnego
npm run lint         # ESLint
```

Brak testów jednostkowych — logika domenowa w `src/utils/calculations.ts` jest łatwo testowalna izolowanie.

## Architektura

### Nawigacja

Brak react-router. Aktywna zakładka to `TabId` (`'workout' | 'history' | 'stats' | 'comparison' | 'settings'`) trzymany w `useState` w `App.tsx`. Ekrany renderowane warunkowo pod `AnimatePresence mode="wait"` z `key={tab}`, dzięki czemu zmiana zakładki uruchamia fade+slide (18ms, ease-out). Onboarding sprawdzany przed renderowaniem całego UI.

### Storage

Wszystkie dane tylko w `localStorage`. Klucze zdefiniowane w `src/utils/storage.ts` → `STORAGE_KEYS`. Dwa profile trzymają dane pod oddzielnymi kluczami: `gym_emil_workouts` / `gym_nikola_workouts` (analogicznie `_prs`).

Stores dzielą się na dwa wzorce:
- **Zustand `persist`** (profileStore, settingsStore) — automatyczny zapis do jednego klucza
- **Ręczny zapis** (historyStore, prStore, workoutStore) — `storageSet(STORAGE_KEYS.workouts(profileId), ...)` wywoływane wewnątrz każdej akcji; pozwala na split keys per profil

`gym_active_workout` to specjalny klucz — workoutStore zapisuje tam każdą mutację, żeby nie stracić sesji przy odświeżeniu.

### Główny przepływ: zapis serii → PR → toast → timer

`SetLogger.handleSave()` robi wszystko synchronicznie w jednym event handlerze:
1. `workoutStore.addSet()` — mutuje stan i zapisuje do `gym_active_workout`
2. `usePRCheck()(newSet)` — `checkNewPRs()` z `calculations.ts`, jeśli PR: `workoutStore.markSetAsPR()` + `prStore.upsertPR()` + `workoutStore.setLastPREvents()`
3. `HAPTIC.medium()` (+ `prCelebration` jeśli PR)
4. `onTimerStart(duration)` jeśli timer włączony i seria nie jest rozgrzewką

`PRToast` (zamontowany w `App.tsx`) subskrybuje `workoutStore.lastPREvents` — pojawia się i sam znika po 4s.

#### Typy PR

`checkNewPRs()` sprawdza trzy rodzaje jednocześnie:
- `maxWeight` — najwyższy ciężar dla ćwiczenia
- `1rm` — najwyższy szacowany 1RM (formuła Epley: `weight * (1 + reps/30)`)
- `maxVolume` — najwyższy wolumen serii (`weight × reps`)

Sety pobite w PR mają `WorkoutSet.isPR === true` (markSetAsPR mutuje workoutStore).

### System kolorów i motywy

`useTheme()` w `App.tsx` ustawia CSS custom properties na `:root` przy każdej zmianie profilu:
- `--accent`, `--accent-muted`, `--accent-rgb`, `--accent-shadow`
- `--accent2` — kolor dla gradientów (Emil → `#6366F1`, Nikola → `#FB7185`)
- `--soft` / `--soft2` — rozcieńczone tła akcentowe (np. `rgba(59,130,246,0.14)`)

Tokeny są deklarowane jako `@property` (animowalne) w `index.css`. Kolory profili:
- Emil: `#3B82F6` (niebieski) + `#6366F1` (indigo)
- Nikola: `#F43F5E` (koralowy) + `#FB7185` (róż)

Tokeny powierzchni (`--surface`, `--surface2`, `--surface3`) + tokenów krawędzi (`--border-dim`, `--border-strong`) zdefiniowane w `index.css` — używaj ich zamiast hardkodowanych `rgba(255,255,255,...)`.

Ambient glow każdego ekranu pochodzi z `backgroundImage: 'radial-gradient(120% 60% at 50% -10%, var(--soft) 0%, transparent 60%)'` ustawionego na `<main>` w `App.tsx`.

Klasy Tailwind `dark:` są stosowane fragmentarycznie — dark mode jest trybem dominującym.

### ProfileSwitch

`<ProfileSwitch />` (`src/components/ui/ProfileSwitch.tsx`) to pill-button widoczny w nagłówku każdego ekranu — kliknięcie przełącza aktywny profil w `profileStore`. Przyjmuje prop `compact?: boolean` (mniejszy padding). Jest jedynym UI-owym mechanizmem przełączania profili.

Definicja profili w `src/constants/profiles.ts` — każdy profil ma: `accent`, `accent2`, `accentMuted`, `soft`, `soft2`, `fullName`, `nickname`.

### WorkoutScreen — maszyna stanów + overlaye

Trzy widoki renderowane warunkowo (nie early-return) wewnątrz wspólnego `<>`:

```
brak activeWorkout                       →  ekran startowy (gradient hero card + plany)
activeWorkout + brak currentExerciseId   →  ExercisePicker + podsumowanie w toku
activeWorkout + currentExerciseId        →  SetLogger + SetList + RestTimerBanner
```

`selectExercise('')` cofa do pickera (pusty string → `!currentExerciseId === true`).

Nad wszystkimi widokami renderują się dwa fixed-overlaye:
- **Curtain** (`position: fixed, z-index: 9999`) — dwie połowy kurtyny rozjeżdżające się w górę/dół przy starcie treningu (600ms ease-in-out). Triggerowany przez `curtainActive` state, wyłączony gdy `useReducedMotion()`.
- **WorkoutCompletionOverlay** (`z-index: 10000`) — FIFA-style podsumowanie po zakończeniu treningu (tapnięcie zamyka).

### Animacje (Framer Motion)

Framer Motion jest zainstalowany i używany w:
- `App.tsx` — tab transitions (`AnimatePresence mode="wait"`, fade+slide)
- `WorkoutScreen.tsx` — curtain split, AnimatePresence dla overlayu
- `WorkoutCompletionOverlay.tsx` — staggered slides + spring title
- `ProgressRing.tsx` — spring `strokeDashoffset` na SVG circle

**Zasada**: zawsze sprawdź `useReducedMotion()` przed uruchomieniem animacji dekoracyjnych lub dźwięków. Przy `true` — skip animacji, `transition={{ duration: 0 }}`.

### ProgressRing

`src/components/ui/ProgressRing.tsx` — reużywalny pierścień SVG z Framer Motion.
Props: `value` (0–1), `size` (px), `stroke` (px), `label` (ReactNode).

Zachowanie:
- Spring `strokeDashoffset` przy każdej zmianie `value`
- Przy przejściu do `value >= 1`: jednorazowy scale bounce (1→1.12→1) + trwały `drop-shadow` glow w `--accent`

Używany w:
- `SetLogger` (56px, tylko gdy `targetSets` jest znane — tryb planu)
- `WorkoutScreen` "Trening w toku" card (88px, tylko gdy aktywny plan)

### Ćwiczenia

Domyślna lista 34 ćwiczeń w `src/constants/exercises.ts` (id = slug, np. `'martwy-ciag'`). Własne ćwiczenia dołączane w `exerciseStore` przy inicjalizacji z `gym_custom_exercises`. Każde ćwiczenie ma `name` (PL) i `nameEn` (EN) — wyszukiwarka przeszukuje obie.

### Timer odpoczynku

`useRestTimer` przechowuje `endTimestampRef = Date.now() + duration * 1000` (nie countdown). Interwał 250ms przelicza pozostały czas z timestampa. Listener `visibilitychange` resyncuje po powrocie z tła. Notification API opakowane w guard (`typeof Notification !== 'undefined'` + sprawdzenie `permission`) — na iOS PWA powiadomienia nie działają, fallback to tylko wibracja.

### Utilities w calculations.ts

Czyste funkcje bez zależności od React/stores — łatwo testowalne:
- `epley1RM(weightKg, reps)` — formuła Epley
- `calcVolume` / `getTotalVolume` — wolumen
- `getWorkoutDuration(workout)` — minuty
- `checkNewPRs(set, existingPRs, ...)` — zwraca `NewPREvent[]`
- `calculateStreak(workouts)` — aktualny streak (dni)
- `formatPRValue(type, value)` — string do wyświetlenia

### Dźwięk

`src/utils/whoosh.ts` — Web Audio API helper (lazy AudioContext). Generuje syntetyczny whoosh (noise burst + bandpass sweep). Używany w `WorkoutCompletionOverlay`. Failuje cicho jeśli AudioContext niedostępny (iOS wymaga user gesture — w tym kontekście zawsze jest).

### Recharts

`ExerciseChart` i `ComparisonChart` wymagają wrappera z explicit height:
```tsx
<div className="h-60 w-full">
  <ResponsiveContainer width="100%" height="100%">
```
`isAnimationActive={false}` na wszystkich `<Line>` — animacje SVG są wolne na iOS. Dane obliczane przez `useMemo` z historii workoutów.
