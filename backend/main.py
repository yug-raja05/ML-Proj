from pathlib import Path
from typing import Dict, List

import numpy as np
import pandas as pd
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sklearn.metrics.pairwise import cosine_similarity
from sklearn.neighbors import NearestNeighbors


app = FastAPI(title="Personalized Learning Recommendation System")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

DATASET_PATH = Path(__file__).parent / "data" / "learning_data.csv"


class CourseRecommendation(BaseModel):
    course: str
    score: float
    category: str
    difficulty: str


class RecommendResponse(BaseModel):
    user: int
    recommendations: List[CourseRecommendation]
    similar_users: Dict[str, float]
    weak_areas: List[str]


class EvaluationResponse(BaseModel):
    user: int
    actual_courses: List[str]
    predicted_courses: List[str]
    precision_at_5: float


def _load_data() -> pd.DataFrame:
    if not DATASET_PATH.exists():
        raise FileNotFoundError(f"Dataset not found at {DATASET_PATH}")

    df = pd.read_csv(DATASET_PATH)
    required_cols = {
        "user_id",
        "course_id",
        "rating",
        "time_spent",
        "score",
        "difficulty",
        "category",
    }
    missing_cols = required_cols.difference(df.columns)
    if missing_cols:
        missing = ", ".join(sorted(missing_cols))
        raise ValueError(f"Dataset missing required columns: {missing}")

    df["user_id"] = df["user_id"].astype(int)
    df["rating"] = df["rating"].astype(float)
    df["score"] = df["score"].astype(float)
    return df


df = _load_data()


def _build_train_test_split(dataframe: pd.DataFrame, seed: int = 42) -> tuple[pd.DataFrame, pd.DataFrame]:
    rng = np.random.default_rng(seed)
    train_parts: List[pd.DataFrame] = []
    test_parts: List[pd.DataFrame] = []

    for user_id, user_data in dataframe.groupby("user_id", sort=False):
        user_data = user_data.reset_index(drop=True)
        if len(user_data) < 2:
            train_parts.append(user_data)
            continue
        test_idx = int(rng.integers(0, len(user_data)))
        test_parts.append(user_data.iloc[[test_idx]])
        train_parts.append(user_data.drop(index=test_idx))

    train_df = pd.concat(train_parts, ignore_index=True) if train_parts else dataframe.copy()
    test_df = pd.concat(test_parts, ignore_index=True) if test_parts else dataframe.iloc[0:0].copy()
    return train_df, test_df


train_df, test_df = _build_train_test_split(df)

# User-item rating matrix for collaborative filtering.
user_item_matrix = (
    df.pivot_table(index="user_id", columns="course_id", values="rating", aggfunc="mean")
    .fillna(0.0)
    .sort_index()
)
user_ids = user_item_matrix.index.to_numpy()

# Cosine similarity over users.
similarity_matrix = cosine_similarity(user_item_matrix.values)
similarity_df = pd.DataFrame(similarity_matrix, index=user_ids, columns=user_ids)

# KNN model for nearest-neighbor user lookup.
knn_model = NearestNeighbors(metric="cosine", algorithm="brute")
knn_model.fit(user_item_matrix.values)

# Evaluation matrices (train-only recommendation generation).
eval_user_item_matrix = (
    train_df.pivot_table(index="user_id", columns="course_id", values="rating", aggfunc="mean")
    .fillna(0.0)
    .sort_index()
)
eval_user_ids = eval_user_item_matrix.index.to_numpy()
eval_similarity_matrix = cosine_similarity(eval_user_item_matrix.values)
eval_similarity_df = pd.DataFrame(eval_similarity_matrix, index=eval_user_ids, columns=eval_user_ids)


def ensure_user_exists(user_id: int) -> None:
    if user_id not in user_item_matrix.index:
        raise HTTPException(status_code=404, detail=f"User {user_id} not found")


def get_similar_users(user_id: int, top_k: int = 5) -> Dict[str, float]:
    ensure_user_exists(user_id)
    user_vector = user_item_matrix.loc[user_id].values.reshape(1, -1)

    # +1 because the closest result is the user itself.
    n_neighbors = min(top_k + 1, len(user_item_matrix))
    distances, indices = knn_model.kneighbors(user_vector, n_neighbors=n_neighbors)

    similar_scores: Dict[str, float] = {}
    for idx, distance in zip(indices[0], distances[0]):
        neighbor_user_id = int(user_ids[idx])
        if neighbor_user_id == user_id:
            continue
        similarity = 1.0 - float(distance)
        similar_scores[str(neighbor_user_id)] = round(max(similarity, 0.0), 4)
        if len(similar_scores) >= top_k:
            break
    return similar_scores


