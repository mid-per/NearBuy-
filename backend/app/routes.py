from flask import Blueprint, request, jsonify, current_app, app
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token
from app.extensions import limiter
from werkzeug.security import generate_password_hash, check_password_hash
from uuid import uuid4 
from app import db
from app.models.user_model import User
from app.models.listing_model import Listing, Transaction
from app.services.auth_service import authenticate_user  
from functools import wraps
from datetime import datetime, timedelta, timezone
import logging
from app.services.upload_service import save_uploaded_file
from werkzeug.utils import secure_filename
import base64
import os
import uuid
import time 
from sqlalchemy.orm import joinedload


logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('api', __name__, url_prefix='/api')

# ======================
# 1. UTILITY DECORATORS
# ======================
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = User.query.get(int(get_jwt_identity()))
        print(f"Admin check for user {current_user.id}, is_admin={current_user.is_admin}") 
        if not current_user or not current_user.is_admin:
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated

# ======================
# 2. AUTHENTICATION ROUTES
# ======================
@bp.route('/register', methods=['POST'])
@limiter.limit("10 per minute")
def register():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({"error": "Email and password required"}), 400
            
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Email already exists"}), 409
            
        new_user = User(
            email=data['email'].strip().lower(),
            password=data['password'],
            is_admin=data.get('is_admin', False)
        )
        
        db.session.add(new_user)
        db.session.commit()
        return jsonify({
            "id": new_user.id,
            "email": new_user.email,
            "is_admin": new_user.is_admin
        }), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Registration failed"}), 500

@bp.route('/login', methods=['POST'])
@limiter.limit("100 per minute")
def login():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"error": "Email and password required"}), 400
        
    user = User.query.filter_by(email=data['email'].lower()).first()
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({"error": "Invalid credentials"}), 401
        
    return jsonify({
        "access_token": create_access_token(identity=str(user.id)),
        "refresh_token": create_refresh_token(identity=str(user.id)),
        "user_id": user.id,
        "email": user.email,
        "is_admin": user.is_admin
    }), 200

@bp.route('/auth/me', methods=['GET'])
@jwt_required()
def get_current_user():
    current_user_id = int(get_jwt_identity())
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({"error": "User not found"}), 404
    
    return jsonify({
        "id": current_user.id,
        "email": current_user.email,
        "name": current_user.name, 
        "avatar": current_user.avatar, 
        "bio": current_user.bio,
        "location": current_user.location,
        "phone": current_user.phone,
        "is_admin": current_user.is_admin
    }), 200

@bp.route('/auth/verify-token', methods=['GET'])
@jwt_required()
def verify_token():
    current_user = User.query.get(int(get_jwt_identity()))
    if not current_user:
        return jsonify({"valid": False}), 401
        
    return jsonify({
        "valid": True,
        "user_id": current_user.id,
        "email": current_user.email
    }), 200

@bp.route('/auth/logout', methods=['POST'])
@jwt_required()
def logout():
    return jsonify({"message": "Logged out successfully"}), 200

@bp.route('/auth/change-email', methods=['POST'])
@jwt_required()
def change_email():
    current_user = User.query.get(int(get_jwt_identity()))
    data = request.get_json()
    
    if not check_password_hash(current_user.password, data['currentPassword']):
        return jsonify({"error": "Invalid password"}), 401
        
    if User.query.filter_by(email=data['newEmail']).first():
        return jsonify({"error": "Email already in use"}), 409
        
    current_user.email = data['newEmail']
    db.session.commit()
    
    return jsonify({
        "message": "Email updated",
        "email": current_user.email
    }), 200

