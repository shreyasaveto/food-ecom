import { useEffect, useState } from "react";
import axios from "axios";

interface Order {
  id: string;
  products: string[];
  product_images: string[];
  prices: number[];
  quantities: number[];
  total_quantity: number;
  total_price: number;
  ordered_at: string;
  events: {
    user_email: string;
    admin_email: string;
    warehouse_email: string;
    backup: string;
    netsuite?: string;
  };
}

const Admin = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.get(
        "http://localhost:5000/api/orders/admin",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setOrders(response.data);
    } catch (err) {
      console.error("Error fetching admin orders", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'success':
        return <span style={{ color: 'green' }}>✓</span>;
      case 'pending':
        return <span style={{ color: 'yellow' }}>⏳</span>;
      case 'failed':
        return <span style={{ color: 'red' }}>✗</span>;
      default:
        return <span>?</span>;
    }
  };

  if (loading)
    return <p className="text-center mt-5">Loading orders...</p>;

  return (
    <div className="container my-5">
      <h2 className="mb-4 text-center">Admin - All Orders</h2>
      {orders.length === 0 ? (
        <p className="text-center">No orders found.</p>
      ) : (
        <div className="row">
          {orders.map((order) => (
            <div key={order.id} className="col-md-6 mb-4">
              <div className="card h-100">
                <div className="card-body">
                  <h5 className="card-title">Order #{order.id}</h5>
                  <p className="card-text">
                    <strong>Items:</strong>
                    <ul>
                      {order.products.map((product, index) => (
                        <li key={index}>
                          {product} - Qty: {order.quantities[index]} - Price: ₹{(order.prices[index] * order.quantities[index]).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                    <strong>Total Quantity:</strong> {order.total_quantity}
                    <br />
                    <strong>Total Price:</strong> ₹{order.total_price.toFixed(2)}
                    <br />
                    <small className="text-muted">
                      Ordered at: {new Date(order.ordered_at).toLocaleString()}
                    </small>
                  </p>
                  <div>
                    <strong>Event Statuses:</strong>
                    <ul className="list-unstyled">
                      <li>User Email: {getStatusIcon(order.events?.user_email || 'pending')}</li>
                      <li>Admin Email: {getStatusIcon(order.events?.admin_email || 'pending')}</li>
                      <li>Warehouse Email: {getStatusIcon(order.events?.warehouse_email || 'pending')}</li>
                      <li>Backup DB: {getStatusIcon(order.events?.backup || 'pending')}</li>
                      {order.events?.netsuite && <li>NetSuite: {getStatusIcon(order.events.netsuite)}</li>}
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default Admin;