from extensions import db
from datetime import datetime

class User(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    username = db.Column(db.String(80), nullable=False)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(200), nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    campaigns = db.relationship('Campaign', backref='user', lazy=True)

class Campaign(db.Model):
    id = db.Column(db.Integer, primary_key=True)
    user_id = db.Column(db.Integer, db.ForeignKey('user.id'), nullable=False)
    name = db.Column(db.String(100), nullable=False)
    description = db.Column(db.Text, nullable=False)
    category = db.Column(db.String(50), nullable=False)
    tone = db.Column(db.String(50), nullable=False)
    banner_style = db.Column(db.String(50))
    primary_color = db.Column(db.String(10))
    secondary_color = db.Column(db.String(10))
    generated_content = db.Column(db.Text)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
