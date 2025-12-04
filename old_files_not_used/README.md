# Old Files (Not Currently Used)

This folder contains files that are not actively used in the current version of AutoScape but are preserved for reference or potential future use.

## Folder Structure

### `/servers/`
Old server implementations that have been replaced or are no longer active:
- **api.py** (port 8001) - Ad Generation Agent API (uses agent.py)
- **plant_api.py** (port 8001) - Plant RAG API (uses plant_agent.py)
- **freepik_api.py** (port 8002) - Freepik API (conflicts with current rag_enhancement_api.py)
- **server.js** (port 3001) - Node.js Freepik proxy server

### `/agents/`
Old agent and generation scripts:
- **agent.py** - Ad Generation Agent (used by api.py)
- **plant_agent.py** - Plant RAG Agent (used by plant_api.py)
- **budget_calculator.py** - Old budget calculator without RAG (replaced by budget_calculator_rag.py)
- **generate_full_plan.py** - Old full plan generation script
- **map_generator.py** - Old 2D map generator
- **video_generator.py** - Video generation module (used by api.py)

### `/tests/`
Test and verification scripts:
- **test_gen_design.py** - Test design generation
- **test_video_gen.py** - Test video generation
- **test_api.sh** - API test shell script
- **verify_freepik_config.py** - Verify Freepik configuration
- **verify_freepik_enhancements.py** - Verify Freepik enhancements
- **verify_real_api.py** - Verify real API

### `/utils/`
Utility and debug scripts:
- **debug_qdrant.py** - Debug Qdrant vector database
- **inspect_dataset.py** - Inspect dataset
- **list_models.py** - List available Gemini models

## Why These Files Are Here

These files were moved here during codebase organization (December 2025) because:
1. They are not referenced by the current frontend (components, services)
2. They have been replaced by newer implementations
3. They are test/utility scripts not needed for production

## Restoring Files

If you need to use any of these files:
1. Move the file back to the project root
2. Check and update any import paths
3. Ensure all dependencies are installed
4. Update the frontend services if needed to call the restored server

## Safe to Delete?

These files can be safely deleted if:
- You're confident the new implementation is stable
- You have the code backed up in git history
- You don't plan to reference the old implementation patterns

Otherwise, keep them for reference.
