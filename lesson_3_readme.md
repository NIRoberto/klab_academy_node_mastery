# Lesson 3: MongoDB Integration & Authentication

## 1. Database Integration with MongoDB

### What is MongoDB?

MongoDB is a **NoSQL database** that stores data in flexible, JSON-like documents.

**Key Definitions:**
- **NoSQL Database** - A database that doesn't use traditional table structure, stores data in flexible formats
- **Document** - A record in MongoDB, similar to a JSON object with key-value pairs
- **Collection** - A group of documents, similar to a table in SQL databases
- **BSON** - Binary JSON format that MongoDB uses internally to store documents
- **Schema-less** - No predefined structure required, documents can have different fields

### What is Mongoose?

**Mongoose** is an **ODM (Object Document Mapper)** that makes working with MongoDB easier.

**Without Mongoose (Raw MongoDB):**
```javascript
// Complex and error-prone
db.collection('products').insertOne({
  name: 'Laptop',
  price: 999
}, (err, result) => {
  if (err) throw err;
  console.log(result);
});
```

**With Mongoose (Clean & Simple):**
```typescript
// Clean and validated
const product = new Product({ name: 'Laptop', price: 999 });
await product.save();
```

### Schema and Models

**Technical Definitions:**

**Schema** - A Mongoose schema defines the structure, data types, validation rules, and default values for documents in a MongoDB collection. It acts as a blueprint that enforces data consistency and integrity.

**Model** - A Mongoose model is a compiled version of a schema that provides an interface to interact with a specific MongoDB collection. It includes methods for querying, creating, updating, and deleting documents.


**Code Example:**
```typescript
// Schema - defines structure and validation rules
const UserSchema = new Schema({
  name: { type: String, required: true, maxlength: 50 },
  email: { type: String, required: true, unique: true },
  age: { type: Number, min: 18, max: 100 }
});

// Model - compiled schema with database methods
const User = mongoose.model('User', UserSchema);

// Using the model to interact with database
const user = new User({ name: 'John', email: 'john@email.com', age: 25 });
await user.save(); // CREATE
const users = await User.find(); // READ
await User.findByIdAndUpdate(id, { age: 26 }); // UPDATE
await User.findByIdAndDelete(id); // DELETE
```

**Key Differences:**

| Schema | Model |
|---|---|
| **Definition** - Structure and rules | **Implementation** - Database operations |
| Validation, types, defaults | Create, read, update, delete methods |
| `new Schema({ ... })` | `mongoose.model('Name', schema)` |
| Blueprint/template | Working interface |

**Process:**
1. **Define Schema** - Set structure and validation rules
2. **Compile Model** - Create database interface from schema
3. **Use Model** - Perform database operations

### Why Use Mongoose?

* **Schema validation** - Ensures data quality
* **Type safety** - Works great with TypeScript
* **Middleware hooks** - Run code before/after operations
* **Query building** - Easier to write complex queries
* **Population** - Handle relationships between collections
* **Built-in validation** - Email validation, required fields, etc.

### Real-World Example

**E-commerce without database:**
```typescript
// ❌ Data lost on restart
let products = [
  { id: 1, name: 'Laptop', price: 999 }
];
```

**E-commerce with MongoDB:**
```typescript
// ✅ Data persisted permanently
const product = await Product.create({
  name: 'Laptop', 
  price: 999
});
```

### Installing MongoDB Packages

```bash
npm install mongoose dotenv
npm install -D @types/mongoose
```

### Key MongoDB Concepts

* **Collections** - Similar to tables in SQL databases
* **Documents** - Individual records (like rows in SQL)
* **Schema** - Structure definition for documents
* **Models** - JavaScript classes that interact with collections

---

## 2. Database Connection Setup

### Environment Variables

Environment variables keep sensitive information secure:

```bash
# .env file
MONGODB_URI=mongodb://localhost:27017/ecommerce
PORT=3000
NODE_ENV=development
```

### Database Connection

```typescript
// config/database.ts
import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    await mongoose.connect(process.env.MONGODB_URI!);
    console.log('MongoDB Connected');
  } catch (error) {
    console.error('Database connection failed:', error);
    process.exit(1);
  }
};
```

### Server Startup Order

**Important:** Always connect to database BEFORE starting the server

