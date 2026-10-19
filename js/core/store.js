// 앱 전역 상태 (여러 페이지가 공유하는 데이터만 둡니다. 페이지 전용 상태는 각 페이지 js 에 둠)
export const store = {
  db: null,
  user: null,
  saved: new Set(),
  history: [],                    // [{id, at}]
  prefs: { cats: [], conds: [], extra: '' },
  area: '',
  search: { query: '', mode: 'keyword' },
  applied: { radiusKm: 1, category: '', conditions: [] },
  nearbyCat: '',
  loginEmail: '',

  init(db) {
    const d = db.defaults;
    this.db = db;
    this.saved = new Set(d.saved);
    this.history = d.history.map(h => ({ id: h.id, at: Date.now() - h.hoursAgo * 3600e3 }));
    this.prefs = structuredClone(d.prefs);
    this.area = d.area;
    this.search = { ...d.search };
    this.applied = this.defaultFilters();
  },
  defaultFilters() { return structuredClone(this.db.defaults.filters); },
  place(id) { return this.db.places.find(p => p.id === id); },
  toggleSave(id) {
    this.saved.has(id) ? this.saved.delete(id) : this.saved.add(id);
    return this.saved.has(id);
  },
  recordView(id) {
    this.history = [{ id, at: Date.now() }, ...this.history.filter(h => h.id !== id)];
  }
};
