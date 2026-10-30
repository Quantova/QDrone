// Copyright 2026 Quantova Inc
// SPDX-License-Identifier: Apache-2.0 OR MIT

export type Category = 'open' | 'specific' | 'certified';
export type UasClass = 'c0' | 'c1' | 'c2' | 'c3' | 'c4' | 'c5' | 'c6';
export type Severity = 'none' | 'minor' | 'serious' | 'accident';
export type RecordType = 'register' | 'authorize' | 'flight' | 'incident' | 'retire';

export interface KeyDescription {
  format: 'qdrone-key/1';
  algorithm: 'ML-DSA-65';
  id: string;
  publicKey: string;
}

export interface Signer {
  id: string;
  publicKey: string;
}

export interface Envelope<T = Record<string, unknown>> {
  format: 'qdrone/1';
  type: RecordType;
  algorithm: 'ML-DSA-65';
  signer: Signer;
  statement: T;
  signature: string;
  anchor?: unknown;
}

export interface RegisterOptions {
  key: Uint8Array;
  category: Category;
  uasClass: UasClass;
  remoteId: string;
  operatorRegId: string;
  operatorLabel?: string;
  registeredAt?: string;
  note?: string;
}

export interface AuthorizeOptions {
  key: Uint8Array;
  register: Envelope;
  airspace: string;
  authorityLabel?: string;
  authorizedAt?: string;
  note?: string;
}

export interface FlightOptions {
  key: Uint8Array;
  record: Envelope;
  area: string;
  pilotLabel?: string;
  flownAt?: string;
  note?: string;
}

export interface IncidentOptions {
  key: Uint8Array;
  record: Envelope;
  severity: Severity;
  reporterLabel?: string;
  reportedAt?: string;
  note?: string;
}

export interface RetireOptions {
  key: Uint8Array;
  record: Envelope;
  reason: string;
  retiredAt?: string;
  note?: string;
}

export interface AnchorOptions {
  seed?: Uint8Array;
  index?: number;
  network?: string;
  rpc?: string;
  clients?: unknown[];
  trustSingleEndpoint?: boolean;
  trustCustomEndpoints?: boolean;
  allowLoopback?: boolean;
  maxFee?: string | number | bigint;
  meter?: string | number | bigint;
  timeoutMs?: number;
  onPending?: (pending: unknown) => void;
  signal?: AbortSignal;
}

export interface VerifyOptions {
  type?: RecordType;
  prior?: Envelope;
  droneId?: string;
  signerKeyId?: string;
  signerPublicKey?: string | Uint8Array;
  network: string;
  strict?: boolean;
  requireAnchor?: boolean;
  maxAnchorDelay?: number;
  at?: string;
  deadlineMs?: number;
  rpc?: string;
  clients?: unknown[];
  trustSingleEndpoint?: boolean;
  trustCustomEndpoints?: boolean;
  allowLoopback?: boolean;
}

export interface Check {
  name: string;
  ok: boolean;
  detail: string;
  transport: boolean;
  indeterminate: boolean;
  unproven: boolean;
}

export interface VerifyResult {
  valid: boolean;
  status: 'valid' | 'unproven' | 'indeterminate' | 'invalid';
  type: RecordType | null;
  droneId?: string;
  signerId?: string;
  statement?: Record<string, unknown>;
  anchoredAt?: string | null;
  endpoints: string[];
  officialEndpoints: boolean | null;
  checks: Check[];
}

export function generateKey(): Uint8Array;
export function publicKey(key: Uint8Array): Uint8Array;
export function keyId(key: Uint8Array): string;
export function describeKey(key: Uint8Array): KeyDescription;
export function droneRef(secret: Uint8Array, reference: string): string;
export function register(options: RegisterOptions): Envelope;
export function authorize(options: AuthorizeOptions): Envelope;
export function flight(options: FlightOptions): Envelope;
export function incident(options: IncidentOptions): Envelope;
export function retire(options: RetireOptions): Envelope;
export function anchor(envelopes: Envelope | Envelope[], options: AnchorOptions): Promise<Envelope[]>;
export function complete(envelopes: Envelope | Envelope[], pending: unknown, options?: AnchorOptions): Promise<Envelope[]>;
export function verify(envelope: Envelope, options: VerifyOptions): Promise<VerifyResult>;
export function anchorDigest(envelope: Envelope): string;
export function recordRef(envelope: Envelope): string;

export const FORMAT: 'qdrone/1';
export const ALGORITHM: 'ML-DSA-65';
export const KIND: 1406;
export const TYPES: readonly RecordType[];
export const CATEGORIES: readonly Category[];
export const UAS_CLASSES: readonly UasClass[];
export const SEVERITIES: readonly Severity[];
export const PUBLIC_KEY_BYTES: 1952;
export const SIGNATURE_BYTES: 3309;
