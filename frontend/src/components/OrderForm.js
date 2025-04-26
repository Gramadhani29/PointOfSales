import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { API_ENDPOINTS } from '../config/api';

function OrderForm() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [order, setOrder] = useState({
    customer_name: '',
    items: [{ product_id: '', quantity: 1 }]
  });

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const response = await axios.get(API_ENDPOINTS.PRODUCTS);
      setProducts(response.data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleChange = (e) => {
    setOrder({
      ...order,
      [e.target.name]: e.target.value
    });
  };

  const handleItemChange = (index, field, value) => {
    const newItems = [...order.items];
    newItems[index] = {
      ...newItems[index],
      [field]: value
    };
    setOrder({
      ...order,
      items: newItems
    });
  };

  const addItem = () => {
    setOrder({
      ...order,
      items: [...order.items, { product_id: '', quantity: 1 }]
    });
  };

  const removeItem = (index) => {
    const newItems = order.items.filter((_, i) => i !== index);
    setOrder({
      ...order,
      items: newItems.length > 0 ? newItems : [{ product_id: '', quantity: 1 }]
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const isValid = order.items.every(item => item.product_id && item.quantity > 0);
      if (!isValid) {
        alert('Please select a product and quantity for all items');
        return;
      }

      if (!order.customer_name.trim()) {
        alert('Please enter customer name');
        return;
      }

      // Format data sesuai dengan yang diharapkan oleh Laravel API
      const formattedOrder = {
        customer_name: order.customer_name,
        items: order.items.map(item => ({
          product_id: parseInt(item.product_id),
          quantity: parseInt(item.quantity)
        }))
      };

      console.log('Sending order data:', formattedOrder);
      const response = await axios.post(API_ENDPOINTS.CREATE_ORDER, formattedOrder);
      console.log('Order response:', response.data);

      // Simpan order baru ke localStorage dengan struktur yang sesuai
      const newOrder = {
        id: response.data.order_id,
        customer_name: response.data.customer_name,
        total_price: response.data.total_price,
        items: response.data.items,
        created_at: new Date().toISOString()
      };

      const existingOrders = JSON.parse(localStorage.getItem('orders') || '[]');
      existingOrders.push(newOrder);
      localStorage.setItem('orders', JSON.stringify(existingOrders));

      alert('Order created successfully!');
      navigate('/orders');
    } catch (error) {
      console.error('Error creating order:', error.response?.data || error.message);
      alert(error.response?.data?.error || 'Failed to create order. Please try again.');
    }
  };

  return (
    <div className="ml-64 p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold text-[#2E856E] mb-8">Create New Order</h1>
        <div className="bg-white rounded-2xl shadow-lg p-6">
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[#2E856E] font-medium mb-2">
                Customer Name
              </label>
              <input
                type="text"
                name="customer_name"
                value={order.customer_name}
                onChange={handleChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DCEA0] focus:border-transparent"
                required
              />
            </div>

            <div className="space-y-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex gap-4 items-start bg-gray-50 p-4 rounded-xl">
                  <div className="flex-grow">
                    <label className="block text-[#2E856E] font-medium mb-2">
                      Product
                    </label>
                    <select
                      value={item.product_id}
                      onChange={(e) => handleItemChange(index, 'product_id', e.target.value)}
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DCEA0] focus:border-transparent"
                      required
                    >
                      <option value="">Select a product</option>
                      {products.map((product) => (
                        <option key={product.id} value={product.id}>
                          {product.product_name} - Rp {product.product_price}
                        </option>
                      ))}
                    </select>
                  </div>
                  
                  <div className="w-32">
                    <label className="block text-[#2E856E] font-medium mb-2">
                      Quantity
                    </label>
                    <input
                      type="number"
                      value={item.quantity}
                      onChange={(e) => handleItemChange(index, 'quantity', parseInt(e.target.value) || 1)}
                      min="1"
                      className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#7DCEA0] focus:border-transparent"
                      required
                    />
                  </div>

                  <button
                    type="button"
                    onClick={() => removeItem(index)}
                    className="mt-8 px-4 py-2 text-red-500 hover:text-red-700 disabled:text-gray-400"
                    disabled={order.items.length === 1}
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>

            <div className="flex gap-4">
              <button
                type="button"
                onClick={addItem}
                className="px-6 py-2 bg-[#98DBBC] text-[#2E856E] rounded-full hover:bg-[#7DCEA0] transition-colors"
              >
                Add Item
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#2E856E] text-white rounded-full hover:bg-[#236B57] transition-colors"
              >
                Create Order
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

export default OrderForm;