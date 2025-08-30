const API_URL = import.meta.env.VITE_API_URL ?? 'http://localhost:5000';

async function req(path, opts={}){
  const r = await fetch(`${API_URL}${path}`, {
    headers: {'Content-Type':'application/json'},
    ...opts
  });
  if(!r.ok) throw new Error((await r.json().catch(()=>({error:r.statusText}))).error || 'Request failed');
  return r.json();
}

export const api = {
  listProjects(){ return req('/api/projects'); },
  createProject(body){ return req('/api/projects', { method:'POST', body: JSON.stringify(body) }); },
  updateProject(id, body){ return req(`/api/projects/${id}`, { method:'PATCH', body: JSON.stringify(body) }); },
  deleteProject(id){ return req(`/api/projects/${id}`, { method:'DELETE' }); },

  listTasks(pid){ return req(`/api/projects/${pid}/tasks`); },
  createTask(pid, body){ return req(`/api/projects/${pid}/tasks`, { method:'POST', body: JSON.stringify(body) }); },
  updateTask(id, body){ return req(`/api/tasks/${id}`, { method:'PATCH', body: JSON.stringify(body) }); },
  deleteTask(id){ return req(`/api/tasks/${id}`, { method:'DELETE' }); },
}
