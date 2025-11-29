from qdrant_client import QdrantClient
import sys

print(f"Python executable: {sys.executable}")
print(f"QdrantClient location: {QdrantClient.__module__}")
print(f"Has search: {hasattr(QdrantClient, 'search')}")

try:
    client = QdrantClient(":memory:")
    print(f"Instance has search: {hasattr(client, 'search')}")
    print(f"Dir client: {dir(client)}")
except Exception as e:
    print(f"Error instantiating client: {e}")
