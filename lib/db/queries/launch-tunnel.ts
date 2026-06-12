import { db, queryOne } from '../index'
import type { LaunchAdvice } from '@/lib/agents/launch-advisor'

interface LaunchTunnelRow {
  client_id: string
  tasks_done: string
  advice: string | null
  advice_cost: number
  advice_generated_at: number | null
  created_at: number
  updated_at: number
}

export interface LaunchTunnelState {
  clientId: string
  tasksDone: string[]
  advice: LaunchAdvice | null
  adviceCost: number
  adviceGeneratedAt: number | null
}

function mapRow(row: LaunchTunnelRow): LaunchTunnelState {
  return {
    clientId: row.client_id,
    tasksDone: (() => { try { return JSON.parse(row.tasks_done || '[]') } catch { return [] } })(),
    advice: (() => { try { return row.advice ? JSON.parse(row.advice) as LaunchAdvice : null } catch { return null } })(),
    adviceCost: row.advice_cost,
    adviceGeneratedAt: row.advice_generated_at,
  }
}

export async function getLaunchTunnel(clientId: string): Promise<LaunchTunnelState> {
  const row = await queryOne<LaunchTunnelRow>(
    `SELECT * FROM client_launch_tunnel WHERE client_id = ?`, [clientId]
  )
  if (row) return mapRow(row)
  return { clientId, tasksDone: [], advice: null, adviceCost: 0, adviceGeneratedAt: null }
}

async function ensureRow(clientId: string) {
  const now = Date.now()
  await db.execute({
    sql: `INSERT INTO client_launch_tunnel (client_id, tasks_done, created_at, updated_at)
          VALUES (?, '[]', ?, ?)
          ON CONFLICT(client_id) DO NOTHING`,
    args: [clientId, now, now],
  })
}

export async function toggleLaunchTask(clientId: string, taskKey: string): Promise<string[]> {
  await ensureRow(clientId)
  const state = await getLaunchTunnel(clientId)
  const tasksDone = state.tasksDone.includes(taskKey)
    ? state.tasksDone.filter(k => k !== taskKey)
    : [...state.tasksDone, taskKey]

  await db.execute({
    sql: `UPDATE client_launch_tunnel SET tasks_done = ?, updated_at = ? WHERE client_id = ?`,
    args: [JSON.stringify(tasksDone), Date.now(), clientId],
  })
  return tasksDone
}

export async function saveLaunchAdvice(
  clientId: string,
  advice: LaunchAdvice,
  cost: number
): Promise<void> {
  await ensureRow(clientId)
  await db.execute({
    sql: `UPDATE client_launch_tunnel
          SET advice = ?, advice_cost = ?, advice_generated_at = ?, updated_at = ?
          WHERE client_id = ?`,
    args: [JSON.stringify(advice), cost, Date.now(), Date.now(), clientId],
  })
}
