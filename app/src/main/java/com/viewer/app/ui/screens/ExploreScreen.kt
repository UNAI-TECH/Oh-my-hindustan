package com.viewer.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.rememberScrollState
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
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.compose.ui.unit.sp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.viewer.app.ui.components.AppBottomNavBar
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.Slate400
import com.viewer.app.ui.theme.Slate500

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ExploreScreen(navController: NavController) {
    Scaffold(
        bottomBar = { AppBottomNavBar(navController, "explore") }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
        ) {
            // Search Bar
            Box(modifier = Modifier.padding(16.dp).fillMaxWidth()) {
                OutlinedTextField(
                    value = "",
                    onValueChange = {},
                    placeholder = { Text("Search political analysts, news, or debates...", style = MaterialTheme.typography.bodyMedium) },
                    modifier = Modifier.fillMaxWidth().height(52.dp),
                    shape = RoundedCornerShape(12.dp),
                    leadingIcon = { Icon(Icons.Default.Search, null, tint = PrimaryRed) },
                    colors = OutlinedTextFieldDefaults.colors(
                        unfocusedContainerColor = PrimaryRed.copy(alpha = 0.1f),
                        focusedContainerColor = PrimaryRed.copy(alpha = 0.1f),
                        unfocusedBorderColor = Color.Transparent,
                        focusedBorderColor = Color.Transparent
                    ),
                    singleLine = true
                )
            }

            // Category Grid
            Row(
                modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                CategoryIconButton("Forum", Icons.Default.Groups, true)
                CategoryIconButton("Policy", Icons.Default.Gavel, false)
                CategoryIconButton("Debates", Icons.Default.RecordVoiceOver, false)
                CategoryIconButton("Updates", Icons.Default.WifiTethering, false)
            }

            Spacer(modifier = Modifier.height(24.dp))

            // Topic Chips
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(10.dp)
            ) {
                val topics = listOf("BJP", "Digital India", "Viksit Bharat", "Parliament", "Foreign Policy")
                items(topics) { topic ->
                    val isBjp = topic == "BJP"
                    Surface(
                        color = if (isBjp) PrimaryRed else PrimaryRed.copy(alpha = 0.1f),
                        shape = RoundedCornerShape(50),
                        shadowElevation = if (isBjp) 4.dp else 0.dp
                    ) {
                        Text(
                            topic,
                            modifier = Modifier.padding(horizontal = 20.dp, vertical = 8.dp),
                            color = if (isBjp) Color.White else PrimaryRed,
                            style = MaterialTheme.typography.labelLarge
                        )
                    }
                }
            }

            // Trending News Section
            SectionHeader("Top Narratives")
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                item { 
                    TrendingCard(
                        "BJP outlines vision for Viksit Bharat by 2047",
                        "POLICY",
                        "https://lh3.googleusercontent.com/aida-public/AB6AXuACoN2DQoiSOe691QocUxZH-3L_9fZYlxuyMgSzGjDK2IpGvbB_-azsNPYHY4uxdn4UY0asiiiKrX5nUtoBykk3U9xtzsGZHuX_evX_7MrbWm1trxzICNcIfPKMGTejyLgozoYi0kBcCT_9Of7LoXhmA67nlvO9ZMnPeY_ZKrBdTYC6tugUWh25hs3AnBBznJefESaEDqY9k9uGax1eERKSfzHbO7F-0wkMY89VzJcSUw25br-siVe7G4Z3jQ4YZovGxVjAyYjPXQ3K"
                    )
                }
                item {
                    TrendingCard(
                        "Digital India Revolution: Bridging the Rural-Urban Divide",
                        "NATIONAL",
                        "https://lh3.googleusercontent.com/aida-public/AB6AXuBNPp7D5HnjPznxYo5iXMHnH_X2PMhRGCHcfVJzAYwdcypyYKWiBziknmQ34zlmVGnZXeB_qIxg7MIO6nap_4GfsawTJB9nh1bH-Qvt_svGEZsYR1NHsiNM84_45jqH0jg19wyMZMhVatm3enN7R6SGyUN0ffgOJFbC4jemWHdEsOSlW95PQWEz4XlKMjyfMRKXqfW4CJRRrnf-EUNfinh9ezmiZ_jdBdCbXZIMI11-okK_RN22HxxnabXAaUcyJB7XRqyNdUbArGfG"
                    )
                }
            }

            // Viral Videos Section
            SectionHeader("Expert Briefings", showAll = false)
            LazyRow(
                contentPadding = PaddingValues(horizontal = 16.dp),
                horizontalArrangement = Arrangement.spacedBy(12.dp)
            ) {
                val videos = listOf(
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuBvaZgy_DmHr7hZz9h7Zs6HwJ-1vZ2sWN2p62RAQ46Sw_CZ6JTg_vKQR-_ncyXgRY8gBE0soKUJy6nqe_6lS4G47xBznqhBG9mK-IQqd2wYbFeeRBpE_xdRMbcEdTTCFjls4c_3TdCIAhoGv6L6mEeV6mpXciqQfyPNp5Y0S3JWBxtrg0u7_LWQI8C4-tOQYUrqwEK-QbfsQc7sETXnl-DgRVktVSxcmLnl5EHxUwPvb1ysegIT24bcqehmF09k4ypUVAHyVw5Vzffe" to "1.2M",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuDlHq1L9kII1dYdkFlamkDmCfbxs6Hq8tL49jnqGHcVd-bQnIGJqqw97OAgiyjQ_Y4kaud4pC6XBA1ocxHDFFWnBtF2RaM9486tXAwO4hObiuljisXcwJKEhG_ytlrXyRUrf0Mry0L1_M3QmtravL5c_SUOiFSPNszGEroTjR_Xsue9lcUVo4Lbu_7_SpR_OjKTbArPoMYH1XiFfu935cnNLXG0Xeng9OHW0hyD024CTAGKeWaa5H0W5a-Il1iEzlSVNs1FsDNdTuqr" to "850K",
                    "https://lh3.googleusercontent.com/aida-public/AB6AXuA-Y8lWOnMuXjfVAbxG1R0wudhFxEJnqu0g9CCfkvqCgqDV1BPHJ8WL1VFbd-yYJZhJkyGS2unCs3rOwaeBXXGx1x5DwJnA5UOCqPWMpfuAoT0BVgf4QVQyEJQUvcQXGtWvWzh1viThoFaZqPq0sX9lVhdIFYDzgw3ML26cnkqCVgOTI4nOdU6AF3erYbkK2pKulZv7yRqM3VgVJUQN3g-RIFtz1I18tKuxDmdpI73Rxv1SezkiHTUqPJbeC3Uevw1UO1HKbUqdZ-ne" to "2.4M"
                )
                items(videos) { (img, views) ->
                    Box(modifier = Modifier.width(120.dp).aspectRatio(9/16f).clip(RoundedCornerShape(12.dp))) {
                        AsyncImage(model = img, contentDescription = null, modifier = Modifier.fillMaxSize(), contentScale = ContentScale.Crop)
                        Row(modifier = Modifier.align(Alignment.BottomStart).padding(8.dp), verticalAlignment = Alignment.CenterVertically) {
                            Icon(Icons.Default.PlayArrow, null, tint = Color.White, modifier = Modifier.size(14.dp))
                            Text(views, color = Color.White, style = MaterialTheme.typography.labelSmall, fontWeight = FontWeight.Bold)
                        }
                    }
                }
            }

            // Popular Blogs
            SectionHeader("Policy Analysis", showAll = false)
            Column(modifier = Modifier.padding(horizontal = 16.dp)) {
                Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.spacedBy(16.dp)) {
                    BlogGridItem(
                        "Atmanirbhar Bharat: A Blueprint for Global manufacturing Hub",
                        "10 min read",
                        "https://lh3.googleusercontent.com/aida-public/AB6AXuDkc1IIZ5iqASKkcQrJVHaCUR4f0tU7Uhg5uXeqkWAheofObj62ZwOBRHvcS5Bw2Kg3UEtxQzBtHgpxSiiglVBgq20YAvsdX5CBTKGIaZVXfx3qRohj249nEW5_WVv4ltH6JzOdWjuEUZUIISRpe-Nqc_o0ywilUo0JMvGev-gizdOtQlmVT8n0xPKL52oGzNtMBizD4ZeycLwwsc4eJbpb3MqTPVfn_ddaZjkFZeK827FFjvtPzqTzZVCLb5iYCNXQcyVWRK-xCErO",
                        Modifier.weight(1f)
                    )
                    BlogGridItem(
                        "Strengthening Grassroots Governance: Gram Swaraj Updates",
                        "8 min read",
                        "https://lh3.googleusercontent.com/aida-public/AB6AXuByGcQD2EPIk2dyqKhMeAWjdGBbKjjtTpJd6J8MfjjI-NjGuNxxWE8GV05T62hO16HTZ8Y2PpWcWXnf5nF79I4CahOwvBobsYKXz3c0Plu4zVOUTFc5bv7Ch9wnHk0Dt1WL6DmRUXUR7b30Ci0KlS4s555a5rBEwrfXe9whdbdZDlPfrsBNQT6tzJsbzhYifdgqQ6oVSfH_pMCfD2MfR8HGZOICdBMBlDEYmehFEOsX9UeVYXDNpR7OIGNKyoev4qdjNo38rZzDFcyL",
                        Modifier.weight(1f)
                    )
                }
            }
            
            Spacer(modifier = Modifier.height(100.dp))
        }
    }
}

