'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Plus,
  MapPin,
  Settings,
  ExternalLink,
  Clock,
  CheckCircle,
} from 'lucide-react';
import api from '@/lib/api';

interface Venue {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  logoUrl: string | null;
  status: string;
  createdAt: string;
}

export default function VenuesPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchVenues();
  }, []);

  const fetchVenues = async () => {
    try {
      const data = await api.getMyVenues();
      setVenues(data);
    } catch (error) {
      console.error('Failed to fetch venues:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">My Venues</h1>
          <p className="text-gray-500 mt-1">
            Manage your registered venues
          </p>
        </div>
        <Link
          href="/register/venue"
          className="px-4 py-2 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors flex items-center gap-2"
        >
          <Plus className="w-5 h-5" />
          Add Venue
        </Link>
      </div>

      {venues.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="bg-white rounded-2xl border overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Venue Image/Placeholder */}
              <div className="h-32 bg-gradient-to-br from-blue-500 to-blue-600 relative">
                {venue.logoUrl ? (
                  <img
                    src={venue.logoUrl}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Building2 className="w-12 h-12 text-white/50" />
                  </div>
                )}
                <div className="absolute top-3 right-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${
                      venue.status === 'ACTIVE'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}
                  >
                    {venue.status === 'ACTIVE' ? (
                      <CheckCircle className="w-3 h-3" />
                    ) : (
                      <Clock className="w-3 h-3" />
                    )}
                    {venue.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="p-4">
                <h3 className="text-lg font-semibold text-gray-900">
                  {venue.name}
                </h3>
                {venue.city && (
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-1">
                    <MapPin className="w-4 h-4" />
                    {venue.city}
                  </p>
                )}
                {venue.description && (
                  <p className="text-sm text-gray-600 mt-2 line-clamp-2">
                    {venue.description}
                  </p>
                )}

                {/* Actions */}
                <div className="flex items-center gap-2 mt-4 pt-4 border-t">
                  <Link
                    href={`/dashboard/venues/${venue.id}`}
                    className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors text-sm font-medium text-center flex items-center justify-center gap-1"
                  >
                    <Settings className="w-4 h-4" />
                    Manage
                  </Link>
                  <Link
                    href={`/v3n/${venue.slug}`}
                    target="_blank"
                    className="px-3 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-1"
                  >
                    <ExternalLink className="w-4 h-4" />
                    View
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="bg-white rounded-2xl border p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Building2 className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">
            No venues yet
          </h3>
          <p className="text-gray-500 mb-6 max-w-md mx-auto">
            Register your first venue to start managing menus, taking orders, and running promotions.
          </p>
          <Link
            href="/register/venue"
            className="inline-flex items-center gap-2 px-6 py-3 bg-primary-600 text-white rounded-xl hover:bg-primary-700 transition-colors"
          >
            <Plus className="w-5 h-5" />
            Register a Venue
          </Link>
        </div>
      )}
    </div>
  );
}
