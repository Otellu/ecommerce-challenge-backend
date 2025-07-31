# E-commerce Backend Challenge

Welcome to the E-commerce Backend Challenge! You have **90 minutes** to implement key API endpoints for an e-commerce system.

## 🚀 Quick Start

```bash
npm run dev
```

Server starts on `http://localhost:3000`

**Test Credentials:**

- **Seller**: `seller@test.com` / `password123`
- **Customer**: `customer@test.com` / `password123`

---

# 🎯 **Your Tasks**

## **TASK 1: Product Management APIs** (25-30 min)

Implement product listing, creation, and deletion with pagination and category filtering.

**File**: `src/controllers/productController.ts`

### GET /api/products - Product Listing

**Query Parameters**: `page`, `limit`, `category`

<details>
<summary>Response Format</summary>

```json
{
  "success": true,
  "page": 1,
  "limit": 20,
  "totalResults": 45,
  "products": [
    {
      "id": "507f1f77bcf86cd799439011",
      "name": "MacBook Pro M3",
      "price": 1999.99,
      "stock": 25,
      "category": "computers",
      "images": ["https://example.com/macbook.jpg"]
    }
  ]
}
```

</details>

### POST /api/products - Create Product (Seller Only)

<details>
<summary>Request Body</summary>

```json
{
  "name": "MacBook Pro M3",
  "description": "Powerful laptop for professionals",
  "price": 1999.99,
  "stock": 25,
  "category": "computers",
  "images": ["https://example.com/macbook.jpg"]
}
```

</details>

<details>
<summary>Response</summary>

```json
{
  "success": true,
  "message": "Product created successfully",
  "data": {
    "productId": "507f1f77bcf86cd799439011"
  }
}
```

</details>

### DELETE /api/products/:id - Soft Delete Product (Seller Only)

<details>
<summary>Response</summary>

```json
{
  "success": true,
  "message": "Product soft-deleted successfully"
}
```

</details>

**✅ Success Criteria**: Pagination, category filtering, seller-only access, proper error handling

---

## **TASK 2: Order Management APIs** (30-35 min)

Implement order creation with stock validation and atomic updates.

**File**: `src/controllers/orderController.ts`

### POST /api/orders - Create Order

<details>
<summary>Request Body</summary>

```json
{
  "items": [
    {
      "productId": "507f1f77bcf86cd799439011",
      "quantity": 2
    }
  ],
  "shippingAddress": {
    "street": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  }
}
```

</details>

<details>
<summary>Response</summary>

```json
{
  "success": true,
  "message": "Order created successfully",
  "data": {
    "orderId": "507f1f77bcf86cd799439013",
    "status": "pending",
    "totalAmount": 3999.98,
    "items": [
      {
        "productId": "507f1f77bcf86cd799439011",
        "name": "MacBook Pro M3",
        "quantity": 2,
        "price": 1999.99
      }
    ]
  }
}
```

</details>

**✅ Success Criteria**: Stock validation, atomic updates, total calculation, customer-only access

---

## **TASK 3: Review System APIs** (20-25 min)

Implement product reviews with purchase verification and duplicate prevention.

**File**: `src/controllers/reviewController.ts`

### POST /api/reviews - Create Review

<details>
<summary>Request Body</summary>

```json
{
  "productId": "507f1f77bcf86cd799439011",
  "orderId": "507f1f77bcf86cd799439013",
  "rating": 5,
  "comment": "Excellent product! Highly recommended."
}
```

</details>

<details>
<summary>Response</summary>

```json
{
  "success": true,
  "message": "Review created successfully",
  "data": {
    "reviewId": "507f1f77bcf86cd799439015",
    "productId": "507f1f77bcf86cd799439011",
    "rating": 5,
    "comment": "Excellent product! Highly recommended.",
    "isVerifiedPurchase": true,
    "customerName": "John Doe",
    "createdAt": "2024-01-15T10:30:00Z"
  }
}
```

</details>

**✅ Success Criteria**: Purchase verification, duplicate prevention, rating validation, customer-only access

---

## **TASK 4: Analytics APIs** (15-20 min)

Implement sales analytics with date range validation and aggregation.

**File**: `src/controllers/analyticsController.ts`

### GET /api/analytics/sales - Sales Analytics

**Query Parameters**: `dateFrom`, `dateTo`

<details>
<summary>Response</summary>

```json
{
  "success": true,
  "dateRange": {
    "from": "2024-01-01",
    "to": "2024-01-31"
  },
  "totalRevenue": 15499.95,
  "mostSoldProduct": {
    "productId": "507f1f77bcf86cd799439011",
    "name": "MacBook Pro M3",
    "unitsSold": 15
  },
  "averageOrderValue": 1291.66
}
```

</details>

**✅ Success Criteria**: Date validation, revenue calculation, most sold product, seller-only access

---

# 🧪 Testing

```bash
# Run all tests
npm test

# Test specific APIs
npm test -- --testNamePattern="Product APIs"
npm test -- --testNamePattern="Order APIs"
npm test -- --testNamePattern="Review APIs"
npm test -- --testNamePattern="Analytics APIs"
```

**Current Status**: 64 total tests, 35 passing (54.7%) - Your goal is to make all tests pass!

## ⚠️ **IMPORTANT**: Response Format Requirements

<div style="color: red; font-weight: bold; background-color: #ffe6e6; padding: 10px; border-left: 4px solid red; margin: 10px 0;">

**Your API response objects MUST exactly match the formats shown in this README. The tests are written based on these specific response structures. Any deviation will cause test failures.**

</div>

---

# 📋 API Reference

| Method | Endpoint               | Auth | Role     |
| ------ | ---------------------- | ---- | -------- |
| GET    | `/api/products`        | No   | -        |
| POST   | `/api/products`        | Yes  | Seller   |
| DELETE | `/api/products/:id`    | Yes  | Seller   |
| POST   | `/api/orders`          | Yes  | Customer |
| POST   | `/api/reviews`         | Yes  | Customer |
| GET    | `/api/analytics/sales` | Yes  | Seller   |

**Authentication**: `Authorization: Bearer <jwt-token>`

**Error Response**:

```json
{
  "success": false,
  "message": "Error description"
}
```

---

# 🏆 Success Criteria

- [ ] All 4 tasks implemented
- [ ] All 64 tests passing
- [ ] Proper error handling
- [ ] Authentication/authorization working
- [ ] Code follows TypeScript best practices

## 🚨 Important Notes

- Check `src/routes/*.ts` files for validation schemas
- Read TODO comments in controller files
- Test frequently with `npm test`
- Focus on core functionality first
- Handle errors gracefully
- **Ensure response formats match exactly what's shown in this README**

**Good luck! 🚀**
