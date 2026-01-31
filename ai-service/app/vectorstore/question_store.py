"""
Interview Question Store

Vector storage for interview questions.
Enables dynamic question retrieval based on role and difficulty.
"""

from typing import Optional, List, Literal
from uuid import uuid4

from qdrant_client.http import models as rest

from app.vectorstore.qdrant_client import get_qdrant_client
from app.llm import get_embedding_service
from app.config import settings


async def store_question(
    question_text: str,
    category: Literal["warmup", "technical", "deep_dive"],
    difficulty: int,
    skills_tested: List[str],
    expected_signals: str,
    good_answer_example: Optional[str] = None,
) -> str:
    """
    Store an interview question in Qdrant.
    
    Args:
        question_text: The question to store
        category: Interview stage category
        difficulty: Difficulty level 1-5
        skills_tested: Skills this question tests
        expected_signals: What a good answer should contain
        good_answer_example: Optional example of a good answer
        
    Returns:
        Point ID
    """
    client = await get_qdrant_client()
    embedding_service = get_embedding_service()
    
    # Create embedding from question + context
    embed_text = f"""
Question: {question_text}
Category: {category}
Difficulty: {difficulty}/5
Skills tested: {', '.join(skills_tested)}
Expected in answer: {expected_signals}
"""
    
    embedding = await embedding_service.embed(embed_text)
    
    point_id = str(uuid4())
    
    await client.upsert(
        collection_name=settings.collection_interview_questions,
        points=[
            rest.PointStruct(
                id=point_id,
                vector=embedding,
                payload={
                    "question_id": point_id,
                    "question_text": question_text,
                    "category": category,
                    "difficulty": difficulty,
                    "skills_tested": skills_tested,
                    "expected_signals": expected_signals,
                    "good_answer_example": good_answer_example,
                },
            )
        ],
    )
    
    return point_id


async def get_questions_for_stage(
    stage: Literal["warmup", "technical", "deep_dive"],
    skills: List[str],
    difficulty: int,
    limit: int = 5,
    exclude_ids: Optional[List[str]] = None,
) -> List[dict]:
    """
    Retrieve questions matching stage, skills, and difficulty.
    
    Args:
        stage: Interview stage
        skills: Required skills to match
        difficulty: Target difficulty level
        limit: Maximum questions to return
        exclude_ids: Question IDs to exclude (already asked)
        
    Returns:
        List of question dicts (empty if Qdrant unavailable)
    """
    try:
        client = await get_qdrant_client()
        embedding_service = get_embedding_service()
        
        # Create query embedding based on skills
        query_text = f"Interview question for {stage} stage testing {', '.join(skills)} at difficulty {difficulty}"
        query_embedding = await embedding_service.embed(query_text)
        
        # Build filter
        filter_conditions = [
            rest.FieldCondition(
                key="category",
                match=rest.MatchValue(value=stage),
            ),
            rest.FieldCondition(
                key="difficulty",
                range=rest.Range(gte=max(1, difficulty - 1), lte=min(5, difficulty + 1)),
            ),
        ]
        
        # Add skill filter if provided
        if skills:
            filter_conditions.append(
                rest.FieldCondition(
                    key="skills_tested",
                    match=rest.MatchAny(any=skills),
                )
            )
        
        # Search using query method
        results = await client.query_points(
            collection_name=settings.collection_interview_questions,
            query=query_embedding,
            limit=limit + len(exclude_ids or []),
            query_filter=rest.Filter(must=filter_conditions),
        )
        
        # Filter out excluded and return
        exclude_set = set(exclude_ids or [])
        questions = []
        for r in results.points:
            if r.payload.get("question_id") not in exclude_set:
                questions.append({
                    "id": r.payload.get("question_id"),
                    "question": r.payload.get("question_text"),
                    "difficulty": r.payload.get("difficulty"),
                    "skills": r.payload.get("skills_tested"),
                    "expected": r.payload.get("expected_signals"),
                    "score": r.score,
                })
                if len(questions) >= limit:
                    break
        
        return questions
    except Exception as e:
        # Return empty - interview will use LLM-generated questions
        print(f"Warning: Could not fetch questions from Qdrant: {e}")
        return []


async def seed_default_questions():
    """
    Seed the question store with default interview questions.
    Called during initialization if collection is empty.
    """
    # Warmup questions
    warmup_questions = [
        {
            "question": "Can you tell me about yourself and your background in software development?",
            "skills": ["communication", "experience"],
            "difficulty": 1,
            "expected": "Clear narrative, relevant experience, enthusiasm",
        },
        {
            "question": "What interests you about this role and our company?",
            "skills": ["communication", "research"],
            "difficulty": 1,
            "expected": "Specific knowledge about role/company, genuine interest",
        },
        {
            "question": "Describe a project you're particularly proud of and your role in it.",
            "skills": ["communication", "leadership"],
            "difficulty": 2,
            "expected": "Specific details, clear impact, ownership",
        },
    ]
    
    # Technical questions
    technical_questions = [
        {
            "question": "Explain the difference between REST and GraphQL. When would you choose one over the other?",
            "skills": ["api_design", "architecture"],
            "difficulty": 3,
            "expected": "Clear distinctions, trade-offs, practical examples",
        },
        {
            "question": "How would you approach debugging a performance issue in a production web application?",
            "skills": ["debugging", "performance"],
            "difficulty": 3,
            "expected": "Systematic approach, tools mentioned, prioritization",
        },
        {
            "question": "Describe how you would design a caching strategy for a high-traffic web application.",
            "skills": ["caching", "architecture", "performance"],
            "difficulty": 4,
            "expected": "Cache layers, invalidation strategies, trade-offs",
        },
    ]
    
    # Deep dive questions
    deep_dive_questions = [
        {
            "question": "Design a real-time notification system that can handle millions of users. Walk me through your approach.",
            "skills": ["system_design", "scalability"],
            "difficulty": 5,
            "expected": "Architecture diagram, component breakdown, scaling strategies",
        },
        {
            "question": "How would you handle data consistency in a distributed microservices architecture?",
            "skills": ["distributed_systems", "architecture"],
            "difficulty": 5,
            "expected": "CAP theorem, eventual consistency, saga pattern",
        },
    ]
    
    # Store all questions
    for q in warmup_questions:
        await store_question(
            question_text=q["question"],
            category="warmup",
            difficulty=q["difficulty"],
            skills_tested=q["skills"],
            expected_signals=q["expected"],
        )
    
    for q in technical_questions:
        await store_question(
            question_text=q["question"],
            category="technical",
            difficulty=q["difficulty"],
            skills_tested=q["skills"],
            expected_signals=q["expected"],
        )
    
    for q in deep_dive_questions:
        await store_question(
            question_text=q["question"],
            category="deep_dive",
            difficulty=q["difficulty"],
            skills_tested=q["skills"],
            expected_signals=q["expected"],
        )
    
    print(f"Seeded {len(warmup_questions) + len(technical_questions) + len(deep_dive_questions)} default questions")
