export const STORAGE_KEY = 'cropguard_history';

export function saveDetection(detection) {
    try {
        const history = getHistory();
        // Prevent spam: Don't save if the last detection was less than 10 seconds ago for the same animal
        const last = history[0];
        const now = Date.now();
        if (last && last.label === detection.label && (now - last.timestamp) < 10000) {
            return;
        }

        const newRecord = {
            ...detection,
            timestamp: now,
            dateString: new Date().toLocaleString()
        };

        // Keep last 50 only
        const updated = [newRecord, ...history].slice(0, 50);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(updated));
        return true; // Saved
    } catch (e) {
        console.error("Storage failed", e);
        return false;
    }
}

export function getHistory() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        return raw ? JSON.parse(raw) : [];
    } catch (e) {
        return [];
    }
}

export function clearHistory() {
    localStorage.removeItem(STORAGE_KEY);
}
