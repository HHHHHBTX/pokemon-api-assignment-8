// Hang Liu - CS5610 Mini Assignment 8: Pokemon API with Cookies

import { Hono } from 'hono';
import { serve } from '@hono/node-server';
import { getCookie, setCookie, deleteCookie } from 'hono/cookie';

export const app = new Hono();

// In-memory user data.
const users = [];

// In-memory Pokemon data.
const pokemon = [
  {
    id: 1,
    name: 'Pikachu',
    species: 'Pikachu',
    health: 100,
    level: 5,
    owner: 'Ash',
  },
];

const allowedFields = new Set([
  'name',
  'species',
  'health',
  'level',
  'owner',
]);

const isNonEmptyString = (value) =>
  typeof value === 'string' && value.trim().length > 0;

const isValidNumber = (value) =>
  typeof value === 'number' &&
  Number.isFinite(value) &&
  value >= 0;

const isValidLevel = (value) =>
  Number.isInteger(value) && value >= 1;

// Validate Pokemon data.
function validate(body, creating = false) {
  if (!body || typeof body !== 'object' || Array.isArray(body)) {
    return 'Body must be a JSON object';
  }

  if ('id' in body) {
    return 'ID cannot be provided or modified';
  }

  if (Object.keys(body).some((key) => !allowedFields.has(key))) {
    return 'Unknown field provided';
  }

  if (creating && !isNonEmptyString(body.species)) {
    return 'Species is required';
  }

  for (const field of ['name', 'species']) {
    if (field in body && !isNonEmptyString(body[field])) {
      return `${field} must be a non-empty string`;
    }
  }

  if ('health' in body && !isValidNumber(body.health)) {
    return 'Health must be a non-negative number';
  }

  if ('level' in body && !isValidLevel(body.level)) {
    return 'Level must be a positive integer';
  }

  return null;
}

// Parse and validate Pokemon ID.
function parseId(raw) {
  if (!/^[1-9]\d*$/.test(raw)) {
    return null;
  }

  const id = Number(raw);

  return Number.isSafeInteger(id) ? id : null;
}

// Safely read JSON request bodies.
async function readJson(c) {
  try {
    return { body: await c.req.json() };
  } catch {
    return {
      error: 'Request body must contain valid JSON',
    };
  }
}

// Check whether the username cookie belongs to a registered user.
function getCurrentUser(c) {
  const username = getCookie(c, 'username');

  if (!username) {
    return null;
  }

  return users.find((user) => user.username === username) || null;
}

// Set the username cookie.
function loginUser(c, username) {
  setCookie(c, 'username', username, {
    path: '/',
    httpOnly: true,
    sameSite: 'Lax',
  });
}

// --------------------------------------------------
// API 1: POST /user/register
// Register a new user and set the username cookie.
// --------------------------------------------------

app.post('/user/register', async (c) => {
  const { body, error } = await readJson(c);

  if (error) {
    return c.json({ error }, 400);
  }

  if (
    !isNonEmptyString(body?.username) ||
    !isNonEmptyString(body?.password)
  ) {
    return c.json(
      { error: 'Username and password are required' },
      400
    );
  }

  const username = body.username.trim();

  if (users.some((user) => user.username === username)) {
    return c.json({ error: 'Username already exists' }, 409);
  }

  const user = {
    username,
    password: body.password,
    createdAt: new Date().toISOString(),
  };

  users.push(user);

  loginUser(c, username);

  return c.json(
    {
      message: 'User registered successfully',
      username: user.username,
      createdAt: user.createdAt,
    },
    201
  );
});

// --------------------------------------------------
// API 2: POST /user/login
// Verify credentials and set the username cookie.
// --------------------------------------------------

app.post('/user/login', async (c) => {
  const { body, error } = await readJson(c);

  if (error) {
    return c.json({ error }, 400);
  }

  if (
    !isNonEmptyString(body?.username) ||
    !isNonEmptyString(body?.password)
  ) {
    return c.json(
      { error: 'Username and password are required' },
      400
    );
  }

  const user = users.find(
    (item) =>
      item.username === body.username.trim() &&
      item.password === body.password
  );

  if (!user) {
    return c.json(
      { error: 'Invalid username or password' },
      401
    );
  }

  loginUser(c, user.username);

  return c.json({
    message: 'Login successful',
    username: user.username,
  });
});

// --------------------------------------------------
// API 3: POST /user/logout
// Clear the username cookie.
// --------------------------------------------------

app.post('/user/logout', (c) => {
  deleteCookie(c, 'username', {
    path: '/',
  });

  return c.json({
    message: 'Logout successful',
  });
});

// --------------------------------------------------
// API 4: GET /api/pokemon
// Retrieve only Pokemon owned by the current user.
// --------------------------------------------------

app.get('/api/pokemon', (c) => {
  const user = getCurrentUser(c);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const ownedPokemon = pokemon.filter(
    (item) => item.owner === user.username
  );

  return c.json(ownedPokemon);
});

// --------------------------------------------------
// API 5: POST /api/pokemon
// Create a Pokemon owned by the current user.
// --------------------------------------------------

app.post('/api/pokemon', async (c) => {
  const user = getCurrentUser(c);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const { body, error } = await readJson(c);

  if (error) {
    return c.json({ error }, 400);
  }

  const validationError = validate(body, true);

  if (validationError) {
    return c.json({ error: validationError }, 400);
  }

  let id;

  do {
    id = Math.floor(Math.random() * 1_000_000_000) + 1;
  } while (pokemon.some((item) => item.id === id));

  const created = {
    id,
    name: ('name' in body ? body.name : body.species).trim(),
    species: body.species.trim(),
    health: Math.floor(Math.random() * 101) + 50,
    level: Math.floor(Math.random() * 100) + 1,
    owner: user.username,
  };

  pokemon.push(created);

  return c.json(created, 201);
});

// --------------------------------------------------
// API 6: DELETE /api/pokemon/:id
// Delete a Pokemon only if the current user owns it.
// --------------------------------------------------

app.delete('/api/pokemon/:id', (c) => {
  const user = getCurrentUser(c);

  if (!user) {
    return c.json({ error: 'Unauthorized' }, 401);
  }

  const id = parseId(c.req.param('id'));

  if (id === null) {
    return c.json({ error: 'Invalid Pokemon ID' }, 400);
  }

  const index = pokemon.findIndex((item) => item.id === id);

  if (index === -1) {
    return c.json({ error: 'Pokemon not found' }, 404);
  }

  if (pokemon[index].owner !== user.username) {
    return c.json(
      { error: 'You do not own this Pokemon' },
      403
    );
  }

  pokemon.splice(index, 1);

  return c.body(null, 204);
});

// --------------------------------------------------
// Start server only when not running Node.js tests.
// --------------------------------------------------

if (
  process.env.NODE_ENV !== 'test' &&
  process.env.NODE_TEST_CONTEXT === undefined
) {
  const port = Number(process.env.PORT) || 3000;

  serve(
    {
      fetch: app.fetch,
      port,
    },
    () => {
      console.log(
        `Pokemon API running at http://localhost:${port}`
      );
    }
  );
}