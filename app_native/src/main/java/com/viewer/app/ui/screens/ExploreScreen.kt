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
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.Slate400
import com.viewer.app.ui.theme.Slate500

val CreamBg = Color(0xFFFFF9F2)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExploreScreen(navController: NavController) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedType by remember { mutableStateOf("News") }
    var selectedCategory by remember { mutableStateOf("Politics") }

    val categories = listOf("Politics", "Policy", "Economy", "Digital India", "Viksit Bharat")
    val contentTypes = listOf("News", "Blogs", "Videos", "Trending")

    // Dynamic filtering based on search, type, and category
    val filteredItems = remember(searchQuery, selectedType, selectedCategory) {
        SampleData.feedItems.filter { item ->
            val matchesSearch = searchQuery.isEmpty() || 
                               item.title.contains(searchQuery, ignoreCase = true) || 
                               (item.authorName?.contains(searchQuery, ignoreCase = true) ?: false)
            
            val matchesType = when (selectedType) {
                "News" -> item.type == FeedItemType.NEWS
                "Blogs" -> item.type == FeedItemType.BLOG
                "Videos" -> item.type == FeedItemType.VIDEO
                "Trending" -> true
                else -> true
            }
            
            val matchesCategory = item.category?.contains(selectedCategory, ignoreCase = true) ?: false
            
            matchesSearch && matchesType && (selectedType == "Trending" || matchesCategory)
        }
    }

    Scaffold(
        topBar = {
            Column(modifier = Modifier.background(MaterialTheme.colorScheme.background).padding(horizontal = 16.dp)) {
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = searchQuery,
                    onValueChange = { searchQuery = it },
                    placeholder = { Text("Search political analysts, news, or debates...", style = MaterialTheme.typography.bodyMedium) },
                    modifier = Modifier.fillMaxWidth().height(56.dp),
                    shape = RoundedCornerShape(12.dp),
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = PrimaryRed) },
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedContainerColor = Slate400.copy(alpha = 0.1f),
                        focusedContainerColor = Slate400.copy(alpha = 0.1f),
                        unfocusedBorderColor = Color.Transparent,
                        focusedBorderColor = PrimaryRed
                    ),
                    singleLine = true
                )
                
                Spacer(modifier = Modifier.height(20.dp))
                
                // Category Grid
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    CategoryIconButton("Forum", Icons.Default.Groups, selectedType == "News") { selectedType = "News" }
                    CategoryIconButton("Policy", Icons.Default.Gavel, selectedType == "Blogs") { selectedType = "Blogs" }
                    CategoryIconButton("Debates", Icons.Default.RecordVoiceOver, selectedType == "Videos") { selectedType = "Videos" }
                    CategoryIconButton("Updates", Icons.Default.WifiTethering, selectedType == "Trending") { selectedType = "Trending" }
                }
                
                Spacer(modifier = Modifier.height(20.dp))
                
                LazyRow(horizontalArrangement = Arrangement.spacedBy(8.dp)) {
                    items(categories) { category ->
                        FilterChip(
                            selected = selectedCategory == category,
                            onClick = { selectedCategory = category },
                            label = { Text(category) },
                            colors = FilterChipDefaults.filterChipColors(
                                selectedContainerColor = PrimaryRed,
                                selectedLabelColor = MaterialTheme.colorScheme.onPrimary,
                                containerColor = MaterialTheme.colorScheme.surfaceVariant,
                                labelColor = MaterialTheme.colorScheme.onSurfaceVariant
                            ),
                            border = null,
                            shape = CircleShape
                        )
                    }
                }
                Spacer(modifier = Modifier.height(16.dp))
            }
        },
        bottomBar = { com.viewer.app.ui.components.AppBottomNavBar(navController, "explore") }
    ) { padding ->
        LazyColumn(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background),
            contentPadding = PaddingValues(16.dp)
        ) {
            item { 
                SectionHeader("Top Narratives")
            }

            item {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    modifier = Modifier.padding(bottom = 24.dp)
                ) {
                    item { 
                        TrendingCard(
                            "BJP outlines vision for Viksit Bharat by 2047",
                            "POLICY",
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuACoN2DQoiSOe691QocUxZH-3L_9fZYlxuyMgSzGjDK2IpGvbB_-azsNPYHY4uxdn4UY0asiiiKrX5nUtoBykk3U9xtzsGZHuX_evX_7MrbWm1trxzICNcIfPKMGTejyLgozoYi0kBcCT_9Of7LoXhmA67nlvO9ZMnPeY_ZKrBdTYC6tugUWh25hs3AnBBznJefESaEDqY9k9uGax1eERKSfzHbO7F-0wkMY89VzJcSUw25br-siVe7G4Z3jQ4YZovGxVjAyYjPXQ3K"
                        ) {
                             // Navigate to specific item if id exists in SampleData
                        }
                    }
                    item {
                        TrendingCard(
                            "Digital India Revolution: Bridging the Rural-Urban Divide",
                            "NATIONAL",
                            "https://lh3.googleusercontent.com/aida-public/AB6AXuBNPp7D5HnjPznxYo5iXMHnH_X2PMhRGCHcfVJzAYwdcypyYKWiBziknmQ34zlmVGnZXeB_qIxg7MIO6nap_4GfsawTJB9nh1bH-Qvt_svGEZsYR1NHsiNM84_45jqH0jg19wyMZMhVatm3enN7R6SGyUN0ffgOJFbC4jemWHdEsOSlW95PQWEz4XlKMjyfMRKXqfW4CJRRrnf-EUNfinh9ezmiZ_jdBdCbXZIMI11-okK_RN22HxxnabXAaUcyJB7XRqyNdUbArGfG"
                        ) { }
                    }
                }
            }

            item { SectionHeader("Selected Feed") }

            if (selectedType == "Videos") {
                items(filteredItems.chunked(2)) { pair ->
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        pair.forEach { item ->
                            VideoCard(item, modifier = Modifier.weight(1f)) {
                                navController.navigate("article_detail/${item.id}")
                            }
                        }
                        if (pair.size == 1) Spacer(modifier = Modifier.weight(1f))
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }
            } else if (selectedType == "Blogs") {
                items(filteredItems.chunked(2)) { pair ->
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                        pair.forEach { item ->
                            BlogGridItem(item, modifier = Modifier.weight(1f)) {
                                navController.navigate("article_detail/${item.id}")
                            }
                        }
                        if (pair.size == 1) Spacer(modifier = Modifier.weight(1f))
                    }
                    Spacer(modifier = Modifier.height(12.dp))
                }
            } else {
                items(filteredItems) { item ->
                    SampleTrendingCard(item) {
                        navController.navigate("article_detail/${item.id}")
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                }
            }

            if (filteredItems.isEmpty()) {
                item {
                    Box(modifier = Modifier.fillParentMaxSize(), contentAlignment = Alignment.Center) {
                        Text("No content found for this selection", color = Slate500)
                    }
                }
            }
            
            item { Spacer(modifier = Modifier.height(80.dp)) }
        }
    }
}

