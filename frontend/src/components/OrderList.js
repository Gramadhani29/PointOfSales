import React, { useState, useEffect } from 'react';
import axios from 'axios';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  IconButton,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import AddIcon from '@mui/icons-material/Add';
import RemoveIcon from '@mui/icons-material/Remove';
import { API_ENDPOINTS } from '../config/api';

function OrderList() {
  const [orders, setOrders] = useState([]);
  const [products, setProducts] = useState([]);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editFormData, setEditFormData] = useState({
    customer_name: '',
    items: []
  });

  useEffect(() => {
    fetchOrders();
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

  const fetchOrders = async () => {
    try {
      const orders = JSON.parse(localStorage.getItem('orders') || '[]');
      
      // Fetch product details for each order item
      const ordersWithProducts = await Promise.all(orders.map(async (order) => {
        if (!order.items) return order;
        
        const itemsWithProducts = await Promise.all(order.items.map(async (item) => {
          try {
            const productResponse = await axios.get(API_ENDPOINTS.PRODUCT_DETAIL(item.product_id));
            return {
              ...item,
              product_name: productResponse.data.product_name,
              price: productResponse.data.product_price
            };
          } catch (error) {
            console.error(`Error fetching product ${item.product_id}:`, error);
            return {
              ...item,
              product_name: 'Product not found',
              price: item.price
            };
          }
        }));

        return {
          ...order,
          items: itemsWithProducts
        };
      }));

      setOrders(ordersWithProducts);
    } catch (error) {
      console.error('Error fetching orders:', error);
      setOrders([]);
    }
  };

  const handleEditClick = (order) => {
    setSelectedOrder(order);
    // Convert string items to array if needed
    let orderItems = [];
    if (typeof order.items === 'string') {
      // Parse items string into array
      orderItems = order.items.split(', ').map(item => {
        const [productName, quantity] = item.split(' x');
        return {
          product_name: productName,
          quantity: parseInt(quantity, 10)
        };
      });
    } else if (Array.isArray(order.items)) {
      orderItems = order.items;
    }

    setEditFormData({
      customer_name: order.customer_name,
      items: orderItems
    });
    setEditDialogOpen(true);
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setSelectedOrder(null);
    setEditFormData({
      customer_name: '',
      items: []
    });
  };

  const handleEditChange = (e) => {
    setEditFormData({
      ...editFormData,
      [e.target.name]: e.target.value
    });
  };

  const handleQuantityChange = (index, newValue) => {
    const quantity = parseInt(newValue, 10);
    if (isNaN(quantity) || quantity < 1) return;

    const updatedItems = [...editFormData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      quantity: quantity
    };

    setEditFormData({
      ...editFormData,
      items: updatedItems
    });
  };

  const handleAddItem = () => {
    if (products.length === 0) return;

    const newItem = {
      product_name: products[0].product_name,
      quantity: 1
    };

    setEditFormData({
      ...editFormData,
      items: [...editFormData.items, newItem]
    });
  };

  const handleRemoveItem = (index) => {
    const updatedItems = editFormData.items.filter((_, i) => i !== index);
    setEditFormData({
      ...editFormData,
      items: updatedItems
    });
  };

  const handleProductChange = (index, productName) => {
    const updatedItems = [...editFormData.items];
    updatedItems[index] = {
      ...updatedItems[index],
      product_name: productName
    };

    setEditFormData({
      ...editFormData,
      items: updatedItems
    });
  };

  const handleEditSubmit = async () => {
    try {
      const response = await axios.put(
        API_ENDPOINTS.UPDATE_ORDER(selectedOrder.id),
        editFormData
      );
      
      // Update local storage
      const updatedOrders = orders.map(order => 
        order.id === selectedOrder.id ? { ...order, ...response.data } : order
      );
      localStorage.setItem('orders', JSON.stringify(updatedOrders));
      setOrders(updatedOrders);
      
      handleEditClose();
    } catch (error) {
      console.error('Error updating order:', error);
      alert(error.response?.data?.message || 'Failed to update order');
    }
  };

  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        await axios.delete(API_ENDPOINTS.DELETE_ORDER(orderId));
        // Update local storage
        const updatedOrders = orders.filter(order => order.id !== orderId);
        localStorage.setItem('orders', JSON.stringify(updatedOrders));
        setOrders(updatedOrders);
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order. Please try again.');
      }
    }
  };

  return (
    <div className="ml-64 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#2E856E]">Orders</h1>
        </div>
        <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
          <div className="grid grid-cols-6 gap-4 bg-[#98DBBC] p-4 font-semibold text-[#2E856E]">
            <div>Order ID</div>
            <div>Customer</div>
            <div>Items</div>
            <div>Total</div>
            <div>Date</div>
            <div>Actions</div>
          </div>
          <div className="divide-y divide-gray-100">
            {orders.map((order) => (
              <div
                key={order.id}
                className="grid grid-cols-6 gap-4 p-4 hover:bg-gray-50 transition-colors"
              >
                <div className="text-[#2E856E] font-medium">#{order.id}</div>
                <div className="font-medium">{order.customer_name}</div>
                <div className="text-gray-600">
                  {order.items && order.items.length > 0 ? (
                    order.items.map((item, index) => (
                      <div key={index} className="text-sm">
                        {item.product_name} x {item.quantity}
                      </div>
                    ))
                  ) : (
                    'No items'
                  )}
                </div>
                <div className="font-bold text-[#2E856E]">
                  Rp {order.total_price?.toLocaleString()}
                </div>
                <div className="text-gray-600">
                  {new Date(order.created_at).toLocaleDateString('id-ID', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </div>
                <div className="flex gap-2">
                  <IconButton
                    aria-label="edit"
                    onClick={() => handleEditClick(order)}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '6px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                      '&:hover': {
                        backgroundColor: '#FFFFFF',
                        color: '#2E856E',
                      },
                    }}
                  >
                    <EditIcon sx={{ color: '#2E856E' }} />
                  </IconButton>
                  <IconButton
                    aria-label="delete"
                    onClick={() => handleDeleteOrder(order.id)}
                    sx={{
                      backgroundColor: 'rgba(255, 255, 255, 0.95)',
                      padding: '6px',
                      boxShadow: '0 1px 3px rgba(0, 0, 0, 0.2)',
                      '&:hover': {
                        backgroundColor: '#FFFFFF',
                        color: '#D32F2F',
                      },
                    }}
                  >
                    <DeleteIcon sx={{ color: '#FF0000' }} />
                  </IconButton>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      <Dialog open={editDialogOpen} onClose={handleEditClose} maxWidth="sm" fullWidth>
        <DialogTitle className="bg-[#7DCEA0] text-white">
          Edit Order
        </DialogTitle>
        <DialogContent className="mt-4">
          <div className="space-y-4">
            <TextField
              autoFocus
              label="Customer Name"
              name="customer_name"
              fullWidth
              value={editFormData.customer_name}
              onChange={handleEditChange}
            />
            <div className="mt-4">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-lg font-semibold">Items</h3>
                <Button
                  startIcon={<AddIcon />}
                  onClick={handleAddItem}
                  variant="contained"
                  sx={{
                    backgroundColor: '#2E856E',
                    '&:hover': { backgroundColor: '#236B57' }
                  }}
                >
                  Add Item
                </Button>
              </div>
              {editFormData.items.map((item, index) => (
                <div key={index} className="flex items-center gap-4 mb-4 p-4 border rounded-lg">
                  <FormControl fullWidth>
                    <InputLabel>Product</InputLabel>
                    <Select
                      value={item.product_name}
                      label="Product"
                      onChange={(e) => handleProductChange(index, e.target.value)}
                    >
                      {products.map((product) => (
                        <MenuItem key={product.id} value={product.product_name}>
                          {product.product_name} - Rp {product.product_price}
                        </MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <TextField
                    label="Quantity"
                    type="number"
                    value={item.quantity}
                    onChange={(e) => handleQuantityChange(index, e.target.value)}
                    inputProps={{ min: 1 }}
                    sx={{ width: '100px' }}
                  />
                  <IconButton
                    onClick={() => handleRemoveItem(index)}
                    sx={{ color: '#FF0000' }}
                  >
                    <RemoveIcon />
                  </IconButton>
                </div>
              ))}
            </div>
          </div>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={handleEditClose} className="text-gray-600">
            Cancel
          </Button>
          <Button
            onClick={handleEditSubmit}
            className="bg-[#2E856E] text-white hover:bg-[#236B57]"
          >
            Save Changes
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default OrderList;