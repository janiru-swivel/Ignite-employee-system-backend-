---
# **User Management Backend**

This project is a backend application built with **Node.js**, **Express.js**, and **MongoDB** to manage user operations such as creating, reading, updating, and deleting users. It includes input validations, middleware, and robust error handling.
---

## **Features**

- **User Operations**:

  - Create a new user
  - Fetch all users
  - Get user details by ID
  - Update user information
  - Delete a user

- **Validations**:

  - Input validation for required fields and data types.
  - Centralized middleware for reusability.

- **Error Handling**:

  - Handles client and server errors with appropriate HTTP status codes.

- **Scalable Code Structure**:
  - Organized with controllers, routes, models, and middleware.

---

## **Tech Stack**

- **Backend**: Node.js, Express.js
- **Database**: MongoDB (with Mongoose)
- **Validation**: Middleware-based input validation
- **Environment Variables**: `dotenv` for configuration management

---

## **Installation**

### **1. Clone the Repository**

```bash
git clone https://github.com/JaniruWickramage/user-management-backend.git
cd user-management-backend
```

### **2. Install Dependencies**

```bash
npm install
```

### **3. Set Environment Variables**

Create a `.env` file in the project root and add the following:

```plaintext
PORT=8000
MONGO_URL=mongodb+srv://<username>:<password>@<cluster>.mongodb.net/<database>?retryWrites=true&w=majority
```

### **4. Start the Server**

```bash
npm start
```

The server will run at `http://localhost:8000` by default (or the port specified in `.env`).

---

## **API Endpoints**

### **Base URL**: `/api`

| **Method** | **Endpoint**       | **Description**        | **Payload**                                                  |
| ---------- | ------------------ | ---------------------- | ------------------------------------------------------------ |
| POST       | `/user`            | Create a new user      | `{ firstName, lastName, email, phoneNumber, gender }`        |
| GET        | `/users`           | Get all users          | None                                                         |
| GET        | `/user/:id`        | Get user details by ID | None                                                         |
| PUT        | `/update/user/:id` | Update user details    | Any of `{ firstName, lastName, email, phoneNumber, gender }` |
| DELETE     | `/delete/user/:id` | Delete user by ID      | None                                                         |

---

