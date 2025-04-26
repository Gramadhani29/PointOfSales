const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:3000',
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
}));
app.use(express.json());

// Add request logging middleware
app.use((req, res, next) => {
  console.log(`${req.method} ${req.url}`);
  console.log('Request body:', req.body);
  next();
});

// MySQL Connection
const db = mysql.createConnection({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'pos_db'
});

// Check database connection
db.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL:', err);
    return;
  }
  console.log('Connected to MySQL database');
  
  // Check if database exists
  db.query('SELECT DATABASE()', (err, result) => {
    if (err) {
      console.error('Error checking database:', err);
      return;
    }
    console.log('Current database:', result[0]['DATABASE()']);
  });

  // Create tables if they don't exist
  const createProductsTable = `
    CREATE TABLE IF NOT EXISTS products (
      id INT AUTO_INCREMENT PRIMARY KEY,
      product_name VARCHAR(255) NOT NULL,
      product_category VARCHAR(255) NOT NULL,
      product_price DECIMAL(10,2) NOT NULL,
      product_image VARCHAR(255) DEFAULT '-'
    )
  `;

  const createOrdersTable = `
    CREATE TABLE IF NOT EXISTS orders (
      id INT AUTO_INCREMENT PRIMARY KEY,
      customer_name VARCHAR(255) NOT NULL,
      total_amount DECIMAL(10,2) NOT NULL,
      created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    )
  `;

  const createOrderItemsTable = `
    CREATE TABLE IF NOT EXISTS order_items (
      id INT AUTO_INCREMENT PRIMARY KEY,
      order_id INT NOT NULL,
      product_id INT NOT NULL,
      quantity INT NOT NULL,
      FOREIGN KEY (order_id) REFERENCES orders(id),
      FOREIGN KEY (product_id) REFERENCES products(id)
    )
  `;

  db.query(createProductsTable, (err) => {
    if (err) throw err;
    console.log('Products table created or already exists');
  });

  db.query(createOrdersTable, (err) => {
    if (err) throw err;
    console.log('Orders table created or already exists');
  });

  db.query(createOrderItemsTable, (err) => {
    if (err) throw err;
    console.log('Order items table created or already exists');
  });
});

// Product API Routes
app.get('/api/products', (req, res) => {
  console.log('GET /api/products');
  db.query('SELECT * FROM products', (err, results) => {
    if (err) {
      console.error('Error fetching products:', err);
      res.status(500).json({ message: err.message });
      return;
    }
    console.log('Products fetched:', results);
    res.json(results);
  });
});

app.post('/api/products', (req, res) => {
  console.log('POST /api/products', req.body);
  const { product_name, product_category, product_price, product_image } = req.body;
  db.query(
    'INSERT INTO products (product_name, product_category, product_price, product_image) VALUES (?, ?, ?, ?)',
    [product_name, product_category, product_price, product_image],
    (err, result) => {
      if (err) {
        console.error('Error creating product:', err);
        res.status(400).json({ message: err.message });
        return;
      }
      console.log('Product created:', result);
      res.status(201).json({ id: result.insertId, ...req.body });
    }
  );
});

// Order API Routes
app.get('/api/orders', (req, res) => {
  const query = `
    SELECT o.*, 
           GROUP_CONCAT(
             CONCAT(p.product_name, ' x', oi.quantity)
             SEPARATOR ', '
           ) as items
    FROM orders o
    LEFT JOIN order_items oi ON o.id = oi.order_id
    LEFT JOIN products p ON oi.product_id = p.id
    GROUP BY o.id
  `;
  
  db.query(query, (err, results) => {
    if (err) {
      res.status(500).json({ message: err.message });
      return;
    }
    res.json(results);
  });
});

