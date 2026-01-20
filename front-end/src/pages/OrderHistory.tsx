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
}

const OrderHistory = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = async () => {
    const token = localStorage.getItem("token");

    try {
      const response = await axios.get(
        "http://localhost:5000/api/orders/history",
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );
      setOrders(response.data);
    } catch (err) {
      console.error("Error fetching order history", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, []);

  if (loading)
    return <p className="text-center mt-5">Loading order history...</p>;

  return (
    <div className="container my-5">
      <h2 className="mb-4 text-center">Order History</h2>
      {orders.length === 0 ? (
        <p className="text-center">No past orders found.</p>
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
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default OrderHistory;
