import { useState, useEffect, useRef } from 'react';
import Icon from '@/components/ui/icon';
import { ThemeToggle } from '@/components/theme-toggle';

const API_URL = 'https://functions.poehali.dev/f3667341-23fd-4998-a0ad-e8f295ec2cbb';

interface Record {
  id: number;
  name: string;
  description: string;
  status: string;
  created_at: string;
  updated_at: string;
}

type EditingRow = {
  id: number;
  name: string;
  description: string;
  status: string;
} | null;

const STATUS_LABELS: Record<string, string> = {
  active: 'Активен',
  inactive: 'Неактивен',
};

function formatDate(iso: string) {
  if (!iso) return '—';
  const d = new Date(iso);
  return d.toLocaleDateString('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' });
}

export default function Index() {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<EditingRow>(null);
  const [saving, setSaving] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newRow, setNewRow] = useState({ name: '', description: '', status: 'active' });
  const [deletingId, setDeletingId] = useState<number | null>(null);
  const nameRef = useRef<HTMLInputElement>(null);

  const fetchRecords = async () => {
    setLoading(true);
    const res = await fetch(API_URL);
    const data = await res.json();
    setRecords(data);
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, []);

  const startEdit = (r: Record) => {
    setEditing({ id: r.id, name: r.name, description: r.description, status: r.status });
  };

  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    if (!editing) return;
    setSaving(true);
    await fetch(API_URL, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(editing),
    });
    await fetchRecords();
    setEditing(null);
    setSaving(false);
  };

  const deleteRecord = async (id: number) => {
    setDeletingId(id);
    await fetch(API_URL, {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id }),
    });
    await fetchRecords();
    setDeletingId(null);
  };

  const addRecord = async () => {
    if (!newRow.name.trim()) return;
    setSaving(true);
    await fetch(API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(newRow),
    });
    await fetchRecords();
    setNewRow({ name: '', description: '', status: 'active' });
    setAdding(false);
    setSaving(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      if (editing) { saveEdit(); } else { addRecord(); }
    }
    if (e.key === 'Escape') { cancelEdit(); setAdding(false); }
  };

  return (
    <div className="min-h-screen font-sans relative overflow-hidden" style={{background: '#0f0f13'}}>
      {/* Subtle blobs */}
      <div className="absolute top-[-60px] left-[-60px] w-[500px] h-[500px] rounded-full blur-3xl" style={{background: 'radial-gradient(circle, rgba(99,102,241,0.18), transparent)'}} />
      <div className="absolute bottom-[-40px] right-[-40px] w-[400px] h-[400px] rounded-full blur-3xl" style={{background: 'radial-gradient(circle, rgba(168,85,247,0.12), transparent)'}} />

      {/* Header */}
      <header className="px-8 py-5 flex items-center justify-between backdrop-blur-md border-b" style={{background: 'rgba(255,255,255,0.15)', borderColor: 'rgba(255,255,255,0.25)'}}>
        <div>
          <h1 className="text-xl font-semibold text-white tracking-tight drop-shadow">Записки</h1>
          <p className="text-sm text-white/60 mt-0.5 font-mono">{records.length} строк</p>
        </div>
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <button
            onClick={() => { setAdding(true); setTimeout(() => nameRef.current?.focus(), 50); }}
            className="flex items-center gap-2 px-4 py-2 text-white text-sm font-medium rounded-lg transition-colors backdrop-blur-sm border border-white/30 hover:bg-white/20"
            style={{background: 'rgba(255,255,255,0.15)'}}
          >
            <Icon name="Plus" size={15} />
            Добавить
          </button>
        </div>
      </header>

      {/* Table */}
      <main className="px-8 py-6 relative z-10">
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-2 text-white/70">
            <Icon name="Loader" size={18} className="animate-spin" />
            <span className="text-sm">Загрузка...</span>
          </div>
        ) : (
          <div className="rounded-2xl overflow-hidden border border-white/25 backdrop-blur-md shadow-xl" style={{background: 'rgba(255,255,255,0.12)'}}>
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-white/20" style={{background: 'rgba(255,255,255,0.1)'}}>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/50 uppercase tracking-wider w-10 font-mono">#</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/50 uppercase tracking-wider">Имя</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/50 uppercase tracking-wider">Описание</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/50 uppercase tracking-wider w-28">Статус</th>
                  <th className="text-left px-5 py-3.5 text-xs font-semibold text-white/50 uppercase tracking-wider w-28">Создан</th>
                  <th className="w-20 px-5 py-3.5"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/10">
                {records.map((r, i) => {
                  const isEditing = editing?.id === r.id;
                  return (
                    <tr
                      key={r.id}
                      className="group hover:bg-white/10 transition-colors animate-fade-in"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="px-5 py-3.5 text-white/30 font-mono text-xs">{r.id}</td>

                      {/* Name */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <input
                            className="w-full bg-transparent border-b border-white/40 focus:border-white outline-none text-white py-0.5 transition-colors"
                            value={editing.name}
                            onChange={e => setEditing({ ...editing, name: e.target.value })}
                            onKeyDown={handleKeyDown}
                            autoFocus
                          />
                        ) : (
                          <span className="text-white font-medium">{r.name}</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <input
                            className="w-full bg-transparent border-b border-white/40 focus:border-white outline-none text-white/80 py-0.5 transition-colors"
                            value={editing.description}
                            onChange={e => setEditing({ ...editing, description: e.target.value })}
                            onKeyDown={handleKeyDown}
                          />
                        ) : (
                          <span className="text-white/60">{r.description || '—'}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3.5">
                        {isEditing ? (
                          <select
                            className="bg-transparent border-b border-white/40 focus:border-white outline-none text-white py-0.5 text-sm transition-colors"
                            value={editing.status}
                            onChange={e => setEditing({ ...editing, status: e.target.value })}
                          >
                            <option value="active">Активен</option>
                            <option value="inactive">Неактивен</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 text-xs font-medium ${
                            r.status === 'active' ? 'text-emerald-300' : 'text-white/40'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'active' ? 'bg-emerald-400' : 'bg-white/30'}`} />
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3.5 text-white/40 font-mono text-xs">{formatDate(r.created_at)}</td>

                      {/* Actions */}
                      <td className="px-5 py-3.5">
                        <div className="flex items-center gap-1 justify-end">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className="p-1.5 rounded-md text-emerald-300 hover:bg-white/10 transition-colors disabled:opacity-50"
                                title="Сохранить"
                              >
                                <Icon name="Check" size={14} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className="p-1.5 rounded-md text-white/50 hover:bg-white/10 transition-colors"
                                title="Отмена"
                              >
                                <Icon name="X" size={14} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(r)}
                                className="p-1.5 rounded-md text-white/30 hover:text-white hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100"
                                title="Редактировать"
                              >
                                <Icon name="Pencil" size={14} />
                              </button>
                              <button
                                onClick={() => deleteRecord(r.id)}
                                disabled={deletingId === r.id}
                                className="p-1.5 rounded-md text-white/30 hover:text-red-300 hover:bg-white/10 transition-colors opacity-0 group-hover:opacity-100 disabled:opacity-50"
                                title="Удалить"
                              >
                                <Icon name="Trash2" size={14} />
                              </button>
                            </>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}

                {/* Add row */}
                {adding && (
                  <tr className="bg-white/5 animate-fade-in">
                    <td className="px-5 py-3.5 text-white/30 font-mono text-xs">+</td>
                    <td className="px-5 py-3.5">
                      <input
                        ref={nameRef}
                        className="w-full bg-transparent border-b border-white/40 focus:border-white outline-none text-white py-0.5 transition-colors placeholder:text-white/30"
                        placeholder="Имя..."
                        value={newRow.name}
                        onChange={e => setNewRow({ ...newRow, name: e.target.value })}
                        onKeyDown={handleKeyDown}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <input
                        className="w-full bg-transparent border-b border-white/40 focus:border-white outline-none text-white/80 py-0.5 transition-colors placeholder:text-white/30"
                        placeholder="Описание..."
                        value={newRow.description}
                        onChange={e => setNewRow({ ...newRow, description: e.target.value })}
                        onKeyDown={handleKeyDown}
                      />
                    </td>
                    <td className="px-5 py-3.5">
                      <select
                        className="bg-transparent border-b border-white/40 focus:border-white outline-none text-white py-0.5 text-sm transition-colors"
                        value={newRow.status}
                        onChange={e => setNewRow({ ...newRow, status: e.target.value })}
                      >
                        <option value="active">Активен</option>
                        <option value="inactive">Неактивен</option>
                      </select>
                    </td>
                    <td className="px-5 py-3.5 text-white/30 text-xs font-mono">сейчас</td>
                    <td className="px-5 py-3.5">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={addRecord}
                          disabled={saving || !newRow.name.trim()}
                          className="p-1.5 rounded-md text-emerald-300 hover:bg-white/10 transition-colors disabled:opacity-40"
                          title="Сохранить"
                        >
                          <Icon name="Check" size={14} />
                        </button>
                        <button
                          onClick={() => setAdding(false)}
                          className="p-1.5 rounded-md text-white/50 hover:bg-white/10 transition-colors"
                          title="Отмена"
                        >
                          <Icon name="X" size={14} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {records.length === 0 && !adding && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-white/30 text-sm">
                      Нет записей — нажмите «Добавить»
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}