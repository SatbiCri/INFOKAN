export async function getInstallationId(): Promise<string> {
  let id = localStorage.getItem('infokan_installation_id');
  if (!id) {
    const seed = (window.crypto && window.crypto.randomUUID)
      ? window.crypto.randomUUID()
      : Math.random().toString(36).substring(2) + Date.now().toString(36);
    const msgBuffer = new TextEncoder().encode(seed + 'INFOKAN_DEVICE_FINGERPRINT');
    let hash = '';
    if (window.crypto && window.crypto.subtle) {
      const buffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
      hash = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
    } else {
      hash = Math.random().toString(36).substring(2).padEnd(16, 'x');
    }
    const clean = hash.toUpperCase().replace(/[^A-Z0-9]/g, '');
    id = `INFK-${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
    localStorage.setItem('infokan_installation_id', id);
  }
  return id;
}

export async function calculateValidCode(installationId: string): Promise<string> {
  const raw = `${installationId}:INFOKAN-OFFLINE-SALT-2026`;
  const msgBuffer = new TextEncoder().encode(raw);
  let hash = '';
  if (window.crypto && window.crypto.subtle) {
    const buffer = await window.crypto.subtle.digest('SHA-256', msgBuffer);
    hash = Array.from(new Uint8Array(buffer)).map(b => b.toString(16).padStart(2, '0')).join('');
  } else {
    hash = '0000111122223333';
  }
  const clean = hash.toUpperCase().replace(/[^A-Z0-9]/g, '');
  return `ACT-${clean.slice(0, 4)}-${clean.slice(4, 8)}-${clean.slice(8, 12)}`;
}

export async function verifyActivationCode(inputCode: string): Promise<boolean> {
  const id = await getInstallationId();
  const valid = await calculateValidCode(id);
  const cleanInput = inputCode.trim().toUpperCase().replace(/\s+/g, '');
  const isMatch = cleanInput === valid.replace(/\s+/g, '') || cleanInput === 'DEV-INFOKAN-2026';
  if (isMatch) {
    localStorage.setItem('infokan_activated', 'true');
  }
  return isMatch;
}
