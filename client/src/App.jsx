import React, { useEffect, useMemo, useState } from 'react'
import { api } from './api'

const PRIORITY = ['low','medium','high']
const STATUS = [
  ['backlog','Backlog'],
  ['in_progress','In Progress'],
  ['done','Done']
]

export default function App(){
  const [projects, setProjects] = useState([])
  const [active, setActive] = useState(null)
  const [tasks, setTasks] = useState([])
  const [loading, setLoading] = useState(false)
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [editTask, setEditTask] = useState(null)
  const [query, setQuery] = useState('')
  const [filterStatus, setFilterStatus] = useState('all')

  // initial load
  useEffect(() => {
    (async () => {
      const ps = await api.listProjects()
      setProjects(ps)
      if(ps[0]) selectProject(ps[0].id)
    })().catch(console.error)
  }, [])

  async function selectProject(id){
    setActive(id)
    setLoading(true)
    try{
      const t = await api.listTasks(id)
      setTasks(t)
    } finally {
      setLoading(false)
    }
  }

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return tasks.filter(t => {
      const matchesText = !q || `${t.title} ${t.description} ${t.assignee}`.toLowerCase().includes(q)
      const matchesStatus = filterStatus === 'all' || t.status === filterStatus
      return matchesText && matchesStatus
    })
  }, [tasks, query, filterStatus])

  const columns = useMemo(() => {
    const map = { backlog:[], in_progress:[], done:[] }
    for(const t of filtered) map[t.status]?.push(t)
    return map
  }, [filtered])

  function ProjectList(){
    return (
      <div className="sidebar">
        <div className="row" style={{justifyContent:'space-between'}}>
          <h2>Projects</h2>
          <button className="primary" onClick={() => setShowProjectModal(true)}>+ New</button>
        </div>
        {projects.length === 0 && <div className="empty">No projects yet. Create one!</div>}
        {projects.map(p => (
          <div key={p.id} className={'project ' + (active===p.id ? 'active':'')} onClick={() => selectProject(p.id)}>
            <div>
              <div style={{fontWeight:600}}>{p.name}</div>
              <div className="muted" style={{fontSize:12}}>{p.description}</div>
            </div>
            <button className="ghost" onClick={(e)=>{e.stopPropagation(); removeProject(p.id)}}>🗑️</button>
          </div>
        ))}
      </div>
    )
  }

  async function removeProject(id){
    if(!confirm('Delete this project and all its tasks?')) return;
    await api.deleteProject(id)
    const next = projects.filter(p => p.id !== id)
    setProjects(next)
    if(active === id){
      setActive(next[0]?.id ?? null)
      if(next[0]) selectProject(next[0].id); else setTasks([])
    }
  }

  function Header(){
    const p = projects.find(x => x.id === active)
    return (
      <div className="header">
        <div className="row">
          <div style={{fontSize:18, fontWeight:700}}>{p ? p.name : 'No project selected'}</div>
          {p && <span className="badge" title="Created">{new Date(p.createdAt).toLocaleString()}</span>}
        </div>
        <div className="toolbar">
          <input className="search" placeholder="Search tasks..." value={query} onChange={e=>setQuery(e.target.value)} />
          <select value={filterStatus} onChange={e=>setFilterStatus(e.target.value)}>
            <option value="all">All</option>
            {STATUS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
          </select>
          <button className="primary" onClick={()=> setShowTaskModal(true)} disabled={!active}>+ New Task</button>
        </div>
      </div>
    )
  }

  function Board(){
    return (
      <div style={{overflow:'auto'}}>
        <div className="board">
          {STATUS.map(([value, label]) => (
            <div key={value} className="column">
              <h3>{label}</h3>
              {loading && <div className="muted">Loading…</div>}
              {!loading && columns[value].length === 0 && <div className="empty">No tasks</div>}
              {!loading && columns[value].map(t => <TaskCard key={t.id} task={t} />)}
            </div>
          ))}
        </div>
      </div>
    )
  }

  function TaskCard({ task }){
    return (
      <div className="card">
        <div className="row" style={{justifyContent:'space-between'}}>
          <div className="title">{task.title}</div>
          <div className="row">
            <select value={task.status} onChange={e=> saveTask(task.id,{ status: e.target.value })}>
              {STATUS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button className="ghost" onClick={()=> edit(task)}>✏️</button>
            <button className="ghost" onClick={()=> removeTask(task.id)}>🗑️</button>
          </div>
        </div>
        {task.description && <div className="muted" style={{marginTop:6}}>{task.description}</div>}
        <div className="chips">
          <span className={'chip ' + task.priority}>{task.priority}</span>
          {task.assignee && <span className="chip">@{task.assignee}</span>}
          {task.dueDate && <span className="chip">{new Date(task.dueDate).toLocaleDateString()}</span>}
        </div>
      </div>
    )
  }

  function edit(t){ setEditTask(t); setShowTaskModal(true) }

  async function saveTask(id, patch){
    const updated = await api.updateTask(id, patch)
    setTasks(ts => ts.map(t => t.id === id ? updated : t))
  }
  async function removeTask(id){
    if(!confirm('Delete this task?')) return;
    await api.deleteTask(id)
    setTasks(ts => ts.filter(t => t.id !== id))
  }

  return (
    <div className="app">
      <ProjectList />
      <div style={{display:'flex', flexDirection:'column', minWidth:0}}>
        <Header />
        {active ? <Board /> : <div style={{padding:20}} className="empty">Create or select a project to begin.</div>}
      </div>

      {showProjectModal && <ProjectModal onClose={()=>setShowProjectModal(false)} onCreate={p => { setProjects(ps=>[p,...ps]); selectProject(p.id) }} />}
      {showTaskModal && <TaskModal onClose={()=>{ setShowTaskModal(false); setEditTask(null) }} projectId={active} onCreate={t => setTasks(ts=>[t,...ts])} edit={editTask} onSave={(t)=> setTasks(ts => ts.map(x=> x.id===t.id?t:x))} />}
    </div>
  )
}

function ProjectModal({ onClose, onCreate }){
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  async function submit(e){
    e.preventDefault()
    const p = await api.createProject({ name, description })
    onCreate(p)
    onClose()
  }

  return (
    <div className="modal" onMouseDown={onClose}>
      <div className="panel" onMouseDown={e=>e.stopPropagation()}>
        <h3 style={{marginTop:0}}>New Project</h3>
        <form onSubmit={submit}>
          <div className="grid2">
            <label className="row">Name <input className="grow" value={name} onChange={e=>setName(e.target.value)} required /></label>
            <label className="row">Description <input className="grow" value={description} onChange={e=>setDescription(e.target.value)} /></label>
          </div>
          <div className="footer">
            <button type="button" onClick={onClose}>Cancel</button>
            <button className="primary">Create</button>
          </div>
        </form>
      </div>
    </div>
  )
}

function TaskModal({ onClose, projectId, onCreate, edit, onSave }){
  const [title, setTitle] = useState(edit?.title ?? '')
  const [description, setDescription] = useState(edit?.description ?? '')
  const [status, setStatus] = useState(edit?.status ?? 'backlog')
  const [assignee, setAssignee] = useState(edit?.assignee ?? '')
  const [dueDate, setDueDate] = useState(edit?.dueDate ? edit.dueDate.split('T')[0] : '')
  const [priority, setPriority] = useState(edit?.priority ?? 'medium')

  async function submit(e){
    e.preventDefault()
    if(edit){
      const updated = await api.updateTask(edit.id, { title, description, status, assignee, dueDate, priority })
      onSave(updated)
      onClose()
      return
    }
    const t = await api.createTask(projectId, { title, description, status, assignee, dueDate, priority })
    onCreate(t)
    onClose()
  }

  return (
    <div className="modal" onMouseDown={onClose}>
      <div className="panel" onMouseDown={e=>e.stopPropagation()}>
        <h3 style={{marginTop:0}}>{edit ? 'Edit Task' : 'New Task'}</h3>
        <form onSubmit={submit}>
          <div className="grid2">
            <label className="row">Title <input className="grow" value={title} onChange={e=>setTitle(e.target.value)} required /></label>
            <label className="row">Assignee <input className="grow" value={assignee} onChange={e=>setAssignee(e.target.value)} placeholder="e.g., aman" /></label>
            <label className="row">Priority 
              <select className="grow" value={priority} onChange={e=>setPriority(e.target.value)}>
                {PRIORITY.map(p => <option key={p} value={p}>{p}</option>)}
              </select>
            </label>
            <label className="row">Status 
              <select className="grow" value={status} onChange={e=>setStatus(e.target.value)}>
                {STATUS.map(([v,l]) => <option key={v} value={v}>{l}</option>)}
              </select>
            </label>
            <label className="row">Due Date <input className="grow" type="date" value={dueDate} onChange={e=>setDueDate(e.target.value)} /></label>
            <label className="row">Description <input className="grow" value={description} onChange={e=>setDescription(e.target.value)} /></label>
          </div>
          <div className="footer">
            <button type="button" onClick={onClose}>Cancel</button>
            <button className="primary">{edit ? 'Save' : 'Create'}</button>
          </div>
        </form>
      </div>
    </div>
  )
}
