export default function Button({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  icon = null,
  className = '',
  ...props
}) {
  const base = 'inline-flex items-center justify-center gap-2 font-medium rounded-xl transition-all duration-150 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed';

  const variants = {
    primary: 'bg-brand-primary text-white hover:bg-brand-primaryDark shadow-sm hover:shadow-green active:scale-[0.98]',
    secondary: 'border border-ink-300 text-ink-700 bg-white hover:bg-surface-100 hover:border-ink-300/80 active:scale-[0.98]',
    danger: 'bg-brand-danger text-white hover:bg-red-700 shadow-sm active:scale-[0.98]',
    ghost: 'text-brand-primary hover:bg-brand-primary/8 bg-transparent rounded-lg',
    outline: 'border border-brand-primary text-brand-primary hover:bg-brand-primary hover:text-white active:scale-[0.98]',
  };

  const sizes = {
    sm: 'px-3 py-1.5 text-xs',
    md: 'px-4 py-2.5 text-sm',
    lg: 'px-6 py-3 text-base',
  };

  return (
    <button
      className={`${base} ${variants[variant]} ${sizes[size]} ${className}`}
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
