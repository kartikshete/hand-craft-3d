import React from 'react';
import { useStore } from '../stores/useStore';
import { motion, AnimatePresence } from 'framer-motion';

const GestureIcon = ({ gesture }) => {
    const icons = {
        PINCH: '🤏',
        POINT: '👆',
        FIST: '✊',
        OPEN_PALM: '🖐️',
        PEACE: '✌️',
        GRAVITY: '🤘',
        THUMBS_UP: '👍',
        SHAKA: '🤙',
        THREE: '3️⃣',
        IDLE: '⏳',
        NONE: '❌'
    };
    return <span>{icons[gesture] || '❓'}</span>;
};

const HandPanel = ({ hand, side }) => {
    if (!hand) {
        return (
            <div style={{
                padding: '12px 16px',
                background: 'rgba(0,0,0,0.4)',
                borderRadius: '12px',
                border: '1px solid rgba(255,255,255,0.1)',
                minWidth: '140px'
            }}>
                <div style={{
                    fontSize: '10px',
                    color: '#666',
                    fontFamily: 'monospace',
                    textTransform: 'uppercase',
                    letterSpacing: '2px'
                }}>
                    {side} Hand
                </div>
                <div style={{
                    fontSize: '12px',
                    color: '#F43F5E',
                    marginTop: '4px',
                    fontWeight: 'bold'
                }}>
                    ⚫ OFFLINE
                </div>
            </div>
        );
    }

    return (
        <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            style={{
                padding: '12px 16px',
                background: 'rgba(0,245,255,0.1)',
                borderRadius: '12px',
                border: '1px solid rgba(0,245,255,0.3)',
                minWidth: '140px'
            }}
        >
            <div style={{
                fontSize: '10px',
                color: '#00F5FF',
                fontFamily: 'monospace',
                textTransform: 'uppercase',
                letterSpacing: '2px'
            }}>
                {side} Hand
            </div>
            <div style={{
                fontSize: '20px',
                marginTop: '4px',
                display: 'flex',
                alignItems: 'center',
                gap: '8px'
            }}>
                <GestureIcon gesture={hand.gesture} />
                <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#fff' }}>
                    {hand.gesture}
                </span>
            </div>
        </motion.div>
    );
};

const ColorPicker = () => {
    const colors = useStore(state => state.colors);
    const activeColorIndex = useStore(state => state.activeColorIndex);

    return (
        <div style={{
            display: 'flex',
            gap: '6px',
            padding: '8px 12px',
            background: 'rgba(0,0,0,0.4)',
            borderRadius: '20px',
            border: '1px solid rgba(255,255,255,0.1)'
        }}>
            {colors.map((color, i) => (
                <motion.div
                    key={i}
                    animate={{
                        scale: i === activeColorIndex ? 1.3 : 1,
                        boxShadow: i === activeColorIndex ? `0 0 15px ${color}` : 'none'
                    }}
                    style={{
                        width: '16px',
                        height: '16px',
                        borderRadius: '50%',
                        background: color,
                        border: i === activeColorIndex ? '2px solid white' : '1px solid rgba(255,255,255,0.2)',
                        cursor: 'pointer'
                    }}
                />
            ))}
        </div>
    );
};

const ModeIndicator = () => {
    const mode = useStore(state => state.mode);
    const gravity = useStore(state => state.gravity);
    const disco = useStore(state => state.disco);

    const getModeStyle = () => {
        switch (mode) {
            case 'CREATE': return { color: '#00F5FF', glow: '#00F5FF' };
            case 'ERASE': return { color: '#F43F5E', glow: '#F43F5E' };
            case 'ROTATE': return { color: '#FBBF24', glow: '#FBBF24' };
            default: return { color: 'rgba(255,255,255,0.3)', glow: 'transparent' };
        }
    };

    const style = getModeStyle();

    return (
        <div style={{ textAlign: 'center' }}>
            <motion.div
                animate={{
                    scale: mode !== 'IDLE' ? [1, 1.05, 1] : 1,
                    textShadow: `0 0 40px ${style.glow}`
                }}
                transition={{ repeat: Infinity, duration: 1 }}
                style={{
                    fontSize: '48px',
                    fontWeight: 900,
                    fontStyle: 'italic',
                    letterSpacing: '-2px',
                    color: style.color
                }}
            >
                {mode}
            </motion.div>

            <AnimatePresence>
                {gravity && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        style={{
                            marginTop: '10px',
                            padding: '8px 16px',
                            background: 'rgba(244,63,94,0.2)',
                            border: '1px solid #F43F5E',
                            borderRadius: '8px',
                            color: '#F43F5E',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}
                    >
                        ⚡ GRAVITY COLLAPSE ⚡
                    </motion.div>
                )}

                {disco && (
                    <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0, rotate: [0, 5, -5, 0] }}
                        transition={{ rotate: { repeat: Infinity, duration: 0.5 } }}
                        exit={{ opacity: 0 }}
                        style={{
                            marginTop: '10px',
                            padding: '8px 16px',
                            background: 'linear-gradient(90deg, #FF00E5, #00F5FF)',
                            borderRadius: '8px',
                            color: 'white',
                            fontWeight: 'bold',
                            fontSize: '14px'
                        }}
                    >
                        🌈 DISCO MODE 🌈
                    </motion.div>
                )}
            </AnimatePresence>
        </div>
    );
};

