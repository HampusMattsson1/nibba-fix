const assert = require('node:assert/strict');
const { EventEmitter } = require('node:events');
const fs = require('node:fs');
const path = require('node:path');
const test = require('node:test');

const registerPriceNode = require('../../price.js');

function createPriceNode({ enabled = true, token = 'elpris:SE4' } = {}) {
    const registeredTypes = {};
    const statuses = [];
    const sentMessages = [];
    const nibeData = new EventEmitter();
    let probeCount = 0;
    const server = {
        nibe: {
            getConfig: () => ({
                system: { pump: 'F370' },
                home: { inside_sensors: [] },
                price: { enable: enabled, source: 'tibber', token: token }
            })
        },
        nibeData: nibeData,
        runElpris: () => {
            probeCount += 1;
            return Promise.resolve();
        },
        initiatePlugin: () => Promise.resolve(true),
        updateData: () => {}
    };
    const RED = {
        nodes: {
            createNode: (node) => {
                const nodeEvents = new EventEmitter();
                node.on = nodeEvents.on.bind(nodeEvents);
                node.status = (status) => statuses.push(status);
                node.send = (message) => sentMessages.push(message);
                node.id = 'test-price-node';
            },
            getNode: () => server,
            registerType: (name, constructor) => {
                registeredTypes[name] = constructor;
            }
        }
    };

    registerPriceNode(RED);
    new registeredTypes['nibe-price']({ system: 's1' });

    return { nibeData, probeCount: () => probeCount, sentMessages, statuses };
}

test('probes the configured elprisetjustnu source without a connected heat pump', () => {
    const node = createPriceNode();

    assert.equal(node.probeCount(), 1);
    node.nibeData.emit('pluginPriceSource', {
        active: true,
        area: 'SE4',
        updated: '08:00',
        count: 96
    });

    assert.ok(node.statuses.some(status =>
        status.fill === 'green' && status.text === 'Elpris SE4 08:00'));
    assert.ok(node.sentMessages.some(message =>
        message.topic === 'Elpriskälla' && message.payload.count === 96));
});

test('does not probe disabled pricing or a normal Tibber token', () => {
    assert.equal(createPriceNode({ enabled: false }).probeCount(), 0);
    assert.equal(createPriceNode({ token: 'tibber-access-token' }).probeCount(), 0);
});

test('shows API failures in the node status and output', () => {
    const node = createPriceNode();
    node.nibeData.emit('pluginPriceSource', {
        active: false,
        area: 'SE4',
        error: 'offline'
    });

    assert.ok(node.statuses.some(status =>
        status.fill === 'red' && status.text.includes('offline')));
    assert.ok(node.sentMessages.some(message =>
        message.topic === 'Elpriskälla' && message.payload.error === 'offline'));
});

test('exposes the Elpris fetch method on the config node for the startup probe', () => {
    const source = fs.readFileSync(
        path.join(__dirname, '../../config_node.js'),
        'utf8'
    );
    assert.match(source, /this\.runElpris\s*=\s*getElprisData;/);
});
