package com.viewer.app.ui.screens

import android.content.Intent
import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.ThumbUp
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.viewer.app.data.FeedItem
import com.viewer.app.data.FeedItemType
import com.viewer.app.data.SampleData
import com.viewer.app.ui.components.AppBottomNavBar
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.Slate400
import com.viewer.app.ui.theme.Slate500

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun HomeFeedScreen(navController: NavController) {
    val context = LocalContext.current
    val shareContent: (FeedItem) -> Unit = { item ->
        val sendIntent: Intent = Intent().apply {
            action = Intent.ACTION_SEND
            putExtra(Intent.EXTRA_TEXT, "${item.title}\n\nRead more at Viewer App")
            type = "text/plain"
        }
        val shareIntent = Intent.createChooser(sendIntent, null)
        context.startActivity(shareIntent)
    }

    var selectedTab by remember { mutableStateOf("Trending") }
    val tabs = listOf("Trending", "News", "Blogs", "Videos", "For You")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            color = PrimaryRed,
                            shape = RoundedCornerShape(8.dp),
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                Icons.Default.Language,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.padding(4.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "JAN SAMVAD",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.ExtraBold,
                                letterSpacing = 1.sp,
                                color = PrimaryRed
                            )
                        )
                    }
                },
                actions = {
                    IconButton(onClick = { navController.navigate("search") }) { Icon(Icons.Default.Search, null, tint = Slate500) }
                    IconButton(onClick = { navController.navigate("notifications") }) {
                        Box {
                            Icon(Icons.Default.Notifications, null, tint = Slate500)
                            Box(modifier = Modifier.align(Alignment.TopEnd).padding(4.dp).size(8.dp).background(PrimaryRed, CircleShape).border(1.5.dp, Color.White, CircleShape))
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    actionIconContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        },
        bottomBar = { AppBottomNavBar(navController, "home") }
    ) { padding ->
        Column(modifier = Modifier.padding(padding).fillMaxSize()) {
            LazyRow(
                modifier = Modifier.fillMaxWidth().background(MaterialTheme.colorScheme.surface).padding(vertical = 12.dp),
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(tabs) { tab ->
                    FilterChip(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        label = { Text(tab, style = MaterialTheme.typography.labelLarge) },
                        shape = CircleShape,
                        colors = FilterChipDefaults.filterChipColors(
                            selectedContainerColor = PrimaryRed.copy(alpha = 0.1f),
                            selectedLabelColor = PrimaryRed,
                            containerColor = Color(0xFFF1F5F9),
                            labelColor = Slate500
                        ),
                        border = if (selectedTab == tab) FilterChipDefaults.filterChipBorder(enabled = true, selected = true, borderColor = PrimaryRed, borderWidth = 2.dp) else null
                    )
                }
            }

            LazyColumn(
                modifier = Modifier.fillMaxSize().background(MaterialTheme.colorScheme.surfaceVariant),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(SampleData.feedItems) { item ->
                    FeedCard(item, navController = navController, onShare = { shareContent(item) }, onClick = {
                        if (item.type != FeedItemType.PROMO) navController.navigate("article_detail/${item.id}")
                    })
                }
            }
        }
    }
}

@Composable
fun FeedCard(item: FeedItem, navController: NavController? = null, onShare: () -> Unit = {}, onClick: () -> Unit) {
    Card(
        modifier = Modifier.fillMaxWidth().clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface,
            contentColor = MaterialTheme.colorScheme.onSurface
        ),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        when (item.type) {
            FeedItemType.NEWS -> NewsCardContent(item, onShare, navController)
            FeedItemType.VIDEO -> VideoCardContent(item, onShare, navController)
            FeedItemType.BLOG -> BlogCardContent(item, onShare, navController)
            FeedItemType.PROMO -> PromoCardContent(item)
        }
    }
}

@Composable
fun NewsCardContent(item: FeedItem, onShare: () -> Unit = {}, navController: NavController? = null) {
    var votes by remember { mutableStateOf(item.votes?.replace("k", "")?.toDoubleOrNull() ?: 12.4) }
    var isUpvoted by remember { mutableStateOf(false) }
    var isDownvoted by remember { mutableStateOf(false) }

    Column(modifier = Modifier.padding(16.dp)) {
        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.weight(1f)) {
                Surface(color = PrimaryRed.copy(alpha = 0.1f), shape = RoundedCornerShape(4.dp)) {
                    Text(item.category ?: "News", modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), style = MaterialTheme.typography.labelSmall, color = PrimaryRed)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(item.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            }
            Spacer(modifier = Modifier.width(16.dp))
            AsyncImage(model = item.thumbnail, contentDescription = null, modifier = Modifier.size(80.dp).clip(RoundedCornerShape(8.dp)), contentScale = ContentScale.Crop)
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        Row(verticalAlignment = Alignment.CenterVertically) {
            Surface(
                color = if (isUpvoted || isDownvoted) PrimaryRed.copy(alpha = 0.1f) else Color(0xFFF1F5F9),
                shape = RoundedCornerShape(20.dp)
            ) {
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.padding(horizontal = 4.dp)) {
                    IconButton(onClick = { if (!isUpvoted) { votes += 0.1; isUpvoted = true; isDownvoted = false } else { votes -= 0.1; isUpvoted = false } }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.KeyboardArrowUp, null, tint = if (isUpvoted) PrimaryRed else Slate500)
                    }
                    Text("${String.format("%.1f", votes)}k", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
                    IconButton(onClick = { if (!isDownvoted) { votes -= 0.1; isDownvoted = true; isUpvoted = false } else { votes += 0.1; isDownvoted = false } }, modifier = Modifier.size(32.dp)) {
                        Icon(Icons.Default.KeyboardArrowDown, null, tint = if (isDownvoted) PrimaryRed else Slate500)
                    }
                }
            }
            Spacer(modifier = Modifier.width(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Outlined.ChatBubbleOutline, null, modifier = Modifier.size(16.dp), tint = Slate500)
                Spacer(modifier = Modifier.width(4.dp))
                Text("${item.comments}", style = MaterialTheme.typography.labelMedium, color = Slate500)
            }
            Spacer(modifier = Modifier.weight(1f))
            IconButton(onClick = onShare) {
                Icon(Icons.Default.Share, null, modifier = Modifier.size(18.dp), tint = Slate500)
            }
            Text("Read More", color = PrimaryRed, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, modifier = Modifier.clickable { navController?.navigate("article_detail/${item.id}") })
        }
    }
}