def get_recommendations(user_id: int, limit: int = 5) -> List[Dict[str, object]]:
    ensure_user_exists(user_id)

    user_ratings = user_item_matrix.loc[user_id]
    unseen_courses = user_ratings[user_ratings == 0.0].index.tolist()
    if not unseen_courses:
        return []

    similarity_scores = similarity_df.loc[user_id].drop(index=user_id)
    numerator = np.dot(similarity_scores.values, user_item_matrix.loc[similarity_scores.index, unseen_courses].values)
    denominator = np.abs(similarity_scores.values).sum()

    if denominator == 0:
        return []

    predicted_scores = numerator / denominator
    scored_courses = pd.Series(predicted_scores, index=unseen_courses).sort_values(ascending=False).head(limit)
    
    course_metadata = df.drop_duplicates(subset=["course_id"]).set_index("course_id")
    results = []
    for course, score in scored_courses.items():
        cat = course_metadata.loc[course, "category"] if course in course_metadata.index else "Unknown"
        diff = course_metadata.loc[course, "difficulty"] if course in course_metadata.index else "Unknown"
        results.append({
            "course": course,
            "score": round(float(score), 4),
            "category": str(cat),
            "difficulty": str(diff)
        })
    return results


def get_eval_recommendations(user_id: int, limit: int = 5) -> List[str]:
    if user_id not in eval_user_item_matrix.index:
        return []

    user_ratings = eval_user_item_matrix.loc[user_id]
    unseen_courses = user_ratings[user_ratings == 0.0].index.tolist()
    if not unseen_courses:
        return []

    similarity_scores = eval_similarity_df.loc[user_id].drop(index=user_id)
    if similarity_scores.empty:
        return []

    numerator = np.dot(
        similarity_scores.values,
        eval_user_item_matrix.loc[similarity_scores.index, unseen_courses].values,
    )
    denominator = np.abs(similarity_scores.values).sum()
    if denominator == 0:
        return []

    predicted_scores = numerator / denominator
    scored_courses = pd.Series(predicted_scores, index=unseen_courses).sort_values(ascending=False)
    return scored_courses.head(limit).index.tolist()


def get_weak_areas(user_id: int, count: int = 2) -> List[str]:
    ensure_user_exists(user_id)
    user_courses = df[df["user_id"] == user_id]
    if user_courses.empty:
        return []
    weakest = user_courses.nsmallest(count, "score")["course_id"].tolist()
    return weakest


@app.get("/users")
def users() -> List[int]:
    return sorted(df["user_id"].unique().astype(int).tolist())


@app.get("/similar-users/{user_id}")
def similar_users(user_id: int) -> Dict[str, object]:
    ensure_user_exists(user_id)
    return {"user": user_id, "similar_users": get_similar_users(user_id, top_k=5)}


@app.get("/learning-gap/{user_id}")
def learning_gap(user_id: int) -> Dict[str, object]:
    ensure_user_exists(user_id)
    return {"user": user_id, "weak_areas": get_weak_areas(user_id, count=2)}


@app.post("/recommend/{user_id}", response_model=RecommendResponse)
def recommend(user_id: int) -> RecommendResponse:
    ensure_user_exists(user_id)
    return RecommendResponse(
        user=user_id,
        recommendations=get_recommendations(user_id, limit=5),
        similar_users=get_similar_users(user_id, top_k=5),
        weak_areas=get_weak_areas(user_id, count=2),
    )


@app.get("/evaluation/{user_id}", response_model=EvaluationResponse)
def evaluation(user_id: int) -> EvaluationResponse:
    ensure_user_exists(user_id)

    # Precision@5 is only valid for users with both train and test interactions.
    if user_id not in eval_user_item_matrix.index:
        raise HTTPException(status_code=404, detail=f"User {user_id} has insufficient train data for evaluation")

    user_test = test_df[test_df["user_id"] == user_id]
    if user_test.empty:
        raise HTTPException(status_code=404, detail=f"User {user_id} has no test interactions for evaluation")

    actual_courses = user_test["course_id"].astype(str).tolist()
    predicted_courses = get_eval_recommendations(user_id, limit=5)

    actual_set = set(actual_courses)
    relevant_recommended = len([course for course in predicted_courses if course in actual_set])
    precision_at_5 = round(relevant_recommended / 5.0, 4)

    return EvaluationResponse(
        user=user_id,
        actual_courses=actual_courses,
        predicted_courses=predicted_courses,
        precision_at_5=precision_at_5,
    )


@app.get("/")
def health() -> Dict[str, str]:
    return {"status": "ok", "message": "Recommendation API is running"}
