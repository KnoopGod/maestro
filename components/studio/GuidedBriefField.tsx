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
    <label className="block">
      <span className="mb-1 block text-[10px] font-mono uppercase tracking-wider text-gray-500">{label}</span>
      <textarea
        value={value}
        onChange={event => onChange(event.target.value)}
        rows={2}
        placeholder={placeholder}
        title={`Champ guidé du brief : ${label}`}
        className="w-full resize-y rounded-lg border border-gray-800 bg-gray-950/60 p-3 text-sm text-gray-200 placeholder:text-gray-600 focus:border-purple-500 focus:outline-none"
      />
    </label>
  )
}
