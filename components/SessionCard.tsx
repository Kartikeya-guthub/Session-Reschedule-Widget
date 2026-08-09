'use client';

import { Session } from '@/lib/types';
import StatusBadge from './StatusBadge';
import { useRef, useState, useEffect } from 'react';
import RescheduleModal from './RescheduleModal';

function formatDate(utcISO: string): string {
  const date = new Date(utcISO);
  return new Intl.DateTimeFormat(undefined, {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
  }).format(date);
}

function formatTime(utcISO: string): string {
  const date = new Date(utcISO);
  return new Intl.DateTimeFormat(undefined, {
    hour: 'numeric',
    minute: '2-digit',
  }).format(date);
}

export default function SessionCard({ session }: { session: Session }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const [localStatus, setLocalStatus] = useState(session.status);
  const [showToast, setShowToast] = useState(false);
  const [timeZone, setTimeZone] = useState('');

  useEffect(() => {
    setTimeZone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }, []);

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
      <div className="group flex flex-col rounded-2xl border border-orange-100 bg-white p-4 sm:p-5 shadow-sm transition-all duration-200 hover:border-orange-200 hover:shadow-md">
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3 className="text-sm sm:text-base font-semibold text-gray-900 leading-snug">
            {session.subject}
          </h3>
          <StatusBadge status={localStatus} />
        </div>

        <p className="mb-3 text-sm text-gray-500">
          👩‍🏫 {session.teacherName}
        </p>

        <div className="mb-4 flex items-center gap-2.5 rounded-lg bg-orange-50/70 px-3 py-2">
          <span className="text-base">📅</span>
          <div className="flex flex-col">
            <span className="text-sm font-medium text-gray-800">
              {formatDate(session.datetimeUTC)} · {formatTime(session.datetimeUTC)}
            </span>
            {timeZone && (
              <span className="text-xs text-gray-400">
                Your local time · {timeZone}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-end justify-end">
          <button
            ref={triggerRef}
            onClick={() => setIsModalOpen(true)}
            className="shrink-0 rounded-lg border border-orange-300 bg-white px-3.5 py-2 text-xs font-semibold text-orange-700 shadow-sm hover:bg-orange-50 hover:border-orange-400 hover:shadow-md focus-visible:ring-2 focus-visible:ring-orange-500 focus-visible:ring-offset-2 transition-all duration-150 active:scale-[0.98]"
          >
            Request a different time
          </button>
        </div>
      </div>
      
      {/* Success toast */}
      {showToast && (
        <div className="animate-toast fixed bottom-4 right-4 z-50 flex items-center gap-3 rounded-xl bg-gray-900 px-5 py-3.5 text-sm text-white shadow-2xl">
          <span className="flex h-6 w-6 items-center justify-center rounded-full bg-emerald-500 text-xs">✓</span>
          <div>
            <p className="font-semibold">Reschedule request submitted</p>
            <p className="text-xs text-gray-300">Your session is now pending confirmation.</p>
          </div>
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
