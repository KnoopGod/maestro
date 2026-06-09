import type React from 'react'

interface WipTagProps {
  label?: string
  className?: string
}

export function WipTag({ label = 'À VENIR', className = '' }: WipTagProps) {
  return (
    <span
      aria-hidden="true"
      className={`inline-flex items-center gap-1 text-[7px] font-mono tracking-[0.2em] uppercase px-1.5 py-0.5 border text-amber-400 border-amber-700/50 bg-amber-950/30 ${className}`}
    >
      <span className="opacity-60">{'//'}</span> {label}
    </span>
  )
}

export function WipOverlay({ children, label = 'À VENIR' }: { children: React.ReactNode; label?: string }) {
  return (
    <div className="relative group/wip cursor-not-allowed" aria-disabled="true">
      <div className="pointer-events-none select-none opacity-45 saturate-50">
        {children}
      </div>
      <div className="absolute top-1.5 right-1.5 z-10">
        <WipTag label={label} />
      </div>
      {/* Diagonal stripe overlay */}
      <div
        className="absolute inset-0 pointer-events-none rounded-[inherit]"
        style={{
          backgroundImage: 'repeating-linear-gradient(135deg, transparent, transparent 8px, rgba(245,158,11,0.035) 8px, rgba(245,158,11,0.035) 9px)',
        }}
      />
    </div>
  )
}
