const express = require('express');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// In-memory storage for todos
let todos = [
  { id: 1, text: 'Learn React', completed: false },
  { id: 2, text: 'Build a todo app', completed: false }
];
let nextId = 3;

// Routes
app.get('/api/todos', (req, res) => {
  try {
    res.json(todos);
  } catch (error) {
    res.status(500).json({ error: 'Failed to fetch todos' });
  }
});

app.post('/api/todos', (req, res) => {
  try {
    const { text } = req.body;
    if (!text || text.trim() === '') {
      return res.status(400).json({ error: 'Todo text is required' });
    }
    
    const newTodo = {
      id: nextId++,
      text: text.trim(),
      completed: false
    };
    
    todos.push(newTodo);
    res.status(201).json(newTodo);
  } catch (error) {
    res.status(500).json({ error: 'Failed to create todo' });
  }
});

app.put('/api/todos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const { text, completed } = req.body;
    
    const todoIndex = todos.findIndex(todo => todo.id === id);
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    if (text !== undefined) todos[todoIndex].text = text.trim();
    if (completed !== undefined) todos[todoIndex].completed = completed;
    
    res.json(todos[todoIndex]);
  } catch (error) {
    res.status(500).json({ error: 'Failed to update todo' });
  }
});

app.delete('/api/todos/:id', (req, res) => {
  try {
    const id = parseInt(req.params.id);
    const todoIndex = todos.findIndex(todo => todo.id === id);
    
    if (todoIndex === -1) {
      return res.status(404).json({ error: 'Todo not found' });
    }
    
    todos.splice(todoIndex, 1);
    res.status(204).send();
  } catch (error) {
    res.status(500).json({ error: 'Failed to delete todo' });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});