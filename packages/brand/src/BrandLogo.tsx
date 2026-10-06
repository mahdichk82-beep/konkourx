import { BrandMark, type BrandMarkSize } from './BrandMark.tsx'
import { brand } from './brand-config.ts'

export type BrandContext = 'light' | 'dark' | 'auto'

export type BrandLogoProps = {
  className?: string
  context?: BrandContext
  descriptor?: string
  size?: BrandMarkSize
}

function assetFor(context: BrandContext): string | null {
  if (context === 'dark') return brand.assets.fullLogoDark
  if (context === 'light') return brand.assets.fullLogoLight
  return brand.assets.fullLogoLight ?? brand.assets.fullLogoDark
}

function TemporaryWordmark() {
  const accent = brand.name.slice(-1)
  const word = brand.name.slice(0, -1)
  return <strong className="brand-wordmark"><span lang="en" dir="ltr">{word}<span>{accent}</span></span></strong>
}

export function BrandLogo({ className, context = 'auto', descriptor, size = descriptor ? 'sm' : 'lg' }: BrandLogoProps) {
  const fullLogo = assetFor(context)
  const rootClassName = [descriptor ? 'brand-lockup' : 'auth-brand', className].filter(Boolean).join(' ')

  if (fullLogo) {
    return <div className={rootClassName} data-brand-context={context}><img alt={brand.name} className="brand-logo__asset" src={fullLogo} />{descriptor && <small>{descriptor}</small>}</div>
  }

  if (!descriptor) {
    return <div className={rootClassName} data-brand-context={context}><BrandMark size={size} /><TemporaryWordmark /></div>
  }

  return (
    <div className={rootClassName} data-brand-context={context}>
      <BrandMark size={size} />
      <div>
        <TemporaryWordmark />
        <small><span className="brand-lockup__persian">کنکوریکس</span><span aria-hidden="true"> · </span>{descriptor}</small>
      </div>
    </div>
  )
}
