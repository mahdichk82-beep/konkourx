export type BrandAsset = string | null

export type BrandConfig = {
  name: 'konkourX'
  assets: {
    mark: string
    fullLogoLight: BrandAsset
    fullLogoDark: BrandAsset
  }
}

export const brand: BrandConfig = {
  name: 'konkourX',
  assets: {
    mark: new URL('../assets/mark.svg', import.meta.url).href,
    fullLogoLight: null,
    fullLogoDark: null,
  },
}
