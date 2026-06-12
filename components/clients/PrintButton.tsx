'use client'
import { Printer } from 'lucide-react'

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="px-3 py-2 rounded-lg bg-purple-600 hover:bg-purple-500 text-white text-sm font-medium flex items-center gap-1.5 transition-colors"
    >
      <Printer className="w-4 h-4" />
      Imprimer / PDF
    </button>
  )
}
