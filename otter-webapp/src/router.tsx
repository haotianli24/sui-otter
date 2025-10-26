import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import MessagesPage from './pages/MessagesPage';
import GroupsPage from './pages/GroupsPage';
import StreamPage from './pages/StreamPage';
import DiscoverPage from './pages/DiscoverPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';
import CopyTradingPage from './pages/CopyTradingPage';
import { TestPage } from './pages/TestPage';
import { ImageExplorer } from './pages/ImageExplorer';
import { ErrorBoundary } from './components/ErrorBoundary';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/messages" replace />,
    },
    {
        path: '/',
        element: <MainLayout />,
        errorElement: <ErrorBoundary><div>Error in layout</div></ErrorBoundary>,
        children: [
            {
                path: 'messages',
                element: <MessagesPage />,
                errorElement: <ErrorBoundary><div>Error in layout</div></ErrorBoundary>,
            },
            {
                path: 'groups',
                element: <GroupsPage />,
                errorElement: <ErrorBoundary><div>Error in layout</div></ErrorBoundary>,
            },
            {
                path: 'stream',
                element: <StreamPage />,
                errorElement: <ErrorBoundary><div>Error in layout</div></ErrorBoundary>,
            },
            {
                path: 'discover',
                element: <DiscoverPage />,
                errorElement: <ErrorBoundary><div>Error in layout</div></ErrorBoundary>,
            },
            {
                path: 'profile',
                element: <ProfilePage />,
                errorElement: <ErrorBoundary><div>Error in layout</div></ErrorBoundary>,
            },
            {
                path: 'settings',
                element: <SettingsPage />,
                errorElement: <ErrorBoundary><div>Error in layout</div></ErrorBoundary>,
            },
            {
                path: 'copy-trading',
                element: <CopyTradingPage />,
                errorElement: <ErrorBoundary><div>Error loading copy trading</div></ErrorBoundary>,
            },
            {
                path: 'test',
                element: <TestPage />,
                errorElement: <ErrorBoundary><div>Error loading test page</div></ErrorBoundary>,
            },
            {
                path: 'explorer',
                element: <ImageExplorer />,
                errorElement: <ErrorBoundary><div>Error loading image explorer</div></ErrorBoundary>,
            },
        ],
    },
]);
