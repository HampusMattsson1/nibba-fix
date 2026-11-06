# Elprisetjustnu.se som källa för Tibber-flödet

Dokumentation för implementationen som gör det möjligt att använda elprisetjustnu.se i stället för Tibber. Källan väljs med tokenformatet `elpris:SE1` till `elpris:SE4`.

## Sammanfattning

- Om Tibber-token har formatet `elpris:SE#` hämtas priserna från elprisetjustnu.se.
- Annars används Tibber som tidigare.
- Vid varje hämtning skickas en statusrapport som visas i nodstatus och i dashboarden.

## Ändrade filer

| Fil | Ändring |
|-----|---------|
| `config_node.js` | Ny `getElprisData()` som hämtar, mappar och cachar priser. `runPrice` väljer källa utifrån token. `tibberBuildGraph` anropar `buildPriceGraph`. Exponerar `runElpris`. |
| `price_graph.js` | Ny modul. Bygger prisgrafens serier. Hanterar strängvärden i kurvjusteringen och saknad morgondagslista. |
| `price.js` | Lyssnar på `pluginPriceSource`, sätter nodstatus, gör startkontrollen och skickar meddelandet "Elpriskälla" på första utgången (Price). |
| `translate.json` | Lagt till en mening om `elpris:SE#`-token i SE- och EN-texten. |
| `tests/elpris/` | Automatiska tester (`node:test`), Containerfile och live-API-test. |

## Teknisk beskrivning

### Hämtning (`config_node.js`)

- URL: `https://www.elprisetjustnu.se/api/v1/prices/ÅÅÅÅ/MM-DD_SE#.json`.
- Dagens datum beräknas i tidszonen Europe/Stockholm. Morgondagen beräknas från samma datum.
- Morgondagens priser publiceras ca 13:00. Saknas de (HTTP 404) används `[]`.
- Svar cachas i 15 minuter per område och dag.
- Vid fel (ogiltigt svar, HTTP-fel, inget aktuellt pris) skickas `pluginPriceSource` med `active: false` och `error`, samt ett `fault`-meddelande.

### Mappning till Tibber-format

Svaret mappas till samma struktur som Tibber returnerar, så `priceAdjustCurve` och `tibberBuildGraph` fungerar oförändrade:

```
data.viewer.homes[0].currentSubscription.priceInfo = { today, tomorrow, current }
```

Varje post får fälten `startsAt`, `endsAt`, `total`, `energy`, `tax` (alltid 0) och `level`.

### Prisgraf (`price_graph.js`)

`buildPriceGraph` skapar `values` för `Graf` i samma format som Tibber. Kurvjusteringen läses från `heat_<nivå>_<system>` i prisinställningarna. Värdena kan vara strängar från webb-gränssnittet och konverteras därför med `Number()` innan de används. Saknas `tomorrow` behandlas det som tom lista.

### Prisnivåer

elprisetjustnu.se har inga nivåer. Nivåerna beräknas relativt dygnets medelpris:

| Nivå | Kvot mot medelpris |
|------|--------------------|
| VERY_CHEAP | < 0,5 |
| CHEAP | 0,5 till < 0,9 |
| NORMAL | 0,9 till 1,1 |
| EXPENSIVE | > 1,1 till 1,5 |
| VERY_EXPENSIVE | > 1,5 |

Om medelpriset är 0 eller negativt används `VERY_CHEAP` för priser ≤ 0 och `NORMAL` annars.

### Startkontroll (`price.js`)

När prisreglering är aktiverad, källan är Tibber och token är `elpris:SE1` till `elpris:SE4` görs en API-kontroll direkt vid start (`runElpris`). Den fungerar utan kopplad värmepump och visar resultatet i nodstatus och som `Elpriskälla`. Prisgrafen byggs först när `runPrice` körs.

### Statusrapport (`price.js`)

- Vid lyckad hämtning: grön nodstatus med område och tid (`Elpris SE4 HH:MM`).
- Vid fel: röd nodstatus med felorsaken.
- Meddelandet skickas på första utgången (Price): `{ topic: "Elpriskälla", payload: { active, area, updated, count } }` eller `{ active: false, area, error }`.
- Samma utgång får även `Nuvarande Elprisnivå`, `Nuvarande Elpris` och prisgrafen (`Graf`, två meddelanden: tom lista och sedan serierna).
- Utgång Data får `{ topic: "test", payload: data }` vid prisuppdatering.

## Driftsättning

### Filer som ska kopieras

Endast dessa fyra filer ändras. Kopiera dem till samma filnamn i den installerade paketkatalogen.

| Källa (repo) | Mål (Node-RED) |
|--------------|----------------|
| `changes\node-red-contrib-nibepi\config_node.js` | `<Node-RED-katalog>\node_modules\node-red-contrib-nibepi\config_node.js` |
| `changes\node-red-contrib-nibepi\price_graph.js` | `<Node-RED-katalog>\node_modules\node-red-contrib-nibepi\price_graph.js` |
| `changes\node-red-contrib-nibepi\price.js` | `<Node-RED-katalog>\node_modules\node-red-contrib-nibepi\price.js` |
| `changes\node-red-contrib-nibepi\translate.json` | `<Node-RED-katalog>\node_modules\node-red-contrib-nibepi\translate.json` |

