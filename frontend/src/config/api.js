// Base URLs for different APIs
const PRODUCT_API_BASE_URL = 'http://localhost:8001';
const ORDER_API_BASE_URL = 'http://localhost:8000';

export const API_ENDPOINTS = {
  // Product endpoints
  PRODUCTS: `${PRODUCT_API_BASE_URL}/api/product`,
  PRODUCT_DETAIL: (id) => `${PRODUCT_API_BASE_URL}/api/product/${id}`,
  
  // Order endpoints - sesuai dengan route Laravel
  CREATE_ORDER: `${ORDER_API_BASE_URL}/api/orders`,
  GET_ORDER: (id) => `${ORDER_API_BASE_URL}/api/orders/${id}`,
  UPDATE_ORDER: (id) => `${ORDER_API_BASE_URL}/api/orders/${id}`,
  DELETE_ORDER: (id) => `${ORDER_API_BASE_URL}/api/orders/${id}`
}; 