@Composable
fun SectionHeader(title: String, showAll: Boolean = true) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(vertical = 16.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        if (showAll) {
            Text("View all", color = PrimaryRed, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun CategoryIconButton(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, isActive: Boolean, onClick: () -> Unit) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally, 
        modifier = Modifier.width(64.dp).clickable { onClick() }
    ) {
        Surface(
            modifier = Modifier.size(56.dp),
            shape = RoundedCornerShape(16.dp),
            color = if (isActive) PrimaryRed else PrimaryRed.copy(alpha = 0.1f),
            shadowElevation = if (isActive) 8.dp else 0.dp
        ) {
            Icon(
                icon, null, 
                modifier = Modifier.padding(14.dp),
                tint = if (isActive) MaterialTheme.colorScheme.onPrimary else PrimaryRed
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            label, 
            style = MaterialTheme.typography.labelSmall, 
            color = if (isActive) PrimaryRed else Slate400,
            fontWeight = if (isActive) FontWeight.Bold else FontWeight.Normal
        )
    }
}

@Composable
fun TrendingCard(title: String, category: String, image: String, onClick: () -> Unit) {
    Column(modifier = Modifier.width(280.dp).clickable { onClick() }) {
        AsyncImage(
            model = image,
            contentDescription = null,
            modifier = Modifier.fillMaxWidth().height(160.dp).clip(RoundedCornerShape(12.dp)),
            contentScale = ContentScale.Crop
        )
        Spacer(modifier = Modifier.height(12.dp))
        Surface(color = PrimaryRed.copy(alpha = 0.1f), shape = RoundedCornerShape(4.dp)) {
            Text(category, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), style = MaterialTheme.typography.labelSmall, color = PrimaryRed)
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 2)
    }
}

@Composable
fun SampleTrendingCard(item: FeedItem, onClick: () -> Unit) {
    Column(modifier = Modifier.fillMaxWidth().clickable { onClick() }) {
        AsyncImage(
            model = item.thumbnail,
            contentDescription = null,
            modifier = Modifier.fillMaxWidth().height(160.dp).clip(RoundedCornerShape(12.dp)),
            contentScale = ContentScale.Crop
        )
        Spacer(modifier = Modifier.height(12.dp))
        Surface(color = PrimaryRed.copy(alpha = 0.1f), shape = RoundedCornerShape(4.dp)) {
            Text(item.category ?: "", modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), style = MaterialTheme.typography.labelSmall, color = PrimaryRed)
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(item.title, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold, maxLines = 2)
    }
}

@Composable
fun VideoCard(item: FeedItem, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Box(modifier = modifier
        .aspectRatio(9/16f)
        .clip(RoundedCornerShape(12.dp))
        .clickable { onClick() }
    ) {
        AsyncImage(model = item.thumbnail, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
        Box(modifier = Modifier.matchParentSize().background(Color.Black.copy(alpha = 0.1f)))
        Icon(Icons.Default.PlayArrow, null, tint = Color.White, modifier = Modifier.size(32.dp).align(Alignment.Center))
        Row(modifier = Modifier.align(Alignment.BottomStart).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
            Text("${item.votes}", color = Color.White, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun BlogGridItem(item: FeedItem, modifier: Modifier = Modifier, onClick: () -> Unit) {
    Column(modifier = modifier.clickable { onClick() }) {
        AsyncImage(
            model = item.thumbnail,
            contentDescription = null,
            modifier = Modifier.fillMaxWidth().aspectRatio(1f).clip(RoundedCornerShape(12.dp)),
            contentScale = ContentScale.Crop
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(item.title, style = MaterialTheme.typography.labelLarge, maxLines = 2, fontWeight = FontWeight.Bold, lineHeight = 16.sp)
        Text("5 min read", style = MaterialTheme.typography.labelSmall, color = Slate400)
    }
}
