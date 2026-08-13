# Mas Tulsa Events Widget

Widget web professional per mostrar l'agenda d'activitats de Mas Tulsa a partir d'un calendari especific de Google Calendar. El projecte esta preparat per desplegar-se a Netlify i incrustar-se posteriorment a Wix Studio mitjancant un iframe.

Els esdeveniments es gestionen des de Google Calendar. El calendari pot continuar sent privat: el frontend no conte secrets i sempre consulta una Netlify Function, que es l'unica part encarregada de parlar amb la Google Calendar API mitjancant un Service Account.

## Estructura

```text
/
├── index.html
├── styles.css
├── script.js
├── netlify.toml
├── package.json
├── .env.example
├── /netlify/functions/events.js
├── /netlify/functions/sync-events.js
├── /netlify/functions/lib/
├── /images/events/
└── /assets/
```

## Funcionament general

1. Dani i Xenia creen, editen o eliminen activitats al calendari de Google Calendar.
2. El widget carrega `/api/events`.
3. Netlify redirigeix aquesta ruta a `/.netlify/functions/events`.
4. La funcio consulta la Google Calendar API amb un Service Account guardat a Netlify.
5. La funcio retorna un JSON net i ordenat cronologicament.
6. `script.js` renderitza el calendari mensual, les activitats i els estats de carrega, buit i error.

El frontend consulta exclusivament el mes visible. En canviar de mes envia un nou rang `start` / `end`, actualitza la quadrícula i manté totes les activitats del mes ordenades cronològicament.

## Interfície i idiomes

La interfície està preparada en català, castellà, anglès i francès mitjançant el paràmetre `lang`. El català és l'idioma predeterminat quan el paràmetre falta o no és vàlid:

```text
/?lang=ca
/?lang=es
/?lang=en
/?lang=fr
```

Tots els textos d'interfície es centralitzen a l'objecte `TRANSLATIONS` de `script.js`. Els títols, descripcions i altres dades editorials dels esdeveniments es mostren tal com arriben de Google Calendar.

Quan el widget està incrustat a Wix, accepta canvis d'idioma sense recarregar ni tornar a consultar Google Calendar:

```js
iframe.contentWindow.postMessage(
  {
    type: "setLanguage",
    language: "fr"
  },
  "*"
);
```

En acabar la inicialització, el widget envia una vegada `{ type: "masTulsaAgendaReady" }` a la pàgina pare perquè Wix pugui respondre amb l'idioma actiu.

La imatge de cada activitat es resol a partir del seu identificador:

```text
taller-pa → /images/events/taller-pa.jpg
```

Per afegir una fotografia nova només cal desar el fitxer JPG corresponent a `/images/events/` i utilitzar el nom del fitxer, sense extensió, al camp `imatge` de l'esdeveniment. Si el fitxer no existeix, la card manté la proporció amb un fallback neutre.

## Google Calendar

Calendari configurat per defecte:

```text
50cc82acbe3cd97d12d3a1968ed61b223a64e72731d15e8f517eeb9e913059da@group.calendar.google.com
```

Zona horaria:

```text
Europe/Madrid
```

La funcio accepta els parametres `start` i `end` per consultar intervals concrets:

```text
/api/events?start=2026-08-01&end=2026-09-01
```

Si no s'indica `end`, es consulten els propers 90 dies. El rang maxim admès es de 370 dies.

## Variables d'entorn

Crea un fitxer `.env` local a partir de `.env.example` o configura aquestes variables al panell de Netlify:

```text
GOOGLE_SERVICE_ACCOUNT_JSON=
GOOGLE_CALENDAR_ID=
GOOGLE_SPREADSHEET_ID=
SYNC_EVENTS_TOKEN=
```

`GOOGLE_SERVICE_ACCOUNT_JSON` es obligatoria i ha de contenir el JSON complet del Service Account. `GOOGLE_CALENDAR_ID` es opcional perquè el calendari de Mas Tulsa ja esta configurat per defecte dins la funcio.

