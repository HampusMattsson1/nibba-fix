const LEVEL_KEYS = {
    VERY_CHEAP: 'very_cheap',
    CHEAP: 'cheap',
    NORMAL: 'normal',
    EXPENSIVE: 'expensive',
    VERY_EXPENSIVE: 'very_expensive'
};

const toTimestamp = (strDate) => Number(Date.parse(strDate).toFixed());

// priceConfig values may be strings when they come from the UI, so coerce before arithmetic.
function buildPriceGraph(priceInfo, priceConfig, system) {
    const priceArray = (priceInfo.today || []).concat(priceInfo.tomorrow || []);
    priceArray.sort((a, b) => a.energy - b.energy);

    const valueArray = [];
    const adjustArray = [];
    for (const price of priceArray) {
        const timestamp = toTimestamp(price.startsAt);
        const levelKey = LEVEL_KEYS[price.level];
        const adjust = levelKey ? Number(priceConfig[`heat_${levelKey}_${system}`] || 0) : 0;
        valueArray.push({ x: timestamp, y: Number((price.energy * 100).toFixed(2)) });
        adjustArray.push({ x: timestamp, y: Number(adjust.toFixed(2)) });
    }
    valueArray.sort((a, b) => a.x - b.x);
    adjustArray.sort((a, b) => a.x - b.x);

    return {
        values: [{
            series: ['Pris', 'Kurvjustering'],
            data: [valueArray, adjustArray],
            labels: ['Pris', 'Kurvjustering']
        }],
        system: system
    };
}

module.exports = buildPriceGraph;
