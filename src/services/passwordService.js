const crypto = require("crypto");
const util = require("util");

const scrypt = util.promisify(crypto.scrypt);

async function hashPassword(password) {
  const salt = crypto.randomBytes(16).toString("hex");
  const derivedKey = await scrypt(password, salt, 64);
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password, storedPassword) {
  const separatorPosition = storedPassword.indexOf(":");
  if (separatorPosition < 1) {
    return false;
  }

  const salt = storedPassword.slice(0, separatorPosition);
  const storedKeyText = storedPassword.slice(separatorPosition + 1);
  const storedKey = Buffer.from(storedKeyText, "hex");
  const derivedKey = await scrypt(password, salt, 64);

  if (storedKey.length !== derivedKey.length) {
    return false;
  }

  return crypto.timingSafeEqual(storedKey, derivedKey);
}

module.exports = { hashPassword, verifyPassword };