@bp.route('/auth/change-password', methods=['POST'])
@jwt_required()
def change_password():
    current_user_id = get_jwt_identity()
    user = User.query.get_or_404(current_user_id)
    
    data = request.get_json()
    if not data or 'currentPassword' not in data or 'newPassword' not in data:
        return jsonify({"error": "Current and new password required"}), 400
        
    if not check_password_hash(user.password, data['currentPassword']):
        return jsonify({"error": "Invalid current password"}), 401
        
    if len(data['newPassword']) < 8:
        return jsonify({"error": "Password must be at least 8 characters"}), 400
    
    # Critical fix - Set password directly to trigger model's hash event
    user.password = data['newPassword']  # Let SQLAlchemy event handle hashing
    db.session.commit()
    
    return jsonify({"message": "Password updated successfully"}), 200

@bp.route('/refresh', methods=['POST'])
@jwt_required(refresh=True)
def refresh():
    try:
        current_user = get_jwt_identity()
        user = User.query.get(current_user)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        return jsonify({
            "access_token": create_access_token(identity=str(user.id))
        })
        
    except Exception as e:
        return jsonify({"error": "Token refresh failed"}), 500

# ======================
# 3. USER PROFILE ROUTES
# ======================
@bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
    
    ratings = [t.rating for t in user.sales if t.rating is not None]
    avg_rating = round(sum(ratings) / len(ratings), 1) if ratings else 0

    listings_count = Listing.query.filter_by(
        seller_id=user_id,
        status='active'
    ).count()
    
    return jsonify({
        "id": user.id,
        "email": user.email,
        "name": user.name,
        "avatar": user.avatar,
        "bio": user.bio,
        "location": user.location,
        "phone": user.phone,
        "rating": avg_rating,
        "listings_count": listings_count,
        "is_admin": user.is_admin
    }), 200

@bp.route('/users/<int:user_id>', methods=['PUT', 'DELETE'])
@jwt_required()
def user_profile(user_id):
    current_user_id = int(get_jwt_identity())
    
    if current_user_id != user_id and not User.query.get(current_user_id).is_admin:
        return jsonify({"error": "Unauthorized"}), 403

    user = User.query.get_or_404(user_id)

    if request.method == 'GET':
        return jsonify({
            "id": user.id,
            "email": user.email,
            "name": user.name,
            "avatar": user.avatar,
            "bio": user.bio,
            "location": user.location,
            "phone": user.phone,
            "is_admin": user.is_admin,
            "rating": user.rating,  
            "listings_count": Listing.query.filter_by(seller_id=user_id, status='active').count()
        })

    elif request.method == 'PUT':
        try:
            data = {}
            if request.content_type and 'multipart/form-data' in request.content_type:
                data = request.form.to_dict()
                avatar_file = request.files.get('avatar')
                
                if avatar_file:
                    filename = secure_filename(f"{user_id}_avatar_{int(time.time())}.{avatar_file.filename.split('.')[-1]}")
                    filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)
                    avatar_file.save(filepath)
                    user.avatar = f"/uploads/{filename}"
            else:
                data = request.get_json()

            if 'email' in data:
                if User.query.filter(User.email == data['email'], User.id != user.id).first():
                    return jsonify({"error": "Email already in use"}), 400
                user.email = data['email']

            if 'name' in data:
                user.name = data['name']
            if 'bio' in data:
                user.bio = data['bio']
            if 'location' in data:
                user.location = data['location']
            if 'phone' in data:
                user.phone = data['phone']

            db.session.commit()

            return jsonify({
                "id": user.id,
                "email": user.email,
                "name": user.name,
                "avatar": user.avatar,
                "bio": user.bio,
                "location": user.location,
                "phone": user.phone,
                "is_admin": user.is_admin
            })

        except Exception as e:
            db.session.rollback()
            current_app.logger.error(f"Profile update failed: {str(e)}")
            return jsonify({"error": "Profile update failed", "details": str(e)}), 500

    elif request.method == 'DELETE':
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted"})

