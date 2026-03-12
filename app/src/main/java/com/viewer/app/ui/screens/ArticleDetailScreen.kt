package com.viewer.app.ui.screens

import android.content.Intent
import androidx.compose.foundation.BorderStroke
import androidx.compose.foundation.background
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
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.viewer.app.data.FeedItem
import com.viewer.app.data.FeedItemType
import com.viewer.app.data.GlobalState
import com.viewer.app.data.SampleData
import com.viewer.app.ui.theme.CreamBg
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.Slate500

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArticleDetailScreen(navController: NavController, articleId: String?) {
    val item = remember(articleId) {
        SampleData.feedItems.find { it.id == articleId }
    }

    if (item == null) {
        Box(modifier = Modifier.fillMaxSize(), contentAlignment = Alignment.Center) {
            Text("Content not found")
        }
        return
    }

    var votes by remember { mutableStateOf(item.votes?.replace("k", "")?.toDoubleOrNull() ?: 12.4) }
    var isUpvoted by remember { mutableStateOf(false) }
    var isDownvoted by remember { mutableStateOf(false) }
    var showComments by remember { mutableStateOf(false) }
    
    val sheetState = rememberModalBottomSheetState()
    val scope = rememberCoroutineScope()
    val context = LocalContext.current
    
    val isFollowed = GlobalState.isFollowing(item.authorName ?: "")
    val isSaved = GlobalState.isSaved(item.id)

    val shareContent = {
        val sendIntent: Intent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, "${item.title}\n\nRead more at Viewer App")
            type = "text/plain"
        }
        val shareIntent = Intent.createChooser(sendIntent, null)
        context.startActivity(shareIntent)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = shareContent) { Icon(Icons.Outlined.Share, null) }
                    IconButton(onClick = { GlobalState.toggleSave(item.id) }) { 
                        Icon(if (isSaved) Icons.Default.Bookmark else Icons.Outlined.BookmarkBorder, null, tint = if (isSaved) PrimaryRed else Color.Black) 
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = CreamBg)
            )
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding).fillMaxSize().background(CreamBg)) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(bottom = 100.dp)
            ) {
                // Header Content
                Column(modifier = Modifier.padding(16.dp)) {
                    Surface(
                        color = PrimaryRed.copy(alpha = 0.2f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            item.category ?: item.type.name,
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                            style = MaterialTheme.typography.labelLarge,
                            color = PrimaryRed
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = item.title,
                        style = MaterialTheme.typography.headlineLarge,
                        lineHeight = 40.sp
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Author Row
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier.clickable { 
                            navController.navigate("creator_profile/${item.authorName ?: "Elena Rostova"}") 
                        }
                    ) {
                        AsyncImage(
                            model = item.authorImage ?: "https://lh3.googleusercontent.com/aida-public/AB6AXuBpygkaztYdAvrMVY7-WMcElyKx3mFHF7Fwe4KxQ-8wvNhJP70J52TyQuYr3bRV8rY5jaEUmBwXe0l87K4RJ8Z1GRnaHFOB-W15CTReHYfq8WFnUzzz5KzlBU7grUoLkzLlYx0XucoeUKY0n1t_4Yfz-PWardBhVJL34Ncjp9OM7LN59ep6RASY3DAe3kVDr2nV-mDwUHPTXOnbaXyzJ4VqrW-1IKiLsnFlrlI5hYoOUGzAqKBYmQ3Xgn99MBu99paMRWxpdX3-L3A",
                            contentDescription = null,
                            modifier = Modifier.size(40.dp).clip(CircleShape),
                            contentScale = ContentScale.Crop
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column {
                            Text(item.authorName ?: "Elena Rostova", style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                            Text(item.subtitle ?: "2h ago", style = MaterialTheme.typography.labelSmall, color = Color.Gray)
                        }
                        
                        Spacer(modifier = Modifier.weight(1f))
                        
                        Button(
                            onClick = { GlobalState.toggleFollow(item.authorName ?: "") },
                            colors = ButtonDefaults.buttonColors(
                                containerColor = if (isFollowed) Color.White else Color.Transparent,
                                contentColor = PrimaryRed
                            ),
                            border = BorderStroke(1.dp, PrimaryRed),
                            shape = RoundedCornerShape(20.dp),
                            contentPadding = PaddingValues(horizontal = 20.dp, vertical = 0.dp),
                            modifier = Modifier.height(32.dp)
                        ) {
                            Text(if (isFollowed) "Following" else "Follow", style = MaterialTheme.typography.labelLarge)
                        }
                    }
                }

                Box(modifier = Modifier.fillMaxWidth()) {
                    AsyncImage(
                        model = item.thumbnail ?: "",
                        contentDescription = null,
                        modifier = Modifier
                            .fillMaxWidth()
                            .aspectRatio(16/9f)
                            .clip(RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)),
                        contentScale = ContentScale.Crop
                    )
                    
                    if (item.type == FeedItemType.VIDEO) {
                        Surface(
                            modifier = Modifier.align(Alignment.Center).size(64.dp),
                            shape = CircleShape,
                            color = Color.White.copy(alpha = 0.9f)
                        ) {
                            Icon(
                                Icons.Default.PlayArrow,
                                contentDescription = "Play",
                                tint = PrimaryRed,
                                modifier = Modifier.padding(12.dp).size(40.dp)
                            )
                        }
                    }
                }

                Column(modifier = Modifier.padding(24.dp)) {
                    Text(
                        text = item.excerpt ?: "As urban populations continue to surge...",
                        style = MaterialTheme.typography.bodyLarge,
                        lineHeight = 28.sp
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        text = "Architects and urban planners are now looking toward \"living buildings\"...",
                        style = MaterialTheme.typography.bodyLarge,
                        lineHeight = 28.sp
                    )
                }
            }

            // Voting Bar
            Surface(
                color = Color.White,
                shape = RoundedCornerShape(30.dp),
                shadowElevation = 4.dp,
                modifier = Modifier.align(Alignment.BottomCenter).padding(bottom = 24.dp)
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 4.dp)
                ) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        modifier = Modifier
                            .background(if (isUpvoted || isDownvoted) PrimaryRed.copy(alpha = 0.1f) else Color(0xFFF1F5F9), RoundedCornerShape(24.dp))
                            .padding(horizontal = 8.dp, vertical = 4.dp)
                    ) {
                        IconButton(onClick = { if (!isUpvoted) { votes += 0.1; isUpvoted = true; isDownvoted = false } else { votes -= 0.1; isUpvoted = false } }) {
                            Icon(Icons.Default.KeyboardArrowUp, null, tint = if (isUpvoted) PrimaryRed else Color.Black)
                        }
                        Text("${String.format("%.1f", votes)}k", style = MaterialTheme.typography.titleSmall)
                        IconButton(onClick = { if (!isDownvoted) { votes -= 0.1; isDownvoted = true; isUpvoted = false } else { votes += 0.1; isDownvoted = false } }) {
                            Icon(Icons.Default.KeyboardArrowDown, null, tint = if (isDownvoted) PrimaryRed else Color.Black)
                        }
                    }
                    
                    VerticalDivider(modifier = Modifier.height(24.dp).padding(horizontal = 12.dp))
                    
                    Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { showComments = true }) {
                        Icon(Icons.Outlined.ChatBubbleOutline, null, modifier = Modifier.size(20.dp), tint = Color.Gray)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("${item.comments}", style = MaterialTheme.typography.titleSmall, color = Color.Gray)
                    }

                    VerticalDivider(modifier = Modifier.height(24.dp).padding(horizontal = 12.dp))
                    
                    Surface(color = PrimaryRed, shape = CircleShape, modifier = Modifier.size(44.dp), onClick = shareContent) {
                        Icon(Icons.Default.Share, null, modifier = Modifier.padding(12.dp), tint = Color.White)
                    }
                }
            }
        }
    }

    if (showComments) {
        ModalBottomSheet(onDismissRequest = { showComments = false }, sheetState = sheetState, containerColor = Color.White) {
            CommentSheetContent(item)
        }
    }
}

@Composable
fun CommentSheetContent(item: FeedItem) {
    Column(modifier = Modifier.fillMaxHeight(0.8f).padding(16.dp)) {
        Text("Comments (${item.comments})", style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        
        LazyColumn(modifier = Modifier.weight(1f)) {
            items(5) { index ->
                Row(modifier = Modifier.padding(vertical = 12.dp)) {
                    Surface(modifier = Modifier.size(32.dp), shape = CircleShape, color = Color.LightGray) {}
                    Spacer(modifier = Modifier.width(12.dp))
                    Column {
                        Text("User $index", style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
                        Text("This is a great article! Very insightful.", style = MaterialTheme.typography.bodyMedium)
                    }
                }
                HorizontalDivider(color = Color(0xFFF1F5F9))
            }
        }
        
        OutlinedTextField(
            value = "", onValueChange = {}, placeholder = { Text("Add a comment...") },
            modifier = Modifier.fillMaxWidth().padding(bottom = 16.dp),
            shape = RoundedCornerShape(24.dp),
            trailingIcon = { IconButton(onClick = {}) { Icon(Icons.Default.Send, null, tint = PrimaryRed) } }
        )
    }
}
