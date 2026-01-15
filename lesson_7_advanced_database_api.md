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

4. **Text Index** (for search)
   - Enables full-text search
   - Example: Search users by name or email
   ```typescript
   User.find({ $text: { $search: 'john' } }) // Searches all text fields
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

# If product doesn't exist or insufficient stock:
# - No order created
# - Stock NOT reduced
# - Database stays consistent!
```

---

### 3. Aggregation Pipelines

**What is Aggregation?**
Aggregation operations process data records and return computed results.

**Why you need this:**
- Get statistics and analytics from your data
- Calculate totals, averages, min/max values
- Group data by categories
- More powerful than simple queries

**Think of it like:**
Excel pivot tables - group data, calculate sums, averages, etc.

**Real-world examples:**
- "How many products in each category?"
- "What's the average price per category?"
- "Which category has the most expensive product?"
- "Total inventory value per category?"

**Aggregation Pipeline Stages:**

```
All Products (1000 items)
    ↓
$match (filter) ──→ Only in-stock products (800 items)
    ↓
$group (group by category) ──→ Electronics: 200, Clothing: 300, Books: 300
    ↓
$sort (order results) ──→ Clothing (300), Books (300), Electronics (200)
    ↓
$project (format output) ──→ Clean, formatted results
    ↓
Final Result
```

#### Example: Product Statistics

```typescript
// src/controllers/product.controller.ts
export const getProductStats = async (req: Request, res: Response) => {
  try {
    const stats = await Product.aggregate([
      // Stage 1: Match only in-stock products
      {
        $match: { inStock: true }
      },
      // Stage 2: Group by category
      {
        $group: {
          _id: '$category',
          totalProducts: { $sum: 1 },
          avgPrice: { $avg: '$price' },
          minPrice: { $min: '$price' },
          maxPrice: { $max: '$price' },
          totalQuantity: { $sum: '$quantity' }
        }
      },
      // Stage 3: Sort by total products
      {
        $sort: { totalProducts: -1 }
      },
      // Stage 4: Add computed fields
      {
        $project: {
          category: '$_id',
          totalProducts: 1,
          avgPrice: { $round: ['$avgPrice', 2] },
          minPrice: 1,
          maxPrice: 1,
          totalQuantity: 1,
          _id: 0
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

**Understanding the Aggregation Stages:**

**Stage 1 - $match (Filter):**
```typescript
{ $match: { inStock: true } }
// Like: SELECT * FROM products WHERE inStock = true
// Filters out out-of-stock products
```

**Stage 2 - $group (Group & Calculate):**
```typescript
{
  $group: {
    _id: '$category',              // Group by category
    totalProducts: { $sum: 1 },    // Count products
    avgPrice: { $avg: '$price' },  // Average price
    minPrice: { $min: '$price' },  // Cheapest product
    maxPrice: { $max: '$price' }   // Most expensive product
  }
}
// Like: SELECT category, COUNT(*), AVG(price) FROM products GROUP BY category
```

**Stage 3 - $sort (Order Results):**
```typescript
{ $sort: { totalProducts: -1 } }
// -1 = descending (most products first)
// 1 = ascending (least products first)
```

**Stage 4 - $project (Format Output):**
```typescript
{
  $project: {
    category: '$_id',                    // Rename _id to category
    totalProducts: 1,                    // Include field
    avgPrice: { $round: ['$avgPrice', 2] }, // Round to 2 decimals
    _id: 0                               // Exclude _id
  }
}
```

**Example Output:**
```json
[
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
  }
]
```

**Test the Aggregation:**
```bash
curl http://localhost:8080/api/v1/products/stats
```

export const getTopProducts = async (req: Request, res: Response) => {
  try {
    const topProducts = await Product.aggregate([
      {
        $match: { inStock: true }
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
```
GET /api/v1/products?page=1&limit=10
GET /api/v1/products?category=Electronics&inStock=true
GET /api/v1/products?minPrice=100&maxPrice=500
GET /api/v1/products?sortBy=price&sortOrder=asc
GET /api/v1/products?category=Electronics&sortBy=price&sortOrder=desc&page=2
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
GET /api/v1/products?page=1&limit=10

# Filtering
GET /api/v1/products?category=Electronics&inStock=true

# Sorting
GET /api/v1/products?sortBy=price&sortOrder=asc

# Search
GET /api/v1/products/search?q=laptop

# Stats
GET /api/v1/products/stats

# Combined
GET /api/v1/products?category=Electronics&sortBy=price&page=2&limit=5
```


