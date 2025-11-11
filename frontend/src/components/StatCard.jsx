export default function StatCard({ title, value, icon: Icon, color = "primary", trend }) {
  return (
    <div className="bg-background rounded-lg border border-border p-6">
      <div className="flex items-center justify-between mb-4">
        <div className={`p-3 rounded-lg bg-${color}/10`}>
          <Icon className={`w-6 h-6 text-${color}`} />
        </div>
        {trend && (
          <span className={`text-sm font-medium ${trend > 0 ? "text-success" : "text-danger"}`}>
            {trend > 0 ? "+" : ""}
            {trend}%
          </span>
        )}
      </div>
      <h3 className="text-2xl font-bold mb-1">{value}</h3>
      <p className="text-sm text-text-secondary">{title}</p>
    </div>
  )
}