app.post('/api/orders', (req, res) => {
  const { customer_name, items } = req.body;
  console.log('Received order request:', { customer_name, items });
  
  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      res.status(500).json({ message: 'Error starting transaction' });
      return;
    }

    // Calculate total amount
    let totalAmount = 0;
    const productPrices = {};

    // Get all product prices
    const productIds = items.map(item => item.product_id);
    console.log('Fetching prices for products:', productIds);
    
    db.query(
      'SELECT id, product_price FROM products WHERE id IN (?)',
      [productIds],
      (err, results) => {
        if (err) {
          console.error('Error fetching product prices:', err);
          db.rollback(() => {
            res.status(500).json({ message: 'Error fetching product prices' });
          });
          return;
        }

        console.log('Product prices:', results);

        // Store product prices
        results.forEach(product => {
          productPrices[product.id] = product.product_price;
        });

        // Calculate total amount
        items.forEach(item => {
          totalAmount += productPrices[item.product_id] * item.quantity;
        });

        console.log('Calculated total amount:', totalAmount);

        // Insert order
        db.query(
          'INSERT INTO orders (customer_name, total_amount) VALUES (?, ?)',
          [customer_name, totalAmount],
          (err, result) => {
            if (err) {
              console.error('Error inserting order:', err);
              db.rollback(() => {
                res.status(500).json({ message: 'Error inserting order' });
              });
              return;
            }

            const orderId = result.insertId;
            console.log('Order created with ID:', orderId);

            // Insert order items
            const orderItems = items.map(item => [orderId, item.product_id, item.quantity]);
            console.log('Inserting order items:', orderItems);
            
            db.query(
              'INSERT INTO order_items (order_id, product_id, quantity) VALUES ?',
              [orderItems],
              (err) => {
                if (err) {
                  console.error('Error inserting order items:', err);
                  db.rollback(() => {
                    res.status(500).json({ message: 'Error inserting order items' });
                  });
                  return;
                }

                // Commit transaction
                db.commit((err) => {
                  if (err) {
                    console.error('Error committing transaction:', err);
                    db.rollback(() => {
                      res.status(500).json({ message: 'Error committing transaction' });
                    });
                    return;
                  }

                  console.log('Order created successfully');
                  res.status(201).json({
                    id: orderId,
                    customer_name,
                    total_amount: totalAmount,
                    items
                  });
                });
              }
            );
          }
        );
      }
    );
  });
});

// Delete all orders
app.delete('/api/orders', (req, res) => {
  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      res.status(500).json({ message: 'Error starting transaction' });
      return;
    }

    // First delete all order items
    db.query('DELETE FROM order_items', (err) => {
      if (err) {
        console.error('Error deleting all order items:', err);
        db.rollback(() => {
          res.status(500).json({ message: 'Error deleting all order items' });
        });
        return;
      }

      // Then delete all orders
      db.query('DELETE FROM orders', (err) => {
        if (err) {
          console.error('Error deleting all orders:', err);
          db.rollback(() => {
            res.status(500).json({ message: 'Error deleting all orders' });
          });
          return;
        }

        // Commit transaction
        db.commit((err) => {
          if (err) {
            console.error('Error committing transaction:', err);
            db.rollback(() => {
              res.status(500).json({ message: 'Error committing transaction' });
            });
            return;
          }

          res.json({ message: 'All orders deleted successfully' });
        });
      });
    });
  });
});

// Delete single order
app.delete('/api/orders/:id', (req, res) => {
  const orderId = parseInt(req.params.id, 10); // Convert ID to integer
  
  if (isNaN(orderId)) {
    res.status(400).json({ message: 'Invalid order ID' });
    return;
  }

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      res.status(500).json({ message: 'Error starting transaction' });
      return;
    }

    // First delete order items
    db.query('DELETE FROM order_items WHERE order_id = ?', [orderId], (err) => {
      if (err) {
        console.error('Error deleting order items:', err);
        db.rollback(() => {
          res.status(500).json({ message: 'Error deleting order items' });
        });
        return;
      }

      // Then delete the order
      db.query('DELETE FROM orders WHERE id = ?', [orderId], (err, result) => {
        if (err) {
          console.error('Error deleting order:', err);
          db.rollback(() => {
            res.status(500).json({ message: 'Error deleting order' });
          });
          return;
        }

        if (result.affectedRows === 0) {
          db.rollback(() => {
            res.status(404).json({ message: 'Order not found' });
          });
          return;
        }

        // Commit transaction
        db.commit((err) => {
          if (err) {
            console.error('Error committing transaction:', err);
            db.rollback(() => {
              res.status(500).json({ message: 'Error committing transaction' });
            });
            return;
          }

          res.json({ message: 'Order deleted successfully' });
        });
      });
    });
  });
});

