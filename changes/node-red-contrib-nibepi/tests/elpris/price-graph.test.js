const assert = require('node:assert/strict');
const test = require('node:test');

const buildPriceGraph = require('../../price_graph.js');

const today = [
    { startsAt: '2026-11-06T00:00:00+01:00', energy: 0.5, level: 'CHEAP' },
    { startsAt: '2026-11-06T00:15:00+01:00', energy: 1.2, level: 'EXPENSIVE' }
];

test('builds price and curve series from elpris levels', () => {
    const graph = buildPriceGraph({ today, tomorrow: [] }, { heat_cheap_s1: 2, heat_expensive_s1: -1 }, 's1');
    const [series] = graph.values;

    assert.deepEqual(series.series, ['Pris', 'Kurvjustering']);
    assert.deepEqual(series.data[0].map(p => p.y), [50, 120]);
    assert.deepEqual(series.data[1].map(p => p.y), [2, -1]);
    assert.equal(graph.system, 's1');
});

test('accepts curve adjustments stored as strings', () => {
    const graph = buildPriceGraph({ today, tomorrow: [] }, { heat_cheap_s1: '2', heat_expensive_s1: '-1' }, 's1');

    assert.deepEqual(graph.values[0].data[1].map(p => p.y), [2, -1]);
});

test('treats missing tomorrow prices as empty', () => {
    const graph = buildPriceGraph({ today }, {}, 's1');

    assert.equal(graph.values[0].data[0].length, 2);
});

test('sorts points by timestamp', () => {
    const reversed = [today[1], today[0]];
    const graph = buildPriceGraph({ today: reversed }, {}, 's1');
    const xs = graph.values[0].data[0].map(p => p.x);

    assert.deepEqual(xs, [...xs].sort((a, b) => a - b));
    assert.equal(xs.length, 2);
});

test('uses zero adjustment for unknown levels', () => {
    const graph = buildPriceGraph(
        { today: [{ startsAt: '2026-11-06T00:00:00+01:00', energy: 0.3, level: 'UNKNOWN' }] },
        { heat_normal_s1: 5 },
        's1'
    );

    assert.deepEqual(graph.values[0].data[1].map(p => p.y), [0]);
});
