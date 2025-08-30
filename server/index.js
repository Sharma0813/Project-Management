import express from 'express';
import cors from 'cors';
import { readDB, writeDB, ensureDB } from './utils/db.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json({ limit: '1mb' }));

ensureDB();

// Health
app.get('/api/health', (_req, res) => res.json({ ok: true }));

// List projects
app.get('/api/projects', async (_req, res) => {
  const db = await readDB();
  res.json(db.projects);
});

// Create project
app.post('/api/projects', async (req, res) => {
  const { name, description='' } = req.body || {};
  if (!name || !name.trim()) return res.status(400).json({ error: 'Name is required' });
  const db = await readDB();
  const project = {
    id: crypto.randomUUID(),
    name: name.trim(),
    description: String(description || ''),
    createdAt: new Date().toISOString()
  };
  db.projects.push(project);
  await writeDB(db);
  res.status(201).json(project);
});

// Update project
app.patch('/api/projects/:id', async (req, res) => {
  const db = await readDB();
  const i = db.projects.findIndex(p => p.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Project not found' });
  const p = db.projects[i];
  const { name, description } = req.body || {};
  if (name !== undefined) p.name = String(name);
  if (description !== undefined) p.description = String(description);
  db.projects[i] = p;
  await writeDB(db);
  res.json(p);
});

// Delete project + its tasks
app.delete('/api/projects/:id', async (req, res) => {
  const db = await readDB();
  const before = db.projects.length;
  db.projects = db.projects.filter(p => p.id !== req.params.id);
  db.tasks = db.tasks.filter(t => t.projectId !== req.params.id);
  if (db.projects.length === before) return res.status(404).json({ error: 'Project not found' });
  await writeDB(db);
  res.json({ ok: true });
});

// Get tasks for a project
app.get('/api/projects/:id/tasks', async (req, res) => {
  const db = await readDB();
  const tasks = db.tasks.filter(t => t.projectId === req.params.id);
  res.json(tasks);
});

// Create task for a project
app.post('/api/projects/:id/tasks', async (req, res) => {
  const { title, description='', status='backlog', assignee='', dueDate='', priority='medium' } = req.body || {};
  if (!title || !title.trim()) return res.status(400).json({ error: 'Title is required' });
  const db = await readDB();
  // ensure project exists
  const exists = db.projects.some(p => p.id === req.params.id);
  if (!exists) return res.status(404).json({ error: 'Project not found' });
  const task = {
    id: crypto.randomUUID(),
    projectId: req.params.id,
    title: title.trim(),
    description: String(description || ''),
    status: ['backlog','in_progress','done'].includes(status) ? status : 'backlog',
    assignee: String(assignee || ''),
    dueDate: String(dueDate || ''),
    priority: ['low','medium','high'].includes(priority) ? priority : 'medium',
    createdAt: new Date().toISOString()
  };
  db.tasks.push(task);
  await writeDB(db);
  res.status(201).json(task);
});

// Update task
app.patch('/api/tasks/:id', async (req, res) => {
  const db = await readDB();
  const i = db.tasks.findIndex(t => t.id === req.params.id);
  if (i === -1) return res.status(404).json({ error: 'Task not found' });
  const t = db.tasks[i];
  const { title, description, status, assignee, dueDate, priority } = req.body || {};
  if (title !== undefined) t.title = String(title);
  if (description !== undefined) t.description = String(description);
  if (status !== undefined && ['backlog','in_progress','done'].includes(status)) t.status = status;
  if (assignee !== undefined) t.assignee = String(assignee);
  if (dueDate !== undefined) t.dueDate = String(dueDate);
  if (priority !== undefined && ['low','medium','high'].includes(priority)) t.priority = priority;
  db.tasks[i] = t;
  await writeDB(db);
  res.json(t);
});

// Delete task
app.delete('/api/tasks/:id', async (req, res) => {
  const db = await readDB();
  const before = db.tasks.length;
  db.tasks = db.tasks.filter(t => t.id !== req.params.id);
  if (db.tasks.length === before) return res.status(404).json({ error: 'Task not found' });
  await writeDB(db);
  res.json({ ok: true });
});

app.listen(PORT, () => console.log(`Server listening on http://localhost:${PORT}`));
