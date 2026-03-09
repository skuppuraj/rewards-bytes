import { cn } from '@/lib/utils';

export function Card({ className, children, ...props }) {
  return (
    <div className={cn('rounded-xl border border-gray-200 bg-white shadow-sm', className)} {...props}>
      {children}
    </div>
  );
}
export function CardHeader({ className, children, ...props }) {
  return <div className={cn('p-6 pb-0', className)} {...props}>{children}</div>;
}
export function CardContent({ className, children, ...props }) {
  return <div className={cn('p-6', className)} {...props}>{children}</div>;
}
