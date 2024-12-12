"""
This module takes care of starting the API Server, Loading the DB and Adding the endpoints
"""
from flask import Flask, request, jsonify, url_for, Blueprint
from api.models import db, User, BlogPost, PostLike, Comment, CommentLike
from api.utils import generate_sitemap, APIException
from flask_cors import CORS

api = Blueprint('api', __name__)

# Allow CORS requests to this API
CORS(api)


@api.route('/testing', methods=['POST', 'GET'])
def handle_hello():

    response_body = {
        "message": "Hello! This is for testing purposes. I'm a message that came from the backend, check the network tab on the google inspector and you will see the GET request"
    }

    return jsonify(response_body), 200


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

