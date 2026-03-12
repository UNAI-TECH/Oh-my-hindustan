package com.viewer.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.border
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.FavoriteBorder
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.viewer.app.ui.components.AppBottomNavBar
import com.viewer.app.ui.theme.CreamBg
import com.viewer.app.ui.theme.DeepCrimson
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.Slate400
import com.viewer.app.ui.theme.Slate500
import com.viewer.app.ui.theme.WarmOrange

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProfileScreen(navController: NavController) {
    var selectedTab by remember { mutableStateOf("My Posts") }
    val tabs = listOf("My Posts", "Liked", "History", "Subscriptions")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile", style = MaterialTheme.typography.titleLarge) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, null)
                    }
                },
                actions = {
                    IconButton(onClick = {}) { Icon(Icons.Default.Settings, null) }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = { AppBottomNavBar(navController, "profile") }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(CreamBg)
                .verticalScroll(rememberScrollState())
        ) {
            // Banner & Avatar
            Box(modifier = Modifier.fillMaxWidth()) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(160.dp)
                        .background(Brush.linearGradient(listOf(DeepCrimson, WarmOrange)))
                )
                Column(
                    modifier = Modifier.align(Alignment.BottomCenter).offset(y = 64.dp),
                    horizontalAlignment = Alignment.CenterHorizontally
                ) {
                    Box(modifier = Modifier.size(128.dp)) {
                        AsyncImage(
                            model = "https://lh3.googleusercontent.com/aida-public/AB6AXuAnyFLls1xsT1YNnA0R9LluoGoW1kDJWwj4tatOeYM9ipuMeZYFOzKKyjkMCzfIHkyhRWpKxSk4IpMbTG-Zi3Lfjxj_5EYhe-LbqL8P9NaB5M1lzKSjMYPiFKZA1V-LZHcwn8LRT4MZada8kfUCY5ecxCTotfwjr8WnfqJAgpxYpp8-KQEZcAmHNQYYodLFxxLviUDJVTi3pJmAVNM2A2i5IhFKirhMmRKyeHLV3Fm0Kqe1t6L1RhoiavyIAwY-zo5AU0KpndbZdJNY",
                            contentDescription = null,
                            modifier = Modifier.fillMaxSize().clip(CircleShape).border(4.dp, Color.White, CircleShape),
                            contentScale = ContentScale.Crop
                        )
                        Surface(
                            modifier = Modifier.align(Alignment.BottomEnd).size(32.dp),
                            shape = CircleShape,
                            color = PrimaryRed,
                            border = androidx.compose.foundation.BorderStroke(2.dp, Color.White)
                        ) {
                            Icon(Icons.Default.Edit, null, tint = Color.White, modifier = Modifier.padding(6.dp))
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text("Alex Rivera", style = MaterialTheme.typography.headlineSmall)
                    Text("12,450 Karma", style = MaterialTheme.typography.bodySmall, color = Slate500)
                }
            }

            Spacer(modifier = Modifier.height(80.dp))

            // Stats
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                ProfileStatCard("142", "Posts", Modifier.weight(1f))
                ProfileStatCard("892", "Saved", Modifier.weight(1f))
                ProfileStatCard("560", "Following", Modifier.weight(1f))
                ProfileStatCard("2.1k", "Followers", Modifier.weight(1f))
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Sticky Tabs (not really sticky here for simplicity, part of scroll)
            ScrollableTabRow(
                selectedTabIndex = tabs.indexOf(selectedTab),
                containerColor = CreamBg.copy(alpha = 0.9f),
                contentColor = PrimaryRed,
                edgePadding = 16.dp,
                divider = {},
                indicator = { tabPositions ->
                    TabRowDefaults.Indicator(
                        modifier = Modifier.tabIndicatorOffset(tabPositions[tabs.indexOf(selectedTab)]),
                        color = PrimaryRed
                    )
                }
            ) {
                tabs.forEach { tab ->
                    Tab(
                        selected = selectedTab == tab,
                        onClick = { selectedTab = tab },
                        text = {
                            Text(
                                tab, 
                                style = MaterialTheme.typography.titleSmall,
                                color = if (selectedTab == tab) PrimaryRed else Slate500
                            )
                        }
                    )
                }
            }

            // Posts List
            Column(modifier = Modifier.padding(16.dp), verticalArrangement = Arrangement.spacedBy(12.dp)) {
                ProfilePostCard(
                    "Exploring the Hidden Trails of the Pacific Northwest",
                    "1.2k", "45", "2d ago",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCyTrftgKi211FvLRLkEv3gTOv-RLWQpDvYtfhnH6q4gngGJAki3HP7QO-g27xM-iA8J-O8ZoKmCO3nlA_R_wTrrkiwpLlP1cojtTHKFHRO-h0UjcJvOstp4x8TxG3Ri8VajCyfSiKISb9RqvTg2mq0FbTqYUGqYganNxEfm2Kc-QPxvo03zzbliM5ASTp4yn-8bkrCl1kuPvEiJ4uzuoD3pdiaVf4qxZmHdnMy_V7Cs1fdRiZCXQUTp6y0cZyW9XcimRHjcURbocNt"
                )
                ProfilePostCard(
                    "Modern Minimalism: Why less is always more in 2024",
                    "856", "12", "5d ago",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDWZuDSoyrj6PAdLqkRi5kNrmIgO5rYvEDsxdVD1NtIw1wsHDp-RgUpvFUdpv767OFJhIuNL2-Or2yFvvchE03plVfSoz--UiPz9pAltYtbdHplvX-epCiNxNno98oYNj6pbkwJZU0ahsiDKJF5UdKIqL8xhxbNZf7YhGB9TNIMxRYmDFlbuYUhnfUWkrMHKTqubgPc_rLnbBcRteL0aRofkC_NF5wGgbyFizZGPClyodfpQbo6yawu4juNq39u3KfI5vKaNOTArynM"
                )
                ProfilePostCard(
                    "How to build a consistent morning routine for productivity",
                    "3.4k", "128", "1w ago",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuCgs_8J7qeK9Z-s244WGdmKhYXyncN1Ma1_kQR9Y5UbY9pO0pqL2M7Nwy_WVp-O0bn_cuyevgguqFOYOnzQhH_rQYXLG2qs0oDlne5RDw6gN3xVAIykt2Wm9XI0tXYd9fJxfClChVRp29d4rTXqCPVqz_Yri_Uv9u5rfFcYAAykDsYiXM-0lvYwj2fma9WePxayOUBJ7yCP6CvyNYqUjs--o1sYNZ4J-4mQXfZptw1mQ55s5cbATKEeERH2kdSCXeE3XXkN4ugg5Uzb"
                )
            }
            
            Spacer(modifier = Modifier.height(100.dp))
        }
    }
}

