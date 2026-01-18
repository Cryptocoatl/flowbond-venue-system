'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  ShoppingCart,
  Plus,
  Minus,
  Trash2,
  Gift,
  Loader2,
} from 'lucide-react';
import { useCartStore } from '@/lib/stores/cart';
import api from '@/lib/api';

interface CartDrawerProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function CartDrawer({ isOpen, onClose }: CartDrawerProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const {
    items,
    venueName,
    venueId,
    updateQuantity,
    removeItem,
    clear,
    getTotal,
    getItemCount,
  } = useCartStore();

  const handleCheckout = async () => {
    if (!venueId || items.length === 0) return;

    setLoading(true);
    try {
      // Create order
      const order = await api.createOrder(venueId);

      // Add items to order
      for (const item of items) {
        if (item.source === 'PURCHASED') {
          await api.addOrderItem(order.id, {
            menuItemId: item.menuItemId,
            quantity: item.quantity,
            notes: item.notes,
          });
        } else if (item.source === 'REDEEMED' && item.passId) {
          // Redeem passes are handled during checkout
        }
      }

      // Checkout
      await api.checkoutOrder(order.id);

      // Clear cart and redirect
      clear();
      onClose();
      router.push(`/orders/${order.id}`);
    } catch (error) {
      console.error('Checkout failed:', error);
      alert('Failed to complete order. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const total = getTotal();
  const itemCount = getItemCount();

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/50 z-40"
        onClick={onClose}
      />

      {/* Drawer */}
      <div className="fixed right-0 top-0 h-full w-full max-w-md bg-white shadow-xl z-50 flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <div className="flex items-center gap-2">
            <ShoppingCart className="w-5 h-5 text-gray-600" />
            <h2 className="text-lg font-semibold">Your Order</h2>
            {itemCount > 0 && (
              <span className="px-2 py-0.5 bg-primary-100 text-primary-700 text-sm rounded-full">
                {itemCount}
              </span>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {venueName && (
          <div className="px-4 py-2 bg-gray-50 border-b">
            <p className="text-sm text-gray-600">
              Ordering from <span className="font-medium">{venueName}</span>
            </p>
          </div>
        )}

        {/* Items */}
        <div className="flex-1 overflow-y-auto p-4">
          {items.length === 0 ? (
            <div className="text-center py-12">
              <ShoppingCart className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <p className="text-gray-500">Your cart is empty</p>
              <p className="text-sm text-gray-400 mt-1">
                Add items from the menu to get started
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => (
                <div
                  key={item.id}
                  className="flex gap-3 p-3 bg-gray-50 rounded-xl"
                >
                  {/* Image */}
                  {item.imageUrl ? (
                    <img
                      src={item.imageUrl}
                      alt={item.name}
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 bg-gray-200 rounded-lg flex items-center justify-center">
                      {item.source === 'REDEEMED' ? (
                        <Gift className="w-6 h-6 text-green-500" />
                      ) : (
                        <ShoppingCart className="w-6 h-6 text-gray-400" />
                      )}
                    </div>
                  )}

                  {/* Details */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <h3 className="font-medium text-gray-900 truncate">
                          {item.name}
                        </h3>
                        {item.source === 'REDEEMED' ? (
                          <span className="text-xs text-green-600 font-medium">
                            Redeemed from pass
                          </span>
                        ) : (
                          <span className="text-sm text-gray-600">
                            ${(item.price / 100).toFixed(2)}
                          </span>
                        )}
                      </div>
                      <button
                        onClick={() => removeItem(item.id)}
                        className="p-1 text-gray-400 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Quantity controls */}
                    {item.source === 'PURCHASED' && (
                      <div className="flex items-center gap-2 mt-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-medium">
                          {item.quantity}
                        </span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 flex items-center justify-center bg-white border rounded-lg hover:bg-gray-50 transition-colors"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <span className="ml-auto font-medium">
                          ${((item.price * item.quantity) / 100).toFixed(2)}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        {items.length > 0 && (
          <div className="border-t p-4 space-y-4">
            {/* Summary */}
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Subtotal</span>
                <span>${(total / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-semibold text-lg">
                <span>Total</span>
                <span>${(total / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Checkout button */}
            <button
              onClick={handleCheckout}
              disabled={loading || items.length === 0}
              className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  Place Order - ${(total / 100).toFixed(2)}
                </>
              )}
            </button>

            <button
              onClick={clear}
              className="w-full py-2 text-sm text-gray-500 hover:text-gray-700 transition-colors"
            >
              Clear cart
            </button>
          </div>
        )}
      </div>
    </>
  );
}
