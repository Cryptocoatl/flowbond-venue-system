'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Building2,
  Calendar,
  Tag,
  Plus,
  Clock,
  CheckCircle,
  XCircle,
  ArrowRight,
} from 'lucide-react';
import api from '@/lib/api';

interface Registration {
  id: string;
  type: string;
  name: string;
  slug: string;
  status: string;
  submittedAt: string;
}

export default function DashboardPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRegistrations();
  }, []);

  const fetchRegistrations = async () => {
    try {
      const data = await api.getMyRegistrations();
      setRegistrations(data);
    } catch (error) {
      console.error('Failed to fetch registrations:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return <Clock className="w-4 h-4 text-yellow-500" />;
      case 'APPROVED':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'REJECTED':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return null;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'bg-yellow-100 text-yellow-800';
      case 'APPROVED':
        return 'bg-green-100 text-green-800';
      case 'REJECTED':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'VENUE':
        return <Building2 className="w-5 h-5" />;
      case 'EVENT':
        return <Calendar className="w-5 h-5" />;
      case 'BRAND':
        return <Tag className="w-5 h-5" />;
      default:
        return null;
    }
  };

  return (
    <div className="max-w-6xl mx-auto">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-gray-900">Welcome to FlowBond</h1>
        <p className="text-gray-500 mt-1">
          Manage your venues, events, and brands from one place
        </p>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Link
          href="/register/venue"
          className="p-6 bg-white rounded-xl border hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-blue-100 rounded-xl flex items-center justify-center">
              <Building2 className="w-6 h-6 text-blue-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">Register Venue</h3>
          <p className="text-sm text-gray-500 mt-1">
            Add a new bar, club, or restaurant
          </p>
        </Link>

        <Link
          href="/register/event"
          className="p-6 bg-white rounded-xl border hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-purple-100 rounded-xl flex items-center justify-center">
              <Calendar className="w-6 h-6 text-purple-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">Register Event</h3>
          <p className="text-sm text-gray-500 mt-1">
            Create a festival, concert, or gathering
          </p>
        </Link>

        <Link
          href="/register/brand"
          className="p-6 bg-white rounded-xl border hover:shadow-md transition-shadow group"
        >
          <div className="flex items-center justify-between">
            <div className="w-12 h-12 bg-accent-100 rounded-xl flex items-center justify-center">
              <Tag className="w-6 h-6 text-accent-600" />
            </div>
            <ArrowRight className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">Register Brand</h3>
          <p className="text-sm text-gray-500 mt-1">
            Add a sponsor or product brand
          </p>
        </Link>
      </div>

      {/* My Registrations */}
      <div className="bg-white rounded-xl border">
        <div className="p-4 border-b flex items-center justify-between">
          <h2 className="text-lg font-semibold text-gray-900">My Registrations</h2>
          <Link
            href="/register"
            className="text-sm text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
          >
            <Plus className="w-4 h-4" />
            New
          </Link>
        </div>

        {loading ? (
          <div className="p-8 text-center">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-primary-600 rounded-full animate-spin mx-auto" />
          </div>
        ) : registrations.length > 0 ? (
          <div className="divide-y">
            {registrations.map((reg) => (
              <div
                key={reg.id}
                className="p-4 flex items-center justify-between hover:bg-gray-50"
              >
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 bg-gray-100 rounded-lg flex items-center justify-center text-gray-600">
                    {getTypeIcon(reg.type)}
                  </div>
                  <div>
                    <h3 className="font-medium text-gray-900">{reg.name}</h3>
                    <p className="text-sm text-gray-500">
                      {reg.type.charAt(0) + reg.type.slice(1).toLowerCase()} &middot; /{reg.slug}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-3">
                  <span
                    className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 ${getStatusColor(
                      reg.status
                    )}`}
                  >
                    {getStatusIcon(reg.status)}
                    {reg.status}
                  </span>
                  <span className="text-sm text-gray-400">
                    {new Date(reg.submittedAt).toLocaleDateString()}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center">
            <div className="w-12 h-12 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-3">
              <Building2 className="w-6 h-6 text-gray-400" />
            </div>
            <p className="text-gray-500">No registrations yet</p>
            <p className="text-sm text-gray-400 mt-1">
              Register a venue, event, or brand to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
