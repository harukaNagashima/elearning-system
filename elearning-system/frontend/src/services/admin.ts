import { Genre, Question, User } from '../types';
import { authService } from './auth';

const API_BASE_URL = 'http://localhost:8000/api/admin';

class AdminService {
  private getHeaders(): HeadersInit {
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
    };
    
    if (authService.isAuthenticated()) {
      try {
        const token = authService.getAccessToken();
        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
      } catch (error) {
        console.warn('Failed to get auth token:', error);
      }
    }
    
    return headers;
  }

  // 統計情報
  async getStats() {
    const response = await fetch(`${API_BASE_URL}/stats/`, {
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to fetch admin stats');
    }
    
    return response.json();
  }

  // ジャンル管理
  async getGenres(): Promise<Genre[]> {
    try {
      const response = await fetch(`${API_BASE_URL}/genres/`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch genres: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Admin getGenres response:', data);
      
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.results)) {
        return data.results;
      } else {
        console.error('Unexpected genres response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Error in getGenres:', error);
      throw error;
    }
  }

  async createGenre(genre: Omit<Genre, 'id'>): Promise<Genre> {
    const response = await fetch(`${API_BASE_URL}/genres/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify(genre),
    });
    
    if (!response.ok) {
      throw new Error('Failed to create genre');
    }
    
    return response.json();
  }

  async updateGenre(id: string | number, genre: Partial<Genre>): Promise<Genre> {
    const response = await fetch(`${API_BASE_URL}/genres/${id}/`, {
      method: 'PUT',
      headers: this.getHeaders(),
      body: JSON.stringify(genre),
    });
    
    if (!response.ok) {
      throw new Error('Failed to update genre');
    }
    
    return response.json();
  }

  async deleteGenre(id: string | number): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/genres/${id}/`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete genre');
    }
  }

  // 問題管理
  async getQuestions(filters?: {
    genre?: string;
    difficulty?: number;
    search?: string;
    is_active?: boolean;
  }): Promise<Question[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.genre) params.append('genre', filters.genre);
        if (filters.difficulty) params.append('difficulty', filters.difficulty.toString());
        if (filters.search) params.append('search', filters.search);
        if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
      }
      
      const response = await fetch(`${API_BASE_URL}/questions/?${params}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch questions: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Admin getQuestions response:', data);
      
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.results)) {
        return data.results;
      } else {
        console.error('Unexpected questions response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Error in getQuestions:', error);
      throw error;
    }
  }

  async createQuestion(question: any): Promise<Question> {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(question),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to create question');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error creating question:', error);
      throw error;
    }
  }

  async updateQuestion(id: string, question: any): Promise<Question> {
    try {
      const response = await fetch(`${API_BASE_URL}/questions/${id}/`, {
        method: 'PUT',
        headers: this.getHeaders(),
        body: JSON.stringify(question),
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.detail || 'Failed to update question');
      }
      
      return response.json();
    } catch (error) {
      console.error('Error updating question:', error);
      throw error;
    }
  }

  async deleteQuestion(id: string): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/questions/${id}/`, {
      method: 'DELETE',
      headers: this.getHeaders(),
    });
    
    if (!response.ok) {
      throw new Error('Failed to delete question');
    }
  }

  async bulkActionQuestions(action: 'activate' | 'deactivate' | 'delete', questionIds: string[]): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/questions/bulk-action/`, {
      method: 'POST',
      headers: this.getHeaders(),
      body: JSON.stringify({
        action,
        question_ids: questionIds,
      }),
    });
    
    if (!response.ok) {
      throw new Error('Failed to perform bulk action');
    }
    
    return response.json();
  }

  // ユーザー管理
  async getUsers(filters?: {
    search?: string;
    is_active?: boolean;
    is_staff?: boolean;
  }): Promise<User[]> {
    try {
      const params = new URLSearchParams();
      
      if (filters) {
        if (filters.search) params.append('search', filters.search);
        if (filters.is_active !== undefined) params.append('is_active', filters.is_active.toString());
        if (filters.is_staff !== undefined) params.append('is_staff', filters.is_staff.toString());
      }
      
      const response = await fetch(`${API_BASE_URL}/users/?${params}`, {
        headers: this.getHeaders(),
      });
      
      if (!response.ok) {
        throw new Error(`Failed to fetch users: ${response.status}`);
      }
      
      const data = await response.json();
      console.log('Admin getUsers response:', data);
      
      if (Array.isArray(data)) {
        return data;
      } else if (data && Array.isArray(data.results)) {
        return data.results;
      } else {
        console.error('Unexpected users response format:', data);
        return [];
      }
    } catch (error) {
      console.error('Error in getUsers:', error);
      throw error;
    }
  }

  async updateUser(id: string, user: Partial<User>): Promise<User> {
    try {
      console.log('Updating user:', { id, user });
      
      const response = await fetch(`${API_BASE_URL}/users/${id}/`, {
        method: 'PATCH',
        headers: this.getHeaders(),
        body: JSON.stringify(user),
      });
      
      console.log('Update user response status:', response.status);
      
      if (!response.ok) {
        let errorMessage = 'Failed to update user';
        try {
          const errorData = await response.json();
          console.error('Update user error response:', errorData);
          
          if (response.status === 401) {
            errorMessage = '認証が必要です。再ログインしてください。';
          } else if (response.status === 403) {
            errorMessage = '権限がありません。';
          } else if (errorData.detail) {
            errorMessage = errorData.detail;
          } else if (errorData.message) {
            errorMessage = errorData.message;
          } else if (typeof errorData === 'object') {
            // フィールドエラーの場合
            const fieldErrors = Object.entries(errorData)
              .map(([field, errors]) => `${field}: ${Array.isArray(errors) ? errors.join(', ') : errors}`)
              .join('; ');
            if (fieldErrors) {
              errorMessage = fieldErrors;
            }
          }
        } catch (parseError) {
          console.error('Error parsing error response:', parseError);
          errorMessage = `HTTP ${response.status}: ${response.statusText}`;
        }
        
        throw new Error(errorMessage);
      }
      
      const data = await response.json();
      console.log('User updated successfully:', data);
      return data;
    } catch (error) {
      console.error('Error in updateUser:', error);
      throw error;
    }
  }
}

export const adminService = new AdminService();