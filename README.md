# Mas Tulsa Events Widget

Widget web professional per mostrar l'agenda d'activitats de Mas Tulsa a partir d'un calendari especific de Google Calendar. El projecte esta preparat per desplegar-se a Netlify i incrustar-se posteriorment a Wix Studio mitjancant un iframe.

Els esdeveniments es gestionen des de Google Calendar. El frontend no conte secrets i sempre consulta una Netlify Function, que es l'unica part encarregada de parlar amb la Google Calendar API.

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
├── /images/events/
└── /assets/
```

## Funcionament general

1. Dani i Xenia creen, editen o eliminen activitats al calendari de Google Calendar.
2. El widget carrega `/api/events`.
3. Netlify redirigeix aquesta ruta a `/.netlify/functions/events`.
4. La funcio consulta la Google Calendar API amb la clau guardada a Netlify.
5. La funcio retorna un JSON net i ordenat cronologicament.
6. `script.js` renderitza una interfície minima amb estats de carrega, buit i error.

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
GOOGLE_CALENDAR_API_KEY=
GOOGLE_CALENDAR_ID=
```

`GOOGLE_CALENDAR_API_KEY` es obligatoria. `GOOGLE_CALENDAR_ID` es opcional perquè el calendari de Mas Tulsa ja esta configurat per defecte dins la funcio.

No escriguis claus reals al repositori. `.gitignore` exclou `.env` i variants locals.

## Configuracio local

Requisits:

- Node.js 18 o superior.
- Netlify CLI instal·lat globalment o disponible via `npx`.
- Una API key de Google Calendar amb acces al calendari indicat.

Per provar-ho localment:

```bash
cp .env.example .env
```

Omple `GOOGLE_CALENDAR_API_KEY` al fitxer `.env` i executa:

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
```

Aquestes dades ja es retornen al JSON, encara que la primera interfície nomes mostra la informacio basica de comprovacio.

## Desplegament a Netlify

1. Connecta el repositori a Netlify.
2. Defineix `GOOGLE_CALENDAR_API_KEY` a Site configuration > Environment variables.
3. Opcionalment defineix `GOOGLE_CALENDAR_ID` si algun dia cal canviar el calendari sense tocar codi.
4. Publica el site. `netlify.toml` ja defineix `publish = "."` i `functions = "netlify/functions"`.
5. Incrusta la URL publica de Netlify dins Wix Studio amb un iframe.

## Comprovacions

Per revisar sintaxi JavaScript:

```bash
npm run check
```

Aquest projecte no utilitza React, Vue ni cap framework frontend. La base actual es deliberadament minima per validar la connexio i deixar preparada la fase de disseny definitiva.