// Delete product
app.delete('/api/products/:id', (req, res) => {
  console.log('DELETE /api/products/:id', req.params);
  const productId = parseInt(req.params.id, 10);

  if (isNaN(productId)) {
    console.error('Invalid product ID:', req.params.id);
    res.status(400).json({ message: 'Invalid product ID' });
    return;
  }

  console.log('Attempting to delete product:', productId);

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      res.status(500).json({ message: 'Error starting transaction' });
      return;
    }

    // First check if product is used in any order
    db.query('SELECT COUNT(*) as count FROM order_items WHERE product_id = ?', [productId], (err, results) => {
      if (err) {
        console.error('Error checking product usage:', err);
        db.rollback(() => {
          res.status(500).json({ message: 'Error checking product usage' });
        });
        return;
      }

      console.log('Product usage check results:', results);
      const count = results[0].count;
      if (count > 0) {
        console.log('Product is used in orders, cannot delete');
        db.rollback(() => {
          res.status(400).json({ message: 'Cannot delete product as it is used in orders' });
        });
        return;
      }

      // If product is not used in any order, delete it
      db.query('DELETE FROM products WHERE id = ?', [productId], (err, result) => {
        if (err) {
          console.error('Error deleting product:', err);
          db.rollback(() => {
            res.status(500).json({ message: 'Error deleting product' });
          });
          return;
        }

        console.log('Delete result:', result);
        if (result.affectedRows === 0) {
          console.log('Product not found');
          db.rollback(() => {
            res.status(404).json({ message: 'Product not found' });
          });
          return;
        }

        // Commit transaction
        db.commit((err) => {
          if (err) {
            console.error('Error committing transaction:', err);
            db.rollback(() => {
              res.status(500).json({ message: 'Error committing transaction' });
            });
            return;
          }

          console.log('Product deleted successfully');
          res.json({ message: 'Product deleted successfully' });
        });
      });
    });
  });
});

// Update product
app.put('/api/products/:id', (req, res) => {
  console.log('PUT /api/products/:id', req.params, req.body);
  const productId = parseInt(req.params.id, 10);
  const { product_name, product_category, product_price, product_image } = req.body;

  if (isNaN(productId)) {
    console.error('Invalid product ID:', req.params.id);
    res.status(400).json({ message: 'Invalid product ID' });
    return;
  }

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      res.status(500).json({ message: 'Error starting transaction' });
      return;
    }

    // Update product
    db.query(
      'UPDATE products SET product_name = ?, product_category = ?, product_price = ?, product_image = ? WHERE id = ?',
      [product_name, product_category, product_price, product_image, productId],
      (err, result) => {
        if (err) {
          console.error('Error updating product:', err);
          db.rollback(() => {
            res.status(500).json({ message: 'Error updating product' });
          });
          return;
        }

        if (result.affectedRows === 0) {
          db.rollback(() => {
            res.status(404).json({ message: 'Product not found' });
          });
          return;
        }

        // Commit transaction
        db.commit((err) => {
          if (err) {
            console.error('Error committing transaction:', err);
            db.rollback(() => {
              res.status(500).json({ message: 'Error committing transaction' });
            });
            return;
          }

          // Get updated product
          db.query('SELECT * FROM products WHERE id = ?', [productId], (err, results) => {
            if (err) {
              console.error('Error fetching updated product:', err);
              res.status(500).json({ message: 'Product updated but failed to fetch updated data' });
              return;
            }

            console.log('Product updated successfully');
            res.json(results[0]);
          });
        });
      }
    );
  });
});

