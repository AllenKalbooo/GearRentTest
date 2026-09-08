import { useState } from 'react';
import { Link } from 'react-router-dom';
import { useCart } from '../CartContext';
import { useNotifications } from '../NotificationContext';
import { useAuth } from '../AuthContext';
import { calculateSecurityDeposit, formatPeso } from '../mockData';
import './Payment.css';

export default function Payment() {
  const { items, total, securityDeposit, clearCart, completeRental } = useCart();
  const { addNotification, addAdminNotification } = useNotifications();
  const { creditAccount, user } = useAuth();
  const [paid, setPaid] = useState(false);
  const [rentedProducts, setRentedProducts] = useState([]);

  const handleSubmit = (event) => {
    event.preventDefault();
    setRentedProducts(items.map(({ product, days }) => ({ name: product.name, days })));
    items.forEach(({ product, days }) => {
      const providerEmail = product.providerEmail?.trim().toLowerCase();
      const providerEarnings = Number(product.price) * Number(days);
      const productDeposit = calculateSecurityDeposit(product.price);
      addAdminNotification(
        `${user?.name || 'A client'} rented ${product.name} for ${days} day${days === 1 ? '' : 's'}. ${formatPeso(productDeposit)} security deposit is held by Gear Rent.`,
        'success'
      );
      if (!providerEmail || !Number.isFinite(providerEarnings) || providerEarnings <= 0) return;
      creditAccount(providerEmail, providerEarnings);
      addNotification(
        `${user?.name || 'A gear renter'} rented ${product.name} for ${days} day${days === 1 ? '' : 's'}. ${formatPeso(providerEarnings)} was added to your account balance.`,
        'success',
        providerEmail
      );
    });
    completeRental(items);
    clearCart();
    setPaid(true);
  };

  if (paid) {
    return (
      <div className="container payment-page payment-confirmed">
        <div className="payment-icon">✓</div>
        <div className="eyebrow">Payment complete</div>
        <h1>Rental Confirmed</h1>
        <p>Your payment was processed successfully. The following gear is now rented to you:</p>
        <div className="payment-rented-notice" aria-label="Rented products">
          {rentedProducts.map((product) => (
            <div key={product.name}>
              <strong>{product.name}</strong>
              <span className="mono">{product.days} day rental</span>
            </div>
          ))}
        </div>
        <Link to="/my-gears" className="btn btn-primary">View My Gears</Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="container payment-page payment-confirmed">
        <div className="eyebrow">Payment</div>
        <h1>Your cart is empty</h1>
        <p>Add a rental before continuing to payment.</p>
        <Link to="/catalog" className="btn btn-primary">Browse the Catalog</Link>
      </div>
    );
  }

  return (
    <div className="container payment-page">
      <div className="breadcrumb mono"><Link to="/cart">Your Cart</Link> &gt; <span>Payment</span></div>
      <div className="payment-layout">
        <main className="payment-form-panel">
          <div className="eyebrow">Secure checkout</div>
          <h1>Payment</h1>
          <p className="payment-intro">Complete your payment to reserve your rental.</p>
          <form onSubmit={handleSubmit}>
            <div className="payment-section">
              <h2>Payment details</h2>
              <label>Cardholder name<input type="text" name="cardholder" placeholder="Full name" required /></label>
              <label>Card number<input type="text" name="cardNumber" inputMode="numeric" placeholder="0000 0000 0000 0000" minLength="12" required /></label>
              <div className="payment-fields-row">
                <label>Expiry date<input type="text" name="expiry" placeholder="MM / YY" required /></label>
                <label>Security code<input type="text" name="cvv" inputMode="numeric" placeholder="CVV" minLength="3" required /></label>
              </div>
            </div>
            <button type="submit" className="btn btn-primary payment-submit">Pay {formatPeso(total)}</button>
          </form>
        </main>
        <aside className="card payment-summary">
          <div className="eyebrow">Order summary</div>
          <h2>Rental total</h2>
          {items.map(({ product, days }) => (
            <div className="payment-item" key={product.id}>
              <span>{product.name}<small>{days} day rental</small></span>
              <strong>{formatPeso(product.price * days)}</strong>
            </div>
          ))}
          <div className="payment-total"><span>Total due today</span><strong>{formatPeso(total)}</strong></div>
          <p className="payment-note">{formatPeso(securityDeposit)} is held by Gear Rent, not paid to the provider, and returned to your account balance after the gear is returned.</p>
        </aside>
      </div>
    </div>
  );
}
