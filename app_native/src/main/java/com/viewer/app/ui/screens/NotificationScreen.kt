package com.viewer.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Delete
import androidx.compose.material.icons.filled.MoreVert
import androidx.compose.material.icons.outlined.Checklist
import androidx.compose.material.icons.outlined.DoneAll
import androidx.compose.material.icons.outlined.MarkEmailUnread
import androidx.compose.material.icons.outlined.NotificationsActive
import androidx.compose.material.icons.outlined.NotificationsOff
import androidx.compose.material3.*
import androidx.compose.runtime.*
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
    var isRead: Boolean = false
)

// Global state for notifications
val globalNotifications = mutableStateListOf(
    NotificationItem("1", "News Tamil Reports posted a new update", "CM MK Stalin announces Rs. 1000 crore relief package...", "1h ago", "https://images.unsplash.com/photo-1533727101791-0309197c11f7?auto=format&fit=crop&q=80&w=100", "2"),
    NotificationItem("2", "Times Now uploaded a new video", "Exclusive Interview with EAM S. Jaishankar", "3h ago", "https://images.unsplash.com/photo-1585829365295-ab7cd400c167?auto=format&fit=crop&q=80&w=100", "7"),
    NotificationItem("3", "New Trending Topic: Supreme Court", "Landmark verdict on electoral bonds mandates immediate disclosure", "5h ago", "https://images.unsplash.com/photo-1589829085413-56de8ae18c73?auto=format&fit=crop&q=80&w=800", "1", isRead = true),
    NotificationItem("4", "Tech Policy India published a blog", "How ONDC is breaking the e-commerce monopoly in India", "Yesterday", "https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100", "4", isRead = true)
)

