import emailjs from '@emailjs/browser';

// ⚠️ REPLACE THESE WITH YOUR ACTUAL EMAILJS CREDENTIALS
const SERVICE_ID = "service_e0ltvis";
const TEMPLATE_ID = "template_92mdtzc";
const PUBLIC_KEY = "xfGFtZfzeDk_0CGW2";

/**
 * Sends an email alert using EmailJS.
 * @param {Object} detection - The detection object { label, confidence, etc. }
 * @param {number} count - Number of animals detected
 */
export const sendAlertEmail = async (detection, count = 1) => {
    if (SERVICE_ID === "YOUR_SERVICE_ID") {
        console.warn("[EmailJS] Credentials not set. Email not sent.");
        return;
    }

    // Get user email from localStorage
    const userEmail = localStorage.getItem('userEmail') || 'no-email-provided@example.com';

    // Format date and time
    const now = new Date();
    const detectionDate = now.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
    });
    const detectionTime = now.toLocaleTimeString('en-IN', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    });

    // Get location (async, with fallback)
    let location = 'Location unavailable';
    try {
        const position = await new Promise((resolve, reject) => {
            navigator.geolocation.getCurrentPosition(resolve, reject, {
                timeout: 5000,
                enableHighAccuracy: false
            });
        });
        const { latitude, longitude } = position.coords;
        location = `${latitude.toFixed(6)}, ${longitude.toFixed(6)}`;
    } catch (error) {
        console.warn('[EmailJS] Could not get location:', error.message);
    }

    // Generate danger warning for multiple animals
    const dangerWarning = count > 1
        ? '🚨 EXTREME DANGER: Multiple animals detected! It is NOT SAFE to go outside. Please stay indoors until the threat has passed.'
        : 'Exercise caution if you need to go outside.';

    const templateParams = {
        email: userEmail,
        animal_type: detection.label,
        count: count,
        date: detectionDate,
        time: detectionTime,
        location: location,
        danger_warning: dangerWarning,
        confidence: `${(detection.confidence * 100).toFixed(0)}%`,
        message: `⚠️ WARNING: ${count} ${detection.label}(s) detected! Confidence: ${(detection.confidence * 100).toFixed(0)}%`,
    };

    try {
        const response = await emailjs.send(SERVICE_ID, TEMPLATE_ID, templateParams, PUBLIC_KEY);
        console.log('[EmailJS] Email sent successfully!', response.status, response.text);
    } catch (error) {
        console.error('[EmailJS] Failed to send email:', error);
    }
};
