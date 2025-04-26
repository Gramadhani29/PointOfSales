import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  TextField,
  Grid,
  Card,
  CardContent,
  Typography,
  IconButton,
} from '@mui/material';
import axios from 'axios';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import { API_ENDPOINTS } from '../config/api';

function ProductList() {
  const [products, setProducts] = useState([]);
  const [open, setOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState({
    product_name: '',
    product_category: '',
    product_price: '',
    product_image: '-'
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

  const handleOpen = () => {
    setIsEditing(false);
    setFormData({
      product_name: '',
      product_category: '',
      product_price: '',
      product_image: '-'
    });
    setOpen(true);
  };

  const handleClose = () => {
    setOpen(false);
    setIsEditing(false);
    setSelectedProduct(null);
  };

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleEditClick = (product) => {
    setSelectedProduct(product);
    setFormData({
      product_name: product.product_name,
      product_category: product.product_category,
      product_price: product.product_price,
      product_image: product.product_image
    });
    setIsEditing(true);
    setOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (isEditing && selectedProduct) {
        // Update existing product
        const response = await axios.put(
          `${API_ENDPOINTS.PRODUCTS}/${selectedProduct.id}`,
          formData
        );
        setProducts(products.map(p => 
          p.id === selectedProduct.id ? { ...response.data } : p
        ));
      } else {
        // Create new product
        const response = await axios.post(API_ENDPOINTS.PRODUCTS, formData);
        setProducts([...products, response.data]);
      }
      handleClose();
    } catch (error) {
      console.error('Error saving product:', error);
      alert(error.response?.data?.message || 'Error saving product');
    }
  };

  const handleDeleteClick = (product) => {
    console.log('Product to delete:', product);
    console.log('Product ID:', product.id);
    setSelectedProduct(product);
    setDeleteDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    try {
      if (!selectedProduct || !selectedProduct.id) {
        console.error('No product selected or invalid product ID');
        alert('Invalid product ID');
        return;
      }

      const productId = parseInt(selectedProduct.id);
      if (isNaN(productId)) {
        console.error('Product ID is not a number:', selectedProduct.id);
        alert('Invalid product ID format');
        return;
      }

      console.log('Attempting to delete product with ID:', productId);
      console.log('Delete URL:', `${API_ENDPOINTS.PRODUCTS}/${productId}`);
      
      const response = await axios.delete(`${API_ENDPOINTS.PRODUCTS}/${productId}`);
      console.log('Delete response:', response);
      
      setProducts(products.filter(p => p.id !== productId));
      setDeleteDialogOpen(false);
      setSelectedProduct(null);
    } catch (error) {
      console.error('Error deleting product:', error);
      console.error('Error response:', error.response);
      
      let errorMessage = 'Failed to delete product.';
      if (error.response?.data?.message) {
        errorMessage = error.response.data.message;
      }
      
      alert(errorMessage);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteDialogOpen(false);
    setSelectedProduct(null);
  };

  return (
    <div className="ml-64 p-8">
      <div className="max-w-6xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#2E856E]">Product</h1>
          <button
            onClick={handleOpen}
            className="bg-[#2E856E] text-white px-6 py-2 rounded-full hover:bg-[#236B57] transition-colors"
          >
            Add Product
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl shadow-lg overflow-hidden hover:shadow-xl transition-shadow"
            >
              <div className="h-48 bg-[#98DBBC] flex items-center justify-center relative">
                {product.product_image !== '-' ? (
                  <img
                    src={product.product_image}
                    alt={product.product_name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="text-[#2E856E] text-5xl">🍽️</div>
                )}
              </div>
              <div className="p-6">
                <h3 className="text-xl font-bold text-[#2E856E] mb-2">
                  {product.product_name}
                </h3>
                <p className="text-gray-600 mb-2">
                  Category: {product.product_category}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-[#2E856E]">
                    Rp {product.product_price}
                  </p>
                  <div className="flex gap-2">
                    <IconButton
                      aria-label="edit"
                      onClick={() => handleEditClick(product)}
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
                      onClick={() => handleDeleteClick(product)}
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
              </div>
            </div>
          ))}
        </div>
      </div>

      <Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
        <DialogTitle className="bg-[#7DCEA0] text-white">
          {isEditing ? 'Edit Product' : 'Add New Product'}
        </DialogTitle>
        <DialogContent className="mt-4">
          <div className="space-y-4">
            <TextField
              autoFocus
              label="Product Name"
              name="product_name"
              fullWidth
              value={formData.product_name}
              onChange={handleChange}
            />
            <TextField
              label="Category"
              name="product_category"
              fullWidth
              value={formData.product_category}
              onChange={handleChange}
            />
            <TextField
              label="Price"
              name="product_price"
              type="number"
              fullWidth
              value={formData.product_price}
              onChange={handleChange}
            />
          </div>
        </DialogContent>
        <DialogActions className="p-4">
          <Button onClick={handleClose} className="text-gray-600">
            Cancel
          </Button>
          <Button
            onClick={handleSubmit}
            className="bg-[#2E856E] text-white hover:bg-[#236B57]"
          >
            {isEditing ? 'Save Changes' : 'Add Product'}
          </Button>
        </DialogActions>
      </Dialog>

      <Dialog open={deleteDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete {selectedProduct?.product_name}?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>Cancel</Button>
          <Button onClick={handleDeleteConfirm} color="error">
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </div>
  );
}

export default ProductList;