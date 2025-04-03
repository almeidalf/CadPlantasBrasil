require('dotenv').config();

const user = encodeURIComponent(process.env.DB_USER);
const pass = encodeURIComponent(process.env.DB_PASS);
const host = process.env.DB_HOST;
const port = process.env.DB_PORT;
const dbName = process.env.DB_NAME;

const mongoUri = `mongodb://${user}:${pass}@${host}:${port}/${dbName}?authSource=admin`;

module.exports = mongoUri;