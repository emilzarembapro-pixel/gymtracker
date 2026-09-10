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

Brak react-router. Aktywna zakładka to `TabId` (`'workout' | 'history' | 'stats' | 'settings'`) trzymany w `useState` w `App.tsx`. Ekrany renderowane warunkowo pod `AnimatePresence mode="wait"` z `key={tab}`, dzięki czemu zmiana zakładki uruchamia fade+slide. Brak onboardingu i splash screena — `App.tsx` renderuje UI od razu.

### Subskrypcje store'ów

Ekrany czytają dane przez selektor stanu (`useHistoryStore(s => s.workouts[PROFILE_ID])`), **nie** przez getter (`getForProfile`). Getter jest stabilną referencją, więc komponent nie przerenderuje się po dodaniu/usunięciu treningu — tak właśnie znikały świeże dane w HistoryScreen i na wykresie.

### Storage

Wszystkie dane tylko w `localStorage`. Klucze zdefiniowane w `src/utils/storage.ts` → `STORAGE_KEYS` (`gym_workouts_emil`, `gym_prs_emil`, `gym_plans_emil`, …).

Stores dzielą się na dwa wzorce:
- **Zustand `persist`** (settingsStore) — automatyczny zapis do jednego klucza
- **Ręczny zapis** (historyStore, prStore, workoutStore) — `storageSet(STORAGE_KEYS.workouts(profileId), ...)` wywoływane wewnątrz każdej akcji

`gym_active_workout` to specjalny klucz — workoutStore zapisuje tam każdą mutację, żeby nie stracić sesji przy odświeżeniu. Obok niego `gym_active_session` trzyma `currentExerciseId` + `activePlanId`, dzięki czemu odświeżenie strony w trakcie treningu wraca do tego samego ćwiczenia i planu. Oba klucze są czyszczone przy zakończeniu, anulowaniu i imporcie kopii zapasowej.

Daty treningów zapisywane są **lokalnie** (`todayISO()` / `toDateStr()` z `src/utils/dates.ts`). Nie używaj `toISOString()` do wyliczania dnia — w PL (UTC+2) zwraca poprzednią datę przed 02:00.

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

Aplikacja jest **wyłącznie ciemna** — nie ma ustawienia motywu ani `ThemeToggle`. `useTheme()` w `App.tsx` ustawia CSS custom properties na `:root` i dodaje klasę `dark`:
- `--accent`, `--accent-muted`, `--accent-rgb`, `--accent-shadow`
- `--accent2` — kolor dla gradientów (`#6366F1`)
- `--soft` / `--soft2` — rozcieńczone tła akcentowe (np. `rgba(59,130,246,0.14)`)

Tokeny są deklarowane jako `@property` (animowalne) w `index.css`. Kolory: `#3B82F6` (niebieski) + `#6366F1` (indigo).

Tokeny powierzchni (`--surface`, `--surface2`, `--surface3`) + tokenów krawędzi (`--border-dim`, `--border-strong`) zdefiniowane w `index.css` — używaj ich zamiast hardkodowanych `rgba(255,255,255,...)`.

Ambient glow każdego ekranu pochodzi z `backgroundImage: 'radial-gradient(120% 60% at 50% -10%, var(--soft) 0%, transparent 60%)'` ustawionego na `<main>` w `App.tsx`.

Klasy Tailwind `dark:` są stosowane fragmentarycznie — dark mode jest trybem dominującym.

### Profil

Aplikacja jest jednoosobowa i **bez nazwy użytkownika** — nagłówek ekranu startowego to samo "Cześć!". Nie ma przełączania profili, ekranu porównania ani onboardingu; `ProfileSwitch`, `ComparisonScreen`, `OnboardingScreen` i `profileStore` zostały usunięte. `PROFILE` trzyma już tylko kolory akcentu.

`ProfileId` to typ jednowartościowy (`'emil'`), zachowany po to, żeby klucze storage i sygnatury store'ów (`getForProfile`, `prs(profileId)`) zostały bez zmian. `PROFILE` i `PROFILE_ID` żyją w `src/constants/profiles.ts` — używaj ich zamiast czytania profilu ze store'a.

### WorkoutScreen — maszyna stanów + overlaye

