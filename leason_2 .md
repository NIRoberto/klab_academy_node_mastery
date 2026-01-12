
## 1. New Packages and Their Usage

* What npm packages are
* Why we install packages
* Common packages used in a Node.js project
* How to install and use packages in an application

---

## 2. Middleware (Built-in and Custom)

### What is Middleware?

Middleware is a function that runs **between** the request and the response.
It can:

* Read the request
* Modify the request or response
* End the request-response cycle
* Pass control to the next middleware

### Types of Middleware

* **Built-in Middleware**

  * Provided by Express (e.g. `express.json()`, `express.urlencoded()`)
* **Custom Middleware**

  * Middleware that we create ourselves
  * Used for things like logging, authentication, validation, etc.

---

## 3. Node.js Application Basic Structure

A well-structured Node.js application usually includes:

### Routes (Resources)

* Define application endpoints (URLs)
* Handle incoming requests
* Example resources:

  * `/users`
  * `/products`

### Controllers

* Contain the main logic of the application
* Keep routes clean and simple
* Handle actions such as:

  * Creating users
  * Fetching products
  * Updating data

**Example controllers:**

* Users controller
* Products controller

> Controllers are functions that separate business logic from routes, making the code easier to maintain and test.

### Models

* Represent the data structure
* Define how data is stored and managed
* Usually connected to a database
* Examples:

  * User model
  * Product model

---

## 4. REST and CRUD Basics

### What is REST?

REST stands for **Representational State Transfer**.

REST is a way of **designing APIs** so that applications can communicate with each other over the internet in a clear and consistent way.

### RESTful APIsESTful API follows REST rules and conventions to manage resources like users and products.

---

## 5. REST Principles

1. **Client–Server Separation**

   * Client (frontend) and server (backend) are independent
   * Each has its own responsibilities

2. **Stateless**

   * Each request must contain all the information needed
   * The server does not store client session data

3. **Uniform Interface**

   * Resources are accessed using consistent URLs
   * Example:

     * `/users`
     * `/users/:id`

4. **HTTP Methods and Their Meaning**

   * `GET` → Fetch data
   * `POST` → Create data
   * `PUT` → Update entire data
   * `PATCH` → Update part of data
   * `DELETE` → Remove data

5. **Standard Responses**

   * Use proper status codes
   * Return consistent JSON responses

---

## 6. CRUD Operations

CRUD represents the four basic operations in an application:

* **Create** → `POST`
* **Read** → `GET`
* **Update** → `PUT` / `PATCH`
* **Delete** → `DELETE`

---

## 7. Requests and Responses

### Request Methods

* `GET`
* `POST`
* `PUT`
* `PATCH`
* `DELETE`

### Status Codes

* `200` – Success
* `201` – Created
* `400` – Bad Request
* `401` – Unauthorized
* `404` – Not Found
* `500` – Server Error

### JSON Responses

* Data is sent and received in JSON format

### Query Parameters and Body Parsing

* **Query parameters**: used for filtering and searching
* **Request body**: used to send data when creating or updating resources


