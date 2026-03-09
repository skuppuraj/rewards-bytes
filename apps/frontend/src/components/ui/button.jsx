import { cn } from '@/lib/utils';

const variants = {
  default: 'bg-indigo-600 text-white hover:bg-indigo-700',
  outline: 'border border-gray-300 bg-white text-gray-700 hover:bg-gray-50',
  ghost: 'hover:bg-gray-100 text-gray-700',
  destructive: 'bg-red-600 text-white hover:bg-red-700'
};

const sizes = {
  default: 'h-10 px-4 py-2',
  sm: 'h-8 px-3 text-sm',
  lg: 'h-12 px-6 text-base',
  icon: 'h-10 w-10'
};

export function Button({ className, variant = 'default', size = 'default', children, ...props }) {
  return (
    <button
      className={cn(
        'inline-flex items-center justify-center rounded-md font-medium transition-colors',
        'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500',
        'disabled:pointer-events-none disabled:opacity-50',
        variants[variant], sizes[size], className
      )}
      {...props}
    >
      {children}
    </button>
  );
}