@bp.route('/users/<int:seller_id>/rating', methods=['GET'])
def get_seller_rating(seller_id):
    try:
        seller = User.query.get(seller_id)
        if not seller:
            return jsonify({"error": "Seller not found"}), 404
        
        ratings = [
            t.rating for t in seller.sales 
            if t.completed and t.rating is not None
        ]
        
        avg_rating = round(sum(ratings) / len(ratings), 2) if ratings else None
        
        return jsonify({
            "seller_id": seller.id,
            "average_rating": avg_rating,
            "total_ratings": len(ratings)
        }), 200
    
    except Exception as e:
        logger.error(f"Failed to fetch ratings: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to calculate rating"}), 500

# ======================
# 4. LISTING ROUTES
# ======================
@bp.route('/listings', methods=['POST'])
@jwt_required()
def create_listing():
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        if not current_user:
            return jsonify({"error": "User not found"}), 404
            
        data = request.get_json()
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        required_fields = ['title', 'price', 'category', 'image_url']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        try:
            price = float(data['price'])
            if price <= 0:
                raise ValueError
        except ValueError:
            return jsonify({"error": "Invalid price"}), 400
            
        new_listing = Listing(
            title=data['title'].strip(),
            description=data.get('description', '').strip(),
            price=price,
            category=data['category'].strip(),
            image_url=data['image_url'],
            seller_id=current_user.id,
            status='active'
        )
        
        db.session.add(new_listing)
        db.session.commit()
        
        return jsonify(new_listing.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        return jsonify({
            "error": "Failed to create listing",
            "details": str(e)
        }), 500

@bp.route('/listings/<int:listing_id>', methods=['GET'])
def get_listing(listing_id):
    try:
        listing = Listing.query.get(listing_id)
        if not listing:
            return jsonify({"error": "Listing not found"}), 404
            
        return jsonify(listing.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Failed to fetch listing: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch listing"}), 500

@bp.route('/listings/<int:listing_id>', methods=['PUT'])
@jwt_required()
def update_listing(listing_id):
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        listing = Listing.query.get(listing_id)
        
        if not listing:
            return jsonify({"error": "Listing not found"}), 404
            
        if listing.seller_id != current_user.id and not current_user.is_admin:
            return jsonify({"error": "Unauthorized to edit this listing"}), 403
            
        data = request.get_json()
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        if 'title' in data:
            listing.title = data['title'].strip()
        if 'description' in data:
            listing.description = data['description'].strip()
        if 'price' in data:
            try:
                price = float(data['price'])
                if price <= 0:
                    raise ValueError
                listing.price = price
            except ValueError:
                return jsonify({"error": "Invalid price"}), 400
        if 'category' in data:
            listing.category = data['category'].strip()
        if 'status' in data and current_user.is_admin:
            listing.status = data['status']
            if data['status'] == 'removed' and 'removal_reason' in data:
                listing.removal_reason = data['removal_reason']
                listing.moderator_id = current_user.id
                
        db.session.commit()
        return jsonify(listing.to_dict()), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to update listing: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to update listing"}), 500

@bp.route('/listings/<int:listing_id>', methods=['DELETE'])
@jwt_required()
def delete_listing(listing_id):
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        listing = Listing.query.get(listing_id)
        
        if not listing:
            return jsonify({"error": "Listing not found"}), 404
            
        if listing.seller_id != current_user.id and not current_user.is_admin:
            return jsonify({"error": "Unauthorized to delete this listing"}), 403
            
        if current_user.is_admin:
            db.session.delete(listing)
        else:
            listing.status = 'removed'
            
        db.session.commit()
        return jsonify({"message": "Listing deleted"}), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Failed to delete listing: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to delete listing"}), 500

@bp.route('/listings/search', methods=['GET'])
def search_listings():
    try:
        query = request.args.get('q', '').strip()
        category = request.args.get('category', '').strip()
        min_price = request.args.get('min_price')
        max_price = request.args.get('max_price')
        status = request.args.get('status')
        seller_id = request.args.get('seller_id')
        
        listings_query = Listing.query
        
        if seller_id:
            if status:
                listings_query = listings_query.filter(Listing.status == status)
        else:
            listings_query = listings_query.filter(Listing.status == 'active')
            
        if seller_id:
            listings_query = listings_query.filter(Listing.seller_id == int(seller_id))
            
        if query:
            listings_query = listings_query.filter(
                Listing.title.ilike(f'%{query}%') | 
                Listing.description.ilike(f'%{query}%')
            )
            
        if category:
            listings_query = listings_query.filter(Listing.category.ilike(f'%{category}%'))
            
        if min_price:
            try:
                listings_query = listings_query.filter(Listing.price >= float(min_price))
            except ValueError:
                return jsonify({"error": "Invalid min_price"}), 400
                
        if max_price:
            try:
                listings_query = listings_query.filter(Listing.price <= float(max_price))
            except ValueError:
                return jsonify({"error": "Invalid max_price"}), 400
                
        listings = listings_query.order_by(Listing.created_at.desc()).all()
        
        return jsonify({
            "count": len(listings),
            "results": [listing.to_dict() for listing in listings]
        }), 200
        
    except Exception as e:
        logger.error(f"Search failed: {str(e)}", exc_info=True)
        return jsonify({"error": "Search failed"}), 500

@bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "No image data provided"}), 400

        if not data['image'].startswith('data:image/'):
            return jsonify({"error": "Invalid image format"}), 400

        header, encoded = data['image'].split(',', 1)
        file_ext = header.split(';')[0].split('/')[-1]
        
        filename = data.get('filename') or f"{uuid.uuid4()}.{file_ext}"
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(encoded))

        return jsonify({
            "message": "File uploaded successfully",
            "url": f"{request.host_url}uploads/{filename}".replace('http://', 'http://')
        }), 200

    except Exception as e:
        current_app.logger.error(f"Upload failed: {str(e)}")
        return jsonify({
            "error": "File upload failed",
            "details": str(e)
        }), 500

