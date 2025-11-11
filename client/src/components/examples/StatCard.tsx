import { StatCard } from '../StatCard';
import { Calendar, Users, Car, MapPin } from 'lucide-react';

export default function StatCardExample() {
  return (
    <div className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
      <StatCard
        title="Événements actifs"
        value={12}
        icon={Calendar}
        trend={{ value: "+3 ce mois", isPositive: true }}
      />
      <StatCard
        title="Participants"
        value={248}
        icon={Users}
        trend={{ value: "+12%", isPositive: true }}
      />
      <StatCard
        title="Conducteurs"
        value={45}
        icon={Car}
      />
      <StatCard
        title="Places disponibles"
        value={87}
        icon={MapPin}
        trend={{ value: "-5 depuis hier", isPositive: false }}
      />
    </div>
  );
}
