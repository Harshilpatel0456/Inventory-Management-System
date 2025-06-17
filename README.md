<h1># 🧠 SmartStock – Inventory Management System
</h1>
A professional inventory tracking dashboard built with **Next.js**, **TypeScript**, and **Tailwind CSS**, featuring user roles, product catalogs, stock & sales tracking, and reports.

---

## 📸 App Screenshots:
Note: If you are unable to view the images then you can go to the assets folder and view the images.
* **Login Page**
  ![Login page](./assets/1.png)

* **Admin Dashboard**
  ![Admin dashboard with stats & low-stock alerts](./assets/dashboard_admin.png)

* **Products List**
  ![Product inventory table with codes, prices, stock, actions](./assets/products.png)

* **Stock Management**
  ![Stock levels view with current status](./assets/stock.png)

* **Sales Management**
  ![Sales summary and top-selling products chart](./assets/sales.png)

* **Reports & Analytics**
  ![Product sales performance table](./assets/reports.png)

* **User Management**
  ![Admin view of users with roles and statuses](./assets/users.png)

* **User Dashboard**
  ![User dashboard (non-admin) showing allowed views](./assets/dashboard_user.png)

---

## 🛠️ Features

* **Authentication & Roles** – Supports Admin and User roles
* **Product Management** – Add/edit/delete products with SKU, category, price
* **Stock Tracking** – Monitor current stock levels, low-stock alerts, record movements
* **Sales Recording** – Manage sales transactions per customer
* **Reporting** – Generate business insights with summaries and charts
* **User Management** – Admins can manage existing accounts

---

## 📁 Tech Stack

* **Next.js** (`app/`, `components/`, `hooks/`, `contexts/`)
* **TypeScript** – Type safety across the codebase
* **Tailwind CSS** – Responsive, utility-first styling
* **PostCSS** – CSS optimizations
* **pnpm** – Efficient dependency management
* **Firebase** (or alternative) – Backend for auth and data (inferred)
* **Charts** – For analytics and visual reports (via Chart.js or similar)

---

## 🚀 Getting Started

### Prerequisites

* **Node.js** v18+
* **pnpm** installed globally (`npm install -g pnpm`)
* Environment variables in `.env.local` (see `.env.example`)you need to create the .env.local file and put your databade url in it

### Installation

```bash
git clone https://github.com/harshilpatel/Inventory_Management_System.git
cd Inventory_Management_System
pnpm install
```

### Configuration

* Copy `.env.example` to `.env.local`
* Add your credentials:

  ```
  NEXT_PUBLIC_FIREBASE_API_KEY=...
  NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=...
  NEXT_PUBLIC_FIREBASE_PROJECT_ID=...
  NEXT_PUBLIC_FIREBASE_DATABASE_URL=...
  # Add others as required
  ```

### Run Locally

```bash
pnpm dev
```

🎉 Visit [http://localhost:3000](http://localhost:3000) to access the app.

---

## ✅ Project Structure

```
/
├── app/               # Next.js app routes & pages
├── components/        # UI elements including forms, tables, headers...
├── contexts/          # React Context providers (Auth, Products...)
├── hooks/             # Custom hooks for logic reuse
├── lib/               # API helpers, utilities, constants
├── public/            # Static assets (images)
├── styles/            # Tailwind/custom CSS
├── .env.local         # Runtime environment variables
├── next.config.mjs    # Next.js config
├── tailwind.config.ts # Tailwind setup
├── tsconfig.json      # TypeScript config
└── pnpm-lock.yaml     # Lock file
```

---

## 🧑‍💼 Roles and Access

* **Admin** – Manage users, view and edit products, stock, sales, and generate reports
* **User** – View dashboard, products, stock, sales; no access to user management

---

## 📦 Deployment

Recommended platform: [**Vercel**](https://vercel.com/) – excellent for Next.js projects.

**How to deploy**:

1. Connect your GitHub repo to Vercel
2. Ensure environment variables are configured in the Vercel dashboard
3. Trigger deployment, and Vercel will handle the build

---

## 🔧 Contributing

1. Fork this repo
2. Create a feature branch (`git checkout -b feature/new-feature`)
3. Commit your changes (`git commit -m "Add feature"`)
4. Push to branch (`git push origin feature/new-feature`)
5. Open a Pull Request

---

## 📄 License

Distributed under the **MIT License**.

---

## 📫 Contact

Built and maintained by **Harshil Patel** — [GitHub](https://github.com/Harshilpatel0456) | Email: `harshilapatel2006@gmail.com`

