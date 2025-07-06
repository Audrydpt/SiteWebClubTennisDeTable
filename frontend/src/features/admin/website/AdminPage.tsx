import { useState } from 'react';
import { BarChart3, FileText, Camera, Users, Settings } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AdminDashboard from '@/features/admin/website/components/Dashboard.tsx';
import AdminContent from '@/features/admin/website/components/Content.tsx';
import AdminMedia from '@/features/admin/website/components/Media.tsx';
import AdminUsers from '@/features/admin/website/components/EquipeMaker.tsx';
import AdminSettings from '@/features/admin/website/components/Settings.tsx';

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-4 sm:px-6 py-8">
        <h1 className="text-2xl font-bold mb-6 text-gray-800">
          Panneau d&#39;administration
        </h1>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-5 bg-white shadow rounded-lg overflow-hidden mb-1">
            <TabsTrigger
              value="dashboard"
              className="flex items-center justify-center gap-2 py-3 transition-all data-[state=active]:bg-gray-200 data-[state=active]:text-white"
            >
              <BarChart3 className="h-5 w-5" />
              <span className="hidden sm:inline">Dashboard</span>
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="flex items-center justify-center gap-2 py-3 transition-all data-[state=active]:bg-gray-200 data-[state=active]:text-white"
            >
              <FileText className="h-5 w-5" />
              <span className="hidden sm:inline">Contenu</span>
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="flex items-center justify-center gap-2 py-3 transition-all data-[state=active]:bg-gray-200 data-[state=active]:text-white"
            >
              <Camera className="h-5 w-5" />
              <span className="hidden sm:inline">Médias</span>
            </TabsTrigger>
            <TabsTrigger
              value="users"
              className="flex items-center justify-center gap-2 py-3 transition-all data-[state=active]:bg-gray-200 data-[state=active]:text-white"
            >
              <Users className="h-5 w-5" />
              <span className="hidden sm:inline">Equipes</span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex items-center justify-center gap-2 py-3 transition-all data-[state=active]:bg-gray-200 data-[state=active]:text-white"
            >
              <Settings className="h-5 w-5" />
              <span className="hidden sm:inline">Paramètres</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent
            value="dashboard"
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <AdminDashboard />
          </TabsContent>

          <TabsContent
            value="content"
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <AdminContent />
          </TabsContent>

          <TabsContent
            value="media"
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <AdminMedia />
          </TabsContent>

          <TabsContent
            value="users"
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <AdminUsers />
          </TabsContent>

          <TabsContent
            value="settings"
            className="bg-white p-6 rounded-lg shadow-sm"
          >
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
