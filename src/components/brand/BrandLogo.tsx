import logoExtremeGym from '../../assets/images/logo-extreme-gym.png'

type BrandLogoProps = {
  compact?: boolean
  className?: string
}

export function BrandLogo({ compact = false, className = '' }: BrandLogoProps) {
  return (
    <span className={`brand-logo ${compact ? 'is-compact' : ''} ${className}`.trim()}>
      <img src={logoExtremeGym} alt="Academia Extreme" />
    </span>
  )
}
