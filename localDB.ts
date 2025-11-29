// localDB.ts
import Dexie from 'dexie';
import { Product, User, Order } from './types';
import { PRODUCTS } from './constants';

// 1. Extend Dexie to create your database structure
export class CampusDashDB extends Dexie {
    // Define table properties (collections)
    // The string defines the primary key ('id') and indexed fields ('email', 'userId').
    users!: Dexie.Table<User, string>; 
    products!: Dexie.Table<Product, string>;
    orders!: Dexie.Table<Order, string>;

    constructor() {
        super("CampusDashDB"); // Database name

        // Define your schema structure here
        this.version(1).stores({
            products: 'id, category, name', 
            users: 'id, email', // Index by email for fast lookups
            orders: 'id, userId, status, createdAt' // Index by userId for fast order history
        });

        this.users = this.table('users');
        this.products = this.table('products');
        this.orders = this.table('orders');
    }
}

// 2. Instantiate the database
export const db = new CampusDashDB();

// 3. Database Seeding (Runs once to load products)
export async function seedProducts() {
    // Check if products already exist to prevent re-seeding
    const count = await db.products.count();
    if (count === 0) {
        console.log("Seeding initial product data into IndexedDB...");
        await db.products.bulkAdd(PRODUCTS as Product[]); // PRODUCTS imported from constants
    }
}