import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Donation } from '../types';
import { StatusBadge } from './StatusBadge';
import { 
  MapPin, 
  Clock, 
  Calendar, 
  Layers, 
  Leaf, 
  Utensils, 
  ShoppingBag, 
  Flame 
} from 'lucide-react';

interface FoodCardProps {
  donation: Donation;
  actionButton?: React.ReactNode;
}

export const FoodCard: React.FC<FoodCardProps> = ({ donation, actionButton }) => {
  const [timeLeft, setTimeLeft] = useState<string>('');

  useEffect(() => {
    const calculateTimeLeft = () => {
      const difference = +new Date(donation.expiresAt) - +new Date();
      if (difference <= 0) {
        setTimeLeft('Expired');
        return;
      }

      const hrs = Math.floor(difference / (1000 * 60 * 60));
      const mins = Math.floor((difference / 1000 / 60) % 60);

      if (hrs > 0) {
        setTimeLeft(`Expires in ${hrs}h ${mins}m`);
      } else {
        setTimeLeft(`Expires in ${mins}m`);
      }
    };

    calculateTimeLeft();
    const interval = setInterval(calculateTimeLeft, 60000); // update every minute
    return () => clearInterval(interval);
  }, [donation.expiresAt]);

  const getCategoryIcon = () => {
    switch (donation.category) {
      case 'RICE': return <Flame className="w-6 h-6 text-emerald-600" />;
      case 'MEALS': return <Utensils className="w-6 h-6 text-emerald-600" />;
      case 'BAKERY': return <ShoppingBag className="w-6 h-6 text-emerald-600" />;
      case 'FRUITS': return <Leaf className="w-6 h-6 text-emerald-600" />;
      case 'VEGETABLES': return <Leaf className="w-6 h-6 text-emerald-600" />;
      default: return <Layers className="w-6 h-6 text-emerald-600" />;
    }
  };

  const getPlaceholderBg = () => {
    switch (donation.category) {
      case 'RICE': return 'bg-amber-50';
      case 'MEALS': return 'bg-red-50';
      case 'BAKERY': return 'bg-yellow-50';
      case 'FRUITS': return 'bg-emerald-50';
      case 'VEGETABLES': return 'bg-green-50';
      default: return 'bg-stone-50';
    }
  };

  // Convert status color for type
  const isVegetarian = donation.foodType === 'VEGETARIAN';

  return (
    <div className="bg-white rounded-xl border border-stone-100 overflow-hidden shadow-xs hover:shadow-md hover:border-emerald-100 transition-all flex flex-col h-full" id={`food-card-${donation.id}`}>
      {/* Visual / Image area */}
      <div className="relative h-44 w-full bg-stone-100 flex items-center justify-center shrink-0">
        {donation.imageUrl ? (
          <img 
            src={donation.imageUrl} 
            alt={donation.foodName} 
            className="w-full h-full object-cover"
          />
        ) : (
          <div className={`w-full h-full flex flex-col items-center justify-center ${getPlaceholderBg()} gap-2 text-stone-500`}>
            <div className="p-3 bg-white rounded-full shadow-xs">
              {getCategoryIcon()}
            </div>
            <span className="text-xs font-bold uppercase tracking-widest text-stone-400">{donation.category}</span>
          </div>
        )}

        {/* Veg/Non-veg Indicator Badge */}
        <span className={`absolute top-3 left-3 px-2 py-0.5 rounded-md text-[10px] font-extrabold flex items-center gap-1 shadow-xs border ${
          isVegetarian 
            ? 'bg-emerald-600 border-emerald-700 text-white' 
            : 'bg-rose-600 border-rose-700 text-white'
        }`}>
          {isVegetarian ? <Leaf className="w-2.5 h-2.5 fill-white" /> : <Flame className="w-2.5 h-2.5 fill-white" />}
          {isVegetarian ? 'VEG' : 'NON-VEG'}
        </span>

        {/* Status Badge */}
        <div className="absolute top-3 right-3">
          <StatusBadge status={donation.status} />
        </div>
      </div>

      {/* Details Area */}
      <div className="p-5 flex-1 flex flex-col justify-between space-y-4">
        <div className="space-y-2">
          <div className="flex justify-between items-start gap-2">
            <h4 className="font-bold text-stone-800 leading-snug line-clamp-2" title={donation.foodName}>
              {donation.foodName}
            </h4>
          </div>
          <p className="text-xs text-stone-400 line-clamp-2 leading-relaxed">
            {donation.description}
          </p>
        </div>

        {/* Meta Grid */}
        <div className="grid grid-cols-2 gap-x-2 gap-y-3 pt-2 text-xs border-t border-stone-50">
          <div className="flex items-center gap-1.5 text-stone-600">
            <Layers className="w-4 h-4 text-emerald-600 shrink-0" />
            <span className="font-bold text-stone-800 truncate">
              {donation.quantity} {donation.unit}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-stone-500 truncate">
            <MapPin className="w-4 h-4 text-stone-400 shrink-0" />
            <span className="truncate">{donation.area}, {donation.city}</span>
          </div>

          <div className="flex items-center gap-1.5 text-stone-500">
            <Clock className="w-4 h-4 text-stone-400 shrink-0" />
            <span className={`truncate font-semibold ${timeLeft === 'Expired' ? 'text-rose-600' : 'text-stone-700'}`}>
              {timeLeft}
            </span>
          </div>

          <div className="flex items-center gap-1.5 text-stone-500">
            <Calendar className="w-4 h-4 text-stone-400 shrink-0" />
            <span className="truncate">
              Pickup ends {new Date(donation.pickupEnd).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
            </span>
          </div>
        </div>

        {/* Action Button */}
        <div className="pt-2 flex items-center justify-between gap-2 shrink-0">
          <Link 
            to={`/available-food`} 
            state={{ selectedDonation: donation }}
            className="text-xs font-bold text-stone-600 hover:text-emerald-700 border border-stone-200 hover:border-emerald-600 bg-stone-50 hover:bg-emerald-50/30 px-3 py-2 rounded-lg text-center flex-1 transition-colors"
          >
            Details
          </Link>
          {actionButton}
        </div>
      </div>
    </div>
  );
};