Trzy widoki renderowane warunkowo (nie early-return) wewnątrz wspólnego `<>`:

```
brak activeWorkout                       →  ekran startowy (gradient hero card + plany)
activeWorkout + brak currentExerciseId   →  ExercisePicker lub lista ćwiczeń z planu
activeWorkout + currentExerciseId        →  ExerciseInfo + SetLogger + SetList + NextBtn
```

`selectExercise('')` cofa do pickera (pusty string → `!currentExerciseId === true`).

W widoku `activeWorkout + currentExerciseId` kolejność elementów:
1. Nagłówek nawigacyjny (← Zmień ćwiczenie) + `ElapsedBadge`
2. **ExerciseInfo card** — rozwijany kafelek z nazwą ćwiczenia (EN + PL) i opisem; stan `showExerciseDesc` lokalny w WorkoutScreen, resetowany przez `handleNextExercise`
3. `<RestTimerRing>` (tylko gdy `isRunning`)
4. `<SetLogger>` + `<SetList>`
5. **Przycisk "Następne ćwiczenie"** — `handleNextExercise` przechodzi do kolejnego ćwiczenia w planie (po indeksie) lub wywołuje `selectExercise('')` gdy brak planu / koniec listy
6. Przycisk Zakończ trening

**Nie dodawaj tu przycisku "Edytuj cały trening"** ani pigułki "Edytuj" na karcie treningu w toku — został świadomie usunięty. Edytor otwiera się kliknięciem w kartę i to jedyna droga.

`ElapsedBadge` (lokalny komponent w `WorkoutScreen.tsx`) pokazuje czas trwania trwającego treningu — interwał 1 s, liczony z `activeWorkout.startTime`. Renderowany w obu widokach aktywnego treningu, domyślnie w wariancie `size="lg"` (22 px, poświata w `--accent`) — czas ma być widoczny z odległości.

W widoku bez wybranego ćwiczenia przyciski **Zakończ / Anuluj trening** stoją bezpośrednio pod kartą treningu w toku, nad listą ćwiczeń. Nie przenoś ich na dół — pod pełnym `ExercisePicker` przycisk był poza zasięgiem bez scrollowania.

**Ważne**: `handleConfirmStart` wywołuje `startWorkout(PROFILE_ID)` **przed** `setActivePlan(plan.id)` — odwrotna kolejność powoduje wyzerowanie `activePlanId` przez `startWorkout` (który resetuje ten state).

Przycisk "Zakończ trening" działa **in-place**: po kliknięciu przycisk zastępuje się modalem potwierdzenia (nie pojawia się pod spodem).

Nad wszystkimi widokami renderuje się fixed-overlay:
- **WorkoutCompletionOverlay** (`z-index: 10000`) — FIFA-style podsumowanie po zakończeniu treningu: czas, liczba ćwiczeń, serie robocze, łączny ciężar, a pod nimi lista **nowych rekordów** z tego treningu (serie z flagą `isPR`).

### Start treningu

`pendingStart` otwiera małe wyśrodkowane okienko: pigułka `TRENING #{workoutCount + 1}`, nazwa treningu i przyciski Anuluj / Rozpocznij. Nic więcej.

Był tu kiedyś pełnoekranowy sheet z interaktywną sylwetką do zaznaczania trenowanych mięśni (`BodyMuscleMap`, `constants/muscles.ts`, pole `Workout.muscles`). Został usunięty na życzenie — sylwetka złożona z zaokrąglonych prostokątów wyglądała jak klocki. Nie przywracaj bez rozmowy.

### WorkoutEditor

`src/components/workout/WorkoutEditor.tsx` — pełnoekranowa nakładka (`z-index: 10500`) do edycji **całego trwającego treningu**. Otwiera się kliknięciem karty "trening w toku" (widok bez wybranego ćwiczenia, karta ma pigułkę "Edytuj") albo przyciskiem "Edytuj cały trening" pod loggerem serii. Pozwala na:
- zmianę nazwy treningu (`workoutStore.renameWorkout`, zapis na `onBlur`)
- edycję każdej serii dowolnego ćwiczenia (ciężar / powt. / czas + przełącznik rozgrzewki)
- usunięcie serii i dodanie serii wstecz (kopiuje ostatnią serię ćwiczenia i od razu otwiera modal)
- dodanie nowego ćwiczenia do treningu przez `ExercisePicker`
- skok do ćwiczenia (`Przejdź`) — zamyka edytor i wywołuje `selectExercise`

