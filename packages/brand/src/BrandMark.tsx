import { brand } from './brand-config.ts'

export type BrandMarkSize = 'sm' | 'md' | 'lg'

const sizeClass: Record<BrandMarkSize, string> = {
  sm: 'small',
  md: 'medium',
  lg: 'large',
}

export type BrandMarkProps = {
  label?: string
  size?: BrandMarkSize
}

export function BrandMark({ label = brand.name, size = 'md' }: BrandMarkProps) {
  return (
    <span className={`brand-symbol brand-symbol--${sizeClass[size]}`} aria-label={label} role="img">
      <img alt="" aria-hidden="true" src={brand.assets.mark} />
    </span>
  )
}