// Update order
app.put('/api/orders/:id', (req, res) => {
  console.log('PUT /api/orders/:id', req.params, req.body);
  const orderId = parseInt(req.params.id, 10);
  const { customer_name, items } = req.body;

  if (isNaN(orderId)) {
    console.error('Invalid order ID:', req.params.id);
    res.status(400).json({ message: 'Invalid order ID' });
    return;
  }

  // Start transaction
  db.beginTransaction((err) => {
    if (err) {
      console.error('Error starting transaction:', err);
      res.status(500).json({ message: 'Error starting transaction' });
      return;
    }

    // First get the product IDs and their prices
    const productNames = items.map(item => item.product_name);
    db.query(
      'SELECT id, product_name, product_price FROM products WHERE product_name IN (?)',
      [productNames],
      (err, products) => {
        if (err) {
          console.error('Error fetching product details:', err);
          db.rollback(() => {
            res.status(500).json({ message: 'Error fetching product details' });
          });
          return;
        }

        // Create a map of product names to their IDs and prices
        const productMap = {};
        products.forEach(product => {
          productMap[product.product_name] = {
            id: product.id,
            price: product.product_price
          };
        });

        // Calculate new total amount
        let totalAmount = 0;
        const orderItems = items.map(item => {
          const product = productMap[item.product_name];
          if (!product) return null;
          totalAmount += product.price * item.quantity;
          return [orderId, product.id, item.quantity];
        });

        if (orderItems.includes(null)) {
          db.rollback(() => {
            res.status(400).json({ message: 'One or more products not found' });
          });
          return;
        }

        // Update order details
        db.query(
          'UPDATE orders SET customer_name = ?, total_amount = ? WHERE id = ?',
          [customer_name, totalAmount, orderId],
          (err, result) => {
            if (err) {
              console.error('Error updating order:', err);
              db.rollback(() => {
                res.status(500).json({ message: 'Error updating order' });
              });
              return;
            }

            if (result.affectedRows === 0) {
              db.rollback(() => {
                res.status(404).json({ message: 'Order not found' });
              });
              return;
            }

            // Delete existing order items
            db.query('DELETE FROM order_items WHERE order_id = ?', [orderId], (err) => {
              if (err) {
                console.error('Error deleting existing order items:', err);
                db.rollback(() => {
                  res.status(500).json({ message: 'Error updating order items' });
                });
                return;
              }

              // Insert new order items
              db.query(
                'INSERT INTO order_items (order_id, product_id, quantity) VALUES ?',
                [orderItems],
                (err) => {
                  if (err) {
                    console.error('Error inserting new order items:', err);
                    db.rollback(() => {
                      res.status(500).json({ message: 'Error updating order items' });
                    });
                    return;
                  }

                  // Commit transaction
                  db.commit((err) => {
                    if (err) {
                      console.error('Error committing transaction:', err);
                      db.rollback(() => {
                        res.status(500).json({ message: 'Error committing transaction' });
                      });
                      return;
                    }

                    // Get updated order with items
                    const query = `
                      SELECT o.*, 
                             GROUP_CONCAT(
                               CONCAT(p.product_name, ' x', oi.quantity)
                               SEPARATOR ', '
                             ) as items
                      FROM orders o
                      LEFT JOIN order_items oi ON o.id = oi.order_id
                      LEFT JOIN products p ON oi.product_id = p.id
                      WHERE o.id = ?
                      GROUP BY o.id
                    `;

                    db.query(query, [orderId], (err, results) => {
                      if (err) {
                        console.error('Error fetching updated order:', err);
                        res.status(500).json({ message: 'Order updated but failed to fetch updated data' });
                        return;
                      }

                      console.log('Order updated successfully');
                      res.json(results[0]);
                    });
                  });
                }
              );
            });
          }
        );
      }
    );
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
}); 