@Composable
fun VideoCardContent(item: FeedItem, onShare: () -> Unit = {}, navController: NavController? = null) {
    Column {
        Box(modifier = Modifier.fillMaxWidth().aspectRatio(16/9f)) {
            AsyncImage(model = item.thumbnail, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
            Box(modifier = Modifier.align(Alignment.Center).size(48.dp).background(MaterialTheme.colorScheme.surface.copy(alpha = 0.9f), CircleShape), contentAlignment = Alignment.Center) {
                Icon(Icons.Default.PlayArrow, null, tint = PrimaryRed, modifier = Modifier.size(32.dp))
            }
        }
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(model = item.authorImage, contentDescription = null, modifier = Modifier.size(40.dp).clip(CircleShape).clickable { navController?.navigate("creator_profile/${item.authorName}") })
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.weight(1f).clickable { item.authorName?.let { navController?.navigate("creator_profile/$it") } }) {
                Text(item.title, style = MaterialTheme.typography.titleMedium, maxLines = 1, overflow = TextOverflow.Ellipsis)
                Text("${item.authorName} • 456k views", style = MaterialTheme.typography.bodySmall, color = Slate500)
            }
            Text("Read More", color = PrimaryRed, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, modifier = Modifier.clickable { navController?.navigate("article_detail/${item.id}") })
        }
    }
}

@Composable
fun BlogCardContent(item: FeedItem, onShare: () -> Unit = {}, navController: NavController? = null) {
    var likesCount by remember { mutableStateOf(1200) }
    var isLiked by remember { mutableStateOf(false) }

    Column(modifier = Modifier.padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.clickable { navController?.navigate("creator_profile/${item.authorName}") }) {
            AsyncImage(model = item.authorImage, contentDescription = null, modifier = Modifier.size(24.dp).clip(CircleShape))
            Spacer(modifier = Modifier.width(8.dp))
            Text(item.authorName ?: "", style = MaterialTheme.typography.labelSmall)
            Text(" • in ${item.category ?: "Lifestyle"}", style = MaterialTheme.typography.bodySmall, color = Slate400)
        }
        Spacer(modifier = Modifier.height(12.dp))
        Text(item.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                IconButton(onClick = { if (isLiked) { likesCount--; isLiked = false } else { likesCount++; isLiked = true } }, modifier = Modifier.size(24.dp)) {
                    Icon(if (isLiked) Icons.Default.ThumbUp else Icons.Outlined.ThumbUp, null, modifier = Modifier.size(16.dp), tint = if (isLiked) PrimaryRed else Slate400)
                }
                Spacer(modifier = Modifier.width(4.dp))
                Text("${(likesCount.toDouble()/1000).format(1)}k", style = MaterialTheme.typography.labelMedium, color = Slate400)
            }
            Spacer(modifier = Modifier.weight(1f))
            Text("Read More →", style = MaterialTheme.typography.labelLarge, color = PrimaryRed, fontWeight = FontWeight.Bold, modifier = Modifier.clickable { navController?.navigate("article_detail/${item.id}") })
        }
    }
}

private fun Double.format(digits: Int) = "%.${digits}f".format(this)

@Composable
fun PromoCardContent(item: FeedItem) {
    Column(modifier = Modifier.background(PrimaryRed).padding(24.dp).fillMaxWidth(), horizontalAlignment = Alignment.CenterHorizontally) {
        Icon(Icons.Default.Mail, null, tint = Color.White, modifier = Modifier.size(40.dp))
        Spacer(modifier = Modifier.height(12.dp))
        Text(item.title, style = MaterialTheme.typography.titleLarge, color = Color.White)
        Spacer(modifier = Modifier.height(16.dp))
        Button(
            onClick = {}, 
            shape = RoundedCornerShape(8.dp), 
            colors = ButtonDefaults.buttonColors(
                containerColor = MaterialTheme.colorScheme.onPrimary, 
                contentColor = PrimaryRed
            ), 
            modifier = Modifier.height(48.dp)
        ) {
            Text("Join Newsletter", fontWeight = FontWeight.Bold)
        }
    }
}
