# 🐾 RescuePaw - Unified Management System

This is the complete, integrated ecosystem for the RescuePaw platform, including dashboards for **Admins, Vets, Refuges, and General Users**.

---

## 🚀 Quick Start Guide (For your mate)

Follow these 4 steps to get the entire project running on your local machine:

### 1. Install Dependencies
Open your terminal in the project folder and run:
`npm install`

### 2. Configure the Database
Create a file named `.env` in the root directory (if it's not already there) and add your MySQL connection string:
`DATABASE_URL="mysql://USER:PASSWORD@localhost:3306/DATABASE_NAME"`

### 3. Sync the Schema (ORM)
Run this command to build the database tables automatically:
`npx prisma db push`

### 4. Launch the Product
Start the unified server:
`node server.js`

---

## 🌐 Access Points
Once the server is running, you can access the different parts of the system here:

- **Main Sign In**: [http://localhost:3000/SignIn/SignInPage.html](http://localhost:3000/SignIn/SignInPage.html)
- **Admin Dashboard**: [http://localhost:3000/Admin/index.html](http://localhost:3000/Admin/index.html)
- **Vet Dashboard**: [http://localhost:3000/vet/home.html](http://localhost:3000/vet/home.html)
- **Refuge Dashboard**: [http://localhost:3000/refuge/Home.html](http://localhost:3000/refuge/Home.html)

---

## 🛠 Features Included (v2.5 UNIFIED)
- **Unified Logic**: All dashboards run on a single `server.js` instance.
- **ORM Integration**: Driven by Prisma for extreme data reliability.
- **Independent Admin Entrance**: Specialized login specifically for the Admin Vault.
- **Real-Time Analytics**: Live counting of users, vets, and reports.

---

**Built with ❤️ for RescuePaw Developers.**
