**Pubquiz Factory**

Opsætningsguide v4

*Fra tom bærbar til første linje app-kode*

**Fag:** AI-agenter og automatisering, Mobile Development og Machine Learning

**Version:** 4 — 20. november 2026 (lokalt på den bærbare, Firebase, Neo4j og fabrikkens flow)

# 0. Sådan bruger du guiden

Guiden er skrevet, så du laver det hele selv. Hvert trin fortæller **hvad** du skal gøre og **hvorfor**, så du kan forklare opsætningen til eksamen.

- **Blå bjælke over en kommando** fortæller, hvor den skal køres, fx PowerShell (i repo-mappen).
- **Ord med STORE BOGSTAVER** som DIN-HEMMELIGHED skal du udskifte med dine egne værdier.
- **Grøn boks "Færdig når"** afslutter hver del. Gå ikke videre, før alle punkter er krydset af.
- **Orange boks** er en vigtig advarsel. **Blå boks** forklarer et designvalg.

**Nyt i version 4**

Alt kører **lokalt på din bærbare** i Docker — ingen server endnu. Serveren er flyttet til Bilag C.

**Neo4j** kører i Docker sammen med n8n, Ollama og PostgreSQL og bruges til RAG.

**Firebase** er appens database (brugere, logbog, ratings og quizzer).

Tilmelding er altid **et link til quizstedets egen side** — ingen mail- eller SMS-knapper.

Ny del 7 beskriver **fabrikkens flow**: admin-prompt → plan → godkendelse → implementering → PR.

Machine Learning venter. RAG implementeres stadig.

## Overblik: hvad kører hvor

| **Del** | **Kører på** | **Bruges til** |
|---|---|---|
| n8n + PostgreSQL | Docker på din bærbare | Fabrikkens workflows |
| Ollama (nomic-embed-text) | Docker på din bærbare | Embeddings til RAG |
| Neo4j | Docker på din bærbare | RAG: lignende quizzer, tag-forslag, dublet-tjek |
| Firebase (Firestore + Authentication) | Googles sky | Appens database og login |
| Gemini API | Google (gratis niveau) | AI-trinnet: admin-prompt → plan/spec |
| GitHub Issues + labels | GitHub | Opgavetavlen — label = state |
| GitHub Actions + Claude Code | GitHub | Runneren (Basic B), validering og synk til Firestore |
| GitHub Pages | GitHub | Admin-siden og factory board |
| Pubquiz-appen (Expo) | Telefonen via Expo Go | Brugersiden |

**Hvorfor brugerne ikke mærker, når din bærbare er slukket**

Appen læser kun fra Firebase. Fabrikken (n8n, Ollama, Neo4j) på din bærbare bruges kun, når admin tilføjer eller ændrer quizzer. Så kan den bærbare være slukket, uden at appen holder op med at virke.

## Sprog pr. del

| **Del** | **Sprog** |
|---|---|
| Pubquiz-appen | React Native i JavaScript (.js-filer, ingen TypeScript) |
| Admin-side og factory board (GitHub Pages) | HTML, CSS og JavaScript |
| n8n Code-noder, validering og synk-script | JavaScript |
| Data og opsætning (JSON, compose-fil, GitHub Actions) | Konfigurationsformater — ikke programmeringssprog |

## Rækkefølge

| **Del** | **Indhold** |
|---|---|
| 1 | Konti og værktøjer |
| 2 | GitHub-repoet: struktur, labels, regler og nøgler |
| 3 | Docker-stakken på den bærbare: n8n, PostgreSQL, Ollama og Neo4j |
| 4 | Gemini koblet til n8n |
| 5 | Firebase-projektet |
| 6 | Start på appen |
| 7 | Fabrikkens flow (designet, du bygger efter) |
| 8 | Hvad der kommer bagefter |

# 1. Konti og værktøjer

Gem alle adgangskoder og nøgler i en password manager — **aldrig i repoet**, da det er offentligt.

| **Tjeneste / værktøj** | **Bruges til** | **Bemærkning** |
|---|---|---|
| GitHub | Repo, Issues, Actions, Pages | Du har den allerede |
| Docker Desktop | Kører n8n, PostgreSQL, Ollama og Neo4j | Installeres i del 3 |
| Google AI Studio | Gemini API-nøgle | Gratis niveau |
| Firebase (console.firebase.google.com) | Appens database og login | Log ind med din Google-konto |
| Expo Go | Kør appen på telefonen | App Store / Google Play |

