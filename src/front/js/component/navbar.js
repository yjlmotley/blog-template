import React, { useContext } from "react";
import { Context } from "../store/appContext";
import { Link, useNavigate } from "react-router-dom";


export const Navbar = () => {
	const { store, actions } = useContext(Context);
	const navigate = useNavigate();


	const handleLogout = () => {
		actions.logout();
		console.log("User has been succesfully logged out");
		navigate("/");
	}

	const isLoggedIn = !!store.token;


	return (
		<nav className="navbar navbar-light bg-light">
			<div className="container">
				<Link to="/">
					<span className="navbar-brand mb-0 h1">React Boilerplate</span>
				</Link>
				<div className="ml-auto">
					<Link to="/blog" className="btn btn-outline-dark me-2">
						<i className="fa-solid fa-book-open-reader me-1" />
						Blog
					</Link>
					{isLoggedIn ? (
						<button onClick={handleLogout} className="btn btn-outline-dark">
							<i className="fa-solid fa-user me-1" />
							Log Out
						</button>
					) : (
						<Link to="/login" className="btn btn-outline-dark">
							<i className="fa-regular fa-user me-1" />
							Login
						</Link>
					)}
				</div>
			</div>
		</nav>
	);
};