# ======================
# 5. TRANSACTION ROUTES
# ======================
@bp.route('/transactions', methods=['GET'])
def get_transactions():
    listing_id = request.args.get('listing_id')
    
    query = Transaction.query
    
    if listing_id:
        query = query.filter_by(listing_id=listing_id)
    
    transactions = query.all()
    return jsonify([t.to_dict() for t in transactions]), 200

@bp.route('/transactions/qr', methods=['POST'])
@jwt_required()
def generate_qr_code():
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    if not data or 'listing_id' not in data:
        return jsonify({"error": "Listing ID required"}), 400
        
    listing = Listing.query.filter_by(
        id=data['listing_id'],
        seller_id=current_user_id,
        status='active'  # Only allow QR generation for active listings
    ).first()
    
    if not listing:
        return jsonify({
            "error": "Listing not found, not owned by you, or not active",
            "code": "invalid_listing"
        }), 404
        
    # Check for existing pending transaction
    existing_transaction = Transaction.query.filter_by(
        listing_id=data['listing_id'],
        completed=False
    ).first()
    
    if existing_transaction:
        # Check if existing QR is still valid
        expiration_time = existing_transaction.created_at.replace(tzinfo=timezone.utc) + timedelta(hours=1)
        if datetime.now(timezone.utc) < expiration_time:
            return jsonify({
                "qr_code": existing_transaction.qr_code,
                "transaction_id": existing_transaction.id,
                "existing": True
            }), 200
        
    transaction = Transaction(
        qr_code=f"nearbuy:{uuid4().hex}",
        seller_id=current_user_id,
        listing_id=data['listing_id'],
    )
    
    db.session.add(transaction)
    db.session.commit()
    
    return jsonify({
        "qr_code": transaction.qr_code,
        "transaction_id": transaction.id,
        "existing": False
    }), 201

