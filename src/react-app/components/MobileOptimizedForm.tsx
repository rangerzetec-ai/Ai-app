import React, { forwardRef } from 'react';
import { Eye, EyeOff } from 'lucide-react';

// Mobile optimized input component
interface MobileInputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  showPasswordToggle?: boolean;
}

export const MobileInput = forwardRef<HTMLInputElement, MobileInputProps>(
  ({ label, error, leftIcon, rightIcon, showPasswordToggle, className = "", ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);

    const inputType = showPasswordToggle && props.type === 'password' 
      ? (showPassword ? 'text' : 'password')
      : props.type;

    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-slate-400 pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            {...props}
            type={inputType}
            className={`mobile-input w-full transition-all duration-200 ${
              leftIcon ? 'pl-10' : 'pl-4'
            } ${
              rightIcon || showPasswordToggle ? 'pr-10' : 'pr-4'
            } ${
              error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'focus:ring-blue-200'
            } ${className}`}
          />
          {(rightIcon || showPasswordToggle) && (
            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
              {showPasswordToggle ? (
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="text-slate-400 hover:text-slate-600 p-1 touch-target"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                </button>
              ) : rightIcon}
            </div>
          )}
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

MobileInput.displayName = 'MobileInput';

// Mobile optimized textarea component
interface MobileTextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  error?: string;
}

export const MobileTextarea = forwardRef<HTMLTextAreaElement, MobileTextareaProps>(
  ({ label, error, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        )}
        <textarea
          ref={ref}
          {...props}
          className={`mobile-input w-full min-h-[120px] resize-y transition-all duration-200 ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'focus:ring-blue-200'
          } ${className}`}
        />
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

MobileTextarea.displayName = 'MobileTextarea';

// Mobile optimized select component
interface MobileSelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  error?: string;
  options: { value: string; label: string; disabled?: boolean }[];
}

export const MobileSelect = forwardRef<HTMLSelectElement, MobileSelectProps>(
  ({ label, error, options, className = "", ...props }, ref) => {
    return (
      <div className="space-y-1">
        {label && (
          <label className="block text-sm font-medium text-slate-700 mb-1">
            {label}
          </label>
        )}
        <select
          ref={ref}
          {...props}
          className={`mobile-input w-full transition-all duration-200 ${
            error ? 'border-red-300 focus:border-red-500 focus:ring-red-200' : 'focus:ring-blue-200'
          } ${className}`}
        >
          {options.map((option) => (
            <option 
              key={option.value} 
              value={option.value} 
              disabled={option.disabled}
            >
              {option.label}
            </option>
          ))}
        </select>
        {error && (
          <p className="text-sm text-red-600 mt-1">{error}</p>
        )}
      </div>
    );
  }
);

MobileSelect.displayName = 'MobileSelect';

// Mobile optimized button component
interface MobileButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const MobileButton = forwardRef<HTMLButtonElement, MobileButtonProps>(
  ({ 
    variant = 'primary', 
    size = 'md', 
    loading, 
    leftIcon, 
    rightIcon, 
    children, 
    className = "",
    disabled,
    ...props 
  }, ref) => {
    const variantClasses = {
      primary: 'bg-blue-600 hover:bg-blue-700 text-white shadow-sm active:bg-blue-800',
      secondary: 'bg-slate-100 hover:bg-slate-200 text-slate-900 active:bg-slate-300',
      danger: 'bg-red-600 hover:bg-red-700 text-white shadow-sm active:bg-red-800',
      ghost: 'bg-transparent hover:bg-slate-100 text-slate-700 active:bg-slate-200',
    };

    const sizeClasses = {
      sm: 'px-3 py-2 text-sm min-h-[40px]',
      md: 'px-4 py-3 text-base min-h-[48px]',
      lg: 'px-6 py-4 text-lg min-h-[56px]',
    };

    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        {...props}
        className={`mobile-button inline-flex items-center justify-center font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed touch-action-manipulation ${variantClasses[variant]} ${sizeClasses[size]} ${loading ? 'mobile-loading' : ''} ${className}`}
      >
        {loading && (
          <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin mr-2" />
        )}
        {!loading && leftIcon && (
          <span className="mr-2">{leftIcon}</span>
        )}
        {children}
        {!loading && rightIcon && (
          <span className="ml-2">{rightIcon}</span>
        )}
      </button>
    );
  }
);

MobileButton.displayName = 'MobileButton';

// Mobile optimized card component
interface MobileCardProps {
  children: React.ReactNode;
  className?: string;
  pressable?: boolean;
  onPress?: () => void;
}

export function MobileCard({ children, className = "", pressable, onPress }: MobileCardProps) {
  const cardClasses = `bg-white rounded-xl border border-slate-200 shadow-sm transition-all duration-200 ${
    pressable 
      ? 'hover-desktop:shadow-md hover-touch:scale-[0.98] active:shadow-lg cursor-pointer' 
      : ''
  } ${className}`;

  if (pressable && onPress) {
    return (
      <button
        onClick={onPress}
        className={`${cardClasses} text-left w-full p-0 touch-action-manipulation`}
      >
        {children}
      </button>
    );
  }

  return (
    <div className={cardClasses}>
      {children}
    </div>
  );
}

// Mobile optimized modal component
interface MobileModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg' | 'full';
}

export function MobileModal({ isOpen, onClose, title, children, size = 'md' }: MobileModalProps) {
  React.useEffect(() => {
    if (isOpen) {
      document.body.classList.add('modal-open');
    } else {
      document.body.classList.remove('modal-open');
    }

    return () => {
      document.body.classList.remove('modal-open');
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const sizeClasses = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    full: 'max-w-full md:max-w-4xl',
  };

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4 bg-black/50">
      <div 
        className={`mobile-modal bg-white rounded-t-xl sm:rounded-xl shadow-xl w-full ${sizeClasses[size]} max-h-[90vh] sm:max-h-[80vh] overflow-hidden animate-slide-up`}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="flex items-center justify-between p-4 border-b border-slate-200">
            <h3 className="text-lg font-semibold text-slate-900">{title}</h3>
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-600 rounded-lg transition-colors touch-target"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
        <div className="overflow-y-auto overscroll-contain">
          {children}
        </div>
      </div>
    </div>
  );
}