`GOOGLE_SPREADSHEET_ID` és opcional i per defecte apunta al full definitiu `Agenda Web - Inscripcions i Reserves`. `SYNC_EVENTS_TOKEN` és obligatori per executar manualment la sincronització: no s'ha d'exposar al navegador ni compartir-lo amb usuaris finals.

No escriguis el JSON real ni cap `private_key` al repositori. `.gitignore` exclou `.env` i variants locals.

## Configuracio local

Requisits:

- Node.js 18 o superior.
- Netlify CLI instal·lat globalment o disponible via `npx`.
- El JSON d'un Service Account compartit amb el calendari indicat amb permis de veure tots els detalls dels esdeveniments.

Per provar-ho localment:

```bash
cp .env.example .env
```

Omple `GOOGLE_SERVICE_ACCOUNT_JSON` al fitxer `.env` amb el JSON complet del Service Account i executa:

```bash
npx netlify dev
```

El widget quedara disponible normalment a:

```text
http://localhost:8888
```

## Provar la Netlify Function

Amb `netlify dev` en marxa:

```bash
curl "http://localhost:8888/api/events"
```

O amb un interval concret:

```bash
curl "http://localhost:8888/api/events?start=2026-08-01&end=2026-09-01"
```

Resposta esperada:

```json
{
  "events": [
    {
      "id": "...",
      "title": "...",
      "start": "...",
      "end": "...",
      "allDay": false,
      "location": "...",
      "description": "...",
      "category": null,
      "price": null,
      "places": null,
      "duration": null,
      "image": null,
      "button": null
    }
  ]
}
```

## Metadades futures

La funcio ja separa metadades escrites a la descripcio de Google Calendar amb format `clau=valor` o `clau: valor`.

Claus preparades:

```text
categoria=gastronomia
preu=35
places=10
durada=3 hores
imatge=taller-pa
boto=Reserva
marge=3
```

La interfície omet automàticament qualsevol camp buit i mostra les dades disponibles a la card de cada activitat.

`marge`, `margen` i `margin` són sinònims internament normalitzats com `margin`. Només se sincronitzen al full `EVENTS` els esdeveniments que tinguin un `places` enter positiu i un `boto`/`button` no buit. Si no s'indica marge, la funció llegeix `MARGE_EXTRA_PREDETERMINAT` de `CONFIG`.

## Sincronització manual de reserves

La lectura pública de `/api/events` no escriu mai al full. La sincronització és una Netlify Function separada, només `POST`, protegida amb `SYNC_EVENTS_TOKEN`:

```bash
curl -X POST "http://localhost:8888/.netlify/functions/sync-events" \
  -H "Authorization: Bearer $SYNC_EVENTS_TOKEN"
```

En producció, usa la mateixa ruta amb el token guardat com a variable d'entorn de Netlify. La funció obté un token de Google amb el mateix Service Account, mantenint Calendar en mode `calendar.readonly` i afegint únicament l'abast `spreadsheets` per llegir/escriure el full privat.

Cada execució actualitza o crea files d'`EVENTS` per `Event ID`, compta únicament les files `PARTICIPANTS` amb `Estat=CONFIRMADA` i no elimina mai files històriques o esdeveniments que ja no siguin reservables. No hi ha cap planificació automàtica en aquesta fase.

## Desplegament a Netlify

1. Connecta el repositori a Netlify.
2. Defineix `GOOGLE_SERVICE_ACCOUNT_JSON` a Site configuration > Environment variables amb el JSON complet del Service Account.
3. Opcionalment defineix `GOOGLE_CALENDAR_ID` si algun dia cal canviar el calendari sense tocar codi.
4. Publica el site. `netlify.toml` ja defineix `publish = "."` i `functions = "netlify/functions"`.
5. Incrusta la URL publica de Netlify dins Wix Studio amb un iframe.

## Comprovacions

Per revisar sintaxi JavaScript:

```bash
npm run check
```

Aquest projecte no utilitza React, Vue ni cap framework frontend. La base actual es deliberadament minima per validar la connexio i deixar preparada la fase de disseny definitiva.
