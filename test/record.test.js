// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

'use strict';

const test = require('node:test');
const assert = require('node:assert');
const Q = require('..');

function freshKey() {
  return Q.generateKey();
}

function registerDrone(key) {
  return Q.register({ key, category: 'open', uasClass: 'c2', remoteId: 'RID 0A1B2C3D', operatorRegId: 'GBR OP 1234567', operatorLabel: 'Quantova Survey' });
}

test('a registered drone is a well formed signed record of the operator', () => {
  const operator = freshKey();
  const drone = registerDrone(operator);
  assert.strictEqual(drone.format, 'qdrone/1');
  assert.strictEqual(drone.type, 'register');
  assert.strictEqual(drone.algorithm, 'ML-DSA-65');
  assert.strictEqual(drone.signer.id, Q.keyId(operator));
  assert.strictEqual(drone.statement.operatorKeyId, Q.keyId(operator));
  assert.match(drone.statement.droneId, /^[0-9a-f]{32}$/);
  assert.strictEqual(Buffer.from(drone.signer.publicKey, 'base64').length, Q.PUBLIC_KEY_BYTES);
  assert.strictEqual(Buffer.from(drone.signature, 'base64').length, Q.SIGNATURE_BYTES);
});

test('the authorize, flight and incident records chain to the same drone', () => {
  const operator = freshKey();
  const authority = freshKey();
  const pilot = freshKey();
  const drone = registerDrone(operator);
  const auth = Q.authorize({ key: authority, register: drone, airspace: 'EGLL CTR' });
  const flown = Q.flight({ key: pilot, record: auth, area: 'Richmond Park survey grid' });
  const inc = Q.incident({ key: pilot, record: flown, severity: 'minor' });
  assert.strictEqual(auth.statement.droneId, drone.statement.droneId);
  assert.strictEqual(auth.statement.registerRef, Q.recordRef(drone));
  assert.strictEqual(flown.statement.priorRef, Q.recordRef(auth));
  assert.strictEqual(inc.statement.priorRef, Q.recordRef(flown));
  assert.strictEqual(inc.statement.severity, 'minor');
});

test('invalid inputs are refused before anything is signed', () => {
  const key = freshKey();
  const base = { key, category: 'open', uasClass: 'c2', remoteId: 'R1', operatorRegId: 'O1' };
  assert.throws(() => Q.register(Object.assign({}, base, { category: 'military' })), /category must be one of/);
  assert.throws(() => Q.register(Object.assign({}, base, { uasClass: 'c9' })), /uasClass must be one of/);
  assert.throws(() => Q.register(Object.assign({}, base, { remoteId: '' })), /remoteId is 1 to/);
  assert.throws(() => Q.register(Object.assign({}, base, { unknownField: 1 })), /is not an option of register/);
  const drone = registerDrone(key);
  assert.throws(() => Q.incident({ key, record: drone, severity: 'catastrophic' }), /severity must be one of/);
});

test('a signing key must be a well formed 32 byte seed', () => {
  assert.throws(() => registerDrone(new Uint8Array(16)), /32 byte Uint8Array seed/);
  assert.throws(() => registerDrone(new Uint8Array(32)), /too few different byte values/);
});

test('a well formed record verifies and a type mismatch is invalid', async () => {
  const operator = freshKey();
  const drone = registerDrone(operator);
  const ok = await Q.verify(drone, { type: 'register', network: 'testnet', requireAnchor: false, strict: false });
  assert.strictEqual(ok.status, 'valid');
  assert.strictEqual(ok.type, 'register');
  assert.strictEqual(ok.droneId, drone.statement.droneId);
  const wrongType = await Q.verify(drone, { type: 'authorize', network: 'testnet', requireAnchor: false, strict: false });
  assert.strictEqual(wrongType.status, 'invalid');
  const wrongSigner = await Q.verify(drone, { type: 'register', network: 'testnet', requireAnchor: false, strict: false, signerKeyId: Q.keyId(freshKey()) });
  assert.strictEqual(wrongSigner.status, 'invalid');
});

test('a tampered statement no longer verifies', async () => {
  const operator = freshKey();
  const drone = registerDrone(operator);
  const forged = JSON.parse(JSON.stringify(drone));
  forged.statement.uasClass = 'c4';
  const r = await Q.verify(forged, { type: 'register', network: 'testnet', requireAnchor: false, strict: false });
  assert.strictEqual(r.status, 'invalid');
  assert.ok(r.checks.some((c) => c.name === 'signature' && !c.ok));
});

test('the prior link binds a record to the record before it', async () => {
  const operator = freshKey();
  const authority = freshKey();
  const drone = registerDrone(operator);
  const auth = Q.authorize({ key: authority, register: drone, airspace: 'EGLL CTR' });
  const good = await Q.verify(auth, { type: 'authorize', network: 'testnet', requireAnchor: false, strict: false, prior: drone });
  assert.ok(good.checks.some((c) => c.name === 'prior' && c.ok));
  const otherDrone = registerDrone(operator);
  const bad = await Q.verify(auth, { type: 'authorize', network: 'testnet', requireAnchor: false, strict: false, prior: otherDrone });
  assert.strictEqual(bad.status, 'invalid');
  assert.ok(bad.checks.some((c) => c.name === 'prior' && !c.ok));
});

test('droneRef is deterministic for the same secret and reference and differs otherwise', () => {
  const secret = new Uint8Array(32);
  globalThis.crypto.getRandomValues(secret);
  const a = Q.droneRef(secret, 'RID 0A1B2C3D');
  const b = Q.droneRef(secret, 'RID 0A1B2C3D');
  const c = Q.droneRef(secret, 'RID 0A1B2C3E');
  assert.strictEqual(a, b);
  assert.notStrictEqual(a, c);
  assert.match(a, /^[0-9a-f]{64}$/);
});

test('the kind and constants are the ones pinned for the uas line', () => {
  assert.strictEqual(Q.KIND, 1406);
  assert.strictEqual(Q.FORMAT, 'qdrone/1');
  assert.deepStrictEqual([...Q.TYPES], ['register', 'authorize', 'flight', 'incident', 'retire']);
  assert.deepStrictEqual([...Q.CATEGORIES], ['open', 'specific', 'certified']);
  assert.deepStrictEqual([...Q.SEVERITIES], ['none', 'minor', 'serious', 'accident']);
});
