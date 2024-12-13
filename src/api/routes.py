"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, BlogPost, PostLike, Comment, CommentLike
from api.utils import generate_sitemap, APIException
from flask_cors import CORS

from werkzeug.security import generate_password_hash, check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity, get_jwt
from datetime import datetime, timedelta

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route('/testing', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! This is for testing purposes. I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200

# ----------------------------- authentication routes -----------------------------
# ----------------------------- authentication routes -----------------------------
# ----------------------------- authentication routes -----------------------------
# ----------------------------- authentication routes -----------------------------
@api.route('/check-availability', methods=['POST'])
def check_availability():
    field = request.json.get('field')
    value = request.json.get('value')

    if field not in ['username', 'email']:
        return jsonify({"error": "Invalid field"}), 400
    
    # Use getattr to dynamically access either User.username or User.email depending on which field was passed
    user = User.query.filter(getattr(User, field) == value).first()

    # Return true if no user was found (meaning the username/email is available)
    return jsonify({"isAvailable": user is None}), 200

@api.route('/signup', methods=['POST'])
def signup_user():
    email = request.json.get('email')
    username = request.json.get('username')
    password = request.json.get('password')

    existing_user = User.query.filter_by(email = email).one_or_none()
    if existing_user:
        return jsonify({'error': 'There is already an account associated with this email address.'}), 400
    if User.query.filter_by(username=username).first():
        return jsonify({"error": "Username must be unique, please try another username."}), 400
    
    new_user = User(
        email=email, 
        username=username,
        password=generate_password_hash(password), 
        is_active=False,
    )

    db.session.add(new_user)
    db.session.commit()

    response_body = {
        "message": "User successfully created",
        "user": new_user.serialize() 
    }

    return jsonify(response_body), 201

@api.route("/login", methods=["POST"])
def login_user():
    login_identifier = request.json.get("loginIdentifier")
    password = request.json.get("password")

    user = User.query.filter(
        db.or_(
            User.email == login_identifier,
            User.username == login_identifier
        )
    ).one_or_none()
    if user is None:
        return jsonify({"message": "No account found with this email/username"}), 404
    
    if not check_password_hash(user.password, password):
        return jsonify({"message": "Incorrect password"}), 401
    

    access_token = create_access_token(
        identity = user.id,
        expires_delta=timedelta(hours=12)
    )
    return jsonify({
        "token": access_token,
        "userData": user.serialize()
    }), 200


# ----------------------------- blog routes -----------------------------
# ----------------------------- blog routes -----------------------------
# ----------------------------- blog routes -----------------------------
# ----------------------------- blog routes -----------------------------
@api.route("/blog_posts", methods=["GET"])
def get_all_posts():
    posts = BlogPost.query.all()
    return jsonify([post.serialize() for post in posts]), 200

@api.route("/blog_posts/<int:id>", methods=["GET"])
def get_post(id):
    post = BlogPost.query.get_or_404(id)
    return jsonify(post.serialize()), 200

@api.route("/blog_posts", methods=["POST"])
def create_post():
    data = request.json
    author = User.query.get(data["author_id"])
    if not author:
        return jsonify({"error": "Author not found"}), 404
    new_post = BlogPost(
        title=data["title"],
        content=data["content"],
        image_url=data.get("image_url"),
        author=author
    )
    db.session.add(new_post)
    db.session.commit()
    return jsonify(new_post.serialize()), 201

@api.route("/blog_posts/<int:blog_id>/edit", methods=["PUT"])
def edit_blog(blog_id):
    # Get the user ID from the request headers
    user_id = request.headers.get('userId')

    if not user_id:
        return jsonify({"message": "Unauthorized: Missing userId"}), 401

    try:
        # Find the blog by its ID
        blog = BlogPost.query.get(blog_id)

        if not blog:
            return jsonify({"message": "Blog not found"}), 404

        # Check if the logged-in user is the author of the blog
        if blog.author_id != int(user_id):
            return jsonify({"message": "Unauthorized: You are not the author of this blog"}), 403

        # Get the data from the request
        data = request.json

        # Update the blog fields
        if "title" in data:
            blog.title = data["title"]
        if "content" in data:
            blog.content = data["content"]
        if "image_url" in data:
            blog.image_url = data["image_url"]

        # Save the changes
        db.session.commit()

        return jsonify({
            "message": "Blog updated successfully",
            "blog": blog.serialize()
        }), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@api.route('/delete_blog/<int:blog_id>', methods=['DELETE'])
def delete_blog(blog_id):
    # Get the user ID from the request headers or session
    user_id = request.headers.get('userId')  # This should match `store.userId` in the frontend

    if not user_id:
        return jsonify({"message": "Unauthorized: Missing userId"}), 401

    try:
        # Find the blog by its ID
        blog = BlogPost.query.get(blog_id)

        if not blog:
            return jsonify({"message": "Blog not found"}), 404

        # Check if the logged-in user is the author of the blog
        if blog.author_id != int(user_id):
            return jsonify({"message": "Unauthorized: You are not the author of this blog"}), 403

        # If the user is the author, delete the blog
        db.session.delete(blog)
        db.session.commit()

        return jsonify({"message": "Blog deleted successfully"}), 200

    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500
    
@api.route("/blog_posts/<int:post_id>/like", methods=["POST"])
def like_post(post_id):
    if not request.headers.get('userId'):
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    user_id = request.headers.get('userId')
    
    existing_like = PostLike.query.filter_by(
        user_id=user_id,
        post_id=post_id
    ).first()
    
    try:
        if existing_like:
            if existing_like.is_like == data["is_like"]:
                db.session.delete(existing_like)
            else:
                existing_like.is_like = data["is_like"]
        else:
            new_like = PostLike(
                user_id=user_id,
                post_id=post_id,
                is_like=data["is_like"]
            )
            db.session.add(new_like)
        
        db.session.commit()
        return jsonify({"message": "Success"}), 200
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@api.route("/blog_posts/<int:post_id>/comments", methods=["GET"])
def get_comments(post_id):
    comments = Comment.query.filter_by(post_id=post_id).all()
    return jsonify([comment.serialize() for comment in comments]), 200

@api.route("/blog_posts/<int:post_id>/comments", methods=["POST"])
def add_comment(post_id):
    if not request.headers.get('userId'):
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    user_id = request.headers.get('userId')
    
    new_comment = Comment(
        content=data["content"],
        user_id=user_id,
        post_id=post_id
    )
    
    db.session.add(new_comment)
    db.session.commit()
    
    return jsonify(new_comment.serialize()), 201

@api.route("/comments/<int:comment_id>", methods=["DELETE"])
def delete_comment(comment_id):
    user_id = request.headers.get('userId')
    
    if not user_id:
        return jsonify({"message": "Unauthorized: Missing userId"}), 401
        
    try:
        comment = Comment.query.get(comment_id)
        
        if not comment:
            return jsonify({"message": "Comment not found"}), 404
            
        if comment.user_id != int(user_id):
            return jsonify({"message": "Unauthorized: You are not the author of this comment"}), 403
            
        db.session.delete(comment)
        db.session.commit()
        
        return jsonify({"message": "Comment deleted successfully"}), 200
        
    except Exception as e:
        db.session.rollback()
        return jsonify({"error": str(e)}), 500

@api.route("/comments/<int:comment_id>/like", methods=["POST"])
def like_comment(comment_id):
    if not request.headers.get('userId'):
        return jsonify({"error": "Unauthorized"}), 401
        
    data = request.json
    user_id = request.headers.get('userId')
    
    existing_like = CommentLike.query.filter_by(
        user_id=user_id,
        comment_id=comment_id
    ).first()
    
    if existing_like:
        if existing_like.is_like == data["is_like"]:
            db.session.delete(existing_like)
        else:
            existing_like.is_like = data["is_like"]
    else:
        new_like = CommentLike(
            user_id=user_id,
            comment_id=comment_id,
            is_like=data["is_like"]
        )
        db.session.add(new_like)
    
    db.session.commit()
    return jsonify({"message": "Success"}), 200