```typescript
// server.ts
const startServer = async () => {
  await connectDB();        // 1. Database first
  app.listen(PORT);         // 2. Then server
};
```

---

## 3. Creating Database Models

### What are Models?

Models define the **structure** and **validation rules** for your data.

### Product Model Example

```typescript
// models/Product.ts
import mongoose, { Schema, Document } from 'mongoose';

export interface IProduct extends Document {
  name: string;
  price: number;
  description?: string;
  category: string;
  inStock: boolean;
  quantity: number;
}

const ProductSchema = new Schema<IProduct>({
  name: { 
    type: String, 
    required: [true, 'Product name is required'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  price: { 
    type: Number, 
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  description: String,
  category: { 
    type: String, 
    required: [true, 'Category is required'],
    enum: ['electronics', 'clothing', 'books', 'home', 'sports']
  },
  inStock: { 
    type: Boolean, 
    default: true 
  },
  quantity: { 
    type: Number, 
    default: 0,
    min: [0, 'Quantity cannot be negative']
  }
}, {
  timestamps: true  // Automatically adds createdAt and updatedAt
});

export const Product = mongoose.model<IProduct>('Product', ProductSchema);
```

### Schema Validation Features

* **Required fields** - `required: true`
* **Data types** - `String`, `Number`, `Boolean`, `Date`
* **Min/Max values** - `min: 0`, `max: 100`
* **String length** - `maxlength: 100`
* **Enum values** - `enum: ['option1', 'option2']`
* **Default values** - `default: true`
* **Custom messages** - `required: [true, 'Custom error message']`

### Validation Examples

```typescript
// User Model with comprehensive validation
const UserSchema = new Schema({
  // Required field with custom message
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true
  },
  
  // String length validation
  name: {
    type: String,
    required: true,
    minlength: [2, 'Name must be at least 2 characters'],
    maxlength: [50, 'Name cannot exceed 50 characters'],
    trim: true  // Remove whitespace
  },
  
  // Number range validation
  age: {
    type: Number,
    min: [18, 'Must be at least 18 years old'],
    max: [100, 'Age cannot exceed 100']
  },
  
  // Enum validation
  status: {
    type: String,
    enum: {
      values: ['active', 'inactive', 'pending'],
      message: 'Status must be active, inactive, or pending'
    },
    default: 'pending'
  },
  
  // Custom validation function
  password: {
    type: String,
    required: true,
    validate: {
      validator: function(password: string) {
        return password.length >= 8 && /(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password);
      },
      message: 'Password must be at least 8 characters with uppercase, lowercase, and number'
    }
  },
  
  // Date validation
  birthDate: {
    type: Date,
    validate: {
      validator: function(date: Date) {
        return date < new Date();
      },
      message: 'Birth date cannot be in the future'
    }
  }
});
```

### What Happens When Validation Fails?

```typescript
// Example: Creating user with invalid data
try {
  const user = await User.create({
    email: '',           // ❌ Required field empty
    name: 'A',          // ❌ Too short (min: 2)
    age: 15,            // ❌ Below minimum (min: 18)
    status: 'unknown',  // ❌ Not in enum values
    password: '123'     // ❌ Doesn't meet custom validation
  });
} catch (error) {
  console.log(error.errors);
  // Returns detailed validation errors for each field
}
```

---

## 4. Common Mongoose Methods

### CREATE Methods

**Model.create()** - Creates one or more documents
```typescript
// Create single document
const product = await Product.create({
  name: 'Laptop',
  price: 999,
  category: 'electronics'
});

// Create multiple documents
const products = await Product.create([
  { name: 'Laptop', price: 999, category: 'electronics' },
  { name: 'Phone', price: 599, category: 'electronics' }
]);
```

**new Model() + save()** - Create instance then save
```typescript
const product = new Product({
  name: 'Laptop',
  price: 999
});
const savedProduct = await product.save();
```

**Model.insertMany()** - Insert multiple documents (faster for bulk)
```typescript
const products = await Product.insertMany([
  { name: 'Laptop', price: 999 },
  { name: 'Phone', price: 599 }
]);
```

### READ Methods

