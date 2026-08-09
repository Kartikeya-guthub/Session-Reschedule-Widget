'use client';

import { Session } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { useRef, useState } from 'react';
import RescheduleModal from './RescheduleModal';

function formatLocalDatetime(utcISO: string): string {
  const date = new Date(utcISO);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZoneName: 'short',
  }).format(date);
}

export default function SessionCard({ session }: { session: Session }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [localStatus, setLocalStatus] = useState(session.status);
  const [showToast, setShowToast] = useState(false);

  const handleSuccess = () => {
    setLocalStatus('pending_reschedule');
    setIsModalOpen(false);
    setShowToast(true);
    setTimeout(() => {
      if (triggerRef.current) triggerRef.current.focus();
      setTimeout(() => setShowToast(false), 3000);
    }, 0);
  };

  return (
    <>
      <div className="flex flex-col rounded-2xl border border-orange-100 bg-orange-50/50 p-5 shadow-sm transition-all hover:border-orange-200 hover:bg-orange-50">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-base font-semibold text-gray-900 leading-snug">
            {session.subject}
          </h3>
          <StatusBadge status={localStatus} />
        </div>

        <p className="mb-1 text-sm text-gray-600">
          {session.teacherName}
        </p>

        <div className="mt-2 flex items-end justify-between gap-4">
          <p className="text-sm text-gray-500">
            {formatLocalDatetime(session.datetimeUTC)}
          </p>
          <button
            ref={triggerRef}
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 rounded-lg bg-orange-100 px-3 py-1.5 text-xs font-semibold text-orange-700 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-orange-500"
          >
            Request Reschedule
          </button>
        </div>
      </div>
      
      {showToast && (
        <div className="fixed bottom-4 right-4 z-50 rounded-lg bg-gray-900 px-4 py-2 text-sm text-white shadow-lg animate-in fade-in slide-in-from-bottom-4">
          Reschedule requested successfully!
        </div>
      )}

      {isModalOpen && typeof document !== 'undefined' && (
        <RescheduleModal 
          session={session} 
          onClose={() => setIsModalOpen(false)} 
          triggerRef={triggerRef} 
          onSuccess={handleSuccess}
        />
      )}
    </>
  );
}
