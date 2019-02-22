const { Client } = require('pg');

const connectionString = process.env.DATABASE_URL;

/**
 * Framkvæmir SQL fyrirspurn á gagnagrunn sem keyrir á `DATABASE_URL`,
 * skilgreint í `.env`
 *
 * @param {string} q Query til að keyra
 * @param {array} values Fylki af gildum fyrir query
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
async function query(q, values = []) {
  const client = new Client({ connectionString });

  await client.connect();

  try {
    const result = await client.query(q, values);

    return result;
  } catch (err) {
    throw err;
  } finally {
    await client.end();
  }
}

/**
 * Bætir við umsókn.
 *
 * @param {array} data Fylki af gögnum fyrir umsókn
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
async function insert(data) {
  const q = `
INSERT INTO applications
(name, email, phone, text, job)
VALUES
($1, $2, $3, $4, $5)`;
  const values = [data.name, data.email, data.phone, data.text, data.job];

  return query(q, values);
}

/**
 * Sækir allar umsóknir
 *
 * @returns {array} Fylki af öllum umsóknum
 */
async function select() {
  const result = await query('SELECT * FROM applications ORDER BY id');

  return result.rows;
}

/**
 * Sækir alla notendurs
 *
 * @returns {array} Fylki af öllum umsóknum
 */
async function selectUsers() {
  const result = await query('SELECT * FROM users ORDER BY id');

  return result.rows;
}

/**
 * Uppfærir umsókn sem unna.
 *
 * @param {string} id Id á umsókn
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
async function update(id) {
  const q = `
UPDATE applications
SET processed = true, updated = current_timestamp
WHERE id = $1`;

  return query(q, [id]);
}

/**
 * Uppfærir notanda sem admin
 *
 * @param {string} id Id á notanda
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
async function giveAdmin(id) {
  const q = `
UPDATE users
SET admin = true
WHERE id = $1`;

  return query(q, [id]);
}

/**
 * tekur admin réttindi af öllum notendum
 *
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
async function takeAdmin() {
  const q = `
UPDATE users
SET admin = false`;

  return query(q);
}

/**
 * Eyðir umsókn.
 *
 * @param {string} id Id á umsókn
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
async function deleteRow(id) {
  const q = 'DELETE FROM applications WHERE id = $1';

  return query(q, [id]);
}

/**
 * Bætir við notanda.
 *
 * @param {array} data Fylki af gögnum fyrir notanda
 * @returns {object} Hlut með niðurstöðu af því að keyra fyrirspurn
 */
async function insertUser(data) {
  const q = `
INSERT INTO users
(username, password, name, email)
VALUES
($1, $2, $3, $4)`;
  const values = [data.username, data.password, data.name, data.email];

  return query(q, values);
}

module.exports = {
  insert,
  select,
  update,
  deleteRow, // delete er frátekið orð
  insertUser,
  query,
  selectUsers,
  giveAdmin,
  takeAdmin,
};
