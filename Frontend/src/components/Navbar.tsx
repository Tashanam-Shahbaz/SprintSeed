import { useAuth } from "../hooks/useAuth";
import { useNavigate } from "react-router-dom";

const Navbar = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login");
    } catch (error) {
      console.error("Logout failed:", error);
    }
  };

  return (
    <nav className="bg-white shadow-sm border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Left section with logo and title */}
          <div className="flex items-center">
            <img src="/logo.png" alt="Logo" className="h-8 w-auto" />
            <a href="/dashboard" className="ml-4 text-xl font-semibold">
              Dashboard
            </a>
          </div>

          {/* Right section with user info and logout button */}
          <div className="flex items-center space-x-4">
            <span className="text-sm text-gray-700">
              Welcome,{" "}
              {user?.first_name
                ? `${user.first_name} ${user.last_name}`
                : user?.email || "User"}
            </span>

            <button
              onClick={handleLogout}
              className="bg-red-600 text-white px-4 py-2 rounded-md hover:bg-red-700 transition-colors"
            >
              Logout
            </button>
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
