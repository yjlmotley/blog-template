import React, { useState, useContext } from "react";
import { Context } from "../store/appContext";
import { useNavigate } from "react-router-dom";


export default function Signup() {
  const { actions } = useContext(Context);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const [errors, setErrors] = useState({});
  const [userData, setUserData] = useState({
    email: "",
    username: "",
    password: "",
    confirmPassword: "",
  });


  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  }

  const handleChange = (e) => {
    const { id, value } = e.target;
    setUserData(prevState => ({
      ...prevState,
      [id]: value
    }));
    // Clear error when user starts typing
    setErrors(prevErrors => ({ ...prevErrors, [id]: "" }))
  }

  const ErrorIcon = () => {
    return (
      <i className="fa-solid fa-triangle-exclamation mx-2"></i>
    );
  }

  const renderError = (error) => (
    <div className="text-danger d-flex align-items-center mt-1">
      <ErrorIcon />
      <span>{error}</span>
    </div>
  )
  const validateField = async (field, value) => {
    switch (field) {
      case 'username':
      case 'email':
        try {
          const isAvailable = await actions.checkFieldAvailability(field, value);
          if (!isAvailable) {
            setErrors(prev => ({ ...prev, [field]: `An account with this ${field} already exists. Please try again.` }));
          }
        } catch (error) {
          console.error(`Error checking ${field} availability:`, error);
        }
        break;
      case 'confirmPassword':
        if (value != userData.password) {
          setErrors(prev => ({ ...prev, confirmPassword: `Passwords do not match.` }));
        }
        break;
    }
  }

  const handleBlur = (e) => {
    const { id, value } = e.target;
    validateField(id, value);
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validate all fields before submission
    await Promise.all([
      validateField('username', userData.username),
      validateField('email', userData.email),
      validateField('confirmPassword', userData.confirmPassword),
    ]);

    // Check if there are any errors after validation
    if (Object.values(errors).some(error => error !== "")) {
      return; // Don't submit if there are errors
    }
    try {
      const success = await actions.signUp(userData);
      // console.log(success)
      if (success) {
        alert("Signup successful! Please login.");
        navigate("/login");
      }
    } catch (error) {
      console.error("Signup error:", error);
      setErrors({ general: "An unexpected error occurred. Please try again." });
    }
  }

  return (
    <div className="container mt-5 signup-div auth">
      <div className="row justify-content-center">
        <div className="col-md-6">
          <div className="card shadow">
            <div className="card-body">
              <h2 className="text-center mb-4">Sign Up</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-3">
                  <label htmlFor="email" className="form-label">Email address</label>
                  <input
                    type="email"
                    className="form-control"
                    id="email"
                    value={userData.email}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {errors.email && renderError(errors.email)}
                </div>
                <div className="mb-3">
                  <label htmlFor="username" className="form-label">Username</label>
                  <input
                    type="text"
                    className="form-control"
                    id="username"
                    value={userData.username}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    required
                  />
                  {errors.username && renderError(errors.username)}
                </div>
                <div className="mb-3">
                  <label htmlFor="password" className="form-label">Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      id="password"
                      value={userData.password}
                      onChange={handleChange}
                      required
                    />
                    <i
                      className={`position-absolute top-50 end-0 translate-middle-y me-3 text-muted fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                      style={{ cursor: "pointer", pointerEvents: "auto", zIndex: 10 }}
                      onClick={togglePasswordVisibility}
                    />
                  </div>
                </div>
                <div className="mb-3">
                  <label htmlFor="confirmPassword" className="form-label">Confirm Password</label>
                  <div className="input-group">
                    <input
                      type={showPassword ? "text" : "password"}
                      className="form-control"
                      id="confirmPassword"
                      value={userData.confirmPassword}
                      onChange={handleChange}
                      onBlur={handleBlur}
                      required
                    />
                    <i
                      className={`position-absolute top-50 end-0 translate-middle-y me-3 text-muted fa-regular ${showPassword ? "fa-eye-slash" : "fa-eye"}`}
                      style={{ cursor: "pointer", pointerEvents: "auto", zIndex: 10 }}
                      onClick={togglePasswordVisibility}
                    />
                  </div>
                  {errors.confirmPassword && renderError(errors.confirmPassword)}
                </div>
                {errors.general && <div className="alert alert-danger" role="alert">{renderError(errors.general)}</div>}
                <button type="submit" className="btn btn-dark w-100">Sign Up</button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
