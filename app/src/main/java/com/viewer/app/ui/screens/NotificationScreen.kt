package com.viewer.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.Slate400
import com.viewer.app.ui.theme.Slate500

data class NotificationItem(
    val id: String,
    val title: String,
    val subtitle: String,
    val time: String,
    val imageUrl: String,
    val targetId: String,
    val isRead: Boolean = false
)

val mockNotifications = listOf(
    NotificationItem("1", "Elena Rostova posted a new blog", "The Art of Slow Living in a Fast-Paced World", "2h ago", "https://lh3.googleusercontent.com/aida-public/AB6AXuBpygkaztYdAvrMVY7-WMcElyKx3mFHF7Fwe4KxQ-8wvNhJP70J52TyQuYr3bRV8rY5jaEUmBwXe0l87K4RJ8Z1GRnaHFOB-W15CTReHYfq8WFnUzzz5KzlBU7grUoLkzLlYx0XucoeUKY0n1t_4Yfz-PWardBhYVJL34Ncjp9OM7LN59ep6RASY3DAe3kVDr2nV-mDwUHPTXOnbaXyzJ4VqrW-1IKiLsnFlrlI5hYoOUGzAqKBYmQ3Xgn99MBu99paMRWxpdX3-L3A", "6"),
    NotificationItem("2", "Alex Rivera uploaded a new video", "Mastering Compose Animations: A Complete Guide", "5h ago", "https://lh3.googleusercontent.com/aida-public/AB6AXuAnyFLls1xsT1YNnA0R9LluoGoW1kDJWwj4tatOeYM9ipuMeZYFOzKKyjkMCzfIHkyhRWpKxSk4IpMbTG-Zi3Lfjxj_5EYhe-LbqL8P9NaB5M1lzKSjMYPiFKZA1V-LZHcwn8LRT4MZada8kfUCY5ecxCTotfwjr8WnfqJAgpxYpp8-KQEZcAmHNQYYodLFxxLviUDJVTi3pJmAVNM2A2i5IhFKirhMmRKyeHLV3Fm0Kqe1t6L1RhoiavyIAwY-zo5AU0KpndbZdJNY", "7"),
    NotificationItem("3", "New Trending Topic: Space Exploration", "SpaceX successfully lands Starship prototype", "Yesterday", "https://lh3.googleusercontent.com/aida-public/AB6AXuDlHq1L9kII1dYdkFlamkDmCfbxs6Hq8tL49jnqGHcVd-bQnIGJqqw97OAgiyjQ_Y4kaud4pC6XBA1ocxHDFFWnBtF2RaM9486tXAwO4hObiuljisXcwJKEhG_ytlrXyRUrf0Mry0L1_M3QmtravL5c_SUOiFSPNszGEroTjR_Xsue9lcUVo4Lbu_7_SpR_OjKTbArPoMYH1XiFfu935cnNLXG0Xeng9OHW0hyD024CTAGKeWaa5H0W5a-Il1iEzlSVNs1FsDNdTuqr", "8")
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationScreen(navController: NavController) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notifications", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, null)
                    }
                },
                actions = {
                    IconButton(onClick = {}) { Icon(Icons.Default.MoreVert, null) }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(Color(0xFFF8FAFC)),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(1.dp)
        ) {
            items(mockNotifications) { notification ->
                NotificationRow(notification) {
                    navController.navigate("article_detail/${notification.targetId}")
                }
                HorizontalDivider(color = Color(0xFFF1F5F9))
            }
        }
    }
}

@Composable
fun NotificationRow(notification: NotificationItem, onClick: () -> Unit) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .background(if (notification.isRead) Color.White else PrimaryRed.copy(alpha = 0.03f))
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        AsyncImage(
            model = notification.imageUrl,
            contentDescription = null,
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape),
            contentScale = ContentScale.Crop
        )
        Spacer(modifier = Modifier.width(16.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(notification.title, style = MaterialTheme.typography.bodyLarge, fontWeight = FontWeight.Bold)
            Text(notification.subtitle, style = MaterialTheme.typography.bodyMedium, color = Slate500, maxLines = 1)
            Text(notification.time, style = MaterialTheme.typography.labelSmall, color = Slate400, modifier = Modifier.padding(top = 4.dp))
        }
        if (!notification.isRead) {
            Box(
                modifier = Modifier
                    .size(8.dp)
                    .background(PrimaryRed, CircleShape)
            )
        }
    }
}