Tjek at disse værktøjer er installeret på din bærbare:

**PowerShell (din bærbare)**

```powershell
node -v
git --version
gh --version
claude --version
```

Mangler gh, så installer den med `winget install --id GitHub.cli` og log ind med `gh auth login`.

**Færdig når**

☐ Konti er oprettet

☐ Alle fire værktøjer viser en version

# 2. GitHub-repoet

## 2.1 Opret repoet

**PowerShell (din projektmappe)**

```powershell
gh repo create pubquiz-factory --public --clone
cd pubquiz-factory
$folders = "docs", "factory\n8n-workflows", "factory\prompts", "factory\architecture", "scripts", ".github\workflows"
$folders | ForEach-Object { New-Item -ItemType Directory -Path $_ -Force | Out-Null; New-Item -ItemType File -Path "$_\.gitkeep" -Force | Out-Null }
Add-Content .gitignore "factory/.env"
```

Git gemmer ikke tomme mapper, derfor .gitkeep. Sidste linje sørger for, at filen med dine hemmeligheder (del 3) aldrig kommer med i repoet.

| **Mappe** | **Indhold** |
|---|---|
| app/ | Expo-appen (laves i del 6) |
| docs/ | GitHub Pages: admin-side + factory board |
| factory/ | docker-compose.yml, n8n-workflows som JSON, prompts og arkitekturdiagram |
| scripts/ | Validering af quizzes.json og synk til Firestore (JavaScript) |
| .github/workflows/ | GitHub Actions: runner, validering og synk |

## 2.2 Labels (fabrikkens states)

**Orange** = admin skal handle, **lilla** = AI arbejder, **rød** = fejl, **grøn** = færdig.

**PowerShell (i repo-mappen)**

```powershell
gh label create "Ideas" --color "F9A825" --description "Admin-prompt modtaget"
gh label create "Refining" --color "7E57C2" --description "AI-trinnet laver planen"
gh label create "Ready for approval" --color "F9A825" --description "Venter på admins godkendelse af planen"
gh label create "Approved" --color "F9A825" --description "Plan godkendt, venter på agenten"
gh label create "Building" --color "7E57C2" --description "Coding-agenten arbejder"
gh label create "Waiting for you" --color "F9A825" --description "Agenten har et spørgsmål"
gh label create "Stuck" --color "C62828" --description "Agenten fejlede eller brugte over 30 min"
gh label create "Your QA" --color "F9A825" --description "PR klar til review"
gh label create "Done" --color "2E7D32" --description "PR merget eller issue lukket"
```

## 2.3 Beskyt main-branchen

**Settings** → **Rules** → **Rulesets** → **New branch ruleset**:

- Target: **default branch** (main).
- Slå **Require a pull request before merging** og **Block force pushes** til.
- Tilføj dig selv (**Repository admin**) under **Bypass list**, så du kan pushe din egen app-kode direkte, mens agenten skal igennem en PR.

## 2.4 Nøgler

| **Nøgle** | **Sådan laver du den** | **Gemmes** |
|---|---|---|
| GitHub-token til n8n | Settings → Developer settings → Fine-grained tokens. Kun repoet pubquiz-factory. Issues, Pull requests og Actions: Read and write. Contents: Read-only. Udløb fx 90 dage | Credential i n8n (del 4) |
| Claude-token til Actions | Kør claude setup-token i PowerShell | Repository secret CLAUDE_CODE_OAUTH_TOKEN |

## 2.5 GitHub Pages

Lav en midlertidig docs/index.html med overskriften "Pubquiz Factory — kommer snart" og push:

**PowerShell (i repo-mappen)**

```powershell
git add .
git commit -m "Repo-struktur"
git push
```

**Settings** → **Pages** → **Deploy from a branch** → main, mappe /docs. Siden ligger på https://simabild.github.io/pubquiz-factory/.

**Færdig når**

☐ Repoet er offentligt med mappestrukturen og factory/.env i .gitignore

☐ Alle 9 labels findes

☐ Rulesettet er aktivt

☐ Claude-tokenet ligger som repository secret

