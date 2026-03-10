export default function StatCard({ label, value, icon, color = 'text-primary' }) {
  return (
    <div className="card flex items-center gap-4">
      <div className={`text-3xl ${color}`}>{icon}</div>
      <div>
        <p className="text-sm text-gray-400">{label}</p>
        <p className="text-2xl font-bold text-gray-100">{value}</p>
      </div>
    </div>
  );
}
