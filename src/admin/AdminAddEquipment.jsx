import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { categories, formatPeso } from '../mockData';
import { useProviderCatalog } from '../ProviderContext';
import { useNotifications } from '../NotificationContext';
import AdminLayout from './AdminLayout';
import './AdminAddEquipment.css';

const initialForm = {
  name: '', category: categories[0].id, price: '', condition: 'Good',
  capacity: '', weight: '', sensor: '', image: '', description: '',
};

export default function AdminAddEquipment() {
  const navigate = useNavigate();
  const { addProviderProduct } = useProviderCatalog();
  const { addNotification } = useNotifications();
  const [form, setForm] = useState(initialForm);
  const [message, setMessage] = useState('');

  const updateField = (event) => setForm((current) => ({ ...current, [event.target.name]: event.target.value }));

  const handleSubmit = (event) => {
    event.preventDefault();
    const product = addProviderProduct({
      ...form,
      price: Number(form.price),
      image: form.image.trim(),
      images: [form.image.trim()],
    });
    addNotification(`${product.name} was added to the public catalog.`, 'success');
    setMessage('Equipment added. It is now visible in Gear Inventory and the catalog.');
    setForm(initialForm);
  };

  return (
    <AdminLayout>
      <Link to="/admin/gear" className="mono admin-add-equipment-back">← Back to Gear Inventory</Link>
      <div className="admin-add-equipment-heading">
        <div><span className="mono admin-page-kicker">Inventory control</span><h1 className="admin-title">Add <span className="accent">Equipment</span></h1><p>Create a new product listing for the Gear Rent catalog.</p></div>
      </div>

      <form className="card admin-equipment-form" onSubmit={handleSubmit}>
        <div className="admin-equipment-workspace">
          <div className="admin-equipment-fields">
            <div className="admin-equipment-form-section"><span className="mono">01 / Identity</span><div className="admin-equipment-grid"><label>Product name<input name="name" value={form.name} onChange={updateField} placeholder="Sony FX3 Cinema Camera" required /></label><label>Category<select name="category" value={form.category} onChange={updateField}>{categories.map((category) => <option value={category.id} key={category.id}>{category.name}</option>)}</select></label></div></div>
            <div className="admin-equipment-form-section"><span className="mono">02 / Rental terms</span><div className="admin-equipment-grid"><label>Daily rate<input name="price" type="number" min="1" step="1" value={form.price} onChange={updateField} placeholder="2500" required /></label><label>Condition<select name="condition" value={form.condition} onChange={updateField}><option>Excellent</option><option>Good</option><option>Fair</option></select></label></div></div>
            <div className="admin-equipment-form-section"><span className="mono">03 / Equipment details</span><div className="admin-equipment-grid"><label>Capacity<input name="capacity" value={form.capacity} onChange={updateField} placeholder="1 operator" /></label><label>Weight<input name="weight" value={form.weight} onChange={updateField} placeholder="2.1 lbs" /></label><label>Sensor / output<input name="sensor" value={form.sensor} onChange={updateField} placeholder="Full-frame CMOS" /></label></div></div>
            <div className="admin-equipment-form-section"><span className="mono">04 / Presentation</span><div className="admin-equipment-grid"><label className="admin-equipment-wide">Product image URL<input name="image" type="url" value={form.image} onChange={updateField} placeholder="https://..." required /></label><label className="admin-equipment-wide">Description<textarea name="description" rows="5" value={form.description} onChange={updateField} placeholder="Describe the equipment, ideal use, and included accessories." required /></label></div></div>
          </div>
          <aside className="admin-add-equipment-preview" aria-label="Live equipment preview">
            <div className="admin-preview-heading"><span className="eyebrow">Live preview</span><span className="admin-preview-status">Available</span></div>
            <div className="admin-preview-image">{form.image ? <img src={form.image} alt="Equipment preview" /> : <span>Product image preview</span>}</div>
            <span className="admin-preview-category">{categories.find((category) => category.id === form.category)?.name || 'Gear'}</span>
            <strong>{form.name || 'Equipment name'}</strong>
            <span className="mono admin-preview-price">{form.price ? `${formatPeso(Number(form.price))} / day` : 'Set daily rate'}</span>
            <p>{form.description || 'Your equipment description will appear here.'}</p>
            <div className="admin-preview-specs"><span><b>Capacity</b>{form.capacity || '—'}</span><span><b>Weight</b>{form.weight || '—'}</span><span><b>Condition</b>{form.condition || '—'}</span></div>
          </aside>
        </div>
        <div className="admin-equipment-actions"><button type="submit" className="btn btn-primary">Publish Equipment</button><button type="button" className="btn btn-outline" onClick={() => navigate('/admin/gear')}>Cancel</button>{message && <span className="admin-equipment-message" role="status">{message}</span>}</div>
      </form>
    </AdminLayout>
  );
}