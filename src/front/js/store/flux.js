const getState = ({ getStore, getActions, setStore }) => {
	return {
		store: {
			message: null,
			demo: [
				{
					title: "FIRST",
					background: "white",
					initial: "white"
				},
				{
					title: "SECOND",
					background: "white",
					initial: "white"
				}
			],
			userId: localStorage.getItem("userId") || 999,
			blogs: [],
			blogError: null,
			currentBlog: null,
			blogComments: [],
			userLikeStatus: null,
		},
		actions: {
			// Use getActions to call a function within a fuction
			exampleFunction: () => {
				getActions().changeColor(0, "green");
			},

			getMessage: async () => {
				try{
					// fetching data from the backend
					const resp = await fetch(process.env.BACKEND_URL + "/api/hello")
					const data = await resp.json()
					setStore({ message: data.message })
					// don't forget to return something, that is how the async resolves
					return data;
				}catch(error){
					console.log("Error loading message from backend", error)
				}
			},
			changeColor: (index, color) => {
				//get the store
				const store = getStore();

				//we have to loop the entire demo array to look for the respective index
				//and change its color
				const demo = store.demo.map((elm, i) => {
					if (i === index) elm.background = color;
					return elm;
				});

				//reset the global store
				setStore({ demo: demo });
			},

			// ------------------------- START: plant blog actions -------------------------
			// ------------------------- START: plant blog actions -------------------------
			// ------------------------- START: plant blog actions -------------------------
			// ------------------------- START: plant blog actions -------------------------
			fetchBlogs: async () => {
				try {
					const store = getStore();
					const resp = await fetch(process.env.BACKEND_URL + "/blog_posts");
					const data = await resp.json();
					setStore({ blogs: data, blogError: null });
					return data;
				} catch (error) {
					setStore({ blogError: "Failed to load blog posts" });
					console.error(error);
				}
			},

			handleBlogLikeToggle: async (blogId, isLike) => {
				const store = getStore();
				if (!store.userId) {
					setStore({ blogError: "Please log in to like posts" });
					return;
				}

				try {
					const resp = await fetch(`${process.env.BACKEND_URL}/blog_posts/${blogId}/like`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							userId: store.userId
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

			deleteBlog: async (blogId) => {
				try {
					const resp = await fetch(`${process.env.BACKEND_URL}/delete_blog/${blogId}`, {
						method: "DELETE",
						headers: { userId: getStore().userId }
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

			createBlogPost: async (postData) => {
				const store = getStore();
				if (!store.userId) {
					setStore({ blogError: "Please log in to create a post" });
					return false;
				}

				try {
					const resp = await fetch(process.env.BACKEND_URL + "/blog_posts", {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							userId: store.userId
						},
						body: JSON.stringify({
							...postData,
							author_id: store.userId,
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
					const resp = await fetch(`${process.env.BACKEND_URL}/blog_posts/${blogId}/edit`, {
						method: "PUT",
						headers: {
							"Content-Type": "application/json",
							userId: getStore().userId
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

			fetchBlogAndComments: async (blogId) => {
				try {
					const blogResp = await fetch(`${process.env.BACKEND_URL}/blog_posts/${blogId}`);
					const blogData = await blogResp.json();
					setStore({ currentBlog: blogData });

					const commentsResp  = await fetch(`${process.env.BACKEND_URL}/blog_posts/${blogId}/comments`);
					const commentsData = await commentsResp.json();
					setStore({ blogComments: commentsData });
				} catch (error) {
					console.error("Error fetching data", error);
				}
			},

			fetchUserLikeStatus: async (blogId) => {
				if (!getStore().userId) {
					setStore({ userLikeStatus: null });
					return;
				}
				try {
					const resp = await fetch(`${process.env.BACKEND_URL}/blog_posts/${blogId}/like_status`, {
						headers: { userId: getStore().userId }
					});
					const data = await resp.json();
					setStore({ userLikeStatus: data.status });
				} catch (error) {
					console.error("Error fetching like status:", error);
				}
			},

			submitComment: async (blogId, content) => {
				if (!getStore().userId) {
					alert("Please log in to comment");
					return false;
				}
				try {
					const resp = await fetch(`${process.env.BACKEND_URL}/blog_posts/${blogId}/comments`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							userId: getStore().userId
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
					const resp = await fetch(`${process.env.BACKEND_URL}/comments/${commentId}`, {
						method: "DELETE",
						headers: { userId: getStore().userId }
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
				if (!getStore().userId) {
					alert("Please log in to like/islike comments");
					return;
				}

				try {
					const resp = await fetch(`${process.env.BACKEND_URL}/comments/${commentId}/like`, {
						method: "POST",
						headers: {
							"Content-Type": "application/json",
							userId: getStore().userId
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
