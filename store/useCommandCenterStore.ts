'use client'
import { create } from 'zustand'
import { Mode, AIProvider, AIStatus } from '@/types'

interface CommandCenterState {
  activeMode: Mode
  selectedAI: AIProvider | null
  aiStatuses: Record<AIProvider, AIStatus>
  setMode: (mode: Mode) => void
  setSelectedAI: (ai: AIProvider | null) => void
  setAIStatus: (ai: AIProvider, status: AIStatus) => void
  simulateTimeout: (ai: AIProvider) => void
  resetStatus: (ai: AIProvider) => void
}

export const useCommandCenterStore = create<CommandCenterState>((set) => ({
  activeMode: 'HYBRID',
  selectedAI: null,
  aiStatuses: {
    claude: 'active',
    chatgpt: 'active',
    ollama: 'active',
    future: 'inactive',
  },
  setMode: (mode) => set({ activeMode: mode }),
  setSelectedAI: (ai) => set({ selectedAI: ai }),
  setAIStatus: (ai, status) =>
    set((state) => ({
      aiStatuses: { ...state.aiStatuses, [ai]: status },
    })),
  simulateTimeout: (ai) =>
    set((state) => ({
      aiStatuses: { ...state.aiStatuses, [ai]: 'timeout' },
    })),
  resetStatus: (ai) =>
    set((state) => ({
      aiStatuses: {
        ...state.aiStatuses,
        [ai]: ai === 'future' ? 'inactive' : 'active',
      },
    })),
}))
