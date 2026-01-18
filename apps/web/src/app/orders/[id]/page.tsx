'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  CheckCircle,
  Clock,
  MapPin,
  ArrowLeft,
  Package,
  Gift,
} from 'lucide-react';
import api from '@/lib/api';

interface OrderItem {
  id: string;
  quantity: number;
  unitPrice: number;
  source: string;
  notes: string | null;
  menuItem: {
    id: string;
    name: string;
    imageUrl: string | null;
  };
}

interface Order {
  id: string;
  orderNumber: string;
  status: string;
  totalAmount: number;
  createdAt: string;
  items: OrderItem[];
  venue: {
    id: string;
    name: string;
    slug: string;
    address: string | null;
    city: string | null;
  };
}

export default function OrderConfirmationPage() {
  const params = useParams();
  const router = useRouter();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (params.id) {
      fetchOrder();
    }
  }, [params.id]);

  const fetchOrder = async () => {
    try {
      const data = await api.getOrder(params.id as string);
      setOrder(data);
    } catch (error) {
      console.error('Failed to fetch order:', error);
      router.push('/dashboard');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'CONFIRMED':
      case 'PREPARING':
      case 'READY':
      case 'COMPLETED':
        return <CheckCircle className="w-6 h-6 text-green-500" />;
      case 'PENDING_PAYMENT':
        return <Clock className="w-6 h-6 text-yellow-500" />;
      default:
        return <Clock className="w-6 h-6 text-gray-400" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'DRAFT':
        return 'Draft';
      case 'PENDING_PAYMENT':
        return 'Awaiting Payment';
      case 'CONFIRMED':
        return 'Order Confirmed';
      case 'PREPARING':
        return 'Being Prepared';
      case 'READY':
        return 'Ready for Pickup';
      case 'COMPLETED':
        return 'Completed';
      case 'CANCELLED':
        return 'Cancelled';
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-gray-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-lg mx-auto">
        {/* Back Link */}
        <Link
          href={`/v3n/${order.venue.slug}`}
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Venue
        </Link>

        {/* Status Card */}
        <div className="bg-white rounded-2xl border p-6 text-center mb-6">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            {getStatusIcon(order.status)}
          </div>
          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            {getStatusText(order.status)}
          </h1>
          <p className="text-gray-500">
            Order #{order.orderNumber}
          </p>
        </div>

        {/* Venue Info */}
        <div className="bg-white rounded-2xl border p-4 mb-6">
          <h2 className="font-semibold text-gray-900 mb-2">{order.venue.name}</h2>
          {order.venue.address && (
            <p className="text-sm text-gray-500 flex items-center gap-1">
              <MapPin className="w-4 h-4" />
              {order.venue.address}
              {order.venue.city && `, ${order.venue.city}`}
            </p>
          )}
        </div>

        {/* Order Items */}
        <div className="bg-white rounded-2xl border overflow-hidden mb-6">
          <div className="p-4 border-b">
            <h2 className="font-semibold text-gray-900">Order Details</h2>
          </div>
          <div className="divide-y">
            {order.items.map((item) => (
              <div key={item.id} className="p-4 flex gap-3">
                {item.menuItem.imageUrl ? (
                  <img
                    src={item.menuItem.imageUrl}
                    alt={item.menuItem.name}
                    className="w-16 h-16 rounded-lg object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                    {item.source === 'REDEEMED' ? (
                      <Gift className="w-6 h-6 text-green-500" />
                    ) : (
                      <Package className="w-6 h-6 text-gray-400" />
                    )}
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex justify-between">
                    <h3 className="font-medium text-gray-900">
                      {item.menuItem.name}
                    </h3>
                    <span className="text-gray-500">x{item.quantity}</span>
                  </div>
                  {item.source === 'REDEEMED' ? (
                    <span className="text-sm text-green-600">Redeemed</span>
                  ) : (
                    <span className="text-sm text-gray-500">
                      ${(item.unitPrice / 100).toFixed(2)}
                    </span>
                  )}
                  {item.notes && (
                    <p className="text-sm text-gray-400 mt-1">{item.notes}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t bg-gray-50">
            <div className="flex justify-between font-semibold">
              <span>Total</span>
              <span>${(order.totalAmount / 100).toFixed(2)}</span>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="space-y-3">
          <Link
            href={`/v3n/${order.venue.slug}`}
            className="block w-full py-3 bg-primary-600 text-white font-semibold rounded-xl text-center hover:bg-primary-700 transition-colors"
          >
            Return to {order.venue.name}
          </Link>
          <Link
            href="/orders"
            className="block w-full py-3 border rounded-xl text-center hover:bg-gray-50 transition-colors"
          >
            View All Orders
          </Link>
        </div>
      </div>
    </div>
  );
}
