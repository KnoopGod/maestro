'use client'

import { useState } from 'react'
import {
  BUSINESS_OBJECTIVES,
  CONVERSION_CHANNELS,
  type BusinessObjective,
  type ConversionChannel,
} from '@/types/client'
import { getPlaybook, VERTICAL_OPTIONS } from '@/lib/playbooks'

const DEFAULT_VERTICAL = 'restaurant'

export function BusinessProfileSelectors() {
  const initialPlaybook = getPlaybook(DEFAULT_VERTICAL)
  const [vertical, setVertical] = useState(DEFAULT_VERTICAL)
  const [objective, setObjective] = useState<BusinessObjective>(
    initialPlaybook.businessObjectives[0] ?? 'attract_new_customers'
  )
  const [channels, setChannels] = useState<ConversionChannel[]>(
    initialPlaybook.priorityChannels
  )

  function selectVertical(nextVertical: string) {
    const playbook = getPlaybook(nextVertical)
    setVertical(nextVertical)
    setObjective(playbook.businessObjectives[0] ?? 'attract_new_customers')
    setChannels(playbook.priorityChannels)
  }

  function toggleChannel(channel: ConversionChannel) {
    setChannels(current =>
      current.includes(channel)
        ? current.filter(item => item !== channel)
        : [...current, channel]
    )
  }

  const playbook = getPlaybook(vertical)

  return (
    <>
      <div>
        <div className="block text-sm font-medium text-gray-300 mb-1.5">
          Type d&apos;activité <span className="text-red-400">*</span>
        </div>
        <div className="grid grid-cols-3 gap-2">
          {VERTICAL_OPTIONS.map(option => (
            <label
              key={option.vertical}
              className="cursor-pointer aspect-square rounded-xl border border-gray-800 hover:border-purple-500 bg-gray-950/60 flex flex-col items-center justify-center gap-1 transition-all has-[:checked]:border-purple-500 has-[:checked]:bg-purple-900/20"
            >
              <input
                type="radio"
                name="businessVertical"
                value={option.vertical}
                checked={vertical === option.vertical}
                onChange={() => selectVertical(option.vertical)}
                required
                className="sr-only peer"
              />
              <span className="text-2xl">{option.emoji}</span>
              <span className="text-[11px] text-gray-400 peer-checked:text-purple-300 text-center px-1">
                {option.label}
              </span>
            </label>
          ))}
        </div>
        <p className="text-[11px] text-gray-500 mt-1.5">
          Ce choix adapte automatiquement les objectifs et canaux recommandés.
        </p>
      </div>

      <div>
        <label htmlFor="priorityObjective" className="block text-xs text-gray-400 mb-1.5">
          Objectif prioritaire
        </label>
        <select
          id="priorityObjective"
          name="priorityObjective"
          value={objective}
          onChange={event => setObjective(event.target.value as BusinessObjective)}
          className="w-full bg-gray-950/60 border border-gray-800 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-purple-500"
        >
          {playbook.businessObjectives.map(item => (
            <option key={item} value={item}>{BUSINESS_OBJECTIVES[item].label}</option>
          ))}
        </select>
      </div>

      <div>
        <div className="block text-xs text-gray-400 mb-2">Canaux de conversion</div>
        <div className="grid gap-2 sm:grid-cols-3">
          {(Object.keys(CONVERSION_CHANNELS) as ConversionChannel[]).map(channel => (
            <label
              key={channel}
              className="flex items-center gap-2 rounded-lg border border-gray-800 bg-gray-950/50 px-3 py-2 text-xs text-gray-300"
            >
              <input
                type="checkbox"
                name="conversionChannels"
                value={channel}
                checked={channels.includes(channel)}
                onChange={() => toggleChannel(channel)}
                className="accent-purple-500"
              />
              {CONVERSION_CHANNELS[channel].label}
            </label>
          ))}
        </div>
      </div>
    </>
  )
}
