// pages/NotificationsPage.jsx

import React from 'react';
import NotificationsPanel from './notification/notification';

const NotificationsPage = () => {
  return (
    <div className="container mx-auto p-4">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-2xl font-bold mb-4">مركز الإشعارات</h1>
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
          <NotificationsPanel/>
        </div>
      </div>
    </div>
  );
};

export default NotificationsPage;