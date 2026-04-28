function WeakAreasCard({ weakAreas }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Weak Areas</h2>
      {!weakAreas || weakAreas.length === 0 ? (
        <p className="text-sm text-slate-500">No weak areas identified.</p>
      ) : (
        <ul className="space-y-3">
          {weakAreas.map((area) => (
            <li key={area} className="rounded-lg bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700">
              {area}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default WeakAreasCard;
