package com.viewer.app.ui.viewmodels

import android.app.Application
import androidx.lifecycle.AndroidViewModel
import androidx.lifecycle.viewModelScope
import com.viewer.app.data.local.SessionManager
import com.viewer.app.data.network.ApiClient
import com.viewer.app.data.network.UserProfileResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch

class AuthViewModel(application: Application) : AndroidViewModel(application) {
    private val sessionManager = SessionManager(application)
    private val api = ApiClient.authApi

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error

    private val _loginSuccess = MutableStateFlow(false)
    val loginSuccess: StateFlow<Boolean> = _loginSuccess

    private val _signupSuccess = MutableStateFlow(false)
    val signupSuccess: StateFlow<Boolean> = _signupSuccess

    fun login(email: String, password: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val response = api.login(mapOf("username" to email, "password" to password))
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) {
                        sessionManager.saveSession(
                            body.access_token, 
                            body.user.id, 
                            body.user.username, 
                            body.user.email
                        )
                        _loginSuccess.value = true
                    }
                } else {
                    _error.value = "Invalid credentials. Please try again."
                }
            } catch (e: Exception) {
                _error.value = "Network error: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun register(email: String, name: String, password: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val response = api.register(mapOf("email" to email, "username" to name, "password" to password))
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) {
                        sessionManager.saveSession(
                            body.access_token, 
                            body.user.id, 
                            body.user.username, 
                            body.user.email
                        )
                        _signupSuccess.value = true
                    }
                } else {
                    _error.value = "Registration failed. Email might be taken."
                }
            } catch (e: Exception) {
                _error.value = "Network error: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
        
    }

    private val _updateProfileSuccess = MutableStateFlow(false)
    val updateProfileSuccess: StateFlow<Boolean> = _updateProfileSuccess

    fun updateProfile(username: String, bio: String) {
        viewModelScope.launch {
            _isLoading.value = true
            _error.value = null
            try {
                val response = api.updateProfile(mapOf("username" to username, "bio" to bio))
                if (response.isSuccessful) {
                    val body = response.body()
                    if (body != null) {
                        sessionManager.saveSession(
                            "keep_existing", // Handled logically, but here we just update name
                            body.id, 
                            body.username, 
                            body.email
                        )
                    }
                    _updateProfileSuccess.value = true
                } else {
                    _error.value = "Failed to update profile."
                }
            } catch (e: Exception) {
                _error.value = "Network error: ${e.message}"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun clearState() {
        _error.value = null
        _loginSuccess.value = false
        _signupSuccess.value = false
    }

    fun logout() {
        viewModelScope.launch {
            sessionManager.clearSession()
        }
    }
}