const Stats = () => {
    const voxels = useStore(state => state.voxels);
    const historyIndex = useStore(state => state.historyIndex);

    return (
        <div style={{
            display: 'flex',
            gap: '16px',
            fontSize: '11px',
            fontFamily: 'monospace',
            color: '#666'
        }}>
            <div>
                <span style={{ color: '#00F5FF', fontWeight: 'bold' }}>{voxels.length}</span> VOXELS
            </div>
            <div>
                <span style={{ color: '#FF00E5', fontWeight: 'bold' }}>{historyIndex + 1}</span> ACTIONS
            </div>
        </div>
    );
};

const GestureGuide = () => {
    const gestures = [
        { icon: '👆', label: 'Point', action: 'Draw' },
        { icon: '🤏', label: 'Pinch', action: '3D Draw' },
        { icon: '✊', label: 'Fist', action: 'Erase' },
        { icon: '🖐️🖐️', label: '2 Palms', action: 'Rotate' },
        { icon: '👍', label: 'Thumb Up', action: 'Color' },
        { icon: '🤘', label: 'Horns', action: 'Gravity' },
        { icon: '✌️', label: 'Peace', action: 'Disco' },
        { icon: '🤙', label: 'Shaka', action: 'Undo' },
    ];

    return (
        <div style={{
            display: 'flex',
            flexWrap: 'wrap',
            gap: '8px',
            justifyContent: 'center',
            maxWidth: '500px'
        }}>
            {gestures.map((g, i) => (
                <div
                    key={i}
                    style={{
                        padding: '4px 10px',
                        background: 'rgba(0,0,0,0.4)',
                        borderRadius: '6px',
                        fontSize: '10px',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '4px',
                        border: '1px solid rgba(255,255,255,0.1)'
                    }}
                >
                    <span style={{ fontSize: '14px' }}>{g.icon}</span>
                    <span style={{ color: '#888' }}>{g.action}</span>
                </div>
            ))}
        </div>
    );
};

const HUD = () => {
    const leftHand = useStore(state => state.leftHand);
    const rightHand = useStore(state => state.rightHand);

    return (
        <div style={{
            position: 'absolute',
            inset: 0,
            pointerEvents: 'none',
            padding: '20px',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between',
            zIndex: 50
        }}>
            {/* Top Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-start'
            }}>
                <div>
                    <h1 style={{
                        fontSize: '24px',
                        fontWeight: 900,
                        fontStyle: 'italic',
                        margin: 0,
                        letterSpacing: '-1px'
                    }}>
                        HAND<span style={{ color: '#00F5FF' }}>CRAFT</span>
                        <span style={{ color: '#FF00E5' }}>.3D</span>
                    </h1>
                    <div style={{
                        fontSize: '10px',
                        fontFamily: 'monospace',
                        color: '#666',
                        marginTop: '4px'
                    }}>
                        NEURAL INTERFACE v2.0 | GESTURE CONTROLLED
                    </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '8px' }}>
                    <Stats />
                    <ColorPicker />
                </div>
            </div>

            {/* Center */}
            <div style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)'
            }}>
                <ModeIndicator />
            </div>

            {/* Bottom Bar */}
            <div style={{
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'flex-end',
                borderTop: '1px solid rgba(255,255,255,0.1)',
                paddingTop: '16px'
            }}>
                <HandPanel hand={leftHand} side="Left" />

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '12px' }}>
                    <GestureGuide />
                </div>

                <HandPanel hand={rightHand} side="Right" />
            </div>
        </div>
    );
};

export default HUD;
