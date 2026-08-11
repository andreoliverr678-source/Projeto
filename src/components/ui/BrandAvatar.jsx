import { getBrandInfo } from '../../utils/brandLogos'

export function BrandAvatar({ creditor = '', debtType = '', size = 40, className = '' }) {
  const brand = getBrandInfo(creditor, debtType)

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        background: 'transparent',
      }}
      title={brand.name || creditor}
    >
      <span style={{ fontSize: size * 0.7, lineHeight: 1 }}>
        {brand.icon || '📋'}
      </span>
    </div>
  )
}
