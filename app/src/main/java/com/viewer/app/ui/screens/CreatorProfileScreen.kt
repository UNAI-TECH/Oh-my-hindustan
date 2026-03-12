package com.viewer.app.ui.screens

import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.Notifications
import androidx.compose.material.icons.outlined.ThumbUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.viewer.app.data.FeedItem
import com.viewer.app.data.GlobalState
import com.viewer.app.data.SampleData
import com.viewer.app.ui.theme.CreamBg
import com.viewer.app.ui.theme.DeepCrimson
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.Slate500
import com.viewer.app.ui.theme.WarmOrange

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreatorProfileScreen(navController: NavController, authorName: String?) {
    val authorPosts = remember(authorName) {
        SampleData.feedItems.filter { it.authorName == authorName }
    }
    
    val firstItem = authorPosts.firstOrNull()

    val isFollowed = GlobalState.isFollowing(authorName ?: "")
    var showNotifMenu by remember { mutableStateOf(false) }
    var showOptionsSheet by remember { mutableStateOf(false) }
    var showSubNotifMenu by remember { mutableStateOf(false) }
    var selectedNotifType by remember { mutableStateOf("") }
    
    val sheetState = rememberModalBottomSheetState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Creator", style = MaterialTheme.typography.titleLarge) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, null)
                    }
                },
                actions = {
                    Box {
                        IconButton(onClick = { showNotifMenu = true }) { 
                            Icon(Icons.Outlined.Notifications, "Notifications") 
                        }
                        DropdownMenu(
                            expanded = showNotifMenu,
                            onDismissRequest = { showNotifMenu = false },
                            modifier = Modifier.background(Color.White)
                        ) {
                            DropdownMenuItem(
                                text = { Text("Videos") },
                                onClick = { selectedNotifType = "Videos"; showNotifMenu = false; showSubNotifMenu = true }
                            )
                            DropdownMenuItem(
                                text = { Text("News") },
                                onClick = { selectedNotifType = "News"; showNotifMenu = false; showSubNotifMenu = true }
                            )
                            DropdownMenuItem(
                                text = { Text("Blogs") },
                                onClick = { selectedNotifType = "Blogs"; showNotifMenu = false; showSubNotifMenu = true }
                            )
                        }
                    }
                    IconButton(onClick = { showOptionsSheet = true }) { 
                        Icon(Icons.Default.MoreVert, "Options") 
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
        ) {
            // Banner & Avatar
            Box(modifier = Modifier.fillMaxWidth()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(140.dp)
                        .background(Brush.linearGradient(listOf(DeepCrimson.copy(alpha = 0.8f), WarmOrange.copy(alpha = 0.8f))))
                )
                Column(
                    modifier = Modifier.align(Alignment.BottomCenter).offset(y = 48.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    AsyncImage(
                        model = firstItem?.authorImage ?: "",
                        contentDescription = null,
                        modifier = Modifier.size(96.dp).clip(CircleShape).border(4.dp, Color.White, CircleShape),
                        contentScale = ContentScale.Crop
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(authorName ?: "Unknown Creator", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                    Text("Content Creator", style = MaterialTheme.typography.bodySmall, color = Slate500)
                }
            }

            Spacer(modifier = Modifier.height(64.dp))

            // Action Buttons
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 24.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                Button(
                    onClick = { GlobalState.toggleFollow(authorName ?: "") },
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(8.dp),
                    colors = ButtonDefaults.buttonColors(
                        containerColor = if (isFollowed) MaterialTheme.colorScheme.surfaceVariant else PrimaryRed,
                        contentColor = if (isFollowed) MaterialTheme.colorScheme.onSurfaceVariant else MaterialTheme.colorScheme.onPrimary
                    )
                ) {
                    Text(if (isFollowed) "Following" else "Follow", fontWeight = FontWeight.Bold)
                }
                
                OutlinedButton(
                    onClick = {},
                    modifier = Modifier.weight(1f).height(48.dp),
                    shape = RoundedCornerShape(8.dp),
                    border = BorderStroke(1.dp, Color.LightGray)
                ) {
                    Text("Message", color = Color.DarkGray)
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Content Header
            Text(
                "Publications",
                modifier = Modifier.padding(horizontal = 24.dp),
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )

            Spacer(modifier = Modifier.height(16.dp))

            // Posts List
            Column(modifier = Modifier.padding(horizontal = 16.dp), verticalArrangement = Arrangement.spacedBy(16.dp)) {
                if (authorPosts.isEmpty()) {
                    Box(modifier = Modifier.fillMaxWidth().padding(48.dp), contentAlignment = Alignment.Center) {
                        Text("No posts yet", color = Slate500)
                    }
                } else {
                    authorPosts.forEach { item ->
                        ProfilePostCard(item, navController)
                    }
                }
            }
            
            Spacer(modifier = Modifier.height(100.dp))
        }
    }

    if (showSubNotifMenu) {
        AlertDialog(
            onDismissRequest = { showSubNotifMenu = false },
            title = { Text("Notifications for $selectedNotifType") },
            text = {
                Column {
                    listOf("All", "Most relevant", "Off").forEach { option ->
                        Row(
                            Modifier.fillMaxWidth().clickable { showSubNotifMenu = false }.padding(vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(selected = false, onClick = null)
                            Spacer(Modifier.width(8.dp))
                            Text(option)
                        }
                    }
                }
            },
            confirmButton = { TextButton(onClick = { showSubNotifMenu = false }) { Text("Close") } }
        )
    }

    if (showOptionsSheet) {
        ModalBottomSheet(
            onDismissRequest = { showOptionsSheet = false },
            sheetState = sheetState,
            containerColor = MaterialTheme.colorScheme.surface
        ) {
            Column(modifier = Modifier.padding(16.dp).padding(bottom = 32.dp)) {
                listOf("Restrict", "Block", "Report", "Share this profile", "Copy profile URL").forEach { option ->
                    Text(
                        text = option,
                        modifier = Modifier.fillMaxWidth().clickable { showOptionsSheet = false }.padding(vertical = 16.dp),
                        style = MaterialTheme.typography.bodyLarge,
                        color = if (option == "Report") Color.Red else MaterialTheme.colorScheme.onSurface
                    )
                }
                if (isFollowed) {
                    Text(
                        text = "Remove follower",
                        modifier = Modifier.fillMaxWidth().clickable { showOptionsSheet = false }.padding(vertical = 16.dp),
                        style = MaterialTheme.typography.bodyLarge,
                        color = Color.Red
                    )
                }
            }
        }
    }
}

@Composable
fun ProfilePostCard(item: FeedItem, navController: NavController) {
    var likesCount by remember { mutableStateOf(2500) }
    var isLiked by remember { mutableStateOf(false) }

    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(containerColor = MaterialTheme.colorScheme.surface),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                AsyncImage(
                    model = item.authorImage,
                    contentDescription = null,
                    modifier = Modifier.size(24.dp).clip(CircleShape)
                )
                Spacer(modifier = Modifier.width(8.dp))
                Text(item.authorName ?: "", style = MaterialTheme.typography.labelMedium)
                Text(" • in ${item.category ?: ""}", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
            }
            Spacer(modifier = Modifier.height(12.dp))
            Text(item.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                item.excerpt ?: "In an era where productivity is...",
                style = MaterialTheme.typography.bodySmall,
                color = Color.Gray,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(
                    if (isLiked) Icons.Default.ThumbUp else Icons.Outlined.ThumbUp,
                    null,
                    modifier = Modifier.size(16.dp).clickable {
                        if (isLiked) { likesCount--; isLiked = false }
                        else { likesCount++; isLiked = true }
                    },
                    tint = if (isLiked) PrimaryRed else Color.Gray
                )
                Spacer(modifier = Modifier.width(4.dp))
                Text("${(likesCount.toDouble()/1000).format(1)}k", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                Spacer(modifier = Modifier.width(16.dp))
                Icon(Icons.Default.ChatBubbleOutline, null, modifier = Modifier.size(16.dp), tint = Color.Gray)
                Spacer(modifier = Modifier.width(4.dp))
                Text("${item.comments}", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                Spacer(modifier = Modifier.weight(1f))
                Text(
                    "Read More →",
                    color = PrimaryRed,
                    style = MaterialTheme.typography.labelLarge,
                    fontWeight = FontWeight.Bold,
                    modifier = Modifier.clickable { navController.navigate("article_detail/${item.id}") }
                )
            }
        }
    }
}

private fun Double.format(digits: Int) = "%.${digits}f".format(this)
