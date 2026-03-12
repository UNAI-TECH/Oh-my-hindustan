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
import androidx.compose.ui.text.style.TextAlign
import androidx.navigation.NavController
import com.viewer.app.ui.components.AppBottomNavBar
import com.viewer.app.ui.theme.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreatorDashboardScreen(navController: NavController) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Analyst Studio", fontWeight = FontWeight.Bold) },
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
            Column(modifier = Modifier.fillMaxWidth()) {
                Text("Welcome back, Kamal", style = MaterialTheme.typography.headlineSmall, fontWeight = FontWeight.Bold)
                Text("Analyst performance for the last 28 days", style = MaterialTheme.typography.bodySmall, color = Slate500)
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Main Analytics Card
            Surface(
                color = Color.White,
                shape = RoundedCornerShape(20.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9))
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Column {
                            Text("Total Briefing Reach", style = MaterialTheme.typography.labelMedium, color = Slate500)
                            Text("1,245,602", style = MaterialTheme.typography.headlineMedium, fontWeight = FontWeight.ExtraBold)
                        }
                        Surface(
                            color = Color(0xFF16A34A).copy(alpha = 0.1f),
                            shape = RoundedCornerShape(8.dp)
                        ) {
                            Text(
                                "↑ 12.5%", 
                                modifier = Modifier.padding(horizontal = 12.dp, vertical = 6.dp),
                                color = Color(0xFF16A34A),
                                style = MaterialTheme.typography.labelMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }
                    }
                    Spacer(modifier = Modifier.height(20.dp))
                    // Simple Chart Placeholder
                    Box(
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(120.dp)
                            .background(PrimaryRed.copy(alpha = 0.03f), RoundedCornerShape(12.dp)),
                        contentAlignment = Alignment.Center
                    ) {
                        Text("Analytics Visualization", color = PrimaryRed.copy(alpha = 0.3f), style = MaterialTheme.typography.labelSmall)
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Secondary Stats
            Row(horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                CreatorMiniStat("Followers", "12.4k", "+240", Modifier.weight(1f))
                CreatorMiniStat("Engagement", "4.2k hr", "+12%", Modifier.weight(1f))
            }

            Spacer(modifier = Modifier.height(32.dp))

            // Quick Actions
            Text("Quick Actions", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
            Spacer(modifier = Modifier.height(16.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                Box(modifier = Modifier.weight(1f)) {
                    CreatorSquareAction("New Briefing", Icons.Default.Campaign, WarmOrange) { navController.navigate("content_editor") }
                }
                Box(modifier = Modifier.weight(1f)) {
                    CreatorSquareAction("Policy Analysis", Icons.Default.EditNote, PrimaryRed) { navController.navigate("content_editor") }
                }
                Box(modifier = Modifier.weight(1f)) {
                    CreatorSquareAction("Political Live", Icons.Default.Podcasts, Color(0xFF9333EA)) {}
                }
            }

            Spacer(modifier = Modifier.height(32.dp))
            
            Spacer(modifier = Modifier.height(100.dp))
        }
    }
}

@Composable
fun CreatorMiniStat(label: String, value: String, change: String, modifier: Modifier) {
    Surface(
        modifier = modifier,
        color = Color.White,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label, style = MaterialTheme.typography.labelSmall, color = Slate500)
            Spacer(modifier = Modifier.height(4.dp))
            Row(verticalAlignment = Alignment.CenterVertically) {
                Text(value, style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.width(4.dp))
                Text(change, style = MaterialTheme.typography.labelSmall, color = Color(0xFF16A34A))
            }
        }
    }
}

@Composable
fun CreatorSquareAction(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, color: Color, onClick: () -> Unit) {
    Surface(
        onClick = onClick,
        color = Color.White,
        shape = RoundedCornerShape(16.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, color.copy(alpha = 0.2f))
    ) {
        Column(
            modifier = Modifier.padding(12.dp).fillMaxWidth(),
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.Center
        ) {
            Surface(
                color = color.copy(alpha = 0.1f),
                shape = CircleShape,
                modifier = Modifier.size(40.dp)
            ) {
                Icon(icon, null, tint = color, modifier = Modifier.padding(10.dp))
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(label, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold, textAlign = TextAlign.Center)
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
