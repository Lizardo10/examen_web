from flask import Flask, request, jsonify
from flask_cors import CORS
import psycopg2
import psycopg2.extras
import os
from dotenv import load_dotenv

load_dotenv()

# --- Configuración de la Conexión a la Base de Datos ---
DB_HOST = os.getenv("DB_HOST")
DB_NAME = os.getenv("DB_NAME")
DB_USER = os.getenv("DB_USER")
DB_PASS = os.getenv("DB_PASS")

def get_db_connection():
    if not all([DB_HOST, DB_NAME, DB_USER, DB_PASS]):
        raise ValueError("Faltan variables de entorno para la conexión a la base de datos.")
    conn = psycopg2.connect(host=DB_HOST, database=DB_NAME, user=DB_USER, password=DB_PASS)
    return conn

# --- Inicialización de la Aplicación Flask ---
app = Flask(__name__)
CORS(app)

# --- Definición de las Rutas de la API ---

# 1. Crear un nuevo reto (POST /retos)
@app.route('/retos', methods=['POST'])
def crear_reto():
    data = request.get_json()
    # CORRECCIÓN: Cambiamos 'nivel_dificultad' a 'dificultad'
    if not all(k in data for k in ('titulo', 'descripcion', 'categoria', 'dificultad')):
        return jsonify({'message': 'Faltan campos requeridos'}), 400
        
    titulo = data['titulo']
    descripcion = data['descripcion']
    categoria = data['categoria']
    dificultad = data['dificultad'] # CORRECCIÓN

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        # CORRECCIÓN: Usamos 'dificultad' en la consulta SQL
        cur.execute('INSERT INTO retos (titulo, descripcion, categoria, dificultad) VALUES (%s, %s, %s, %s) RETURNING *;',
                    (titulo, descripcion, categoria, dificultad))
        nuevo_reto = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()
        return jsonify(dict(nuevo_reto)), 201
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return jsonify({'message': 'Error en el servidor'}), 500

# 2. Listar todos los retos (GET /retos) - Sin cambios necesarios aquí
@app.route('/retos', methods=['GET'])
def listar_retos():
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute('SELECT * FROM retos ORDER BY id ASC;')
        retos = [dict(row) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify(retos)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return jsonify({'message': 'Error en el servidor'}), 500

# 3. Filtrar retos por categoría y dificultad (GET /retos/filtrar)
@app.route('/retos/filtrar', methods=['GET'])
def filtrar_retos():
    categoria = request.args.get('categoria')
    dificultad = request.args.get('dificultad')

    query = 'SELECT * FROM retos WHERE 1=1'
    params = []

    if categoria:
        query += ' AND categoria = %s'
        params.append(categoria)
    if dificultad:
        # CORRECCIÓN: Usamos 'dificultad' en la consulta SQL
        query += ' AND dificultad = %s'
        params.append(dificultad)
    
    query += ' ORDER BY id ASC;'

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(query, tuple(params))
        retos = [dict(row) for row in cur.fetchall()]
        cur.close()
        conn.close()
        return jsonify(retos)
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return jsonify({'message': 'Error en el servidor'}), 500

# Las rutas de actualizar y eliminar no necesitan cambios
# MODIFICACIÓN: Ahora puede actualizar cualquier campo, no solo el estado.
@app.route('/retos/<int:id_reto>', methods=['PUT'])
def actualizar_reto(id_reto):
    data = request.get_json()

    # Construir la consulta dinámicamente basado en los datos recibidos
    campos_a_actualizar = []
    valores_a_actualizar = []
    
    # Permitimos actualizar estos campos
    campos_permitidos = ['titulo', 'descripcion', 'categoria', 'dificultad', 'estado']
    
    for campo in campos_permitidos:
        if campo in data:
            campos_a_actualizar.append(f"{campo} = %s")
            valores_a_actualizar.append(data[campo])

    if not campos_a_actualizar:
        return jsonify({'message': 'No hay campos para actualizar'}), 400

    # Añadir el id del reto al final de los valores para el WHERE
    valores_a_actualizar.append(id_reto)

    query = f"UPDATE retos SET {', '.join(campos_a_actualizar)} WHERE id = %s RETURNING *;"

    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute(query, tuple(valores_a_actualizar))
        reto_actualizado = cur.fetchone()
        conn.commit()
        cur.close()
        conn.close()

        if reto_actualizado is None:
            return jsonify({'message': 'Reto no encontrado'}), 404

        return jsonify(dict(reto_actualizado))
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return jsonify({'message': 'Error en el servidor'}), 500


# 5. Eliminar un reto (DELETE /retos/<id_reto>)
@app.route('/retos/<int:id_reto>', methods=['DELETE'])
def eliminar_reto(id_reto):
    try:
        conn = get_db_connection()
        cur = conn.cursor()
        cur.execute('DELETE FROM retos WHERE id = %s;', (id_reto,))
        conn.commit()
        was_deleted = cur.rowcount > 0
        cur.close()
        conn.close()
        if not was_deleted:
            return jsonify({'message': 'Reto no encontrado'}), 404
        return jsonify({'message': 'Reto eliminado exitosamente'})
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return jsonify({'message': 'Error en el servidor'}), 500
# NUEVA RUTA: Obtener un solo reto por su ID
@app.route('/retos/<int:id_reto>', methods=['GET'])
def obtener_reto(id_reto):
    try:
        conn = get_db_connection()
        cur = conn.cursor(cursor_factory=psycopg2.extras.DictCursor)
        cur.execute('SELECT * FROM retos WHERE id = %s;', (id_reto,))
        reto = cur.fetchone()
        cur.close()
        conn.close()
        
        if reto is None:
            return jsonify({'message': 'Reto no encontrado'}), 404
            
        return jsonify(dict(reto))
    except (Exception, psycopg2.DatabaseError) as error:
        print(error)
        return jsonify({'message': 'Error en el servidor'}), 500
        
# --- Iniciar la Aplicación ---
if __name__ == '__main__':
    port = int(os.getenv("PORT", 5000))
    app.run(debug=True, port=port)