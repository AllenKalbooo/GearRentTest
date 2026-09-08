import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../CartContext';
import { formatPeso } from '../mockData';
import './Checkout.css';

export default function Checkout() {
  const { items, total, clearCart } = useCart();
  // Snapshot the order once, before the cart is cleared, so the
  // confirmation message still has something to show afterward.
  const [order] = useState(() => ({ count: items.length, total }));

  useEffect(() => {
    clearCart();
    // Only run once on mount — clearing on every render would fight the
    // cart's own state updates.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <div className="container checkout-page">
      <div className="checkout-icon">✓</div>
      <h1>Rental Confirmed</h1>
      <p className="checkout-summary">
        {order.count} item{order.count !== 1 ? 's' : ''} reserved — {formatPeso(order.total)} charged today.
      </p>
      <Link to="/profile" className="btn btn-primary">
        Go to My Profile
      </Link>
    </div>
  );
}
