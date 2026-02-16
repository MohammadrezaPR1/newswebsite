import { useContext } from 'react';
import { AdminContext } from '../context/context';
import { Navigate, Outlet } from 'react-router-dom';

const Admin = () => {
    const { isAdmin, isLoading } = useContext(AdminContext)

    if (isLoading || isAdmin === null) {
        return (
            <div className="flex justify-center items-center h-screen bg-gray-50">
                <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-indigo-600"></div>
            </div>
        );
    }

    return isAdmin ? <Outlet /> : <Navigate to="/admin-dashboard" replace={true} />
}

export default Admin;
