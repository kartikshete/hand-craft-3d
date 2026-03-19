import { create } from 'zustand';
import { persist } from 'zustand/middleware';

const COLORS = [
    '#00F5FF', // Cyan
    '#FF00E5', // Magenta
    '#10B981', // Emerald
    '#F59E0B', // Amber
    '#F43F5E', // Rose
    '#8B5CF6', // Purple
    '#FFFFFF', // White
];

export const useStore = create(
    persist(
        (set, get) => ({
            // Voxels
            voxels: [],
            history: [],
            historyIndex: -1,

            // Mode & Settings
            mode: 'IDLE',
            activeColorIndex: 0,
            gravity: false,
            disco: false,
            showSkeleton: true,
            soundEnabled: true,
            brushSize: 1,

            // Hand Data
            rightHand: null,
            leftHand: null,

            // Getters
            get activeColor() {
                return COLORS[get().activeColorIndex];
            },

            colors: COLORS,

            // Actions
            setHandData: (handedness, data) => set((state) => ({
                [handedness === 'Left' ? 'leftHand' : 'rightHand']: data
            })),

            setMode: (mode) => set({ mode }),

            // Voxel Operations with History
            addVoxel: (position) => set((state) => {
                // Prevent duplicates
                const exists = state.voxels.some(v =>
                    Math.abs(v.position[0] - position[0]) < 0.1 &&
                    Math.abs(v.position[1] - position[1]) < 0.1 &&
                    Math.abs(v.position[2] - position[2]) < 0.1
                );
                if (exists) return {};

                const color = state.disco
                    ? `hsl(${Math.random() * 360}, 100%, 50%)`
                    : COLORS[state.activeColorIndex];

                const newVoxel = {
                    position,
                    id: Date.now() + Math.random(),
                    color,
                    scale: state.brushSize
                };

                const newVoxels = [...state.voxels, newVoxel];

                // Add to history
                const newHistory = state.history.slice(0, state.historyIndex + 1);
                newHistory.push({ action: 'add', voxel: newVoxel });

                return {
                    voxels: newVoxels,
                    history: newHistory,
                    historyIndex: newHistory.length - 1
                };
            }),

            removeVoxel: (position, radius = 1.5) => set((state) => {
                const removed = [];
                const remaining = state.voxels.filter(v => {
                    const dx = v.position[0] - position[0];
                    const dy = v.position[1] - position[1];
                    const dz = v.position[2] - position[2];
                    const dist = Math.sqrt(dx * dx + dy * dy + dz * dz);
                    if (dist <= radius) {
                        removed.push(v);
                        return false;
                    }
                    return true;
                });

                if (removed.length === 0) return {};

                const newHistory = state.history.slice(0, state.historyIndex + 1);
                newHistory.push({ action: 'remove', voxels: removed });

                return {
                    voxels: remaining,
                    history: newHistory,
                    historyIndex: newHistory.length - 1
                };
            }),

            // Undo/Redo
            undo: () => set((state) => {
                if (state.historyIndex < 0) return {};

                const action = state.history[state.historyIndex];
                let newVoxels = [...state.voxels];

                if (action.action === 'add') {
                    newVoxels = newVoxels.filter(v => v.id !== action.voxel.id);
                } else if (action.action === 'remove') {
                    newVoxels = [...newVoxels, ...action.voxels];
                }

                return {
                    voxels: newVoxels,
                    historyIndex: state.historyIndex - 1
                };
            }),

            redo: () => set((state) => {
                if (state.historyIndex >= state.history.length - 1) return {};

                const action = state.history[state.historyIndex + 1];
                let newVoxels = [...state.voxels];

                if (action.action === 'add') {
                    newVoxels = [...newVoxels, action.voxel];
                } else if (action.action === 'remove') {
                    const idsToRemove = new Set(action.voxels.map(v => v.id));
                    newVoxels = newVoxels.filter(v => !idsToRemove.has(v.id));
                }

                return {
                    voxels: newVoxels,
                    historyIndex: state.historyIndex + 1
                };
            }),

            // Color Cycling
            nextColor: () => set((state) => ({
                activeColorIndex: (state.activeColorIndex + 1) % COLORS.length
            })),

            prevColor: () => set((state) => ({
                activeColorIndex: (state.activeColorIndex - 1 + COLORS.length) % COLORS.length
            })),

            setColorIndex: (index) => set({ activeColorIndex: index }),

            // Brush Size
            increaseBrush: () => set((state) => ({
                brushSize: Math.min(state.brushSize + 0.5, 3)
            })),

            decreaseBrush: () => set((state) => ({
                brushSize: Math.max(state.brushSize - 0.5, 0.5)
            })),

            // Toggles
            toggleGravity: () => set((state) => ({ gravity: !state.gravity })),
            toggleDisco: () => set((state) => ({ disco: !state.disco })),
            toggleSkeleton: () => set((state) => ({ showSkeleton: !state.showSkeleton })),
            toggleSound: () => set((state) => ({ soundEnabled: !state.soundEnabled })),

            // Reset
            resetWorld: () => set({
                voxels: [],
                gravity: false,
                disco: false,
                history: [],
                historyIndex: -1
            }),

            clearVoxels: () => set((state) => {
                if (state.voxels.length === 0) return {};

                const newHistory = state.history.slice(0, state.historyIndex + 1);
                newHistory.push({ action: 'remove', voxels: [...state.voxels] });

                return {
                    voxels: [],
                    history: newHistory,
                    historyIndex: newHistory.length - 1
                };
            }),

            // Save/Load
            saveCreation: (name) => {
                const state = get();
                const creation = {
                    name,
                    voxels: state.voxels,
                    timestamp: Date.now()
                };
                const saved = JSON.parse(localStorage.getItem('handcraft_saves') || '[]');
                saved.push(creation);
                localStorage.setItem('handcraft_saves', JSON.stringify(saved));
                return creation;
            },

            loadCreation: (index) => {
                const saved = JSON.parse(localStorage.getItem('handcraft_saves') || '[]');
                if (saved[index]) {
                    set({ voxels: saved[index].voxels });
                }
            },

            getSavedCreations: () => {
                return JSON.parse(localStorage.getItem('handcraft_saves') || '[]');
            }
        }),
        {
            name: 'handcraft-storage',
            partialize: (state) => ({
                voxels: state.voxels,
                activeColorIndex: state.activeColorIndex
            })
        }
    )
);