@bp.route('/transactions/confirm', methods=['POST'])
@jwt_required()
def confirm_transaction():
    current_user_id = int(get_jwt_identity())
    data = request.get_json()
    
    if not data or 'qr_code' not in data:
        return jsonify({"error": "QR code required"}), 400
    
    if not data['qr_code'].startswith('nearbuy:'):
        return jsonify({"error": "Invalid QR code format"}), 400
    
    transaction = Transaction.query.options(
        joinedload(Transaction.listing),
        joinedload(Transaction.seller)
    ).filter_by(
        qr_code=data['qr_code'],
        completed=False
    ).first()
    
    if not transaction:
        return jsonify({"error": "Transaction not found"}), 404
        
    # Prevent seller from completing their own transaction
    if transaction.seller_id == current_user_id:
        return jsonify({
            "error": "Sellers cannot complete their own transactions",
            "code": "self_transaction"
        }), 403
        
    # Validate listing status
    if transaction.listing.status != 'active':
        return jsonify({
            "error": "Listing is no longer available",
            "code": "invalid_listing"
        }), 410
    
    # Validate transaction time window (1 hour)
    expiration_time = transaction.created_at.replace(tzinfo=timezone.utc) + timedelta(hours=1)
    current_time = datetime.now(timezone.utc)
    
    if current_time > expiration_time:
        return jsonify({
            "error": "QR code expired",
            "code": "expired"
        }), 410
    
    # Complete the transaction
    transaction.buyer_id = current_user_id
    transaction.completed = True
    transaction.completed_at = current_time
    transaction.listing.status = 'sold'

    db.session.commit()
    
    return jsonify({
        "transaction_id": transaction.id,
        "seller_id": transaction.seller_id,
        "seller_name": transaction.seller.name,
        "seller_avatar": transaction.seller.avatar,
        "listing_title": transaction.listing.title,
        "listing_price": float(transaction.listing.price)
    }), 200

@bp.route('/transactions/history', methods=['GET'])
@jwt_required()
def transaction_history():
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        bought = Transaction.query.filter_by(
            buyer_id=current_user.id
        ).options(
            joinedload(Transaction.listing),
            joinedload(Transaction.seller)
        ).all()
        
        sold = Transaction.query.filter_by(
            seller_id=current_user.id
        ).options(
            joinedload(Transaction.listing),
            joinedload(Transaction.buyer)
        ).all()
        
        def format_transaction(t):
            counterparty = None
            if t.completed:
                if t.buyer_id == current_user.id:
                    counterparty = {
                        "id": t.seller.id,
                        "email": t.seller.email
                    } if t.seller else None
                else:
                    counterparty = {
                        "id": t.buyer.id,
                        "email": t.buyer.email
                    } if t.buyer else None

            return {
                "id": t.id,
                "listing_id": t.listing.id,
                "title": t.listing.title,
                "price": float(t.listing.price),
                "image_url": t.listing.image_url,
                "completed": t.completed,
                "completed_at": t.completed_at.isoformat() if t.completed_at else None,
                "counterparty": counterparty
            }
        
        return jsonify({
            "bought": [format_transaction(t) for t in bought],
            "sold": [format_transaction(t) for t in sold]
        }), 200

    except Exception as e:
        logger.error(f"Failed to fetch transaction history: {str(e)}", exc_info=True)
        return jsonify({
            "error": "Failed to load transaction history",
            "details": "Please try again later"
        }), 500

@bp.route('/transactions/<int:tx_id>/dispute', methods=['POST'])
@jwt_required()
def dispute_transaction(tx_id):
    current_user = User.query.get(int(get_jwt_identity()))
    data = request.get_json()
    
    transaction = Transaction.query.filter_by(
        id=tx_id,
        buyer_id=current_user.id
    ).first()
    
    if not transaction:
        return jsonify({"error": "Transaction not found"}), 404
    
    if not transaction.is_disputable():
        return jsonify({"error": "Transaction not eligible for dispute"}), 400
        
    if not data or 'reason' not in data:
        return jsonify({"error": "Dispute reason required"}), 400
    
    transaction.status = 'disputed'
    transaction.dispute_reason = data['reason']
    transaction.disputed_at = datetime.now(timezone.utc)
    
    db.session.commit()
    return jsonify({"message": "Dispute filed"}), 200

