export const filterCount = f => f.conditions.length + (f.category ? 1 : 0);

// 홈: 저장된 취향 기반 추천 (키워드 없음)
export function recommend({ db, prefs, nearbyCat }) {
  const { cats, conds } = prefs, any = cats.length || conds.length;
  const score = p => (cats.includes(p.category) ? 2 : 0) + p.conds.filter(c => conds.includes(c)).length;
  return db.places
    .filter(p => (!any || score(p) > 0) && (!nearbyCat || p.category === nearbyCat))
    .sort((a, b) => score(b) - score(a));
}

// 검색: 키워드(현재 위치 반경 적용) / 지명·장소명(지역 기준)
export function searchPlaces({ db, search, applied }) {
  const q = search.query.trim();
  if (!q) return [];
  return db.places.filter(p => {
    const hit = search.mode === 'keyword'
      ? [p.name, p.category, ...p.tags].some(x => x.includes(q))
      : p.area.includes(q) || p.name.includes(q);
    const cat = !applied.category || p.category === applied.category;
    const con = !applied.conditions.length || applied.conditions.some(c => p.conds.includes(c));
    const rad = search.mode !== 'keyword' || p.distM <= applied.radiusKm * 1000;
    return hit && cat && con && rad;
  });
}
