import React, { useState } from 'react';
import {
  Card,
  CardContent,
  Typography,
  Button,
  RadioGroup,
  FormControlLabel,
  Radio,
  Box,
  Container,
  Chip,
  Alert,
  Collapse,
  LinearProgress,
} from '@mui/material';
import { Question, Answer } from '../types';

interface QuizQuestionProps {
  question: Question;
  currentIndex: number;
  totalQuestions: number;
  onAnswer: (answer: Answer) => void;
}

const QuizQuestion: React.FC<QuizQuestionProps> = ({
  question,
  currentIndex,
  totalQuestions,
  onAnswer,
}) => {
  const [selectedChoiceId, setSelectedChoiceId] = useState<string | null>(null);
  const [showResult, setShowResult] = useState(false);
  const [isCorrect, setIsCorrect] = useState(false);

  const handleAnswerChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedChoiceId(event.target.value);
  };

  const handleSubmit = () => {
    if (!selectedChoiceId) return;

    const selectedChoice = question.choices.find(c => c.id === selectedChoiceId);
    if (!selectedChoice) return;

    const correct = selectedChoice.is_correct;
    setIsCorrect(correct);
    setShowResult(true);

    const answer: Answer = {
      questionId: question.id,
      selectedAnswer: selectedChoice.content,
      selectedChoiceId: selectedChoiceId,
      isCorrect: correct,
    };

    setTimeout(() => {
      onAnswer(answer);
      setSelectedChoiceId(null);
      setShowResult(false);
    }, 2000);
  };

  const progress = ((currentIndex + 1) / totalQuestions) * 100;

  return (
    <Container maxWidth="md">
      <Box mt={4}>
        <Box mb={3}>
          <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
            <Typography variant="h6" color="#27313b">
              問題 {currentIndex + 1} / {totalQuestions}
            </Typography>
            <Chip
              label={`進捗: ${Math.round(progress)}%`}
              color="primary"
              sx={{ backgroundColor: '#40b87c' }}
            />
          </Box>
          <LinearProgress 
            variant="determinate" 
            value={progress} 
            sx={{
              height: 8,
              borderRadius: 4,
              backgroundColor: '#e0e0e0',
              '& .MuiLinearProgress-bar': {
                backgroundColor: '#40b87c',
              },
            }}
          />
        </Box>

        <Card>
          <CardContent>
            <Typography variant="body2" color="textSecondary" mb={1}>
              {question.object}
            </Typography>
            <Typography variant="h5" component="h2" gutterBottom color="#27313b">
              {question.body}
            </Typography>

            <RadioGroup value={selectedChoiceId || ''} onChange={handleAnswerChange}>
              {question.choices
                .filter((choice) => choice.content && choice.content.trim() !== '')
                .sort((a, b) => a.order_index - b.order_index)
                .map((choice) => {
                  const correctChoice = question.choices.find(c => c.is_correct);
                  return (
                    <FormControlLabel
                      key={choice.id}
                      value={choice.id}
                      control={<Radio sx={{ '&.Mui-checked': { color: '#40b87c' } }} />}
                      label={
                        <Typography
                          variant="body1"
                          sx={{
                            color: showResult
                              ? choice.is_correct
                                ? '#40b87c'
                                : choice.id === selectedChoiceId
                                ? '#f44336'
                                : 'inherit'
                              : 'inherit',
                            fontWeight: showResult && choice.is_correct ? 'bold' : 'normal',
                          }}
                        >
                          {choice.content}
                        </Typography>
                      }
                      disabled={showResult}
                    />
                  );
                })}
            </RadioGroup>

            <Box mt={3}>
              <Button
                variant="contained"
                fullWidth
                onClick={handleSubmit}
                disabled={!selectedChoiceId || showResult}
                sx={{
                  backgroundColor: '#40b87c',
                  '&:hover': {
                    backgroundColor: '#359c68',
                  },
                  '&:disabled': {
                    backgroundColor: '#cccccc',
                  },
                }}
              >
                解答する
              </Button>
            </Box>

            <Collapse in={showResult}>
              <Box mt={3}>
                <Alert severity={isCorrect ? 'success' : 'error'}>
                  {isCorrect ? '正解です！' : '不正解です。'}
                </Alert>
                <Box mt={2}>
                  <Typography variant="body2" color="textSecondary">
                    <strong>正解:</strong> {question.choices.find(c => c.is_correct)?.content}
                  </Typography>
                  {question.clarification && (
                    <Typography 
                      variant="body2" 
                      color="textSecondary" 
                      mt={1}
                      dangerouslySetInnerHTML={{ __html: question.clarification.replace(/\\n/g, '<br />') }}
                    >
                    </Typography>
                  )}
                </Box>
              </Box>
            </Collapse>
          </CardContent>
        </Card>
      </Box>
    </Container>
  );
};

export default QuizQuestion;