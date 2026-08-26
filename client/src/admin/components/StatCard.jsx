export default function StatCard({
  title,
  value,
  icon,
  description,
  className = '',
}) {
  return (
    <div className={`stat-card ${className}`}>
      <div className="stat-card-top">
        <div>
          <span className="stat-title">{title}</span>
          <h2>{value}</h2>
        </div>

        <div className="stat-icon">
          {icon}
        </div>
      </div>

      {description && (
        <p className="stat-description">
          {description}
        </p>
      )}
    </div>
  );
}