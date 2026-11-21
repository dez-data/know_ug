# Project Spec: Know Before You Go (working name)

**Hackathon theme:** AI for Local Impact
**Builder:** Solo. Build window 2:50 PM to 4:05 PM EAT (about 75 minutes, submit by 3:55 PM for a buffer)
**Tools:** Built in Cursor. Translation via the Sunbird AI Sunflower API.

---

## 1. Problem

Ugandans often visit government offices without knowing exactly which documents, fees, and steps are required. They get turned back, lose a day's wages and transport money, and must return. Most official information is in English and scattered across agency websites, while many people live in Luganda, Runyankole, Acholi, Ateso, Lugbara, or Swahili.

## 2. Solution (one sentence)

A mobile-first web app that gives a personalised, tick-off document checklist for a government process and translates it into the user's own Ugandan language using Sunbird's Sunflower model.

## 3. MVP scope

**In scope**
- 3 processes only: National ID (NIRA), Passport, and URSB business name registration. If one is hard to verify, swap in Birth Certificate.
- Process picker, 2 short questions per process, personalised checklist.
- Language selector: English plus 3 to 4 Ugandan languages (Luganda, Runyankole, Acholi, Ateso; final list to be decided before the build).
- Checklist translated via Sunflower, with caching and English fallback.
- Source link and "last verified" date on every process.
- Copy/share-to-WhatsApp button.

**Out of scope (mention as roadmap only)**
- Tourism sites, lands, immigration beyond passports, local government services
- Accounts or login, database, admin panel
- Maps, search, free-text AI matching, WhatsApp/USSD bot
- Voice input or output

## 4. User flow

1. Landing screen: short headline, language selector, 3 process cards.
2. User taps a process.
3. Question screen: 2 short questions (for example, "First-time application or replacement/renewal?" and "Applicant is an adult or a minor?"). Questions depend on the process.
4. Result screen:
   - Process name, who it applies to
   - **Documents required** (checkbox list the user can tick off)
   - **Fees**
   - **Where to go**
   - **Expected timeline**
   - **Common reasons for rejection**
   - **Source link** and **Last verified** date
   - Buttons: Copy checklist, Share on WhatsApp, Change language
5. If a language other than English is selected, the result content is translated (see section 6).

## 5. Data model

All content lives in one static data file in the repo (English only). Do not fetch it from anywhere.

**Process**
- `id`, `name`, `agency`, `description`
- `questions`: list of questions, each with `id`, `text`, and `options` (each option has `id` and `label`)
- `variants`: list of requirement sets, each keyed by the combination of answers that selects it
  - `documents`: list of strings
  - `fees`: string
  - `where`: string
  - `timeline`: string
  - `rejectionReasons`: list of strings
- `sourceUrl`
- `lastVerified` (date)

**Content rules**
- All requirement content comes from the verified notes file the builder will paste in. Do not invent, guess, or fill in fees, documents, or timelines. If a field is missing, show "Confirm at the office" for that field.
- Placeholders are marked `TODO_VERIFIED_CONTENT` until the real content is pasted in.

## 6. Translation layer (Sunbird Sunflower)

- Endpoint: `POST https://api.sunbird.ai/tasks/translate`
- Authentication required (token). Read https://docs.sunbird.ai for the exact request and response format and the language codes (ISO codes such as `lug`). Do not assume the format; follow the docs.
- The API token must **never** be exposed in the browser. Call Sunbird from a server-side route or serverless function in the app, and read the token from an environment variable.

**Behaviour**
1. Translate only the user-facing instruction text (documents, where, timeline, rejection reasons, question text, UI labels that are fixed).
2. Do **not** translate: agency names and acronyms (NIRA, URSB), official form names, document titles that people know by their English name, and fee amounts and numbers. Keep these as written, inside the translated sentence.
3. Cache each translation by key (process + variant + language) in memory and local storage so repeat views do not call the API.
4. Show a loading state while translating.
5. If the API fails, times out, or returns empty, show the English version with a clear message ("Translation unavailable, showing English").
6. Always show the label: "Translated by AI. Confirm details at the office."
7. Pre-warm: when the user selects a language, start translating the likely content in the background if time allows. Not required for MVP.

## 7. UI requirements

- Mobile-first, single column, large tap targets, works on a small phone screen.
- Low data: no heavy images, no large libraries, system fonts.
- Clean and calm design. High contrast. Checklist items are large and easy to tick.
- Language selector always visible on every screen.
- Show the source link and last verified date near the top of the result, not hidden at the bottom.

## 8. Suggested tech stack

- Next.js (App Router) with TypeScript, or plain JavaScript if faster for the builder
- One API route for translation (server side, holds the token)
- Static data file for process content
- No database
- Deploy on Vercel (free) and connect to a public GitHub repo
- Environment variable: `SUNBIRD_API_TOKEN`

## 9. Build order (time boxes)

| Time (EAT) | Task |
|---|---|
| 2:50 to 3:05 | Scaffold the app, create the data file structure, set up the env variable, confirm the app runs |
| 3:05 to 3:30 | Build the landing screen, process picker, question flow, and English checklist result using the verified content |
| 3:30 to 3:45 | Add the translation route, language selector, caching, loading state, and English fallback |
| 3:45 to 3:55 | Mobile check, fix bugs, write the README, deploy, push to GitHub |
| 3:55 to 4:05 | Record the 2-minute demo (or confirm the live link), fill in and send the submission form |

**Rule for the builder:** if anything slips, cut features in this order: share button, background pre-warm, extra languages, third process. Never cut the English fallback or the source and last verified label.

## 10. Definition of done

- Three processes work end to end in English.
- At least one Ugandan language translates a full checklist live.
- English fallback works when translation is forced to fail.
- Source and last verified date visible on every result.
- Deployed link works on a phone.
- Public GitHub repo with README.

## 11. Demo script (about 90 seconds)

1. State the problem: one failed office visit costs a day's wages.
2. Open on a phone-sized screen. Pick National ID, answer 2 questions, show the checklist in English.
3. Switch the language to Luganda. Show the translated checklist with AI label and source.
4. Point out the trust features: source link, last verified date, English fallback.
5. Roadmap: more agencies, WhatsApp/USSD access, user-submitted corrections, agency partnerships.

## 12. Submission checklist

- [ ] Public GitHub repo with README
- [ ] Live link or demo video (2 minutes max)
- [ ] Submission form: name, project name, theme (AI for Local Impact), repo link, demo link
- [ ] Submitted before 4:05 PM EAT

## 13. First prompt to give Cursor

> Read PROJECT_SPEC.md fully. Scaffold a Next.js app that follows sections 3 to 8. Create the static data file structure from section 5 with `TODO_VERIFIED_CONTENT` placeholders, the process picker and question flow, and a server-side translation route for the Sunbird API (read docs.sunbird.ai for the request format; token from the `SUNBIRD_API_TOKEN` environment variable). Do not invent any requirement, fee, or timeline content. Start with the scaffold and the English flow, then ask me before adding translation.

---

## Before 2:50 PM (preparation, no code)

- Verified English requirements for 3 processes, each with a source URL and verification date
- Sunbird account created, API token ready, one test call done outside the project
- Final list of 3 to 4 languages chosen
- Empty public GitHub repo created
- Pitch outline written
- Confirm with the organizers that a prepared content file may be added during the build window
