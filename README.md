# Gym Tracker — Nunek & Nuna

Progresywna aplikacja webowa (PWA) do śledzenia treningów dla dwóch profili. Działa w 100% offline — dane przechowywane lokalnie w localStorage.

## Jak uruchomić lokalnie

```bash
cd gym-tracker
npm install
npm run dev
```

Aplikacja startuje na `http://localhost:5173`.

## Jak zbudować

```bash
npm run build
```

Pliki produkcyjne trafiają do folderu `dist/`. Aplikacja jest w pełni statyczna — można ją hostować na dowolnym CDN.

## Jak działa storage (localStorage)

Wszystkie dane zapisywane są w przeglądarce w klucze o prefixie `gym_`:

| Klucz | Zawartość |
|---|---|
| `gym_profile` | Aktywny profil + status onboardingu |
| `gym_settings` | Ustawienia (timer, motyw, przypięte ćwiczenia) |
| `gym_active_workout` | Aktualny trening (jeśli w toku) |
| `gym_workouts_emil` | Historia treningów Emila (tablica JSON) |
| `gym_workouts_nikola` | Historia treningów Nikoli (tablica JSON) |
| `gym_prs_emil` | Rekordy osobiste Emila |
| `gym_prs_nikola` | Rekordy osobiste Nikoli |
| `gym_custom_exercises` | Własne ćwiczenia dodane przez użytkownika |

Dane można wyeksportować/zaimportować z zakładki **Ustawienia → Dane**.

## Jak dodać własne ćwiczenia

### Z poziomu UI

1. Przejdź do zakładki **Ustawienia**
2. Przewiń do sekcji **Własne ćwiczenia**
3. Kliknij **+ Dodaj własne ćwiczenie**
4. Wypełnij formularz (nazwa PL/EN, kategoria, sprzęt)
5. Opcjonalnie zaznacz **Tylko dla mnie** (ownerId)

### W kodzie

Aby dodać ćwiczenie na stałe do domyślnej listy, edytuj plik `src/constants/exercises.ts`:

```ts
{
  id: 'moje-cwiczenie',          // unikalny slug
  name: 'Moje ćwiczenie',       // nazwa po polsku
  nameEn: 'My Exercise',         // nazwa po angielsku
  category: 'klatka',            // jedna z 8 kategorii
  equipment: 'hantle',           // sztanga | hantle | maszyna | wolny
  isCustom: false,
}
```

## Wdrożenie na Vercel

1. Wypchnij kod na GitHub (lub inny serwis Git)
2. Zaloguj się na [vercel.com](https://vercel.com)
3. Kliknij **Add New → Project → Import Git Repository**
4. Wybierz repozytorium `gym-tracker`
5. Vercel automatycznie wykryje Vite — kliknij **Deploy**
6. Po wdrożeniu wejdź na URL z iPhone i dodaj do ekranu głównego:
   - Safari → przycisk udostępniania → **Dodaj do ekranu głównego**
   - Aplikacja uruchomi się jako pełnoekranowa PWA

## Propozycje kolejnych funkcji

1. **Szablony treningów** — zapisywanie zestawów ćwiczeń jako gotowy plan dnia (np. "Klatka + Triceps"), który można szybko wczytać na początku treningu
2. **Powiadomienia push** — przypomnienie o treningu o ustalonej porze (wymaga Service Workera i subskrypcji push)
3. **Synchronizacja przez QR** — eksport stanu aplikacji jako QR code, który można zeskanować na innym urządzeniu (bez backendu, przez URL)
4. **Wykresy tygodniowe/miesięczne** — widok kalendarza z zaznaczonymi dniami treningowymi i heatmapą intensywności
5. **Kalkulator 1RM i plan periodyzacji** — na podstawie historii sugeruje następny docelowy ciężar używając wzoru Epley'a i progresji liniowej
