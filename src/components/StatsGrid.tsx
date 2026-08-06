import { motion } from 'motion/react';
import { ShoppingBag, Hourglass, CheckCircle2, TrendingUp, AlertTriangle } from 'lucide-react';
import { Order, getProductPrice, getNormalizedStatus } from '../supabase';

interface StatsGridProps {
  orders: Order[];
  activeStatusFilter: string;
  onSelectStatusFilter: (status: string) => void;
}

export default function StatsGrid({ orders, activeStatusFilter, onSelectStatusFilter }: StatsGridProps) {
  // Calculations
  const totalCount = orders.length;
  
  const pendingCount = orders.filter(o => getNormalizedStatus(o.status) === 'Pending').length;
  const confirmedCount = orders.filter(o => getNormalizedStatus(o.status) === 'Confirmed').length;
  const shippedCount = orders.filter(o => getNormalizedStatus(o.status) === 'Shipped').length;
  const deliveredCount = orders.filter(o => getNormalizedStatus(o.status) === 'Delivered').length;
  const cancelledCount = orders.filter(o => getNormalizedStatus(o.status) === 'Cancelled').length;

  // Revenue: Sum of (quantity * price) for non-cancelled orders
  const totalRevenue = orders.reduce((sum, order) => {
    if (getNormalizedStatus(order.status) === 'Cancelled') return sum;
    const price = getProductPrice(order.product_variant);
    return sum + (price * (order.quantity || 1));
  }, 0);

  // Delivery Success Rate: Delivered / (Delivered + Cancelled)
  const deliveryAttempted = deliveredCount + cancelledCount;
  const deliverySuccessRate = deliveryAttempted > 0 
    ? Math.round((deliveredCount / deliveryAttempted) * 100) 
    : 100;

  // Confirmation Rate: (Confirmed + Shipped + Delivered) / Total
  const confirmedOrBetter = confirmedCount + shippedCount + deliveredCount;
  const confirmationRate = totalCount > 0 
    ? Math.round((confirmedOrBetter / totalCount) * 100)
    : 100;

  const cards = [
    {
      id: 'all',
      title: 'Total Booked Orders',
      value: totalCount,
      desc: 'All COD entries in system',
      icon: ShoppingBag,
      color: 'text-gray-700',
      bgColor: 'bg-gray-100',
      borderColor: 'border-gray-200',
      isActive: activeStatusFilter === 'all',
    },
    {
      id: 'Pending',
      title: 'Pending Confirmation',
      value: pendingCount,
      desc: 'Need verbal/chat verify',
      icon: Hourglass,
      color: 'text-amber-600',
      bgColor: 'bg-amber-50',
      borderColor: 'border-amber-200',
      isActive: activeStatusFilter === 'Pending',
    },
    {
      id: 'revenue',
      title: 'Projected COD Value',
      value: `LKR ${totalRevenue.toLocaleString()}`,
      desc: `Active value breakdown`,
      icon: TrendingUp,
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      borderColor: 'border-blue-200',
      isActive: false, // not interactive filter
      isStatic: true,
    },
    {
      id: 'Delivered',
      title: 'Completed Deliveries',
      value: deliveredCount,
      desc: `Success Rate: ${deliverySuccessRate}%`,
      icon: CheckCircle2,
      color: 'text-emerald-600',
      bgColor: 'bg-emerald-50',
      borderColor: 'border-emerald-200',
      isActive: activeStatusFilter === 'Delivered',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8" id="stats-grid">
      {cards.map((card) => {
        const Icon = card.icon;
        const clickable = !card.isStatic;

        return (
          <motion.div
            key={card.id}
            id={`stat-card-${card.id}`}
            whileHover={clickable ? { y: -2 } : {}}
            whileTap={clickable ? { scale: 0.99 } : {}}
            onClick={() => clickable && onSelectStatusFilter(card.id)}
            className={`p-5 rounded-xl bg-white border transition-all ${
              card.isActive 
                ? 'border-blue-600 ring-2 ring-blue-100 shadow-sm' 
                : 'border-gray-200 shadow-xs'
            } ${clickable ? 'cursor-pointer' : 'cursor-default'}`}
          >
            <div className="flex justify-between items-start">
              <span className="text-xs font-semibold text-gray-500 tracking-tight">
                {card.title}
              </span>
              <div className={`p-1.5 rounded-lg ${card.bgColor}`}>
                <Icon className={`w-4 h-4 ${card.color}`} />
              </div>
            </div>

            <div className="mt-3">
              <h3 className="text-2xl font-bold text-gray-900 tracking-tight">
                {card.value}
              </h3>
              <p className="text-[11px] text-gray-500 mt-1 flex items-center gap-1 font-medium">
                {card.desc}
              </p>
            </div>

            {clickable && (
              <div className="mt-4 pt-3 border-t border-gray-100 flex items-center justify-between text-[10px]">
                <span className={`font-semibold ${card.isActive ? 'text-blue-700' : 'text-gray-400 hover:text-gray-600'}`}>
                  {card.isActive ? 'Active Filter' : 'Click to filter'}
                </span>
                <span className={`h-1.5 w-1.5 rounded-full ${card.isActive ? 'bg-blue-600' : 'bg-gray-300'}`} />
              </div>
            )}
          </motion.div>
        );
      })}
    </div>
  );
}
