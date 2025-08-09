# backend/routes.py
from flask import Blueprint, request, jsonify, current_app
from models import Reto
from db import db
from sqlalchemy.exc import SQLAlchemyError

# blueprint name MUST match what app imports: retos_bp
retos_bp = Blueprint('retos_bp', __name__)

VALID_DIFICULTADES = {'bajo', 'medio', 'alto'}
VALID_ESTADOS = {'pendiente', 'en proceso', 'completado'}

# Crear
@retos_bp.route('', methods=['POST'])
def crear_reto():
    data = request.get_json() or {}
    required = ['titulo', 'descripcion', 'categoria', 'dificultad']
    for f in required:
        if not data.get(f) or not str(data.get(f)).strip():
            return jsonify({'error': f'Campo obligatorio: {f}'}), 400

    dificultad = str(data['dificultad']).lower()
    if dificultad not in VALID_DIFICULTADES:
        return jsonify({'error': 'dificultad debe ser: bajo, medio o alto'}), 400

    estado = str(data.get('estado', 'pendiente')).lower()
    if estado not in VALID_ESTADOS:
        return jsonify({'error': 'estado inválido'}), 400

    reto = Reto(
        titulo=data['titulo'].strip(),
        descripcion=data['descripcion'].strip(),
        categoria=data['categoria'].strip(),
        dificultad=dificultad,
        estado=estado
    )
    try:
        db.session.add(reto)
        db.session.commit()
        return jsonify(reto.to_dict()), 201
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.exception("DB error al crear reto")
        return jsonify({'error': 'Error al guardar el reto'}), 500

# Listar (con filtros opcionales)
@retos_bp.route('', methods=['GET'])
def listar_retoss():
    categoria = request.args.get('categoria')
    dificultad = request.args.get('dificultad')
    query = Reto.query
    if categoria:
        query = query.filter(Reto.categoria == categoria)
    if dificultad:
        query = query.filter(Reto.dificultad == dificultad)
    retos = query.order_by(Reto.created_at.desc()).all()
    return jsonify([r.to_dict() for r in retos]), 200

# Obtener uno
@retos_bp.route('/<int:reto_id>', methods=['GET'])
def obtener_reto(reto_id):
    reto = Reto.query.get_or_404(reto_id)
    return jsonify(reto.to_dict()), 200

# Actualizar (patch flexible)
@retos_bp.route('/<int:reto_id>', methods=['PATCH'])
def actualizar_reto(reto_id):
    reto = Reto.query.get_or_404(reto_id)
    data = request.get_json() or {}
    if 'estado' in data:
        new_estado = str(data['estado']).lower()
        if new_estado not in VALID_ESTADOS:
            return jsonify({'error': 'estado inválido'}), 400
        reto.estado = new_estado
    for campo in ('titulo', 'descripcion', 'categoria', 'dificultad'):
        if campo in data:
            if campo == 'dificultad':
                val = str(data[campo]).lower()
                if val not in VALID_DIFICULTADES:
                    return jsonify({'error': 'dificultad inválida'}), 400
                setattr(reto, campo, val)
            else:
                setattr(reto, campo, data[campo])
    try:
        db.session.commit()
        return jsonify(reto.to_dict()), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.exception("DB error al actualizar reto")
        return jsonify({'error': 'Error al actualizar'}), 500

# Eliminar
@retos_bp.route('/<int:reto_id>', methods=['DELETE'])
def eliminar_reto(reto_id):
    reto = Reto.query.get_or_404(reto_id)
    try:
        db.session.delete(reto)
        db.session.commit()
        return jsonify({'mensaje': 'Reto eliminado correctamente'}), 200
    except SQLAlchemyError as e:
        db.session.rollback()
        current_app.logger.exception("DB error al eliminar reto")
        return jsonify({'error': 'Error al eliminar'}), 500
