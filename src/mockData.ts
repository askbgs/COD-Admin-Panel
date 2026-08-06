import { Order } from './supabase';

export const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 1001,
    customer_name: "Youssef El Alami",
    email: "youssef.alami@gmail.com",
    phone: "+212 661-234567",
    city: "Casablanca",
    address: "24 Rue de la Liberté, Gauthier",
    product_variant: "Ultra-Slim Mechanical Keyboard",
    quantity: 1,
    status: "Pending",
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: 1002,
    customer_name: "Amine Amrani",
    email: "amine.amrani@hotmail.com",
    phone: "+212 662-987654",
    city: "Rabat",
    address: "12 Avenue de France, Agdal",
    product_variant: "Wireless Ergonomic Mouse",
    quantity: 2,
    status: "Confirmed",
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // 12 hours ago
  },
  {
    id: 1003,
    customer_name: "Fatima Zahra",
    email: "fz.bennani@yahoo.com",
    phone: "+212 663-112233",
    city: "Marrakech",
    address: "Résidence El Bahja, Apt 5, Guéliz",
    product_variant: "Noise Cancelling Headphones",
    quantity: 1,
    status: "Shipped",
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), // 1 day ago
  },
  {
    id: 1004,
    customer_name: "Sarah Mansouri",
    email: "sarah.mans@gmail.com",
    phone: "+212 664-445566",
    city: "Tangier",
    address: "Avenue Mohamed V, Immeuble B, Centre Ville",
    product_variant: "Minimalist Desk Pad",
    quantity: 3,
    status: "Delivered",
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 1005,
    customer_name: "Anas Chraibi",
    email: "anas.chraibi@outlook.com",
    phone: "+212 665-778899",
    city: "Fes",
    address: "Route d'Imouzzer, Lotissement Al Amal",
    product_variant: "Leather Travel Wallet",
    quantity: 1,
    status: "Cancelled",
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago
  },
  {
    id: 1006,
    customer_name: "Karim Benjelloun",
    email: "karim.ben@gmail.com",
    phone: "+212 668-334455",
    city: "Casablanca",
    address: "78 Boulevard Zerktouni",
    product_variant: "Portable Power Bank 20k",
    quantity: 2,
    status: "Delivered",
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), // 4 days ago
  },
  {
    id: 1007,
    customer_name: "Laila Meziane",
    email: "laila.mez@gmail.com",
    phone: "+212 669-556677",
    city: "Agadir",
    address: "Secteur Touristique, Immeuble Taghazout",
    product_variant: "Wireless Ergonomic Mouse",
    quantity: 1,
    status: "Confirmed",
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), // 5 days ago
  },
  {
    id: 1008,
    customer_name: "Omar Kabbaj",
    email: "omar.kabbaj@gmail.com",
    phone: "+212 670-112234",
    city: "Rabat",
    address: "Rue Al Marj, Hay Riad",
    product_variant: "Noise Cancelling Headphones",
    quantity: 1,
    status: "Delivered",
    created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(), // 6 days ago
  },
  {
    id: 1009,
    customer_name: "Layla Al-Sabah",
    email: "layla.sabah@gmail.com",
    phone: "+966 50 123 4567",
    city: "Riyadh",
    address: "Al Olaya District, King Fahd Road",
    product_variant: "Ultra-Slim Mechanical Keyboard",
    quantity: 1,
    status: "Pending",
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), // 7 days ago
  },
  {
    id: 1010,
    customer_name: "Tariq Saeed",
    email: "tariq.saeed@gmail.com",
    phone: "+971 50 987 6543",
    city: "Dubai",
    address: "Marina Heights, Floor 24, Dubai Marina",
    product_variant: "Minimalist Desk Pad",
    quantity: 2,
    status: "Confirmed",
    created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(), // 8 days ago
  }
];
