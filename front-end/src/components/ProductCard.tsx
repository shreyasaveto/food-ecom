import { useState, useEffect } from "react";
import axios from "axios";

interface Product {
  id: number;
  name: string;
  description: string;
  price: number;
  image: string;
}

const ProductCard = ({ product }: { product: Product }) => {
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState<number>(0);

  useEffect(() => {
    // Optional: Fetch quantity from backend if needed
  }, []);

  const handleAddToCart = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("Please login to add items to cart");
      return;
    }

    try {
      await axios.post(
        "http://localhost:5000/api/cart/add",
        {
          product_name: product.name,
          product_image: product.image,
          price: product.price,
          quantity: 1,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      setQuantity((prev) => prev + 1);
      setAdded(true);
      setTimeout(() => setAdded(false), 1000);
    } catch (error) {
      console.error("Add to cart error", error);
      alert("Failed to add to cart");
    }
  };

  return (
    <div className="card">
      <img src={product.image} className="card-img-top" alt={product.name} />
      <div className="card-body">
        <h5>{product.name}</h5>
        <p>{product.description}</p>
        <p>₹{product.price.toFixed(2)}</p>
        <button className="btn btn-primary" onClick={handleAddToCart}>
          {added ? "✓ Added!" : "Add to Cart"}
        </button>
        {quantity > 0 && <span className="ms-2">Qty: {quantity}</span>}
      </div>
    </div>
  );
};

export default ProductCard;
