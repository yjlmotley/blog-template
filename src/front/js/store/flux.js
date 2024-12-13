const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			message: null, // Optional: use for setting error/success messages
			// replace this userId with store.user.id
			// userId: localStorage.getItem("userId") || null,

			currentUser: JSON.parse(sessionStorage.getItem("currentUser")) || null,
			token: sessionStorage.getItem("token") || null,

			blogs: [],
			blogError: null,
			currentBlog: null,
			blogComments: [],
			userLikeStatus: null,
		},
		actions: {
			// ------------------------- START: authorization -------------------------
			// ------------------------- START: authorization -------------------------
			// ------------------------- START: authorization -------------------------
			// ------------------------- START: authorization -------------------------
			checkFieldAvailability: async (field, value) => {
				try {
					const response = await fetch(process.env.BACKEND_URL + "/api/check-availability", {
						method: "POST",
						headers: { "Content-Type": "application/json " },
						body: JSON.stringify({ field, value }),
					});
					const data = await response.json();
					return data.isAvailable;
				} catch (error) {
					console.error("Error checking field availability:", error);
					throw error;
				}
			},

			signUp: async (newUser) => {
				try {
					const response = await fetch(process.env.BACKEND_URL + "/api/signup", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							email: newUser.email.toLowerCase(),
							password: newUser.password,
							username: newUser.username.toLowerCase(),
						}),
					})
					console.log("response from signup:", response)
					const data = await response.json();
					if (!response.ok) {
						alert(data.message);
						return false
					};
					console.log(data);
					return true;
				} catch (error) {
					console.error("please try again later", error);
					throw error
				}

			},

			login: async (loginIdentifier, password) => {
				try {
					const response = await fetch(process.env.BACKEND_URL + "/api/login", {
						method: "POST",
						body: JSON.stringify({
							loginIdentifier: loginIdentifier.toLowerCase(),
							password: password
						}),
						headers: { "Content-Type": "application/json" }
					})
					const data = await response.json();
					if (response.status !== 200) {
						alert(data.message);
						return false
					};

					sessionStorage.setItem("token", data.token);
					sessionStorage.setItem("currentUser", JSON.stringify(data.userData));
					console.log("storing user data into store.currentUser after login:", data.userData);
					setStore({ currentUser: data.userData, token: data.token });
					return true;
				} catch (error) {
					console.error("please try again later", error);
					throw error;
				}
			},

			logout: () => {
				sessionStorage.removeItem("token");
				sessionStorage.removeItem("currentUser");
				setStore({ currentUser: null, token: null });
			},

			// ------------------------- START: plant blog actions -------------------------
			// ------------------------- START: plant blog actions -------------------------
			// ------------------------- START: plant blog actions -------------------------
			// ------------------------- START: plant blog actions -------------------------
			fetchBlogs: async () => {
				try {
					const resp = await fetch(process.env.BACKEND_URL + "/api/blog_posts");
					const data = await resp.json();
					setStore({ blogs: data, blogError: null });
					return data;
				} catch (error) {
					// setStore({ blogError: "Failed to load blog posts" });
					alert("Failed to load blog posts");
					console.error(error);
				}
			},
			
			createBlogPost: async (postData) => {
				const store = getStore();
				
				try {
					const resp = await fetch(process.env.BACKEND_URL + "/api/blog_posts", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
						},
						body: JSON.stringify({
							...postData,
							author_id: store.currentUser.id,
						})
					});

					if (resp.ok) {
						await getActions().fetchBlogs();
						setStore({ blogError: null });
						return true;
					} else {
						const data = await resp.json();
						setStore({ blogError: data.error || "Failed to create post " });
						return false;
					}
				} catch (error) {
					setStore({ blogError: "Failed to create post" });
					console.error(error);
					return false;
				}
			},
			
			editBlogPost: async (blogId, editedData) => {
				try {
					const resp = await fetch(`${process.env.BACKEND_URL}/api/blog_posts/${blogId}/edit`, {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							userId: getStore().currentUser.id
						},
						body: JSON.stringify(editedData)
					});
			
					const data = await resp.json();
					
					if (resp.ok) {
						await getActions().fetchBlogs();
						await getActions().fetchBlogAndComments(blogId);
						return true;
					} else {
						setStore({ blogError: data.error || "Failed to edit post" });
						return false;
					}
				} catch (error) {
					setStore({ blogError: "Failed to edit post" });
					console.error("Error editing post:", error);
					return false;
				}
			},

			deleteBlog: async (blogId) => {
				try {
					const resp = await fetch(`${process.env.BACKEND_URL}/api/delete_blog/${blogId}`, {
						method: "DELETE",
						headers: { userId: getStore().currentUser.id }
					});

					const data = await resp.json();

					if (resp.status === 200) {
						await getActions().fetchBlogs();
						return true;
					} else {
						console.error("Delete response:", data);
						return false;
					}
				} catch (error) {
					console.error("Error deleting post:", error);
					return false;
				}
			},
			
			handleBlogLikeToggle: async (blogId, isLike) => {
				const store = getStore();
				if (!store.token) {
					setStore({ blogError: "Please log in to like posts" });
					return;
				}

				try {
					const resp = await fetch(`${process.env.BACKEND_URL}/api/blog_posts/${blogId}/like`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							userId: store.currentUser.id
						},
						body: JSON.stringify({ is_like: isLike })
					});

					if (resp.ok) {
						await getActions().fetchBlogs();
						await getActions().fetchBlogAndComments(blogId);
					}
				} catch (error) {
					console.error("Error liking post:", error);
				}
			},

			fetchBlogAndComments: async (blogId) => {
				try {
					const blogResp = await fetch(`${process.env.BACKEND_URL}/api/blog_posts/${blogId}`);
					const blogData = await blogResp.json();
					setStore({ currentBlog: blogData });
					
					const commentsResp  = await fetch(`${process.env.BACKEND_URL}/api/blog_posts/${blogId}/comments`);
					const commentsData = await commentsResp.json();
					setStore({ blogComments: commentsData });
				} catch (error) {
					console.error("Error fetching data", error);
				}
			},
			
			fetchUserLikeStatus: async (blogId) => {
				if (!getStore().currentUser.id) {
					setStore({ userLikeStatus: null });
					return;
				}
				try {
					const resp = await fetch(`${process.env.BACKEND_URL}/api/blog_posts/${blogId}/like_status`, {
						headers: { userId: getStore().currentUser.id }
					});
					const data = await resp.json();
					setStore({ userLikeStatus: data.status });
				} catch (error) {
					console.error("Error fetching like status:", error);
				}
			},

			submitComment: async (blogId, content) => {
				if (!getStore().token) {
					alert("Please log in to comment");
					return false;
				}
				try {
					const resp = await fetch(`${process.env.BACKEND_URL}/api/blog_posts/${blogId}/comments`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							userId: getStore().currentUser.id
						},
						body: JSON.stringify({ content })
					});

					if (resp.ok) {
						await getActions().fetchBlogAndComments(blogId);
						return true;
					}
					return false;
				} catch (error) {
					console.error("Error posting comment:", error);
					return false;
				}
			},

			deleteComment: async (blogId, commentId) => {
				try {
					const resp = await fetch(`${process.env.BACKEND_URL}/api/comments/${commentId}`, {
						method: "DELETE",
						headers: { userId: getStore().currentUser.id }
					});
			
					if (resp.ok) {
						await getActions().fetchBlogAndComments(blogId);
						return true;
					}
					return false;
				} catch (error) {
					console.error("Error deleting comment:", error);
					return false;
				}
			},

			handleCommentLikeToggle: async (blogId, commentId, isLike) => {
				if (!getStore().token) {
					alert("Please log in to like and dislike comments");
					return;
				}

				try {
					const resp = await fetch(`${process.env.BACKEND_URL}/api/comments/${commentId}/like`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							userId: getStore().currentUser.id
						},
						body: JSON.stringify({ is_like: isLike })
					});

					if (resp.ok) {
						await getActions().fetchBlogAndComments(blogId);
					}
				} catch (error) {
					console.error("Error liking/disliking comment:", error);
				}
			},
			// ------------------------- END: plant blog actions -------------------------
			// ------------------------- END: plant blog actions -------------------------
		}
	};
};

export default getState;