☐ GitHub Pages-siden kan åbnes

# 3. Docker-stakken på den bærbare

## 3.1 Installer Docker Desktop

**PowerShell (din bærbare)**

```powershell
winget install -e --id Docker.DockerDesktop
```

Genstart, hvis den beder om det, og start Docker Desktop. Den bruger WSL 2, som du allerede har. Tjek at det virker:

**PowerShell (din bærbare)**

```powershell
docker --version
docker compose version
```

## 3.2 Lav tre hemmeligheder

Kør denne linje tre gange, og gem de tre værdier:

**PowerShell (din bærbare)**

```powershell
$b = New-Object byte[] 32; [Security.Cryptography.RandomNumberGenerator]::Create().GetBytes($b); ($b | ForEach-Object { $_.ToString('x2') }) -join ''
```

Opret filen factory/.env med dem (filen er i .gitignore):

**factory/.env**

```
POSTGRES_PASSWORD=DIN-FØRSTE-HEMMELIGHED
N8N_ENCRYPTION_KEY=DIN-ANDEN-HEMMELIGHED
NEO4J_PASSWORD=DIN-TREDJE-HEMMELIGHED
```

**Krypteringsnøglen må aldrig ændres**

n8n krypterer alle credentials med N8N_ENCRYPTION_KEY. Skifter den, kan n8n ikke længere læse dem. Brug den samme nøgle, når du senere flytter til en server.

## 3.3 Compose-filen

Opret factory/docker-compose.yml. Filen ligger i repoet, så hele opsætningen er versioneret og kan flyttes til en server senere:

**factory/docker-compose.yml**

```yaml
services:
  postgres:
    image: postgres:16
    restart: unless-stopped
    environment:
      POSTGRES_USER: n8n
      POSTGRES_PASSWORD: ${POSTGRES_PASSWORD}
      POSTGRES_DB: n8n
    volumes:
      - postgres_data:/var/lib/postgresql/data

  ollama:
    image: ollama/ollama:latest
    restart: unless-stopped
    volumes:
      - ollama_data:/root/.ollama

  neo4j:
    image: neo4j:5
    restart: unless-stopped
    environment:
      NEO4J_AUTH: neo4j/${NEO4J_PASSWORD}
    ports:
      - "127.0.0.1:7474:7474"
      - "127.0.0.1:7687:7687"
    volumes:
      - neo4j_data:/data

  n8n:
    image: docker.n8n.io/n8nio/n8n:latest
    restart: unless-stopped
    depends_on:
      - postgres
    environment:
      DB_TYPE: postgresdb
      DB_POSTGRESDB_HOST: postgres
      DB_POSTGRESDB_PORT: 5432
      DB_POSTGRESDB_DATABASE: n8n
      DB_POSTGRESDB_USER: n8n
      DB_POSTGRESDB_PASSWORD: ${POSTGRES_PASSWORD}
      N8N_ENCRYPTION_KEY: ${N8N_ENCRYPTION_KEY}
      WEBHOOK_URL: http://localhost:5678/
      GENERIC_TIMEZONE: Europe/Copenhagen
      TZ: Europe/Copenhagen
      EXECUTIONS_DATA_PRUNE: "true"
      EXECUTIONS_DATA_MAX_AGE: 168
    ports:
      - "127.0.0.1:5678:5678"
    volumes:
      - n8n_data:/home/node/.n8n

volumes:
  postgres_data:
  ollama_data:
  neo4j_data:
  n8n_data:
```

| **Del af filen** | **Hvorfor** |
|---|---|
| 127.0.0.1: foran portene | Kun din bærbare kan åbne n8n og Neo4j — ikke andre på skolens eller caféens Wi-Fi |
| Ingen porte på PostgreSQL og Ollama | Kun n8n skal tale med dem, og det sker på Docker's interne netværk via navnene postgres og ollama |
| ${...} | Værdierne hentes fra .env, så hemmelighederne ikke står i en fil i repoet |
| volumes | Data overlever genstart og opdateringer |
| EXECUTIONS_DATA_PRUNE / MAX_AGE: 168 | Sletter kørsler ældre end 7 dage |
| restart: unless-stopped | Containerne starter igen, når Docker Desktop starter |

**Neo4j-adgangskoden**

