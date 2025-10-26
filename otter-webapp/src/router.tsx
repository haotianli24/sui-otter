import { createBrowserRouter, Navigate } from 'react-router-dom';
import MainLayout from './layouts/MainLayout';
import MessagesPage from './pages/MessagesPage';
import GroupsPage from './pages/GroupsPage';
import StreamPage from './pages/StreamPage';
import DiscoverPage from './pages/DiscoverPage';
import ProfilePage from './pages/ProfilePage';
import SettingsPage from './pages/SettingsPage';

export const router = createBrowserRouter([
    {
        path: '/',
        element: <Navigate to="/messages" replace />,
    },
    {
        path: '/',
        element: <MainLayout />,
        children: [
            {
                path: 'messages',
                element: <MessagesPage />,
            },
            {
                path: 'groups',
                element: <GroupsPage />,
            },
            {
                path: 'stream',
                element: <StreamPage />,
            },
            {
                path: 'discover',
                element: <DiscoverPage />,
            },
            {
                path: 'profile',
                element: <ProfilePage />,
            },
            {
                path: 'settings',
                element: <SettingsPage />,
            },
        ],
    },
]);
