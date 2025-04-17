from flask import Blueprint, request, jsonify
from extensions import db
from models import Campaign
from auth import token_required
from datetime import datetime

campaign_blueprint = Blueprint('campaign', __name__)

@campaign_blueprint.route('/campaigns', methods=['POST'])
@token_required
def create_campaign(current_user):
    try:
        data = request.get_json()  # Use get_json() instead of request.json

        print("Received campaign data:", data)  # Debug log
        
        campaign = Campaign(
            user_id=current_user.id,
            name=data.get('name', 'Unnamed Campaign'),
            description=data.get('description', ''),
            category=data.get('category', 'other'),
            tone=data.get('tone', 'professional'),
            banner_style=data.get('banner_style'),
            primary_color=data.get('primary_color'),
            secondary_color=data.get('secondary_color'),
            generated_content=data.get('generated_content', '')
        )
        
        db.session.add(campaign)
        db.session.commit()
        
        print("Campaign saved with ID:", campaign.id)  # Debug log
        
        return jsonify({
            'message': 'Campaign saved successfully',
            'id': campaign.id
        }), 201
        
    except Exception as e:
        db.session.rollback()
        print("Error saving campaign:", str(e))  # Debug log
        return jsonify({
            'message': f'Failed to save campaign: {str(e)}'
        }), 400

@campaign_blueprint.route('/campaigns', methods=['GET'])
@token_required
def get_campaigns(current_user):
    campaigns = Campaign.query.filter_by(user_id=current_user.id).order_by(Campaign.created_at.desc()).all()
    return jsonify([{
        'id': c.id,
        'name': c.name,
        'description': c.description,
        'category': c.category,
        'tone': c.tone,
        'created_at': c.created_at.isoformat(),
        'preview': c.generated_content[:100] if c.generated_content else ''
    } for c in campaigns])

@campaign_blueprint.route('/campaigns/<int:id>', methods=['GET'])
@token_required
def get_campaign(current_user, id):
    campaign = Campaign.query.filter_by(id=id, user_id=current_user.id).first()
    if not campaign:
        return jsonify({'message': 'Campaign not found'}), 404
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
