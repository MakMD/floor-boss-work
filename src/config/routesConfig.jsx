// src/config/routesConfig.jsx
import React from "react";
import Home from "../Pages/Home";
import Login from "../Pages/Login";
import Dashboard from "../components/Dashboard/Dashboard"; // Примітка: цей компонент може не використовуватися повною мірою
import ActiveWorkers from "../Pages/ActiveWorkers";
import Workers from "../Pages/Workers";
import WorkerProfile from "../Pages/WorkerProfile";
import Invoices from "../Pages/Invoices";
// CompanyInvoices видалено
import Orders from "../Pages/Orders";
import JobDetails from "../Pages/JobDetails";
import Materials from "../Pages/Materials";
import PhotosAfter from "../Pages/PhotosAfter";
import Calendar from "../Pages/Calendar";
// WorkOrderPhotos імпорт та пов'язаний маршрут видалено

export const routesConfig = [
  // Public route
  { path: "/login", element: <Login />, public: true },

  // Protected routes under Layout
  {
    public: false,
    children: [
      {
        path: "",
        element: <Home />,
        index: true,
        allowedRoles: ["admin", "user"], // "company" видалено
      },
      {
        path: "home",
        element: <Home />,
        allowedRoles: ["admin", "user"], // "company" видалено
      },
      {
        path: "dashboard",
        element: <Dashboard />,
        allowedRoles: ["admin", "user"], // "company" видалено
      },
      {
        path: "workers/active",
        element: <ActiveWorkers />,
        allowedRoles: ["admin"], // "company" видалено
      },
      {
        path: "workers",
        element: <Workers />,
        allowedRoles: ["admin", "user"], // "company" видалено
      },
      {
        path: "workers/:id",
        element: <WorkerProfile />,
        allowedRoles: ["admin"], // "company" видалено
      },
      {
        path: "invoices", // Маршрут для інвойсів верхнього рівня
        element: <Invoices />,
        allowedRoles: ["admin"], // "company" видалено
      },
      // Об'єкт маршруту company-invoices видалено
      {
        path: "orders",
        element: <Orders />,
        allowedRoles: ["admin", "user"], // "company" видалено
      },
      {
        path: "orders/:id",
        element: <JobDetails />,
        allowedRoles: ["admin", "user"], // "company" видалено
        children: [
          {
            index: true,
            element: <PhotosAfter />,
            allowedRoles: ["admin", "user"], // "company" видалено
          },
          // Маршрут work-order-photos видалено
          {
            path: "materials",
            element: <Materials />,
            allowedRoles: ["admin", "user"], // "company" видалено
          },
          {
            path: "photos-after",
            element: <PhotosAfter />,
            allowedRoles: ["admin", "user"], // "company" видалено
          },
          {
            path: "invoices", // Вкладений маршрут для інвойсів
            element: <Invoices />,
            allowedRoles: ["admin", "user"], // "company" видалено
          },
          // Вкладений маршрут company-invoices видалено
          {
            path: "workers", // Вкладений маршрут для працівників (ймовірно, призначених на замовлення)
            element: <Workers />, // Можливо, тут має бути ActiveWorkers або подібний компонент, якщо контекст прив'язаний до замовлення
            allowedRoles: ["admin"],
          },
        ],
      },
      {
        path: "calendar",
        element: <Calendar />,
        allowedRoles: ["admin", "user"], // "company" видалено
      },
    ],
  },
];
