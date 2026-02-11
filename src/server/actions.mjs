import { stores } from '../entities.mjs';
import { validators } from '../validation/schemas.mjs';

function ensureEntity(entity) {
  if (!stores[entity]) {
    throw new Error(`Unbekannte Entität: ${entity}`);
  }
}

function ensureExists(store, id) {
  if (!store.has(id)) {
    throw new Error(`Datensatz mit id=${id} nicht gefunden.`);
  }
}

export function createEntity(entity, payload) {
  ensureEntity(entity);
  const validation = validators[entity](payload);

  if (!validation.success) {
    return { ok: false, errors: validation.errors };
  }

  const store = stores[entity];
  store.set(validation.data.id, validation.data);

  return { ok: true, data: validation.data };
}

export function updateEntity(entity, id, payload) {
  ensureEntity(entity);
  const store = stores[entity];
  ensureExists(store, id);

  const nextPayload = { ...store.get(id), ...payload, id };
  const validation = validators[entity](nextPayload);

  if (!validation.success) {
    return { ok: false, errors: validation.errors };
  }

  store.set(id, validation.data);
  return { ok: true, data: validation.data };
}

export function deleteEntity(entity, id) {
  ensureEntity(entity);
  const store = stores[entity];
  ensureExists(store, id);
  store.delete(id);
  return { ok: true };
}

export function listEntities(entity) {
  ensureEntity(entity);
  return [...stores[entity].values()];
}
