"use server";

import { randomUUID } from "node:crypto";
import type { z } from "zod";
import { entitySchemas, type EntityType } from "../validation/schemas";

type EntityRecord<TType extends EntityType> = z.infer<(typeof entitySchemas)[TType]>;

type Store = {
  [K in EntityType]: Map<string, EntityRecord<K>>;
};

const store: Store = {
  equity: new Map(),
  crypto: new Map(),
  cash: new Map(),
  realEstate: new Map(),
  loan: new Map(),
};

function parseEntity<TType extends EntityType>(type: TType, payload: unknown): EntityRecord<TType> {
  return entitySchemas[type].parse(payload) as EntityRecord<TType>;
}

export async function createEntity<TType extends EntityType>(type: TType, payload: unknown) {
  const parsed = parseEntity(type, payload);
  const id = parsed.id ?? randomUUID();
  const record = { ...parsed, id };
  store[type].set(id, record);
  return record;
}

export async function updateEntity<TType extends EntityType>(
  type: TType,
  id: string,
  payload: unknown,
) {
  if (!store[type].has(id)) {
    throw new Error(`Cannot update missing ${type} entity ${id}`);
  }

  const parsed = parseEntity(type, payload);
  const record = { ...parsed, id };
  store[type].set(id, record);
  return record;
}

export async function deleteEntity<TType extends EntityType>(type: TType, id: string) {
  const deleted = store[type].delete(id);
  return { id, deleted };
}

export async function listEntities<TType extends EntityType>(type: TType) {
  return Array.from(store[type].values());
}
