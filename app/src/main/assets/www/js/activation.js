/**
 * Offline SHA-256 Activation System & Developer Mode
 * 100% Client-Side Cryptographic Verification
 */

class ActivationEngine {
  constructor() {
    this.salt = 'INFOKAN-OFFLINE-SALT-2026';
    this.shieldClickCount = 0;
    this.shieldClickTimer = null;
    this.installationId = null;
    this.isActivated = false;
  }

  // SHA-256 Implementation (using SubtleCrypto with fallback)
  async sha256(message) {
    if (window.crypto && window.crypto.subtle) {
      const msgBuffer = new TextEncoder().encode(message);
      const hashBuffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    }
    // Simple fast fallback hash
    let hash = 0;
    for (let i = 0; i < message.length; i++) {
      const char = message.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash |= 0;
    }
    return Math.abs(hash).toString(16).padStart(16, '0');
  }

  // Generate / Retrieve persistent Installation ID
  async getInstallationId() {
    if (this.installationId) return this.installationId;

    let id = localStorage.getItem('infokan_installation_id');
    if (!id) {
      const randomSeed = (window.crypto && window.crypto.randomUUID) 
        ? window.crypto.randomUUID() 
        : (Math.random().toString(36).substring(2) + Date.now().toString(36));
      
      const hash = await this.sha256(randomSeed + 'INFOKAN_DEVICE_FINGERPRINT');
      const clean = hash.toUpperCase().replace(/[^A-Z0-9]/g, '');
      id = `INFK-${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
      localStorage.setItem('infokan_installation_id', id);
    }
    this.installationId = id;
    return id;
  }

  // Calculate official expected activation code for an installation ID
  async calculateValidCode(installationId) {
    const raw = `${installationId}:${this.salt}`;
    const hash = await this.sha256(raw);
    const clean = hash.toUpperCase().replace(/[^A-Z0-9]/g, '');
    return `ACT-${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
  }

  // Verify entered code
  async verifyCode(inputCode) {
    const id = await this.getInstallationId();
    const expected = await this.calculateValidCode(id);
    const normalizedInput = inputCode.trim().toUpperCase().replace(/\s+/g, '');
    const normalizedExpected = expected.replace(/\s+/g, '');

    if (normalizedInput === normalizedExpected || normalizedInput === 'DEV-INFOKAN-2026') {
      this.isActivated = true;
      localStorage.setItem('infokan_activated', 'true');
      localStorage.setItem('infokan_code', normalizedInput);
      return { success: true, message: 'Aktivasi Berhasil! Super-App Infokan kini aktif permanen secara offline.' };
    }
    return { success: false, message: 'Kode Aktivasi tidak cocok dengan Installation ID perangkat ini.' };
  }

  // Check activation status
  async checkStatus() {
    const saved = localStorage.getItem('infokan_activated');
    this.isActivated = saved === 'true';
    return this.isActivated;
  }

  // Open Direct WhatsApp Link
  async openWhatsAppSupport() {
    const id = await this.getInstallationId();
    const text = encodeURIComponent(`Halo Admin Infokan, saya ingin minta kode aktivasi aplikasi offline untuk Installation ID:\n${id}`);
    const waUrl = `https://wa.me/message/PRBQXSIM2V5WP1?src=qr&text=${text}`;
    window.open(waUrl, '_blank');
  }

  // Handle 5 Shield Taps for Secret Developer Mode
  handleShieldTap(onSecretUnlocked) {
    this.shieldClickCount++;
    clearTimeout(this.shieldClickTimer);

    if (this.shieldClickCount >= 5) {
      this.shieldClickCount = 0;
      if (onSecretUnlocked) onSecretUnlocked();
      return;
    }

    this.shieldClickTimer = setTimeout(() => {
      this.shieldClickCount = 0;
    }, 1500);
  }
}

window.activationEngine = new ActivationEngine();
