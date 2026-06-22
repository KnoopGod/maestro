export function GuidedBriefField({
  label,
  value,
  onChange,
  placeholder,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  placeholder: string
}) {
  return (
    <label className="block group">
      <span className="mb-1.5 block text-xs font-medium uppercase tracking-wider text-gray-500 group-focus-within:text-indigo-400 transition-colors duration-150">
        {label}
      </span>
      <textarea
        value={value}
        onChange={event => onChange(event.target.value)}
        rows={2}
        placeholder={placeholder}
        title={`Champ guidé du brief : ${label}`}
        className="w-full resize-y rounded-lg border border-gray-800 bg-gray-950/60 px-3 py-2.5 text-sm text-gray-200 placeholder:text-gray-600 focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 transition-all duration-150"
      />
    </label>
  )
}
