import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, useLocation } from "react-router-dom";
import PropTypes from "prop-types";
import {
  loginUser,
  clearError,
  selectIsLoading,
  selectError,
} from "../../redux/slices/authSlice.js";
import Button from "../ui/Button.jsx";
import LoadingSpinner from "../ui/LoadingSpinner.jsx";
import { useLanguage } from "../../contexts/LanguageContext.jsx";

/**
 * LoginForm Component
 *
 * Provides user authentication interface for the Invoice Validation System.
 */
const LoginForm = ({ onSuccess }) => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const isLoading = useSelector(selectIsLoading);
  const error = useSelector(selectError);
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    username: "",
    password: "",
    rememberMe: true,
  });

  const [validationErrors, setValidationErrors] = useState({});

  // Get the intended destination or default to dashboard
  const from = location.state?.from?.pathname || "/";

  const handleInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));

    // Clear validation error for this field
    if (validationErrors[name]) {
      setValidationErrors((prev) => ({
        ...prev,
        [name]: "",
      }));
    }

    // Clear global error when user starts typing
    if (error) {
      dispatch(clearError());
    }
  };

  const validateForm = () => {
    const errors = {};

    if (!formData.username.trim()) {
      errors.username = "Username is required";
    }

    if (!formData.password) {
      errors.password = "Password is required";
    } 

    setValidationErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    try {
      const result = await dispatch(
        loginUser({
          username: formData.username.trim(),
          password: formData.password,
          rememberMe: formData.rememberMe,
        })
      ).unwrap();

      // Login successful
      if (onSuccess) {
        onSuccess(result);
      }

      // Navigate to intended destination
      navigate(from, { replace: true });
    } catch (error) {
      // Error is handled by Redux slice
      console.error("Login failed:", error);
    }
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <div className="bg-background shadow-lg rounded-lg p-6 border border-muted">
        <div className="flex flex-col gap-3 items-center justify-center mb-6">
          <div className="w-12 h-12 bg-blue-600 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-lg">MD</span>
          </div>
          <div className="hidden sm:block">
            <h1 className="text-lg font-semibold">MLDZ - Frontend</h1>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Username/Email Field */}
          <div>
            <label
              htmlFor="username"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              {t('auth.username')}
            </label>
            <input
              type="text"
              id="username"
              name="username"
              value={formData.username}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.username ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your username"
              disabled={isLoading}
              autoComplete="username"
            />
            {validationErrors.username && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.username}
              </p>
            )}
          </div>

          {/* Password Field */}
          <div>
            <label
              htmlFor="password"
              className="block text-sm font-medium text-muted-foreground mb-1"
            >
              {t('auth.password')}
            </label>
            <input
              type="password"
              id="password"
              name="password"
              value={formData.password}
              onChange={handleInputChange}
              className={`w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 ${
                validationErrors.password ? "border-red-500" : "border-gray-300"
              }`}
              placeholder="Enter your password"
              disabled={isLoading}
              autoComplete="current-password"
            />
            {validationErrors.password && (
              <p className="mt-1 text-sm text-red-600">
                {validationErrors.password}
              </p>
            )}
          </div>

          {/* Remember Me Checkbox */}
          {/* <div className="flex items-center">
            <input
              type="checkbox"
              id="rememberMe"
              name="rememberMe"
              checked={formData.rememberMe}
              onChange={handleInputChange}
              className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
              disabled={isLoading}
            />
            <label
              htmlFor="rememberMe"
              className="ml-2 block text-sm text-muted-foreground"
            >
              {t('auth.rememberMe')}
            </label>
          </div> */}

          {/* Global Error Message */}
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-md p-3">
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? (
              <div className="flex items-center justify-center">
                <LoadingSpinner size="sm" className="mr-2" text="" />
                Signing in...
              </div>
            ) : (
              t("auth.login")
            )}
          </Button>
        </form>
      </div>
    </div>
  );
};

LoginForm.propTypes = {
  onSuccess: PropTypes.func,
};

export default LoginForm;
