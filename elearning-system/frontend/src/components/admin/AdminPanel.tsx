import React, { useState } from 'react';
import {
  Box,
  AppBar,
  Toolbar,
  Typography,
  Button,
  Container,
  Tabs,
  Tab,
} from '@mui/material';
import DashboardIcon from '@mui/icons-material/Dashboard';
import QuizIcon from '@mui/icons-material/Quiz';
import PeopleIcon from '@mui/icons-material/People';
import CategoryIcon from '@mui/icons-material/Category';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import AdminDashboard from './AdminDashboard';
import QuestionManagement from './QuestionManagement';
import UserManagement from './UserManagement';
import GenreManagement from './GenreManagement';

interface AdminPanelProps {
  onBack: () => void;
}

const AdminPanel: React.FC<AdminPanelProps> = ({ onBack }) => {
  const [currentTab, setCurrentTab] = useState(0);

  const handleTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setCurrentTab(newValue);
  };

  const renderTabContent = () => {
    switch (currentTab) {
      case 0:
        return <AdminDashboard />;
      case 1:
        return <QuestionManagement />;
      case 2:
        return <UserManagement />;
      case 3:
        return <GenreManagement />;
      default:
        return <AdminDashboard />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      {/* ヘッダー */}
      <AppBar position="static" sx={{ backgroundColor: '#27313b' }}>
        <Toolbar>
          <Button
            color="inherit"
            startIcon={<ArrowBackIcon />}
            onClick={onBack}
            sx={{ mr: 2 }}
          >
            戻る
          </Button>
          <Typography variant="h6" component="div" sx={{ flexGrow: 1, color: 'white' }}>
            管理者パネル
          </Typography>
        </Toolbar>
      </AppBar>

      {/* タブナビゲーション */}
      <Box sx={{ borderBottom: 1, borderColor: 'divider', backgroundColor: 'white' }}>
        <Container maxWidth="xl">
          <Tabs value={currentTab} onChange={handleTabChange}>
            <Tab
              icon={<DashboardIcon />}
              label="ダッシュボード"
              sx={{ textTransform: 'none' }}
            />
            <Tab
              icon={<QuizIcon />}
              label="問題管理"
              sx={{ textTransform: 'none' }}
            />
            <Tab
              icon={<PeopleIcon />}
              label="ユーザー管理"
              sx={{ textTransform: 'none' }}
            />
            <Tab
              icon={<CategoryIcon />}
              label="ジャンル管理"
              sx={{ textTransform: 'none' }}
            />
          </Tabs>
        </Container>
      </Box>

      {/* メインコンテンツ */}
      <Box component="main" sx={{ flexGrow: 1, backgroundColor: '#f5f5f5', pb: 4 }}>
        {renderTabContent()}
      </Box>
    </Box>
  );
};

export default AdminPanel;