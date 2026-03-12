package com.viewer.app.ui.screens

import androidx.compose.foundation.Canvas
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
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.Path
import androidx.compose.ui.graphics.drawscope.Stroke
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import com.viewer.app.ui.components.AppBottomNavBar
import com.viewer.app.ui.theme.CreamBg
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.Slate400
import com.viewer.app.ui.theme.Slate500

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CreatorAnalyticsScreen(navController: NavController) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Briefing Insights", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.Analytics, null, tint = PrimaryRed)
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
            // Date Selection
            Row(
                modifier = Modifier.fillMaxWidth().padding(vertical = 12.dp),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                DateChip("7d", true)
                DateChip("30d", false)
                DateChip("90d", false)
                DateChip("Custom", false, icon = Icons.Default.CalendarMonth)
            }

            Spacer(modifier = Modifier.height(16.dp))

            // Quick Stats
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                SmallStatCard("Briefing Reach", "1.2M", "+12%", Modifier.weight(1f))
                SmallStatCard("Engagement", "45.2K", "+8%", Modifier.weight(1f))
            }
            Spacer(modifier = Modifier.height(12.dp))
            Row(horizontalArrangement = Arrangement.spacedBy(12.dp)) {
                SmallStatCard("New Followers", "2,480", "-2%", Modifier.weight(1f), isNegative = true)
                SmallStatCard("Influence", "12.4K", "+15%", Modifier.weight(1f))
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Main Chart
            Surface(
                color = Color.White,
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9))
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("Reach over time", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(24.dp))
                    Box(modifier = Modifier.fillMaxWidth().height(160.dp)) {
                        Canvas(modifier = Modifier.fillMaxSize()) {
                            val path = Path().apply {
                                moveTo(0f, size.height * 0.7f)
                                cubicTo(size.width * 0.2f, size.height * 0.1f, size.width * 0.4f, size.height * 0.9f, size.width * 0.6f, size.height * 0.3f)
                                cubicTo(size.width * 0.8f, size.height * 0.1f, size.width * 0.9f, size.height * 0.8f, size.width, size.height * 0.2f)
                            }
                            drawPath(path, color = PrimaryRed, style = Stroke(width = 8f))
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                        listOf("MON", "TUE", "WED", "THU", "FRI", "SAT", "SUN").forEach { day ->
                            Text(day, style = MaterialTheme.typography.labelSmall, color = Slate400)
                        }
                    }
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Traffic Sources
            Surface(
                color = Color.White,
                shape = RoundedCornerShape(16.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9))
            ) {
                Column(modifier = Modifier.padding(20.dp)) {
                    Text("Traffic Sources", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    TrafficSourceBar("Direct", 0.42f, "42%")
                    TrafficSourceBar("Organic Search", 0.28f, "28%")
                    TrafficSourceBar("Social Media", 0.20f, "20%")
                    TrafficSourceBar("Referral", 0.10f, "10%")
                }
            }
            
            Spacer(modifier = Modifier.height(100.dp))
        }
    }
}

@Composable
fun DateChip(label: String, isSelected: Boolean, icon: androidx.compose.ui.graphics.vector.ImageVector? = null) {
    Surface(
        color = if (isSelected) PrimaryRed else PrimaryRed.copy(alpha = 0.1f),
        shape = CircleShape,
        onClick = {}
    ) {
        Row(
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(label, color = if (isSelected) Color.White else PrimaryRed, style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold)
            if (icon != null) {
                Spacer(modifier = Modifier.width(4.dp))
                Icon(icon, null, tint = if (isSelected) Color.White else PrimaryRed, modifier = Modifier.size(14.dp))
            }
        }
    }
}

@Composable
fun SmallStatCard(label: String, value: String, change: String, modifier: Modifier, isNegative: Boolean = false) {
    Surface(
        modifier = modifier,
        color = Color.White,
        shape = RoundedCornerShape(12.dp),
        border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9))
    ) {
        Column(modifier = Modifier.padding(16.dp)) {
            Text(label.uppercase(), style = MaterialTheme.typography.labelSmall, color = Slate500, letterSpacing = 0.5.sp)
            Row(verticalAlignment = Alignment.Bottom, modifier = Modifier.padding(top = 4.dp)) {
                Text(value, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
                Spacer(modifier = Modifier.width(4.dp))
                Text(
                    change, 
                    style = MaterialTheme.typography.labelSmall, 
                    color = if (isNegative) Color.Red else Color(0xFF16A34A),
                    fontWeight = FontWeight.Bold
                )
            }
        }
    }
}

@Composable
fun TrafficSourceBar(label: String, progress: Float, percent: String) {
    Column(modifier = Modifier.padding(vertical = 8.dp)) {
        Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
            Text(label, style = MaterialTheme.typography.labelMedium)
            Text(percent, style = MaterialTheme.typography.labelMedium, color = Slate500)
        }
        Spacer(modifier = Modifier.height(8.dp))
        LinearProgressIndicator(
            progress = progress,
            modifier = Modifier.fillMaxWidth().height(8.dp).clip(CircleShape),
            color = PrimaryRed,
            trackColor = PrimaryRed.copy(alpha = 0.1f)
        )
    }
}
