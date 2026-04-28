function SimilarUsersCard({ similarUsers }) {
  const entries = Object.entries(similarUsers || {});

  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200 transition hover:shadow-md">
      <h2 className="mb-4 text-lg font-semibold text-slate-800">Similar Users</h2>
      {entries.length === 0 ? (
        <p className="text-sm text-slate-500">No similar users found.</p>
      ) : (
        <ul className="space-y-3">
          {entries.map(([user, similarity]) => (
            <li key={user} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-2">
              <span className="font-medium text-slate-700">User {user}</span>
              <span className="rounded-full bg-emerald-100 px-2.5 py-1 text-xs font-semibold text-emerald-700">
                {Number(similarity).toFixed(2)}
              </span>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

export default SimilarUsersCard;
