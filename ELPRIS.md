# Elprisetjustnu.se som källa för Tibber-flödet

Dokumentation för implementationen som gör det möjligt att använda elprisetjustnu.se i stället för Tibber. Källan väljs med tokenformatet `elpris:SE1` till `elpris:SE4`.

## Sammanfattning

- Om Tibber-token har formatet `elpris:SE#` hämtas priserna från elprisetjustnu.se.
- Annars används Tibber som tidigare.
- Vid varje hämtning skickas en statusrapport som visas i nodstatus och i dashboarden.

## Ändrade filer

| Fil | Ändring |
|-----|---------|
| `config_node.js` | Ny `getElprisData()` som hämtar, mappar och cachar priser. `runPrice` väljer källa utifrån token. |
| `price.js` | Lyssnar på `pluginPriceSource`, sätter nodstatus och skickar meddelandet "Elpriskälla" på utgång 1. |
| `translate.json` | Lagt till en mening om `elpris:SE#`-token i SE- och EN-texten. |

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

### Statusrapport (`price.js`)

- Vid lyckad hämtning: grön nodstatus med område och tid (`Elpris SE4 HH:MM`).
- Vid fel: röd nodstatus med felorsaken.
- Meddelandet på utgång 1: `{ topic: "Elpriskälla", payload: { active, area, updated, count } }` eller `{ active: false, area, error }`.

## Driftsättning

### Filer som ska kopieras

Endast dessa tre filer ändras. Kopiera dem till samma filnamn i den installerade paketkatalogen.

| Källa (repo) | Mål (Node-RED) |
|--------------|----------------|
| `c:\Temp\Nibba\node-red-contrib-nibepi\config_node.js` | `<Node-RED-katalog>\node_modules\node-red-contrib-nibepi\config_node.js` |
| `c:\Temp\Nibba\node-red-contrib-nibepi\price.js` | `<Node-RED-katalog>\node_modules\node-red-contrib-nibepi\price.js` |
| `c:\Temp\Nibba\node-red-contrib-nibepi\translate.json` | `<Node-RED-katalog>\node_modules\node-red-contrib-nibepi\translate.json` |

`<Node-RED-katalog>` är normalt `%USERPROFILE%\.node-red` på Windows eller `~/.node-red` på Linux.

Övriga filer ska inte kopieras: `ELPRIS.md`, `package.json`, `config_node.html`, `price.html`, `nibepi/`, `docker/`. De är oförändrade.

Säkerhetskopiera de tre originalfilerna i målkatalogen före kopiering.

### Steg

1. Kopiera de tre filerna enligt tabellen ovan. Alternativt installera om paketet med `npm install <sökväg-till-node-red-contrib-nibepi>`, vilket ger samma resultat.
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
- Testa felfallet genom att ange en ogiltig region, till exempel `elpris:SE5`. Då ska status bli röd. Notera att `SE5` inte matchar tokenmönstret och därför går till Tibber i stället.

## Återgå till Tibber

Ersätt token med Tibber-token. Ingen annan ändring behövs.

## Kända begränsningar

- Priserna är exklusive skatt. `total` är därför lika med `energy`. Tibber-priser inkluderar normalt skatt och avgifter, så de är inte direkt jämförbara.
- Nivåerna motsvarar inte Tibbers nivåer.
- Vid fel försöker noden igen vid varje uppdatering, och varje försök ger ett `fault`-meddelande.
- Ingen körning mot det riktiga API:et eller Node-RED har gjorts. Verifiering i den körande miljön återstår.
- Syntaxkontrollen (`node --check`) av de ändrade JavaScript-filerna och JSON-parsningen av `translate.json` gick igenom.
