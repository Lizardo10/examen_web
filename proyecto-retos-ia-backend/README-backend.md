# Backend - Flask API

1. Crear virtualenv y activarlo:
   python3 -m venv venv
   source venv/bin/activate

2. Instalar dependencias:
   pip install -r requirements.txt

3. Configurar .env (ver ejemplo .env)

4. Crear base de datos PostgreSQL y asegurar que DATABASE_URL apunta a ella:
   Ej: postgresql://user:pass@localhost:5432/retosdb

5. Ejecutar:
   python app.py

API endpoints:
POST  /api/retos
GET   /api/retos?categoria=&dificultad=
PATCH /api/retos/<id>
DELETE /api/retos/<id>