**Model.find()** - Find multiple documents
```typescript
// Find all products
const allProducts = await Product.find();

// Find with conditions
const electronics = await Product.find({ category: 'electronics' });

// Find with multiple conditions
const cheapElectronics = await Product.find({
  category: 'electronics',
  price: { $lt: 1000 }
});
```

**Model.findOne()** - Find single document
```typescript
// Find first matching document
const product = await Product.findOne({ name: 'Laptop' });

// Returns null if not found
if (!product) {
  console.log('Product not found');
}
```

**Model.findById()** - Find by MongoDB ObjectId
```typescript
const product = await Product.findById('64f8a1b2c3d4e5f6a7b8c9d0');

// With error handling
const product = await Product.findById(id);
if (!product) {
  throw new Error('Product not found');
}
```

**Model.findByIdAndUpdate()** - Find and update in one operation
```typescript
const updatedProduct = await Product.findByIdAndUpdate(
  id,
  { price: 899 },
  { new: true, runValidators: true }
);
```

**Model.findOneAndUpdate()** - Find by condition and update
```typescript
const updatedProduct = await Product.findOneAndUpdate(
  { name: 'Laptop' },
  { price: 899 },
  { new: true }
);
```

### UPDATE Methods

**Model.updateOne()** - Update single document
```typescript
const result = await Product.updateOne(
  { _id: id },
  { price: 899 }
);
console.log(result.modifiedCount); // Number of documents modified
```

**Model.updateMany()** - Update multiple documents
```typescript
const result = await Product.updateMany(
  { category: 'electronics' },
  { inStock: true }
);
console.log(result.modifiedCount);
```

**Model.replaceOne()** - Replace entire document
```typescript
const result = await Product.replaceOne(
  { _id: id },
  { name: 'New Laptop', price: 1299, category: 'electronics' }
);
```

### DELETE Methods

**Model.deleteOne()** - Delete single document
```typescript
const result = await Product.deleteOne({ _id: id });
console.log(result.deletedCount); // Number of documents deleted
```

**Model.deleteMany()** - Delete multiple documents
```typescript
const result = await Product.deleteMany({ category: 'electronics' });
console.log(result.deletedCount);
```

**Model.findByIdAndDelete()** - Find and delete by ID
```typescript
const deletedProduct = await Product.findByIdAndDelete(id);
if (deletedProduct) {
  console.log('Product deleted:', deletedProduct.name);
}
```

**Model.findOneAndDelete()** - Find and delete by condition
```typescript
const deletedProduct = await Product.findOneAndDelete({ name: 'Laptop' });
```

### QUERY Methods

**Model.countDocuments()** - Count documents
```typescript
const totalProducts = await Product.countDocuments();
const electronicsCount = await Product.countDocuments({ category: 'electronics' });
```

**Model.exists()** - Check if document exists
```typescript
const exists = await Product.exists({ name: 'Laptop' });
if (exists) {
  console.log('Product exists with ID:', exists._id);
}
```

**Model.distinct()** - Get distinct values
```typescript
const categories = await Product.distinct('category');
// Returns: ['electronics', 'clothing', 'books']
```

### QUERY CHAINING

**Chaining Methods** - Combine multiple query operations
```typescript
const products = await Product
  .find({ category: 'electronics' })  // Filter
  .select('name price')               // Select specific fields
  .sort({ price: -1 })               // Sort by price descending
  .limit(10)                         // Limit to 10 results
  .skip(20);                         // Skip first 20 results
```

**Common Query Options:**
```typescript
// Select specific fields
const products = await Product.find().select('name price -_id');

// Sort results
const products = await Product.find().sort({ createdAt: -1 }); // Newest first
const products = await Product.find().sort({ price: 1 });      // Cheapest first

// Pagination
const products = await Product.find()
  .skip((page - 1) * limit)
  .limit(limit);

// Population (join-like operation)
const cart = await Cart.findById(id).populate('items.productId');
```

### AGGREGATION Methods

**Model.aggregate()** - Complex data processing
```typescript
// Group products by category and count
const categoryStats = await Product.aggregate([
  {
    $group: {
      _id: '$category',
      count: { $sum: 1 },
      avgPrice: { $avg: '$price' }
    }
  }
]);
```

### Method Options