var isNotificationsEnabled by mutableStateOf(true)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationScreen(navController: NavController) {
    var expandedMenu by remember { mutableStateOf(false) }
    var isSelectionMode by remember { mutableStateOf(false) }
    val selectedIds = remember { mutableStateListOf<String>() }

    Scaffold(
        topBar = {
            if (isSelectionMode) {
                TopAppBar(
                    title = { Text("${selectedIds.size} Selected", style = MaterialTheme.typography.titleLarge) },
                    navigationIcon = {
                        IconButton(onClick = {
                            isSelectionMode = false
                            selectedIds.clear()
                        }) {
                            Icon(Icons.Default.ArrowBack, null)
                        }
                    },
                    actions = {
                        TextButton(onClick = {
                            if (selectedIds.size == globalNotifications.size) {
                                selectedIds.clear()
                            } else {
                                selectedIds.clear()
                                selectedIds.addAll(globalNotifications.map { it.id })
                            }
                        }) {
                            Text(if (selectedIds.size == globalNotifications.size) "Deselect All" else "Select All", color = PrimaryRed)
                        }
                        IconButton(onClick = {
                            globalNotifications.removeAll { it.id in selectedIds }
                            selectedIds.clear()
                            isSelectionMode = false
                        }) {
                            Icon(Icons.Default.Delete, "Delete", tint = PrimaryRed)
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        titleContentColor = MaterialTheme.colorScheme.onSurface,
                        navigationIconContentColor = MaterialTheme.colorScheme.onSurface
                    )
                )
            } else {
                TopAppBar(
                    title = { Text("Notifications", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold) },
                    navigationIcon = {
                        IconButton(onClick = { navController.popBackStack() }) {
                            Icon(Icons.Default.ArrowBack, null)
                        }
                    },
                    actions = {
                        IconButton(onClick = { expandedMenu = true }) { Icon(Icons.Default.MoreVert, null) }
                        DropdownMenu(
                            expanded = expandedMenu,
                            onDismissRequest = { expandedMenu = false },
                            modifier = Modifier
                                .background(MaterialTheme.colorScheme.surface)
                                .clip(RoundedCornerShape(12.dp))
                                .border(1.dp, Slate400.copy(alpha = 0.2f), RoundedCornerShape(12.dp))
                        ) {
                            DropdownMenuItem(
                                text = { Text("Select to Delete", fontWeight = FontWeight.Medium) },
                                leadingIcon = { Icon(Icons.Outlined.Checklist, null, tint = Slate500) },
                                onClick = {
                                    isSelectionMode = true
                                    expandedMenu = false
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("Mark all as read", fontWeight = FontWeight.Medium) },
                                leadingIcon = { Icon(Icons.Outlined.DoneAll, null, tint = Slate500) },
                                onClick = {
                                    globalNotifications.replaceAll { it.copy(isRead = true) }
                                    expandedMenu = false
                                }
                            )
                            DropdownMenuItem(
                                text = { Text("Mark all as unread", fontWeight = FontWeight.Medium) },
                                leadingIcon = { Icon(Icons.Outlined.MarkEmailUnread, null, tint = Slate500) },
                                onClick = {
                                    globalNotifications.replaceAll { it.copy(isRead = false) }
                                    expandedMenu = false
                                }
                            )
                            HorizontalDivider(modifier = Modifier.padding(horizontal = 8.dp), color = Slate400.copy(alpha = 0.2f))
                            DropdownMenuItem(
                                text = { 
                                    Text(
                                        text = if (isNotificationsEnabled) "Turn Notifications OFF" else "Turn Notifications ON", 
                                        fontWeight = FontWeight.Medium, 
                                        color = if (isNotificationsEnabled) PrimaryRed else MaterialTheme.colorScheme.onSurface 
                                    ) 
                                },
                                leadingIcon = { 
                                    if (isNotificationsEnabled) Icon(Icons.Outlined.NotificationsOff, null, tint = PrimaryRed) 
                                    else Icon(Icons.Outlined.NotificationsActive, null, tint = Slate500) 
                                },
                                onClick = {
                                    isNotificationsEnabled = !isNotificationsEnabled
                                    expandedMenu = false
                                }
                            )
                        }
                    },
                    colors = TopAppBarDefaults.topAppBarColors(
                        containerColor = MaterialTheme.colorScheme.surface,
                        titleContentColor = MaterialTheme.colorScheme.onSurface,
                        navigationIconContentColor = MaterialTheme.colorScheme.onSurface,
                        actionIconContentColor = MaterialTheme.colorScheme.onSurface
                    )
                )
            }
        }
    ) { padding ->
        if (!isNotificationsEnabled) {
            Box(
                modifier = Modifier.padding(padding).fillMaxSize().background(Color(0xFFF8FAFC)),
                contentAlignment = Alignment.Center
            ) {
                Text("Notifications are paused.", color = Slate500, style = MaterialTheme.typography.titleMedium)
            }
        } else if (globalNotifications.isEmpty()) {
            Box(
                modifier = Modifier.padding(padding).fillMaxSize().background(Color(0xFFF8FAFC)),
                contentAlignment = Alignment.Center
            ) {
                Text("You're all caught up!", color = Slate500, style = MaterialTheme.typography.titleMedium)
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .padding(padding)
                    .fillMaxSize()
                    .background(Color(0xFFF8FAFC)),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                items(globalNotifications) { notification ->
                    NotificationRow(
                        notification = notification,
                        isSelectionMode = isSelectionMode,
                        isSelected = selectedIds.contains(notification.id),
                        onClick = {
                            if (isSelectionMode) {
                                if (selectedIds.contains(notification.id)) {
                                    selectedIds.remove(notification.id)
                                } else {
                                    selectedIds.add(notification.id)
                                }
                            } else {
                                val index = globalNotifications.indexOfFirst { it.id == notification.id }
                                if (index != -1) {
                                    globalNotifications[index] = globalNotifications[index].copy(isRead = true)
                                }
                                navController.navigate("article_detail/${notification.targetId}")
                            }
                        }
                    )
                }
            }
        }
    }
}

@Composable
fun NotificationRow(
    notification: NotificationItem,
    isSelectionMode: Boolean,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    val backgroundColor = when {
        isSelected -> PrimaryRed.copy(alpha = 0.08f)
        !notification.isRead -> Color(0xFFFFF1F2)
        else -> MaterialTheme.colorScheme.surface
    }

    val borderColor = when {
        isSelected -> PrimaryRed
        !notification.isRead -> PrimaryRed.copy(alpha = 0.3f)
        else -> Slate400.copy(alpha = 0.2f)
    }

    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clip(RoundedCornerShape(16.dp))
            .clickable { onClick() },
        shape = RoundedCornerShape(16.dp),
        colors = CardDefaults.cardColors(containerColor = backgroundColor),
        border = BorderStroke(1.dp, borderColor),
        elevation = CardDefaults.cardElevation(defaultElevation = if (!notification.isRead && !isSelected) 2.dp else 0.dp)
    ) {
        Row(
            modifier = Modifier.padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            if (isSelectionMode) {
                Checkbox(
                    checked = isSelected,
                    onCheckedChange = null,
                    colors = CheckboxDefaults.colors(checkedColor = PrimaryRed)
                )
                Spacer(modifier = Modifier.width(12.dp))
            }

            AsyncImage(
                model = notification.imageUrl,
                contentDescription = null,
                modifier = Modifier
                    .size(56.dp)
                    .clip(CircleShape)
                    .border(2.dp, if (!notification.isRead) PrimaryRed else Color.Transparent, CircleShape),
                contentScale = ContentScale.Crop
            )
            
            Spacer(modifier = Modifier.width(16.dp))
            
            Column(modifier = Modifier.weight(1f)) {
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = notification.title,
                        style = MaterialTheme.typography.titleSmall,
                        fontWeight = FontWeight.Bold,
                        color = MaterialTheme.colorScheme.onSurface,
                        maxLines = 1,
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = notification.time,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (!notification.isRead) PrimaryRed else Slate400,
                        fontWeight = if (!notification.isRead) FontWeight.Bold else FontWeight.Normal
                    )
                }
                
                Spacer(modifier = Modifier.height(4.dp))
                
                Text(
                    text = notification.subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = Slate500,
                    maxLines = 2,
                    lineHeight = 20.sp
                )
            }
            
            if (!notification.isRead && !isSelectionMode) {
                Spacer(modifier = Modifier.width(12.dp))
                Box(
                    modifier = Modifier
                        .size(10.dp)
                        .background(PrimaryRed, CircleShape)
                )
            }
        }
    }
}
