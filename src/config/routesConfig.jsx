// src/config/routesConfig.jsx
import React from "react";
import Home from "../Pages/Home";
import Login from "../Pages/Login";
import Dashboard from "../components/Dashboard/Dashboard";
import ActiveWorkers from "../Pages/ActiveWorkers";
import Workers from "../Pages/Workers";
import WorkerProfile from "../Pages/WorkerProfile";
import Invoices from "../Pages/Invoices";
import CompanyInvoices from "../Pages/CompanyInvoices";
import Orders from "../Pages/Orders";
import JobDetails from "../Pages/JobDetails";
import Materials from "../Pages/Materials";
import Photos from "../Pages/Photos";
import PhotosAfter from "../Pages/PhotosAfter";
import Calendar from "../Pages/Calendar";

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
        allowedRoles: ["admin", "company", "user"],
      },
      {
        path: "home",
        element: <Home />,
        allowedRoles: ["admin", "company", "user"],
      },
      {
        path: "dashboard",
        element: <Dashboard />,
        allowedRoles: ["admin", "company", "user"],
      },
      {
        path: "workers/active",
        element: <ActiveWorkers />,
        allowedRoles: ["admin", "company"],
      },
      {
        path: "workers",
        element: <Workers />,
        allowedRoles: ["admin", "company", "user"],
      },
      {
        path: "workers/:id",
        element: <WorkerProfile />,
        allowedRoles: ["admin", "company"],
      },
      {
        path: "invoices",
        element: <Invoices />,
        allowedRoles: ["admin", "company"],
      },
      {
        path: "company-invoices",
        element: <CompanyInvoices />,
        allowedRoles: ["company"],
      },
      {
        path: "orders",
        element: <Orders />,
        allowedRoles: ["admin", "company", "user"],
      },

      // Деталі замовлення з вкладеними табами
      {
        path: "orders/:id",
        element: <JobDetails />,
        allowedRoles: ["admin", "company", "user"],
        children: [
          // за замовчуванням – Photos
          {
            index: true,
            element: <Photos />,
            allowedRoles: ["admin", "company", "user"],
          },
          // Materials
          {
            path: "materials",
            element: <Materials />,
            allowedRoles: ["admin", "company", "user"],
          },
          // Before Photos
          {
            path: "photos",
            element: <Photos />,
            allowedRoles: ["admin", "company", "user"],
          },
          // After Photos
          {
            path: "photos-after",
            element: <PhotosAfter />,
            allowedRoles: ["admin", "company", "user"],
          },
          // Invoices
          {
            path: "invoices",
            element: <Invoices />,
            allowedRoles: ["admin", "company", "user"],
          },
          // Company Invoices
          {
            path: "company-invoices",
            element: <CompanyInvoices />,
            allowedRoles: ["admin", "company", "user"],
          },
          // Workers (тільки для admin)
          { path: "workers", element: <Workers />, allowedRoles: ["admin"] },
        ],
      },

      {
        path: "calendar",
        element: <Calendar />,
        allowedRoles: ["admin", "company", "user"],
      },
    ],
  },
];
