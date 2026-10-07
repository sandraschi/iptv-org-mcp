import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { AppLayout } from "@/components/AppLayout";
import { ApiDocsPage } from "@/pages/ApiDocs";
import { ChannelsPage } from "@/pages/Channels";
import { ChatPage } from "@/pages/Chat";
import { Dashboard } from "@/pages/Dashboard";
import { GuidePage } from "@/pages/Guide";
import { HelpPage } from "@/pages/Help";
import { InboxPage } from "@/pages/Inbox";
import { LogsPage } from "@/pages/Logs";
import { PlaylistsPage } from "@/pages/Playlists";
import { SettingsPage } from "@/pages/Settings";
import { SkillsPage } from "@/pages/Skills";
import { ToolsPage } from "@/pages/Tools";

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<AppLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<Dashboard />} />
          <Route path="channels" element={<ChannelsPage />} />
          <Route path="playlists" element={<PlaylistsPage />} />
          <Route path="guide" element={<GuidePage />} />
          <Route path="inbox" element={<InboxPage />} />
          <Route path="tools" element={<ToolsPage />} />
          <Route path="chat" element={<ChatPage />} />
          <Route path="skills" element={<SkillsPage />} />
          <Route path="api-docs" element={<ApiDocsPage />} />
          <Route path="logs" element={<LogsPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="help" element={<HelpPage />} />
          <Route path="*" element={<Navigate to="/dashboard" replace />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
