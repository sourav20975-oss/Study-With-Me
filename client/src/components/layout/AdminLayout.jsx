import React, { useState } from 'react';
import { Outlet } from 'react-router-dom';
import { TopHeader } from '../common/TopHeader.jsx';
import { AdminSidebar } from '../common/AdminSidebar.jsx';

export function AdminLayout() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  return (
    <div className="min-h-screen flex flex-col bg-[#F8F9FA] w-full">
      <TopHeader onToggleMenu={() => setIsSidebarOpen(true)} />

      <div className="flex-1 w-full flex">
        <AdminSidebar
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        <main className="flex-1 w-full p-4 sm:p-6 lg:p-8 xl:p-10 pb-16 min-w-0">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
