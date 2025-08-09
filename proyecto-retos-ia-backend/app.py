# backend/app.py
import os
from dotenv import load_dotenv
from flask import Flask, jsonify
from flask_cors import CORS
from db import db
import logging

# Blueprint import AFTER db to avoid circular imports in some setups
from routes import retos_bp

def create_app():
    # Cargar .env
    load_dotenv()

    app = Flask(__name__)

    # Config
    app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'sqlite:///retos.db')
    app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
    app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev_secret')

    # CORS: origen desde .env o '*' para debug
    frontend_origin = os.getenv('FRONTEND_ORIGIN', '*')
    CORS(app, resources={r"/api/*": {"origins": frontend_origin}})

    # logging básico
    logging.basicConfig(level=logging.INFO)

    # Inicializar DB y registrar blueprint
    db.init_app(app)
    app.register_blueprint(retos_bp, url_prefix='/api/retos')

    # Intentar crear tablas — atrapamos errores (p. ej. permisos)
    with app.app_context():
        try:
            db.create_all()
            app.logger.info("Tablas creadas/verificadas correctamente")
        except Exception as e:
            # No romper arranque, solo loggear. Si hay problema con Postgres (permisos, credenciales)
            app.logger.exception("No se pudieron crear las tablas automáticamente: %s", e)
            # En modo dev puedes querer fallar rápido; aquí preferimos arrancar y dejar que el
            # usuario solucione DB y vuelva a ejecutar.

    @app.route('/api/health')
    def health():
        return jsonify({'status': 'ok'})

    return app

if __name__ == '__main__':
    app = create_app()
    port = int(os.getenv('PORT', 5000))
    debug = os.getenv('FLASK_ENV', 'production') == 'development'
    app.run(host='0.0.0.0', port=port, debug=debug)