Neo4j kræver mindst 8 tegn. Din hemmelighed fra 3.2 er 64 tegn, så den er fin.

## 3.4 Start stakken

**PowerShell (i repo-mappen)**

```powershell
cd factory
docker compose up -d
docker compose ps
```

docker compose ps skal vise alle fire containere som kørende. Første gang tager det et par minutter at hente billederne.

## 3.5 Test hver del

1. **n8n:** åbn http://localhost:5678 og opret din ejerkonto.
2. **Neo4j:** åbn http://localhost:7474, log ind med brugeren neo4j og din NEO4J_PASSWORD.
3. **Ollama-modellen:** kør `docker compose exec ollama ollama pull nomic-embed-text` i factory-mappen.
4. **n8n → Ollama:** lav et workflow med en HTTP Request-node: POST http://ollama:11434/api/embed, body `{"model": "nomic-embed-text", "input": "pubquiz tirsdag"}`. Svaret skal have 768 tal.
5. **n8n → Neo4j:** HTTP Request POST http://neo4j:7474/db/neo4j/query/v2 med en Basic Auth-credential (neo4j + din adgangskode) og body `{"statement": "RETURN 1 AS test"}`. Svaret skal indeholde 1.

Bemærk at n8n bruger navnene ollama og neo4j — ikke localhost eller host.docker.internal som i opskrift-RAG-projektet — fordi de nu ligger i samme compose-fil.

**PowerShell (i factory-mappen)**

```powershell
git add docker-compose.yml
git commit -m "Docker-stak: n8n, PostgreSQL, Ollama og Neo4j"
git push
```

**Færdig når**

☐ Alle fire containere kører

☐ n8n og Neo4j kan åbnes i browseren

☐ Embedding-testen giver 768 tal

☐ Neo4j-testen giver 1

☐ .env er IKKE kommet med i commit'et (tjek med git status)

# 4. Gemini koblet til n8n

1. Opret en **API-nøgle** i Google AI Studio.
2. I n8n: **Credentials** → **New** → søg på Gemini, og indsæt nøglen.
3. Test: et workflow med en **Basic LLM Chain** og en **Google Gemini Chat Model**. Prompt: Skriv én sætning om pubquiz på dansk.
4. Gem også GitHub-tokenet fra del 2.4 som en **GitHub API**-credential.

**Gratis niveau = data bruges til træning**

Googles gratis niveau bruger indholdet til at forbedre deres produkter. Fint for offentlig quiz-info — men send aldrig persondata eller hemmeligheder igennem. Nævn det i rapportens sikkerhedsafsnit.

**Færdig når**

☐ Gemini svarer med en dansk sætning

☐ Gemini- og GitHub-credentials ligger i n8n

# 5. Firebase-projektet

Firebase bliver appens database og login. Du opretter projektet nu og kobler appen på, når du kommer til Logbook.

1. Gå til Firebase-konsollen og opret et projekt, fx pubquiz. Google Analytics kan du slå fra.
2. **Firestore Database** → opret databasen, vælg en placering i Europa, og start i **production mode** (lukket for alt, til du skriver sikkerhedsregler).
3. **Authentication** → slå **Email/Password** til.
4. **Project settings** → tilføj en **Web-app** for at få konfigurationen (apiKey, projectId osv.), som appen skal bruge senere.

| **Samling i Firestore** | **Indhold** | **Hvem skriver** |
|---|---|---|
| quizzes | Kopi af quizzes.json | Kun synk-Actionen efter merge (del 7). Brugere kan kun læse |
| users/{uid}/participations | Logbogsposter: quiz, dato, placering, holdnavn, rating, fotos | Kun brugeren selv |
| Rating pr. quiz | Gennemsnit og antal | Beregnes ud fra logbogens ratings |

**Fotos kræver Blaze-planen**

Login og Firestore virker på den gratis plan. Men Cloud Storage (til logbogens fotos) kræver Blaze-planen for nye projekter siden februar 2026. Blaze har et gratis forbrug, men kræver et betalingskort. Vent med at slå det til, til du bygger fotos i Logbook — og sæt en budgetalarm, når du gør.

**Firebase-konfigurationen er ikke en hemmelighed**

