package com.viewer.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Brush
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.viewer.app.ui.components.AppBottomNavBar
import com.viewer.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreatorDashboardScreen(navController: NavController) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Creator Studio", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.Menu, null)
                    }
                },
                actions = {
                    Surface(
                        color = WarmOrange,
                        shape = CircleShape,
                        modifier = Modifier.size(32.dp).padding(end = 8.dp)
                    ) {
                        Box(contentAlignment = Alignment.Center) {
                            Text("JD", color = Color.White, style = MaterialTheme.typography.labelSmall)
                        }
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = { AppBottomNavBar(navController, "creator_dashboard") }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(CreamBg)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            // Welcome Header
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text("Welcome back, Jane", style = MaterialTheme.typography.headlineSmall)
                    Text("Here's your channel update", style = MaterialTheme.typography.bodySmall, color = Slate500)
                }
                Button(
                    onClick = { navController.navigate("content_editor") },
                    colors = ButtonDefaults.buttonColors(containerColor = Color.Transparent),
                    contentPadding = PaddingValues(0.dp),
                    modifier = Modifier.height(44.dp)
                ) {
                    Box(
                        modifier = Modifier
                            .fillMaxSize()
                            .background(Brush.horizontalGradient(listOf(WarmOrange, PrimaryRed)), RoundedCornerShape(12.dp))
                            .padding(horizontal = 16.dp),
                        contentAlignment = Alignment.Center
                    ) {
                        Row(verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.Upload, null, tint = Color.White, modifier = Modifier.size(18.dp))
                            Spacer(modifier = Modifier.width(8.dp))
                            Text("Upload", color = Color.White, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Stats Grid
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                CreatorStatCard("Subscribers", "124,502", "+12%", Modifier.weight(1f))
                CreatorStatCard("Total Views", "1.2M", "+8%", Modifier.weight(1f))
            }
            Spacer(modifier = Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                CreatorStatCard("Watch Time", "45.2K", "-2%", Modifier.weight(1f), isNegative = true)
                CreatorStatCard("Revenue", "$3,420", "+24%", Modifier.weight(1f))
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Recent Videos
            Surface(
                color = Color.White,
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9))
            ) {
                Column(modifier = Modifier.padding(16.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Recent Videos", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                        Text("See all", color = PrimaryRed, style = MaterialTheme.typography.labelLarge)
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    
                    RecentVideoRow("How to design better UI in 2024", "12,450", "342", "1.2K")
                    HorizontalDivider(color = Color(0xFFF8FAFC), modifier = Modifier.padding(vertical = 12.dp))
                    RecentVideoRow("10 Tips for Creative Growth", "45,210", "891", "4.5K")
                    HorizontalDivider(color = Color(0xFFF8FAFC), modifier = Modifier.padding(vertical = 12.dp))
                    RecentVideoRow("Monetizing your passion", "8,902", "156", "902")
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Action Cards
            CreatorActionCard(
                "Upload New Video", 
                "Share your latest masterpiece", 
                Icons.Default.VideoCall, 
                WarmOrange,
                onClick = { navController.navigate("content_editor") }
            )
            Spacer(modifier = Modifier.height(12.dp))
            CreatorActionCard(
                "Write New Blog", 
                "Engage your audience with text", 
                Icons.Default.EditNote, 
                PrimaryRed,
                onClick = { navController.navigate("content_editor") }
            )
            
            Spacer(modifier = Modifier.height(100.dp))
        }
    }
}

@Composable
fun CreatorStatCard(label: String, value: String, change: String, modifier: Modifier, isNegative: Boolean = false) {
    Surface(
        modifier = modifier,
        color = Color.White,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label, style = MaterialTheme.typography.labelMedium, color = Slate500)
            Spacer(modifier = Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.Bottom) {
                Text(value, style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.width(8.dp))
                Row(verticalAlignment = Alignment.CenterVertically) {
                    Icon(
                        if (isNegative) Icons.Default.ArrowDownward else Icons.Default.ArrowUpward,
                        null,
                        modifier = Modifier.size(12.dp),
                        tint = if (isNegative) Color.Red else Color(0xFF16A34A)
                    )
                    Text(
                        change,
                        style = MaterialTheme.typography.labelSmall,
                        color = if (isNegative) Color.Red else Color(0xFF16A34A)
                    )
                }
            }
        }
    }
}

@Composable
fun RecentVideoRow(title: String, views: String, comments: String, likes: String) {
    Row(verticalAlignment = Alignment.CenterVertically) {
        Box(
            modifier = Modifier.size(width = 80.dp, height = 48.dp).background(Color(0xFFF1F5F9), RoundedCornerShape(8.dp))
        )
        Spacer(modifier = Modifier.width(12.dp))
        Column(modifier = Modifier.weight(1f)) {
            Text(title, style = MaterialTheme.typography.labelLarge, maxLines = 1, overflow = TextOverflow.Ellipsis)
            Row {
                Text(views, style = MaterialTheme.typography.labelSmall, color = Slate500)
                Text(" • ", style = MaterialTheme.typography.labelSmall, color = Slate500)
                Text(likes, style = MaterialTheme.typography.labelSmall, color = Slate500)
            }
        }
    }
}

@Composable
fun CreatorActionCard(title: String, subtitle: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color, onClick: () -> Unit) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = Color.White,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.3f)),
        onClick = onClick
    ) {
        Row(modifier = Modifier.padding(16.dp), verticalAlignment = Alignment.CenterVertically) {
            Surface(color = color.copy(alpha = 0.1f), shape = CircleShape, modifier = Modifier.size(48.dp)) {
                Icon(icon, null, tint = color, modifier = Modifier.padding(12.dp))
            }
            Spacer(modifier = Modifier.width(16.dp))
            Column {
                Text(title, style = MaterialTheme.typography.titleSmall, fontWeight = FontWeight.Bold)
                Text(subtitle, style = MaterialTheme.typography.labelSmall, color = Slate500)
            }
        }
    }
}
