# QDrone

QDrone is a live production post quantum registration, remote identification and flight authorization record tool for civil unmanned aircraft on the Quantova network. It proves the registration, authorization, flight, incident report and deregistration of a civil drone, and it lets any third party confirm that history without trusting the party that created it.

QDrone proves records without disclosing them. Operator identities and operational details stay private on the systems of the party that holds them. Only a salted cryptographic commitment is written to the chain, and no commercial detail is ever published.

## What it records

Each record is a signed envelope of one of five types.

1. register, an operator registers a civil drone with its category, class, remote identification and operator registration number.
2. authorize, an authority grants a flight authorization in a named airspace.
3. flight, a remote pilot logs a flown operation in a named area.
4. incident, a reporter records an occurrence and its severity.
5. retire, the holder deregisters the drone and states why.

Every record is signed with ML-DSA-65 under FIPS 204 by the party whose role it names, and each later record links to the one before it so the whole life of a drone forms a chain.

## Proving the time

A record on its own carries only the claim of its signer. Anchoring a record on the Quantova network through Qstamp adds a post quantum evidence anchor that fixes the latest moment the record existed, provable against the record and the signer by anyone, without claiming a regulated timestamp status that Quantova Inc does not hold.

## Install

```
npm install @quantovainc/qdrone
```

## Use

```js
const qdrone = require('@quantovainc/qdrone');

const operator = qdrone.generateKey();
const drone = qdrone.register({
  key: operator,
  category: 'open',
  uasClass: 'c2',
  remoteId: 'RID 0A1B2C3D',
  operatorRegId: 'GBR OP 1234567',
  operatorLabel: 'Quantova Survey',
});

const anchored = await qdrone.anchor(drone, { seed, index: 0, network: 'testnet' });
const result = await qdrone.verify(anchored[0], { type: 'register', network: 'testnet' });
```

## What a record does not establish

1. It does not show that the stated facts are true. It shows only that the signer stated them and that the statement existed unchanged at a point in time.
2. It does not identify a natural or legal person. The signer is a chain address, and linking an address to an operator, authority or pilot is a separate attestation.
3. The labels are text written by the signer, they are not a verified identity.

## License

Apache-2.0 OR MIT
