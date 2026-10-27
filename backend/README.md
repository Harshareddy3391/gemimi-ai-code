# One Calculator - Python FastAPI Backend

This backend powers the One Calculator app with high-performance mathematical evaluation, matrix algebra, financial models, and programmer bitwise operations.

## Running Standalone

1. **Create and activate a virtual environment**:
   ```bash
   python3 -m venv venv
   source venv/bin/activate  # On Windows: venv\Scripts\activate
   ```

2. **Install dependencies**:
   ```bash
   pip install -r requirements.txt
   ```

3. **Start the FastAPI server**:
   ```bash
   uvicorn main:app --reload --port 8000
   ```

4. **Explore the Swagger UI & OpenAPI Docs**:
   - Interactive Swagger UI: `http://localhost:8000/docs`
   - ReDoc: `http://localhost:8000/redoc`

The React frontend in this project seamlessly communicates with these endpoints either via the integrated Full-Stack Express bridge or directly to `http://localhost:8000`.
