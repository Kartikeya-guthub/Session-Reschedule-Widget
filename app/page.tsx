import SessionList from '@/components/SessionList';
import { mockSessions } from '@/lib/mockData';

export default function Home() {
  return (
    <main className="min-h-screen bg-white px-4 py-12">
      <div className="mx-auto max-w-lg">
        <h1 className="mb-8 text-2xl font-bold text-gray-900">
          Upcoming Sessions
        </h1>
        <SessionList sessions={mockSessions} />
      </div>
    </main>
  );
}
