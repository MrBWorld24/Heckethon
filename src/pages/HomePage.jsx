import { useNavigate } from 'react-router-dom';
import { Camera, ShieldCheck, History, Mail } from 'lucide-react';
import { audioManager } from '../utils/audioManager';
import { useState, useEffect } from 'react';

export default function HomePage() {
    const navigate = useNavigate();
    const [email, setEmail] = useState('');

    useEffect(() => {
        const savedEmail = localStorage.getItem('userEmail');
        if (savedEmail) setEmail(savedEmail);
    }, []);

    const handleEmailChange = (e) => {
        const newEmail = e.target.value;
        setEmail(newEmail);
        localStorage.setItem('userEmail', newEmail);
    };

    const handleStart = () => {
        audioManager.initialize();
        navigate('/monitor');
    };

    return (
        <div className="fullscreen-container" style={{
            padding: 'var(--space-8)',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'center',
            gap: 'var(--space-8)',
            maxWidth: '480px',
            margin: '0 auto'
        }}>
            {/* Branding */}
            <div className="text-center fade-in">
                <div style={{
                    display: 'inline-flex',
                    padding: 'var(--space-5)',
                    backgroundColor: 'rgba(35, 134, 54, 0.08)',
                    borderRadius: 'var(--radius-xl)',
                    marginBottom: 'var(--space-5)'
                }}>
                    <ShieldCheck size={56} color="var(--color-primary)" strokeWidth={1.5} />
                </div>

                <h1 style={{
                    fontSize: '1.875rem',
                    fontWeight: 700,
                    marginBottom: 'var(--space-2)',
                    letterSpacing: '-0.025em'
                }}>
                    PatchStack CropGuard
                </h1>

                <p style={{
                    color: 'var(--color-text-secondary)',
                    fontSize: '0.875rem',
                    lineHeight: '1.5'
                }}>
                    AI-Powered Wildlife Detection System
                </p>
            </div>

            {/* Email Card */}
            <div className="card fade-in" style={{ animationDelay: '100ms' }}>
                <label className="control-label" htmlFor="email-input" style={{ marginBottom: 'var(--space-2)' }}>
                    Email for Alerts
                </label>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: 'var(--space-3)',
                    padding: 'var(--space-3)',
                    backgroundColor: 'var(--color-bg-secondary)',
                    borderRadius: 'var(--radius-md)',
                    border: '1px solid var(--color-border)'
                }}>
                    <Mail size={18} color="var(--color-text-tertiary)" />
                    <input
                        id="email-input"
                        type="email"
                        placeholder="your.email@example.com"
                        value={email}
                        onChange={handleEmailChange}
                        style={{
                            flex: 1,
                            background: 'transparent',
                            border: 'none',
                            outline: 'none',
                            color: 'var(--color-text-primary)',
                            fontSize: '0.875rem'
                        }}
                    />
                </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--space-3)' }}>
                <button
                    className="btn btn-primary btn-large fade-in"
                    style={{
                        width: '100%',
                        animationDelay: '200ms',
                        height: '56px'
                    }}
                    onClick={handleStart}
                >
                    <Camera size={20} strokeWidth={2} />
                    Start Monitoring
                </button>

                <button
                    className="btn btn-secondary fade-in"
                    style={{
                        width: '100%',
                        animationDelay: '300ms',
                        height: '44px'
                    }}
                    onClick={() => navigate('/history')}
                >
                    <History size={18} strokeWidth={2} />
                    View History
                </button>
            </div>

            {/* Features */}
            <div className="text-center fade-in" style={{
                marginTop: 'auto',
                paddingTop: 'var(--space-6)',
                animationDelay: '400ms'
            }}>
                <div style={{
                    display: 'flex',
                    justifyContent: 'center',
                    gap: 'var(--space-3)',
                    flexWrap: 'wrap',
                    marginBottom: 'var(--space-3)'
                }}>
                    <span className="badge badge-success">Offline Ready</span>
                    <span className="badge badge-success">Night Vision</span>
                    <span className="badge badge-success">Real-time AI</span>
                </div>
                <p style={{
                    color: 'var(--color-text-tertiary)',
                    fontSize: '0.75rem'
                }}>
                    Protecting farms with intelligent detection
                </p>
            </div>
        </div>
    );
}
