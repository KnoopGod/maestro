'use client'
import { Download } from 'lucide-react'

export function PortalPrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="print:hidden inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-medium transition-colors border border-gray-200"
    >
      <Download className="w-3.5 h-3.5" />
      Télécharger PDF
    </button>
  )
}
