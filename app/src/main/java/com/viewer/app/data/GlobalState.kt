package com.viewer.app.data

import androidx.compose.runtime.mutableStateMapOf

object GlobalState {
    // Map of article IDs to saved status (acting as a set)
    val savedItemIds = mutableStateMapOf<String, Boolean>()
    
    // Map of author names to follow status
    val followedCreators = mutableStateMapOf<String, Boolean>()
    
    // In-memory likes/votes (articleId -> count)
    val likesCount = mutableStateMapOf<String, Int>()
    val isLiked = mutableStateMapOf<String, Boolean>()
    
    fun isSaved(id: String) = savedItemIds[id] ?: false
    fun toggleSave(id: String) {
        val current = savedItemIds[id] ?: false
        savedItemIds[id] = !current
    }
    
    fun isFollowing(author: String) = followedCreators[author] ?: false
    fun toggleFollow(author: String) {
        followedCreators[author] = !(followedCreators[author] ?: false)
    }
}
