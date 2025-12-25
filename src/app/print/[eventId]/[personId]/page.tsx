'use client';

import { useEffect, useState } from 'react';
import { QRCodeComponent } from '@/components/QRCode';
import { formatDate } from '@/lib/utils';

interface PrintTagProps {
  personId: string;
  eventId: string;
}

interface PrintData {
  youth: any;
  event: any;
  pickupCode: any;
  organization: any;
}

export default function PrintTagPage() {
  const [data, setData] = useState<PrintData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // In production, get these from URL params
    const searchParams = new URLSearchParams(window.location.search);
    const personId = searchParams.get('personId') || 'sample-youth';
    const eventId = searchParams.get('eventId') || 'sample-event';

    // Fetch data - for now use sample
    const sampleData = {
      youth: {
        id: personId,
        firstName: 'John',
        lastName: 'Doe',
      },
      event: {
        id: eventId,
        title: 'Summer Event',
        startsAt: new Date(),
      },
      pickupCode: {
        code: 'ABC',
      },
      organization: {
        name: 'Five Talents',
      },
    };

    setData(sampleData);
    setLoading(false);
  }, []);

  if (loading || !data) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="print-hide p-4 mb-8">
      <div className="flex gap-4">
        <button
          onClick={() => window.print()}
          className="px-6 py-2 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700"
        >
          Print Tags
        </button>
        <button
          onClick={() => window.history.back()}
          className="px-6 py-2 bg-gray-300 text-gray-900 rounded-lg font-semibold hover:bg-gray-400"
        >
          Back
        </button>
      </div>
    </div>
  );
}
