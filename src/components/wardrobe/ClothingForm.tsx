import { useState, useEffect, type FormEvent } from 'react'
import type { Clothing, Category, Style, Thickness, Material } from '@/lib/types'
import { CATEGORIES, CATEGORY_LABELS, STYLES, STYLE_LABELS, MATERIALS, THICKNESS_ORDER } from '@/lib/constants'
import ImageUploader from './ImageUploader'

export interface ClothingFormData {
  name: string
  category: Category
  subcategory: string
  color: string
  color_hex: string
  style: Style
  thickness: Thickness
  waterproof: boolean
  material: Material
  temp_min: number
  temp_max: number
  imageFile?: File
  imagePreviewUrl?: string
}

interface ClothingFormProps {
  item?: Clothing | null
  onSubmit: (data: ClothingFormData) => Promise<void>
  onClose: () => void
}

const THICKNESS_LABELS: Record<Thickness, string> = { thin: '薄款', medium: '适中', thick: '厚款', down: '羽绒' }
const MATERIAL_LABELS: Record<Material, string> = {
  cotton: '棉', denim: '牛仔', leather: '皮革', rubber: '橡胶',
  wool: '羊毛', down: '羽绒', silk: '真丝', polyester: '涤纶', canvas: '帆布',
}

export default function ClothingForm({ item, onSubmit, onClose }: ClothingFormProps) {
  const [name, setName] = useState('')
  const [category, setCategory] = useState<Category>('top')
  const [subcategory, setSubcategory] = useState('')
  const [color, setColor] = useState('')
  const [colorHex, setColorHex] = useState('#333333')
  const [style, setStyle] = useState<Style>('casual')
  const [thickness, setThickness] = useState<Thickness>('medium')
  const [waterproof, setWaterproof] = useState(false)
  const [material, setMaterial] = useState<Material>('cotton')
  const [tempMin, setTempMin] = useState(10)
  const [tempMax, setTempMax] = useState(25)
  const [imageFile, setImageFile] = useState<File | undefined>()
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | undefined>()
  const [submitting, setSubmitting] = useState(false)
  const [tempError, setTempError] = useState('')

  useEffect(() => {
    if (item) {
      setName(item.name)
      setCategory(item.category)
      setSubcategory(item.subcategory)
      setColor(item.color)
      setColorHex(item.color_hex)
      setStyle(item.style)
      setThickness(item.thickness)
      setWaterproof(item.waterproof)
      setMaterial(item.material)
      setTempMin(item.temp_min)
      setTempMax(item.temp_max)
    }
  }, [item])

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return
    if (tempMin > tempMax) {
      setTempError('最低温度不能高于最高温度')
      return
    }
    setTempError('')
    setSubmitting(true)
    try {
      await onSubmit({
        name: name.trim(),
        category,
        subcategory: subcategory.trim(),
        color: color.trim(),
        color_hex: colorHex,
        style,
        thickness,
        waterproof,
        material,
        temp_min: tempMin,
        temp_max: tempMax,
        imageFile,
        imagePreviewUrl,
      })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center sm:items-center">
      <div className="fixed inset-0 bg-black/40" onClick={onClose} />
      <form
        onSubmit={handleSubmit}
        className="relative max-h-[85dvh] w-full max-w-lg overflow-y-auto rounded-t-2xl bg-[var(--color-surface)] p-6 sm:rounded-2xl"
      >
        <h2 className="text-lg font-semibold">
          {item ? '编辑衣物' : '添加衣物'}
        </h2>

        <ImageUploader
          onCompressed={(file, url) => {
            setImageFile(file)
            setImagePreviewUrl(url)
          }}
          className="mt-4"
        />

        <div className="mt-4 space-y-4">
          <label className="block">
            <span className="text-sm font-medium">名称 *</span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="eg. 白色T恤"
              required
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">分类</span>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm outline-none"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{CATEGORY_LABELS[c]}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">风格</span>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value as Style)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm outline-none"
              >
                {STYLES.map((s) => (
                  <option key={s} value={s}>{STYLE_LABELS[s]}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">颜色</span>
              <input
                type="text"
                value={color}
                onChange={(e) => setColor(e.target.value)}
                placeholder="eg. 白色"
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">色值</span>
              <div className="mt-1 flex gap-2">
                <input
                  type="color"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="h-9 w-9 cursor-pointer rounded border border-[var(--color-border)]"
                />
                <input
                  type="text"
                  value={colorHex}
                  onChange={(e) => setColorHex(e.target.value)}
                  className="flex-1 rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
                />
              </div>
            </label>
          </div>

          <label className="block">
            <span className="text-sm font-medium">子分类</span>
            <input
              type="text"
              value={subcategory}
              onChange={(e) => setSubcategory(e.target.value)}
              placeholder="eg. T恤、衬衫、卫衣"
              className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
            />
          </label>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">厚度</span>
              <select
                value={thickness}
                onChange={(e) => setThickness(e.target.value as Thickness)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm outline-none"
              >
                {(Object.keys(THICKNESS_ORDER) as Thickness[]).map((t) => (
                  <option key={t} value={t}>{THICKNESS_LABELS[t]}</option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium">材质</span>
              <select
                value={material}
                onChange={(e) => setMaterial(e.target.value as Material)}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm outline-none"
              >
                {MATERIALS.map((m) => (
                  <option key={m} value={m}>{MATERIAL_LABELS[m]}</option>
                ))}
              </select>
            </label>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <label className="block">
              <span className="text-sm font-medium">最低温度 °C</span>
              <input
                type="number"
                value={tempMin}
                onChange={(e) => setTempMin(Number(e.target.value))}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium">最高温度 °C</span>
              <input
                type="number"
                value={tempMax}
                onChange={(e) => setTempMax(Number(e.target.value))}
                className="mt-1 w-full rounded-[var(--radius-sm)] border border-[var(--color-border)] bg-[var(--color-surface-alt)] px-3 py-2 text-sm outline-none focus:border-[var(--color-accent)]"
              />
            </label>
          </div>

          {tempError && (
            <p className="text-xs text-red-500">{tempError}</p>
          )}

          <label className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={waterproof}
              onChange={(e) => setWaterproof(e.target.checked)}
              className="h-4 w-4 rounded accent-[var(--color-accent)]"
            />
            <span className="text-sm font-medium">防水</span>
          </label>
        </div>

        <div className="mt-6 flex gap-3">
          <button
            type="button"
            onClick={onClose}
            className="flex-1 rounded-[var(--radius-md)] border border-[var(--color-border)] py-2.5 text-sm font-medium transition-colors hover:bg-[var(--color-surface-alt)]"
          >
            取消
          </button>
          <button
            type="submit"
            disabled={submitting || !name.trim()}
            className="flex-1 rounded-[var(--radius-md)] bg-[var(--color-accent)] py-2.5 text-sm font-medium text-white transition-opacity disabled:opacity-50"
          >
            {submitting ? '保存中...' : '保存'}
          </button>
        </div>
      </form>
    </div>
  )
}
