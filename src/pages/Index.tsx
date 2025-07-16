import { useState } from "react";
import { Layout, type UserRole } from "@/components/Layout";
import { AdminDashboard } from "@/components/Dashboard/AdminDashboard";
import { TeacherDashboard } from "@/components/Dashboard/TeacherDashboard";
import { StudentDashboard } from "@/components/Dashboard/StudentDashboard";
import { ParentDashboard } from "@/components/Dashboard/ParentDashboard";
import { DeveloperDashboard } from "@/components/Dashboard/DeveloperDashboard";

const Index = () => {
  const [currentRole, setCurrentRole] = useState<UserRole>('admin');

  const renderDashboard = () => {
    switch (currentRole) {
      case 'admin':
        return <AdminDashboard />;
      case 'principal':
        return <AdminDashboard />; // Can be customized later
      case 'teacher':
        return <TeacherDashboard />;
      case 'student':
        return <StudentDashboard />;
      case 'parent':
        return <ParentDashboard />;
      case 'vendor':
        return <AdminDashboard />; // Can be customized later
      case 'developer':
        return <DeveloperDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <Layout currentRole={currentRole} onRoleChange={setCurrentRole}>
      {renderDashboard()}
    </Layout>
  );
};

export default Index;
