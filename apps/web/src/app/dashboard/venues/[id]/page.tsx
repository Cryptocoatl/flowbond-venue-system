'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Building2,
  ArrowLeft,
  MapPin,
  Globe,
  Clock,
  Settings,
  Menu,
  ShoppingCart,
  Users,
  Edit,
  ExternalLink,
  BarChart3,
} from 'lucide-react';
import api from '@/lib/api';

interface Venue {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
  timezone: string;
  logoUrl: string | null;
  bannerUrl: string | null;
  status: string;
  createdAt: string;
}

const tabs = [
  { id: 'overview', label: 'Overview', icon: BarChart3 },
  { id: 'menu', label: 'Menu', icon: Menu },
  { id: 'orders', label: 'Orders', icon: ShoppingCart },
  { id: 'staff', label: 'Staff', icon: Users },
  { id: 'settings', label: 'Settings', icon: Settings },
];

export default function VenueDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [venue, setVenue] = useState<Venue | null>(null);
  const [activeTab, setActiveTab] = useState('overview');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchVenue();
    }
  }, [params.id]);

  const fetchVenue = async () => {
    try {
      const data = await api.getVenue(params.id as string);
      setVenue(data);
    } catch (error) {
      console.error('Failed to fetch venue:', error);
      router.push('/dashboard/venues');
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

  if (!venue) {
    return null;
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Back Link */}
      <Link
        href="/dashboard/venues"
        className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Venues
      </Link>

      {/* Header */}
      <div className="bg-white rounded-2xl border overflow-hidden mb-6">
        {/* Banner */}
        <div className="h-40 bg-gradient-to-br from-blue-500 to-blue-600 relative">
          {venue.bannerUrl && (
            <img
              src={venue.bannerUrl}
              alt={venue.name}
              className="w-full h-full object-cover"
            />
          )}
        </div>

        {/* Info */}
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-4">
              {/* Logo */}
              <div className="w-20 h-20 -mt-16 bg-white border-4 border-white rounded-xl shadow-lg flex items-center justify-center overflow-hidden">
                {venue.logoUrl ? (
                  <img
                    src={venue.logoUrl}
                    alt={venue.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <Building2 className="w-10 h-10 text-gray-400" />
                )}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{venue.name}</h1>
                <div className="flex items-center gap-4 mt-1 text-sm text-gray-500">
                  {venue.city && (
                    <span className="flex items-center gap-1">
                      <MapPin className="w-4 h-4" />
                      {venue.city}
                    </span>
                  )}
                  <span className="flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {venue.timezone}
                  </span>
                </div>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Link
                href={`/v3n/${venue.slug}`}
                target="_blank"
                className="px-4 py-2 border rounded-lg hover:bg-gray-50 transition-colors text-sm font-medium flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                View Public Page
              </Link>
              <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium flex items-center gap-2">
                <Edit className="w-4 h-4" />
                Edit
              </button>
            </div>
          </div>

          {venue.description && (
            <p className="text-gray-600 mt-4">{venue.description}</p>
          )}
        </div>

        {/* Tabs */}
        <div className="border-t px-6">
          <div className="flex gap-1">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-3 text-sm font-medium flex items-center gap-2 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-primary-600 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-900'
                }`}
              >
                <tab.icon className="w-4 h-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <div className="bg-white rounded-2xl border p-6">
        {activeTab === 'overview' && <OverviewTab venue={venue} />}
        {activeTab === 'menu' && <MenuTab venueId={venue.id} />}
        {activeTab === 'orders' && <OrdersTab venueId={venue.id} />}
        {activeTab === 'staff' && <StaffTab venueId={venue.id} />}
        {activeTab === 'settings' && <SettingsTab venue={venue} onUpdate={fetchVenue} />}
      </div>
    </div>
  );
}

function OverviewTab({ venue }: { venue: Venue }) {
  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Overview</h2>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="p-4 bg-blue-50 rounded-xl">
          <div className="text-2xl font-bold text-blue-600">0</div>
          <div className="text-sm text-blue-800">Total Orders</div>
        </div>
        <div className="p-4 bg-green-50 rounded-xl">
          <div className="text-2xl font-bold text-green-600">$0</div>
          <div className="text-sm text-green-800">Revenue Today</div>
        </div>
        <div className="p-4 bg-purple-50 rounded-xl">
          <div className="text-2xl font-bold text-purple-600">0</div>
          <div className="text-sm text-purple-800">Menu Items</div>
        </div>
      </div>

      <div className="mt-6">
        <h3 className="font-medium text-gray-900 mb-3">Quick Actions</h3>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/venues/${venue.id}/menu`}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            Manage Menu
          </Link>
          <Link
            href={`/dashboard/venues/${venue.id}/orders`}
            className="px-4 py-2 bg-gray-100 rounded-lg text-sm hover:bg-gray-200 transition-colors"
          >
            View Orders
          </Link>
        </div>
      </div>
    </div>
  );
}

function MenuTab({ venueId }: { venueId: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Menu</h2>
        <Link
          href={`/dashboard/venues/${venueId}/menu`}
          className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium"
        >
          Manage Full Menu
        </Link>
      </div>
      <p className="text-gray-500">
        Use the menu manager to add categories and items to your venue&apos;s menu.
      </p>
    </div>
  );
}

function OrdersTab({ venueId }: { venueId: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Recent Orders</h2>
        <Link
          href={`/dashboard/venues/${venueId}/orders`}
          className="text-sm text-primary-600 hover:text-primary-700 font-medium"
        >
          View All
        </Link>
      </div>
      <div className="text-center py-8 text-gray-500">
        <ShoppingCart className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No orders yet</p>
      </div>
    </div>
  );
}

function StaffTab({ venueId }: { venueId: string }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">Staff Members</h2>
        <button className="px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 transition-colors text-sm font-medium">
          Invite Staff
        </button>
      </div>
      <div className="text-center py-8 text-gray-500">
        <Users className="w-12 h-12 mx-auto mb-3 text-gray-300" />
        <p>No staff members added yet</p>
      </div>
    </div>
  );
}

function SettingsTab({ venue, onUpdate }: { venue: Venue; onUpdate: () => void }) {
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: venue.name,
    description: venue.description || '',
    address: venue.address || '',
    city: venue.city || '',
    timezone: venue.timezone,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    try {
      await api.updateVenue(venue.id, formData);
      onUpdate();
    } catch (error) {
      console.error('Failed to update venue:', error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div>
      <h2 className="text-lg font-semibold text-gray-900 mb-4">Venue Settings</h2>
      <form onSubmit={handleSubmit} className="space-y-4 max-w-xl">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Venue Name
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Description
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={3}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none resize-none"
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Address
            </label>
            <input
              type="text"
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              City
            </label>
            <input
              type="text"
              value={formData.city}
              onChange={(e) => setFormData({ ...formData, city: e.target.value })}
              className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Timezone
          </label>
          <select
            value={formData.timezone}
            onChange={(e) => setFormData({ ...formData, timezone: e.target.value })}
            className="w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none bg-white"
          >
            <option value="America/New_York">Eastern Time (ET)</option>
            <option value="America/Chicago">Central Time (CT)</option>
            <option value="America/Denver">Mountain Time (MT)</option>
            <option value="America/Los_Angeles">Pacific Time (PT)</option>
          </select>
        </div>

        <div className="pt-4">
          <button
            type="submit"
            disabled={saving}
            className="px-6 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 transition-colors"
          >
            {saving ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </form>
    </div>
  );
}
