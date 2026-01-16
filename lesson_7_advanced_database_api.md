# Lesson 7: Advanced Database & API Best Practices

## Table of Contents
1. [Database Advanced Topics](#database-advanced-topics)
2. [API Best Practices](#api-best-practices)
3. [Practical Implementation](#practical-implementation)

---

## Part 1: Database Advanced Topics

### 1. Database Indexing

**What is Indexing?**
Indexes improve query performance by creating a data structure that allows faster lookups.

**Why you need this:**
- Without indexes, MongoDB scans every document (slow!)
- With indexes, MongoDB jumps directly to matching documents (fast!)
- Like a book index: instead of reading every page, you check the index

**Real-world example:**
- Finding a user by email without index: checks 1 million users one by one
- Finding a user by email with index: finds user instantly

**Performance impact:**
```
Without index: 1000ms (1 second)
With index: 5ms (200x faster!)
```

#### Creating Indexes in Mongoose

```typescript
// src/models/user.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IUser extends Document {
  firstName: string;
  lastName: string;
  email: string;
  password: string;
}

const UserSchema = new Schema<IUser>({
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    index: true // Simple index
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true, // Creates unique index
    lowercase: true,
    index: true
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [6, 'Password must be at least 6 characters']
  }
}, {
  timestamps: true
});

// Compound index (multiple fields)
UserSchema.index({ firstName: 1, lastName: 1 });

// Text index for search
UserSchema.index({ firstName: 'text', lastName: 'text', email: 'text' });

export const User = mongoose.model<IUser>('User', UserSchema);
```

**Index Types Explained:**

1. **Simple Index** (`index: true`)
   - Speeds up queries on single field
   - Example: Finding user by email
   ```typescript
   User.findOne({ email: 'john@example.com' }) // Fast with index!
   ```
   
   **Output:**
   ```json
   {
     "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
     "firstName": "John",
     "lastName": "Doe",
     "email": "john@example.com",
     "createdAt": "2024-01-15T10:30:00.000Z"
   }
   ```

2. **Unique Index** (`unique: true`)
   - Ensures no duplicate values
   - Automatically creates index
   - Example: Email must be unique
   ```typescript
   // This will fail if email already exists
   User.create({ email: 'john@example.com' })
   ```

3. **Compound Index** (multiple fields)
   - Speeds up queries using multiple fields together
   - Example: Search by first name AND last name
   ```typescript
   User.find({ firstName: 'John', lastName: 'Doe' }) // Fast!
   ```
   
   **Output:**
   ```json
   [
     {
       "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
       "firstName": "John",
       "lastName": "Doe",
       "email": "john@example.com"
     }
   ]
   ```

4. **Text Index** (for search)
   - Enables full-text search
   - Example: Search users by name or email
   ```typescript
   User.find({ $text: { $search: 'john' } }) // Searches all text fields
   ```
   
   **Output:**
   ```json
   [
     {
       "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
       "firstName": "John",
       "lastName": "Doe",
       "email": "john@example.com"
     },
     {
       "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
       "firstName": "Johnny",
       "lastName": "Smith",
       "email": "johnny@example.com"
     }
   ]
   ```

#### Product Model with Indexes

```typescript
// src/models/product.model.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IProduct extends Document {
  name: string;
  price: number;
  description?: string;
  category: string;
  inStock: boolean;
  quantity: number;
  images: string[];
}

const productSchema = new Schema<IProduct>({
  name: {
    type: String,
    required: [true, "Name is required"],
    index: true
  },
  price: {
    type: Number,
    required: [true, "Price is required"],
    index: true
  },
  description: {
    type: String,
  },
  category: {
    type: String,
    required: [true, "Category is required"],
    index: true
  },
  inStock: {
    type: Boolean,
    default: true,
    index: true
  },
  quantity: {
    type: Number,
    default: 1,
  },
  images: {
    type: [String],
    default: []
  }
}, {
  timestamps: true
});

// Compound index for common queries
productSchema.index({ category: 1, price: 1 });
productSchema.index({ inStock: 1, category: 1 });

// Text index for search
productSchema.index({ name: 'text', description: 'text' });

export const Product = mongoose.model<IProduct>("products", productSchema);
```

---

### 2. Transactions

**What are Transactions?**
Transactions ensure multiple database operations succeed or fail together (ACID properties).

**Why you need this:**
- Prevents data inconsistency
- All operations succeed together, or all fail together
- No partial updates that break your data

**Real-world example:**
Imagine ordering a product:
1. Reduce product quantity (stock - 1)
2. Create order record

**Without transaction:**
- Step 1 succeeds (stock reduced)
- Step 2 fails (order not created)
- Result: Lost inventory! Stock reduced but no order exists

**With transaction:**
- Step 1 succeeds (stock reduced)
- Step 2 fails (order not created)
- Transaction rolls back: Stock is restored automatically!
- Result: Data stays consistent

**Think of it like:**
Bank transfer: Money leaves your account AND enters recipient's account, or neither happens.

#### Example: Order with Inventory Update

```typescript
// src/models/order.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IOrder extends Document {
  user: mongoose.Types.ObjectId;
  products: {
    product: mongoose.Types.ObjectId;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  status: string;
}

const OrderSchema = new Schema<IOrder>({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  products: [{
    product: {
      type: Schema.Types.ObjectId,
      ref: 'products',
      required: true
    },
    quantity: {
      type: Number,
      required: true
    },
    price: {
      type: Number,
      required: true
    }
  }],
  totalAmount: {
    type: Number,
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'processing', 'completed', 'cancelled'],
    default: 'pending'
  }
}, {
  timestamps: true
});

export const Order = mongoose.model<IOrder>('Order', OrderSchema);
```

```typescript
// src/controllers/order.controller.ts
import mongoose from 'mongoose';
import { Request, Response } from 'express';
import { Order } from '../models/order.model';
import { Product } from '../models/product.model';
import { AuthRequest } from '../middlewares/authenticate';

export const createOrder = async (req: AuthRequest, res: Response) => {
  const session = await mongoose.startSession();
  session.startTransaction();

  try {
    const { products } = req.body;
    const userId = req.user?.id;

    let totalAmount = 0;
    const orderProducts = [];

    // Check stock and calculate total
    for (const item of products) {
      const product = await Product.findById(item.productId).session(session);

      if (!product) {
        throw new Error(`Product ${item.productId} not found`);
      }

      if (product.quantity < item.quantity) {
        throw new Error(`Insufficient stock for ${product.name}`);
      }

      // Update product quantity
      product.quantity -= item.quantity;
      if (product.quantity === 0) {
        product.inStock = false;
      }
      await product.save({ session });

      orderProducts.push({
        product: product._id,
        quantity: item.quantity,
        price: product.price
      });

      totalAmount += product.price * item.quantity;
    }

    // Create order
    const order = await Order.create([{
      user: userId,
      products: orderProducts,
      totalAmount,
      status: 'pending'
    }], { session });

    // Commit transaction
    await session.commitTransaction();

    res.status(201).json({
      success: true,
      message: 'Order created successfully',
      data: order[0]
    });
  } catch (error: any) {
    // Rollback transaction on error
    await session.abortTransaction();
    
    res.status(400).json({
      success: false,
      message: error.message
    });
  } finally {
    session.endSession();
  }
};
```

**Transaction Flow Explained:**

```
1. Start Session
   ↓
2. Start Transaction
   ↓
3. Check Product Stock ──→ [If fails] ──→ Rollback & Return Error
   ↓
4. Update Product Quantity ──→ [If fails] ──→ Rollback & Return Error
   ↓
5. Create Order ──→ [If fails] ──→ Rollback & Return Error
   ↓
6. Commit Transaction (All changes saved!)
   ↓
7. End Session
```

**Key Points:**
- `session.startTransaction()`: Begins tracking changes
- `await product.save({ session })`: Changes tracked but not saved yet
- `session.commitTransaction()`: Saves all changes permanently
- `session.abortTransaction()`: Cancels all changes (rollback)
- `session.endSession()`: Cleanup (always runs in finally block)

**Testing the Transaction:**
```bash
# Create order (will reduce stock and create order)
curl -X POST http://localhost:8080/api/v1/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -d '{
    "products": [
      {"productId": "123", "quantity": 2}
    ]
  }'
```

**Success Output:**
```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
    "user": "64f8a1b2c3d4e5f6a7b8c9d1",
    "products": [
      {
        "product": "64f8a1b2c3d4e5f6a7b8c9d2",
        "quantity": 2,
        "price": 999.99
      }
    ],
    "totalAmount": 1999.98,
    "status": "pending",
    "createdAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Output (Insufficient Stock):**
```json
{
  "success": false,
  "message": "Insufficient stock for Laptop"
}
```

**Error Output (Product Not Found):**
```json
{
  "success": false,
  "message": "Product 123 not found"
}
```

**Note:** If product doesn't exist or insufficient stock, no order is created and stock is NOT reduced - database stays consistent!

---

### 3. Aggregation Pipelines

**What is Aggregation?**

Aggregation is MongoDB's way of processing and analyzing data to get meaningful insights. Think of it as running reports on your data.

**Simple Explanation:**
- **Regular Query**: "Give me all products" → Returns raw data
- **Aggregation**: "Give me average price per category" → Returns calculated insights

**Why You Need This:**

1. **Business Analytics** - Get sales reports, inventory summaries
2. **Dashboard Data** - Calculate statistics for admin dashboards
3. **Performance** - MongoDB does calculations, not your app
4. **Complex Queries** - Group, filter, sort, calculate in one query

**Real-World Use Cases:**
- E-commerce: "Total sales per category this month"
- Social Media: "Most active users this week"
- Inventory: "Products running low on stock"
- Analytics: "Average order value by customer"

**How It Works:**

Aggregation uses a "pipeline" - data flows through stages, each stage transforms the data:

```
Raw Data (1000 products)
    ↓
[Stage 1: Filter] → Only in-stock (800 products)
    ↓
[Stage 2: Group] → Group by category (3 groups)
    ↓
[Stage 3: Calculate] → Count, average, min, max
    ↓
[Stage 4: Sort] → Order by count
    ↓
[Stage 5: Format] → Clean output
    ↓
Final Result (3 category summaries)
```

**Common Aggregation Stages:**

| Stage | Purpose | Example |
|-------|---------|----------|
| `$match` | Filter documents | Only in-stock products |
| `$group` | Group by field | Group by category |
| `$sort` | Order results | Sort by price |
| `$project` | Select/format fields | Show only name, price |
| `$limit` | Limit results | Top 10 products |
| `$skip` | Skip documents | Pagination |
| `$lookup` | Join collections | Get user details |
| `$unwind` | Flatten arrays | Separate array items |

---

#### Example 1: Product Statistics by Category

**Goal:** Get total products, average price, min/max price for each category

```typescript
// src/controllers/product.controller.ts
export const getProductStats = async (req: Request, res: Response) => {
  try {
    const stats = await Product.aggregate([
      // Stage 1: Filter - Only in-stock products
      {
        $match: { inStock: true }
      },
      
      // Stage 2: Group - By category and calculate
      {
        $group: {
          _id: '$category',                    // Group by this field
          totalProducts: { $sum: 1 },          // Count documents
          avgPrice: { $avg: '$price' },        // Average price
          minPrice: { $min: '$price' },        // Lowest price
          maxPrice: { $max: '$price' },        // Highest price
          totalQuantity: { $sum: '$quantity' } // Sum all quantities
        }
      },
      
      // Stage 3: Sort - By total products (descending)
      {
        $sort: { totalProducts: -1 }
      },
      
      // Stage 4: Format - Clean output
      {
        $project: {
          category: '$_id',                        // Rename _id to category
          totalProducts: 1,                        // Include field
          avgPrice: { $round: ['$avgPrice', 2] },  // Round to 2 decimals
          minPrice: 1,
          maxPrice: 1,
          totalQuantity: 1,
          _id: 0                                   // Exclude _id
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: stats
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

**Test:**
```bash
curl http://localhost:8080/api/v1/products/stats
```

**Output:**
```json
{
  "success": true,
  "data": [
    {
      "category": "Electronics",
      "totalProducts": 150,
      "avgPrice": 299.99,
      "minPrice": 19.99,
      "maxPrice": 1299.99,
      "totalQuantity": 500
    },
    {
      "category": "Clothing",
      "totalProducts": 200,
      "avgPrice": 49.99,
      "minPrice": 9.99,
      "maxPrice": 199.99,
      "totalQuantity": 1000
    },
    {
      "category": "Books",
      "totalProducts": 100,
      "avgPrice": 24.99,
      "minPrice": 9.99,
      "maxPrice": 59.99,
      "totalQuantity": 300
    }
  ]
}
```

---

#### Example 2: Top 10 Most Expensive Products

**Goal:** Get the 10 most expensive in-stock products

```typescript
export const getTopProducts = async (req: Request, res: Response) => {
  try {
    const topProducts = await Product.aggregate([
      // Stage 1: Filter - Only in-stock
      {
        $match: { inStock: true }
      },
      
      // Stage 2: Sort - By price (highest first)
      {
        $sort: { price: -1 }
      },
      
      // Stage 3: Limit - Top 10 only
      {
        $limit: 10
      },
      
      // Stage 4: Format - Select fields
      {
        $project: {
          name: 1,
          price: 1,
          category: 1,
          quantity: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: topProducts.length,
      data: topProducts
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

**Test:**
```bash
curl http://localhost:8080/api/v1/products/top
```

**Output:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "MacBook Pro 16\"",
      "price": 2499.99,
      "category": "Electronics",
      "quantity": 15
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "iPhone 15 Pro Max",
      "price": 1999.99,
      "category": "Electronics",
      "quantity": 30
    }
  ]
}
``` Sort - By price (highest first)
      {
        $sort: { price: -1 }
      },
      
      // Stage 3: Limit - Top 10 only
      {
        $limit: 10
      },
      
      // Stage 4: Format - Select fields
      {
        $project: {
          name: 1,
          price: 1,
          category: 1,
          quantity: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: topProducts.length,
      data: topProducts
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

**Test:**
```bash
curl http://localhost:8080/api/v1/products/top
```

**Output:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "MacBook Pro 16\"",
      "price": 2499.99,
      "category": "Electronics",
      "quantity": 15
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "iPhone 15 Pro Max",
      "price": 1999.99,
      "category": "Electronics",
      "quantity": 30
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d2",
      "name": "Gaming Laptop",
      "price": 1799.99,
      "category": "Electronics",
      "quantity": 20
    }
  ]
}
```

---

#### Example 3: Low Stock Alert

**Goal:** Find products with quantity less than 10

```typescript
export const getLowStockProducts = async (req: Request, res: Response) => {
  try {
    const lowStock = await Product.aggregate([
      // Stage 1: Filter - Low quantity
      {
        $match: {
          quantity: { $lt: 10 },
          inStock: true
        }
      },
      
      // Stage 2: Sort - Lowest quantity first
      {
        $sort: { quantity: 1 }
      },
      
      // Stage 3: Format
      {
        $project: {
          name: 1,
          category: 1,
          quantity: 1,
          price: 1,
          alert: {
            $concat: ['Only ', { $toString: '$quantity' }, ' left!']
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      count: lowStock.length,
      data: lowStock
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

**Output:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Wireless Keyboard",
      "category": "Accessories",
      "quantity": 3,
      "price": 49.99,
      "alert": "Only 3 left!"
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "USB-C Hub",
      "category": "Accessories",
      "quantity": 5,
      "price": 39.99,
      "alert": "Only 5 left!"
    }
  ]
}
```

---

#### Example 4: Price Range Distribution

**Goal:** Count products in different price ranges

```typescript
export const getPriceDistribution = async (req: Request, res: Response) => {
  try {
    const distribution = await Product.aggregate([
      {
        $bucket: {
          groupBy: '$price',
          boundaries: [0, 50, 100, 500, 1000, 5000],
          default: '5000+',
          output: {
            count: { $sum: 1 },
            products: { $push: '$name' }
          }
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: distribution
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

**Output:**
```json
{
  "success": true,
  "data": [
    {
      "_id": 0,
      "count": 50,
      "products": ["USB Cable", "Mouse Pad", "..."]
    },
    {
      "_id": 50,
      "count": 100,
      "products": ["Wireless Mouse", "Keyboard", "..."]
    },
    {
      "_id": 100,
      "count": 75,
      "products": ["Headphones", "Webcam", "..."]
    }
  ]
}
```

---

**Aggregation Operators Quick Reference:**

**Arithmetic:**
- `$sum` - Add values
- `$avg` - Calculate average
- `$min` - Find minimum
- `$max` - Find maximum
- `$multiply` - Multiply values
- `$divide` - Divide values

**String:**
- `$concat` - Join strings
- `$toUpper` - Uppercase
- `$toLower` - Lowercase
- `$substr` - Substring

**Comparison:**
- `$eq` - Equal
- `$gt` - Greater than
- `$lt` - Less than
- `$gte` - Greater than or equal
- `$lte` - Less than or equal

**Logical:**
- `$and` - All conditions true
- `$or` - Any condition true
- `$not` - Negate condition

 true }
      },
      {
        $sort: { price: -1 }
      },
      {
        $limit: 10
      },
      {
        $project: {
          name: 1,
          price: 1,
          category: 1,
          quantity: 1
        }
      }
    ]);

    res.status(200).json({
      success: true,
      data: topProducts
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

### 4. Population & References

**What is Population?**
Population automatically replaces specified paths in the document with documents from other collections.

**Why you need this:**
- Avoid storing duplicate data
- Keep data normalized (organized)
- Link related data across collections

**Think of it like:**
Foreign keys in SQL databases - connecting tables together.

**Real-world example:**

**Without Population (Bad - Duplicate Data):**
```json
// Review document
{
  "_id": "review123",
  "rating": 5,
  "comment": "Great product!",
  "user": {
    "_id": "user456",
    "firstName": "John",
    "lastName": "Doe",
    "email": "john@example.com"
  },
  "product": {
    "_id": "prod789",
    "name": "Laptop",
    "price": 999
  }
}
// Problem: If user changes email, you must update ALL reviews!
```

**With Population (Good - Reference Only):**
```json
// Review document (stored)
{
  "_id": "review123",
  "rating": 5,
  "comment": "Great product!",
  "user": "user456",      // Just the ID!
  "product": "prod789"    // Just the ID!
}

// When you populate (retrieved)
{
  "_id": "review123",
  "rating": 5,
  "comment": "Great product!",
  "user": {
    "_id": "user456",
    "firstName": "John",
    "lastName": "Doe"
  },
  "product": {
    "_id": "prod789",
    "name": "Laptop",
    "price": 999
  }
}
// Benefit: User data stored once, always up-to-date!
```

#### Models with References

```typescript
// src/models/review.model.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IReview extends Document {
  product: mongoose.Types.ObjectId;
  user: mongoose.Types.ObjectId;
  rating: number;
  comment: string;
}

const ReviewSchema = new Schema<IReview>({
  product: {
    type: Schema.Types.ObjectId,
    ref: 'products',
    required: true
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  rating: {
    type: Number,
    required: true,
    min: 1,
    max: 5
  },
  comment: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

export const Review = mongoose.model<IReview>('Review', ReviewSchema);
```

#### Using Population

```typescript
// src/controllers/review.controller.ts
import { Request, Response } from 'express';
import { Review } from '../models/review.model';
import { AuthRequest } from '../middlewares/authenticate';

export const createReview = async (req: AuthRequest, res: Response) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user?.id;

    const review = await Review.create({
      product: productId,
      user: userId,
      rating,
      comment
    });

    res.status(201).json({
      success: true,
      data: review
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getProductReviews = async (req: Request, res: Response) => {
  try {
    const { productId } = req.params;

    const reviews = await Review.find({ product: productId })
      .populate('user', 'firstName lastName email')
      .populate('product', 'name price')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};

export const getUserReviews = async (req: AuthRequest, res: Response) => {
  try {
    const userId = req.user?.id;

    const reviews = await Review.find({ user: userId })
      .populate('product', 'name price images')
      .sort({ createdAt: -1 });

    res.status(200).json({
      success: true,
      count: reviews.length,
      data: reviews
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

### 5. Database Seeding

**What is Seeding?**
Seeding populates the database with initial data for development or testing.

```typescript
// src/scripts/seed.ts
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { Product } from '../models/product.model';
import { User } from '../models/user.model';
import bcrypt from 'bcryptjs';

dotenv.config();

const products = [
  {
    name: 'Laptop Pro',
    price: 1299.99,
    description: 'High-performance laptop',
    category: 'Electronics',
    quantity: 50,
    inStock: true
  },
  {
    name: 'Wireless Mouse',
    price: 29.99,
    description: 'Ergonomic wireless mouse',
    category: 'Accessories',
    quantity: 200,
    inStock: true
  },
  {
    name: 'USB-C Cable',
    price: 12.99,
    description: 'Fast charging cable',
    category: 'Accessories',
    quantity: 500,
    inStock: true
  }
];

const seedDatabase = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI || '');
    console.log('✅ Connected to MongoDB');

    // Clear existing data
    await Product.deleteMany({});
    await User.deleteMany({});
    console.log('🗑️  Cleared existing data');

    // Seed products
    await Product.insertMany(products);
    console.log('✅ Products seeded');

    // Seed admin user
    const hashedPassword = await bcrypt.hash('admin123', 12);
    await User.create({
      firstName: 'Admin',
      lastName: 'User',
      email: 'admin@example.com',
      password: hashedPassword
    });
    console.log('✅ Admin user created');

    console.log('🎉 Database seeded successfully');
    process.exit(0);
  } catch (error) {
    console.error('❌ Seeding failed:', error);
    process.exit(1);
  }
};

seedDatabase();
```

Add to package.json:
```json
"scripts": {
  "seed": "ts-node src/scripts/seed.ts"
}
```

Run: `npm run seed`

---

## Part 2: API Best Practices

### 1. Pagination

**Why Pagination?**
Prevents loading too much data at once, improving performance.

**Why you need this:**
- Loading 10,000 products at once crashes browsers
- Wastes bandwidth and memory
- Slow page load times
- Poor user experience

**Real-world example:**
Google search results: Shows 10 results per page, not all 1 million results!

**Without Pagination:**
```
Request: GET /api/v1/products
Response: 10,000 products (5MB of data)
Load time: 10 seconds ❌
Browser: Crashes or freezes ❌
```

**With Pagination:**
```
Request: GET /api/v1/products?page=1&limit=10
Response: 10 products (50KB of data)
Load time: 0.5 seconds ✅
Browser: Smooth and fast ✅
```

**How it works:**
```
Page 1: Products 1-10   (skip 0, limit 10)
Page 2: Products 11-20  (skip 10, limit 10)
Page 3: Products 21-30  (skip 20, limit 10)
```

**Formula:**
```typescript
skip = (page - 1) * limit

// Example:
Page 1: skip = (1-1) * 10 = 0   → Get products 1-10
Page 2: skip = (2-1) * 10 = 10  → Get products 11-20
Page 3: skip = (3-1) * 10 = 20  → Get products 21-30
```

```typescript
// src/utils/pagination.helper.ts
export interface PaginationParams {
  page: number;
  limit: number;
  skip: number;
}

export const getPaginationParams = (
  page: string | undefined,
  limit: string | undefined
): PaginationParams => {
  const pageNum = parseInt(page || '1');
  const limitNum = parseInt(limit || '10');
  const skip = (pageNum - 1) * limitNum;

  return {
    page: pageNum,
    limit: limitNum,
    skip
  };
};

export interface PaginationResult<T> {
  success: boolean;
  data: T[];
  pagination: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  };
}
```

```typescript
// src/controllers/product.controller.ts
import { getPaginationParams } from '../utils/pagination.helper';

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(
      req.query.page as string,
      req.query.limit as string
    );

    const products = await Product.find()
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalItems = await Product.countDocuments();
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      }
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

### 2. Filtering & Sorting

```typescript
// src/controllers/product.controller.ts
export const getFilteredProducts = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(
      req.query.page as string,
      req.query.limit as string
    );

    // Build filter object
    const filter: any = {};

    if (req.query.category) {
      filter.category = req.query.category;
    }

    if (req.query.inStock) {
      filter.inStock = req.query.inStock === 'true';
    }

    if (req.query.minPrice || req.query.maxPrice) {
      filter.price = {};
      if (req.query.minPrice) {
        filter.price.$gte = parseFloat(req.query.minPrice as string);
      }
      if (req.query.maxPrice) {
        filter.price.$lte = parseFloat(req.query.maxPrice as string);
      }
    }

    // Build sort object
    let sort: any = { createdAt: -1 }; // Default sort

    if (req.query.sortBy) {
      const sortField = req.query.sortBy as string;
      const sortOrder = req.query.sortOrder === 'asc' ? 1 : -1;
      sort = { [sortField]: sortOrder };
    }

    // Execute query
    const products = await Product.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit);

    const totalItems = await Product.countDocuments(filter);
    const totalPages = Math.ceil(totalItems / limit);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages,
        totalItems,
        itemsPerPage: limit,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      filters: filter
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

**Example API Calls:**
```bash
GET /api/v1/products?page=1&limit=10
GET /api/v1/products?category=Electronics&inStock=true
GET /api/v1/products?minPrice=100&maxPrice=500
GET /api/v1/products?sortBy=price&sortOrder=asc
GET /api/v1/products?category=Electronics&sortBy=price&sortOrder=desc&page=2
```

**Sample Output:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Wireless Mouse",
      "price": 29.99,
      "category": "Electronics",
      "inStock": true,
      "quantity": 50
    }
  ],
  "pagination": {
    "currentPage": 1,
    "totalPages": 5,
    "totalItems": 50,
    "itemsPerPage": 10,
    "hasNextPage": true,
    "hasPrevPage": false
  },
  "filters": {
    "category": "Electronics",
    "inStock": true
  }
}
```

---

### 3. Search Functionality

```typescript
// src/controllers/product.controller.ts
export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query; // Search query
    const { page, limit, skip } = getPaginationParams(
      req.query.page as string,
      req.query.limit as string
    );

    if (!q) {
      return res.status(400).json({
        success: false,
        message: 'Search query is required'
      });
    }

    // Text search (requires text index)
    const products = await Product.find(
      { $text: { $search: q as string } },
      { score: { $meta: 'textScore' } }
    )
      .sort({ score: { $meta: 'textScore' } })
      .skip(skip)
      .limit(limit);

    const totalItems = await Product.countDocuments({
      $text: { $search: q as string }
    });

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        itemsPerPage: limit
      },
      searchQuery: q
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

**Alternative: Regex Search**
```typescript
export const searchProductsRegex = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;

    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    });

    res.status(200).json({
      success: true,
      data: products
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
};
```

---

### 4. Response Formatting/Standardization

```typescript
// src/utils/response.helper.ts
export interface ApiResponse<T> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  pagination?: {
    currentPage: number;
    totalPages: number;
    totalItems: number;
    itemsPerPage: number;
  };
}

export const successResponse = <T>(
  data: T,
  message?: string
): ApiResponse<T> => {
  return {
    success: true,
    message,
    data
  };
};

export const errorResponse = (
  error: string,
  message?: string
): ApiResponse<null> => {
  return {
    success: false,
    message,
    error
  };
};

export const paginatedResponse = <T>(
  data: T[],
  page: number,
  totalPages: number,
  totalItems: number,
  itemsPerPage: number
): ApiResponse<T[]> => {
  return {
    success: true,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems,
      itemsPerPage
    }
  };
};
```

**Usage:**
```typescript
// src/controllers/product.controller.ts
import { successResponse, errorResponse } from '../utils/response.helper';

export const getProductById = async (req: Request, res: Response) => {
  try {
    const product = await Product.findById(req.params.id);

    if (!product) {
      return res.status(404).json(
        errorResponse('Product not found')
      );
    }

    res.status(200).json(
      successResponse(product, 'Product retrieved successfully')
    );
  } catch (error: any) {
    res.status(500).json(
      errorResponse(error.message, 'Failed to retrieve product')
    );
  }
};
```

---

### 5. API Versioning

**Why API Versioning?**
- Maintain backward compatibility
- Allow gradual migration
- Support multiple client versions

#### Current Implementation (v1)

```typescript
// src/app.ts
import express from 'express';
import userRouter from './routes/users';
import productsRouter from './routes/products';

const app = express();

// API v1
const apiV1 = express.Router();
apiV1.use('/users', userRouter);
apiV1.use('/products', productsRouter);
app.use('/api/v1', apiV1);

export default app;
```

#### Adding v2 with Breaking Changes

```typescript
// src/routes/v2/products.ts
import { Router } from 'express';
import { getAllProductsV2 } from '../../controllers/v2/product.controller';

const router = Router();

router.get('/', getAllProductsV2);

export default router;
```

```typescript
// src/controllers/v2/product.controller.ts
export const getAllProductsV2 = async (req: Request, res: Response) => {
  try {
    const products = await Product.find();

    // V2 returns different structure
    res.status(200).json({
      status: 'success',
      results: products.length,
      items: products, // Changed from 'data' to 'items'
      version: 'v2'
    });
  } catch (error: any) {
    res.status(500).json({
      status: 'error',
      message: error.message
    });
  }
};
```

```typescript
// src/app.ts
import productsRouterV1 from './routes/products';
import productsRouterV2 from './routes/v2/products';

// API v1
const apiV1 = express.Router();
apiV1.use('/products', productsRouterV1);
app.use('/api/v1', apiV1);

// API v2
const apiV2 = express.Router();
apiV2.use('/products', productsRouterV2);
app.use('/api/v2', apiV2);
```

**API Calls:**
```
GET /api/v1/products  → Old format
GET /api/v2/products  → New format
```

---

## Part 3: Complete Implementation

### Updated Product Routes

```typescript
// src/routes/products.ts
import { Router } from "express";
import {
  getAllProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct,
  getProductStats,
  getTopProducts,
  searchProducts
} from "../controllers/product.controller";
import authenticate from "../middlewares/authenticate";

const router = Router();

router.get("/", getAllProducts);
router.get("/search", searchProducts);
router.get("/stats", getProductStats);
router.get("/top", getTopProducts);
router.get("/:id", getProductById);
router.post("/", authenticate, createProduct);
router.put("/:id", authenticate, updateProduct);
router.delete("/:id", authenticate, deleteProduct);

export default router;
```

### Complete Product Controller

```typescript
// src/controllers/product.controller.ts
import { Request, Response } from "express";
import { Product } from "../models/product.model";
import { getPaginationParams } from "../utils/pagination.helper";
import { successResponse, errorResponse } from "../utils/response.helper";

export const getAllProducts = async (req: Request, res: Response) => {
  try {
    const { page, limit, skip } = getPaginationParams(
      req.query.page as string,
      req.query.limit as string
    );

    const filter: any = {};
    if (req.query.category) filter.category = req.query.category;
    if (req.query.inStock) filter.inStock = req.query.inStock === 'true';

    const products = await Product.find(filter)
      .skip(skip)
      .limit(limit)
      .sort({ createdAt: -1 });

    const totalItems = await Product.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: products,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(totalItems / limit),
        totalItems,
        itemsPerPage: limit
      }
    });
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

export const searchProducts = async (req: Request, res: Response) => {
  try {
    const { q } = req.query;
    
    if (!q) {
      return res.status(400).json(
        errorResponse('Search query required')
      );
    }

    const products = await Product.find({
      $or: [
        { name: { $regex: q, $options: 'i' } },
        { description: { $regex: q, $options: 'i' } }
      ]
    });

    res.status(200).json(successResponse(products));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};

export const getProductStats = async (req: Request, res: Response) => {
  try {
    const stats = await Product.aggregate([
      { $match: { inStock: true } },
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' }
        }
      },
      { $sort: { totalProducts: -1 } }
    ]);

    res.status(200).json(successResponse(stats));
  } catch (error: any) {
    res.status(500).json(errorResponse(error.message));
  }
};
```

---

## Summary

### Database Advanced Topics
✅ Indexing for performance
✅ Transactions for data integrity
✅ Aggregation for analytics
✅ Population for relationships
✅ Seeding for initial data

### API Best Practices
✅ Pagination for large datasets
✅ Filtering & sorting
✅ Search functionality
✅ Standardized responses
✅ API versioning

---

## Testing Examples

```bash
# Pagination
curl "http://localhost:8080/api/v1/products?page=1&limit=10"

# Filtering
curl "http://localhost:8080/api/v1/products?category=Electronics&inStock=true"

# Sorting
curl "http://localhost:8080/api/v1/products?sortBy=price&sortOrder=asc"

# Search
curl "http://localhost:8080/api/v1/products/search?q=laptop"

# Stats
curl "http://localhost:8080/api/v1/products/stats"

# Combined
curl "http://localhost:8080/api/v1/products?category=Electronics&sortBy=price&page=2&limit=5"
```

**Search Output Example:**
```json
{
  "success": true,
  "data": [
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d0",
      "name": "Laptop Pro 15\"",
      "price": 1299.99,
      "description": "High-performance laptop for professionals",
      "category": "Electronics"
    },
    {
      "_id": "64f8a1b2c3d4e5f6a7b8c9d1",
      "name": "Gaming Laptop",
      "price": 1599.99,
      "description": "Powerful gaming laptop with RTX graphics",
      "category": "Electronics"
    }
  ],
  "searchQuery": "laptop"
}
```


