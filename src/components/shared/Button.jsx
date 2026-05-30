export default function Button({
  children,
  variant = 'primary',
  className = '',
  onClick,
  disabled = false,
  type = 'button',
}) {
  const variants = {
    primary: 'bg-accent text-white hover:brightness-110 active:scale-95',
    secondary: 'bg-bg-card border border-border text-white hover:bg-[#1a1a1a]',
    success: 'bg-accent-success text-black hover:brightness-110',
    ghost: 'bg-transparent text-muted hover:text-white',
  };

  const handleClick = (e) => {
    if (navigator.vibrate) navigator.vibrate(10);
    onClick?.(e);
  };

  return (
    <button
      type={type}
      disabled={disabled}
      onClick={handleClick}
      className={`min-h-[48px] px-6 rounded-xl font-body font-medium text-base screen-transition disabled:opacity-40 disabled:cursor-not-allowed ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}
