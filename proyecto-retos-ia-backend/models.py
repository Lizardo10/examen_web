from db import db
from datetime import datetime

class Reto(db.Model):
    __tablename__ = 'retos'
    id = db.Column(db.Integer, primary_key=True)
    titulo = db.Column(db.String(200), nullable=False)
    descripcion = db.Column(db.Text, nullable=False)
    categoria = db.Column(db.String(100), nullable=False)
    dificultad = db.Column(db.String(20), nullable=False)  # 'bajo','medio','alto'
    estado = db.Column(db.String(20), nullable=False, default='pendiente')  # 'pendiente','en proceso','completado'
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    def to_dict(self):
        return {
            'id': self.id,
            'titulo': self.titulo,
            'descripcion': self.descripcion,
            'categoria': self.categoria,
            'dificultad': self.dificultad,
            'estado': self.estado,
            'created_at': self.created_at.isoformat() if self.created_at else None,
            'updated_at': self.updated_at.isoformat() if self.updated_at else None
        }
