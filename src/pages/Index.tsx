import { Navigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useUserProfile } from "@/hooks/useUserProfile";
import { Layout } from "@/components/Layout";
import { AdminDashboard } from "@/components/Dashboard/AdminDashboard";
import { PrincipalDashboard } from "@/components/Dashboard/PrincipalDashboard";
import { TeacherDashboard } from "@/components/Dashboard/TeacherDashboard";
import { StudentDashboard } from "@/components/Dashboard/StudentDashboard";
import { ParentDashboard } from "@/components/Dashboard/ParentDashboard";
import { VendorDashboard } from "@/components/Dashboard/VendorDashboard";
import { DeveloperDashboard } from "@/components/Dashboard/DeveloperDashboard";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

const Index = () => {
  const { user, loading: authLoading, signOut } = useAuth();
  const { profile, loading: profileLoading, error } = useUserProfile();

  // Show loading state while checking authentication
  if (authLoading || profileLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  // Redirect to auth if not logged in
  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  // Show error if profile couldn't be loaded
  if (error) {
    return (
      <div className="min-h-screen flex items-center justify-center p-4">
        <Alert variant="destructive" className="max-w-md">
          <AlertDescription className="space-y-4">
            <p>{error}</p>
            <Button onClick={signOut} variant="outline" className="w-full">
              Sign Out
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Show loading if profile is still loading
  if (!profile) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
          <p className="mt-2 text-muted-foreground">Loading profile...</p>
        </div>
      </div>
    );
  }

  const renderDashboard = () => {
    switch (profile.role) {
      case "super_admin":
      case "admin":
        return <AdminDashboard />;
      case "principal":
        return <PrincipalDashboard />;
      case "teacher":
        return <TeacherDashboard />;
      case "student":
        return <StudentDashboard />;
      case "parent":
        return <ParentDashboard />;
      case "vendor":
        return <VendorDashboard />;
      case "developer":
        return <DeveloperDashboard />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <Layout currentRole={profile.role as any} profile={profile}>
      {renderDashboard()}
    </Layout>
  );
};

export default Index;
