import { useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const PaymentGateway = () => {
  const [message, setMessage] = useState<string | null>(null);
  const [redirecting, setRedirecting] = useState(false);
  const navigate = useNavigate();
  const token = localStorage.getItem("token");

  const handleSuccess = async () => {
    try {
      await axios.post("http://localhost:5000/api/orders/checkout", {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setMessage("Your payment is successful and redirecting in 5 secs");
      setRedirecting(true);
      setTimeout(() => {
        navigate("/orders");
      }, 5000);
    } catch (err) {
      console.error("Checkout failed:", err);
      setMessage("Checkout failed. Please try again.");
    }
  };

  const handleFailed = () => {
    setMessage("Payment is failed and redirecting in 5 secs");
    setRedirecting(true);
    setTimeout(() => {
      navigate("/cart");
    }, 5000);
  };

  return (
    <div className="container mt-5 text-center">
      <h2>Payment Gateway</h2>
      {message ? (
        <div className="alert alert-info mt-4">
          <p>{message}</p>
          {redirecting && <p>Redirecting...</p>}
        </div>
      ) : (
        <div className="mt-4">
          <button
            className="btn btn-success me-3"
            onClick={handleSuccess}
          >
            Success
          </button>
          <button
            className="btn btn-danger"
            onClick={handleFailed}
          >
            Failed
          </button>
        </div>
      )}
    </div>
  );
};

export default PaymentGateway;