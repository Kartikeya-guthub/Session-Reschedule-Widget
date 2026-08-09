import SessionList from '@/components/SessionList';
import { mockSessions } from '@/lib/mockData';

export default function Home() {
  return (
    <main className="min-h-screen px-4 py-8 sm:py-12">
      <div className="mx-auto max-w-lg">
        {/* Portal header */}
        <div className="mb-8">
          <p className="mb-1 text-sm font-medium text-orange-600 tracking-wide uppercase">Tutoring Portal</p>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">
            Upcoming Sessions
          </h1>
          <p className="mt-2 text-sm text-gray-500">
            View your scheduled sessions and request time changes if needed.
          </p>
        </div>
        <SessionList sessions={mockSessions} />
      </div>
    </main>
  );
}
