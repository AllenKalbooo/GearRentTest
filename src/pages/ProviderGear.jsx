import { useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categories, formatPeso } from '../mockData';
import { useProviderCatalog } from '../ProviderContext';
import { useNotifications } from '../NotificationContext';
import AccountSidebar from '../components/AccountSidebar';
import './ProviderGear.css';

const initialForm = {
  name: '',
  category: categories[0].id,
  price: '',
  condition: 'Good',
  capacity: '',
  weight: '',
  sensor: '',
  image: '',
  images: [],
  description: '',
};

function compressImage(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxDimension = 1600;
        const scale = Math.min(1, maxDimension / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL('image/jpeg', 0.82));
      };
      image.onerror = reject;
      image.src = reader.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

export default function ProviderGear() {
  const navigate = useNavigate();
  const { providerProducts, addProviderProduct, removeProviderProduct } = useProviderCatalog();
  const { addNotification } = useNotifications();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');
  const imageInputRef = useRef(null);

  const handleChange = (event) => {
    setForm((currentForm) => ({ ...currentForm, [event.target.name]: event.target.value }));
  };

  const handleImageUpload = (event) => {
    const files = Array.from(event.target.files || []);
    if (!files.length) return;

    Promise.all(files.map(compressImage)).then((images) => {
      setForm((currentForm) => ({
        ...currentForm,
        image: currentForm.image || images[0],
        images: [...currentForm.images, ...images],
      }));
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    if (!form.image) {
      setMessage('Add a photo from your device before publishing.');
      return;
    }
    addProviderProduct({ ...form, price: Number(form.price), image: form.image.trim(), images: form.images });
    addNotification(`${form.name || 'New gear'} was published to the public catalog.`, 'success');
    event.currentTarget.reset();
    if (imageInputRef.current) imageInputRef.current.value = '';
    setForm(initialForm);
    setMessage('Gear listed. It is now visible in the catalog.');
  };

  return (
    <div className="container account-page provider-page">
      <AccountSidebar />
      <main className="account-main">
        <div className="breadcrumb mono"><Link to="/profile">My Profile</Link> &gt; <span>Provider Gear</span></div>
        <header className="provider-page-header">
          <div><span className="eyebrow">Provider workspace</span><h1>Provider Gear</h1><p className="provider-intro">Turn the equipment you own into a living catalog listing.</p></div>
          <div className="provider-live-status"><span className="provider-live-dot" /> Catalog live</div>
        </header>
        <div className="provider-metrics" aria-label="Provider inventory summary">
          <div><span className="mono">Published gear</span><strong>{String(providerProducts.length).padStart(2, '0')}</strong></div>
          <div><span className="mono">Visibility</span><strong>Public</strong></div>
          <div><span className="mono">Availability</span><strong>Open</strong></div>
        </div>

        <form className="card provider-listing-form" onSubmit={handleSubmit}>
          <div className="provider-form-heading">
            <div><div className="eyebrow">New listing</div><h2>Add your gear</h2></div>
            <span className="provider-form-step mono">01 / 01</span>
          </div>
          <div className="provider-form-layout">
            <div className="provider-form-fields">
              <div className="provider-form-grid">
                <div className="provider-form-section-label">Identity</div>
                <label className="field">Product name<input name="name" value={form.name} onChange={handleChange} placeholder="Sony FX3 Cinema Camera" required /></label>
                <label className="field">Category
                  <select name="category" value={form.category} onChange={handleChange}>
                    {categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}
                  </select>
                </label>
                <div className="provider-form-section-label">Rental terms</div>
                <label className="field">Daily rate<input name="price" value={form.price} onChange={handleChange} type="number" min="1" step="1" placeholder="2500" required /></label>
                <label className="field">Condition
                  <select name="condition" value={form.condition} onChange={handleChange}>
                    <option>Excellent</option><option>Good</option><option>Fair</option>
                  </select>
                </label>
                <div className="provider-form-section-label">Technical profile</div>
                <label className="field">Capacity<input name="capacity" value={form.capacity} onChange={handleChange} placeholder="1 operator" /></label>
                <label className="field">Weight<input name="weight" value={form.weight} onChange={handleChange} placeholder="2.1 lbs" /></label>
                <label className="field provider-form-wide">Sensor<input name="sensor" value={form.sensor} onChange={handleChange} placeholder="Full-frame CMOS" /></label>
                <div className="provider-form-section-label">Presentation</div>
                <div className="provider-image-source provider-form-wide">
                  <div className="field provider-photo-copy">
                    <span>Product photo</span>
                    <small className="provider-field-hint">Use a clear photo of the actual gear.</small>
                  </div>
                  <label className="provider-upload-button">
                    <span className="provider-upload-icon" aria-hidden="true">{form.image ? '✓' : '↑'}</span>
                    {form.image ? 'Add another photo' : 'Choose a photo'}
                    <input ref={imageInputRef} type="file" accept="image/*" multiple onChange={handleImageUpload} />
                  </label>
                </div>
                <label className="field provider-form-wide">Description<textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder="Tell renters what makes this gear useful." /></label>
              </div>
            </div>
            <aside className="provider-preview" aria-label="Listing preview">
              <div className="provider-preview-heading"><span className="eyebrow">Listing preview</span><span className="provider-preview-status">Available</span></div>
              <div className="provider-preview-image">
                {form.image ? <img src={form.image} alt="" /> : <span>Image preview</span>}
                <span className="provider-preview-badge">Available</span>
              </div>
              {form.images.length > 1 && <div className="provider-preview-thumbnails">{form.images.map((image, index) => <img src={image} alt={`Preview ${index + 1}`} key={image} />)}</div>}
              <strong>{form.name || 'Your gear name'}</strong>
              <span className="mono">{form.price ? `${formatPeso(Number(form.price))} / day` : 'Set a daily rate'}</span>
              <p className="provider-preview-description">{form.description || 'Your gear description will appear here.'}</p>
              <div className="provider-preview-specs">
                <span><b>Capacity</b>{form.capacity || '—'}</span>
                <span><b>Weight</b>{form.weight || '—'}</span>
                <span><b>Sensor</b>{form.sensor || '—'}</span>
              </div>
            </aside>
          </div>
          <div className="provider-form-actions"><button type="submit" className="btn btn-primary">Publish gear</button><span className="mono">Your listing will appear in the public catalog.</span></div>
          {message && <p className="provider-message" role="status">{message}</p>}
        </form>

        <section className="provider-listings" aria-labelledby="provider-listings-heading">
          <div className="provider-section-heading"><div><span className="eyebrow">Your inventory</span><h2 id="provider-listings-heading">Published gear</h2></div><span className="mono">{providerProducts.length} listings</span></div>
          {providerProducts.length === 0 ? <p className="empty-state">No provider gear listed yet.</p> : (
            <div className="provider-listing-list">
              {providerProducts.map((product) => (
                <article
                  className="card provider-listing-row"
                  key={product.id}
                  role="link"
                  tabIndex="0"
                  onClick={() => navigate(`/product/${product.id}`)}
                  onKeyDown={(event) => {
                    if (event.key === 'Enter' || event.key === ' ') {
                      event.preventDefault();
                      navigate(`/product/${product.id}`);
                    }
                  }}
                >
                  <div className="provider-listing-image"><img src={product.images[0]} alt={product.name} /><span>Live</span></div>
                  <div className="provider-listing-copy">
                    <div className="provider-listing-head"><h3>{product.name}</h3><span className="provider-listing-category">{categories.find((category) => category.id === product.category)?.name || 'Gear'}</span></div>
                    <strong className="provider-listing-price">{formatPeso(product.price)} <span>/ day</span></strong>
                    <div className="provider-listing-specs">
                      {['capacity', 'weight', 'sensor'].map((spec) => product.specs?.[spec[0].toUpperCase() + spec.slice(1)] && (
                        <span key={spec}>{product.specs[spec[0].toUpperCase() + spec.slice(1)]}</span>
                      ))}
                    </div>
                    <p>{product.description || 'No description added.'}</p>
                  </div>
                  <button type="button" className="provider-delete" onClick={(event) => { event.stopPropagation(); removeProviderProduct(product.id); }} aria-label={`Remove ${product.name}`} title="Remove listing">🗑</button>
                </article>
              ))}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