Nowa seria dodana w edytorze jest kopią ostatniej i od razu otwiera modal — PR sprawdzany jest dopiero **po zamknięciu modala**, na wartościach po edycji (usunięcie serii w modalu nie zapisuje żadnego rekordu). **Edycja istniejącej serii nie przelicza PR-ów** — rekord zapisany przy pierwotnym zapisie zostaje.

### Długi odpoczynek

`useLongRestReminder()` (`src/hooks/useLongRestReminder.ts`) wibruje raz po 180 s od zapisania serii roboczej — niezależnie od `useRestTimer` i od tego, czy timer jest w ogóle włączony. Uzbrajany z `WorkoutScreen.handleSetSaved` (callback `onSetSaved` z `SetLogger`), czyszczony przy zakończeniu i anulowaniu treningu. Resynchronizuje się na `visibilitychange`, bo `setTimeout` jest dławiony w tle.

### SetLogger i SetList

**SetLogger** (`src/components/workout/SetLogger.tsx`):
- Kafelek KG i POWT. mają identyczny design (gradient background, accent border). Przycisk `+` w obu kafelkach jest `var(--accent)`.
- Kółka serii nad loggerem pokazują `S1`, `S2`… dla serii roboczych. Gdy toggle rozgrzewkowy jest aktywny, bieżące kółko pokazuje `R` zamiast `S`. Ukończone kółka (zielone) są klikalne i otwierają modal edycji tej serii.
- **Domyślny ciężar**: przy wejściu w ćwiczenie pole KG jest wypełniane ciężarem z **2. serii roboczej** poprzedniego treningu (fallback: ostatnia seria robocza). Tylko dla `trackBy: 'weight-reps'`.
- Po zapisaniu serii pole KG **zostaje** wypełnione — zerują się tylko powtórzenia / czas.
- `computeFontSize()` skaluje font inputu w dół wraz z długością wartości (52 → 24 px), żeby trzycyfrowe ciężary (`102.5`) mieściły się w kafelku. Kafelek ma `minWidth: 0` + `overflow: hidden`, a siatka `minmax(0, 1fr)` — bez tego input `type="number"` rozpycha kolumnę.

**LastWorkoutPanel** pokazuje **wszystkie** serie z poprzedniego treningu (zawijana siatka `auto-fill minmax(66px, 1fr)`), z etykietami R1/R2 dla rozgrzewki i S1/S2… dla serii roboczych. Nie ograniczaj tej listy `slice()` — właśnie po to została zmieniona.

**SetList** (`src/components/workout/SetList.tsx`):
- Serie podzielone na dwie sekcje: **Rozgrzewka** (etykiety R1, R2…) i **Serie robocze** (S1, S2…).
- Kliknięcie gdziekolwiek w wiersz serii otwiera modal edycji (KG + POWT.). Przycisk kosza ma `stopPropagation` — nie triggeruje edycji.
- Modal edycji: inputy muszą mieć `width: '100%'`, `boxSizing: 'border-box'` oraz `minWidth: 0` na labelce kolumny siatki — bez tego Safari/mobile nie ogranicza szerokości inputu `type="number"` i POWT. wylatuje poza ekran.

### PlanBuilder

`ExerciseBrowser` wewnątrz `PlanBuilder` ma filtry kategorii (identyczne kategorie jak `ExercisePicker`). "+ Dodaj" wrzuca ćwiczenie od razu do planu; cele (serie / powt. / kg) ustawia się potem na liście ćwiczeń planu. To samo ćwiczenie nie może trafić do planu dwa razy.

Lista ćwiczeń w `ExerciseBrowser` **nie ma** ograniczenia `maxHeight` — scrolluje razem z resztą zawartości przez rodzica (`flex: 1, overflowY: auto`). Nie przywracaj `maxHeight: 260` — powoduje niewidoczność ćwiczeń na iOS z powodu zagnieżdżonego overflow.

### Historia — miesięczny kalendarz