`<Node-RED-katalog>` är normalt `%USERPROFILE%\.node-red` på Windows eller `~/.node-red` på Linux.

Övriga filer ska inte kopieras: `ELPRIS.md`, `package.json`, `config_node.html`, `price.html`, `nibepi/`, `docker/`. De är oförändrade.

Säkerhetskopiera de tre originalfilerna i målkatalogen före kopiering.

### Steg

1. Kopiera de fyra filerna enligt tabellen ovan. Alternativt bygg en paketkatalog av root-paketet med filerna från `changes\node-red-contrib-nibepi\` kopierade över, och installera den med `npm install <sökväg>`. `changes\` saknar `package.json` och går inte att installera direkt.
2. Starta om Node-RED.
3. I konfigurationen: sätt prisdatakälla till Tibber, ange token `elpris:SE4` (eller `SE1`–`SE3`) och aktivera priser.
4. Lägg till en funktionsnod efter `nibe-price` som visar bekräftelsen på dashboarden:

```js
const s = msg.payload;
msg.payload = s.active
    ? `Elpriskälla: elprisetjustnu ${s.area}, uppdaterad ${s.updated}`
    : `Elpriskälla fel: ${s.error}`;
return msg;
```

Filtrera på `msg.topic == "Elpriskälla"` före funktionsnoden. Koppla sedan noden till en ui-text- eller ui-ruta-nod.

## Verifiering

- Hämta API-svaret manuellt, till exempel `https://www.elprisetjustnu.se/api/v1/prices/2026/11-03_SE4.json`. Svaret ska vara en lista med 15-minutersposter.
- Kontrollera att nodstatus blir grön med område och tid.
- Kontrollera att meddelandet "Elpriskälla" syns på dashboarden.
- Felfall: blockera åtkomst till elprisetjustnu.se, till exempel i brandväggen. Då ska status bli röd. Ogiltig region `elpris:SE5` matchar inte tokenmönstret och går till Tibber. Det är avsiktligt.

### Automatiska tester (container, ingen Pi krävs)

Körs enligt [tests/elpris/README.md](changes/node-red-contrib-nibepi/tests/elpris/README.md). Senaste körning: 9 av 9 tester passerade. Fyra gäller nodens status och startkontroll. Fem gäller prisgrafen.

### Runtime-container (Node-RED)

Bygg från projektroten:

```powershell
podman build -f image-to-oci-image/nibepi-runtime/Containerfile -t nibepi-runtime .
```

Kontrollera att Node-RED startar och laddar noderna:

```powershell
podman run --rm nibepi-runtime sh -c "timeout 60 node-red --userDir /home/pi/.node-red > /tmp/nr.log 2>&1; grep -i 'started' /tmp/nr.log"
```

Senaste körning gav `Started flows` och inga `Cannot find module`-fel. Containern saknar `/etc/nibepi/config.json`, så Node-RED loggar ett ENOENT-fel för den filen. Det är väntat utan Pi.

### Live-API

Senaste körningen mot elprisetjustnu.se för SE4 gav 96 intervall för 2026-11-06 och ett aktuellt pris på 3,50545 SEK/kWh.

### Ej verifierat

Ingen av ovanstående körningar bekräftar visning i webb-gränssnittet på en riktig NibePi. Se felsökningen nedan.

## Återgå till Tibber

Ersätt token med Tibber-token. Ingen annan ändring behövs.

## Kända begränsningar

- Priserna är exklusive skatt. `total` är därför lika med `energy`. Tibber-priser inkluderar normalt skatt och avgifter, så de är inte direkt jämförbara.
- Nivåerna motsvarar inte Tibbers nivåer.
- Vid fel försöker noden igen vid varje uppdatering, och varje försök ger ett `fault`-meddelande.
- Verifiering på riktig NibePi återstår. Container-tester och live-API är gjorda, se Verifiering ovan.
- Syntaxkontrollen (`node --check`) av de ändrade JavaScript-filerna och JSON-parsningen av `translate.json` gick igenom.
- En tidigare version kastade `TypeError: adjust.toFixed is not a function` när kurvjusteringen var en sträng. Då skickades ingen prisgraf, även om priset visades. Det är rättat men ej verifierat på Pi.

## Felsökning av tom prisgraf

1. Sök i Node-RED-loggen efter `adjust.toFixed is not a function`. Om raden finns: kopiera om `config_node.js` och `price_graph.js` och starta om Node-RED.
2. Kontrollera att utgången Price från `nibe-price` är kopplad till grafnoden. `Graf` skickas på den utgången, inte på Data.
3. Kontrollera att prisreglering är aktiverad och att token är `elpris:SE#` med källan Tibber. Nodstatus ska bli grön.
4. Om loggen inte visar något av ovanstående: skicka loggraderna och ett flödesexport.
