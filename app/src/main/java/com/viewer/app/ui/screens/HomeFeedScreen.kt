package com.viewer.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
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
    var selectedTab by remember { mutableStateOf("Trending") }
    val tabs = listOf("Trending", "News", "Blogs", "Videos", "For You")

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Surface(
                            color = PrimaryRed,
                            shape = RoundedCornerShape(4.dp),
                            modifier = Modifier.size(32.dp)
                        ) {
                            Icon(
                                Icons.Default.GridView,
                                contentDescription = null,
                                tint = Color.White,
                                modifier = Modifier.padding(4.dp)
                            )
                        }
                        Spacer(modifier = Modifier.width(8.dp))
                        Text(
                            "VIEWER",
                            style = MaterialTheme.typography.titleLarge.copy(
                                fontWeight = FontWeight.Bold,
                                letterSpacing = 0.5.sp,
                                color = PrimaryRed
                            )
                        )
                    }
                },
                actions = {
                    IconButton(onClick = {}) {
                        Icon(Icons.Default.Search, contentDescription = "Search", tint = Slate500)
                    }
                    IconButton(onClick = {}) {
                        Box {
                            Icon(Icons.Default.Notifications, contentDescription = "Notifications", tint = Slate500)
                            Box(
                                modifier = Modifier
                                    .size(8.dp)
                                    .background(PrimaryRed, CircleShape)
                                    .align(Alignment.TopEnd)
                                    .offset(x = (-2).dp, y = 2.dp)
                            )
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = {
            AppBottomNavBar(navController, "home")
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
        ) {
            // Sub-nav tabs
            LazyRow(
                modifier = Modifier
                    .fillMaxWidth()
                    .background(Color.White)
                    .padding(vertical = 12.dp),
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(tabs) { tab ->
                    FilterChip(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        label = {
                            Row(verticalAlignment = Alignment.CenterVertically) {
                                Text(tab, style = MaterialTheme.typography.labelLarge)
                                if (tab == "Trending") {
                                    Icon(Icons.Default.KeyboardArrowDown, null, Modifier.size(16.dp))
                                }
                            }
                        },
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

            // Feed
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.surfaceVariant),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(SampleData.feedItems) { item ->
                    FeedCard(item, onClick = {
                        if (item.type == FeedItemType.NEWS) {
                            navController.navigate("article_detail/${item.id}")
                        }
                    })
                }
            }
        }
    }
}

@Composable
fun FeedCard(item: FeedItem, onClick: () -> Unit) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() },
        shape = RoundedCornerShape(12.dp),
        colors = CardDefaults.cardColors(containerColor = Color.White),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        when (item.type) {
            FeedItemType.NEWS -> NewsCardContent(item)
            FeedItemType.VIDEO -> VideoCardContent(item)
            FeedItemType.BLOG -> BlogCardContent(item)
            FeedItemType.PROMO -> PromoCardContent(item)
        }
    }
}

