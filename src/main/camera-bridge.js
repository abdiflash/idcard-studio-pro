const axios = require('axios');

const DIGICAM_URL = 'http://localhost:5513';

class CameraBridge {
  static async checkConnection() {
    try {
      const response = await axios.get(`${DIGICAM_URL}/api/ping`, { timeout: 1500 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  static async setSetting(param, value) {
    if (!value || value === 'auto') return true;
    try {
      await axios.get(`${DIGICAM_URL}/api/set?param=${encodeURIComponent(param)}&value=${encodeURIComponent(value)}`, { timeout: 3000 });
      return true;
    } catch (err) {
      throw new Error(`Gagal mengubah ${param}: ${err.message}`);
    }
  }

  static async capture() {
    try {
      const response = await axios.get(`${DIGICAM_URL}/?CMD=Capture`, { timeout: 5000 });
      return response.data;
    } catch (err) {
      throw new Error(`Gagal memicu jepretan kamera: ${err.message}`);
    }
  }
}

module.exports = CameraBridge;
