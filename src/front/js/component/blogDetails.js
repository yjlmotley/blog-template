import React, { useEffect, useState, useContext } from "react";
import { Context } from "../store/appContext";
import { useParams, useNavigate, Link } from "react-router-dom";
import "../../styles/blog.css";

const BlogDetails = () => {
    const { store, actions } = useContext(Context);
    const { id } = useParams();
    const [newComment, setNewComment] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [editedBlog, setEditedBlog] = useState({
        title: "",
        content: "",
        image_url: ""
    });
    const navigate = useNavigate();

    useEffect(() => {
        actions.fetchBlogAndComments(id);
        if (store.userId) {
            actions.fetchUserLikeStatus(id);
        }
    }, [id, store.userId]);

    useEffect(() => {
        if (store.currentBlog) {
            setEditedBlog({
                title: store.currentBlog.title,
                content: store.currentBlog.content,
                image_url: store.currentBlog.image_url || ""
            });
        }
    }, [store.currentBlog]);

    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        const success = await actions.submitComment(id, newComment);
        if (success) {
            setNewComment("");
        }
    };

    const handleDeleteBlog = async (currentBlogId) => {
        if (!window.confirm("Are you sure you want to delete this post?")) {
            return;
        }
        const success = await actions.deleteBlog(currentBlogId);
        if (success) {
            navigate("/plantblog");
        } else {
            alert("Failed to delete post");
        }
    }

    const handleEditSubmit = async (e) => {
        e.preventDefault();
        const success = await actions.editBlogPost(id, editedBlog);
        if (success) {
            setIsEditing(false);
        }
    };

    const handleCancelEdit = () => {
        setEditedBlog({
            title: store.currentBlog.title,
            content: store.currentBlog.content,
            image_url: store.currentBlog.image_url || ""
        });
        setIsEditing(false);
    };

    return (
        <>
            <h4 className="mt-3 ms-3">
                <Link to="/plantblog">Plant Blog</Link> /
            </h4>
            <div className="container mt-5 pb-5 blog-div">
                <div className="card blog-card mb-5">
                    {parseInt(store.userId) === store.currentBlog?.author_id && (
                        <>
                            <button
                                onClick={() => setIsEditing(!isEditing)}
                                className="edit-btn"
                            >
                                <i className={`fas ${isEditing ? 'fa-times' : 'fa-pencil-alt'}`}></i>
                            </button>
                            {!isEditing && (
                                <button
                                    onClick={() => handleDeleteBlog(store.currentBlog.id)}
                                    className="delete-btn"
                                >
                                    <i className="fas fa-trash"></i>
                                </button>
                            )}
                        </>
                    )}

                    {isEditing ? (
                        <form onSubmit={handleEditSubmit} className="card-body">
                            <div className="mb-3">
                                <label className="form-label">Image URL</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editedBlog.image_url}
                                    onChange={(e) => setEditedBlog({
                                        ...editedBlog,
                                        image_url: e.target.value
                                    })}
                                    placeholder="Enter image URL"
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Title</label>
                                <input
                                    type="text"
                                    className="form-control"
                                    value={editedBlog.title}
                                    onChange={(e) => setEditedBlog({
                                        ...editedBlog,
                                        title: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="mb-3">
                                <label className="form-label">Content</label>
                                <textarea
                                    className="form-control"
                                    rows="6"
                                    value={editedBlog.content}
                                    onChange={(e) => setEditedBlog({
                                        ...editedBlog,
                                        content: e.target.value
                                    })}
                                    required
                                />
                            </div>
                            <div className="d-flex gap-2">
                                <button type="submit" className="btn btn-success">
                                    Save Changes
                                </button>
                                <button type="button" className="btn btn-secondary" onClick={handleCancelEdit}>
                                    Cancel
                                </button>
                            </div>
                        </form>
                    ) : (
                        <>
                            {store.currentBlog?.image_url && (
                                <img
                                    src={store.currentBlog.image_url}
                                    alt={store.currentBlog.title}
                                    className="card-img-top blog-image"
                                />
                            )}
                            <div className="card-body">
                                <h1 className="card-title blog-title">{store.currentBlog?.title}</h1>
                                <p className="card-text blog-content">{store.currentBlog?.content}</p>
                                <div className="blog-meta d-flex justify-content-between align-items-center">
                                    <div>
                                        <span className="author me-3">
                                            <i className="fas fa-user me-2"></i>{store.currentBlog?.author}
                                        </span>
                                        <span className="date">
                                            <i className="fas fa-calendar-alt me-2"></i>
                                            {store.currentBlog?.created_at && new Date(store.currentBlog.created_at).toLocaleDateString()}
                                        </span>
                                    </div>
                                    <div className="blog-actions">
                                        <button
                                            onClick={() => actions.handleBlogLikeToggle(id, true)}
                                            className={`btn btn-outline-success me-2 ${store.currentBlog?.userLikeStatus === 'like' ? 'active' : ''}`}
                                            disabled={!store.userId || parseInt(store.userId) === store.currentBlog?.author_id}
                                        >
                                            <i className="fas fa-thumbs-up me-1"></i>
                                            <span>{store.currentBlog?.likes_count || 0}</span>
                                        </button>
                                        <button
                                            onClick={() => actions.handleBlogLikeToggle(id, false)}
                                            className={`btn btn-outline-danger ${store.currentBlog?.userLikeStatus === 'dislike' ? 'active' : ''}`}
                                            disabled={!store.userId || parseInt(store.userId) === store.currentBlog?.author_id}
                                        >
                                            <i className="fas fa-thumbs-down me-1"></i>
                                            <span>{store.currentBlog?.dislikes_count || 0}</span>
                                        </button>
                                    </div>
                                </div>
                            </div>
                        </>
                    )}
                </div>

                {/* Comments Section */}
                <div className="card comment-section">
                    <div className="card-body">
                        <h2 className="section-title mb-4">Comments</h2>

                        {store.userId ? (
                            <form onSubmit={handleCommentSubmit} className="mb-4">
                                <div className="form-group">
                                    <textarea
                                        value={newComment}
                                        onChange={(e) => setNewComment(e.target.value)}
                                        className="form-control comment-input"
                                        placeholder="Share your thoughts..."
                                        rows="3"
                                        required
                                    />
                                </div>
                                <button type="submit" className="btn btn-success mt-3">
                                    Post Comment
                                </button>
                            </form>
                        ) : (
                            <div className="alert alert-info">
                                Please log in to leave a comment
                            </div>
                        )}

                        <div className="comments-list">
                            {store.blogComments.map((comment) => (
                                <div key={comment.id} className="comment-card">
                                    <div className="comment-header">
                                        <div className="comment-user">
                                            <span className="username">
                                                <i className="fas fa-user-circle me-2"></i>
                                                {comment.author}
                                            </span>
                                            <span className="comment-date">
                                                {new Date(comment.created_at).toLocaleDateString()}
                                            </span>
                                        </div>
                                        <p className="comment-content">{comment.content}</p>
                                        <div className="comment-actions">
                                            <div className="like-buttons">
                                                <button
                                                    onClick={() => actions.handleCommentLikeToggle(id, comment.id, true)}
                                                    className={`btn btn-like ${comment.userLikeStatus === 'like' ? 'active' : ''}`}
                                                    disabled={!store.userId || parseInt(store.userId) === comment.user_id}
                                                >
                                                    <i className="fas fa-thumbs-up me-1"></i>
                                                    <span>{comment.likes_count}</span>
                                                </button>
                                                <button
                                                    onClick={() => actions.handleCommentLikeToggle(id, comment.id, false)}
                                                    className={`btn btn-dislike ms-2 ${comment.userLikeStatus === 'dislike' ? 'active' : ''}`}
                                                    disabled={!store.userId || parseInt(store.userId) === comment.user_id}
                                                >
                                                    <i className="fas fa-thumbs-down me-1"></i>
                                                    <span>{comment.dislikes_count}</span>
                                                </button>
                                            </div>
                                            {parseInt(store.userId) === comment.user_id && (
                                                <button
                                                    onClick={() => actions.deleteComment(id, comment.id)}
                                                    className="btn btn-delete-comment"
                                                >
                                                    <i className="fas fa-trash"></i>
                                                </button>
                                            )}
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};


export default BlogDetails;
