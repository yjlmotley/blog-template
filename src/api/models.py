from flask_sqlalchemy import SQLAlchemy

db = SQLAlchemy()

class User(db.Model):
    __tablename__ = "users"
    id = db.Column(db.Integer, primary_key=True)
    email = db.Column(db.String(120), unique=True, nullable=False)
    password = db.Column(db.String(256), unique=False, nullable=False)
    is_active = db.Column(db.Boolean(), unique=False, nullable=False)
    username = db.Column(db.String(250), unique=True, nullable=False)

    blog_posts = db.relationship("BlogPost", back_populates="author")
    post_likes = db.relationship("PostLike", back_populates="user")
    comments = db.relationship("Comment", back_populates="user")
    comment_likes = db.relationship("CommentLike", back_populates="user")

    def __repr__(self):
        return f'<User {self.email}>'
    
    def serialize(self):
        return {
            "id": self.id,
            "email": self.email,
            "username": self.username,
            "is_active": self.is_active,
        }

class BlogPost(db.Model):
    __tablename__ = "blog_posts"
    id = db.Column(db.Integer, primary_key=True)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    image_url = db.Column(db.String, nullable=True)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    author_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)

    author = db.relationship("User", back_populates="blog_posts")
    comments = db.relationship("Comment", back_populates="post", cascade="all, delete-orphan")
    likes = db.relationship("PostLike", back_populates="post", cascade="all, delete-orphan")

    def serialize(self):
        likes_count = sum(1 for like in self.likes if like.is_like)
        dislikes_count = sum(1 for like in self.likes if not like.is_like)

        return {
            "id": self.id,
            "title": self.title,
            "content": self.content,
            "image_url": self.image_url,
            "created_at": self.created_at.isoformat(),
            "author_id": self.author_id,
            "author": self.author.username,
            "likes_count": likes_count,
            "dislikes_count": dislikes_count,
            "comments_count": len(self.comments)
        }

class PostLike(db.Model):
    __tablename__ = "post_likes"
    id = db.Column(db.Integer, primary_key=True)
    is_like = db.Column(db.Boolean, nullable=False)  # True for like, False for dislike
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("blog_posts.id"), nullable=False)
    
    user = db.relationship("User", back_populates="post_likes")
    post = db.relationship("BlogPost", back_populates="likes")
    
    # Ensure one user can only like/dislike a post once
    __table_args__ = (db.UniqueConstraint('user_id', 'post_id', name='unique_user_post_like'),)

class Comment(db.Model):
    __tablename__ = "comments"
    id = db.Column(db.Integer, primary_key=True)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    post_id = db.Column(db.Integer, db.ForeignKey("blog_posts.id"), nullable=False)
    
    user = db.relationship("User", back_populates="comments")
    post = db.relationship("BlogPost", back_populates="comments")
    likes = db.relationship("CommentLike", back_populates="comment", cascade="all, delete-orphan")

    def serialize(self):
        likes_count = sum(1 for like in self.likes if like.is_like)
        dislikes_count = sum(1 for like in self.likes if not like.is_like)
        
        return {
            "id": self.id,
            "content": self.content,
            "created_at": self.created_at.isoformat(),
            "user_id": self.user_id,
            "post_id": self.post_id,
            "author": self.user.username,
            "likes_count": likes_count,
            "dislikes_count": dislikes_count
        }

class CommentLike(db.Model):
    __tablename__ = "comment_likes"
    id = db.Column(db.Integer, primary_key=True)
    is_like = db.Column(db.Boolean, nullable=False)  # True for like, False for dislike
    created_at = db.Column(db.DateTime, default=db.func.current_timestamp())
    user_id = db.Column(db.Integer, db.ForeignKey("users.id"), nullable=False)
    comment_id = db.Column(db.Integer, db.ForeignKey("comments.id"), nullable=False)
    
    user = db.relationship("User", back_populates="comment_likes")
    comment = db.relationship("Comment", back_populates="likes")
    
    # Ensure one user can only like/dislike a comment once
    __table_args__ = (db.UniqueConstraint('user_id', 'comment_id', name='unique_user_comment_like'),)