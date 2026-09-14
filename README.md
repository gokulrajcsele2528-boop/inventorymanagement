# Inventory Management System (Full-Stack)

A modern, clean, and beginner-friendly **Inventory Management System** built with **React (Vite)**, **Python (Flask)**, and **PostgreSQL**.

---

## Tech Stack

* **Frontend**: React 18, Vite, Axios, Lucide React Icons, Pure CSS (Purple / White modern UI)
* **Backend**: Python 3, Flask, Flask-CORS, Flask-SQLAlchemy, Psycopg 3
* **Database**: PostgreSQL (with automatic zero-friction fallback to SQLite if PostgreSQL server is not locally running)

---

## Project Structure

```text
inventory-management/
│
├── inventory_frontend/             # React + Vite Client
│   ├── src/
│   │   ├── components/
│   │   │   ├── Login.jsx           # Clean authentication screen
│   │   │   ├── Sidebar.jsx         # Purple navigation sidebar with Lucide icons
│   │   │   ├── Header.jsx          # Top bar with user profile & dynamic headers
│   │   │   ├── Dashboard.jsx       # 4 Metric cards & Recent Inventory Activity feed
│   │   │   ├── Products.jsx        # Product table with Search, Edit, Delete, Stock triggers
│   │   │   ├── AddProductModal.jsx # Add & Edit product modal form
│   │   │   ├── StockManagement.jsx # Dedicated Stock In / Out operation center
│   │   │   ├── StockModal.jsx      # Quick stock adjustment dialog
│   │   │   ├── History.jsx         # Audit log table of all inventory actions
│   │   │   └── Settings.jsx        # Architecture, database status, and user session
│   │   ├── api.js                  # Axios client connecting frontend to Flask backend
│   │   ├── App.jsx                 # Application state & page routing
│   │   ├── index.css               # Clean purple/white modern styling
│   │   └── main.jsx                # React DOM entry point
│   ├── package.json
│   └── vite.config.js
│
└── inventory_backend/              # Python + Flask REST API
    ├── app.py                      # Flask server, CORS setup, and auto-seeding
    ├── config.py                   # PostgreSQL database configuration (.env loader)
    ├── models.py                   # SQLAlchemy models (products & inventory_history)
    ├── routes.py                   # REST API routes (Dashboard, Products, Stock, History)
    ├── requirements.txt            # Python dependencies
    └── .env.example                # PostgreSQL database connection credentials
```

---

## Getting Started

### 1. Start the Flask Backend

Open a terminal in the `inventory_backend` folder:

```bash
cd inventory_backend
python -m pip install -r requirements.txt
python app.py
```

* Backend runs on: `http://localhost:5000`
* Default PostgreSQL connection: `postgresql://postgres:postgres@localhost:5432/inventory_db`

> **Note**: If PostgreSQL is not currently running on your machine, the backend will automatically use a local SQLite file so you can immediately test all features without interruption.

### 2. Start the React Frontend

Open a new terminal in the `inventory_frontend` folder:

```bash
cd inventory_frontend
npm install
npm run dev
```

* Frontend runs on: `http://localhost:5173`

---

## Default Login Credentials

* **Email**: `admin@inventory.com`
* **Password**: `admin123`

---

## Database Schema

### 1. `products` Table
* `id` (Integer, Primary Key)
* `product_name` (String)
* `product_id` (String, Unique SKU)
* `category` (String)
* `price` (Float)
* `quantity` (Integer)
* `minimum_stock` (Integer)
* `created_at` (Timestamp)

### 2. `inventory_history` Table
* `id` (Integer, Primary Key)
* `product_id` (String)
* `action` (String - e.g. *Stock Added*, *Stock Removed*, *Product Added*, *Product Updated*, *Product Deleted*)
* `quantity` (Integer)
* `created_at` (Timestamp)

---

## How the Components Connect

```text
┌─────────────────────────┐
│     React Frontend      │
│ (State, Forms & Tables) │
└───────────┬─────────────┘
            │ Axios HTTP Requests (JSON)
            ▼
┌─────────────────────────┐
│      Flask Backend      │
│  (REST API & Validation)│
└───────────┬─────────────┘
            │ SQLAlchemy / Psycopg Driver
            ▼
┌─────────────────────────┐
│   PostgreSQL Database   │
│ (Products & Audit Logs) │
└─────────────────────────┘
```
