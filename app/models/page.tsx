import { AI_MODELS } from '@/lib/mock-data/models'
import { ModelCard } from '@/components/models/ModelCard'

export default function ModelsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">Models</h1>
        <p className="text-sm text-gray-500 mt-0.5">Sélectionne, compare et pilote chaque IA</p>
      </div>

      <div className="grid grid-cols-2 xl:grid-cols-4 gap-5">
        {AI_MODELS.map((model, i) => (
          <ModelCard key={model.id} model={model} index={i} />
        ))}
      </div>
    </div>
  )
}