`HistoryScreen` pokazuje miesięczny kalendarz z nawigacją `‹ ›` między miesiącami. Każdy dzień z treningiem ma kropkę w `var(--accent)`. Kliknięcie dnia filtruje listę treningów poniżej do wybranego dnia. Pod kalendarzem wyświetlane są treningi z aktualnego miesiąca (lub zaznaczonego dnia).

### Animacje (Framer Motion)

Framer Motion jest zainstalowany i używany w:
- `App.tsx` — tab transitions (`AnimatePresence mode="wait"`, fade+slide)
- `WorkoutScreen.tsx` — AnimatePresence dla overlayu podsumowania. Start treningu jest **bez animacji** — kurtyna rozjeżdżająca się na pół została usunięta jako irytująca.
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

Lista ćwiczeń w `src/constants/exercises.ts` (id = slug, np. `'martwy-ciag'`). Własne ćwiczenia dołączane w `exerciseStore` przy inicjalizacji z `gym_custom_exercises`. Każde ćwiczenie ma `name` (PL) i `nameEn` (EN) — wyszukiwarka przeszukuje obie. Pole `description` jest opcjonalne — używane w ExercisePicker (przycisk info ⓘ) i w ExerciseInfo card w WorkoutScreen.

Kategorie: `klatka | plecy | nogi | barki | biceps | triceps | brzuch | cardio`
Equipment: `sztanga | hantle | maszyna | wolny`

`trackBy` decyduje o trybie logowania: `weight-reps` (domyślny), `reps-only` (ćwiczenia z masą własną — pompki, podciąganie, dipy, hyperextension, nordic curl, sissy squat, band pull-apart, brzuch), `time` (plank, cardio). Dla `reps-only` PR-em jest `maxReps`, dla `time` — `maxTime`.

**Konwencja nazw**: nazwa musi rozróżniać wariant, chwyt lub akcesorium, bo od tego zależy, czy to osobne ćwiczenie czy duplikat. Przykłady: `Wide-Grip Lat Pulldown` / `Close-Grip Lat Pulldown` / `Reverse-Grip Lat Pulldown`, `Tricep Pushdown (Bar)` / `Tricep Pushdown (Rope)`, `High/Mid/Low Cable Fly`. Nie dodawaj drugiego wpisu na to samo ćwiczenie tylko dlatego, że maszyna nazywa się inaczej.

Ćwiczenia dodane kiedyś ręcznie (uuid w `gym_custom_exercises`) zostały **promowane do `DEFAULT_EXERCISES`** pod slugami: `allahy`, `pushdown-jednoracz`, `malysz`, `lat-pulldown-plate-loaded`; "Chest fly" scalono z `machine-chest-fly`. Ich uuid żyją dalej w `EXERCISE_ALIASES`, a `exerciseStore.loadExercises()` odfiltrowuje z localStorage każdy custom, którego id jest w mapie aliasów — inaczej to samo ćwiczenie pojawiłoby się w pickerze dwa razy.

`EXERCISE_ALIASES` na końcu pliku mapuje id ćwiczeń scalonych z innymi na aktualne id. `exerciseStore.getById` sięga tam, gdy nie znajdzie ćwiczenia wprost, dzięki czemu serie zapisane przed scaleniem dalej pokazują nazwę. Usuwając ćwiczenie, **zawsze** dopisz alias.

Dodając nowe ćwiczenia: id musi być unikalnym slugiem (kebab-case), `isCustom: false`, `description` po polsku (instrukcja wykonania).

### StatsScreen — rekordy ćwiczenia

Po wybraniu ćwiczenia nad kafelkami statystyk renderuje się karta **REKORDY · CAŁY OKRES** (liczona z `allWorkouts`, nie z okresu wybranego u góry):
- maks ciężar i liczba powtórzeń wykonana tym ciężarem
- lista 5 najcięższych ciężarów z maks. liczbą powtórzeń dla każdego
- dla `reps-only` / `time` zamiast tego jedna wartość: maks powtórzeń lub najdłuższa seria

### Timer odpoczynku

`useRestTimer` przechowuje `endTimestampRef = Date.now() + duration * 1000` (nie countdown). Interwał 250ms przelicza pozostały czas z timestampa. Listener `visibilitychange` resyncuje po powrocie z tła. Notification API opakowane w guard (`typeof Notification !== 'undefined'` + sprawdzenie `permission`) — na iOS PWA powiadomienia nie działają, fallback to tylko wibracja.

