import { useNavigate } from 'react-router-dom';
import { ArrowLeft, Calendar, AlertTriangle, Trash2 } from 'lucide-react';
import { getHistory, clearHistory } from '../utils/storage';
import { useState, useEffect } from 'react';

export default function HistoryPage() {
    const navigate = useNavigate();
    const [history, setHistory] = useState([]);

    useEffect(() => {
        setHistory(getHistory());
    }, []);

    const handleClear = () => {
        if (window.confirm('Clear all detection history?')) {
            clearHistory();
            setHistory([]);
        }
    };

    return (
        <div className="fullscreen-container">
            {/* Header */}
            <div className="app-header">
                <button className="icon-btn" onClick={() => navigate('/')}>
                    <ArrowLeft size={20} strokeWidth={2} />
                </button>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 600 }}>
                    Detection History
                </h2>
                <button
                    className="icon-btn"
                    onClick={handleClear}
                    disabled={history.length === 0}
                    style={{ opacity: history.length === 0 ? 0.5 : 1 }}
                >
                    <Trash2 size={20} strokeWidth={2} color={history.length > 0 ? 'var(--color-danger)' : 'currentColor'} />
                </button>
            </div>

            {/* Content */}
            <div style={{
                flex: 1,
                overflow: 'auto',
                padding: 'var(--space-4)'
            }}>
                {history.length === 0 ? (
                    <div className="flex-center" style={{
                        height: '100%',
                        flexDirection: 'column',
                        gap: 'var(--space-4)'
                    }}>
                        <div style={{
                            padding: 'var(--space-6)',
                            backgroundColor: 'var(--color-surface)',
                            borderRadius: 'var(--radius-xl)',
                            border: '1px solid var(--color-border)'
                        }}>
                            <Calendar size={48} color="var(--color-text-tertiary)" strokeWidth={1.5} />
                        </div>
                        <div className="text-center">
                            <h3 style={{
                                fontSize: '1.125rem',
                                fontWeight: 600,
                                marginBottom: 'var(--space-2)',
                                color: 'var(--color-text-primary)'
                            }}>
                                No detections yet
                            </h3>
                            <p style={{
                                fontSize: '0.875rem',
                                color: 'var(--color-text-secondary)'
                            }}>
                                Start monitoring to track wildlife intrusions
                            </p>
                        </div>
                    </div>
                ) : (
                    <div style={{
                        display: 'flex',
                        flexDirection: 'column',
                        gap: 'var(--space-3)',
                        maxWidth: '640px',
                        margin: '0 auto'
                    }}>
                        {history.map((item, index) => (
                            <div
                                key={index}
                                className="card card-interactive fade-in"
                                style={{ animationDelay: `${index * 50}ms` }}
                            >
                                {/* Header */}
                                <div style={{
                                    display: 'flex',
                                    alignItems: 'flex-start',
                                    gap: 'var(--space-3)',
                                    marginBottom: 'var(--space-4)'
                                }}>
                                    <div style={{
                                        padding: 'var(--space-2)',
                                        backgroundColor: 'rgba(218, 54, 51, 0.1)',
                                        borderRadius: 'var(--radius-md)',
                                        flexShrink: 0
                                    }}>
                                        <AlertTriangle size={20} color="var(--color-danger)" strokeWidth={2} />
                                    </div>
                                    <div style={{ flex: 1 }}>
                                        <h3 style={{
                                            fontSize: '1rem',
                                            fontWeight: 600,
                                            marginBottom: 'var(--space-1)'
                                        }}>
                                            {item.label}
                                        </h3>
                                        <div style={{ display: 'flex', gap: 'var(--space-2)' }}>
                                            <span className="badge badge-danger">
                                                {Math.round(item.confidence * 100)}% confidence
                                            </span>
                                            {item.status === 'confirmed' && (
                                                <span className="badge badge-success">Confirmed</span>
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Metadata */}
                                <div style={{
                                    paddingTop: 'var(--space-3)',
                                    borderTop: '1px solid var(--color-border)',
                                    display: 'flex',
                                    alignItems: 'center',
                                    gap: 'var(--space-2)'
                                }}>
                                    <Calendar size={14} color="var(--color-text-tertiary)" strokeWidth={2} />
                                    <span style={{
                                        fontSize: '0.75rem',
                                        color: 'var(--color-text-secondary)'
                                    }}>
                                        {item.dateString}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
