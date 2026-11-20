**Pubquiz Factory**

Opsætningsguide v4

*Fra tom bærbar til første linje app-kode*

**Fag:** AI-agenter og automatisering, Mobile Development og Machine Learning

**Version:** 4.1 — 20. november 2026 (del 6 og 7 udspecificeret med byggetrin, clean code og markering af, hvornår du selv bygger)

# 0. Sådan bruger du guiden

Guiden er skrevet, så du laver det hele selv. Hvert trin fortæller **hvad** du skal gøre og **hvorfor**, så du kan forklare opsætningen til eksamen.

- **Blå bjælke over en kommando** fortæller, hvor den skal køres, fx PowerShell (i repo-mappen).
- **Ord med STORE BOGSTAVER** som DIN-HEMMELIGHED skal du udskifte med dine egne værdier.
- **Grøn boks "Færdig når"** afslutter hver del. Gå ikke videre, før alle punkter er krydset af.
- **Orange boks** er en vigtig advarsel. **Blå boks** forklarer et designvalg.
- **⚙️ Opsætning** betyder, at du følger kommandoer og ændrer konfiguration. **🔨 Du bygger selv** betyder, at du skriver koden selv — guiden siger hvad og hvorfor, ikke hvordan. **📐 Design** er til at læse og forstå — ingen kode.
- **Tabeller med "Ændring / Hvorfor (til eksamen)"** er dem, du skal kunne forklare mundtligt.

**Nyt i version 4**

Alt kører **lokalt på din bærbare** i Docker — ingen server endnu. Serveren er flyttet til Bilag C.

**Neo4j** kører i Docker sammen med n8n, Ollama og PostgreSQL og bruges til RAG.

**Firebase** er appens database (brugere, logbog, ratings og quizzer).

Tilmelding er altid **et link til quizstedets egen side** — ingen mail- eller SMS-knapper.

Del 7 beskriver **fabrikkens flow**: admin-prompt → plan → godkendelse → implementering → PR — og byggetrinene F1–F12.

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

| **Del** | **Indhold** | **Type** |
|---|---|---|
| 1 | Konti og værktøjer | ⚙️ Opsætning |
| 2 | GitHub-repoet: struktur, labels, regler og nøgler | ⚙️ Opsætning |
| 3 | Docker-stakken på den bærbare: n8n, PostgreSQL, Ollama og Neo4j | ⚙️ Opsætning |
| 4 | Gemini koblet til n8n | ⚙️ Opsætning |
| 5 | Firebase-projektet | ⚙️ Opsætning |
| 6.1–6.3 | Appen: Expo-projekt, Expo Router og første skærm | ⚙️ Opsætning |
| 6.4–6.8 | Appen: clean code-regler, datamodel og All-fanen | 🔨 **Du bygger selv** |
| 7.1–7.4 | Fabrikken: flow, hvem gør hvad, plan og RAG | 📐 Design |
| 7.5–7.6 | Fabrikken: clean code-regler og byggetrin F1–F12 | 🔨 **Du bygger selv** |
| 8 | Hvad der kommer bagefter | |

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

# 6. Appen

Del 6 består af to faser. Hold øje med markeringen over hvert afsnit:

| **Markering** | **Betyder** | **Afsnit** |
|---|---|---|
| ⚙️ **Opsætning** | Du følger kommandoer og ændrer konfigurationsfiler. Ingen app-logik | 6.1–6.3 |
| 🔨 **Du bygger selv** | Du skriver selv koden. Guiden siger *hvad* der skal bygges, *hvilke begreber* du skal bruge og *hvorfor* — men ikke hvordan koden ser ud | 6.4 og frem |

Bygger på din UI-skitse (design/Pub Quiz CPH – app screens.html, 12 skærme) og dit quiz-ark med 18 quizzer mandag–torsdag.

## 6.1 Opret Expo-projektet ⚙️ Opsætning

**Trin 1 — opret projektet**

**PowerShell (i repo-mappen)**

```powershell
npx create-expo-app@latest app --template blank
```

**Trin 2 — fjern det indre git-repo**

**PowerShell (i repo-mappen)**

```powershell
Test-Path app\.git
# Skriver den True, så fjern det indre repo:
Remove-Item -Recurse -Force app\.git
```

| **Ændring** | **Hvorfor (til eksamen)** |
|---|---|
| Skabelonen blank | Expos standard- og tabs-skabeloner bruger TypeScript. Blank er ren JavaScript, som er kravet til appen |
| Projektet hedder app/ | Matcher repo-strukturen fra del 2.1, hvor app/ er reserveret til Expo-appen |
| Slet app\\.git | create-expo-app laver sit eget git-repo. Et repo inde i et repo gør, at det ydre repo ikke kan se app-filerne |

## 6.2 Installer og opsæt Expo Router ⚙️ Opsætning

**Trin 1 — installer pakkerne**

**PowerShell (i repo-mappen)**

```powershell
cd app
npx expo install expo-router react-native-safe-area-context react-native-screens expo-linking expo-constants expo-status-bar
```

Brug altid `npx expo install` og ikke `npm install`: den vælger de versioner, der passer til projektets Expo SDK.

**Trin 2 — ret konfigurationen**

Alle stier er inde i app/-mappen.

