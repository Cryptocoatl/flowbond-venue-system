import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export interface CartItem {
  id: string;
  menuItemId: string;
  name: string;
  price: number;
  quantity: number;
  notes?: string;
  imageUrl?: string;
  itemType: string;
  source: 'PURCHASED' | 'REDEEMED';
  passId?: string;
}

interface CartStore {
  items: CartItem[];
  venueId: string | null;
  venueName: string | null;
  venueSlug: string | null;

  // Actions
  setVenue: (id: string, name: string, slug: string) => void;
  addItem: (item: Omit<CartItem, 'id' | 'source'>) => void;
  removeItem: (id: string) => void;
  updateQuantity: (id: string, quantity: number) => void;
  redeemPass: (passId: string, menuItemId: string, itemName: string, imageUrl?: string, itemType?: string) => void;
  clear: () => void;

  // Computed
  getTotal: () => number;
  getItemCount: () => number;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set, get) => ({
      items: [],
      venueId: null,
      venueName: null,
      venueSlug: null,

      setVenue: (id, name, slug) => {
        const state = get();
        // If switching venues, clear cart
        if (state.venueId && state.venueId !== id) {
          set({
            items: [],
            venueId: id,
            venueName: name,
            venueSlug: slug,
          });
        } else {
          set({ venueId: id, venueName: name, venueSlug: slug });
        }
      },

      addItem: (item) => {
        set((state) => {
          // Check if item already exists
          const existingIndex = state.items.findIndex(
            (i) => i.menuItemId === item.menuItemId && i.source === 'PURCHASED'
          );

          if (existingIndex !== -1) {
            // Update quantity
            const newItems = [...state.items];
            newItems[existingIndex] = {
              ...newItems[existingIndex],
              quantity: newItems[existingIndex].quantity + item.quantity,
            };
            return { items: newItems };
          }

          // Add new item
          return {
            items: [
              ...state.items,
              {
                ...item,
                id: crypto.randomUUID(),
                source: 'PURCHASED',
              },
            ],
          };
        });
      },

      removeItem: (id) => {
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
        }));
      },

      updateQuantity: (id, quantity) => {
        if (quantity <= 0) {
          get().removeItem(id);
          return;
        }

        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, quantity } : item
          ),
        }));
      },

      redeemPass: (passId, menuItemId, itemName, imageUrl, itemType = 'OTHER') => {
        set((state) => {
          // Check if pass already redeemed in cart
          const alreadyRedeemed = state.items.some(
            (i) => i.passId === passId && i.source === 'REDEEMED'
          );
          if (alreadyRedeemed) return state;

          return {
            items: [
              ...state.items,
              {
                id: crypto.randomUUID(),
                menuItemId,
                name: itemName,
                price: 0,
                quantity: 1,
                imageUrl,
                itemType,
                source: 'REDEEMED',
                passId,
              },
            ],
          };
        });
      },

      clear: () => {
        set({ items: [], venueId: null, venueName: null, venueSlug: null });
      },

      getTotal: () => {
        return get().items.reduce(
          (total, item) => total + item.price * item.quantity,
          0
        );
      },

      getItemCount: () => {
        return get().items.reduce((count, item) => count + item.quantity, 0);
      },
    }),
    {
      name: 'flowbond-cart',
    }
  )
);
