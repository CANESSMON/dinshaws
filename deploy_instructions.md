# Deployment Instructions: Dinshaw's Kiosk on Render

This guide provides step-by-step instructions for deploying your Next.js application and its PostgreSQL database to Render's Free tier.

---

## 1. 🗄️ Set Up PostgreSQL Database on Render

1. Go to **[dashboard.render.com](https://dashboard.render.com)** and log in.
2. Click **New** (top-right corner) ➔ **Database**.
3. Fill out the database details:
   * **Name**: `dinshaws-db`
   * **Database**: `dinshaws`
   * **Username**: `db_user`
   * **Region**: Choose the region closest to you (e.g., `Singapore` or `Oregon`).
   * **Instance Type**: **Free** ($0/month).
4. Click **Create Database**.
5. Wait for the status to show **Active**.
6. Scroll down to the **Connections** section and copy the **Internal Database URL**. It will look like this:
   `postgres://db_user:password@dpg-xxxxxx:5432/dinshaws`

> [!WARNING]
> Render's Free tier databases automatically expire and are deleted after **90 days**. For long-term production use, you should upgrade the database to the **Hobby tier** ($7/month) to prevent data loss.

---

## 🌐 Set Up Web Service (Next.js Application) on Render

1. On the Render dashboard, click **New** ➔ **Web Service**.
2. Connect your GitHub repository: `CANESSMON/dinshaws`.
3. Configure the Web Service settings:
   * **Name**: `dinshaws-kiosk`
   * **Region**: *Choose the same region you selected for the database.*
   * **Branch**: `main`
   * **Runtime**: `Node`
   * **Build Command**: 
     ```bash
     npm install && npx prisma generate && npx prisma db push && npm run build
     ```
   * **Start Command**: 
     ```bash
     npm start
     ```
   * **Instance Type**: **Free** ($0/month).
4. Click **Advanced** at the bottom, and add the following **Environment Variables**:
   * Key: `DATABASE_URL` ➔ Value: *(Paste the **Internal Database URL** you copied in the previous step)*
   * Key: `NODE_ENV` ➔ Value: `production`
5. Click **Create Web Service**.

---

## ⏳ What to Expect (Cold Starts)

* Because the app is deployed on the **Free Tier**, the server will spin down (sleep) after 15 minutes of inactivity.
* The first visitor after inactivity will experience a **50–90 second delay** while the container wakes up. Once awake, the application will respond instantly.