| **Fil** | **Ændring** | **Hvorfor (til eksamen)** |
|---|---|---|
| package.json | "main": "expo-router/entry" | Startpunktet for appen. Expo Router overtager opstarten og finder selv skærmene ud fra filerne i src/app/ (fil-baseret routing) |
| app.json | "scheme": "pubquiz" inde i "expo" | Giver appen sin egen URL-adresse (pubquiz://), så links kan åbne en bestemt skærm (deep linking) |
| app.json | "expo-router" i "plugins" — **kun én gang** | Plugin'et konfigurerer routeren ved build. npx expo install har sandsynligvis allerede tilføjet det, så tjek for dubletter |
| App.js | Slet | Var startskærmen i blank-skabelonen. Nu er det src/app/(tabs)/index.js |
| index.js (i app/) | Slet | Kaldte registerRootComponent for at starte appen. Det gør expo-router/entry nu |

**Trin 3 — lav mappen til skærmene**

Lav mappen **app/src/app/**. Flyt ikke app/-mappen — den nye mappe skal ligge *inde i* projektet:

```
pubquiz-factory/
├── app/                  ← Expo-projektet (bliver, hvor det er)
│   ├── package.json
│   ├── app.json
│   └── src/
│       └── app/          ← skærmene (routes) ligger her
├── docs/
└── factory/
```

**Hvorfor src/app og ikke app/app**

Expo Router leder efter skærme i app/ eller src/app/, regnet fra mappen med package.json. Da projektet allerede hedder app/, ville skærmene ellers ligge i app/app/ — det er forvirrende. src/ adskiller desuden kildekode fra konfiguration (package.json, app.json, assets/).

**Færdig når**

☐ package.json har "main": "expo-router/entry"

☐ app.json har "scheme": "pubquiz", og "expo-router" står kun én gang i "plugins"

☐ App.js og index.js i app/ er slettet

☐ Mappen app/src/app/ findes — og der er ingen src/ i roden af repoet

## 6.3 Første skærm og kør appen ⚙️ Opsætning

**Trin 1 — lav en midlertidig startskærm**

Lav app/src/app/(tabs)/index.js. Det bliver All-fanen senere, men lige nu er det din første skærmfil, og den skal kun vise en tekst. (Mappen (tabs) forklares i 6.4.) En skærmfil i Expo Router har tre krav:

| **Krav** | **Hvorfor (til eksamen)** |
|---|---|
| Filen skal `export default` en React-komponent (en funktion, der returnerer UI) | Det er den, routeren viser. Filnavnet bestemmer adressen: index.js = startskærmen "/" |
| Tekst skal ligge i en `Text`-komponent, og `View` bruges som container | React Native har ingen HTML. Tekst uden for `<Text>` giver en fejl |
| Ingen `registerRootComponent` og ingen import af app.json | Opstarten håndteres af expo-router/entry. app.json er konfiguration — ikke en komponent |

**Trin 2 — start appen**

**PowerShell (i app-mappen)**

```powershell
npx expo start --clear
```

Scan QR-koden med kameraet (iPhone) eller Expo Go (Android). Samme Wi-Fi på PC og telefon, ellers `npx expo start --tunnel`.

| **Del af kommandoen** | **Hvorfor** |
|---|---|
| --clear | Tømmer Metros cache. Nødvendigt efter ændring af "main" og flytning af filer, ellers kan den gamle opstart blive hængende |
| --tunnel | Går uden om det lokale netværk, hvis telefonen ikke kan nå PC'en (fx på skolens Wi-Fi) |

**Trin 3 — commit opsætningen**

**PowerShell (i repo-mappen)**

```powershell
git status
git add app
git commit -m "Expo-app med Expo Router og første skærm"
git push
```

Tjek i git status, at node_modules/ **ikke** er med — den står i app/.gitignore.

**Færdig når**

☐ Teksten fra index.js vises på telefonen

☐ Opsætningen er committet og pushet

---

# 🔨 HERFRA BYGGER DU SELV

**Opsætningen er færdig. Fra 6.4 skriver du selv al app-kode.**

Guiden fortæller for hvert byggetrin: målet, hvilken fil, hvilke begreber du skal bruge, hvad clean code betyder for netop det trin, hvornår du er færdig, og hvad du skal kunne forklare til eksamen. Sidder du fast, så spørg efter et **hint til det konkrete trin** — ikke efter hele løsningen.

---

## 6.4 Clean code-regler for appen 🔨 Du bygger selv

Reglerne gælder for al kode, du skriver fra nu af. De gør koden lettere at forklare til eksamen — og lettere for fabrikkens coding-agent at ændre korrekt senere (del 7).

### Mappestruktur

```
app/
├── data/                        ← quizzes.json, tags.json
├── assets/                      ← billeder og ikoner
└── src/
    ├── app/                     ← KUN skærme (routes)
    │   ├── _layout.js           ← rod-stack: fanerne + detaljesiden ovenpå
    │   ├── (tabs)/
    │   │   ├── _layout.js       ← fanebjælken
    │   │   ├── index.js         ← All (adressen "/")
    │   │   ├── calendar.js
    │   │   ├── map.js
    │   │   └── logbook/
    │   │       ├── _layout.js   ← stack inde i Logbook-fanen
    │   │       ├── index.js     ← login-gate + liste over logbogsposter
    │   │       ├── [entryId].js ← én logbogspost
    │   │       └── new.js       ← "Log a quiz"
    │   └── quiz/
    │       └── [id].js          ← quizzens detaljeside
    ├── components/              ← QuizCard, WeekStrip, TagPopup, LoginForm
    ├── utils/                   ← rene funktioner
    ├── constants/               ← faste værdier
    └── services/                ← Firebase (auth og logbog)
```

| **Mappe** | **Indhold** | **Hvorfor (til eksamen)** |
|---|---|---|
| src/app/ | **Kun skærme** (routes) og _layout.js | Hver fil her bliver en skærm med sin egen adresse. Hjælpekode her ville blive behandlet som en side |
| src/app/_layout.js | En Stack, der indeholder fanerne og detaljesiden | Detaljesiden lægger sig *oven på* fanerne med en tilbage-knap |
| src/app/(tabs)/ | De fire faner og deres _layout.js | En **route group**: parentesen samler fanerne i én mappe, men kommer ikke med i adressen. All er stadig "/" |
| src/app/(tabs)/logbook/ | Logbook-fanens skærme med egen _layout.js | Logbook har flere skærme (liste, post, log en quiz), der lægger sig oven på hinanden, mens fanebjælken stadig ses |
| src/app/quiz/[id].js | Detaljesiden | Ligger uden for (tabs), så den kan åbnes fra All, Calendar og Map. [id] gør den dynamisk |
| src/components/ | Genbrugelige UI-dele, fx QuizCard, WeekStrip, TagPopup, LoginForm | Samme komponent bruges flere steder uden at kopiere kode |
| src/utils/ | Rene funktioner uden UI, fx filtrering af quizzer pr. dag | Logik kan testes og genbruges uafhængigt af skærmen |
| src/constants/ | Faste værdier, fx listen over ugedage og farver | Ét sted at ændre — ingen "magiske" værdier spredt i koden |
| src/services/ | Al kontakt med Firebase | Skærmene kender ikke databasen — skifter du database, ændres kun her (adskillelse af ansvar) |
| data/ | quizzes.json og tags.json | Data er adskilt fra kode. Fabrikken ændrer kun her ved almindelige quizzer |

**Navngivning af filer**

Route-filer i src/app/ skrives med små bogstaver og uden "Screen" (calendar.js), fordi filnavnet bliver til adressen (/calendar). Komponenter i src/components/ skrives i PascalCase (QuizCard.js), fordi de importeres som komponenter.

**Tomme filer giver en advarsel**

Skelettet har tomme route-filer. Indtil du når til det byggetrin, hvor filen udfyldes, viser Expo en advarsel om "missing the required default export". Det er forventet.

### Regler

| **Regel** | **Eksempel i projektet** | **Hvorfor (til eksamen)** |
|---|---|---|
| Ét ansvar pr. komponent | QuizCard viser ét kort. Den ved ikke, hvilken dag der er valgt | Små dele er lette at forstå, teste og genbruge (Single Responsibility) |
| Beskrivende navne | `selectedDay`, `quizzesForDay`, `QuizCard` — ikke `d`, `list2`, `Card1` | Koden forklarer sig selv, så der skal færre kommentarer til |
| Navnekonventioner | Komponenter og deres filer i PascalCase (QuizCard.js). Funktioner og variabler i camelCase. Konstanter i UPPER_SNAKE_CASE (WEEK_DAYS) | Man kan se, hvad noget er, ud fra navnet. Standard i React-verdenen |
| Ingen magiske værdier | Ugedagene står én gang i src/constants/ — ikke som tekst flere steder | Stavefejl kan kun ske ét sted, og ændringer sker ét sted |
| Logik ud af JSX | Filtreringen ligger i en navngiven funktion i src/utils/, ikke inde i `return (...)` | JSX skal beskrive *hvordan det ser ud*, ikke *hvordan data beregnes* |
| Data-drevet UI | QuizCard viser tags ud fra `quiz.tags` — ingen `if (quiz.id === "...")` | En ny quiz kræver kun en ændring i quizzes.json (vigtigt for fabrikken) |
| DRY — gentag ikke dig selv | QuizCard bruges på både All og Calendar | Rettes en fejl ét sted, er den rettet overalt |
| Props ind, events ud | QuizCard får `quiz` og `onPress` som props | Komponenten bestemmer ikke selv navigation, så den kan genbruges |
| Ingen død kode | Slet udkommenteret kode og ubrugte imports før commit | Git husker den gamle kode — filen skal kun vise det, der bruges |
| Lint før commit | `npx expo lint` i app-mappen | Fanger ubrugte variabler og typiske fejl automatisk |
| Små commits med klare beskeder | "Tilføj WeekStrip med antal quizzer pr. dag" | Historikken viser, hvordan appen er bygget op, trin for trin |

## 6.5 Fra skitse til filer 🔨 Du bygger selv

Skitsen har 12 skærme. Nogle bliver til egne filer, andre er varianter af samme fil eller komponenter:

| **Skærm i skitsen** | **Fil** | **Byggetrin** | **Bemærkning** |
|---|---|---|---|
| (Navigation) | src/app/_layout.js og src/app/(tabs)/_layout.js | B3 | Stack yderst, faner indeni |
| **All quizzes** | src/app/(tabs)/index.js | B3–B6 | Ugestrimmel, liste, quizkort |
| **Tag explanation** | src/components/TagPopup.js | Senere | En popup over den aktuelle skærm — ikke en route |
| **Quiz detail** | src/app/quiz/[id].js | B7 | Én dynamisk side for alle quizzer |
| **Quiz detail (SMS sign-up)** | *samme fil* som Quiz detail | B7 | Ikke en ekstra skærm: knapteksten kommer fra signUpType i dataene |
| **Calendar** | src/app/(tabs)/calendar.js | B3 (pladsholder) | Bygges efter All og genbruger QuizCard |
| **Quiz map** | src/app/(tabs)/map.js | B3 (pladsholder) | Pins + bundkort med Details og Directions |
| **Logbook** (ikke logget ind) | src/app/(tabs)/logbook/index.js + src/components/LoginForm.js | Senere | Login-gaten ligger **kun** her. Resten af appen kan bruges uden login |
| **Logbook entries** | *samme fil* som Logbook | Senere | Det, der vises, når man er logget ind |
| **Logbook entry** | src/app/(tabs)/logbook/[entryId].js | Senere | Én logbogspost |
| **Log a quiz** + **quiz list** + **name your own** | src/app/(tabs)/logbook/new.js | Senere | Ét flow: vælg en quiz fra listen eller skriv dit eget navn |
| Ugestrimmel | src/components/WeekStrip.js | B4 | Syv dage med antal |
| Quizkort | src/components/QuizCard.js | B6 | Genbruges på All og Calendar |

**Hvorfor login kun på Logbook**

Quizoversigten er offentlig information, så den skal kunne ses uden konto. Kun logbogen indeholder personlige data. Derfor ligger tjekket i logbook/index.js og ikke øverst i appen — og der er ingen "fortsæt som gæst"-state: en gæst er bare en bruger, der ikke er logget ind.

**Datadrevet app — vigtigt for fabrikken**

Alt, hvad der står om en quiz, skal komme fra dataene, ikke være kodet ind pr. quiz. Så kræver en almindelig ny quiz kun en ændring i quizzes.json, og agenten koder kun i UI'et, når admin beder om noget nyt (fx et sprog-mærke eller et liga-afsnit).

## 6.6 Datamodellen 🔨 Du bygger selv

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

| **Felt** | **Regel** | **Hvorfor (til eksamen)** |
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

**Hvorfor null og ikke tom tekst eller "Unknown"**

null betyder entydigt "vi ved det ikke". Så kan UI'et vælge at skjule feltet, og valideringen (del 7) kan tælle manglende oplysninger. Tekst som "Unknown" ville blive vist som en rigtig værdi.

Lav også app/data/tags.json med skitsens 14 tags og en forklaring til hver (bruges af TagPopup). Rating ligger ikke i filen — den beregnes i Firebase ud fra logbøgerne.

**Til at starte med importerer appen quizzes.json direkte.** Når synk til Firestore er på plads (del 7), skifter du til at læse fra Firestore — dataene har samme form, så skærmene behøver ikke ændres.

## 6.7 Ryd op i data, før du taster ind

- **Basement mandag** → startTime: "00:00" (bekræftet: quizzen starter ved midnat).
- **Grisen og Vestergade 17 "150 kr (incl. free draught)"** → priceDkk: null og en priceNote, til du ved, om det er prisen.
- **Kapiche** — tirsdag eller onsdag? Og linket skifter med hvert nummer.
- **Adresser** mangler for de fleste → null, til du har fundet dem.
- **Links til forsiden** (Søhesten, The Moose) → find quizsektionen.

## 6.8 Byggetrin: All-fanen 🔨 Du bygger selv

Byg trinene i rækkefølge. Hvert trin kan køres og ses på telefonen, før du går videre — så finder du fejl, mens de er små. Commit efter hvert trin.

### B1 — Data

| | |
|---|---|
| **Mål** | 3–4 rigtige quizzer fra arket i quizzes.json og alle 14 tags i tags.json |
| **Filer** | app/data/quizzes.json, app/data/tags.json |
| **Begreber** | JSON-arrays og -objekter, null |
| **Clean code** | Følg datamodellen i 6.6 præcist. Samme felter i samme rækkefølge i alle quizzer |
| **Færdig når** | Begge filer er gyldig JSON, og alle tags i quizzerne findes i tags.json |
| **Forklar til eksamen** | Hvorfor data ligger i JSON og ikke i koden (datadrevet app → fabrikken kan tilføje quizzer uden at røre UI) |

### B2 — Konstanter og hjælpefunktion

| | |
|---|---|
| **Mål** | Ugedagene ét sted og en funktion, der giver quizzerne for én dag |
| **Filer** | src/constants/days.js, src/utils/quizzes.js |
| **Begreber** | `export`/`import`, arrays, `filter`, `includes` |
| **Clean code** | Funktionen tager quizzer og en dag som parametre og returnerer en ny liste. Den ændrer ikke input og kender intet til UI (ren funktion) |
| **Færdig når** | Du kan logge resultatet med `console.log` for fx "Wednesday" og se de rigtige quizzer i terminalen |
| **Forklar til eksamen** | Hvorfor logik er flyttet ud af skærmen (genbrug på Calendar, lettere at teste) |

### B3 — Fane-navigation

| | |
|---|---|
| **Mål** | Fire faner i bunden: All, Calendar, Map og Logbook — og en Stack udenom, så detaljesiden senere kan lægge sig ovenpå |
| **Filer** | src/app/_layout.js (Stack), src/app/(tabs)/_layout.js (Tabs), src/app/(tabs)/logbook/_layout.js (Stack) + midlertidige pladsholdere i calendar.js, map.js og logbook/index.js |
| **Begreber** | Layout-filer i Expo Router, `Stack` og `Tabs` fra expo-router, `Tabs.Screen` med `name` og `options` (titel), route groups, `headerShown: false` (så der ikke vises to overskrifter oven på hinanden) |
| **Clean code** | Pladsholderne viser kun skærmens navn — ingen halvfærdig logik. Hver _layout.js gør kun én ting: bestemmer, hvordan dens mappe vises |
| **Færdig når** | Du kan skifte mellem alle fire faner på telefonen, og der vises kun én overskrift pr. skærm |
| **Forklar til eksamen** | Fil-baseret routing: filnavnet bestemmer skærmen, og _layout.js bestemmer, hvordan skærmene i mappen vises. Navigatorer i lag: Stack yderst (detaljeside ovenpå), Tabs i midten, Stack i Logbook |

### B4 — Ugestrimmel

| | |
|---|---|
| **Mål** | Syv dage øverst på All med antal quizzer pr. dag. Tryk på en dag vælger den |
| **Filer** | src/components/WeekStrip.js, src/app/(tabs)/index.js |
| **Begreber** | `useState` (den valgte dag ligger i skærmen), props, `Pressable`, `map` over WEEK_DAYS |
| **Clean code** | WeekStrip får `selectedDay`, antallet pr. dag og `onSelectDay` som props. Den gemmer ikke selv den valgte dag |
| **Færdig når** | Den valgte dag er markeret, og antallet passer med quizzes.json |
| **Forklar til eksamen** | Hvorfor state ligger i skærmen og ikke i komponenten ("lifting state up": både strimlen og listen skal kende den valgte dag) |

### B5 — Liste og tom dag

| | |
|---|---|
| **Mål** | Under strimlen vises kun quizzerne for den valgte dag. En dag uden quizzer viser "No quizzes added yet" |
| **Filer** | src/app/(tabs)/index.js |
| **Begreber** | `FlatList`, `data`, `renderItem`, `keyExtractor` med `id`, `ListEmptyComponent` |
| **Clean code** | Brug funktionen fra B2 — filtrér ikke inde i JSX |
| **Færdig når** | Listen skifter, når du trykker på en dag, og fredag–søndag viser teksten |
| **Forklar til eksamen** | Hvorfor FlatList og ikke `map` i en ScrollView (renderer kun det synlige → hurtigere med mange quizzer), og hvorfor keyExtractor skal være unik |

### B6 — QuizCard

| | |
|---|---|
| **Mål** | Hvert kort viser navn, tid, pris og højst 3 tags + "+N" for resten |
| **Filer** | src/components/QuizCard.js |
| **Begreber** | Props, `slice`, betinget visning (fx når startTime eller priceDkk er null), `StyleSheet.create` |
| **Clean code** | Lav små hjælpefunktioner til formatering (tid, pris) i src/utils/ i stedet for lange udtryk i JSX. Ingen kode, der er særlig for én quiz |
| **Færdig når** | Kortene vises korrekt — også for quizzer med null-felter og med flere end 3 tags |
| **Forklar til eksamen** | Genbrug: samme kort bruges senere på Calendar. Og hvordan null-værdier håndteres i UI'et |

### B7 — Detaljeside og navigation

| | |
|---|---|
| **Mål** | Tryk på et kort åbner quizzens detaljeside, der foreløbig viser navn og sted |
| **Filer** | src/app/quiz/[id].js, src/app/(tabs)/index.js |
| **Begreber** | Dynamiske routes (`[id]` i filnavnet), `router.push` eller `Link`, `useLocalSearchParams`, `find` |
| **Clean code** | QuizCard kalder kun `onPress`. Skærmen bestemmer, hvor der navigeres hen. Detaljesiden finder quizzen ud fra id — ikke ud fra data sendt med i navigationen. SMS-varianten fra skitsen laves med data (signUpType) — ikke med en ekstra fil eller en `if` på quizzens navn |
| **Færdig når** | Hver quiz åbner sin egen detaljeside, og tilbage-knappen virker |
| **Forklar til eksamen** | Hvorfor én dynamisk fil i stedet for én fil pr. quiz (datadrevet → nye quizzer får automatisk en side) |

### B8 — Oprydning og commit

| | |
|---|---|
| **Mål** | Koden følger reglerne i 6.4 |
| **Begreber** | ESLint via `npx expo lint` |
| **Clean code** | Fjern ubrugte imports, console.log og udkommenteret kode. Tjek navne mod tabellen i 6.4 |
| **Færdig når** | `npx expo lint` giver ingen fejl |

**PowerShell (i repo-mappen)**

```powershell
git status
git add app
git commit -m "All-fane med ugestrimmel, quizliste, QuizCard og detaljeside"
git push
```

**Færdig når — hele del 6**

☐ Appen kører på telefonen med fire faner

☐ All-fanen viser ugestrimlen og quizzerne for den valgte dag

☐ Fredag–søndag viser "No quizzes added yet"

☐ Tryk på et kort åbner detaljesiden

☐ quizzes.json og tags.json følger modellen

☐ Mappestrukturen og reglerne fra 6.4 er fulgt, og `npx expo lint` er ren

☐ Koden er pushet

# 7. Fabrikken 🔨 Du bygger selv

Del 7 er designet for fabrikken og byggetrinene, du følger i de næste uger. Admin beskriver i sin prompt, hvad der skal ske — også om frontenden skal ændres — og AI'en svarer med en plan, før der skrives kode.

| **Afsnit** | **Indhold** | **Type** |
|---|---|---|
| 7.1–7.4 | Flowet, hvem gør hvad, planen og RAG | 📐 Design — læs og forstå, ingen kode |
| 7.5 | Clean code-regler for fabrikken | 🔨 Gælder alt, du bygger |
| 7.6 | Byggetrin F1–F12 | 🔨 Du bygger selv |
| 7.7–7.9 | Testopgaver, sikkerhed og senere | 📐 Til afprøvning og rapport |

Som i del 6 siger guiden *hvad* der skal bygges og *hvorfor* — ikke hvordan koden ser ud. Sidder du fast, så spørg efter et hint til det konkrete byggetrin.

**Din n8n-adresse**

Guiden skriver DIN-N8N-ADRESSE. Hos dig er det http://localhost:5679, fordi en gammel n8n-container bruger 5678.

## 7.1 Fra admin-prompt til quiz i appen 📐 Design

| **Trin** | **Hvad sker der** | **Label** |
|---|---|---|
| 1 | Admin skriver prompten på admin-siden (GitHub Pages), fx: "Ny quiz på Proud Mary, torsdag 19–21, gratis, på engelsk. Lav et English-tag." + link. n8n opretter et issue | Ideas |
| 2 | **AI-trinnet** (Gemini + RAG): skriver planen som kommentar — "sådan har jeg forstået det" — med data-ændringer, UI-ændringer, foreslåede tags og evt. spørgsmål | Refining → Ready for approval |
| 3 | **Godkendelse 1:** admin godkender planen ved at sætte labelen Approved — eller kommenterer og sætter Ideas igen, så AI'en laver planen om | Approved |
| 4 | **Coding-agenten** (Claude Code) implementerer på branch issue-N og kører valideringen | Building |
| 5 | Har agenten et spørgsmål, kommer det som kommentar. Over 30 min eller fejl → Stuck | Waiting for you / Stuck |
| 6 | **Godkendelse 2:** agenten laver en PR. Admin tester ændringen i Expo og merger | Your QA |
| 7 | Efter merge: GitHub Action synker quizzes.json til Firestore, og n8n skriver quizzen ind i Neo4j | Done |

**To godkendelser, ikke én**

Planen godkendes, før agenten bruger tid på den, og resultatet godkendes, før det kommer i appen. Fejl i forståelsen fanges i trin 3 i stedet for i PR'en.

## 7.2 Hvem gør hvad 📐 Design

Fabrikken kører to steder. Det er vigtigt at kunne forklare hvorfor:

| **Del** | **Kører i** | **Opgaver** | **Hvorfor her** |
|---|---|---|---|
| Intake-workflow | n8n på din bærbare | Modtager admin-prompten og opretter issuet | n8n har webhooks og GitHub-noder klar |
| Refine-workflow | n8n på din bærbare | Gemini + RAG → plan som kommentar | Neo4j og Ollama kører lokalt ved siden af n8n |
| Neo4j-workflow | n8n på din bærbare | Skriver godkendte quizzer ind i Neo4j | Samme grund — Neo4j er lokal |
| Runner | GitHub Actions | Starter Claude Code, når et issue får Approved | Kører i skyen, så agenten ikke kræver din bærbare. Reagerer direkte på label-hændelser |
| Validering | GitHub Actions | Tjekker quizzes.json på hver PR | Skal køre automatisk, før noget kan merges |
| Synk | GitHub Actions | Kopierer quizzes.json til Firestore efter merge | Reagerer på push til main |
| Admin | Dig | Skriver prompt, godkender plan, tester og merger | De to godkendelser |

**Hvorfor n8n poller GitHub i stedet for at få webhooks**

n8n kører på localhost, så GitHub kan ikke nå den udefra. Derfor tjekker n8n selv GitHub med en Schedule Trigger (fx hvert 2. minut). Konsekvens: fabrikkens n8n-del virker kun, når din bærbare er tændt — men appen virker altid, fordi den læser fra Firebase.

### Hvem sætter hvilken label

| **Label** | **Sættes af** |
|---|---|
| Ideas | Intake-workflow (eller dig, når du beder om en ny plan) |
| Refining, Ready for approval | Refine-workflow |
| Approved | Dig (godkendelse 1) |
| Building, Stuck, Your QA | Runner-Actionen |
| Waiting for you | Agenten, når den har et spørgsmål |
| Done | Action, når PR'en er merget |

Kun én state-label ad gangen: den gamle fjernes, når den nye sættes. Så viser labelen altid præcis, hvor opgaven er.

## 7.3 Planen AI'en skriver (spec-skabelonen) 📐 Design

| **Felt** | **Indhold** | **Hvorfor (til eksamen)** |
|---|---|---|
| Forståelse | Én til to sætninger: hvad admin har bedt om | Admin kan hurtigt se, om AI'en har forstået opgaven |
| Quiz-data | Alle felter fra datamodellen, udfyldt fra prompten og linket. Ukendt = null | Samme form som quizzes.json, så agenten kan bruge det direkte |
| Kilder | Hvor hver oplysning kommer fra (prompten eller stedets side) | Gør det muligt at opdage opfundne oplysninger |
| Tags | Fra tags.json. Nyt tag kun, hvis admin har bedt om det | Fast ordforråd → ensartede filtre i appen |
| UI-ændring | Ja/nej — og i så fald hvilken (fx "sprog-mærke på QuizCard") | Adskiller ren data-opgave fra kode-opgave |
| Lignende quizzer (RAG) | De mest lignende quizzer fra Neo4j og om det kan være en dublet | Forhindrer dubletter og giver bedre tag-forslag |
| Spørgsmål | Højst 3 — kun det, der mangler for at kunne bygge | AI'en spørger i stedet for at gætte |
| Acceptkriterier | Fx "valideringen består", "vises under Thursday", "English-tag vises med forklaring" | Admin og agent ved præcist, hvornår opgaven er færdig |

## 7.4 RAG i fabrikken 📐 Design

| **Regel** | **Hvorfor (til eksamen)** |
|---|---|
| Under refining er Neo4j **kun til læsning** | AI-trinnet embedder admins tekst med Ollama og finder de mest lignende quizzer — til tag-forslag og dublet-tjek |
| Quizzen skrives først ind i Neo4j **efter merge** | Ugodkendte eller forkerte quizzer påvirker ikke de næste forslag |
| Neo4j læser fra quizzes.json på main | main er den eneste sandhed — det, der er godkendt og merget |
| Samme embedding-model overalt (nomic-embed-text, 768 tal) | Vektorer fra forskellige modeller kan ikke sammenlignes |

## 7.5 Clean code-regler for fabrikken 🔨 Gælder alt, du bygger

### n8n

| **Regel** | **Eksempel** | **Hvorfor (til eksamen)** |
|---|---|---|
| Ét workflow pr. ansvar | Intake, Refine og Neo4j er tre workflows — ikke ét stort | Lettere at teste, fejlfinde og forklare. En fejl i ét stopper ikke de andre |
| Beskrivende nodenavne, der starter med et verbum | "Hent Ideas-issues", "Embed prompt", "Find lignende quizzer" — ikke "HTTP Request2" | Workflowet kan læses som en opskrift |
| Indbyggede noder før Code-noder | Filter, IF, Set og HTTP Request før JavaScript | Mindre kode at vedligeholde. Brug Code kun, når ingen node kan det — og skriv en note om hvorfor |
| Hemmeligheder kun i credentials | Gemini-nøgle, GitHub-token og Neo4j-adgangskode | Kommer aldrig med i eksporterede workflows eller i repoet |
| Fejl skal være synlige | Fejl i Refine → kommentar på issuet + label Stuck | En opgave må aldrig forsvinde stille |
| Workflows versioneres | Eksportér som JSON til factory/n8n-workflows/ efter hver ændring | Repoet viser hele fabrikken — og workflows kan genskabes på en server (Bilag C) |

### Prompts, scripts og Actions

| **Regel** | **Eksempel** | **Hvorfor (til eksamen)** |
|---|---|---|
| Prompts ligger i filer | factory/prompts/refine-prompt.md | Prompten er versioneret og kan forbedres og sammenlignes over tid |
| AI svarer i fast JSON, som valideres | Mangler et felt, afvises svaret | Maskiner læser JSON pålideligt — fri tekst gør ikke |
| Små navngivne funktioner i scripts | `checkRequiredFields`, `checkUniqueIds`, `checkTagsExist` | Hver regel kan forstås og ændres for sig |
| Klare fejlbeskeder | "cucaracha-bar: tag 'Englsh' findes ikke i tags.json" | Agenten og du kan rette fejlen uden at lede |
| Exit-kode ≠ 0 ved fejl | Valideringsscriptet afslutter med fejlkode | Det er sådan, GitHub Actions ved, at et tjek fejlede |
| Idempotens | Synk og Neo4j kan køres to gange uden dubletter (id = dokument-id / MERGE) | Genkørsler efter fejl er sikre |
| Mindst mulige rettigheder | `permissions:` i hver Action, kun det nødvendige | Begrænser skaden, hvis noget går galt |
| Faste versioner af Actions | Fx `@v4` — ikke `@main` | Ændringer hos andre bryder ikke din fabrik uden varsel |

## 7.6 Byggetrin F1–F12 🔨 Du bygger selv

Byg i rækkefølge. Hvert trin kan testes alene, før du går videre. Commit efter hvert trin, og eksportér n8n-workflows til factory/n8n-workflows/.

| **Uge** | **Byggetrin** | **Niveau** |
|---|---|---|
| 18.–24. nov | F1–F4: spec, prompt, Neo4j-data og Refine med RAG | Forberedelse |
| 25. nov–1. dec | F5–F8: Refine på GitHub, CLAUDE.md, agenten startet af dig, validering og admin-side | Basic A |
| 2.–8. dec | F9–F12: runner, Done-label, synk, Neo4j efter merge og factory board | Basic B |

### F1 — Spec-skabelon og AI-prompt

| | |
|---|---|
| **Mål** | Skabelonen fra 7.3 og prompten til AI-trinnet ligger som filer |
| **Filer** | factory/prompts/spec-template.md, factory/prompts/refine-prompt.md |
| **Begreber** | System-prompt, JSON-skema for svaret, few-shot-eksempel, regler mod at gætte |
| **Clean code** | Prompten har faste afsnit: rolle, input, regler, output-format og ét eksempel. Den henviser til datamodellen i 6.6 i stedet for at gentage den med egne ord |
| **Færdig når** | Du har testet prompten i Google AI Studio med 2–3 af testopgaverne fra 7.7, og svaret er gyldig JSON |
| **Forklar til eksamen** | Hvorfor fast JSON i stedet for fri tekst (kan valideres, mindre risiko for opfundne detaljer) |

### F2 — Quizzer ind i Neo4j (første gang)

| | |
|---|---|
| **Mål** | Alle quizzer fra quizzes.json ligger i Neo4j med en embedding, og der er et vektorindeks |
| **Filer** | n8n-workflowet "Neo4j – synk quizzer" |
| **Begreber** | Ollama /api/embed, Neo4j Query API (som i 3.5), `MERGE`, noder og relationer (Quiz)-[:HAS_TAG]->(Tag), `CREATE VECTOR INDEX` med 768 dimensioner og cosine |
| **Clean code** | Brug `MERGE` på id, så workflowet kan køres igen uden dubletter. Embed en fast tekst bygget af navn, sted, dage og tags — samme opbygning hver gang |
| **Færdig når** | Neo4j Browser viser én Quiz-node pr. quiz med tags, og en ny kørsel giver ikke flere noder |
| **Forklar til eksamen** | Hvad en embedding er, og hvorfor quizzer og tags er relationer i en graf |

### F3 — Refine-workflow med Gemini

| | |
|---|---|
| **Mål** | Et workflow, der tager en admin-prompt og returnerer planen som valideret JSON |
| **Filer** | n8n-workflowet "Refine" |
| **Begreber** | Manual Trigger med testdata (indtil F5), Basic LLM Chain + Gemini, Structured Output Parser |
| **Clean code** | Prompten hentes fra din fil i F1 — skriv den ikke om i noden. Ugyldigt svar går til en fejlgren, ikke videre |
| **Færdig når** | Testopgaverne "Ny quiz uden noget særligt" og "Quiz uden tidspunkt" giver korrekt JSON — og den sidste giver et spørgsmål i stedet for et gæt |
| **Forklar til eksamen** | Hvorfor svaret valideres, før det bruges |

### F4 — RAG i Refine

| | |
|---|---|
| **Mål** | Refine finder de mest lignende quizzer og giver dem med til Gemini |
| **Filer** | n8n-workflowet "Refine" |
| **Begreber** | Embed admins prompt med samme model som i F2, `db.index.vector.queryNodes` (top 3–5), similarity-score |
| **Clean code** | Hent kun de felter, Gemini skal bruge (navn, sted, dage, tags) — ikke hele noden. Sæt en grænse for, hvornår noget kaldes en mulig dublet, og skriv den som en navngiven værdi |
| **Færdig når** | Testopgaven "Samme quiz indsendt igen" bliver markeret som mulig dublet |
| **Forklar til eksamen** | Hvad RAG er (Retrieval-Augmented Generation), og hvorfor det giver bedre tag-forslag end Gemini alene |

### F5 — Refine koblet til GitHub

| | |
|---|---|
| **Mål** | Refine kører af sig selv på nye issues med labelen Ideas og skriver planen som kommentar |
| **Filer** | n8n-workflowet "Refine" |
| **Begreber** | Schedule Trigger, GitHub-noden (hent issues med label, opret kommentar, ret labels), filter på forfatter |
| **Clean code** | Sæt Refining som det første, så samme issue ikke behandles to gange. Læs også tidligere kommentarer, så admins rettelser kommer med, når Ideas sættes igen |
| **Færdig når** | Et issue, du opretter i hånden med Ideas, får en plan og labelen Ready for approval inden for få minutter — og issues fra andre ignoreres |
| **Forklar til eksamen** | Polling vs. webhooks (7.2), og hvorfor forfatteren tjekkes ("only tasks written by you") |

### F6 — CLAUDE.md og Basic A

| | |
|---|---|
| **Mål** | Regler for agenten ligger i repoet, og du kan selv starte Claude Code på et godkendt issue |
| **Filer** | CLAUDE.md i roden af repoet |
| **Begreber** | Agent-instruktioner, branch-navngivning issue-N, `gh pr create` |
| **Clean code** | CLAUDE.md er kort og konkret: hvilke filer agenten må ændre (data og app-komponenter), hvad den skal spørge om først (package.json, Firebase), clean code-reglerne fra 6.4, at valideringen skal bestå, og hvordan den melder status (PR, spørgsmål som kommentar + Waiting for you) |
| **Færdig når** | Du har kørt mindst én testopgave igennem: plan → Approved → du starter agenten lokalt → PR → merge |
| **Forklar til eksamen** | Hvorfor agenten har skrevne grænser (sikkerhed og forudsigelighed) |

### F7 — Validerings-Action

| | |
|---|---|
| **Mål** | Hver PR, der ændrer app/data/, bliver tjekket automatisk |
| **Filer** | scripts/validate-quizzes.js, .github/workflows/validate.yml |
| **Begreber** | Node.js `fs` og `JSON.parse`, `process.exit(1)`, `on: pull_request` med `paths`, `actions/checkout`, `actions/setup-node` |
| **Clean code** | Én funktion pr. regel (felter, typer, unikke id'er, id-format, ugedage, tidsformat, signUpType, tags findes). Saml alle fejl og vis dem til sidst i stedet for at stoppe ved den første |
| **Færdig når** | `node scripts/validate-quizzes.js` virker lokalt, og en PR med en bevidst fejl bliver rød på GitHub |
| **Forklar til eksamen** | Hvorfor validering er en automatisk kvalitetsport — også mod fejl fra AI'en |

### F8 — Admin-side og Intake-workflow

| | |
|---|---|
| **Mål** | Admin skriver prompt + link på GitHub Pages, og n8n opretter issuet med Ideas |
| **Filer** | docs/index.html (+ evt. docs/admin.js og docs/style.css), n8n-workflowet "Intake" |
| **Begreber** | HTML-formular, `fetch` med POST og JSON, Webhook-node med Header Auth, CORS (Allowed Origins), Respond to Webhook med statuskode |
| **Clean code** | HTML, CSS og JavaScript i hver sin fil. Siden viser tydeligt, om det lykkedes eller fejlede. Intake validerer input (tom prompt → 400) |
| **Færdig når** | En prompt fra siden bliver til et issue med Ideas, og en forkert nøgle giver en fejl |
| **Forklar til eksamen** | Hvorfor webhooken kræver en nøgle, selvom den kun kører lokalt |

**Nøglen må ikke stå i sidens kode**

GitHub Pages er offentlig, så alt i HTML og JavaScript kan læses af alle. Admin skal skrive webhook-nøglen i et adgangskodefelt. Siden kan kun nå n8n, når den åbnes på din bærbare, fordi n8n kører på localhost.

### F9 — Runner (Basic B)

| | |
|---|---|
| **Mål** | Når et issue får labelen Approved, starter Claude Code automatisk i GitHub Actions |
| **Filer** | .github/workflows/runner.yml |
| **Begreber** | `on: issues` med `types: [labeled]`, `if:` på labelens navn, anthropics/claude-code-action med secret CLAUDE_CODE_OAUTH_TOKEN, `timeout-minutes: 30`, `if: failure()`, `gh issue edit` til labels |
| **Clean code** | Faste trin: sæt Building → kør agenten → sæt Your QA ved succes eller Stuck ved fejl/timeout. `permissions:` kun til contents, issues og pull-requests |
| **Færdig når** | Approved på en testopgave giver en PR fra agenten uden, at du starter noget selv, og en bevidst umulig opgave ender i Stuck |
| **Forklar til eksamen** | Forskellen på Basic A og B, og hvorfor der er en tidsgrænse |

### F10 — Done-label og synk til Firestore

| | |
|---|---|
| **Mål** | Efter merge får issuet Done, og quizzes.json kopieres til samlingen quizzes i Firestore |
| **Filer** | scripts/sync-firestore.js, scripts/package.json, .github/workflows/sync.yml, Firestore-regler i Firebase-konsollen |
| **Begreber** | `on: push` til main med `paths`, firebase-admin, service account som secret (FIREBASE_SERVICE_ACCOUNT), batch-skrivning, quiz-id som dokument-id. Firestore-regler: `allow read` for alle på quizzes, ingen `write` |
| **Clean code** | Scriptet gør én ting: læser filen og skriver hvert dokument. Ingen hemmeligheder i koden — kun fra miljøvariabel |
| **Færdig når** | En merget ændring står i Firestore inden for et minut, issuet har Done, og en ny kørsel giver ikke dubletter |
| **Forklar til eksamen** | Hvorfor appen læser fra Firestore og ikke fra GitHub, og hvorfor kun Actionen må skrive |

### F11 — Neo4j efter merge

| | |
|---|---|
| **Mål** | Workflowet fra F2 kører automatisk og læser quizzes.json fra main |
| **Filer** | n8n-workflowet "Neo4j – synk quizzer" |
| **Begreber** | Schedule Trigger, hent filen fra main via GitHub-noden eller raw-URL |
| **Clean code** | Genbrug workflowet fra F2 — byg ikke et nyt. Embed kun quizzer, der er nye eller ændret |
| **Færdig når** | En merget quiz dukker op i Neo4j og bliver fundet som lignende i næste Refine |
| **Forklar til eksamen** | Hvorfor kun mergede quizzer kommer i Neo4j (7.4) |

### F12 — Factory board

| | |
|---|---|
| **Mål** | En side på GitHub Pages, der viser alle opgaver i kolonner efter label |
| **Filer** | docs/board.html, docs/board.js |
| **Begreber** | GitHubs offentlige REST API (`/repos/.../issues?state=all`), `fetch`, gruppering af issues efter label |
| **Clean code** | Kolonnerne laves ud fra én liste over labels i rækkefølge — ikke ni kopier af samme HTML. Intet token i siden |
| **Færdig når** | Boardet viser opgaverne i den rigtige kolonne og opdateres ved genindlæsning |
| **Forklar til eksamen** | Hvorfor labels som states gør boardet simpelt (labelen *er* kolonnen) |

## 7.7 Testopgaver (mindst 5 til afleveringen) 📐 Til afprøvning

| **Opgave** | **Data** | **UI** | **Tester** |
|---|---|---|---|
| Ny quiz uden noget særligt (fx Rabalder) | Ja | Nej | Hele flowet virker |
| Proud Mary på engelsk + "lav et English-tag" | Ja + nyt tag i tags.json | Mærket vises via data | Nyt tag kun på admins ordre |
| Dialekt: liga over 6 aftener | Ja | Nyt liga-afsnit på detaljesiden | Agenten ændrer UI |
| Proud Mary: hold på 2–6 personer | Nyt felt | Visning af holdstørrelse | Ændring af datamodellen + validering |
| Første weekend-quiz | Ja | Calendar skal kunne vise weekenden | UI tilpasses data |
| Samme quiz indsendt igen | — | — | RAG opdager dubletten |
| Quiz uden tidspunkt | — | — | AI'en spørger i stedet for at gætte |

## 7.8 Sikkerhed og kvalitet (til rapporten) 📐 Til rapport

| **Tiltag** | **Byggetrin** | **Hvorfor** |
|---|---|---|
| Hemmelig nøgle på admin-sidens webhook — skrives af admin, står ikke i koden | F8 | GitHub Pages er offentlig — ellers kan alle oprette opgaver |
| n8n tjekker, at issuet er oprettet af dig | F5 | Opgaven: "only tasks written by you" |
| AI-trinnet returnerer fast JSON, som valideres | F1, F3 | Mindre risiko for opfundne detaljer og prompt injection fra stedets hjemmeside |
| CLAUDE.md: hvilke filer agenten må ændre | F6 | Data og app-komponenter ja — package.json og Firebase-opsætning kun efter at have spurgt |
| Validerings-Action på hver PR | F7 | Tjekker felter, unikke id'er og at tags findes i tags.json |
| Tidsgrænse og Stuck-label på runneren | F9 | En agent, der kører fast, bruger ikke ressourcer uendeligt |
| `permissions:` med mindst mulige rettigheder i alle Actions | F7, F9, F10 | Begrænser skaden ved fejl |
| Firestore-regler: quizzer er skrivebeskyttede for brugere | F10 | Kun synk-Actionen må skrive quizzer. Én rating pr. deltagelse |
| Ingen merge til main uden PR | 2.3 | Rulesettet fra del 2 |

## 7.9 Det, der skal bygges senere

- **Geokodning:** et trin i n8n, der laver adressen om til koordinater, så nye quizzer kommer på kortet.
- **Opdatering og arkivering** af quizzer — ikke kun tilføjelse.
- **Tjek af forældede links:** et planlagt workflow, der opretter et issue, hvis en quizUrl holder op med at virke (godt til Advanced).
- **Målinger til evalueringen:** tid i hver state, antal spørgsmål, afvisninger, og om tag-forslagene var rigtige.

# 8. Hvad der kommer bagefter

| **Uge** | **Opgaver** |
|---|---|
| 18.–24. nov | Del 1–6. F1–F4: spec, prompt, Neo4j-data og Refine med RAG |
| 25. nov–1. dec | Basic A — F5–F8: Refine på GitHub, CLAUDE.md, du starter agenten selv, validering og admin-side |
| 2.–8. dec | Basic B — F9–F12: runner, Done og synk til Firestore, Neo4j efter merge og factory board |
| 9.–16. dec | Evaluering og rapport (max 5 sider). Aflevering medio december |
| Senere | Machine Learning, 7.9 og evt. flytning til server (Bilag C) |

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
| Firebase service account-nøgle (F10) | GitHub repository secret FIREBASE_SERVICE_ACCOUNT |
| Webhook-nøgle til admin-siden (F8) | Header Auth-credential i n8n + password manager. Skrives af admin på siden — aldrig i koden |

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
| Expo: "Element type is invalid" | En skærmfil eksporterer ikke en komponent med export default — fx importeres app.json i stedet for en komponent |
| Expo viser stadig den gamle App.js | "main" er ikke ændret til expo-router/entry, eller cachen er gammel. Kør npx expo start --clear |
| Admin-siden: "Failed to fetch" | n8n kører ikke, siden er ikke åbnet på din bærbare, eller CORS (Allowed Origins) på Webhook-noden mangler https://simabild.github.io |
| Refine reagerer ikke på et issue | Din bærbare/n8n er slukket, workflowet er ikke aktivt, eller issuet er ikke oprettet af dig |
| Neo4j: vektorsøgning fejler | Vektorindekset mangler, eller embeddings har ikke 768 dimensioner (forkert model) |
| Expo: "missing the required default export" | En route-fil er tom eller mangler `export default`. Forventet i skelettet, indtil filen udfyldes |
| En ekstra skærm som /components/... dukker op | En hjælpemappe ligger inde i src/app/. Flyt den op til src/ |
| Expo Router finder ingen skærme | Skærmene ligger ikke i app/src/app/, eller der ligger en src/ i roden af repoet i stedet for i app/ |
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
