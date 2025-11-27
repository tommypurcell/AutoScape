#!/usr/bin/env python3
"""
Plant RAG Agent
===============
Retrieval-Augmented Generation agent for answering plant and agriculture questions.

This agent:
1. Searches Qdrant vector database for relevant Q&A pairs
2. Uses Gemini to synthesize comprehensive answers from retrieved context
3. Provides source citations for transparency

Usage:
    from plant_agent import PlantRAGAgent
    
    agent = PlantRAGAgent(
        qdrant_url="https://your-cluster.qdrant.io",
        qdrant_api_key="your-api-key",
        gemini_api_key="your-gemini-key"
    )
    
    result = agent.answer_question("How do I prevent tomato blight?")
    print(result["answer"])
"""

import os
import logging
from typing import List, Dict, Any, Optional
from dataclasses import dataclass

from google import genai
from dotenv import load_dotenv
from fastembed import TextEmbedding
from qdrant_client import QdrantClient

# Setup logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)


@dataclass
class KnowledgeSource:
    """Represents a retrieved Q&A pair from the knowledge base."""
    question: str
    answer: str
    category: str
    score: float
    metadata: Dict[str, Any]


class PlantRAGAgent:
    """
    RAG agent for plant and agriculture question answering.
    
    Combines vector search in Qdrant with Gemini's language generation
    to provide accurate, contextual answers to plant-related questions.
    """
    
    def __init__(
        self,
        qdrant_url: str,
        qdrant_api_key: str,
        gemini_api_key: str,
        collection_name: str = "plant-knowledge",
        text_model: str = "Qdrant/clip-ViT-B-32-text",
        gemini_model: str = "gemini-2.0-flash-exp",
    ):
        """
        Initialize the Plant RAG Agent.
        
        Args:
            qdrant_url: Qdrant cluster URL
            qdrant_api_key: Qdrant API key
            gemini_api_key: Google Gemini API key
            collection_name: Name of Qdrant collection with plant knowledge
            text_model: Text embedding model for search
            gemini_model: Gemini model for answer generation
        """
        logger.info("🌱 Initializing Plant RAG Agent...")
        
        # Initialize Qdrant client
        self.qdrant_client = QdrantClient(
            url=qdrant_url,
            api_key=qdrant_api_key
        )
        self.collection_name = collection_name
        
        # Initialize text embedding model
        logger.info(f"Loading text embedding model: {text_model}")
        self.text_embedding = TextEmbedding(model_name=text_model)
        
        # Initialize Gemini client
        self.gemini_client = genai.Client(api_key=gemini_api_key)
        self.gemini_model = gemini_model
        
        logger.info("✅ Plant RAG Agent initialized successfully")
    
    def search_knowledge(
        self,
        query: str,
        limit: int = 5,
        score_threshold: float = 0.3
    ) -> List[KnowledgeSource]:
        """
        Search the knowledge base for relevant Q&A pairs.
        
        Args:
            query: User's question
            limit: Maximum number of results to return
            score_threshold: Minimum similarity score (0-1)
            
        Returns:
            List of KnowledgeSource objects with relevant Q&A pairs
        """
        logger.info(f"🔍 Searching knowledge base for: '{query}'")
        
        try:
            # Generate query embedding
            query_embedding = list(self.text_embedding.embed([query]))[0]
            
            # Search Qdrant
            search_results = self.qdrant_client.search(
                collection_name=self.collection_name,
                query_vector=query_embedding.tolist(),
                limit=limit,
                score_threshold=score_threshold
            )
            
            # Convert to KnowledgeSource objects
            sources = []
            for result in search_results:
                sources.append(KnowledgeSource(
                    question=result.payload.get("question", ""),
                    answer=result.payload.get("answer", ""),
                    category=result.payload.get("category", "general"),
                    score=result.score,
                    metadata={
                        k: v for k, v in result.payload.items()
                        if k not in ["question", "answer", "category"]
                    }
                ))
            
            logger.info(f"✅ Found {len(sources)} relevant sources")
            return sources
            
        except Exception as e:
            logger.error(f"❌ Search failed: {e}")
            raise
    
    def generate_answer(
        self,
        query: str,
        sources: List[KnowledgeSource],
        include_sources: bool = True
    ) -> Dict[str, Any]:
        """
        Generate a comprehensive answer using Gemini and retrieved context.
        
        Args:
            query: User's question
            sources: Retrieved knowledge sources
            include_sources: Whether to include source citations in response
            
        Returns:
            Dictionary with answer, sources, and metadata
        """
        logger.info("🤖 Generating answer with Gemini...")
        
        if not sources:
            return {
                "query": query,
                "answer": "I don't have enough information to answer that question. Please try rephrasing or asking about a different plant-related topic.",
                "sources": [],
                "confidence": 0.0
            }
        
        # Build context from sources
        context_parts = []
        for i, source in enumerate(sources, 1):
            context_parts.append(
                f"[Source {i}] (Category: {source.category}, Relevance: {source.score:.2f})\n"
                f"Q: {source.question}\n"
                f"A: {source.answer}\n"
            )
        
        context = "\n".join(context_parts)
        
        # Create prompt for Gemini
        prompt = f"""You are a knowledgeable plant and agriculture expert. Answer the user's question based on the following knowledge base entries.

KNOWLEDGE BASE:
{context}

USER QUESTION: {query}

INSTRUCTIONS:
1. Provide a comprehensive, accurate answer based on the knowledge base above
2. Synthesize information from multiple sources when relevant
3. Be specific and practical in your advice
4. If the knowledge base doesn't fully answer the question, acknowledge this
5. Use clear, accessible language
6. Do not make up information not present in the knowledge base

ANSWER:"""

        try:
            # Generate answer with Gemini
            response = self.gemini_client.models.generate_content(
                model=self.gemini_model,
                contents=prompt
            )
            
            answer = response.text.strip()
            
            # Calculate confidence based on source scores
            avg_score = sum(s.score for s in sources) / len(sources)
            confidence = min(avg_score * 1.2, 1.0)  # Scale up slightly, cap at 1.0
            
            result = {
                "query": query,
                "answer": answer,
                "sources": [
                    {
                        "question": s.question,
                        "answer": s.answer,
                        "category": s.category,
                        "score": s.score
                    }
                    for s in sources
                ] if include_sources else [],
                "confidence": confidence,
                "num_sources": len(sources)
            }
            
            logger.info(f"✅ Answer generated (confidence: {confidence:.2f})")
            return result
            
        except Exception as e:
            logger.error(f"❌ Answer generation failed: {e}")
            raise
    
    def answer_question(
        self,
        query: str,
        num_sources: int = 5,
        include_sources: bool = True
    ) -> Dict[str, Any]:
        """
        End-to-end pipeline: search knowledge base and generate answer.
        
        Args:
            query: User's question
            num_sources: Number of knowledge sources to retrieve
            include_sources: Whether to include source citations
            
        Returns:
            Dictionary with answer, sources, and metadata
        """
        # Search for relevant knowledge
        sources = self.search_knowledge(query, limit=num_sources)
        
        # Generate answer from sources
        result = self.generate_answer(query, sources, include_sources)
        
        return result


