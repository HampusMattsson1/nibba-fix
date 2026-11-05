const area = process.env.ELPRIS_AREA || 'SE4';
if (!/^SE[1-4]$/.test(area)) {
    throw new Error('ELPRIS_AREA must be SE1, SE2, SE3, or SE4');
}

const dateParts = Object.fromEntries(
    new Intl.DateTimeFormat('en-CA', {
        timeZone: 'Europe/Stockholm',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    }).formatToParts(new Date())
        .filter(part => part.type !== 'literal')
        .map(part => [part.type, part.value])
);
const day = `${dateParts.year}-${dateParts.month}-${dateParts.day}`;
const url = `https://www.elprisetjustnu.se/api/v1/prices/${day.slice(0, 4)}/${day.slice(5, 7)}-${day.slice(8, 10)}_${area}.json`;

async function main() {
    const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
    if (!response.ok) {
        throw new Error(`Elpris API returned HTTP ${response.status}`);
    }

    const prices = await response.json();
    if (!Array.isArray(prices) || prices.length === 0) {
        throw new Error('Elpris API returned no price intervals');
    }

    for (const price of prices) {
        if (!Number.isFinite(price.SEK_per_kWh) ||
            !Number.isFinite(Date.parse(price.time_start)) ||
            !Number.isFinite(Date.parse(price.time_end))) {
            throw new Error('Elpris API returned an invalid price interval');
        }
    }

    const now = Date.now();
    const currentPrice = prices.find(price =>
        Date.parse(price.time_start) <= now && now < Date.parse(price.time_end));
    if (!currentPrice) {
        throw new Error('Elpris API response does not contain the current interval');
    }

    console.log(`Elpris API OK: ${area}, ${day}, ${prices.length} intervals; current ${currentPrice.SEK_per_kWh} SEK/kWh`);
}

main().catch(error => {
    console.error(error.message);
    process.exitCode = 1;
});
