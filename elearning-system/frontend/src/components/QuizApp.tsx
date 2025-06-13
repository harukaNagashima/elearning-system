import React, { useState } from 'react';
import { Box, CircularProgress, Alert, Container } from '@mui/material';
import GenreSelector from './GenreSelector';
import QuizQuestion from './QuizQuestion';
import QuizResult from './QuizResult';
import { Genre, Answer, QuizState } from '../types';
import { api } from '../services/api';
import { progressService } from '../services/progress';

const QuizApp: React.FC = () => {
  const [quizState, setQuizState] = useState<QuizState>({
    selectedGenre: null,
    questions: [],
    currentQuestionIndex: 0,
    answers: [],
    isCompleted: false,
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [isIncorrectReview, setIsIncorrectReview] = useState(false);

  const handleGenreSelect = async (genre: Genre) => {
    try {
      setLoading(true);
      setError(null);
      setIsIncorrectReview(false);
      
      const questions = await api.getRandomQuestions(genre.id as any, 10);
      
      setQuizState({
        selectedGenre: genre,
        questions,
        currentQuestionIndex: 0,
        answers: [],
        isCompleted: false,
      });
      
      setStartTime(new Date());
    } catch (err) {
      setError('問題の取得に失敗しました。もう一度お試しください。');
      console.error('Error loading questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleIncorrectReview = async () => {
    try {
      setLoading(true);
      setError(null);
      setIsIncorrectReview(true);
      
      const questions = await api.getIncorrectQuestions(undefined, 10);
      
      if (questions.length === 0) {
        setError('復習できる間違った問題がありません。まずはクイズに挑戦してみましょう！');
        setLoading(false);
        return;
      }
      
      setQuizState({
        selectedGenre: { id: 0, name: '間違った問題の復習' },
        questions,
        currentQuestionIndex: 0,
        answers: [],
        isCompleted: false,
      });
      
      setStartTime(new Date());
    } catch (err) {
      setError('間違った問題の取得に失敗しました。もう一度お試しください。');
      console.error('Error loading incorrect questions:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAnswer = async (answer: Answer) => {
    const newAnswers = [...quizState.answers, answer];
    const nextIndex = quizState.currentQuestionIndex + 1;

    if (nextIndex >= quizState.questions.length) {
      // クイズ完了時に結果を保存
      try {
        await saveQuizSession(newAnswers);
      } catch (err) {
        console.error('Failed to save quiz session:', err);
      }
      
      setQuizState({
        ...quizState,
        answers: newAnswers,
        isCompleted: true,
      });
    } else {
      setQuizState({
        ...quizState,
        answers: newAnswers,
        currentQuestionIndex: nextIndex,
      });
    }
  };

  const saveQuizSession = async (answers: Answer[]) => {
    if (!quizState.selectedGenre || !startTime || isIncorrectReview) return;

    try {
      const sessionData = {
        session_type: 'genre',
        genre: String(quizState.selectedGenre.id),
        total_questions: quizState.questions.length,
        answers: answers.map(answer => ({
          question_id: answer.questionId,
          selected_choice_id: answer.selectedChoiceId,
          is_correct: answer.isCorrect,
        })),
      };

      await progressService.saveQuizSession(sessionData);
      console.log('Quiz session saved successfully');
    } catch (error) {
      console.error('Error saving quiz session:', error);
      throw error;
    }
  };

  const handleRestart = async () => {
    if (isIncorrectReview) {
      await handleIncorrectReview();
    } else if (quizState.selectedGenre) {
      await handleGenreSelect(quizState.selectedGenre);
    }
  };

  const handleSelectNewGenre = () => {
    setQuizState({
      selectedGenre: null,
      questions: [],
      currentQuestionIndex: 0,
      answers: [],
      isCompleted: false,
    });
    setError(null);
    setStartTime(null);
    setIsIncorrectReview(false);
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="100vh">
        <CircularProgress sx={{ color: '#40b87c' }} />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box mt={4}>
          <Alert severity="error" onClose={handleSelectNewGenre}>
            {error}
          </Alert>
        </Box>
      </Container>
    );
  }

  if (!quizState.selectedGenre) {
    return <GenreSelector onGenreSelect={handleGenreSelect} onIncorrectReview={handleIncorrectReview} />;
  }

  if (quizState.isCompleted) {
    return (
      <QuizResult
        answers={quizState.answers}
        questions={quizState.questions}
        onRestart={handleRestart}
        onSelectNewGenre={handleSelectNewGenre}
      />
    );
  }

  const currentQuestion = quizState.questions[quizState.currentQuestionIndex];

  return (
    <QuizQuestion
      question={currentQuestion}
      currentIndex={quizState.currentQuestionIndex}
      totalQuestions={quizState.questions.length}
      onAnswer={handleAnswer}
    />
  );
};

export default QuizApp;