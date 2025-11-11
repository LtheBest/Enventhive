import { EventCard } from '../EventCard';

export default function EventCardExample() {
  return (
    <div className="p-4 max-w-2xl mx-auto space-y-4">
      <EventCard
        id="1"
        title="Réunion d'équipe Q4"
        date="15 Décembre 2024, 14:00"
        location="Paris, 75001"
        participants={32}
        maxParticipants={50}
        drivers={8}
        availableSeats={12}
        status="upcoming"
      />
      <EventCard
        id="2"
        title="Team Building Automne"
        date="20 Novembre 2024, 10:00"
        location="Lyon, 69001"
        participants={45}
        drivers={10}
        availableSeats={5}
        status="ongoing"
      />
    </div>
  );
}
