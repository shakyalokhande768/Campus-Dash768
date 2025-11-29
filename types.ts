export interface Product {
  id: string;
  name: string;
  price: number;
  category: string;
  image: string;
  tag?: 'Best Seller' | 'Essential' | 'Exam Fuel' | 'New' | 'Summer';
  description?: string;
  stock: number;
}

export interface CartItem extends Product {
  quantity: number;
}

export type Category = 'All' | 'Munchies' | 'Tech' | 'Stationery' | 'Hygiene';

export interface User {
  id: string;
  name: string;
  email: string;
  password: string;
  hostel?: string;
  room?: string;
}

export interface Order {
  id: string;
  userId: string;
  items: CartItem[];
  totalAmount: number;
  status: 'confirmed' | 'cancelled' | 'pending';
  createdAt: string;
  deliveryDetails: {
    hostel: string;
    room: string;
  };
}