'use client';

import { useState, useEffect } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  QrCode,
  Menu,
  X,
  Home,
  Ticket,
  Gift,
  User,
  CreditCard,
  LogOut,
  ChevronRight,
  Trophy,
  Sparkles,
  Clock,
  CheckCircle2,
  MapPin,
  Camera,
  ShoppingCart,
  Plus,
  Minus,
  UtensilsCrossed,
} from 'lucide-react';
import { useTranslation } from '@/lib/i18n';
import { useAuthStore } from '@/lib/auth';
import { useCartStore } from '@/lib/stores/cart';
import { cn } from '@/lib/utils';
import api from '@/lib/api';
import CartDrawer from '@/components/cart/CartDrawer';

interface Venue {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  address: string | null;
  city: string | null;
}

interface Quest {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string | null;
  completionCount: number;
  maxCompletions: number | null;
  tasks: { id: string }[];
  drinkReward: {
    name: string;
    description: string | null;
  } | null;
}

interface DrinkPass {
  id: string;
  code: string;
  status: string;
  expiresAt: string;
  reward: {
    name: string;
    description: string | null;
  };
}

interface MenuItem {
  id: string;
  name: string;
  description: string | null;
  price: number;
  type: string;
  imageUrl: string | null;
  isAvailable: boolean;
}

interface MenuCategory {
  id: string;
  name: string;
  description: string | null;
  items: MenuItem[];
}

type Tab = 'quests' | 'scan' | 'passes' | 'menu';

