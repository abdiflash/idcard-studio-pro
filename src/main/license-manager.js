const crypto = require('crypto');
const os = require('os');

class LicenseManager {
  static getHWID() {
    const cpus = os.cpus();
    const cpuModel = cpus && cpus.length > 0 ? cpus[0].model : 'GENERIC_CPU';
    const raw = `${os.hostname()}-${cpuModel}-${os.totalmem()}`;
    return crypto.createHash('sha256').update(raw).digest('hex').substring(0, 16).toUpperCase();
  }

  static verifyKey(key, inputHWID) {
    if (!key || !inputHWID) return false;
    const expected = crypto
      .createHash('sha256')
      .update(`${inputHWID}_SECRET_SALT_2026`)
      .digest('hex')
      .substring(0, 16)
      .toUpperCase();
    return key.trim().toUpperCase() === expected;
  }
}

module.exports = LicenseManager;
