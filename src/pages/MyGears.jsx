import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../AuthContext';
import { useCart } from '../CartContext';
import { useNotifications } from '../NotificationContext';
import { formatPeso } from '../mockData';
import { formatRentalTimeRemaining, getRentalEndTime, getRentalTimeRemaining } from '../rentalUtils';
import AccountSidebar from '../components/AccountSidebar';
import './Account.css';

export default function MyGears() {
  const { user, updateUser } = useAuth();
  const { rentedItems, returnRental, finishRental } = useCart();
  const { addNotification, addAdminNotification } = useNotifications();
  const [now, setNow] = useState(() => Date.now());
  const [selectedRental, setSelectedRental] = useState(null);
  const [selectedImage, setSelectedImage] = useState(0);

  useEffect(() => {
    const timer = window.setInterval(() => setNow(Date.now()), 1000);
    return () => window.clearInterval(timer);
  }, []);

  const formatPaidDate = (timestamp) => timestamp
    ? new Date(timestamp).toLocaleString('en-US', {
      dateStyle: 'medium',
      timeStyle: 'short',
    })
    : 'Payment date unavailable';

  const openRentalDetails = (rental, index) => {
    setSelectedRental({ ...rental, rentalIndex: index });
    setSelectedImage(0);
  };

  const handleReturnRental = (rentalIndex) => {
    const rental = rentedItems[rentalIndex];
    const returnedRental = returnRental(rentalIndex);
    setSelectedRental(null);
    if (rental || returnedRental) {
      const returnedItem = returnedRental || rental;
      const refundAmount = Number(returnedItem.refundableAmount) || 0;
      const refundedDeposit = Number(returnedItem.refundedSecurityDeposit) || 0;
      const currentBalance = Number(user?.balance) || 0;
      updateUser({ balance: currentBalance + refundAmount });
      addNotification(`${returnedItem.product.name} was returned. ${formatPeso(refundAmount)} was added to your account balance, including your ${formatPeso(refundedDeposit)} security deposit.`, 'success');
      addAdminNotification(
        `${user?.name || 'A client'} returned ${returnedItem.product.name}. ${formatPeso(refundedDeposit)} security deposit was refunded.`,
        'info'
      );
    }
  };

  const handleFinishRental = (rentalIndex) => {
    const rental = rentedItems[rentalIndex];
    const finishedRental = finishRental(rentalIndex);
    setSelectedRental(null);
    if (rental && finishedRental) {
      const refundedDeposit = Number(finishedRental.refundedSecurityDeposit) || 0;
      updateUser({ balance: (Number(user?.balance) || 0) + refundedDeposit });
      addNotification(`${rental.product.name} was marked as finished and moved to rental history.`, 'info');
      addAdminNotification(`${user?.name || 'A client'} finished renting ${rental.product.name}. ${formatPeso(refundedDeposit)} security deposit was refunded.`, 'info');
    }
  };

  return (
    <div className="container account-page">
      <AccountSidebar />

      <main className="account-main my-gears-page">
        <div className="breadcrumb mono">
          <Link to="/catalog">Home</Link> &gt; <span>My Gears</span>
        </div>
        <h1>My Gears</h1>
        {rentedItems.length === 0 ? (
          <p className="empty-state">You have no rented gear.</p>
        ) : (
          <section className="rented-gears-list" aria-label="Rented gear">
            {rentedItems.map((rental, index) => {
              const { product, days, rentedAt } = rental;
              const endTime = getRentalEndTime(rental, now);
              const startTime = rentedAt || now;
              const remaining = getRentalTimeRemaining(rental, now);
              const progress = Math.min(100, Math.max(0, (remaining / (endTime - startTime)) * 100));
              const urgency = remaining === 0 ? 'ended' : progress <= 10 ? 'critical' : progress <= 25 ? 'warning' : 'normal';

              return (
              <article
                className="card rented-gear-row"
                key={`${product.id}-${index}`}
                role="button"
                tabIndex="0"
                onClick={() => openRentalDetails(rental, index)}
                onKeyDown={(event) => {
                  if (event.key === 'Enter' || event.key === ' ') {
                    event.preventDefault();
                    openRentalDetails(rental, index);
                  }
                }}
              >
                <button type="button" className="rented-gear-image-link" onClick={() => openRentalDetails(rental, index)} aria-label={`View ${product.name}`}>
                  <img src={product.images[0]} alt={product.name} />
                </button>
                <div>
                  <h2><button type="button" className="rented-gear-name" onClick={() => openRentalDetails(rental, index)}>{product.name}</button></h2>
                  <p>{product.description}</p>
                  <span className="mono">{days} day rental</span>
                  <span className="mono rented-gear-paid-date">Paid {formatPaidDate(rental.paidAt || rental.rentedAt)}</span>
                </div>
                <strong className="rented-gear-status">Paid</strong>
                <div className="rented-gear-progress">
                  <div className="rented-gear-progress-label">
                    <span>Rental time remaining</span>
                    <strong className={`rented-gear-time-${urgency}`}>{formatRentalTimeRemaining(rental, now)}</strong>
                  </div>
                  <div className="rented-gear-progress-track">
                    <div className={`rented-gear-progress-fill rented-gear-progress-${urgency}`} style={{ width: `${progress}%` }} />
                  </div>
                  <div className="rented-gear-actions">
                    <button
                      type="button"
                      className="btn btn-outline rented-gear-return"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleReturnRental(index);
                      }}
                    >
                      Return / Refund
                    </button>
                    <button
                      type="button"
                      className="btn btn-outline rented-gear-finish"
                      onClick={(event) => {
                        event.stopPropagation();
                        handleFinishRental(index);
                      }}
                    >
                      Finished renting
                    </button>
                  </div>
                </div>
              </article>
              );
            })}
          </section>
        )}
      </main>

      {selectedRental && (
        <div className="rented-gear-modal-backdrop" role="presentation" onMouseDown={() => setSelectedRental(null)}>
          <section
            className="card rented-gear-modal"
            role="dialog"
            aria-modal="true"
            aria-labelledby="rented-gear-modal-title"
            onMouseDown={(event) => event.stopPropagation()}
          >
            <button type="button" className="rented-gear-modal-close" aria-label="Close product details" onClick={() => setSelectedRental(null)}>×</button>
            <div className="rented-gear-modal-gallery">
              <div className="rented-gear-modal-hero">
                <img src={selectedRental.product.images[selectedImage]} alt={selectedRental.product.name} />
              </div>
              <div className="rented-gear-modal-thumbnails" aria-label="Product photos">
                {selectedRental.product.images.map((image, index) => (
                  <button type="button" className={index === selectedImage ? 'selected' : ''} key={image} onClick={() => setSelectedImage(index)} aria-label={`View photo ${index + 1}`}>
                    <img src={image} alt="" />
                  </button>
                ))}
              </div>
              <div className="rented-gear-modal-timer">
                <div className="eyebrow">Time remaining</div>
                {(() => {
                  const endTime = getRentalEndTime(selectedRental, now);
                  const startTime = selectedRental.rentedAt || now;
                  const remaining = getRentalTimeRemaining(selectedRental, now);
                  const progress = Math.min(100, Math.max(0, (remaining / (endTime - startTime)) * 100));
                  const urgency = remaining === 0 ? 'ended' : progress <= 10 ? 'critical' : progress <= 25 ? 'warning' : 'normal';
                  return (
                    <>
                      <strong className={`rented-gear-modal-countdown rented-gear-time-${urgency}`}>{formatRentalTimeRemaining(selectedRental, now)}</strong>
                      <div className="rented-gear-progress-track"><div className={`rented-gear-progress-fill rented-gear-progress-${urgency}`} style={{ width: `${progress}%` }} /></div>
                    </>
                  );
                })()}
              </div>
              <button type="button" className="btn btn-outline btn-block rented-gear-modal-return" onClick={() => handleReturnRental(selectedRental.rentalIndex)}>
                Return Product &amp; Request Refund
              </button>
            </div>
            <div className="rented-gear-modal-copy">
              <div className="eyebrow">Rented product</div>
              <h2 id="rented-gear-modal-title">{selectedRental.product.name}</h2>
              <p>{selectedRental.product.description}</p>
              <div className="rented-gear-paid-date-modal mono">
                Paid {formatPaidDate(selectedRental.paidAt || selectedRental.rentedAt)}
              </div>
              <div className="rented-gear-paid-date-modal mono">
                Security deposit held by Gear Rent: {formatPeso(Number(selectedRental.securityDeposit) || 0)}
              </div>
              <div className="rented-gear-modal-specs">
                {Object.entries(selectedRental.product.specs).map(([label, value]) => (
                  <div key={label}><span className="mono">{label}</span><strong>{value}</strong></div>
                ))}
              </div>
              <h3>Key Features</h3>
              <ul className="rented-gear-modal-features">
                {selectedRental.product.features.map((feature) => <li key={feature}>{feature}</li>)}
              </ul>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}
