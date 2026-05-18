export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon = null,
  className = '',
  ...props
}) {
  const base = [
    'inline-flex items-center justify-center gap-2 font-semibold rounded-xl',
    'transition-all duration-200 select-none',
    'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2',
    'disabled:opacity-50 disabled:cursor-not-allowed disabled:pointer-events-none',
  ].join(' ');

  const variants = {
    // Emerald — main CTA
    primary: [
      'bg-brand-primary text-white',
      'hover:bg-brand-primaryDark hover:shadow-emerald',
      'active:scale-[0.97] shadow-sm',
      'focus-visible:ring-brand-primary',
    ].join(' '),

    // Gold — premium / accent CTA
    gold: [
      'text-white shadow-sm',
      'hover:shadow-gold active:scale-[0.97]',
      'focus-visible:ring-brand-accent',
    ].join(' '),

    // Outlined emerald
    outline: [
      'border-2 border-brand-primary text-brand-primary bg-transparent',
      'hover:bg-brand-primary hover:text-white',
      'active:scale-[0.97]',
      'focus-visible:ring-brand-primary',
    ].join(' '),

    // Subtle teal-tinted secondary
    secondary: [
      'border border-ink-300/60 text-ink-700 bg-white',
      'hover:bg-surface-100 hover:border-ink-300',
      'active:scale-[0.97] shadow-sm',
      'focus-visible:ring-ink-300',
    ].join(' '),

    // Danger
    danger: [
      'bg-brand-danger text-white shadow-sm',
      'hover:bg-red-700 hover:shadow-md',
      'active:scale-[0.97]',
      'focus-visible:ring-brand-danger',
    ].join(' '),

    // Ghost
    ghost: [
      'text-brand-primary bg-transparent',
      'hover:bg-brand-primary/10 rounded-xl',
      'focus-visible:ring-brand-primary',
    ].join(' '),
  };

  const sizes = {
    sm: 'px-3.5 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  // Gold gets inline style for gradient
  const goldStyle = variant === 'gold'
    ? { background: 'linear-gradient(135deg, #C9962A, #E8B84B, #C9962A)', backgroundSize: '200% auto' }
    : {};

  return (
    <button
      className={`${base} ${variants[variant] ?? variants.primary} ${sizes[size]} ${variant === 'gold' ? 'btn-shimmer' : ''} ${className}`}
      style={goldStyle}
      disabled={loading || props.disabled}
      {...props}
    >
      {loading ? (
        <>
          <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin flex-shrink-0" />
          {children}
        </>
      ) : (
        <>
          {icon && <span className="flex-shrink-0">{icon}</span>}
          {children}
        </>
      )}
    </button>
  );
}