### Frekwencja — AttendanceCard

`src/components/stats/AttendanceCard.tsx` renderuje się **wyłącznie na StatsScreen**, nad selektorem okresu. W HistoryScreen jej nie ma — była w obu miejscach i to było zbędne powtórzenie.

Karta **podąża za selektorem okresu**: dostaje już przefiltrowane `periodWorkouts` oraz `spanDays` z `PERIOD_DAYS`. Ten span jest kluczowy — bez niego "ostatnie 30 dni" dzieliłoby się przez odstęp między pierwszym a ostatnim treningiem w oknie zamiast przez 30.

Kolejność okresów: **`Wsz.` jest pierwszy od lewej i domyślny**, potem 1M, 3M, 6M, 1R. Nie przestawiaj — `PERIODS` wyprowadza kolejność z `PERIOD_DAYS`, więc wystarczy zmienić ten obiekt.

Liczy `getAttendanceStats(workouts, spanDaysOverride)`: liczba treningów, średnia tygodniowa i miesięczna oraz średnia długość treningu.

Przy `Wsz.` span liczony jest od pierwszego treningu do dziś, a średnie zwracają `null` dopóki historia nie obejmie pełnego tygodnia / miesiąca — inaczej trzy treningi z jednego dnia dają "91,3 x / miesiąc".

Kafelek "Seria z rzędu" (streak) został usunięty ze StatsScreen. `calculateStreak` żyje dalej i jest używany w nagłówku HistoryScreen.

### Treningi bez zakończenia (runaway)

Trening, którego użytkownik nie zakończył, tyka dalej — w danych siedziały sesje po 50 i 120 godzin, przez które średnia długość rosła z ~76 min do 411 min. Obrona jest dwuwarstwowa, obie w `src/constants/workout.ts`:

- `workoutStore.finishWorkout()` — jeśli od startu minęło ponad `RUNAWAY_MINUTES` (240), zapisuje `endTime` jako start + `RUNAWAY_REPLACEMENT_MINUTES` (90) zamiast realnego zegara. Dzięki temu problem nie wraca.
- `historyStore.repairRunawayDurations()` — jednorazowa naprawa istniejącej historii przy pierwszym wczytaniu, chroniona flagą `gym_runaway_fix_v1`. Import kopii zapasowej kasuje tę flagę, żeby przywrócone dane też przeszły naprawę.

Nie zmieniaj `getAttendanceStats` na medianę — średnia jest wiarygodna dopóki obie warstwy działają.

### Utilities w calculations.ts

Czyste funkcje bez zależności od React/stores — łatwo testowalne:
- `epley1RM(weightKg, reps)` — formuła Epley
- `calcVolume` / `getTotalVolume` — wolumen
- `getWorkoutDuration(workout)` — minuty
- `checkNewPRs(set, existingPRs, ...)` — zwraca `NewPREvent[]`
- `calculateStreak(workouts)` — aktualny streak (dni), liczony na datach lokalnych
- `getAttendanceStats(workouts)` — frekwencja od początku (patrz sekcja wyżej)

`plPlural(n, one, few, many)` w `src/utils/dates.ts` obsługuje polską odmianę liczebników (1 dzień / 2 dni / 22 treningi / 12 treningów). Używaj go zamiast `n === 1 ? … : …` — inaczej wychodzi "1 dni z rzędu".

### Dźwięk

`src/utils/whoosh.ts` — Web Audio API helper (lazy AudioContext). Generuje syntetyczny whoosh (noise burst + bandpass sweep). Używany w `WorkoutCompletionOverlay`. Failuje cicho jeśli AudioContext niedostępny (iOS wymaga user gesture — w tym kontekście zawsze jest).

### Recharts

`ExerciseChart` wymaga wrappera z explicit height:
```tsx
<div className="h-60 w-full">
  <ResponsiveContainer width="100%" height="100%">
```
`isAnimationActive={false}` na wszystkich `<Line>` — animacje SVG są wolne na iOS. Dane obliczane przez `useMemo` z historii workoutów.
