// services/mockBackend.ts (Now powered by Dexie IndexedDB)

import { User, Product, CartItem, Order } from '../types.ts'; // Ensure .ts extension is here
import { db, seedProducts } from '../localDB.ts'; // Ensure .ts extension is here

// Helper to simulate network delay
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));
const SESSION_KEY = 'campus_dash_session'; // Using localStorage for simple session ID

export const mockBackend = {
  // --- DATABASE INITIALIZATION (Seeds the Dexie DB on first run) ---
  async initializeDatabase() {
    await seedProducts();
  },

  // --- AUTHENTICATION ---

  async login(email: string, password: string): Promise<User> {
    await delay(800);
    
    // Find user by email using Dexie's index
    const user = await db.users.where('email').equalsIgnoreCase(email).first();

    if (!user || user.password !== password) {
      throw new Error('Invalid email or password');
    }

    const { password: _, ...safeUser } = user;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return safeUser as User; // Cast to User (without password)
  },

  async signup(name: string, email: string, password: string): Promise<User> {
    await delay(1000);

    const existingUser = await db.users.where('email').equalsIgnoreCase(email).first();

    if (existingUser) {
      throw new Error('User already exists with this email');
    }

    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9), 
      name,
      email,
      password, // Stored locally (for mock login check)
      hostel: '',
      room: '',
    };

    // Save the new user to the IndexedDB 'users' table
    await db.users.add(newUser);
    
    const { password: _, ...safeUser } = newUser;
    localStorage.setItem(SESSION_KEY, JSON.stringify(safeUser));
    return safeUser as User; // Cast to User (without password)
  },

  async logout(): Promise<void> {
    await delay(200);
    localStorage.removeItem(SESSION_KEY);
  },

  getCurrentUser(): User | null {
    const sessionStr = localStorage.getItem(SESSION_KEY);
    // Note: We cast to User, assuming the stored session lacks the password
    return sessionStr ? JSON.parse(sessionStr) as User : null; 
  },

  // --- PRODUCT & INVENTORY MANAGEMENT ---

  async getProducts(): Promise<Product[]> {
    await this.initializeDatabase(); // Ensures data is seeded
    await delay(300);
    return db.products.toArray(); // Get all products from IndexedDB
  },

  // --- ORDER PROCESSING & PAYMENT ---

  async placeOrder(
    userId: string, 
    items: CartItem[], 
    deliveryDetails: { hostel: string; room: string },
    totalAmount: number
  ): Promise<Order> {
    await delay(1500);

    // IndexedDB Transaction for atomic operations
    return db.transaction('rw', db.products, db.orders, async () => {
        // 1. Get the current product list within the transaction context
        const products = await db.products.toArray();
        
        // 2. Validate Stock
        for (const item of items) {
          const product = products.find(p => p.id === item.id);
          if (!product || product.stock < item.quantity) {
            throw new Error(`Insufficient stock for ${item.name}. Only ${product?.stock || 0} left.`);
          }
        }

        // 3. Deduct Stock and prepare update array
        const updatedProducts = products.map(product => {
            const item = items.find(i => i.id === product.id);
            if (item) {
                return { ...product, stock: product.stock - item.quantity };
            }
            return product;
        });

        // 4. Update Stock
        await db.products.bulkPut(updatedProducts);

        // 5. Create Order Record
        const newOrder: Order = {
          id: 'ORD-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
          userId,
          items,
          totalAmount,
          status: 'confirmed',
          createdAt: new Date().toISOString(),
          deliveryDetails
        };

        // 6. Save Order
        await db.orders.add(newOrder);

        // 7. Return the new order to satisfy the Promise<Order> return type
        return newOrder; 
    });
  },

  async getUserOrders(userId: string): Promise<Order[]> {
    await delay(500);
    // Filter orders efficiently using the defined index 'userId'
    return db.orders.where('userId').equalsIgnoreCase(userId).reverse().sortBy('createdAt');
  },

  // --- ANALYTICS (For Admin) ---
  async getOrderStats() {
    const orders = await db.orders.toArray();
    return {
      totalOrders: orders.length,
      totalRevenue: orders.reduce((sum, order) => sum + order.totalAmount, 0),
      activeUsers: new Set(orders.map(o => o.userId)).size
    };
  }
};