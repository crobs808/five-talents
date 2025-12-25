'use client';

import Link from 'next/link';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-50 to-gray-50 dark:from-gray-900 dark:to-gray-950">
      <main className="max-w-7xl mx-auto px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h1 className="text-5xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Event Check-In & Pickup System
          </h1>
          <p className="text-xl text-gray-600 dark:text-gray-400">
            Fast, secure, and easy-to-use attendance tracking with printed name tags
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          <Card
            title="Quick Check-In"
            description="Enter phone number last 4 digits on the kiosk for fast family lookup and youth check-in"
            icon="👨‍👩‍👧"
            href="/checkin"
          />
          <Card
            title="Secure Pickup"
            description="Verify parent pickup with unique codes and QR scans to ensure child safety"
            icon="🔐"
            href="/checkout"
          />
          <Card
            title="Admin Tools"
            description="Manage families, events, and view detailed attendance reports"
            icon="⚙️"
            href="/admin"
          />
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 mb-8">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-6">Features</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <FeatureItem title="Kiosk-Friendly" description="Simple numeric keypad with large touch targets" />
            <FeatureItem title="Attendance Tracking" description="Real-time check-in/check-out with timestamps" />
            <FeatureItem title="Pickup Codes" description="Unique, secure codes with QR codes for verification" />
            <FeatureItem title="Printed Tags" description="Child name tags and parent pickup tags" />
            <FeatureItem title="Admin Dashboard" description="Manage families, people, and events" />
            <FeatureItem title="Reports" description="View attendance statistics and details" />
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-300 dark:border-blue-700 rounded-lg p-8 mb-8">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Demo Credentials</h2>
          <div className="space-y-2 font-mono text-gray-700 dark:text-gray-300">
            <div>
              <span className="font-semibold">Family Phone Last 4:</span> 4567 or 6543
            </div>
            <div>
              <span className="font-semibold">Staff PIN:</span> 5555
            </div>
            <div>
              <span className="font-semibold">Note:</span> Use the demo PIN on the checkout page
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">For Families</h3>
            <Link
              href="/checkin"
              className="inline-block px-6 py-3 bg-blue-600 text-white rounded-lg font-semibold hover:bg-blue-700 transition-colors"
            >
              Go to Check-In
            </Link>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-6">
            <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-4">For Staff</h3>
            <Link
              href="/admin"
              className="inline-block px-6 py-3 bg-green-600 text-white rounded-lg font-semibold hover:bg-green-700 transition-colors"
            >
              Go to Admin
            </Link>
          </div>
        </div>
      </main>

      <footer className="bg-gray-800 text-white text-center py-8 mt-12">
        <p>Five Talents | Event Check-In System</p>
        <p className="text-gray-400 text-sm mt-2">
          Secure attendance tracking and family pickup management
        </p>
      </footer>
    </div>
  );
}

function Card({
  title,
  description,
  icon,
  href,
}: {
  title: string;
  description: string;
  icon: string;
  href: string;
}) {
  return (
    <Link href={href}>
      <div className="bg-white dark:bg-gray-800 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-lg transition-all cursor-pointer h-full">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400">{description}</p>
      </div>
    </Link>
  );
}

function FeatureItem({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex gap-4">
      <div className="text-2xl text-green-600 dark:text-green-400">✓</div>
      <div>
        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{title}</h3>
        <p className="text-gray-600 dark:text-gray-400 text-sm">{description}</p>
      </div>
    </div>
  );
}
