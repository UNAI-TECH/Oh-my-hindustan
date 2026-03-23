package com.viewer.app.ui.viewmodels

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.viewer.app.data.network.ApiClient
import com.viewer.app.data.network.NotificationResponse
import com.viewer.app.ui.screens.NotificationItem
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.text.SimpleDateFormat
import java.util.Locale
import java.util.TimeZone
import java.util.Date

class NotificationViewModel : ViewModel() {

    private val _notifications = MutableStateFlow<List<NotificationItem>>(emptyList())
    val notifications: StateFlow<List<NotificationItem>> = _notifications
    
    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading

    init {
        fetchNotifications()
    }
    
    fun fetchNotifications() {
        viewModelScope.launch {
            _isLoading.value = true
            try {
                val response = ApiClient.appApi.getNotifications()
                if (response.isSuccessful) {
                    val rawNotifs = response.body()?.data ?: emptyList()
                    _notifications.value = rawNotifs.map { it.toNotificationItem() }
                }
            } catch (e: Exception) {
                e.printStackTrace()
            } finally {
                _isLoading.value = false
            }
        }
    }
    
    private fun NotificationResponse.toNotificationItem(): NotificationItem {
        val title = payload?.get("title") ?: "New Notification"
        val subtitle = payload?.get("body") ?: "You have a new update."
        val imageUrl = payload?.get("iconUrl") ?: "https://images.unsplash.com/photo-1540910419892-4a36d2c3266c?auto=format&fit=crop&q=80&w=100"
        val targetId = payload?.get("referenceId") ?: "unknown"
        
        return NotificationItem(
            id = id,
            title = title,
            subtitle = subtitle,
            time = formatTimeAgo(createdAt),
            imageUrl = imageUrl,
            targetId = targetId,
            isRead = isRead
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
