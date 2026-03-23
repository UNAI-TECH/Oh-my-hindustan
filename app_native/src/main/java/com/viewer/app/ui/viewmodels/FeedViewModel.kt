package com.viewer.app.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.viewer.app.data.FeedItem
import com.viewer.app.data.FeedItemType
import com.viewer.app.data.network.ApiClient
import com.viewer.app.data.network.PostResponse
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import java.util.Date

class FeedViewModel : ViewModel() {

    private val _feedItems = MutableStateFlow<List<FeedItem>>(emptyList())
    val feedItems: StateFlow<List<FeedItem>> = _feedItems
    
    private val _selectedArticle = MutableStateFlow<FeedItem?>(null)
    val selectedArticle: StateFlow<FeedItem?> = _selectedArticle
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading
    
    init {
        fetchHomeFeed()
    }
    
    fun fetchArticle(id: String) {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                // Check local mock data first
                val localItem = com.viewer.app.data.SampleData.feedItems.find { it.id == id }
                if (localItem != null) {
                    _selectedArticle.value = localItem
                } else {
                    val response = ApiClient.appApi.getPost(id)
                    if (response.isSuccessful) {
                        response.body()?.let { post ->
                            _selectedArticle.value = post.toFeedItem()
                        }
                    } else {
                        _selectedArticle.value = null
                    }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    fun fetchHomeFeed() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = ApiClient.appApi.getHomeFeed(page = 1, limit = 20)
                if (response.isSuccessful) {
                    val posts = response.body()?.data ?: emptyList()
                    _feedItems.value = posts.map { it.toFeedItem() }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    private fun PostResponse.toFeedItem(): FeedItem {
        val calculatedVotes = if (vote_count > 1000) String.format("%.1f", vote_count / 1000.0) + "k" else vote_count.toString()
        return FeedItem(
            id = id,
            type = if (type == "video") FeedItemType.VIDEO else FeedItemType.UPDATE,
            title = title,
            subtitle = community?.name ?: "Oh My Hindustan",
            authorName = author?.username ?: "Anonymous",
            authorImage = author?.avatarUrl ?: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=800",
            thumbnail = media_url ?: "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800",
            category = community?.name ?: "General",
            timestamp = formatTimeAgo(created_at),
            votes = calculatedVotes, 
            comments = 0,
            excerpt = body?.take(150),
            content = body
        )
    }

    private fun formatTimeAgo(isoString: String): String {
        try {
            val format = SimpleDateFormat("yyyy-MM-dd'T'HH:mm:ss.SSS'Z'", Locale.getDefault())
            format.timeZone = TimeZone.getTimeZone("UTC")
            val date = format.parse(isoString) ?: return "Just now"
            
            val diff = Date().time - date.time
            val minutes = diff / (60 * 1000)
            if (minutes < 60) return "${minutes}m ago"
            
            val hours = minutes / 60
            if (hours < 24) return "${hours}h ago"
            
            val days = hours / 24
            return "${days}d ago"
        } catch (e: Exception) {
            return "Just now"
        }
    }
}