@Composable
fun CategoryIconButton(label: String, icon: androidx.compose.ui.graphics.vector.ImageVector, isActive: Boolean) {
    Column(horizontalAlignment = Alignment.CenterHorizontally, modifier = Modifier.width(64.dp)) {
        Surface(
            modifier = Modifier.size(56.dp),
            shape = RoundedCornerShape(16.dp),
            color = if (isActive) PrimaryRed else PrimaryRed.copy(alpha = 0.1f),
            shadowElevation = if (isActive) 8.dp else 0.dp
        ) {
            Icon(
                icon, null, 
                modifier = Modifier.padding(14.dp),
                tint = if (isActive) Color.White else PrimaryRed
            )
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            label.uppercase(), 
            style = MaterialTheme.typography.labelSmall, 
            color = if (isActive) PrimaryRed else Slate400,
            fontWeight = FontWeight.Bold,
            letterSpacing = 0.5.sp
        )
    }
}

@Composable
fun SectionHeader(title: String, showAll: Boolean = true) {
    Row(
        modifier = Modifier.fillMaxWidth().padding(horizontal = 16.dp, vertical = 20.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(title, style = MaterialTheme.typography.titleLarge, fontWeight = FontWeight.Bold)
        if (showAll) {
            Text("View all", color = PrimaryRed, style = MaterialTheme.typography.labelLarge, fontWeight = FontWeight.Bold)
        }
    }
}

@Composable
fun TrendingCard(title: String, tag: String, img: String) {
    Column(modifier = Modifier.width(260.dp)) {
        AsyncImage(
            model = img,
            contentDescription = null,
            modifier = Modifier.fillMaxWidth().height(144.dp).clip(RoundedCornerShape(12.dp)),
            contentScale = ContentScale.Crop
        )
        Spacer(modifier = Modifier.height(12.dp))
        Surface(color = PrimaryRed.copy(alpha = 0.1f), shape = RoundedCornerShape(4.dp)) {
            Text(tag, modifier = Modifier.padding(horizontal = 8.dp, vertical = 2.dp), style = MaterialTheme.typography.labelSmall, color = PrimaryRed)
        }
        Spacer(modifier = Modifier.height(4.dp))
        Text(title, style = MaterialTheme.typography.titleSmall, maxLines = 2, fontWeight = FontWeight.Bold)
    }
}

@Composable
fun BlogGridItem(title: String, duration: String, img: String, modifier: Modifier) {
    Column(modifier = modifier) {
        AsyncImage(
            model = img,
            contentDescription = null,
            modifier = Modifier.fillMaxWidth().aspectRatio(1f).clip(RoundedCornerShape(12.dp)),
            contentScale = ContentScale.Crop
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(title, style = MaterialTheme.typography.labelLarge, maxLines = 2, fontWeight = FontWeight.Bold, lineHeight = 16.sp)
        Text(duration, style = MaterialTheme.typography.labelSmall, color = Slate400)
    }
}
