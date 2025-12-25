'use client';

import Link from 'next/link';

export default function AdminPage() {
  return (
    <>
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-8">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-4xl font-bold mb-8 text-gray-900 dark:text-gray-100">Admin Dashboard</h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <AdminCard
              title="Families"
              description="Manage families and contact information"
              href="/admin/families"
            />
            <AdminCard
              title="People"
              description="Manage adults and youth"
              href="/admin/people"
            />
            <AdminCard
              title="Events"
              description="Create and manage events"
              href="/admin/events"
            />
            <AdminCard
              title="Attendance Report"
              description="View check-in/check-out reports"
              href="/admin/reports"
            />
            <AdminCard
              title="Settings"
              description="Configure check-in grace period and other options"
              href="/admin/settings"
            />
            <AdminCard
              title="Stripe Test"
              description="Test Stripe API integration and webhooks"
              href="/admin/stripe-test"
            />
          </div>
        </div>
      </div>
    </>
  );
}

function AdminCard({
  title,
  description,
  href,
}: {
  title: string;
  description: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h2>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </Link>
  );
}
