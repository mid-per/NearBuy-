from flask import Blueprint, request, jsonify, current_app
from flask_jwt_extended import jwt_required, get_jwt_identity, create_access_token, create_refresh_token
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

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

bp = Blueprint('api', __name__, url_prefix='/api')

# Decorator for admin-only endpoints
def admin_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        current_user = User.query.get(int(get_jwt_identity()))
        if not current_user or not current_user.is_admin:
            return jsonify({"error": "Admin access required"}), 403
        return f(*args, **kwargs)
    return decorated

###################################################################
#temporary for testing frontend 
@bp.route('/create-test-users', methods=['POST'])
def create_test_users():
    # Create two users with different emails but the same password
    user1 = User(
        email='user1@example.com',
        password=generate_password_hash('testpassword'),
        is_admin=False
    )
    user2 = User(
        email='user2@example.com',
        password=generate_password_hash('testpassword'),
        is_admin=False
    )

    # Add users to the session and commit the transaction
    db.session.add(user1)
    db.session.add(user2)
    db.session.commit()

    return jsonify({"message": "Test users created"}), 201

@bp.route('/healthcheck')
def healthcheck():
    return jsonify({"message": "Backend operational", "status": "healthy"})

###################################################################
# Register (Customers or Admins)
@bp.route('/register', methods=['POST'])
def register():
    try:
        data = request.get_json()
        if not data or 'email' not in data or 'password' not in data:
            return jsonify({"error": "Email and password required"}), 400
            
        if User.query.filter_by(email=data['email']).first():
            return jsonify({"error": "Email already exists"}), 409
            
        new_user = User(
            email=data['email'].strip().lower(),
            password=generate_password_hash(data['password']),
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

# Login
@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({"error": "Email and password required"}), 400
        
    user = User.query.filter_by(email=data['email'].lower()).first()
    if not user or not check_password_hash(user.password, data['password']):
        return jsonify({"error": "Invalid credentials"}), 401
        
    print(f"Generating token for user: {user.id} {user.email}")  # Debug log
    
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
    print(f"Token contains user ID: {current_user_id}")  # Debug log
    
    current_user = User.query.get(current_user_id)
    if not current_user:
        return jsonify({"error": "User not found"}), 404
        
    print(f"Returning data for: {current_user.email}")  # Debug log
    
    return jsonify({
        "id": current_user.id,
        "email": current_user.email,
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

@bp.route('/users/<int:user_id>', methods=['GET'])
@jwt_required()
def get_user(user_id):
    current_user_id = int(get_jwt_identity())
    if current_user_id != user_id:
        return jsonify({"error": "Unauthorized"}), 403
        
    user = User.query.get(user_id)
    if not user:
        return jsonify({"error": "User not found"}), 404
        
    return jsonify({
        "id": user.id,
        "email": user.email,
        "is_admin": user.is_admin
    }), 200

#listing 
# Create Listing (Seller)
@bp.route('/listings', methods=['POST'])
@jwt_required()
def create_listing():
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        if not current_user:
            return jsonify({"error": "User not found"}), 404
            
        data = request.get_json()
        print("Received data:", data)  # Debug log
        
        if not data:
            return jsonify({"error": "No data provided"}), 400
            
        # Required fields validation
        required_fields = ['title', 'price', 'category', 'image_url']
        for field in required_fields:
            if field not in data:
                return jsonify({"error": f"Missing required field: {field}"}), 400
        
        # Price validation
        try:
            price = float(data['price'])
            if price <= 0:
                raise ValueError
        except ValueError:
            return jsonify({"error": "Invalid price"}), 400
            
        # Create new listing
        new_listing = Listing(
            title=data['title'].strip(),
            description=data.get('description', '').strip(),
            price=price,
            category=data['category'].strip(),
            image_url=data['image_url'],  # Make sure this matches your frontend
            seller_id=current_user.id,
            status='active'
        )
        
        db.session.add(new_listing)
        db.session.commit()
        
        return jsonify(new_listing.to_dict()), 201
        
    except Exception as e:
        db.session.rollback()
        print("Error creating listing:", str(e))  # Detailed error log
        return jsonify({
            "error": "Failed to create listing",
            "details": str(e)
        }), 500

@bp.route('/upload', methods=['POST'])
@jwt_required()
def upload_file():
    try:
        data = request.get_json()
        if not data or 'image' not in data:
            return jsonify({"error": "No image data provided"}), 400

        # Validate base64 image data
        if not data['image'].startswith('data:image/'):
            return jsonify({"error": "Invalid image format"}), 400

        # Extract metadata
        header, encoded = data['image'].split(',', 1)
        file_ext = header.split(';')[0].split('/')[-1]
        
        # Use provided filename or generate one
        filename = data.get('filename') or f"{uuid.uuid4()}.{file_ext}"
        filepath = os.path.join(current_app.config['UPLOAD_FOLDER'], filename)

        # Ensure upload directory exists
        os.makedirs(os.path.dirname(filepath), exist_ok=True)

        # Save the file
        with open(filepath, 'wb') as f:
            f.write(base64.b64decode(encoded))

        return jsonify({
            "message": "File uploaded successfully",
            "url": f"{request.host_url}uploads/{filename}".replace('http://', 'http://')  # Ensures proper URL format
        }), 200

    except Exception as e:
        current_app.logger.error(f"Upload failed: {str(e)}")
        return jsonify({
            "error": "File upload failed",
            "details": str(e)
        }), 500
    
# Update Listing (PUT)
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
            
        # Update fields if they exist in request
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

# Delete Listing (DELETE)
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
            
        # Soft delete for users, hard delete for admins
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

# Admin Listing Removal (POST)
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

# Get Single Listing (GET)
@bp.route('/listings/<int:listing_id>', methods=['GET'])
def get_listing(listing_id):
    try:
        listing = Listing.query.get(listing_id)
        if not listing or listing.status != 'active':
            return jsonify({"error": "Listing not found"}), 404
            
        return jsonify(listing.to_dict()), 200
        
    except Exception as e:
        logger.error(f"Failed to fetch listing: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to fetch listing"}), 500
    
# Search/Filter Listings (GET)
@bp.route('/listings/search', methods=['GET'])
def search_listings():
    try:
        # Get query parameters
        query = request.args.get('q', '').strip()
        category = request.args.get('category', '').strip()
        min_price = request.args.get('min_price')
        max_price = request.args.get('max_price')
        status = request.args.get('status', 'active')
        
        # Base query
        listings_query = Listing.query.filter(Listing.status == status)
        
        # Apply filters
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
                
        # Execute query
        listings = listings_query.order_by(Listing.created_at.desc()).all()
        
        return jsonify({
            "count": len(listings),
            "results": [listing.to_dict() for listing in listings]
        }), 200
        
    except Exception as e:
        logger.error(f"Search failed: {str(e)}", exc_info=True)
        return jsonify({"error": "Search failed"}), 500

#transaction
# Generate QR (Seller)
@bp.route('/transactions/qr', methods=['POST'])
@jwt_required()
def generate_qr():
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        data = request.get_json()
        
        if not data or 'buyer_id' not in data or 'listing_id' not in data:
            return jsonify({"error": "Buyer ID and listing ID required"}), 400
            
        # Verify listing belongs to current user
        listing = Listing.query.filter_by(
            id=data['listing_id'],
            seller_id=current_user.id
        ).first()
        
        if not listing:
            return jsonify({"error": "Listing not found or not owned by user"}), 404
            
        transaction = Transaction(
            qr_code=f"nearbuy:{uuid4().hex}",
            seller_id=current_user.id,
            buyer_id=data['buyer_id'],
            listing_id=data['listing_id']
        )
        
        db.session.add(transaction)
        db.session.commit()
        return jsonify({
            "qr_code": transaction.qr_code,
            "transaction_id": transaction.id
        }), 201 
        
    except Exception as e:
        logger.error(f"QR generation failed: {str(e)}", exc_info=True)
        return jsonify({
            "error": "QR generation failed",
    }), 500

@bp.route('/transactions/confirm', methods=['POST'])
@jwt_required()
def confirm_transaction():
    """Mark transaction as complete via QR scan"""
    current_user = User.query.get(int(get_jwt_identity()))
    data = request.get_json()
    
    if not data or 'qr_code' not in data:
        return jsonify({"error": "QR code required"}), 400
    
    transaction = Transaction.query.filter_by(
        qr_code=data['qr_code'],
        buyer_id=current_user.id
    ).first()
    
    if not transaction:
        return jsonify({"error": "Transaction not found"}), 404
        
    if transaction.completed:
        return jsonify({"error": "Transaction already completed"}), 400
    
    # QR expiration check (1 hour)
    expiration_time = transaction.created_at.replace(tzinfo=timezone.utc) + timedelta(hours=1)
    current_time = datetime.now(timezone.utc)
    
    if current_time > expiration_time:
        return jsonify({
            "error": "QR code expired",
            "details": f"Expired at {expiration_time.isoformat()}"
        }), 410
    
    transaction.completed = True
    transaction.completed_at = datetime.now(timezone.utc)
    db.session.commit()
    
    return jsonify({
        "message": "Transaction confirmed",
        "listing_id": transaction.listing_id,
        "seller_id": transaction.seller_id
    }), 200

@bp.route('/transactions/history', methods=['GET'])
@jwt_required()
def transaction_history():
    """Get user's transaction history"""
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        if not current_user:
            return jsonify({"error": "User not found"}), 404

        # As buyer
        bought = Transaction.query.filter_by(
            buyer_id=current_user.id
        ).all()
        
        # As seller
        sold = Transaction.query.filter_by(
            seller_id=current_user.id
        ).all()
        
        def format_transaction(t):
            return {
                "id": t.id,
                "item": t.listing.title,  # Changed from listing_ref to listing
                "price": t.listing.price,
                "completed": t.completed,
                "date": t.completed_at.isoformat() if t.completed else None,
                "counterparty": {
                    "id": t.seller.id if t.buyer_id == current_user.id else t.buyer.id,
                    "email": t.seller.email if t.buyer_id == current_user.id else t.buyer.email
                }
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
    
# Rate a Transaction (Buyer only)
@bp.route('/transactions/<int:transaction_id>/rate', methods=['POST'])
@jwt_required()
def rate_transaction(transaction_id):
    try:
        current_user = User.query.get(int(get_jwt_identity()))
        data = request.get_json()
        
        # Validate input
        if not data or 'rating' not in data:
            return jsonify({"error": "Rating required"}), 400
        
        rating = int(data['rating'])
        if rating < 1 or rating > 5:
            return jsonify({"error": "Rating must be 1-5"}), 400
        
        # Fetch transaction (must be completed and belong to buyer)
        transaction = Transaction.query.filter_by(
            id=transaction_id,
            buyer_id=current_user.id,
            completed=True
        ).first()
        
        if not transaction:
            return jsonify({"error": "Transaction not found or not eligible for rating"}), 404
        
        # Update rating/feedback
        transaction.rating = rating
        transaction.feedback = data.get('feedback', '').strip()
        db.session.commit()
        
        return jsonify({
            "message": "Rating submitted",
            "transaction_id": transaction.id,
            "seller_id": transaction.seller_id
        }), 200
    
    except Exception as e:
        db.session.rollback()
        logger.error(f"Rating failed: {str(e)}", exc_info=True)
        return jsonify({"error": "Failed to submit rating"}), 500
    
# Dispute Transaction (Buyer)
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

# Admin Resolve Dispute
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

# Get Seller's Average Rating (Public)
@bp.route('/users/<int:seller_id>/rating', methods=['GET'])
def get_seller_rating(seller_id):
    try:
        seller = User.query.get(seller_id)
        if not seller:
            return jsonify({"error": "Seller not found"}), 404
        
        # Calculate average rating from completed transactions
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
    
# Admin: Delete User
@bp.route('/admin/users/<int:user_id>', methods=['DELETE'])
@jwt_required()
@admin_required
def delete_user(user_id):
    try:
        user = User.query.get(user_id)
        if not user:
            return jsonify({"error": "User not found"}), 404
            
        if user.is_admin:
            return jsonify({"error": "Cannot delete admin users"}), 403
            
        db.session.delete(user)
        db.session.commit()
        return jsonify({"message": "User deleted"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": "Failed to delete user"}), 500

# Refresh Token
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