function RecommendationCard({ recommendations }) {
  const entries = Object.entries(recommendations || {});

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Recommended Courses</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No recommendations available.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map(([course, score]) => (
            <li key={course} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="font-medium text-slate-700">{course}</span>
              <span className="rounded-full bg-indigo-100 px-2.5 py-1 text-xs font-semibold text-indigo-700">
                {Number(score).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default RecommendationCard;
