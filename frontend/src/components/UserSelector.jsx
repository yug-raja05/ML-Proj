function UserSelector({ users, selectedUser, onChange, onFetch, disabled }) {
  return (
    <div className="rounded-xl bg-white p-5 shadow-sm ring-1 ring-slate-200">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end">
        <div className="flex-1">
          <label htmlFor="user-select" className="mb-2 block text-sm font-medium text-slate-700">
            Select User
          </label>
          <select
            id="user-select"
            value={selectedUser}
            onChange={(event) => onChange(event.target.value)}
            className="w-full rounded-lg border border-slate-300 px-3 py-2 text-slate-800 outline-none transition focus:border-indigo-500 focus:ring-2 focus:ring-indigo-200"
          >
            <option value="">Choose a user</option>
            {users.map((userId) => (
              <option key={userId} value={userId}>
                User {userId}
              </option>
            ))}
          </select>
        </div>
        <button
          type="button"
          onClick={onFetch}
          disabled={disabled || !selectedUser}
          className="rounded-lg bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:bg-slate-400"
        >
          Get Recommendations
        </button>
      </div>
    </div>
  );
}

export default UserSelector;
