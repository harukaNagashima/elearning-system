import React from 'react';
import { ThemeProvider, createTheme } from '@mui/material/styles';
import CssBaseline from '@mui/material/CssBaseline';
import { AppBar, Toolbar, Typography, Box, Button, Menu, MenuItem, Divider } from '@mui/material';
import AccountCircleIcon from '@mui/icons-material/AccountCircle';
import LogoutIcon from '@mui/icons-material/Logout';
import QuizIcon from '@mui/icons-material/Quiz';
import TrendingUpIcon from '@mui/icons-material/TrendingUp';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import SettingsIcon from '@mui/icons-material/Settings';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import QuizApp from './components/QuizApp';
import ProgressManagement from './components/ProgressManagement';
import AdminPanel from './components/admin/AdminPanel';
import AccountSettings from './components/AccountSettings';

const theme = createTheme({
  palette: {
    primary: {
      main: '#40b87c',
    },
    secondary: {
      main: '#27313b',
    },
    background: {
      default: '#f5f5f5',
    },
  },
  typography: {
    fontFamily: '"Noto Sans JP", "Roboto", "Helvetica", "Arial", sans-serif',
  },
});

const AppHeader: React.FC<{ currentView: string; onViewChange: (view: string) => void }> = ({ currentView, onViewChange }) => {
  const { user, logout, isAdmin } = useAuth();
  const [anchorEl, setAnchorEl] = React.useState<null | HTMLElement>(null);

  const handleMenu = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = async () => {
    await logout();
    handleClose();
  };

  return (
    <AppBar position="static" sx={{ backgroundColor: '#27313b' }}>
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ color: 'white', mr: 4 }}>
          E-learning System - 学習管理システム
        </Typography>
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
            <Button
              color="inherit"
              startIcon={<QuizIcon />}
              onClick={() => onViewChange('quiz')}
              sx={{
                color: currentView === 'quiz' ? '#40b87c' : 'white',
                backgroundColor: currentView === 'quiz' ? 'rgba(64, 184, 124, 0.1)' : 'transparent',
                textTransform: 'none',
              }}
            >
              クイズ
            </Button>
            <Button
              color="inherit"
              startIcon={<TrendingUpIcon />}
              onClick={() => onViewChange('progress')}
              sx={{
                color: currentView === 'progress' ? '#40b87c' : 'white',
                backgroundColor: currentView === 'progress' ? 'rgba(64, 184, 124, 0.1)' : 'transparent',
                textTransform: 'none',
              }}
            >
              学習進捗
            </Button>
            {isAdmin() && (
              <Button
                color="inherit"
                startIcon={<AdminPanelSettingsIcon />}
                onClick={() => onViewChange('admin')}
                sx={{
                  color: currentView === 'admin' ? '#40b87c' : 'white',
                  backgroundColor: currentView === 'admin' ? 'rgba(64, 184, 124, 0.1)' : 'transparent',
                  textTransform: 'none',
                }}
              >
                管理者パネル
              </Button>
            )}
          </Box>
        )}
        
        {user && (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <Typography variant="body2" sx={{ display: { xs: 'none', sm: 'block' }, color: 'white' }}>
              ようこそ、{user.username}さん
            </Typography>
            
            <Button
              size="large"
              aria-label="account of current user"
              aria-controls="menu-appbar"
              aria-haspopup="true"
              onClick={handleMenu}
              color="inherit"
              startIcon={<AccountCircleIcon sx={{ color: 'white' }} />}
              sx={{ textTransform: 'none', color: 'white' }}
            >
              <Box sx={{ display: { xs: 'none', sm: 'block' } }}>
                アカウント
              </Box>
            </Button>
            
            <Menu
              id="menu-appbar"
              anchorEl={anchorEl}
              anchorOrigin={{
                vertical: 'bottom',
                horizontal: 'right',
              }}
              keepMounted
              transformOrigin={{
                vertical: 'top',
                horizontal: 'right',
              }}
              open={Boolean(anchorEl)}
              onClose={handleClose}
            >
              <MenuItem disabled>
                <Box>
                  <Typography variant="body2" fontWeight="bold">
                    {user.username}
                  </Typography>
                  <Typography variant="caption" color="textSecondary">
                    {user.email}
                  </Typography>
                </Box>
              </MenuItem>
              <Divider />
              <MenuItem onClick={() => { handleClose(); onViewChange('account'); }}>
                <SettingsIcon sx={{ mr: 1 }} fontSize="small" />
                アカウント設定
              </MenuItem>
              <MenuItem onClick={handleLogout}>
                <LogoutIcon sx={{ mr: 1 }} fontSize="small" />
                ログアウト
              </MenuItem>
            </Menu>
          </Box>
        )}
      </Toolbar>
    </AppBar>
  );
};

const AppContent: React.FC = () => {
  const [currentView, setCurrentView] = React.useState('quiz');

  const renderContent = () => {
    switch (currentView) {
      case 'progress':
        return <ProgressManagement />;
      case 'admin':
        return <AdminPanel onBack={() => setCurrentView('quiz')} />;
      case 'account':
        return <AccountSettings />;
      case 'quiz':
      default:
        return <QuizApp />;
    }
  };

  return (
    <Box sx={{ display: 'flex', flexDirection: 'column', minHeight: '100vh' }}>
      <AppHeader currentView={currentView} onViewChange={setCurrentView} />
      
      <Box component="main" sx={{ flexGrow: 1, backgroundColor: '#f5f5f5' }}>
        <PrivateRoute>
          {renderContent()}
        </PrivateRoute>
      </Box>
      
      <Box
        component="footer"
        sx={{
          py: 2,
          px: 2,
          mt: 'auto',
          backgroundColor: '#27313b',
          color: 'white',
          textAlign: 'center',
        }}
      >
        <Typography variant="body2">
          © 2025 E-learning System. All rights reserved.
        </Typography>
      </Box>
    </Box>
  );
};

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;