@bp.route('/transactions/<int:tx_id>/rate', methods=['POST'])
@jwt_required()
def rate_transaction(tx_id):
    current_user_id = get_jwt_identity()
    data = request.get_json()
    
    transaction = Transaction.query.filter_by(
        id=tx_id,
        buyer_id=current_user_id,
        completed=True
    ).first()
    
    if not transaction:
        return jsonify({"error": "Transaction not found"}), 404
        
    if not data or 'rating' not in data:
        return jsonify({"error": "Rating required"}), 400
        
    rating = int(data['rating'])
    if rating < 1 or rating > 5:
        return jsonify({"error": "Rating must be 1-5"}), 400
        
    transaction.rating = rating
    transaction.feedback = data.get('feedback', '')
    db.session.commit()
    
    return jsonify({
        "message": "Rating submitted",
        "seller_id": transaction.seller_id
    }), 200

# ======================
# 6. ADMIN ROUTES
# ======================
@bp.route('/admin/users', methods=['GET'])
@jwt_required()
@admin_required
def admin_get_users():
    users = User.query.filter(
        (User.is_deleted == 0) | (User.is_deleted == None)
    ).all()
    
    return jsonify({
        "users": [{
            "id": u.id,
            "email": u.email,
            "name": u.name or "Unnamed User",  # Handle NULL names
            "is_admin": bool(u.is_admin),
            "avatar": u.avatar
        } for u in users]
    })

@bp.route('/admin/listings/<int:listing_id>/remove', methods=['POST'])
@jwt_required()
@admin_required
def admin_remove_listing(listing_id):
    try:
        data = request.get_json()
        if not data or 'reason' not in data:
            return jsonify({"error": "Removal reason required"}), 400
            
        listing = Listing.query.get(listing_id)
        if not listing:
            return jsonify({"error": "Listing not found"}), 404
            
        listing.status = 'removed'
        listing.removal_reason = data['reason'].strip()
        listing.moderator_id = int(get_jwt_identity())
        
        db.session.commit()
        return jsonify({
            "message": "Listing removed by admin",
            "listing_id": listing.id,
            "status": listing.status
        }), 200
        
    except Exception as e:
        db.session.rollback()
        logger.error(f"Admin listing removal failed: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to remove listing"}), 500

@bp.route('/admin/transactions/<int:tx_id>/resolve', methods=['POST'])
@jwt_required()
@admin_required
def resolve_dispute(tx_id):
    data = request.get_json()
    transaction = Transaction.query.get(tx_id)
    
    if not transaction or transaction.status != 'disputed':
        return jsonify({"error": "No active dispute found"}), 404
        
    if not data or 'action' not in data:
        return jsonify({"error": "Resolution action required"}), 400
    
    if data['action'] == 'refund':
        transaction.status = 'refunded'
    elif data['action'] == 'reject':
        transaction.status = 'completed'
    else:
        return jsonify({"error": "Invalid action"}), 400
    
    transaction.resolved_at = datetime.now(timezone.utc)
    db.session.commit()
    
    return jsonify({
        "message": f"Dispute {data['action']}ed",
        "new_status": transaction.status
    }), 200

@bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        user = User.query.get(user_id)
        
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        if user.id == current_user.id:
            return jsonify({"error": "Cannot delete yourself"}), 403
            
        if user.is_admin:
            return jsonify({"error": "Cannot delete admin users"}), 403
            
        # Soft delete implementation
        user.is_deleted = True
        user.deleted_at = datetime.now(timezone.utc)
        user.original_email = user.email
        user.email = f"deleted_{user.id}@nearbuy.invalid"
        user.name = "Deleted User"
        user.avatar = None
        user.bio = None
        user.location = None
        user.phone = None
        user.password = "invalid_password_hash"
        
        db.session.commit()
        return jsonify({"message": "User anonymized"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete user"}), 500