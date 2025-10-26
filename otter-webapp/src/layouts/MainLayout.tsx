import { Outlet } from 'react-router-dom';
import { Sidebar } from '../components/layout/sidebar';
import { TopBar } from '../components/layout/topbar';

function MainLayout() {
    return (
        <div className="flex h-screen bg-background">
            <Sidebar />
            <div className="flex-1 flex flex-col">
                <TopBar />
                <main className="flex-1 overflow-auto flex flex-col min-h-0">
                    <Outlet />
                </main>
            </div>
        </div>
    );
}

export default MainLayout;