def main():
    """CLI interface for testing the agent."""
    import sys
    
    load_dotenv()
    
    # Get environment variables
    qdrant_url = os.getenv("QDRANT_URL") or os.getenv("VITE_QUADRANT_ENDPOINT")
    qdrant_api_key = os.getenv("QDRANT_API_KEY") or os.getenv("VITE_QUADRANT_API_KEY")
    gemini_api_key = os.getenv("GEMINI_API_KEY")
    
    if not all([qdrant_url, qdrant_api_key, gemini_api_key]):
        print("❌ Missing required environment variables!")
        print("Please set: QDRANT_URL, QDRANT_API_KEY, GEMINI_API_KEY")
        sys.exit(1)
    
    # Initialize agent
    agent = PlantRAGAgent(
        qdrant_url=qdrant_url,
        qdrant_api_key=qdrant_api_key,
        gemini_api_key=gemini_api_key
    )
    
    # Get query from command line or use default
    if len(sys.argv) > 1:
        query = " ".join(sys.argv[1:])
    else:
        query = "How do I prevent tomato blight?"
    
    print("\n" + "=" * 80)
    print(f"🌱 PLANT RAG AGENT - Question Answering")
    print("=" * 80)
    print(f"\n❓ Question: {query}\n")
    
    # Get answer
    result = agent.answer_question(query)
    
    # Display results
    print("💡 Answer:")
    print("-" * 80)
    print(result["answer"])
    print("-" * 80)
    
    print(f"\n📊 Metadata:")
    print(f"  • Confidence: {result['confidence']:.2%}")
    print(f"  • Sources used: {result['num_sources']}")
    
    if result["sources"]:
        print(f"\n📚 Sources:")
        for i, source in enumerate(result["sources"], 1):
            print(f"\n  [{i}] {source['category'].upper()} (relevance: {source['score']:.2%})")
            print(f"      Q: {source['question'][:100]}...")
            print(f"      A: {source['answer'][:150]}...")
    
    print("\n" + "=" * 80)


if __name__ == "__main__":
    main()
