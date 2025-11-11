import { ParticipantTable } from '../ParticipantTable';

const mockParticipants = [
  {
    id: "1",
    name: "Marie Dubois",
    email: "marie.dubois@example.com",
    city: "Paris",
    role: "driver" as const,
    seats: 4,
    status: "confirmed" as const,
  },
  {
    id: "2",
    name: "Pierre Martin",
    email: "pierre.martin@example.com",
    city: "Paris",
    role: "passenger" as const,
    status: "confirmed" as const,
  },
  {
    id: "3",
    name: "Sophie Laurent",
    email: "sophie.laurent@example.com",
    city: "Lyon",
    role: "driver" as const,
    seats: 3,
    status: "pending" as const,
  },
];

export default function ParticipantTableExample() {
  return (
    <div className="p-4 max-w-5xl mx-auto">
      <ParticipantTable participants={mockParticipants} />
    </div>
  );
}
