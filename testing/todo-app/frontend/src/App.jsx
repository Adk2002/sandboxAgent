import React, { useState, useEffect } from 'react';

function App() {
  const [todos, setTodos] = useState([]);
  const [newTodo, setNewTodo] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchTodos();
  }, []);

  const fetchTodos = async () => {
    try {
      const response = await fetch('/api/todos');
      if (!response.ok) throw new Error('Failed to fetch todos');
      const data = await response.json();
      setTodos(data);
    } catch (err) {
      setError('Failed to load todos');
    } finally {
      setLoading(false);
    }
  };

  const addTodo = async (e) => {
    e.preventDefault();
    if (!newTodo.trim()) return;

    try {
      const response = await fetch('/api/todos', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: newTodo })
      });
      
      if (!response.ok) throw new Error('Failed to add todo');
      const todo = await response.json();
      setTodos([...todos, todo]);
      setNewTodo('');
      setError('');
    } catch (err) {
      setError('Failed to add todo');
    }
  };

  const toggleTodo = async (id, completed) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ completed })
      });
      
      if (!response.ok) throw new Error('Failed to update todo');
      const updatedTodo = await response.json();
      setTodos(todos.map(todo => todo.id === id ? updatedTodo : todo));
    } catch (err) {
      setError('Failed to update todo');
    }
  };

  const deleteTodo = async (id) => {
    try {
      const response = await fetch(`/api/todos/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) throw new Error('Failed to delete todo');
      setTodos(todos.filter(todo => todo.id !== id));
    } catch (err) {
      setError('Failed to delete todo');
    }
  };

  if (loading) return <div style={styles.loading}>Loading...</div>;

  return (
    <div style={styles.container}>
      <div style={styles.card}>
        <h1 style={styles.title}>Todo App</h1>
        
        {error && <div style={styles.error}>{error}</div>}
        
        <form onSubmit={addTodo} style={styles.form}>
          <input
            type="text"
            value={newTodo}
            onChange={(e) => setNewTodo(e.target.value)}
            placeholder="Add a new todo..."
            style={styles.input}
          />
          <button type="submit" style={styles.addButton}>Add</button>
        </form>
        
        <div style={styles.todoList}>
          {todos.length === 0 ? (
            <p style={styles.emptyState}>No todos yet. Add one above!</p>
          ) : (
            todos.map(todo => (
              <div key={todo.id} style={styles.todoItem}>
                <input
                  type="checkbox"
                  checked={todo.completed}
                  onChange={(e) => toggleTodo(todo.id, e.target.checked)}
                  style={styles.checkbox}
                />
                <span 
                  style={{
                    ...styles.todoText,
                    textDecoration: todo.completed ? 'line-through' : 'none',
                    opacity: todo.completed ? 0.6 : 1
                  }}
                >
                  {todo.text}
                </span>
                <button 
                  onClick={() => deleteTodo(todo.id)}
                  style={styles.deleteButton}
                >
                  Delete
                </button>
              </div>
            ))
          )}
        </div>
        
        <div style={styles.stats}>
          <span>{todos.filter(t => !t.completed).length} remaining</span>
          <span>{todos.length} total</span>
        </div>
      </div>
    </div>
  );
}

const styles = {
  container: {
    minHeight: '100vh',
    backgroundColor: '#f5f7fa',
    padding: '20px',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
  },
  card: {
    maxWidth: '600px',
    margin: '0 auto',
    backgroundColor: 'white',
    borderRadius: '12px',
    padding: '32px',
    boxShadow: '0 4px 6px rgba(0, 0, 0, 0.07)'
  },
  title: {
    fontSize: '32px',
    fontWeight: '700',
    color: '#2d3748',
    marginBottom: '24px',
    textAlign: 'center'
  },
  form: {
    display: 'flex',
    gap: '12px',
    marginBottom: '24px'
  },
  input: {
    flex: 1,
    padding: '12px 16px',
    border: '2px solid #e2e8f0',
    borderRadius: '8px',
    fontSize: '16px',
    outline: 'none',
    transition: 'border-color 0.2s'
  },
  addButton: {
    padding: '12px 24px',
    backgroundColor: '#3182ce',
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    fontSize: '16px',
    fontWeight: '600',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  todoList: {
    marginBottom: '24px'
  },
  todoItem: {
    display: 'flex',
    alignItems: 'center',
    gap: '12px',
    padding: '16px',
    backgroundColor: '#f8f9fa',
    borderRadius: '8px',
    marginBottom: '8px',
    border: '1px solid #e9ecef'
  },
  checkbox: {
    width: '20px',
    height: '20px',
    cursor: 'pointer'
  },
  todoText: {
    flex: 1,
    fontSize: '16px',
    color: '#2d3748'
  },
  deleteButton: {
    padding: '6px 12px',
    backgroundColor: '#e53e3e',
    color: 'white',
    border: 'none',
    borderRadius: '6px',
    fontSize: '14px',
    cursor: 'pointer',
    transition: 'background-color 0.2s'
  },
  stats: {
    display: 'flex',
    justifyContent: 'space-between',
    fontSize: '14px',
    color: '#718096',
    paddingTop: '16px',
    borderTop: '1px solid #e2e8f0'
  },
  emptyState: {
    textAlign: 'center',
    color: '#718096',
    fontSize: '16px',
    padding: '32px'
  },
  loading: {
    display: 'flex',
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: '100vh',
    fontSize: '18px',
    color: '#718096'
  },
  error: {
    backgroundColor: '#fed7d7',
    color: '#c53030',
    padding: '12px 16px',
    borderRadius: '8px',
    marginBottom: '16px',
    fontSize: '14px'
  }
};

export default App;