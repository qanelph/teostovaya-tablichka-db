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

const inputCls =
  'w-full bg-white border border-slate-200 rounded-lg px-3 py-1.5 text-sm text-slate-800 outline-none transition-all focus:border-indigo-400 focus:ring-2 focus:ring-indigo-100 placeholder:text-slate-300';
const iconBtn =
  'inline-flex items-center justify-center w-8 h-8 rounded-lg transition-colors disabled:opacity-40';

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

  const total = records.length;
  const activeCount = records.filter(r => r.status === 'active').length;

  return (
    <div className="min-h-screen bg-slate-50 font-sans text-slate-800">
      <div className="max-w-5xl mx-auto px-6 py-10">
        {/* Header */}
        <header className="flex items-end justify-between mb-8">
          <div>
            <h1 className="text-2xl font-semibold tracking-tight text-slate-900">Записки</h1>
            <p className="text-sm text-slate-400 mt-1">Список записей и их статусы</p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <button
              onClick={() => { setAdding(true); setTimeout(() => nameRef.current?.focus(), 50); }}
              className="inline-flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white text-sm font-medium rounded-lg shadow-sm hover:bg-indigo-700 active:bg-indigo-800 transition-colors"
            >
              <Icon name="Plus" size={16} />
              Добавить
            </button>
          </div>
        </header>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Всего</p>
            <p className="text-2xl font-semibold text-slate-900 mt-1">{total}</p>
          </div>
          <div className="bg-white border border-slate-200 rounded-xl p-4">
            <p className="text-xs font-medium text-slate-400 uppercase tracking-wide">Активных</p>
            <p className="text-2xl font-semibold text-emerald-600 mt-1">{activeCount}</p>
          </div>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex items-center justify-center py-24 gap-2 text-slate-400">
            <Icon name="Loader" size={18} className="animate-spin" />
            <span className="text-sm">Загрузка...</span>
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-12">#</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Имя</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide">Описание</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-32">Статус</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold text-slate-400 uppercase tracking-wide w-28">Создан</th>
                  <th className="w-24 px-5 py-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {records.map((r, i) => {
                  const isEditing = editing?.id === r.id;
                  return (
                    <tr
                      key={r.id}
                      className="group hover:bg-slate-50 transition-colors animate-fade-in"
                      style={{ animationDelay: `${i * 40}ms` }}
                    >
                      <td className="px-5 py-3 text-slate-300 font-mono text-xs">{r.id}</td>

                      {/* Name */}
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <input
                            className={inputCls}
                            value={editing.name}
                            onChange={e => setEditing({ ...editing, name: e.target.value })}
                            onKeyDown={handleKeyDown}
                            autoFocus
                          />
                        ) : (
                          <span className="text-slate-800 font-medium">{r.name}</span>
                        )}
                      </td>

                      {/* Description */}
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <input
                            className={inputCls}
                            value={editing.description}
                            onChange={e => setEditing({ ...editing, description: e.target.value })}
                            onKeyDown={handleKeyDown}
                          />
                        ) : (
                          <span className="text-slate-500">{r.description || '—'}</span>
                        )}
                      </td>

                      {/* Status */}
                      <td className="px-5 py-3">
                        {isEditing ? (
                          <select
                            className={inputCls}
                            value={editing.status}
                            onChange={e => setEditing({ ...editing, status: e.target.value })}
                          >
                            <option value="active">Активен</option>
                            <option value="inactive">Неактивен</option>
                          </select>
                        ) : (
                          <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                            r.status === 'active'
                              ? 'bg-emerald-50 text-emerald-700'
                              : 'bg-slate-100 text-slate-500'
                          }`}>
                            <span className={`w-1.5 h-1.5 rounded-full ${r.status === 'active' ? 'bg-emerald-500' : 'bg-slate-400'}`} />
                            {STATUS_LABELS[r.status] ?? r.status}
                          </span>
                        )}
                      </td>

                      {/* Date */}
                      <td className="px-5 py-3 text-slate-400 font-mono text-xs">{formatDate(r.created_at)}</td>

                      {/* Actions */}
                      <td className="px-5 py-3">
                        <div className="flex items-center gap-1 justify-end">
                          {isEditing ? (
                            <>
                              <button
                                onClick={saveEdit}
                                disabled={saving}
                                className={`${iconBtn} text-emerald-600 hover:bg-emerald-50`}
                                title="Сохранить"
                              >
                                <Icon name="Check" size={15} />
                              </button>
                              <button
                                onClick={cancelEdit}
                                className={`${iconBtn} text-slate-400 hover:bg-slate-100`}
                                title="Отмена"
                              >
                                <Icon name="X" size={15} />
                              </button>
                            </>
                          ) : (
                            <>
                              <button
                                onClick={() => startEdit(r)}
                                className={`${iconBtn} text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 opacity-0 group-hover:opacity-100`}
                                title="Редактировать"
                              >
                                <Icon name="Pencil" size={15} />
                              </button>
                              <button
                                onClick={() => deleteRecord(r.id)}
                                disabled={deletingId === r.id}
                                className={`${iconBtn} text-slate-400 hover:text-red-600 hover:bg-red-50 opacity-0 group-hover:opacity-100`}
                                title="Удалить"
                              >
                                <Icon name="Trash2" size={15} />
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
                  <tr className="bg-indigo-50/50 animate-fade-in">
                    <td className="px-5 py-3 text-slate-300 font-mono text-xs">+</td>
                    <td className="px-5 py-3">
                      <input
                        ref={nameRef}
                        className={inputCls}
                        placeholder="Имя..."
                        value={newRow.name}
                        onChange={e => setNewRow({ ...newRow, name: e.target.value })}
                        onKeyDown={handleKeyDown}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <input
                        className={inputCls}
                        placeholder="Описание..."
                        value={newRow.description}
                        onChange={e => setNewRow({ ...newRow, description: e.target.value })}
                        onKeyDown={handleKeyDown}
                      />
                    </td>
                    <td className="px-5 py-3">
                      <select
                        className={inputCls}
                        value={newRow.status}
                        onChange={e => setNewRow({ ...newRow, status: e.target.value })}
                      >
                        <option value="active">Активен</option>
                        <option value="inactive">Неактивен</option>
                      </select>
                    </td>
                    <td className="px-5 py-3 text-slate-300 text-xs font-mono">сейчас</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-1 justify-end">
                        <button
                          onClick={addRecord}
                          disabled={saving || !newRow.name.trim()}
                          className={`${iconBtn} text-emerald-600 hover:bg-emerald-50`}
                          title="Сохранить"
                        >
                          <Icon name="Check" size={15} />
                        </button>
                        <button
                          onClick={() => setAdding(false)}
                          className={`${iconBtn} text-slate-400 hover:bg-slate-100`}
                          title="Отмена"
                        >
                          <Icon name="X" size={15} />
                        </button>
                      </div>
                    </td>
                  </tr>
                )}

                {records.length === 0 && !adding && (
                  <tr>
                    <td colSpan={6} className="px-5 py-16 text-center text-slate-300 text-sm">
                      Нет записей — нажмите «Добавить»
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
