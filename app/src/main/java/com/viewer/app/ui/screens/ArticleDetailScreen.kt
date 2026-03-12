package com.viewer.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material.icons.outlined.BookmarkBorder
import androidx.compose.material.icons.outlined.ChatBubbleOutline
import androidx.compose.material.icons.outlined.IosShare
import androidx.compose.material.icons.outlined.Share
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
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
import com.viewer.app.ui.theme.CreamBg
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.Slate500

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ArticleDetailScreen(navController: NavController, articleId: String?) {
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
                    IconButton(onClick = {}) { Icon(Icons.Outlined.Share, null) }
                    IconButton(onClick = {}) { Icon(Icons.Outlined.BookmarkBorder, null) }
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
                    .padding(bottom = 100.dp) // Space for floating bar
            ) {
                // Header Content
                Column(modifier = Modifier.padding(16.dp)) {
                    Surface(
                        color = PrimaryRed.copy(alpha = 0.2f),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text(
                            "NEWS",
                            modifier = Modifier.padding(horizontal = 16.dp, vertical = 6.dp),
                            style = MaterialTheme.typography.labelLarge,
                            color = PrimaryRed
                        )
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    Text(
                        text = "The Future of Sustainable Urban Development in Modern Metropolises",
                        style = MaterialTheme.typography.headlineLarge,
                        lineHeight = 40.sp
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Author Row
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        AsyncImage(
                            model = "https://lh3.googleusercontent.com/aida-public/AB6AXuBpygkaztYdAvrMVY7-WMcElyKx3mFHF7Fwe4KxQ-8wvNhJP70J52TyQuYr3bRV8rY5jaEUmBwXe0l87K4RJ8Z1GRnaHFOB-W15CTReHYfq8WFnUzzz5KzlBU7grUoLkzLlYx0XucoeUKY0n1t_4Yfz-PWardBhYVJL34Ncjp9OM7LN59ep6RASY3DAe3kVDr2nV-mDwUHPTXOnbaXyzJ4VqrW-1IKiLsnFlrlI5hYoOUGzAqKBYmQ3Xgn99MBu99paMRWxpdX3-L3A",
                            contentDescription = null,
                            modifier = Modifier.size(48.dp).clip(CircleShape)
                        )
                        Spacer(modifier = Modifier.width(12.dp))
                        Column(modifier = Modifier.weight(1f)) {
                            Text("Elena Rostova", style = MaterialTheme.typography.titleMedium)
                            Text("Published 2 hours ago • 8 min read", style = MaterialTheme.typography.bodySmall, color = Slate500)
                        }
                        OutlinedButton(
                            onClick = {},
                            border = androidx.compose.foundation.BorderStroke(2.dp, PrimaryRed),
                            colors = ButtonDefaults.outlinedButtonColors(contentColor = PrimaryRed),
                            contentPadding = PaddingValues(horizontal = 16.dp, vertical = 0.dp),
                            modifier = Modifier.height(36.dp)
                        ) {
                            Text("Follow", fontWeight = FontWeight.Bold)
                        }
                    }
                }

                // Hero Image
                AsyncImage(
                    model = "https://lh3.googleusercontent.com/aida-public/AB6AXuBgaqSDaWuzx0Rp-8jAW1no8i17pufG1e_SJT-mqp-u1j-Gpd1xDvzjC0UtzJku05ja767Ocp_WfA3een37W3F-QeL9G7FvIcLHHVYwp_HU3XrNto2hiIBkAinMFH7qdO8PCTwGGekOANpc_GFfbjInUpVmweqQ-j7hIZM1AtCcS9nBIfCJeo98X8tDuZfTGRWz7m2NJZWCddf0iACzCv005gBXIb_HP-ZvNMZZJI7cpC0zM-Qc8OLYlK7cQDriT2mtjAEvhxDf9fTj",
                    contentDescription = null,
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(16/9f)
                        .clip(RoundedCornerShape(bottomStart = 24.dp, bottomEnd = 24.dp)),
                    contentScale = ContentScale.Crop
                )

                // Article Body
                Column(modifier = Modifier.padding(24.dp)) {
                    Text(
                        text = "As urban populations continue to surge, the architectural landscape of our cities is undergoing a radical transformation. Beyond the glass and steel of yesterday, a new paradigm is emerging—one that prioritizes biological integration and sustainable infrastructure.",
                        style = MaterialTheme.typography.bodyLarge,
                        lineHeight = 28.sp
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        text = "Architects and urban planners are now looking toward \"living buildings\" that can process their own waste and generate energy. This shift isn't just aesthetic; it's a necessary evolution in response to the climate challenges of the 21st century.",
                        style = MaterialTheme.typography.bodyLarge,
                        lineHeight = 28.sp
                    )
                    Spacer(modifier = Modifier.height(24.dp))
                    
                    // Quote
                    Surface(
                        color = PrimaryRed.copy(alpha = 0.05f),
                        shape = RoundedCornerShape(topEnd = 8.dp, bottomEnd = 8.dp),
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Row(modifier = Modifier.height(IntrinsicSize.Min)) {
                            Box(modifier = Modifier.width(4.dp).fillMaxHeight().background(PrimaryRed))
                            Text(
                                "\"The city of tomorrow is not a machine for living, but an ecosystem for thriving.\"",
                                modifier = Modifier.padding(24.dp),
                                style = MaterialTheme.typography.titleLarge.copy(
                                    fontStyle = androidx.compose.ui.text.font.FontStyle.Italic,
                                    color = Color.DarkGray
                                )
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(24.dp))
                    Text(
                        text = "The integration of vertical forests, carbon-sequestering concrete, and micro-grid energy systems is becoming standard practice in new high-density developments. These innovations are paving the way for a more resilient urban future.",
                        style = MaterialTheme.typography.bodyLarge,
                        lineHeight = 28.sp
                    )
                }
            }

            // Floating Bottom Bar
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(bottom = 24.dp, start = 24.dp, end = 24.dp)
                    .fillMaxWidth(0.9f)
                    .height(56.dp),
                shape = CircleShape,
                color = Color.White.copy(alpha = 0.9f),
                shadowElevation = 12.dp,
                tonalElevation = 4.dp
            ) {
                Row(
                    modifier = Modifier.fillMaxSize().padding(horizontal = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Row(
                        modifier = Modifier.background(Color(0xFFF1F5F9), CircleShape).padding(horizontal = 4.dp, vertical = 2.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        IconButton(onClick = {}) { Icon(Icons.Default.ArrowUpward, null, tint = Slate500) }
                        Text("1.2k", style = MaterialTheme.typography.labelLarge, color = Slate500)
                        VerticalDivider(modifier = Modifier.height(16.dp).padding(horizontal = 4.dp), color = Color.LightGray)
                        IconButton(onClick = {}) { Icon(Icons.Default.ArrowDownward, null, tint = Slate500) }
                    }
                    
                    Row(verticalAlignment = Alignment.CenterVertically) {
                        Icon(Icons.Outlined.ChatBubbleOutline, null, tint = Slate500, modifier = Modifier.size(22.dp))
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("342", style = MaterialTheme.typography.labelLarge, color = Slate500)
                    }
                    
                    Surface(
                        color = PrimaryRed,
                        shape = CircleShape,
                        modifier = Modifier.size(44.dp),
                        onClick = {}
                    ) {
                        Icon(
                            Icons.Outlined.IosShare, 
                            contentDescription = null, 
                            tint = Color.White,
                            modifier = Modifier.padding(10.dp)
                        )
                    }
                }
            }
        }
    }
}
