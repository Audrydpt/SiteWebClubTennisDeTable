import { useState } from 'react';
import { FileText, Camera, Users, Settings, AppWindow } from 'lucide-react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

import AdminPages from '@/features/admin/website/components/Pages.tsx';
import AdminContent from '@/features/admin/website/components/Content.tsx';
import AdminMedia from '@/features/admin/website/components/Media.tsx';
import AdminResults from '@/features/admin/website/components/EquipeMaker.tsx';
import AdminSettings from '@/features/admin/website/components/Settings.tsx';

export default function AdminHome() {
  const [activeTab, setActiveTab] = useState('users');

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="container mx-auto px-2 sm:px-4 lg:px-6 py-4 sm:py-8">
        {/* Titre responsive */}
        <h1 className="text-lg sm:text-xl lg:text-2xl font-bold mb-4 sm:mb-6 text-gray-800 px-2 sm:px-0">
          <span className="hidden sm:inline">Panneau d&#39;administration</span>
          <span className="sm:hidden">Admin</span>
        </h1>

        <Tabs
          value={activeTab}
          onValueChange={setActiveTab}
          className="space-y-4 sm:space-y-6"
        >
          {/* Navigation responsive avec icônes seulement sur mobile */}
          <TabsList className="grid w-full grid-cols-5 bg-white shadow rounded-lg overflow-hidden mb-1 h-auto">
            <TabsTrigger
              value="users"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-3 transition-all data-[state=active]:bg-gray-200 data-[state=active]:text-white text-xs sm:text-sm"
            >
              <Users className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="hidden xs:inline sm:inline text-xs sm:text-sm truncate">
                Équipes
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="content"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-3 transition-all data-[state=active]:bg-gray-200 data-[state=active]:text-white text-xs sm:text-sm"
            >
              <FileText className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="hidden xs:inline sm:inline text-xs sm:text-sm truncate">
                Contenu
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="pages"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-3 transition-all data-[state=active]:bg-gray-200 data-[state=active]:text-white text-xs sm:text-sm"
            >
              <AppWindow className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="hidden xs:inline sm:inline text-xs sm:text-sm truncate">
                Pages
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="media"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-3 transition-all data-[state=active]:bg-gray-200 data-[state=active]:text-white text-xs sm:text-sm"
            >
              <Camera className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="hidden xs:inline sm:inline text-xs sm:text-sm truncate">
                Médias
              </span>
            </TabsTrigger>
            <TabsTrigger
              value="settings"
              className="flex flex-col sm:flex-row items-center justify-center gap-1 sm:gap-2 py-2 sm:py-3 px-1 sm:px-3 transition-all data-[state=active]:bg-gray-200 data-[state=active]:text-white text-xs sm:text-sm"
            >
              <Settings className="h-4 w-4 sm:h-5 sm:w-5 shrink-0" />
              <span className="hidden xs:inline sm:inline text-xs sm:text-sm truncate">
                Paramètres
              </span>
            </TabsTrigger>
          </TabsList>

          {/* Contenu des onglets avec padding adaptatif */}
          <TabsContent
            value="pages"
            className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm"
          >
            <AdminPages />
          </TabsContent>

          <TabsContent
            value="content"
            className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm"
          >
            <AdminContent />
          </TabsContent>

          <TabsContent
            value="media"
            className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm"
          >
            <AdminMedia />
          </TabsContent>

          <TabsContent
            value="users"
            className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm"
          >
            <AdminResults />
          </TabsContent>

          <TabsContent
            value="settings"
            className="bg-white p-3 sm:p-4 lg:p-6 rounded-lg shadow-sm"
          >
            <AdminSettings />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