apiKey i web-konfigurationen må gerne stå i appen — sikkerheden kommer fra Firestores sikkerhedsregler. Det, der ER hemmeligt, er service account-nøglen, som synk-Actionen skal bruge senere. Den lægges kun som GitHub-secret.

**Færdig når**

☐ Projektet findes med Firestore (production mode) og Email/Password-login

☐ Web-app-konfigurationen er fundet

# 6. Start på appen

Bygger på din UI-skitse (claude/pubquiz-app-ui-skitse.md) og dit quiz-ark med 18 quizzer mandag–torsdag.

## 6.1 Opret Expo-projektet i JavaScript

Expos standard- og tabs-skabeloner bruger TypeScript, så du starter med blank, som er JavaScript:

**PowerShell (i repo-mappen)**

```powershell
npx create-expo-app@latest app --template blank
```

**PowerShell (i repo-mappen)**

```powershell
Test-Path app\.git
# Skriver den True, så fjern det indre repo:
Remove-Item -Recurse -Force app\.git
```

## 6.2 Installer Expo Router

**PowerShell (i repo-mappen)**

```powershell
cd app
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

| **Fil** | **Ændring** | **Hvorfor** |
|---|---|---|
| package.json | "main": "expo-router/entry" | Appen starter via Expo Router i stedet for App.js |
| app.json | "scheme": "pubquiz" og "plugins": ["expo-router"] under "expo" | Krævet af Expo Router |
| App.js | Slet den | Bruges ikke længere |

**Brug src/app — ikke app/app**

Expo Router finder skærmene i app/ eller src/app/. Da projektet allerede ligger i mappen app/, så brug src/app/.

## 6.3 Kør appen

Lav en midlertidig src/app/index.js, der viser en tekst, og start appen:

**PowerShell (i app-mappen)**

```powershell
npx expo start --clear
```

Scan QR-koden med kameraet (iPhone) eller Expo Go (Android). Samme Wi-Fi på PC og telefon, ellers `npx expo start --tunnel`.

## 6.4 Fra skitse til filer

| **Skærm i skitsen** | **Fil** | **Bemærkning** |
|---|---|---|
| Fane-navigation | src/app/_layout.js | Tabs fra expo-router |
| **All** | src/app/index.js | Ugestrimmel, filter-chips, quizkort |
| **Calendar** | src/app/calendar.js | Ugens quizrækker |
| **Map** | src/app/map.js | Pins + bundkort med Details og Directions |
| **Logbook** | src/app/logbook.js | Login-gate, liste, "Log a quiz" |
| **Detail** | src/app/quiz/[id].js | Én dynamisk side for alle quizzer — ikke en fane |
| **TagPopup** | src/components/TagPopup.js | Bundark med tag-forklaring |
| Quizkort | src/components/QuizCard.js | Genbruges på All og Calendar |

**Datadrevet app — vigtigt for fabrikken**

Alt, hvad der står om en quiz, skal komme fra dataene, ikke være kodet ind pr. quiz. Så kræver en almindelig ny quiz kun en ændring i quizzes.json, og agenten koder kun i UI'et, når admin beder om noget nyt (fx et sprog-mærke eller et liga-afsnit).

## 6.5 Datamodellen

**app/data/quizzes.json**

```json
[
  {
    "id": "cucaracha-bar",
    "name": "Cucaracha Bar – Golle's Quiz",
    "venue": "Cucaracha Bar",
    "address": null,
    "latitude": null,
    "longitude": null,
    "days": ["Wednesday"],
    "startTime": "19:00",
    "endTime": "21:30",
    "priceDkk": 50,
    "priceNote": "per person",
    "deal": "Free Grøn Tuborg 19:00–20:00",
    "prize": "Prizes for the top 3 teams",
    "signUpType": "sms",
    "signUpUrl": "https://cucaracha.dk/copenhagen/quiz",
    "quizUrl": "https://cucaracha.dk/copenhagen/quiz",
    "tags": ["Deal", "Prize", "SMS sign-up", "First come first served"]
  }
]
```

| **Felt** | **Regel** | **Hvorfor** |
|---|---|---|
| id | Små bogstaver og bindestreger, unik | keyExtractor, detaljesidens adresse og dublet-tjek |
| days | Liste af engelske ugedage | Nogle quizzer kører flere dage. Gør det let at filtrere i ugestrimlen |
| startTime / endTime | "HH:MM" eller null | Ensartet, selvom arket blander formater |
| priceDkk / priceNote | Tal (0 = gratis, null = ukendt) + kort tekst | Kan sorteres og filtreres. Aldrig teksten "Unknown" |
| deal / prize | Tekst eller null | Vises hver for sig, som i skitsen |
| signUpType | online, door, drop-in, email, sms, instagram, tickets, none eller unknown | Bruges til tag og knaptekst, fx "Sign up (via SMS)" |
| signUpUrl | Link til stedets egen side, hvor tilmeldingen står beskrevet | Knappen åbner altid dette link — ingen mail- eller SMS-knapper |
| quizUrl | Link til quizsektionen (kan være det samme som signUpUrl) | "Quiz page" i skitsen — ikke kun forsiden |
| latitude / longitude | Tal eller null | Map og Directions |
| tags | Kun navne fra tags.json | Fast ordforråd, som RAG-trinnet vælger fra |

Lav også app/data/tags.json med skitsens 14 tags og en forklaring til hver (bruges af TagPopup). Rating ligger ikke i filen — den beregnes i Firebase ud fra logbøgerne.

**Til at starte med importerer appen quizzes.json direkte.** Når synk til Firestore er på plads (del 7), skifter du til at læse fra Firestore — dataene har samme form, så skærmene behøver ikke ændres.

## 6.6 Ryd op i data, før du taster ind

- **Basement mandag "00:00 (?)"** → startTime: null, til det er afklaret.
- **Grisen og Vestergade 17 "150 kr (incl. free draught)"** → priceDkk: null og en priceNote, til du ved, om det er prisen.
- **Kapiche** — tirsdag eller onsdag? Og linket skifter med hvert nummer.
- **Adresser** mangler for de fleste → null, til du har fundet dem.
- **Links til forsiden** (Søhesten, The Moose) → find quizsektionen.

## 6.7 Din første opgave: All-fanen

1. Læg 3–4 quizzer fra arket ind i quizzes.json.
2. **Ugestrimmel:** syv dage med antal quizzer pr. dag. Den valgte dag i useState.
3. **Liste:** kun quizzer, hvor days indeholder den valgte dag. FlatList med id i keyExtractor.
4. **Tom dag:** ListEmptyComponent med "No quizzes added yet".
5. **QuizCard:** navn, tid, pris og højst 3 tags + "+N".
6. **Tryk på et kort:** naviger til quiz/[id].

Sidder du fast, så spørg efter et hint til det konkrete trin.

**PowerShell (i repo-mappen)**

```powershell
git add .
git commit -m "Expo-app med All-fane, quizzes.json og tags.json"
git push
```

**Færdig når**

☐ Appen kører på telefonen

☐ All-fanen viser ugestrimlen og quizzerne for den valgte dag

☐ Fredag–søndag viser "No quizzes added yet"

☐ quizzes.json og tags.json følger modellen

☐ Koden er pushet

# 7. Fabrikkens flow

Det her er designet, du bygger fabrikken efter i de næste uger. Admin beskriver i sin prompt, hvad der skal ske — også om frontenden skal ændres — og AI'en svarer med en plan, før der skrives kode.

## 7.1 Fra admin-prompt til quiz i appen

| **Trin** | **Hvad sker der** | **Label** |
|---|---|---|
| 1 | Admin skriver prompten på admin-siden (GitHub Pages), fx: "Ny quiz på Proud Mary, torsdag 19–21, gratis, på engelsk. Lav et English-tag." + link. n8n opretter et issue | Ideas |
| 2 | **AI-trinnet** (Gemini + RAG): skriver planen som kommentar — "sådan har jeg forstået det" — med data-ændringer, UI-ændringer, foreslåede tags og evt. spørgsmål | Refining → Ready for approval |
| 3 | **Godkendelse 1:** admin godkender planen — eller kommenterer, så AI'en laver den om | Approved |
| 4 | **Coding-agenten** (Claude Code) implementerer på branch issue-N, kører valideringen og slutter med DONE, QUESTION eller STUCK | Building |
| 5 | Har agenten et spørgsmål, kommer det som kommentar. Over 30 min eller fejl → Stuck | Waiting for you / Stuck |
| 6 | **Godkendelse 2:** agenten laver en PR. Admin tester ændringen i Expo og merger | Your QA |
| 7 | Efter merge: GitHub Action synker quizzes.json til Firestore, og n8n skriver quizzen ind i Neo4j | Done |

**To godkendelser, ikke én**

Planen godkendes, før agenten bruger tid på den, og resultatet godkendes, før det kommer i appen. Fejl i forståelsen fanges i trin 3 i stedet for i PR'en.

## 7.2 Planen AI'en skriver (spec-skabelonen)

| **Felt** | **Indhold** |
|---|---|
| Forståelse | Én til to sætninger: hvad admin har bedt om |
| Quiz-data | Alle felter fra datamodellen, udfyldt fra prompten og linket. Ukendt = null |
| Kilder | Hvor hver oplysning kommer fra (prompten eller stedets side) |
| Tags | Fra tags.json. Nyt tag kun, hvis admin har bedt om det |
| UI-ændring | Ja/nej — og i så fald hvilken (fx "sprog-mærke på QuizCard") |
| Lignende quizzer (RAG) | De mest lignende quizzer fra Neo4j og om det kan være en dublet |
| Spørgsmål | Højst 3 — kun det, der mangler for at kunne bygge |
| Acceptkriterier | Fx "valideringen består", "vises under Thursday", "English-tag vises med forklaring" |

## 7.3 RAG i fabrikken

- **Under refining er Neo4j kun til læsning:** AI-trinnet embedder admins tekst med Ollama og finder de mest lignende quizzer — til tag-forslag og dublet-tjek.
- **Quizzen skrives først ind i Neo4j efter merge.** Så påvirker ugodkendte eller forkerte quizzer ikke de næste forslag.

## 7.4 Eksempler på opgaver (mindst 5 til afleveringen)

| **Opgave** | **Data** | **UI** |
|---|---|---|
| Ny quiz uden noget særligt (fx Rabalder) | Ja | Nej |
| Proud Mary på engelsk + "lav et English-tag" | Ja + nyt tag i tags.json | Mærket vises via data |
| Dialekt: liga over 6 aftener | Ja | Nyt liga-afsnit på detaljesiden |
| Proud Mary: hold på 2–6 personer | Nyt felt | Visning af holdstørrelse |
| Første weekend-quiz | Ja | Calendar skal kunne vise weekenden |
| Samme quiz indsendt igen | — | AI'en skal opdage dubletten |
| Quiz uden tidspunkt | — | AI'en skal spørge i stedet for at gætte |

## 7.5 Sikkerhed og kvalitet (til rapporten)

| **Tiltag** | **Hvorfor** |
|---|---|
| Hemmelig nøgle på admin-sidens webhook | GitHub Pages er offentlig — ellers kan alle oprette opgaver |
| n8n tjekker, at issuet er oprettet af dig | Opgaven: "only tasks written by you" |
| AI-trinnet returnerer fast JSON, som valideres | Mindre risiko for opfundne detaljer og prompt injection fra stedets hjemmeside |
| CLAUDE.md: hvilke filer agenten må ændre | Data og app-komponenter ja — package.json og Firebase-opsætning kun efter at have spurgt |
| Validerings-Action på hver PR (JavaScript) | Tjekker felter, unikke id'er og at tags findes i tags.json |
| Firestore-regler: quizzer er skrivebeskyttede for brugere | Kun synk-Actionen må skrive quizzer. Én rating pr. deltagelse |
| Ingen merge til main uden PR | Rulesettet fra del 2.3 |

## 7.6 Det, der skal bygges senere

- **Geokodning:** et trin i n8n, der laver adressen om til koordinater, så nye quizzer kommer på kortet.
- **Opdatering og arkivering** af quizzer — ikke kun tilføjelse.
- **Tjek af forældede links:** et planlagt workflow, der opretter et issue, hvis en quizUrl holder op med at virke (godt til Advanced).
- **Målinger til evalueringen:** tid i hver state, antal spørgsmål, afvisninger, og om tag-forslagene var rigtige.

# 8. Hvad der kommer bagefter

| **Uge** | **Opgaver** |
|---|---|
| 18.–24. nov | Del 1–6. Spec-skabelon og AI-prompt i factory/prompts/. Workflow 1 (Refine) med Gemini + RAG |
| 25. nov–1. dec | Basic A: første opgaver igennem (du starter agenten selv). Admin-siden på GitHub Pages. Validerings-Action |
| 2.–8. dec | Basic B: runner i GitHub Actions. Synk til Firestore. Neo4j opdateres efter merge. Factory board |
| 9.–16. dec | Evaluering og rapport (max 5 sider). Aflevering medio december |
| Senere | Machine Learning. Evt. flytning til server (Bilag C) |

## Husk at spørge underviserne

- **AI-agenter:** tæller et GitHub Actions-workflow som "runner"? Og er quiz-tilføjelser med lejlighedsvise UI-ændringer nok som fabrikkens opgaver?
- **Mobile Development:** er det i orden, at nogle app-ændringer laves af fabrikkens agent?

# Bilag A: Hvor ligger hvilken hemmelighed

| **Hemmelighed** | **Hvor den gemmes** |
|---|---|
| POSTGRES_PASSWORD, N8N_ENCRYPTION_KEY, NEO4J_PASSWORD | factory/.env (i .gitignore) + password manager |
| n8n ejerkonto | Password manager |
| Gemini API-nøgle | Credential i n8n |
| GitHub fine-grained token | Credential i n8n |
| CLAUDE_CODE_OAUTH_TOKEN | GitHub repository secret |
| Firebase service account-nøgle (senere) | GitHub repository secret |

**Hovedregel**

Repoet er offentligt. Intet fra denne tabel må nogensinde committes. Tjek altid git status, før du committer i factory/.

# Bilag B: Fejlfinding

| **Problem** | **Sandsynlig årsag og løsning** |
|---|---|
| docker compose up fejler | Docker Desktop er ikke startet. Start den og prøv igen |
| n8n: "credentials could not be decrypted" | N8N_ENCRYPTION_KEY er ændret. Sæt den oprindelige værdi tilbage |
| n8n kan ikke nå Ollama eller Neo4j | Brug http://ollama:11434 og http://neo4j:7474 — ikke localhost |
| Neo4j vil ikke starte | Adgangskoden er under 8 tegn, eller NEO4J_AUTH er skrevet forkert |
| Expo-appen vil ikke forbinde | Ikke samme Wi-Fi. Brug npx expo start --tunnel |
| .env er kommet med i et commit | Skift alle tre hemmeligheder med det samme, fjern filen fra repoet, og tjek .gitignore |

# Bilag C: Senere — flyt til en server

Når fabrikken skal være tilgængelig hele tiden eller vises frem som portefølje, flytter du stakken til en server. Den fulde gennemgang står i v3 af guiden (del 2–6). Kort fortalt:

1. Vælg en server: **Hetzner CX23** (ca. 56 kr/md., når den er på lager) eller **OVHcloud VPS-1** (ca. 39 kr/md.). Ubuntu 24.04, månedlig betaling.
2. Log ind med din SSH-nøgle, opdater, slå firewallen til og password-login fra.
3. Installer Dokploy og giv det HTTPS med et gratis DuckDNS-navn.
4. Brug den samme docker-compose.yml, men skift ports ud med expose + dokploy-network, og sæt WEBHOOK_URL til din HTTPS-adresse.
5. Brug den **samme** N8N_ENCRYPTION_KEY, og importér dine workflows fra factory/n8n-workflows/.

# Bilag D: Kilder

- Expo: create-expo-app og skabeloner: <https://docs.expo.dev/more/create-expo/>
- Expo Router: manuel installation: <https://docs.expo.dev/router/installation>
- Firebase: Cloud Storage og Blaze-planen: <https://firebase.google.com/docs/storage/faqs-storage-changes-announced-sept-2024>
- Claude Code i GitHub Actions: <https://code.claude.com/docs/en/github-actions>
- Dokploy: installation: <https://docs.dokploy.com/docs/core/installation>
- Docker: firewalls og ufw: <https://docs.docker.com/engine/network/packet-filtering-firewalls/>
- Hetzner Cloud: <https://www.hetzner.com/cloud/cost-optimized>
- OVHcloud VPS: <https://www.ovhcloud.com/en/vps/>
- Factory-projektbeskrivelsen: <https://vogelsang.github.io/AI-Agenter-E2026-public/projects/factory-project.html>