@Composable
fun ProfileStatCard(value: String, label: String, modifier: Modifier) {
    Surface(
        modifier = modifier,
        color = Color.White.copy(alpha = 0.5f),
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFE2E8F0))
    ) {
        Column(
            modifier = Modifier.padding(12.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(value, style = MaterialTheme.typography.titleLarge)
            Text(label.uppercase(), style = MaterialTheme.typography.labelSmall, color = Slate400, fontSize = 9.sp)
        }
    }
}

@Composable
fun ProfilePostCard(title: String, likes: String, comments: String, date: String, img: String) {
    Surface(
        color = Color.White,
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9)),
        shadowElevation = 1.dp
    ) {
        Row(modifier = Modifier.padding(12.dp), verticalAlignment = Alignment.CenterVertically) {
            AsyncImage(
                model = img,
                contentDescription = null,
                modifier = Modifier.size(80.dp).clip(RoundedCornerShape(8.dp)),
                contentScale = ContentScale.Crop
            )
            Spacer(modifier = Modifier.width(12.dp))
            Column(modifier = Modifier.height(80.dp), verticalArrangement = Arrangement.SpaceBetween) {
                Text(title, style = MaterialTheme.typography.titleSmall, maxLines = 2, fontWeight = FontWeight.Bold)
                Row(verticalAlignment = Alignment.CenterVertically, modifier = Modifier.fillMaxWidth()) {
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.FavoriteBorder, null, modifier = Modifier.size(14.dp), tint = Slate400)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(likes, style = MaterialTheme.typography.labelSmall, color = Slate400)
                    }
                    Spacer(modifier = Modifier.width(12.dp))
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.ChatBubbleOutline, null, modifier = Modifier.size(14.dp), tint = Slate400)
                        Spacer(modifier = Modifier.width(4.dp))
                        Text(comments, style = MaterialTheme.typography.labelSmall, color = Slate400)
                    }
                    Spacer(modifier = Modifier.weight(1f))
                    Text(date, style = MaterialTheme.typography.labelSmall, color = Slate400)
                }
            }
        }
    }
}
