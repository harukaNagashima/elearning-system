import React, { useState, useEffect } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Box,
  Container,
  Button,
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
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Checkbox,
  Alert,
  CircularProgress,
  DialogContentText,
  FormControlLabel,
  Switch,
  IconButton,
} from '@mui/material';
import AddIcon from '@mui/icons-material/Add';
import EditIcon from '@mui/icons-material/Edit';
import DeleteIcon from '@mui/icons-material/Delete';
import RemoveIcon from '@mui/icons-material/Remove';
import { Question, Genre } from '../../types';
import { adminService } from '../../services/admin';

const QuestionManagement: React.FC = () => {
  const [questions, setQuestions] = useState<Question[]>([]);
  const [genres, setGenres] = useState<Genre[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedQuestions, setSelectedQuestions] = useState<string[]>([]);
  
  // フィルター
  const [filters, setFilters] = useState({
    genre: '',
    difficulty: '',
    search: '',
    is_active: ''
  });

  // ダイアログ
  const [dialogOpen, setDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [bulkDialogOpen, setBulkDialogOpen] = useState(false);
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [deletingQuestion, setDeletingQuestion] = useState<Question | null>(null);
  const [bulkAction, setBulkAction] = useState<'activate' | 'deactivate' | 'delete' | null>(null);
  
  // 問題編集フォーム
  const [editForm, setEditForm] = useState({
    body: '',
    object: '',
    clarification: '',
    genre: '',
    difficulty: 1,
    is_active: true,
    choices: [
      { content: '', is_correct: false },
      { content: '', is_correct: false },
      { content: '', is_correct: false },
      { content: '', is_correct: false }
    ]
  });

  useEffect(() => {
    loadData();
  }, [filters]);

  useEffect(() => {
    loadGenres();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      const filterObj: any = {};
      if (filters.genre) filterObj.genre = filters.genre;
      if (filters.difficulty) filterObj.difficulty = parseInt(filters.difficulty);
      if (filters.search) filterObj.search = filters.search;
      if (filters.is_active) filterObj.is_active = filters.is_active === 'true';

      const data = await adminService.getQuestions(filterObj);
      setQuestions(data);
    } catch (err: any) {
      setError(err.message || '問題の取得に失敗しました');
    } finally {
      setLoading(false);
    }
  };

  const loadGenres = async () => {
    try {
      const data = await adminService.getGenres();
      if (Array.isArray(data)) {
        setGenres(data);
      } else {
        console.error('Genres data is not an array:', data);
        setGenres([]);
      }
    } catch (err) {
      console.error('Error loading genres:', err);
      setGenres([]);
    }
  };

  const handleBulkAction = (action: 'activate' | 'deactivate' | 'delete') => {
    if (selectedQuestions.length === 0) {
      setError('問題を選択してください');
      return;
    }

    setBulkAction(action);
    setBulkDialogOpen(true);
  };

  const confirmBulkAction = async () => {
    if (!bulkAction) return;

    try {
      await adminService.bulkActionQuestions(bulkAction, selectedQuestions);
      setSelectedQuestions([]);
      setBulkDialogOpen(false);
      setBulkAction(null);
      loadData();
    } catch (err: any) {
      setError(err.message || '一括操作に失敗しました');
    }
  };

  const cancelBulkAction = () => {
    setBulkDialogOpen(false);
    setBulkAction(null);
  };

  const handleEdit = (question: Question) => {
    setEditingQuestion(question);
    
    // フォームを問題データで初期化
    setEditForm({
      body: question.body,
      object: question.object,
      clarification: question.clarification,
      genre: question.genre,
      difficulty: question.difficulty,
      is_active: question.is_active,
      choices: question.choices.length > 0 ? question.choices.map(choice => ({
        content: choice.content,
        is_correct: choice.is_correct
      })) : [
        { content: '', is_correct: false },
        { content: '', is_correct: false },
        { content: '', is_correct: false },
        { content: '', is_correct: false }
      ]
    });
    
    setDialogOpen(true);
  };

  const handleCreate = () => {
    setEditingQuestion(null);
    
    // フォームをリセット
    setEditForm({
      body: '',
      object: '',
      clarification: '',
      genre: '',
      difficulty: 1,
      is_active: true,
      choices: [
        { content: '', is_correct: false },
        { content: '', is_correct: false },
        { content: '', is_correct: false },
        { content: '', is_correct: false }
      ]
    });
    
    setDialogOpen(true);
  };

  const handleSave = async () => {
    try {
      // 少なくとも1つの正解があることを確認
      const hasCorrectAnswer = editForm.choices.some(choice => choice.is_correct);
      if (!hasCorrectAnswer) {
        setError('少なくとも1つの正解を設定してください');
        return;
      }

      // 空でない選択肢のみを含める
      const validChoices = editForm.choices.filter(choice => choice.content.trim() !== '');
      if (validChoices.length < 2) {
        setError('少なくとも2つの選択肢を入力してください');
        return;
      }

      // バックエンドAPI用のデータ形式
      const questionData = {
        body: editForm.body,
        object: editForm.object,
        clarification: editForm.clarification,
        genre: editForm.genre,
        difficulty: editForm.difficulty,
        point_weight: 1,
        time_weight: 1,
        is_active: editForm.is_active,
        choices: validChoices.map((choice, index) => ({
          content: choice.content,
          is_correct: choice.is_correct,
          order_index: index
        }))
      };

      if (editingQuestion) {
        // 更新
        await adminService.updateQuestion(editingQuestion.id, questionData);
      } else {
        // 新規作成
        await adminService.createQuestion(questionData);
      }
      
      setDialogOpen(false);
      loadData();
    } catch (err: any) {
      setError(err.message || '問題の保存に失敗しました');
    }
  };

  const handleClose = () => {
    setDialogOpen(false);
    setEditingQuestion(null);
  };

  const handleDelete = (question: Question) => {
    setDeletingQuestion(question);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = async () => {
    if (!deletingQuestion) return;

    try {
      await adminService.deleteQuestion(deletingQuestion.id);
      setDeleteDialogOpen(false);
      setDeletingQuestion(null);
      loadData();
    } catch (err: any) {
      setError(err.message || '問題の削除に失敗しました');
    }
  };

  const cancelDelete = () => {
    setDeleteDialogOpen(false);
    setDeletingQuestion(null);
  };

  const getDifficultyColor = (difficulty: number) => {
    if (difficulty <= 2) return 'success';
    if (difficulty <= 4) return 'warning';
    return 'error';
  };

  const getDifficultyLabel = (difficulty: number) => {
    if (difficulty <= 2) return '初級';
    if (difficulty <= 4) return '中級';
    return '上級';
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
        <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
          <Typography variant="h4" component="h1" color="#27313b">
            問題管理
          </Typography>
          <Button
            variant="contained"
            startIcon={<AddIcon />}
            onClick={handleCreate}
            sx={{ backgroundColor: '#40b87c' }}
          >
            新規問題作成
          </Button>
        </Box>

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
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>ジャンル</InputLabel>
                  <Select
                    value={filters.genre}
                    onChange={(e) => setFilters({ ...filters, genre: e.target.value })}
                    label="ジャンル"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    {Array.isArray(genres) && genres.map((genre) => (
                      <MenuItem key={genre.id} value={genre.id}>
                        {genre.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>難易度</InputLabel>
                  <Select
                    value={filters.difficulty}
                    onChange={(e) => setFilters({ ...filters, difficulty: e.target.value })}
                    label="難易度"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    <MenuItem value="1">1</MenuItem>
                    <MenuItem value="2">2</MenuItem>
                    <MenuItem value="3">3</MenuItem>
                    <MenuItem value="4">4</MenuItem>
                    <MenuItem value="5">5</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <FormControl fullWidth>
                  <InputLabel>状態</InputLabel>
                  <Select
                    value={filters.is_active}
                    onChange={(e) => setFilters({ ...filters, is_active: e.target.value })}
                    label="状態"
                  >
                    <MenuItem value="">すべて</MenuItem>
                    <MenuItem value="true">有効</MenuItem>
                    <MenuItem value="false">無効</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              <Grid item xs={12} sm={6} md={3}>
                <TextField
                  fullWidth
                  label="検索"
                  value={filters.search}
                  onChange={(e) => setFilters({ ...filters, search: e.target.value })}
                  placeholder="問題文で検索"
                />
              </Grid>
            </Grid>
          </CardContent>
        </Card>

        {/* 一括操作 */}
        {selectedQuestions.length > 0 && (
          <Card sx={{ mb: 3 }}>
            <CardContent>
              <Box display="flex" alignItems="center" gap={2}>
                <Typography variant="body1">
                  {selectedQuestions.length}件選択中
                </Typography>
                <Button
                  size="small"
                  onClick={() => handleBulkAction('activate')}
                  sx={{ color: '#4caf50' }}
                >
                  有効化
                </Button>
                <Button
                  size="small"
                  onClick={() => handleBulkAction('deactivate')}
                  sx={{ color: '#ff9800' }}
                >
                  無効化
                </Button>
                <Button
                  size="small"
                  onClick={() => handleBulkAction('delete')}
                  sx={{ color: '#f44336' }}
                >
                  削除
                </Button>
              </Box>
            </CardContent>
          </Card>
        )}

        {/* 問題一覧テーブル */}
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell padding="checkbox">
                  <Checkbox
                    checked={selectedQuestions.length === questions.length && questions.length > 0}
                    indeterminate={selectedQuestions.length > 0 && selectedQuestions.length < questions.length}
                    onChange={(e) => {
                      if (e.target.checked) {
                        setSelectedQuestions(questions.map(q => q.id));
                      } else {
                        setSelectedQuestions([]);
                      }
                    }}
                  />
                </TableCell>
                <TableCell>問題文</TableCell>
                <TableCell>ジャンル</TableCell>
                <TableCell>難易度</TableCell>
                <TableCell>状態</TableCell>
                <TableCell>作成日</TableCell>
                <TableCell>操作</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {questions.map((question) => (
                <TableRow key={question.id}>
                  <TableCell padding="checkbox">
                    <Checkbox
                      checked={selectedQuestions.includes(question.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setSelectedQuestions([...selectedQuestions, question.id]);
                        } else {
                          setSelectedQuestions(selectedQuestions.filter(id => id !== question.id));
                        }
                      }}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" sx={{ maxWidth: 300, overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {question.body}
                    </Typography>
                  </TableCell>
                  <TableCell>{question.genre_name}</TableCell>
                  <TableCell>
                    <Chip
                      label={getDifficultyLabel(question.difficulty)}
                      color={getDifficultyColor(question.difficulty)}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    <Chip
                      label={question.is_active ? '有効' : '無効'}
                      color={question.is_active ? 'success' : 'default'}
                      size="small"
                    />
                  </TableCell>
                  <TableCell>
                    {new Date(question.created_at).toLocaleDateString('ja-JP')}
                  </TableCell>
                  <TableCell>
                    <Box display="flex" gap={1}>
                      <Button
                        size="small"
                        startIcon={<EditIcon />}
                        onClick={() => handleEdit(question)}
                      >
                        編集
                      </Button>
                      <Button
                        size="small"
                        startIcon={<DeleteIcon />}
                        color="error"
                        onClick={() => handleDelete(question)}
                      >
                        削除
                      </Button>
                    </Box>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>

        {questions.length === 0 && (
          <Box textAlign="center" py={4}>
            <Typography variant="body1" color="textSecondary">
              問題が見つかりません
            </Typography>
          </Box>
        )}

        {/* 削除確認ダイアログ */}
        <Dialog open={deleteDialogOpen} onClose={cancelDelete}>
          <DialogTitle>削除確認</DialogTitle>
          <DialogContent>
            <DialogContentText>
              問題「{deletingQuestion?.body.substring(0, 50)}...」を削除しますか？
              この操作は取り消せません。
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelDelete}>キャンセル</Button>
            <Button onClick={confirmDelete} color="error" variant="contained">
              削除
            </Button>
          </DialogActions>
        </Dialog>

        {/* 一括操作確認ダイアログ */}
        <Dialog open={bulkDialogOpen} onClose={cancelBulkAction}>
          <DialogTitle>一括操作確認</DialogTitle>
          <DialogContent>
            <DialogContentText>
              選択した{selectedQuestions.length}件の問題を
              {bulkAction === 'activate' && '有効化'}
              {bulkAction === 'deactivate' && '無効化'}
              {bulkAction === 'delete' && '削除'}
              しますか？
              {bulkAction === 'delete' && ' この操作は取り消せません。'}
            </DialogContentText>
          </DialogContent>
          <DialogActions>
            <Button onClick={cancelBulkAction}>キャンセル</Button>
            <Button 
              onClick={confirmBulkAction} 
              color={bulkAction === 'delete' ? 'error' : 'primary'}
              variant="contained"
            >
              {bulkAction === 'activate' && '有効化'}
              {bulkAction === 'deactivate' && '無効化'}
              {bulkAction === 'delete' && '削除'}
            </Button>
          </DialogActions>
        </Dialog>

        {/* 問題編集ダイアログ */}
        <Dialog open={dialogOpen} onClose={handleClose} maxWidth="md" fullWidth>
          <DialogTitle>
            {editingQuestion ? '問題編集' : '新規問題作成'}
          </DialogTitle>
          <DialogContent>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              {/* 問題文 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="問題文"
                  value={editForm.body}
                  onChange={(e) => setEditForm({ ...editForm, body: e.target.value })}
                  multiline
                  rows={3}
                  required
                />
              </Grid>
              
              {/* 解答例・ポイント */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="解答例・ポイント"
                  value={editForm.object}
                  onChange={(e) => setEditForm({ ...editForm, object: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              
              {/* 補足説明 */}
              <Grid item xs={12}>
                <TextField
                  fullWidth
                  label="補足説明"
                  value={editForm.clarification}
                  onChange={(e) => setEditForm({ ...editForm, clarification: e.target.value })}
                  multiline
                  rows={2}
                />
              </Grid>
              
              {/* ジャンル */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth required>
                  <InputLabel>ジャンル</InputLabel>
                  <Select
                    value={editForm.genre}
                    onChange={(e) => setEditForm({ ...editForm, genre: e.target.value })}
                    label="ジャンル"
                  >
                    {Array.isArray(genres) && genres.map((genre) => (
                      <MenuItem key={genre.id} value={genre.id}>
                        {genre.name}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Grid>
              
              {/* 難易度 */}
              <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>難易度</InputLabel>
                  <Select
                    value={editForm.difficulty}
                    onChange={(e) => setEditForm({ ...editForm, difficulty: Number(e.target.value) })}
                    label="難易度"
                  >
                    <MenuItem value={1}>1 (易しい)</MenuItem>
                    <MenuItem value={2}>2</MenuItem>
                    <MenuItem value={3}>3 (普通)</MenuItem>
                    <MenuItem value={4}>4</MenuItem>
                    <MenuItem value={5}>5 (難しい)</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
              
              {/* 有効/無効 */}
              <Grid item xs={12}>
                <FormControlLabel
                  control={
                    <Switch
                      checked={editForm.is_active}
                      onChange={(e) => setEditForm({ ...editForm, is_active: e.target.checked })}
                    />
                  }
                  label="この問題を有効にする"
                />
              </Grid>
              
              {/* 選択肢 */}
              <Grid item xs={12}>
                <Typography variant="h6" gutterBottom>
                  選択肢
                </Typography>
                {editForm.choices.map((choice, index) => (
                  <Box key={index} sx={{ mb: 2 }}>
                    <Grid container spacing={2} alignItems="center">
                      <Grid item xs>
                        <TextField
                          fullWidth
                          label={`選択肢 ${index + 1}`}
                          value={choice.content}
                          onChange={(e) => {
                            const newChoices = [...editForm.choices];
                            newChoices[index] = { ...choice, content: e.target.value };
                            setEditForm({ ...editForm, choices: newChoices });
                          }}
                        />
                      </Grid>
                      <Grid item>
                        <FormControlLabel
                          control={
                            <Checkbox
                              checked={choice.is_correct}
                              onChange={(e) => {
                                const newChoices = [...editForm.choices];
                                newChoices[index] = { ...choice, is_correct: e.target.checked };
                                setEditForm({ ...editForm, choices: newChoices });
                              }}
                            />
                          }
                          label="正解"
                        />
                      </Grid>
                      {editForm.choices.length > 2 && (
                        <Grid item>
                          <IconButton
                            onClick={() => {
                              const newChoices = editForm.choices.filter((_, i) => i !== index);
                              setEditForm({ ...editForm, choices: newChoices });
                            }}
                            color="error"
                          >
                            <RemoveIcon />
                          </IconButton>
                        </Grid>
                      )}
                    </Grid>
                  </Box>
                ))}
                
                {editForm.choices.length < 6 && (
                  <Button
                    startIcon={<AddIcon />}
                    onClick={() => {
                      setEditForm({
                        ...editForm,
                        choices: [...editForm.choices, { content: '', is_correct: false }]
                      });
                    }}
                    variant="outlined"
                  >
                    選択肢を追加
                  </Button>
                )}
              </Grid>
            </Grid>
          </DialogContent>
          <DialogActions>
            <Button onClick={handleClose}>キャンセル</Button>
            <Button 
              onClick={handleSave} 
              variant="contained" 
              sx={{ backgroundColor: '#40b87c' }}
              disabled={!editForm.body.trim() || !editForm.genre}
            >
              {editingQuestion ? '更新' : '作成'}
            </Button>
          </DialogActions>
        </Dialog>
      </Box>
    </Container>
  );
};

export default QuestionManagement;