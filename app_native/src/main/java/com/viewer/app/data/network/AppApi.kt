package com.viewer.app.data.network

import retrofit2.Response
import retrofit2.http.GET
import retrofit2.http.Path
import retrofit2.http.Query

interface AppApi {
    @GET("posts")
    suspend fun getHomeFeed(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("userId") userId: String? = null
    ): Response<PaginatedPostsResponse>

    @GET("posts/{id}")
    suspend fun getPost(@Path("id") id: String): Response<PostResponse>

    @GET("r/{slug}/posts")
    suspend fun getCommunityPosts(
        @Path("slug") slug: String,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20,
        @Query("sort") sort: String = "hot"
    ): Response<PaginatedPostsResponse>
    
    @GET("users/me/notifications")
    suspend fun getNotifications(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<PaginatedNotificationsResponse>
}

data class PaginatedNotificationsResponse(
    val data: List<NotificationResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)

data class NotificationResponse(
    val id: String,
    val type: String,
    val payload: Map<String, String>?,
    val isRead: Boolean,
    val createdAt: String
)

data class PaginatedPostsResponse(
    val data: List<PostResponse>,
    val total: Int,
    val page: Int,
    val limit: Int
)

data class PostResponse(
    val id: String,
    val title: String,
    val body: String?,
    val type: String, // 'text', 'link', 'image', 'video'
    val media_url: String?,
    val author_id: String,
    val community_id: String,
    val vote_count: Int,
    val hot_score: Double,
    val created_at: String,
    val updated_at: String,
    val author: UserResponse?,
    val community: CommunityResponse?
)

data class UserResponse(
    val id: String,
    val username: String,
    val avatarUrl: String?
)

data class CommunityResponse(
    val id: String,
    val name: String,
    val slug: String,
    val iconUrl: String?
)
