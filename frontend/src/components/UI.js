import React from 'react';

export const Button = ({
  children, variant = 'primary', size = 'md',
  loading = false, className = '', ...props
}) => {
  const base = `btn btn-${variant} btn-${size} ${className}`;
  return (
    <button className={base} disabled={loading || props.disabled} {...props}>
      {loading ? <span className="spinner" style={{ display: 'inline-block' }} /> : children}
    </button>
  );
};

export const Input = React.forwardRef(({
  label, error, icon, className = '', ...props
}, ref) => (
  <div className={`input-group ${className}`}>
    {label && <label className="input-label">{label}</label>}
    <div className="input-wrapper">
      {icon && <span className="input-icon">{icon}</span>}
      <input ref={ref} className={`input-field ${icon ? 'has-icon' : ''} ${error ? 'has-error' : ''}`} {...props} />
    </div>
    {error && <span className="input-error">{error}</span>}
  </div>
));

export const Card = ({ children, className = '', hoverable = false, ...props }) => (
  <div className={`card ${hoverable ? 'card-hoverable' : ''} ${className}`} {...props}>
    {children}
  </div>
);

export const Badge = ({ children, color = 'default' }) => (
  <span className={`badge badge-${color}`}>{children}</span>
);

export const Spinner = ({ size = 24 }) => (
  <div className="spinner" style={{ width: size, height: size }} />
);

export const EmptyState = ({ icon, title, description, action }) => (
  <div className="empty-state">
    {icon && <div className="empty-icon">{icon}</div>}
    <h3>{title}</h3>
    {description && <p>{description}</p>}
    {action}
  </div>
);
