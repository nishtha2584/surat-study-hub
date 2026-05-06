import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";

import LoginPage from "./pages/auth/LoginPage";
import Dashboard from "./pages/Dashboard";
import BatchesPage from "./pages/BatchesPage";
import MyBatchStudentsPage from "./pages/MyBatchStudentsPage";
import BatchFormPage from "./pages/BatchFormPage";
import StudentsPage from "./pages/StudentsPage";
import StudentFormPage from "./pages/StudentFormPage";
import StudentDetailPage from "./pages/StudentDetailPage";
import BatchDetailPage from "./pages/BatchDetailPage";
import ProfilePage from "./pages/ProfilePage";

import PrivateRoute from "./components/PrivateRoute";
import RoleRoute from "./components/RoleRoute";
import AppLayout from "./components/AppLayout";
import EnrollStudentPage from "./pages/EnrollStudentPage";
import MyBatchesPage from "./pages/MyBatchesPage";
import ReportsPage from "./pages/ReportsPage";
import StaffPage from "./pages/StaffPage";
import AssignBatchesPage from "./pages/AssignBatchesPage";

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* PUBLIC */}
        <Route path="/login" element={<LoginPage />} />

        {/* DASHBOARD */}
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <AppLayout>
                <Dashboard />
              </AppLayout>
            </PrivateRoute>
          }
        />

        {/* REPORTS (ADMIN ONLY) */}
        <Route
          path="/reports"
          element={
            <PrivateRoute>
              <RoleRoute roles={["ADMIN"]}>
                <AppLayout>
                  <ReportsPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        {/* PROFILE */}
        <Route
          path="/profile"
          element={
            <PrivateRoute>
              <AppLayout>
                <ProfilePage />
              </AppLayout>
            </PrivateRoute>
          }
        />

        {/* STAFF (ADMIN ONLY) */}
        <Route
          path="/staff"
          element={
            <PrivateRoute>
              <RoleRoute roles={["ADMIN"]}>
                <AppLayout>
                  <StaffPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        {/* BATCHES (ADMIN + RECEPTIONIST) */}
        <Route
          path="/batches"
          element={
            <PrivateRoute>
              <RoleRoute roles={["ADMIN", "RECEPTIONIST"]}>
                <AppLayout>
                  <BatchesPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        {/* ADD / EDIT (ADMIN ONLY) */}
        <Route
          path="/batches/new"
          element={
            <PrivateRoute>
              <RoleRoute roles={["ADMIN"]}>
                <AppLayout>
                  <BatchFormPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        {/* BATCH DETAIL (ADMIN + RECEPTIONIST + TEACHER) */}
        <Route
          path="/batches/:id"
          element={
            <PrivateRoute>
              <RoleRoute roles={["ADMIN", "RECEPTIONIST", "TEACHER"]}>
                <AppLayout>
                  <BatchDetailPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/batches/:id/edit"
          element={
            <PrivateRoute>
              <RoleRoute roles={["ADMIN"]}>
                <AppLayout>
                  <BatchFormPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        {/* STUDENTS (ADMIN + RECEPTIONIST) */}
        <Route
          path="/students"
          element={
            <PrivateRoute>
              <RoleRoute roles={["ADMIN", "RECEPTIONIST"]}>
                <AppLayout>
                  <StudentsPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/students/new"
          element={
            <PrivateRoute>
              <RoleRoute roles={["ADMIN", "RECEPTIONIST"]}>
                <AppLayout>
                  <StudentFormPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />
        {/* STUDENT DETAIL */}
        <Route
          path="/students/:id"
          element={
            <PrivateRoute>
              <RoleRoute roles={["ADMIN", "RECEPTIONIST"]}>
                <AppLayout>
                  <StudentDetailPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/students/:id/edit"
          element={
            <PrivateRoute>
              <RoleRoute roles={["ADMIN", "RECEPTIONIST"]}>
                <AppLayout>
                  <StudentFormPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/students/:id/enroll"
          element={
            <PrivateRoute>
              <RoleRoute roles={["ADMIN", "RECEPTIONIST"]}>
                <AppLayout>
                  <EnrollStudentPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />
        <Route
          path="/students/:id/assign-batches"
          element={
            <PrivateRoute>
              <RoleRoute roles={["ADMIN", "RECEPTIONIST"]}>
                <AppLayout>
                  <AssignBatchesPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        {/* TEACHER */}
        <Route
          path="/my-batches"
          element={
            <PrivateRoute>
              <RoleRoute roles={["TEACHER"]}>
                <AppLayout>
                  <MyBatchesPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        <Route
          path="/my-batches/:id/students"
          element={
            <PrivateRoute>
              <RoleRoute roles={["TEACHER"]}>
                <AppLayout>
                  <MyBatchStudentsPage />
                </AppLayout>
              </RoleRoute>
            </PrivateRoute>
          }
        />

        {/* DEFAULT */}
        <Route path="/" element={<Navigate to="/dashboard" />} />

        {/* 404 */}
        <Route path="*" element={<div>Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
