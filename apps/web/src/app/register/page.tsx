'use client';

import Link from 'next/link';
import { Building2, Calendar, Tag, ArrowLeft, ArrowRight } from 'lucide-react';

const options = [
  {
    type: 'venue',
    title: 'Venue',
    description: 'Register a bar, club, restaurant, or any physical location',
    icon: Building2,
    color: 'blue',
    examples: 'Bars, Clubs, Restaurants, Hotels, Stadiums',
  },
  {
    type: 'event',
    title: 'Event',
    description: 'Create a time-limited event that can span multiple venues',
    icon: Calendar,
    color: 'purple',
    examples: 'Festivals, Concerts, Conferences, Parties',
  },
  {
    type: 'brand',
    title: 'Brand',
    description: 'Register a sponsor brand to run promotions and quests',
    icon: Tag,
    color: 'pink',
    examples: 'Beverage brands, Product sponsors, Partners',
  },
];

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4">
      <div className="max-w-3xl mx-auto">
        {/* Back Link */}
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-8"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl font-bold text-gray-900">What would you like to register?</h1>
          <p className="text-gray-500 mt-2">
            Choose the type of entity you want to add to FlowBond
          </p>
        </div>

        {/* Options */}
        <div className="space-y-4">
          {options.map((option) => (
            <Link
              key={option.type}
              href={`/register/${option.type}`}
              className="block p-6 bg-white rounded-2xl border hover:shadow-lg transition-all group"
            >
              <div className="flex items-start gap-4">
                <div
                  className={`w-14 h-14 rounded-xl flex items-center justify-center flex-shrink-0 ${
                    option.color === 'blue'
                      ? 'bg-blue-100'
                      : option.color === 'purple'
                      ? 'bg-purple-100'
                      : 'bg-pink-100'
                  }`}
                >
                  <option.icon
                    className={`w-7 h-7 ${
                      option.color === 'blue'
                        ? 'text-blue-600'
                        : option.color === 'purple'
                        ? 'text-purple-600'
                        : 'text-pink-600'
                    }`}
                  />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <h2 className="text-xl font-semibold text-gray-900">{option.title}</h2>
                    <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 group-hover:translate-x-1 transition-all" />
                  </div>
                  <p className="text-gray-600 mt-1">{option.description}</p>
                  <p className="text-sm text-gray-400 mt-2">
                    Examples: {option.examples}
                  </p>
                </div>
              </div>
            </Link>
          ))}
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-xl">
          <p className="text-sm text-blue-800">
            <strong>Note:</strong> All registrations require approval before they become active.
            You&apos;ll be notified once your registration is reviewed.
          </p>
        </div>
      </div>
    </div>
  );
}