@Composable
fun NewsCardContent(item: FeedItem) {
    Column(modifier = Modifier.padding(16.dp)) {
        Row(horizontalArrangement = Arrangement.SpaceBetween, modifier = Modifier.fillMaxWidth()) {
            Column(modifier = Modifier.weight(1f)) {
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Surface(
                        color = PrimaryRed.copy(alpha = 0.1f),
                        shape = RoundedCornerShape(4.dp)
                    ) {
                        Text(
                            item.category ?: "",
                            style = MaterialTheme.typography.labelSmall,
                            color = PrimaryRed,
                            modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                        )
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(item.timestamp ?: "", style = MaterialTheme.typography.bodySmall, color = Slate400)
                }
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    item.title,
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }
            Spacer(modifier = Modifier.width(12.dp))
            AsyncImage(
                model = item.thumbnail,
                contentDescription = null,
                modifier = Modifier
                    .size(80.dp)
                    .clip(RoundedCornerShape(8.dp)),
                contentScale = ContentScale.Crop
            )
        }
        Spacer(modifier = Modifier.height(12.dp))
        HorizontalDivider(color = Color(0xFFF8FAFC))
        Spacer(modifier = Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Row(
                modifier = Modifier
                    .background(Color(0xFFF1F5F9), RoundedCornerShape(8.dp))
                    .padding(horizontal = 8.dp, vertical = 4.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(Icons.Default.ExpandLess, null, modifier = Modifier.size(20.dp), tint = Slate500)
                Text(item.votes ?: "", style = MaterialTheme.typography.labelLarge, modifier = Modifier.padding(horizontal = 4.dp))
                Icon(Icons.Default.ExpandMore, null, modifier = Modifier.size(20.dp), tint = Slate500)
            }
            Spacer(modifier = Modifier.width(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.ChatBubbleOutline, null, modifier = Modifier.size(16.dp), tint = Slate500)
                Spacer(modifier = Modifier.width(4.dp))
                Text(item.comments?.toString() ?: "0", style = MaterialTheme.typography.labelMedium, color = Slate500)
            }
            Spacer(modifier = Modifier.weight(1f))
            Icon(Icons.Default.Share, null, modifier = Modifier.size(16.dp), tint = Slate500)
        }
    }
}

@Composable
fun VideoCardContent(item: FeedItem) {
    Column {
        Box(modifier = Modifier.fillMaxWidth().aspectRatio(16/9f)) {
            AsyncImage(
                model = item.thumbnail,
                contentDescription = null,
                modifier = Modifier.fillMaxSize(),
                contentScale = ContentScale.Crop
            )
            Box(
                modifier = Modifier
                    .align(Alignment.Center)
                    .size(48.dp)
                    .background(Color.White.copy(alpha = 0.9f), CircleShape),
                contentAlignment = Alignment.Center
            ) {
                Icon(Icons.Default.PlayArrow, null, tint = PrimaryRed, modifier = Modifier.size(32.dp))
            }
            Surface(
                color = Color.Black.copy(alpha = 0.7f),
                shape = RoundedCornerShape(4.dp),
                modifier = Modifier.align(Alignment.BottomEnd).padding(8.dp)
            ) {
                Text(
                    item.videoDuration ?: "",
                    color = Color.White,
                    style = MaterialTheme.typography.labelSmall,
                    modifier = Modifier.padding(horizontal = 6.dp, vertical = 2.dp)
                )
            }
        }
        Row(modifier = Modifier.padding(16.dp)) {
            AsyncImage(
                model = item.authorImage,
                contentDescription = null,
                modifier = Modifier.size(40.dp).clip(CircleShape)
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column {
                Text(item.title, style = MaterialTheme.typography.titleMedium, maxLines = 2)
                Text(item.subtitle ?: "", style = MaterialTheme.typography.bodySmall, color = Slate500)
            }
        }
    }
}

@Composable
fun BlogCardContent(item: FeedItem) {
    Column(modifier = Modifier.padding(16.dp)) {
        Row(verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(
                model = item.authorImage,
                contentDescription = null,
                modifier = Modifier.size(24.dp).clip(CircleShape)
            )
            Spacer(modifier = Modifier.width(8.dp))
            Text(item.authorName ?: "", style = MaterialTheme.typography.labelSmall)
            Text(" • ${item.subtitle}", style = MaterialTheme.typography.bodySmall, color = Slate400)
        }
        Spacer(modifier = Modifier.height(12.dp))
        Text(item.title, style = MaterialTheme.typography.titleLarge.copy(fontSize = 18.sp))
        Spacer(modifier = Modifier.height(8.dp))
        Text(item.excerpt ?: "", style = MaterialTheme.typography.bodyMedium, color = Color.Gray, maxLines = 2)
        Spacer(modifier = Modifier.height(12.dp))
        Row(verticalAlignment = Alignment.CenterVertically) {
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.ThumbUpOffAlt, null, modifier = Modifier.size(16.dp), tint = Slate500)
                Spacer(modifier = Modifier.width(4.dp))
                Text(item.votes ?: "", style = MaterialTheme.typography.labelMedium, color = Slate500)
            }
            Spacer(modifier = Modifier.width(16.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Icon(Icons.Default.ChatBubbleOutline, null, modifier = Modifier.size(16.dp), tint = Slate500)
                Spacer(modifier = Modifier.width(4.dp))
                Text(item.comments?.toString() ?: "0", style = MaterialTheme.typography.labelMedium, color = Slate500)
            }
            Spacer(modifier = Modifier.weight(1f))
            TextButton(onClick = {}, contentPadding = PaddingValues(0.dp)) {
                Text("Read More", style = MaterialTheme.typography.labelLarge, color = PrimaryRed)
                Icon(Icons.Default.ArrowForward, null, Modifier.size(16.dp), tint = PrimaryRed)
            }
        }
    }
}

@Composable
fun PromoCardContent(item: FeedItem) {
    Column(
        modifier = Modifier.background(PrimaryRed).padding(24.dp).fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(Icons.Default.Mail, null, tint = Color.White, modifier = Modifier.size(40.dp))
        Spacer(modifier = Modifier.height(12.dp))
        Text(item.title, style = MaterialTheme.typography.titleLarge, color = Color.White)
        Text(item.subtitle ?: "", style = MaterialTheme.typography.bodySmall, color = Color.White.copy(alpha = 0.8f))
        Spacer(modifier = Modifier.height(16.dp))
        Row(modifier = Modifier.fillMaxWidth(), verticalAlignment = Alignment.CenterVertically) {
            OutlinedTextField(
                value = "",
                onValueChange = {},
                placeholder = { Text("Your email", color = Color.White.copy(alpha = 0.6f), style = MaterialTheme.typography.bodySmall) },
                modifier = Modifier.weight(1f).height(48.dp),
                shape = RoundedCornerShape(8.dp),
                colors = OutlinedTextFieldDefaults.colors(
                    unfocusedContainerColor = Color.White.copy(alpha = 0.2f),
                    focusedContainerColor = Color.White.copy(alpha = 0.2f),
                    unfocusedBorderColor = Color.White.copy(alpha = 0.3f),
                    focusedBorderColor = Color.White.copy(alpha = 0.5f)
                )
            )
            Spacer(modifier = Modifier.width(8.dp))
            Button(
                onClick = {},
                shape = RoundedCornerShape(8.dp),
                colors = ButtonDefaults.buttonColors(containerColor = Color.White, contentColor = PrimaryRed),
                modifier = Modifier.height(48.dp)
            ) {
                Text("Join", fontWeight = FontWeight.Bold)
            }
        }
    }
}