**Common Options for Update Methods:**
```typescript
const options = {
  new: true,           // Return updated document
  runValidators: true, // Run schema validation
  upsert: true        // Create if doesn't exist
};

const product = await Product.findByIdAndUpdate(id, data, options);
```

**Common Options for Find Methods:**
```typescript
const options = {
  lean: true,          // Return plain JavaScript objects (faster)
  populate: 'category', // Populate referenced fields
  select: 'name price', // Select specific fields
  sort: { createdAt: -1 } // Sort results
};

const products = await Product.find({}, null, options);
```

---

## 5. Database Operations (CRUD)

### Service Layer with Database

Replace in-memory arrays with database operations:

```typescript
// services/ProductService.ts
import { Product, IProduct } from '../models/Product';

// CREATE
export const createProduct = async (productData: Partial<IProduct>): Promise<IProduct> => {
  const product = new Product(productData);
  return await product.save();
};

// READ ALL
export const getAllProducts = async (filters: any = {}) => {
  const query: any = {};
  
  // Add filters
  if (filters.category) query.category = filters.category;
  if (filters.inStock !== undefined) query.inStock = filters.inStock;
  
  // Search functionality
  if (filters.search) {
    query.$or = [
      { name: { $regex: filters.search, $options: 'i' } },
      { description: { $regex: filters.search, $options: 'i' } }
    ];
  }

  return await Product.find(query).sort({ createdAt: -1 });
};

// READ ONE
export const getProductById = async (id: string): Promise<IProduct | null> => {
  return await Product.findById(id);
};

// UPDATE
export const updateProduct = async (id: string, updateData: Partial<IProduct>): Promise<IProduct | null> => {
  return await Product.findByIdAndUpdate(
    id, 
    updateData, 
    { new: true, runValidators: true }
  );
};

// DELETE
export const deleteProduct = async (id: string): Promise<boolean> => {
  const result = await Product.findByIdAndDelete(id);
  return !!result;
};
```
```

### Database Query Features

* **Filtering** - `Product.find({ category: 'electronics' })`
* **Searching** - `{ $regex: searchTerm, $options: 'i' }`
* **Sorting** - `.sort({ createdAt: -1 })`
* **Pagination** - `.skip(10).limit(5)`
* **Population** - `.populate('fieldName')` for references

---

## 5. Advanced Features

### Pagination

```typescript
export const getAllProducts = async (page = 1, limit = 10) => {
  const skip = (page - 1) * limit;
  
  const products = await Product.find()
    .skip(skip)
    .limit(limit)
    .sort({ createdAt: -1 });

  const total = await Product.countDocuments();

  return {
    products,
    pagination: {
      page,
      limit,
      total,
      pages: Math.ceil(total / limit)
    }
  };
};
```

### References Between Collections

```typescript
// Cart Model with Product References
const CartSchema = new Schema({
  userId: { type: String, required: true },
  items: [{
    productId: { 
      type: Schema.Types.ObjectId, 
      ref: 'Product',  // Reference to Product model
      required: true 
    },
    quantity: { type: Number, required: true, min: 1 },
    price: { type: Number, required: true }
  }],
  totalAmount: { type: Number, default: 0 }
});

// Populate referenced data
const cart = await Cart.findOne({ userId })
  .populate('items.productId', 'name price imageUrl');
```

---

## 6. Error Handling with Database

### Database Validation Errors

```typescript
// Controller with proper error handling
export const createProduct = async (req: Request, res: Response) => {
  try {
    const product = await createProduct(req.body);
    res.status(201).json({
      success: true,
      data: product,
      message: 'Product created successfully'
    });
  } catch (error: any) {
    // Handle Mongoose validation errors
    if (error.name === 'ValidationError') {
      const errors = Object.values(error.errors).map((err: any) => err.message);
      return res.status(400).json({
        error: 'Validation failed',
        details: errors
      });
    }
    
    // Handle duplicate key errors
    if (error.code === 11000) {
      return res.status(400).json({
        error: 'Duplicate entry',
        message: 'Resource already exists'
      });
    }

    res.status(500).json({ 
      error: 'Internal server error',
      message: error.message 
    });
  }
};
```
```

### Common Database Errors

* **ValidationError** - Schema validation failed
* **CastError** - Invalid ObjectId format
* **MongoError 11000** - Duplicate key violation
* **Connection errors** - Database unavailable

