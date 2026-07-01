import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { useSearchParams } from 'react-router-dom'
import { Package, Loader2, RefreshCw } from 'lucide-react'
import { useProductStore } from '../lib/store.js'
import ProductCard from '../components/ecommerce/ProductCard.jsx'
import Input from '../components/ui/Input.jsx'
import { Search } from 'lucide-react'

const categoryOptions = [
  'All', 'Computers & Workstations', 'Servers & Storage', 'Networking',
  'Cybersecurity', 'Cloud Solutions', 'Software & Licensing',
  'Office Equipment', 'Telecommunications',
]

export default function CatalogPage() {
  const { products, loading, fetchProducts } = useProductStore()
  const [searchParams, setSearchParams] = useSearchParams()
  const [search, setSearch] = useState(searchParams.get('q') || '')
  const [category, setCategory] = useState(searchParams.get('category') || 'All')

  useEffect(() => {
    fetchProducts()
  }, [])

  useEffect(() => {
    const params = {}
    if (search) params.q = search
    if (category !== 'All') params.category = category
    setSearchParams(params, { replace: true })
  }, [search, category])

  const filtered = useMemo(() => {
    const source = products
    return source.filter((p) => {
      const catMatch = category === 'All' || (p.category || '') === category
      const searchMatch = !search ||
        [p.name, p.description, p.category].filter(Boolean).join(' ').toLowerCase().includes(search.toLowerCase())
      return catMatch && searchMatch
    })
  }, [products, category, search])

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      className="pt-24 pb-16"
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <div className="text-xs font-semibold text-secondary uppercase tracking-widest mb-2">Catalog</div>
          <h1 className="font-display text-3xl sm:text-4xl font-bold text-primary">
            Enterprise products
          </h1>
        </div>

        <div className="flex flex-col sm:flex-row gap-4 mb-8">
          <div className="flex-1">
            <Input
              icon={<Search size={16} />}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search products, categories..."
            />
          </div>
          <button
            onClick={fetchProducts}
            className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-gray-600 bg-white border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
          >
            <RefreshCw size={14} className={loading ? 'animate-spin' : ''} />
            Refresh
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mb-8">
          {categoryOptions.map((c) => (
            <button
              key={c}
              onClick={() => setCategory(c)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all duration-200 ${
                category === c
                  ? 'bg-secondary text-white shadow-soft'
                  : 'bg-gray-50 text-gray-600 hover:bg-gray-100'
              }`}
            >
              {c}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 size={24} className="animate-spin text-gray-400" />
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-50 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Package size={28} className="text-gray-300" />
            </div>
            <h3 className="text-sm font-semibold text-gray-900 mb-1">No products found</h3>
            <p className="text-sm text-gray-500">Try adjusting your search or filter criteria.</p>
          </div>
        ) : (
          <>
            <div className="text-sm text-gray-500 mb-4">{filtered.length} products available</div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-5">
              {filtered.map((product, i) => (
                <ProductCard key={product.id} product={product} index={i} />
              ))}
            </div>
          </>
        )}
      </div>
    </motion.div>
  )
}
