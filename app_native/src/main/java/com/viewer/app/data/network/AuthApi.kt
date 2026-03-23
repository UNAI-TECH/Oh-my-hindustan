package com.viewer.app.data.network

import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.GET
import retrofit2.http.POST
import retrofit2.http.PUT

interface AuthApi {
    @POST("auth/login")
    suspend fun login(@Body request: Map<String, String>): Response<AuthResponse>

    @POST("auth/register")
    suspend fun register(@Body request: Map<String, String>): Response<AuthResponse>

    @GET("auth/me")
    suspend fun getProfile(): Response<UserProfileResponse>

    @PUT("users/me")
    suspend fun updateProfile(@Body request: Map<String, String>): Response<UserProfileResponse>
}

data class AuthResponse(
    val access_token: String,
    val user: UserProfileResponse
)

data class UserProfileResponse(
    val id: String?,
    val email: String?,
    val username: String?,
    val role: String?,
    val bio: String?,
    val avatarUrl: String?,
    val phone: String?,
    val createdAt: String?
)
