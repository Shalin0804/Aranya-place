import { useEffect, useState } from 'react';
import { adminApi } from '../services/adminApi';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCustomers();
  }, []);

  async function loadCustomers() {
    try {
      const response = await adminApi.customers();
      setCustomers(response.data || []);
    } catch (err) {
      alert(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>

      <div className="page-intro">
        <div>
          <h2>Customers</h2>
          <p>View registered guests.</p>
        </div>
      </div>

      <div className="admin-panel-card">

        {loading ? (
          <div className="admin-loading">
            Loading customers...
          </div>
        ) : (
          <div className="table-wrapper">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Email</th>
                  <th>Phone</th>
                  <th>Status</th>
                  <th>Joined</th>
                </tr>
              </thead>

              <tbody>
                {customers.map((customer) => (
                  <tr key={customer.id}>
                    <td>{customer.name}</td>
                    <td>{customer.email}</td>
                    <td>{customer.phone || '—'}</td>
                    <td>{customer.status}</td>
                    <td>
                      {String(customer.created_at).slice(0, 10)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

      </div>
    </div>
  );
}