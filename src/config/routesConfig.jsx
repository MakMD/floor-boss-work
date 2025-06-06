import React from "react";

// Сторінки
import Login from "../Pages/Login";
import ActiveWorkers from "../Pages/ActiveWorkers";
import Workers from "../Pages/Workers";
import WorkerProfile from "../Pages/WorkerProfile";
import Orders from "../Pages/Orders";
import JobDetails from "../Pages/JobDetails";
import Materials from "../Pages/Materials";
import PhotosAfter from "../Pages/PhotosAfter";
import Invoices from "../Pages/Invoices";
import Calendar from "../Pages/Calendar";
import JobOrderPhoto from "../Pages/JobOrderPhoto";
import WorkerNotes from "../Pages/WorkerNotes";
import PhotoGallery from "../Pages/PhotoGallery";
import WorkerDashboard from "../Pages/WorkerDashboard";
import AdminDashboard from "../Pages/AdminDashboard";
import RoleBasedRedirect from "../components/RoleBasedRedirect/RoleBasedRedirect";

export const ROLES = {
  ADMIN: "admin",
  WORKER: "worker",
};

const ALL_AUTHENTICATED_ROLES = [ROLES.ADMIN, ROLES.WORKER];

export const routesConfig = [
  // Публічний маршрут
  {
    path: "/login",
    element: <Login />,
    isPublic: true,
  },
  // Захищені маршрути всередині Layout
  {
    path: "/",
    isLayout: true,
    children: [
      {
        index: true,
        element: <RoleBasedRedirect />,
        allowedRoles: ALL_AUTHENTICATED_ROLES,
      },
      {
        path: "admin-dashboard",
        element: <AdminDashboard />,
        allowedRoles: [ROLES.ADMIN],
      },
      {
        path: "my-dashboard",
        element: <WorkerDashboard />,
        allowedRoles: [ROLES.WORKER],
      },
      {
        path: "workers",
        element: <Workers />,
        allowedRoles: [ROLES.ADMIN],
      },
      {
        path: "workers/:id",
        element: <WorkerProfile />,
        allowedRoles: [ROLES.ADMIN],
      },
      {
        path: "orders",
        element: <Orders />,
        allowedRoles: [ROLES.ADMIN],
      },
      {
        path: "orders/:id",
        element: <JobDetails />,
        allowedRoles: ALL_AUTHENTICATED_ROLES,
        children: [
          {
            index: true,
            element: <PhotosAfter />,
            allowedRoles: ALL_AUTHENTICATED_ROLES,
          },
          {
            path: "photos-after",
            element: <PhotosAfter />,
            allowedRoles: ALL_AUTHENTICATED_ROLES,
          },
          {
            path: "job-order-photo",
            element: <JobOrderPhoto />,
            allowedRoles: [ROLES.ADMIN],
          },
          {
            path: "worker-notes",
            element: <WorkerNotes />,
            allowedRoles: ALL_AUTHENTICATED_ROLES,
          },
          {
            path: "materials",
            element: <Materials />,
            allowedRoles: ALL_AUTHENTICATED_ROLES,
          },
          {
            path: "invoices",
            element: <Invoices />,
            allowedRoles: ALL_AUTHENTICATED_ROLES,
          },
          {
            path: "workers",
            element: <ActiveWorkers />,
            allowedRoles: [ROLES.ADMIN],
          },
        ],
      },
      {
        path: "photo-gallery",
        element: <PhotoGallery />,
        allowedRoles: [ROLES.ADMIN],
      },
      {
        path: "calendar",
        element: <Calendar />,
        allowedRoles: ALL_AUTHENTICATED_ROLES,
      },
      // Перенаправлення для всіх інших шляхів
      {
        path: "*",
        element: <RoleBasedRedirect />,
        allowedRoles: ALL_AUTHENTICATED_ROLES,
      },
    ],
  },
];
