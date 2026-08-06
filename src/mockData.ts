import { Order } from './supabase';

export const INITIAL_MOCK_ORDERS: Order[] = [
  {
    id: 1001,
    customer_name: "Pathum Fernando",
    email: "pathum.fernando@gmail.com",
    phone: "+94 77 123 4567",
    city: "Colombo",
    address: "45 Galle Road, Colombo 03, Apartment 3",
    product_variant: "Ultra-Slim Mechanical Keyboard",
    quantity: 1,
    status: "Pending",
    created_at: new Date(Date.now() - 4 * 3600 * 1000).toISOString(), // 4 hours ago
  },
  {
    id: 1002,
    customer_name: "Sanduni Perera",
    email: "sanduni.perera@hotmail.com",
    phone: "+94 81 234 5678",
    city: "Kandy",
    address: "12 Peradeniya Road",
    product_variant: "Wireless Ergonomic Mouse",
    quantity: 2,
    status: "Confirmed",
    created_at: new Date(Date.now() - 12 * 3600 * 1000).toISOString(), // 12 hours ago
  },
  {
    id: 1003,
    customer_name: "Kasun Jayawardena",
    email: "kasun.jay@yahoo.com",
    phone: "+94 91 345 6789",
    city: "Galle",
    address: "88 Fort Street, Galle Fort",
    product_variant: "Noise Cancelling Headphones",
    quantity: 1,
    status: "Shipped",
    created_at: new Date(Date.now() - 1 * 24 * 3600 * 1000).toISOString(), // 1 day ago
  },
  {
    id: 1004,
    customer_name: "Dilhara Silva",
    email: "dilhara.silva@gmail.com",
    phone: "+94 31 456 7890",
    city: "Negombo",
    address: "21 Porutota Road",
    product_variant: "Minimalist Desk Pad",
    quantity: 3,
    status: "Delivered",
    created_at: new Date(Date.now() - 2 * 24 * 3600 * 1000).toISOString(), // 2 days ago
  },
  {
    id: 1005,
    customer_name: "Tharindu Alwis",
    email: "tharindu.alwis@outlook.com",
    phone: "+94 21 567 8901",
    city: "Jaffna",
    address: "105 Hospital Road",
    product_variant: "Leather Travel Wallet",
    quantity: 1,
    status: "Cancelled",
    created_at: new Date(Date.now() - 3 * 24 * 3600 * 1000).toISOString(), // 3 days ago
  },
  {
    id: 1006,
    customer_name: "Ruwanthie de Silva",
    email: "ruwanthie.ds@gmail.com",
    phone: "+94 33 789 0123",
    city: "Gampaha",
    address: "14 Kandy Road, Yakkala",
    product_variant: "Portable Power Bank 20k",
    quantity: 2,
    status: "Delivered",
    created_at: new Date(Date.now() - 4 * 24 * 3600 * 1000).toISOString(), // 4 days ago
  },
  {
    id: 1007,
    customer_name: "Janith Ranasinghe",
    email: "janith.ran@gmail.com",
    phone: "+94 25 890 1234",
    city: "Anuradhapura",
    address: "30 Maithripala Senanayake Mawatha",
    product_variant: "Wireless Ergonomic Mouse",
    quantity: 1,
    status: "Confirmed",
    created_at: new Date(Date.now() - 5 * 24 * 3600 * 1000).toISOString(), // 5 days ago
  },
  {
    id: 1008,
    customer_name: "Priyantha Perera",
    email: "priyantha.p@gmail.com",
    phone: "+94 26 901 2345",
    city: "Trincomalee",
    address: "72 Inner Harbour Road",
    product_variant: "Noise Cancelling Headphones",
    quantity: 1,
    status: "Delivered",
    created_at: new Date(Date.now() - 6 * 24 * 3600 * 1000).toISOString(), // 6 days ago
  },
  {
    id: 1009,
    customer_name: "Shalini de Alwis",
    email: "shalini.alwis@gmail.com",
    phone: "+94 34 112 2334",
    city: "Kalutara",
    address: "18 Main Street",
    product_variant: "Ultra-Slim Mechanical Keyboard",
    quantity: 1,
    status: "Pending",
    created_at: new Date(Date.now() - 7 * 24 * 3600 * 1000).toISOString(), // 7 days ago
  },
  {
    id: 1010,
    customer_name: "Nimal Siriwardhana",
    email: "nimal.siri@gmail.com",
    phone: "+94 37 678 9012",
    city: "Kurunegala",
    address: "56 Negombo Road",
    product_variant: "Minimalist Desk Pad",
    quantity: 2,
    status: "Confirmed",
    created_at: new Date(Date.now() - 8 * 24 * 3600 * 1000).toISOString(), // 8 days ago
  }
];
