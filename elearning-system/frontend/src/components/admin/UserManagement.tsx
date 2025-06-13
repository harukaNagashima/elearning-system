import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Container,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Paper,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Grid,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  FormControlLabel,
  Switch,
  Alert,
  CircularProgress,
} from '@mui/material';
import EditIcon from '@mui/icons-material/Edit';
import PersonIcon from '@mui/icons-material/Person';
import AdminPanelSettingsIcon from '@mui/icons-material/AdminPanelSettings';
import { User } from '../../types';
import { adminService } from '../../services/admin';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // フィルター
  const [filters, setFilters] = useState({
    search: '',
    is_active: '',
    is_staff: ''
  });

  // 編集ダイアログ
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<User | null>(null);
  const [editForm, setEditForm] = useState({
    username: '',
    email: '',
    first_name: '',
    last_name: '',
    is_active: true,
    is_staff: false,
  });

  useEffect(() => {
    loadUsers();
  }, [filters]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const filterObj: any = {};
      if (filters.search) filterObj.search = filters.search;
      if (filters.is_active) filterObj.is_active = filters.is_active === 'true';
      if (filters.is_staff) filterObj.is_staff = filters.is_staff === 'true';

      const data = await adminService.getUsers(filterObj);
      setUsers(data);
    } catch (err: any) {
      setError(err.message || 'ユーザーの取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (user: User) => {
    setEditingUser(user);
    setEditForm({
      username: user.username,
      email: user.email,
      first_name: user.first_name || '',
      last_name: user.last_name || '',
      is_active: user.is_active,
      is_staff: user.is_staff || false,
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!editingUser) return;

    try {
      // 更新可能なフィールドのみを送信
      const updateData: any = {
        first_name: editForm.first_name,
        last_name: editForm.last_name,
        is_active: editForm.is_active,
        is_staff: editForm.is_staff,
      };
      
      // emailとusernameは変更された場合のみ含める
      if (editForm.email !== editingUser.email) {
        updateData.email = editForm.email;
      }
      if (editForm.username !== editingUser.username) {
        updateData.username = editForm.username;
      }

      console.log('Sending user update:', updateData);
      await adminService.updateUser(editingUser.id, updateData);
      setDialogOpen(false);
      loadUsers();
    } catch (err: any) {
      setError(err.message || 'ユーザーの更新に失敗しました');
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingUser(null);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="400px">
        <CircularProgress sx={{ color: '#40b87c' }} />
      </Box>
    );
  }

  return (
    <Container maxWidth="xl">
      <Box mt={4}>
        <Typography variant="h4" component="h1" gutterBottom color="#27313b">
          ユーザー管理
        </Typography>

        {error && (
          <Alert severity="error" sx={{ mb: 3 }}>
            {error}
          </Alert>
        )}

        {/* フィルター */}
        <Card sx={{ mb: 3 }}>
          <CardContent>
            <Typography variant="h6" gutterBottom>
              フィルター
            </Typography>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6} md={4}>
                <TextField
                  fullWidth
                  label="検索"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="ユーザー名、メールアドレスで検索"
                />
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>アカウント状態</InputLabel>
                  <Select
                    value={filters.is_active}
                    onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                    label="アカウント状態"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    <MenuItem value="true">有効</MenuItem>
                    <MenuItem value="false">無効</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={4}>
                <FormControl fullWidth>
                  <InputLabel>管理者権限</InputLabel>
                  <Select
                    value={filters.is_staff}
                    onChange={(e) => setFilters({ ...filters, is_staff: e.target.value })}
                    label="管理者権限"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    <MenuItem value="true">管理者</MenuItem>
                    <MenuItem value="false">一般ユーザー</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* ユーザー一覧テーブル */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>ユーザー名</TableCell>
                <TableCell>メールアドレス</TableCell>
                <TableCell>氏名</TableCell>
                <TableCell>権限</TableCell>
                <TableCell>状態</TableCell>
                <TableCell>登録日</TableCell>
                <TableCell>最終ログイン</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {users.map((user) => (
                <TableRow key={user.id}>
                  <TableCell>
                    <Box display="flex" alignItems="center" gap={1}>
                      {user.is_staff ? (
                        <AdminPanelSettingsIcon sx={{ color: '#ff9800' }} />
                      ) : (
                        <PersonIcon sx={{ color: '#666' }} />
                      )}
                      {user.username}
                    </Box>
                  </TableCell>
                  <TableCell>{user.email}</TableCell>
                  <TableCell>
                    {user.first_name || user.last_name 
                      ? `${user.first_name || ''} ${user.last_name || ''}`.trim()
                      : '-'
                    }
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_staff ? '管理者' : '一般ユーザー'}
                      color={user.is_staff ? 'warning' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={user.is_active ? '有効' : '無効'}
                      color={user.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(user.date_joined).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell>
                    {user.last_login 
                      ? new Date(user.last_login).toLocaleDateString('ja-JP')
                      : '未ログイン'
                    }
                  </TableCell>
                  <TableCell>
                    <Button
                      size="small"
                      startIcon={<EditIcon />}
                      onClick={() => handleEdit(user)}
                    >
                      編集
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {users.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="textSecondary">
              ユーザーが見つかりません
            </Typography>
          </Box>
        )}

        {/* 編集ダイアログ */}
        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="sm" fullWidth>
          <DialogTitle>ユーザー編集</DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="ユーザー名"
                  value={editForm.username}
                  onChange={(e) => setEditForm({ ...editForm, username: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="メールアドレス"
                  type="email"
                  value={editForm.email}
                  onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="姓"
                  value={editForm.last_name}
                  onChange={(e) => setEditForm({ ...editForm, last_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={6}>
                <TextField
                  fullWidth
                  label="名"
                  value={editForm.first_name}
                  onChange={(e) => setEditForm({ ...editForm, first_name: e.target.value })}
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    />
                  }
                  label="アカウント有効"
                />
              </Grid>
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editForm.is_staff}
                      onChange={(e) => setEditForm({ ...editForm, is_staff: e.target.checked })}
                    />
                  }
                  label="管理者権限"
                />
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>キャンセル</Button>
            <Button onClick={handleSave} variant="contained" sx={{ backgroundColor: '#40b87c' }}>
              保存
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default UserManagement;