export default function VenuePage() {
  const params = useParams();
  const router = useRouter();
  const { t } = useTranslation();
  const { user, isAuthenticated, logout } = useAuthStore();
  const { items: cartItems, setVenue: setCartVenue, addItem: addToCart, getItemCount } = useCartStore();
  const slug = params.slug as string;

  const [venue, setVenue] = useState<Venue | null>(null);
  const [quests, setQuests] = useState<Quest[]>([]);
  const [passes, setPasses] = useState<DrinkPass[]>([]);
  const [menuCategories, setMenuCategories] = useState<MenuCategory[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>('quests');
  const [menuOpen, setMenuOpen] = useState(false);
  const [cartOpen, setCartOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [scanning, setScanning] = useState(false);
  const [manualCode, setManualCode] = useState('');

  useEffect(() => {
    if (!isAuthenticated) {
      router.push('/v3n');
      return;
    }
    fetchVenueData();
  }, [slug, isAuthenticated]);

  const fetchVenueData = async () => {
    setLoading(true);
    try {
      const venueData = await api.getVenueBySlug(slug);
      setVenue(venueData);
      setCartVenue(venueData.id, venueData.name, venueData.slug);

      const [questsData, passesData, menuData] = await Promise.all([
        api.getVenueQuests(venueData.id),
        api.getMyPasses(),
        api.getPublicMenu(venueData.id).catch(() => []),
      ]);

      setQuests(questsData);
      setPasses(passesData.filter((p: DrinkPass) => p.status === 'ACTIVE'));
      setMenuCategories(menuData);
    } catch (error) {
      console.error('Failed to fetch venue:', error);
      router.push('/v3n');
    } finally {
      setLoading(false);
    }
  };

  const handleQuestSelect = (quest: Quest) => {
    router.push(`/quest/${quest.id}?venue=${venue?.id}`);
  };

  const handleScanCode = (code: string) => {
    if (code) {
      router.push(`/quest/scan?code=${code}&venue=${venue?.id}`);
    }
  };

  const handleLogout = async () => {
    await logout();
    router.push('/v3n');
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-10 h-10 border-3 border-primary-200 border-t-primary-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-30">
        <div className="flex items-center justify-between px-4 h-14">
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMenuOpen(true)}
              className="p-2 -ml-2 rounded-lg hover:bg-gray-100"
            >
              <Menu className="w-5 h-5 text-gray-700" />
            </button>
            <div>
              <h1 className="font-semibold text-gray-900">{venue?.name}</h1>
              {venue?.city && (
                <p className="text-xs text-gray-500">{venue.city}</p>
              )}
            </div>
          </div>
          <div className="flex items-center gap-2">
            {passes.length > 0 && (
              <button
                onClick={() => setActiveTab('passes')}
                className="relative p-2 rounded-lg hover:bg-gray-100"
              >
                <Ticket className="w-5 h-5 text-gray-700" />
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-accent-500 text-white text-xs rounded-full flex items-center justify-center">
                  {passes.length}
                </span>
              </button>
            )}
            <button
              onClick={() => setCartOpen(true)}
              className="relative p-2 rounded-lg hover:bg-gray-100"
            >
              <ShoppingCart className="w-5 h-5 text-gray-700" />
              {getItemCount() > 0 && (
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-primary-600 text-white text-xs rounded-full flex items-center justify-center">
                  {getItemCount()}
                </span>
              )}
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-1 pb-20">
        <AnimatePresence mode="wait">
          {activeTab === 'quests' && (
            <motion.div
              key="quests"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Active Quests</h2>
                <p className="text-sm text-gray-500">Complete quests to earn drink rewards</p>
              </div>

              <div className="space-y-4">
                {quests.map((quest) => (
                  <button
                    key={quest.id}
                    onClick={() => handleQuestSelect(quest)}
                    className="w-full bg-white rounded-2xl border shadow-sm overflow-hidden text-left hover:shadow-md transition-shadow"
                  >
                    {/* Quest Header */}
                    <div className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-semibold text-gray-900">{quest.name}</h3>
                          {quest.description && (
                            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{quest.description}</p>
                          )}
                        </div>
                        <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0 ml-2" />
                      </div>

                      {/* Quest Stats */}
                      <div className="flex items-center gap-4 text-sm">
                        <div className="flex items-center gap-1 text-gray-500">
                          <CheckCircle2 className="w-4 h-4" />
                          <span>{quest.tasks.length} tasks</span>
                        </div>
                        {quest.maxCompletions && (
                          <div className="flex items-center gap-1 text-gray-500">
                            <Trophy className="w-4 h-4" />
                            <span>{quest.maxCompletions - quest.completionCount} left</span>
                          </div>
                        )}
                      </div>
                    </div>

                    {/* Reward Preview */}
                    {quest.drinkReward && (
                      <div className="px-4 py-3 bg-gradient-to-r from-primary-50 to-accent-50 border-t flex items-center gap-3">
                        <Gift className="w-5 h-5 text-primary-600" />
                        <div>
                          <p className="text-sm font-medium text-primary-900">Reward: {quest.drinkReward.name}</p>
                        </div>
                      </div>
                    )}
                  </button>
                ))}

                {quests.length === 0 && (
                  <div className="text-center py-12">
                    <Sparkles className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500">No active quests at this venue</p>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'scan' && (
            <motion.div
              key="scan"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="bg-white rounded-2xl border p-6 text-center">
                <div className="w-16 h-16 bg-primary-100 rounded-2xl flex items-center justify-center mx-auto mb-4">
                  <QrCode className="w-8 h-8 text-primary-600" />
                </div>
                <h2 className="text-xl font-semibold text-gray-900 mb-2">Scan QR Code</h2>
                <p className="text-gray-500 mb-6">Find QR codes around the venue to complete tasks</p>

                <button
                  onClick={() => setScanning(true)}
                  className="w-full py-3 bg-primary-600 text-white font-semibold rounded-xl hover:bg-primary-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Camera className="w-5 h-5" />
                  Open Camera
                </button>

                <div className="relative my-6">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t" />
                  </div>
                  <div className="relative flex justify-center">
                    <span className="px-3 bg-white text-gray-500 text-sm">or enter code</span>
                  </div>
                </div>

                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    handleScanCode(manualCode);
                  }}
                  className="flex gap-2"
                >
                  <input
                    type="text"
                    value={manualCode}
                    onChange={(e) => setManualCode(e.target.value.toUpperCase())}
                    placeholder="Enter code"
                    className="flex-1 px-4 py-3 border rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-transparent outline-none uppercase tracking-widest"
                    maxLength={12}
                  />
                  <button
                    type="submit"
                    disabled={!manualCode.trim()}
                    className="px-6 py-3 bg-gray-900 text-white font-semibold rounded-xl hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                  >
                    Go
                  </button>
                </form>
              </div>
            </motion.div>
          )}

          {activeTab === 'passes' && (
            <motion.div
              key="passes"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">My Drink Passes</h2>
                <p className="text-sm text-gray-500">Show these at the bar to redeem</p>
              </div>

              <div className="space-y-4">
                {passes.map((pass) => (
                  <div
                    key={pass.id}
                    onClick={() => router.push(`/passes/${pass.id}`)}
                    className="bg-gradient-to-br from-primary-600 to-accent-600 rounded-2xl p-5 text-white cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <div className="flex items-start justify-between mb-4">
                      <div>
                        <p className="text-primary-100 text-sm">Drink Pass</p>
                        <h3 className="text-xl font-bold">{pass.reward.name}</h3>
                      </div>
                      <Ticket className="w-8 h-8 text-white/50" />
                    </div>

                    <div className="bg-white/20 backdrop-blur rounded-lg p-3 mb-4">
                      <p className="text-center font-mono text-2xl tracking-widest">{pass.code}</p>
                    </div>

                    <div className="flex items-center justify-between text-sm">
                      <div className="flex items-center gap-1 text-primary-100">
                        <Clock className="w-4 h-4" />
                        <span>Expires: {new Date(pass.expiresAt).toLocaleDateString()}</span>
                      </div>
                      <span className="px-2 py-1 bg-white/20 rounded text-xs font-medium">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                ))}

                {passes.length === 0 && (
                  <div className="text-center py-12">
                    <Ticket className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                    <p className="text-gray-500 mb-4">No active drink passes</p>
                    <button
                      onClick={() => setActiveTab('quests')}
                      className="text-primary-600 font-medium"
                    >
                      Complete a quest to earn one!
                    </button>
                  </div>
                )}
              </div>
            </motion.div>
          )}

          {activeTab === 'menu' && (
            <motion.div
              key="menu"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="p-4"
            >
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-1">Menu</h2>
                <p className="text-sm text-gray-500">Order drinks, food, and more</p>
              </div>

              {menuCategories.length > 0 ? (
                <div className="space-y-6">
                  {menuCategories.map((category) => (
                    <div key={category.id}>
                      <h3 className="font-semibold text-gray-800 mb-3">{category.name}</h3>
                      <div className="space-y-3">
                        {category.items.map((item) => (
                          <div
                            key={item.id}
                            className="bg-white rounded-xl border p-4 flex gap-3"
                          >
                            {item.imageUrl ? (
                              <img
                                src={item.imageUrl}
                                alt={item.name}
                                className="w-20 h-20 rounded-lg object-cover flex-shrink-0"
                              />
                            ) : (
                              <div className="w-20 h-20 bg-gray-100 rounded-lg flex items-center justify-center flex-shrink-0">
                                <UtensilsCrossed className="w-8 h-8 text-gray-400" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <h4 className="font-medium text-gray-900">{item.name}</h4>
                              {item.description && (
                                <p className="text-sm text-gray-500 line-clamp-2">{item.description}</p>
                              )}
                              <div className="flex items-center justify-between mt-2">
                                <span className="font-semibold text-gray-900">
                                  ${(item.price / 100).toFixed(2)}
                                </span>
                                <button
                                  onClick={() => addToCart({
                                    menuItemId: item.id,
                                    name: item.name,
                                    price: item.price,
                                    quantity: 1,
                                    imageUrl: item.imageUrl || undefined,
                                    itemType: item.type,
                                  })}
                                  className="px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition-colors flex items-center gap-1"
                                >
                                  <Plus className="w-4 h-4" />
                                  Add
                                </button>
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-12">
                  <UtensilsCrossed className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                  <p className="text-gray-500">No menu items available yet</p>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Bottom Navigation */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white border-t z-20">
        <div className="flex items-center justify-around h-16 max-w-md mx-auto">
          {[
            { id: 'quests' as Tab, icon: Trophy, label: 'Quests' },
            { id: 'menu' as Tab, icon: UtensilsCrossed, label: 'Menu' },
            { id: 'scan' as Tab, icon: QrCode, label: 'Scan' },
            { id: 'passes' as Tab, icon: Ticket, label: 'Passes' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'flex flex-col items-center justify-center w-20 h-full transition-colors',
                activeTab === tab.id ? 'text-primary-600' : 'text-gray-400'
              )}
            >
              <tab.icon className="w-6 h-6 mb-1" />
              <span className="text-xs font-medium">{tab.label}</span>
            </button>
          ))}
        </div>
      </nav>

      {/* Side Menu */}
      <AnimatePresence>
        {menuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 bg-black/50 z-40"
              onClick={() => setMenuOpen(false)}
            />
            <motion.div
              initial={{ x: '-100%' }}
              animate={{ x: 0 }}
              exit={{ x: '-100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed left-0 top-0 bottom-0 w-72 bg-white z-50 shadow-xl"
            >
              <div className="p-4 border-b flex items-center justify-between">
                <div>
                  <h2 className="font-semibold text-gray-900">{venue?.name}</h2>
                  <p className="text-sm text-gray-500">Menu</p>
                </div>
                <button
                  onClick={() => setMenuOpen(false)}
                  className="p-2 rounded-lg hover:bg-gray-100"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <nav className="p-2">
                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push('/v3n');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
                >
                  <Home className="w-5 h-5 text-gray-500" />
                  <span>Change Venue</span>
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    setActiveTab('passes');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
                >
                  <Ticket className="w-5 h-5 text-gray-500" />
                  <span>My Passes</span>
                  {passes.length > 0 && (
                    <span className="ml-auto bg-accent-500 text-white text-xs px-2 py-0.5 rounded-full">
                      {passes.length}
                    </span>
                  )}
                </button>

                <button
                  onClick={() => {
                    setMenuOpen(false);
                    router.push('/profile');
                  }}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left"
                >
                  <User className="w-5 h-5 text-gray-500" />
                  <span>Profile</span>
                </button>

                <div className="my-2 border-t" />

                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 px-4 py-3 rounded-lg hover:bg-gray-100 text-left text-red-600"
                >
                  <LogOut className="w-5 h-5" />
                  <span>Sign Out</span>
                </button>
              </nav>

              <div className="absolute bottom-0 left-0 right-0 p-4 border-t bg-gray-50">
                <p className="text-xs text-gray-400 text-center">
                  Powered by FlowBond
                  <br />
                  flowbond.tech
                </p>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Cart Drawer */}
      <CartDrawer isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
}
