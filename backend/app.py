from flask import Flask, jsonify, request
from extensions import db
from models import User, Campaign
from auth import auth_blueprint, token_required
from campaigns import campaign_blueprint
from flask_cors import CORS

app = Flask(__name__)
CORS(app)




@app.after_request
def after_request(response):
    response.headers.add('Access-Control-Allow-Origin', '*')
    response.headers.add('Access-Control-Allow-Headers', 'Content-Type,Authorization')
    response.headers.add('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE,OPTIONS')
    return response


app.config['SQLALCHEMY_DATABASE_URI'] = 'sqlite:///db.sqlite3'
app.config['SECRET_KEY'] = 'your-secret-key'

db.init_app(app)

# Register blueprints
app.register_blueprint(auth_blueprint)
app.register_blueprint(campaign_blueprint)

# Protected account route
@app.route('/account', methods=['GET'])
@token_required
def account(current_user):
    return jsonify({
        "username": current_user.username,
        "email": current_user.email,
        "created_at": current_user.created_at.isoformat(),
        "campaigns_count": len(current_user.campaigns)
    })

# Add these new routes to your app.py

@app.route('/account/update', methods=['POST'])
@token_required
def update_account(current_user):
    data = request.json
    try:
        if 'username' in data:
            current_user.username = data['username']
        if 'email' in data:
            current_user.email = data['email']
        db.session.commit()
        return jsonify({"message": "Account updated successfully"})
    except Exception as e:
        db.session.rollback()
        return jsonify({"message": str(e)}), 400

@app.route('/campaigns', methods=['GET'])
@token_required
def get_user_campaigns(current_user):
    campaigns = Campaign.query.filter_by(user_id=current_user.id)\
                            .order_by(Campaign.created_at.desc())\
                            .all()
    
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'description': c.description,
        'category': c.category,
        'tone': c.tone,
        'created_at': c.created_at.isoformat(),
        'preview': c.generated_content[:100] if c.generated_content else '',
        'banner_style': c.banner_style,
        'primary_color': c.primary_color,
        'secondary_color': c.secondary_color
    } for c in campaigns])

@app.route('/campaigns/<int:id>', methods=['GET'])
@token_required
def get_campaign(current_user, id):
    campaign = Campaign.query.filter_by(id=id, user_id=current_user.id).first()
    if not campaign:
        return jsonify({"message": "Campaign not found"}), 404

    return jsonify({
        'id': campaign.id,
        'name': campaign.name,
        'description': campaign.description,
        'category': campaign.category,
        'tone': campaign.tone,
        'banner_style': campaign.banner_style,
        'primary_color': campaign.primary_color,
        'secondary_color': campaign.secondary_color,
        'generated_content': campaign.generated_content,
        'created_at': campaign.created_at.isoformat()
    })


if __name__ == '__main__':
    with app.app_context():
        db.create_all()
    app.run(debug=True)
