import React from "react";
import Login from "../Pages/Login";
import Orders from "../Pages/Orders";
import JobDetails from "../Pages/JobDetails";
import Photos from "../Pages/Photos";
import Invoices from "../Pages/Invoices";
import ActiveWorkers from "../Pages/ActiveWorkers";
import Materials from "../Pages/Materials";
import PhotosAfter from "../Pages/PhotosAfter";
import CompanyInvoices from "../Pages/CompanyInvoices";
import Workers from "../Pages/Workers";
import WorkerProfile from "../Pages/WorkerProfile";
import Calendar from "../Pages/Calendar";

// ролі
export const Roles = {
  ADMIN: "admin",
  WORKER: "worker",
};

// централізований конфіг маршрутів
export const routesConfig = [
  {
    path: "/",
    element: <Login />,
    public: true,
  },
  {
    // обгортає Layout і всі захищені маршрути
    layout: true,
    children: [
      {
        path: "home",
        element: <Orders />,
        allowedRoles: [Roles.ADMIN],
      },
      {
        path: "job/:id",
        element: <JobDetails />,
        allowedRoles: [Roles.ADMIN, Roles.WORKER],
        children: [
          {
            index: true,
            element: <Photos />,
            allowedRoles: [Roles.ADMIN, Roles.WORKER],
          },
          {
            path: "invoices",
            element: <Invoices />,
            allowedRoles: [Roles.ADMIN],
          },
          {
            path: "workers",
            element: <ActiveWorkers />,
            allowedRoles: [Roles.ADMIN, Roles.WORKER],
          },
          {
            path: "materials",
            element: <Materials />,
            allowedRoles: [Roles.ADMIN],
          },
          {
            path: "photos-after",
            element: <PhotosAfter />,
            allowedRoles: [Roles.ADMIN, Roles.WORKER],
          },
          {
            path: "company-invoices",
            element: <CompanyInvoices />,
            allowedRoles: [Roles.ADMIN],
          },
        ],
      },
      {
        path: "workers",
        element: <Workers />,
        allowedRoles: [Roles.ADMIN, Roles.WORKER],
      },
      {
        path: "workers/:workerId",
        element: <WorkerProfile />,
        allowedRoles: [Roles.ADMIN, Roles.WORKER],
      },
      {
        path: "calendar",
        element: <Calendar />,
        allowedRoles: [Roles.ADMIN, Roles.WORKER],
      },
    ],
  },
];
