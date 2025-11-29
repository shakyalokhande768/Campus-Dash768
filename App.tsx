import React, { useState, useMemo, useEffect } from 'react';
import Header from './components/Header';
import ProductCard from './components/ProductCard';
import CartSidebar from './components/CartSidebar';
import CityBackground from './components/CityBackground';
import AuthModal from './components/AuthModal';
import OrdersModal from './components/OrdersModal';
import OrderSuccessModal from './components/OrderSuccessModal';
import { CATEGORIES } from './constants';
import { Product, CartItem, Category, User } from './types';
import { mockBackend } from './services/mockBackend';
import { ArrowRight, Clock, Search, Zap, Heart, Twitter, Instagram } from 'lucide-react';

function App() {
  const [products, setProducts] = useState<Product[]>([]);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<Category>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  
  // Auth State
  const [user, setUser] = useState<User | null>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  
  // Orders State
  const [isOrdersModalOpen, setIsOrdersModalOpen] = useState(false);
  const [isOrderSuccessModalOpen, setIsOrderSuccessModalOpen] = useState(false);

  // Initialize App - This hook runs once to set up the DB and fetch initial data
  useEffect(() => {
    const initApp = async () => {
      
      // 1. INITIALIZE DATABASE: This seeds the products into IndexedDB 
      //    and ensures the database structure is ready.
      try {
        await mockBackend.initializeDatabase(); 
      } catch (e) {
        console.error("Failed to initialize IndexedDB:", e);
        // Continue loading even if initialization fails, perhaps with empty data.
      }
      
      // 2. Check session
      const currentUser = mockBackend.getCurrentUser();
      if (currentUser) setUser(currentUser);

      // 3. Fetch dynamic products from DB
      try {
        const fetchedProducts = await mockBackend.getProducts();
        setProducts(fetchedProducts);
      } catch (error) {
        console.error("Failed to fetch products", error);
      } finally {
        setIsLoading(false);
      }
    };

    initApp();
  }, []);

  // Filter products
  const filteredProducts = useMemo(() => {
    let filtered = products;

    if (selectedCategory !== 'All') {
      filtered = filtered.filter(p => p.category === selectedCategory);
    }

    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(p => 
        p.name.toLowerCase().includes(query) || 
        p.category.toLowerCase().includes(query)
      );
    }

    return filtered;
  }, [products, selectedCategory, searchQuery]);

  // Cart logic
  const addToCart = (product: Product) => {
    setCartItems(prev => {
      const existing = prev.find(item => item.id === product.id);
      
      // Check stock limit before adding
      if (existing) {
        if (existing.quantity >= product.stock) return prev;
        return prev.map(item => 
          item.id === product.id 
            ? { ...item, quantity: item.quantity + 1 } 
            : item
        );
      }
      
      if (product.stock <= 0) return prev;
      
      return [...prev, { ...product, quantity: 1 }];
    });
    setIsCartOpen(true); // Open cart when adding item
  };

  const updateQuantity = (id: string, delta: number) => {
    setCartItems(prev => prev.map(item => {
      if (item.id === id) {
        const product = products.find(p => p.id === id);
        if (!product) return item;
        
        const newQty = item.quantity + delta;
        // Enforce stock limit based on current backend data
        if (newQty > product.stock) return item;
        return { ...item, quantity: Math.max(0, newQty) };
      }
      return item;
    }).filter(item => item.quantity > 0));
  };

  const clearCart = () => {
    setCartItems([]);
    setIsCartOpen(false);
  };

  // Called when an order is successfully placed in the backend
  const handleOrderComplete = async () => {
    clearCart();
    setIsOrderSuccessModalOpen(true); // Show the success modal
    // Refresh products to show updated stock levels
    const updatedProducts = await mockBackend.getProducts();
    setProducts(updatedProducts);
  };

  const handleLogout = async () => {
    await mockBackend.logout();
    setUser(null);
    clearCart();
  };

  const cartCount = cartItems.reduce((acc, item) => acc + item.quantity, 0);

  return (
    <div className="min-h-screen bg-transparent text-white selection:bg-primary selection:text-black font-sans relative">
      {/* Background Layer */}
      <CityBackground />

      <Header 
        cartCount={cartCount} 
        onCartClick={() => setIsCartOpen(true)}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        user={user}
        onAuthClick={() => setIsAuthModalOpen(true)}
        onLogout={handleLogout}
        onOrdersClick={() => setIsOrdersModalOpen(true)}
      />

      <main className="pb-20 relative z-10">
        {/* Hero Section - Optimized for Full Screen */}
        <section className="relative min-h-[90vh] flex items-center pt-36 md:pt-24 lg:pt-0">
          <div className="container mx-auto px-6 relative z-10 grid lg:grid-cols-12 gap-12 items-center">
            
            {/* Left Content */}
            <div className="lg:col-span-7 space-y-8 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-surface/40 border border-white/10 backdrop-blur-md shadow-lg animate-fade-in-up">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                </span>
                <span className="text-xs font-bold tracking-wide uppercase text-gray-200">
                  Accepting Orders &bull; Next Dispatch: 12:30 PM
                </span>
              </div>
              
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-extrabold tracking-tight leading-[1.05] drop-shadow-2xl">
                Don't Walk. <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-purple-300 drop-shadow-sm">We Run.</span>
              </h1>
              
              <p className="text-lg md:text-2xl text-gray-200 max-w-lg mx-auto lg:mx-0 leading-relaxed drop-shadow-md font-medium">
                Snacks, chargers, and essentials delivered to your hostel room in <span className="text-white font-bold bg-primary/20 px-1 rounded">5 minutes</span>.
              </p>

              {/* Hero Search Bar */}
              <div className="max-w-md mx-auto lg:mx-0 w-full relative group">
                 <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                   <Search className="h-5 w-5 text-gray-400 group-focus-within:text-primary transition-colors" />
                 </div>
                 <input 
                   type="text" 
                   placeholder="Search for chips, cables, or essentials..." 
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                   onKeyDown={(e) => {
                     if (e.key === 'Enter') {
                       document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' });
                     }
                   }}
                   className="block w-full bg-white/10 border border-white/10 rounded-full py-4 pl-12 pr-4 text-white placeholder-gray-400 focus:outline-none focus:border-primary/50 focus:bg-white/15 focus:ring-1 focus:ring-primary/50 transition-all shadow-lg backdrop-blur-sm"
                 />
              </div>
              
              <div className="flex flex-col sm:flex-row gap-4 justify-center lg:justify-start pt-2">
                <button 
                  onClick={() => document.getElementById('shop')?.scrollIntoView({ behavior: 'smooth' })}
                  className="px-10 py-5 rounded-full bg-primary text-black font-bold text-lg hover:bg-white hover:scale-105 shadow-neon hover:shadow-[0_0_40px_rgba(255,255,255,0.4)] transition-all duration-300 flex items-center justify-center gap-3"
                >
                  Order Now <ArrowRight className="w-5 h-5" />
                </button>
              </div>
            </div>

            {/* Right Illustration - Floating Card */}
            <div className="lg:col-span-5 relative hidden lg:block perspective-1000">
              <div className="relative rounded-[2rem] overflow-hidden border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)] bg-[#1A1A24]/80 backdrop-blur-md transform rotate-y-12 hover:rotate-y-0 transition-transform duration-700 ease-out">
                <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent z-10" />
                <img 
                  src="https://picsum.photos/seed/study/800/1000" 
                  alt="Cozy study setup" 
                  className="w-full h-[550px] object-cover opacity-90"
                />
                
                {/* Floating Stats */}
                <div className="absolute bottom-8 left-8 right-8 z-20 space-y-3">
                  <div className="p-4 rounded-xl glass bg-black/60 border border-white/10 flex items-center gap-4 backdrop-blur-xl">
                    <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                      <Clock className="w-6 h-6 text-primary" />
                    </div>
                    <div>
                      <p className="text-xs text-gray-300 uppercase font-bold tracking-wider">Avg. Delivery</p>
                      <p className="text-white font-bold text-xl">3 Minutes</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Categories - Sticky */}
        <div id="shop" className="sticky top-16 z-30 bg-[#0D0D12]/60 backdrop-blur-xl border-y border-white/5 py-6 mb-12 shadow-lg supports-[backdrop-filter]:bg-[#0D0D12]/40">
          <div className="container mx-auto px-4 overflow-x-auto no-scrollbar">
            <div className="flex gap-4 min-w-max md:justify-center">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all duration-300 border ${
                    selectedCategory === cat 
                      ? 'bg-primary border-primary text-black shadow-neon-sm scale-105' 
                      : 'bg-white/5 border-white/5 text-gray-300 hover:bg-white/10 hover:text-white hover:border-white/10'
                  }`}
                >
                  {cat}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Product Grid */}
        <section className="container mx-auto px-4 lg:px-8 mb-32 min-h-[60vh]">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20 space-y-4">
              <div className="w-12 h-12 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
              <p className="text-gray-400">Loading inventory...</p>
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6 lg:gap-8">
              {filteredProducts.map((product) => {
                const cartItem = cartItems.find(item => item.id === product.id);
                return (
                  <ProductCard 
                    key={product.id} 
                    product={product} 
                    onAdd={addToCart}
                    cartQuantity={cartItem?.quantity || 0}
                  />
                );
              })}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-20 text-center space-y-4">
              <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
                <Zap className="w-8 h-8 text-gray-500" />
              </div>
              <h3 className="text-xl font-bold text-white">No products found</h3>
              <p className="text-gray-400">Try searching for something else.</p>
            </div>
          )}
        </section>

        {/* Request Item Section */}
        <section className="container mx-auto px-4 mb-20">
          <div className="relative rounded-[2rem] overflow-hidden p-10 md:p-16 text-center bg-gradient-to-r from-[#1A1A24]/90 to-[#201A30]/90 border border-white/10 shadow-2xl group backdrop-blur-md">
             {/* Animated background sheen */}
             <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent translate-x-[-100%] group-hover:translate-x-[100%] transition-transform duration-1000 ease-in-out" />
             
             <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-5 pointer-events-none" />
             
             <div className="relative z-10 max-w-3xl mx-auto space-y-8">
               <h2 className="text-3xl md:text-5xl font-bold bg-clip-text text-transparent bg-gradient-to-br from-white to-gray-400">
                 Need something else?
               </h2>
               <p className="text-gray-300 text-lg md:text-xl leading-relaxed">
                 Can't find your favorite ramen? Request an item and we'll try to stock it by next week. We listen to our community.
               </p>
               <button className="px-8 py-4 rounded-full bg-white/5 border border-white/20 hover:bg-white/10 hover:border-primary/50 text-white font-bold transition-all hover:scale-105 hover:shadow-neon-sm backdrop-blur-sm">
                 Request Item
               </button>
             </div>
          </div>
        </section>

      </main>

      {/* Footer */}
      <footer className="bg-[#08080B]/95 backdrop-blur-xl border-t border-white/5 pt-20 pb-10 relative z-10">
        <div className="container mx-auto px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-1 space-y-4">
               <div className="flex items-center gap-2">
                <div className="p-1.5 bg-primary rounded-lg shadow-neon-sm">
                  <Zap className="w-5 h-5 text-black fill-black" />
                </div>
                <span className="text-2xl font-bold tracking-tight">Campus<span className="text-primary">Dash</span></span>
              </div>
              <p className="text-gray-500 text-sm leading-relaxed max-w-xs">
                Hyper-local delivery for students, by students. Supporting late-night studies and craving emergencies since 2024.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Company</h4>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2">About Us</a></li>
                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2">Apply as Courier</a></li>
                <li><a href="#" className="hover:text-primary transition-colors flex items-center gap-2">Careers</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Support</h4>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">Track Order</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Report Issue</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-lg">Legal</h4>
              <ul className="space-y-3 text-sm text-gray-500 font-medium">
                <li><a href="#" className="hover:text-primary transition-colors">Terms of Service</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-primary transition-colors">Cookie Policy</a></li>
              </ul>
            </div>
          </div>
          
          <div className="pt-8 border-t border-white/5 flex flex-col md:flex-row items-center justify-between gap-6">
            <p className="text-xs text-gray-600 font-medium">
              © 2024 CampusDash Inc. Built with <Heart className="w-3 h-3 inline text-primary mx-1 fill-current" /> for the campus.
            </p>
            <div className="flex gap-6">
              <a href="#" className="text-gray-600 hover:text-white transition-colors hover:scale-110 transform"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="text-gray-600 hover:text-white transition-colors hover:scale-110 transform"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>

      {/* Cart Sidebar */}
      <CartSidebar 
        isOpen={isCartOpen} 
        onClose={() => setIsCartOpen(false)} 
        cartItems={cartItems}
        onUpdateQuantity={updateQuantity}
        onClearCart={clearCart}
        user={user}
        onOrderComplete={handleOrderComplete}
      />

      {/* Auth Modal */}
      <AuthModal 
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={(user) => setUser(user)}
      />

      {/* Orders Modal */}
      <OrdersModal
        isOpen={isOrdersModalOpen}
        onClose={() => setIsOrdersModalOpen(false)}
        user={user}
      />

      {/* Success Modal */}
      <OrderSuccessModal
        isOpen={isOrderSuccessModalOpen}
        onClose={() => setIsOrderSuccessModalOpen(false)}
      />
    </div>
  );
}

export default App;