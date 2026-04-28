# ML-Proj

Personalized Learning Recommendation System built with React, FastAPI, and Scikit-learn.
It uses collaborative filtering, cosine similarity, and KNN to generate course recommendations,
show similar users, highlight weak areas, and evaluate recommendation quality.

## Quick Links

- [How it works](#how-it-works)
- [Setup](#setup)
- [Run locally](#run-locally)
- [API endpoints](#api-endpoints)
- [Project structure](#project-structure)

<details>
<summary>What this app does</summary>

- Pick a learner from the dashboard.
- See the top recommended courses with scores, category, and difficulty.
- Review similar users and their similarity scores.
- Spot learning gaps from the weakest-scoring courses.
- Compare recommendation quality with Precision@5 evaluation data.

</details>

<details>
<summary>Tech stack</summary>

- Frontend: React + Vite
- Backend: FastAPI
- ML / data: Pandas, NumPy, Scikit-learn
- Visualization: Dashboard cards and score rings in the UI

</details>

## How It Works

1. The backend loads `backend/data/learning_data.csv` and validates the required columns.
2. A user-item rating matrix is built for collaborative filtering.
3. Cosine similarity and KNN identify similar learners.
4. The system predicts unseen courses and ranks them by relevance.
5. The frontend presents the results in a compact, interactive dashboard.

## Setup

<details>
<summary>Backend</summary>

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
```

</details>

<details>
<summary>Frontend</summary>

```bash
cd frontend
npm install
```

</details>

## Run Locally

Open two terminals and start each side separately.

<details>
<summary>Start the backend</summary>

```bash
cd backend
.venv\Scripts\activate
uvicorn main:app --reload
```

The API will be available at `http://127.0.0.1:8000`.

</details>

<details>
<summary>Start the frontend</summary>

```bash
cd frontend
npm run dev
```

The UI will be available at the Vite local address shown in the terminal.

</details>

## API Endpoints

| Method | Endpoint | Description |
| --- | --- | --- |
| `GET` | `/users` | Returns all user IDs in the dataset. |
| `GET` | `/similar-users/{user_id}` | Returns the most similar users for a learner. |
| `GET` | `/learning-gap/{user_id}` | Returns the weakest course areas for a learner. |
| `POST` | `/recommend/{user_id}` | Returns recommendations, similar users, and weak areas together. |

## Try It

- Start both apps.
- Select a user in the dashboard.
- Compare the recommendation cards, similarity panel, and weak areas panel.
- Use the API directly if you want to script tests or inspect raw JSON.

## Project Structure

```text
backend/
	main.py
	requirements.txt
	data/
		learning_data.csv
frontend/
	src/
		App.jsx
		main.jsx
		components/
```

## Notes

- The backend uses CORS with permissive settings so the local frontend can call it during development.
- The recommendation model currently reads from the bundled CSV dataset, so changes to the data file will affect outputs immediately after restart.
- If you want screenshots, GIFs, or a live demo section, those can be added next to make the README even more interactive.
