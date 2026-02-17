'use client';
export const dynamic = 'force-dynamic';

import { useEffect, useState } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import { api } from '@/lib/api';
import { CheckoutFlow } from '@/components/payments/CheckoutFlow';
import { useCartStore } from '@/lib/stores/cart';

interface OrderData {
  id: string;
  orderNumber: string;
  totalAmount: number;
  venue: {
    id: string;
    name: string;
    slug: string;
  };
  items: Array<{
    id: string;
    menuItem: {
      name: string;
    };
    quantity: number;
    unitPrice: number;
  }>;
}

export default function CheckoutPage() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get('orderId');

  const [order, setOrder] = useState<OrderData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { clear: clearCart } = useCartStore();

  useEffect(() => {
    if (!orderId) {
      setError('No order specified');
      setLoading(false);
      return;
    }

    const loadOrder = async () => {
      try {
        const response = await api.get<OrderData>(`/orders/${orderId}`);
        setOrder(response);
      } catch (err) {
        setError('Failed to load order');
      } finally {
        setLoading(false);
      }
    };

    loadOrder();
  }, [orderId]);

  const handleSuccess = (paymentId: string) => {
    clearCart();
    router.push(`/checkout/success?orderId=${orderId}`);
  };

  const handleCancel = () => {
    if (order) {
      router.push(`/v3n/${order.venue.slug}`);
    } else {
      router.back();
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-spin w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-6">
        <div className="text-center max-w-md">
          <div className="text-6xl mb-4">⚠️</div>
          <h1 className="text-xl font-bold text-gray-900 mb-2">
            {error || 'Order not found'}
          </h1>
          <p className="text-gray-500 mb-6">
            We couldn't load your order. Please try again.
          </p>
          <Link
            href="/"
            className="px-6 py-3 bg-blue-600 text-white rounded-lg inline-block"
          >
            Go Home
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-2xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-900">Checkout</h1>
            <p className="text-gray-500 text-sm">{order.venue.name}</p>
          </div>
          <p className="font-mono text-gray-500">{order.orderNumber}</p>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-2xl mx-auto p-6">
        <CheckoutFlow
          orderId={order.id}
          venueId={order.venue.id}
          amount={order.totalAmount}
          items={order.items.map((item) => ({
            id: item.id,
            name: item.menuItem.name,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
          }))}
          onSuccess={handleSuccess}
          onCancel={handleCancel}
        />
      </main>
    </div>
  );
}
