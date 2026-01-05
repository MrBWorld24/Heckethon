import { useState, useEffect, useRef } from 'react';
import { Terminal, X, ChevronDown, ChevronUp } from 'lucide-react';

export default function DebugConsole({ logs = [] }) {
    const [isOpen, setIsOpen] = useState(false);
    const endRef = useRef(null);

    // Auto-scroll to bottom
    useEffect(() => {
        if (isOpen && endRef.current) {
            endRef.current.scrollIntoView({ behavior: 'smooth' });
        }
    }, [logs, isOpen]);

    if (!isOpen) {
        return (
            <button
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'absolute', top: '60px', right: '10px', zIndex: 9999,
                    background: 'rgba(0,0,0,0.7)', color: 'lime', border: '1px solid lime',
                    padding: '5px 10px', borderRadius: '5px', fontSize: '10px',
                    display: 'flex', alignItems: 'center', gap: '5px'
                }}
            >
                <Terminal size={12} /> Debug
            </button>
        );
    }

    return (
        <div style={{
            position: 'absolute', top: '60px', right: '10px', width: '300px', maxHeight: '300px',
            zIndex: 9999, background: 'rgba(0,0,0,0.9)', color: '#0f0',
            fontFamily: 'monospace', fontSize: '10px', border: '1px solid #0f0',
            display: 'flex', flexDirection: 'column', borderRadius: '5px'
        }}>
            {/* Header */}
            <div style={{
                padding: '5px', borderBottom: '1px solid #0f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                background: '#002200'
            }}>
                <span style={{ fontWeight: 'bold' }}>SYSTEM DIAGNOSTICS</span>
                <div style={{ display: 'flex', gap: '10px' }}>
                    <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: '#0f0', cursor: 'pointer' }}>
                        <X size={14} />
                    </button>
                </div>
            </div>

            {/* Logs Body */}
            <div style={{ flex: 1, overflowY: 'auto', padding: '5px', wordBreak: 'break-all' }}>
                {logs.length === 0 ? <div style={{ color: '#666' }}>No logs yet...</div> :
                    logs.map((log, i) => (
                        <div key={i} style={{ marginBottom: '2px', color: log.type === 'error' ? 'red' : log.type === 'warn' ? 'orange' : '#0f0' }}>
                            <span style={{ opacity: 0.5 }}>[{log.time}]</span> {log.message}
                        </div>
                    ))
                }
                <div ref={endRef} />
            </div>
        </div>
    );
}
