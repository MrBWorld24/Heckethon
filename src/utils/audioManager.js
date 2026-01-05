// src/utils/audioManager.js

class AudioManager {
    constructor() {
        this.audioContext = null;
        this.oscillator = null;
        this.isInitialized = false;
    }

    // Call this on a USER INTERACTION (Start Button Click)
    initialize() {
        if (this.isInitialized) return;

        try {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();

            // Unlock iOS/Android: Play a silent buffer immediately
            const buffer = this.audioContext.createBuffer(1, 1, 22050);
            const source = this.audioContext.createBufferSource();
            source.buffer = buffer;
            source.connect(this.audioContext.destination);
            source.start(0);

            if (this.audioContext.state === 'suspended') {
                this.audioContext.resume();
            }

            this.isInitialized = true;
            console.log("[Audio] Initialized and Unlocked");
        } catch (e) {
            console.error("[Audio] Failed to initialize", e);
        }
    }

    playSiren() {
        if (!this.isInitialized || !this.audioContext) {
            console.warn("[Audio] Context not ready. Trying to resume...");
            this.initialize(); // Last ditch effort
        }

        // Resume checks
        if (this.audioContext.state === 'suspended') {
            this.audioContext.resume();
        }

        if (this.oscillator) return; // Already playing

        try {
            const ctx = this.audioContext;
            const osc = ctx.createOscillator();
            const gain = ctx.createGain();

            // Better Siren Sound: Sawtooth with modulation
            osc.type = 'sawtooth';
            osc.frequency.setValueAtTime(600, ctx.currentTime);
            osc.frequency.linearRampToValueAtTime(1200, ctx.currentTime + 0.3); // Up
            osc.frequency.linearRampToValueAtTime(600, ctx.currentTime + 0.6);  // Down

            // Loop the ramp? Web Audio API simple looping is manual usually, 
            // but for simplicity we rely on re-triggering or just a constant annoying tone if ramp ends.
            // Let's make it a constant annoying pulse for now to be simpler than scheduling loops.
            // Actually, let's schedule a few seconds of modulation which covers most "Alert" durations.

            const now = ctx.currentTime;
            for (let i = 0; i < 10; i++) { // Schedule 10 seconds of siren
                osc.frequency.linearRampToValueAtTime(1200, now + i + 0.5);
                osc.frequency.linearRampToValueAtTime(600, now + i + 1.0);
            }

            gain.gain.value = 0.8;

            osc.connect(gain);
            gain.connect(ctx.destination);
            osc.start();

            this.oscillator = osc;
        } catch (e) {
            console.error("[Audio] Play Error", e);
        }

        // Always trigger vibration as fallback/companion
        if (navigator.vibrate) {
            navigator.vibrate([500, 200, 500, 200, 500]);
        }
    }

    stopSiren() {
        if (this.oscillator) {
            try {
                this.oscillator.stop();
                this.oscillator.disconnect();
            } catch (e) { }
            this.oscillator = null;
        }
        // Stop vibration
        if (navigator.vibrate) {
            navigator.vibrate(0);
        }
    }
}

// Export singleton
export const audioManager = new AudioManager();
