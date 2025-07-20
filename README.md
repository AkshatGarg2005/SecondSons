# SecondSons - Unified Local Services Platform 🏙️

**SecondSons** is a comprehensive multi-service platform that connects local businesses and service providers with customers, eliminating the need to juggle between multiple apps.

---

## 🚀 Features

### For Customers
* 🚕 **Cab Booking:** Book rides with local drivers instantly.
* 🛒 **Quick Commerce:** Get groceries and essentials delivered in 30 minutes.
* 🏠 **Home Rentals:** Find houses, apartments, PGs, and rooms.
* 🍔 **Food Delivery:** Order from your favorite local restaurants.
* 🔧 **Services on Demand:** Book plumbers, electricians, and other professionals.
* 📦 **Logistics:** Send packages across the city.

### For Service Providers
* 🍽️ **Restaurant Owners:** Manage menus, accept orders, and track deliveries.
* 🏘️ **Property Owners:** List properties and manage inquiries from potential tenants.
* 👷 **Service Workers:** Receive job assignments and track your earnings.
* 🚚 **Delivery Personnel:** Handle deliveries for food, groceries, and packages efficiently.

### For Administrators
* 👑 **Super Admin:** Get complete system oversight and control.
* 📊 **Service-specific Admins:** Manage individual service verticals.
* 📈 **Analytics Dashboard:** Track key performance indicators and revenue.
* 👤 **User Management:** Control access levels and user permissions.

---

## 🛠️ Tech Stack

* **Frontend:** Next.js 14, TypeScript, Tailwind CSS
* **Backend:** Firebase (Authentication, Firestore, Cloud Functions)
* **Storage:** Cloudinary
* **Package Manager:** Yarn
* **Deployment:** Vercel

---

## 📋 Prerequisites

Before you begin, ensure you have the following set up:
* Node.js (v14 or higher)
* Yarn package manager
* A Firebase account
* A Cloudinary account

---

## ⚡ Quick Start

1.  **Clone the repository**
    ```sh
    git clone <repository-url>
    cd secondsons
    ```

2.  **Install dependencies**
    ```sh
    yarn install
    ```

3.  **Set up environment variables**
    Create a `.env.local` file in the root directory and add your Firebase and Cloudinary credentials.
    *(See `SETUP_INSTRUCTIONS.md` for detailed instructions.)*

4.  **Run the development server**
    ```sh
    yarn dev
    ```

5.  **Open the application**
    Navigate to `http://localhost:3000` in your browser.

---

## 📖 Documentation

Detailed setup instructions are available in the `SETUP_INSTRUCTIONS.md` file.

---

## 🏗️ Project Structure
secondsons/
├── app/                # Next.js app directory
├── components/         # Reusable React components
├── contexts/           # React context providers
├── lib/                # Utility functions and configurations
├── types/              # TypeScript type definitions
└── public/             # Static assets

---

## 🔐 Security

* **Firebase Authentication** for secure user login and management.
* **Firestore security rules** to protect your database.
* **Environment variables** to keep sensitive keys and credentials safe.
* **Role-Based Access Control (RBAC)** to manage user permissions effectively.

---

## 🚀 Deployment

The application is optimized for seamless deployment on **Vercel**:

1.  Push your code to a GitHub repository.
2.  Import the repository into your Vercel account.
3.  Add the required environment variables in the project settings.
4.  Deploy! Vercel will handle the rest.

---

## 🤝 Contributing

Contributions are welcome! Please follow these steps:

1.  Fork the repository.
2.  Create your feature branch (`git checkout -b feature/AmazingFeature`).
3.  Commit your changes (`git commit -m 'Add some AmazingFeature'`).
4.  Push to the branch (`git push origin feature/AmazingFeature`).
5.  Open a Pull Request.

---

## 📄 License

This project is licensed under the **MIT License**.

---

## 🙏 Acknowledgments

* Built with **Next.js** and **Firebase**
* UI components styled with **Tailwind CSS**
* Icons from **React Icons**
* Image hosting by **Cloudinary**
