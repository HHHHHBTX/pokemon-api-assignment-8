// Hang Liu - Pokemon API tests
import test from 'node:test';
import assert from 'node:assert/strict';
import { app } from './index.js';

const request = (path, method = 'GET', data) => app.request(path, {
  method,
  ...(data === undefined ? {} : { headers: { 'content-type': 'application/json' }, body: JSON.stringify(data) }),
});

test('lists the preloaded Pokemon', async () => {
  const response = await request('/api/pokemon');
  assert.equal(response.status, 200);
  assert.ok((await response.json()).some((p) => p.id === 1 && p.name === 'Pikachu'));
});

test('gets a Pokemon and handles missing IDs', async () => {
  assert.equal((await request('/api/pokemon/1')).status, 200);
  assert.equal((await request('/api/pokemon/999999999')).status, 404);
  assert.equal((await request('/api/pokemon/abc')).status, 400);
});

test('creates, updates, and deletes a Pokemon', async () => {
  const createdResponse = await request('/api/pokemon', 'POST', { species: 'Eevee', owner: 'Misty' });
  assert.equal(createdResponse.status, 201);
  const created = await createdResponse.json();
  assert.equal(created.name, 'Eevee');
  assert.equal(typeof created.id, 'number');
  assert.equal(typeof created.health, 'number');
  assert.equal(typeof created.level, 'number');
  const updatedResponse = await request(`/api/pokemon/${created.id}`, 'PATCH', { health: 80, level: 12 });
  assert.equal(updatedResponse.status, 200);
  assert.equal((await updatedResponse.json()).level, 12);
  assert.equal((await request(`/api/pokemon/${created.id}`, 'DELETE')).status, 204);
  assert.equal((await request(`/api/pokemon/${created.id}`)).status, 404);
});

test('rejects invalid input', async () => {
  for (const data of [{ owner: 'Ash' }, { species: '', owner: 'Ash' }, { species: 'Eevee', owner: 'Ash', id: 2 }, { species: 'Eevee', owner: 'Ash', health: '100' }]) {
    assert.equal((await request('/api/pokemon', 'POST', data)).status, 400);
  }
  assert.equal((await request('/api/pokemon/1', 'PATCH', { level: '10' })).status, 400);
  assert.equal((await request('/api/pokemon/1', 'PATCH', { owner: '' })).status, 400);
});
