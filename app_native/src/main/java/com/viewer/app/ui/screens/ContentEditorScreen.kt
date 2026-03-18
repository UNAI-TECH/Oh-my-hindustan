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
import androidx.compose.material3.*
import androidx.compose.material3.TabRowDefaults.tabIndicatorOffset
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.viewer.app.ui.components.AppBottomNavBar
import com.viewer.app.ui.components.StudioBottomNavBar
import com.viewer.app.ui.theme.CreamBg
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.WarmOrange
import com.viewer.app.ui.theme.Slate500

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContentEditorScreen(navController: NavController) {
    var selectedTab by remember { mutableStateOf("Expert Briefing") }
    val tabs = listOf("Expert Briefing", "Policy Analysis")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Jan Samvad Forum", fontWeight = FontWeight.ExtraBold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, null)
                    }
                },
                actions = {
                    TextButton(onClick = {}) { Text("Save Draft", color = Slate500, fontWeight = FontWeight.Bold) }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {},
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryRed),
                        shape = RoundedCornerShape(12.dp)
                    ) {
                        Text("Publish", fontWeight = FontWeight.Bold)
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        },
        bottomBar = { StudioBottomNavBar(navController, "content_editor") }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
        ) {
            // Tabs
            TabRow(
                selectedTabIndex = tabs.indexOf(selectedTab),
                containerColor = MaterialTheme.colorScheme.surface,
                contentColor = PrimaryRed,
                divider = { HorizontalDivider(color = MaterialTheme.colorScheme.outlineVariant) },
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
                                fontWeight = if (selectedTab == tab) FontWeight.Bold else FontWeight.Normal
                            ) 
                        }
                    )
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                if (selectedTab == "Expert Briefing") {
                    VideoUploadSection()
                } else {
                    BlogEditorSection()
                }
                
                Spacer(modifier = Modifier.height(100.dp))
            }
        }
    }
}

@Composable
fun VideoUploadSection() {
    val slate300 = Color(0xFFCBD5E1)
    val slate500 = Color(0xFF64748B)

    Column {
        // Upload Zone
        Surface(
            modifier = Modifier.fillMaxWidth().height(200.dp),
            color = PrimaryRed.copy(alpha = 0.03f),
            shape = RoundedCornerShape(20.dp),
            border = androidx.compose.foundation.BorderStroke(2.dp, PrimaryRed.copy(alpha = 0.1f))
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.padding(24.dp)
            ) {
                Surface(color = Color.White, shape = CircleShape, modifier = Modifier.size(64.dp), shadowElevation = 2.dp) {
                    Icon(Icons.Default.CloudUpload, null, tint = PrimaryRed, modifier = Modifier.padding(16.dp))
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text("Select briefing video to upload", fontWeight = FontWeight.ExtraBold)
                Text("MP4, WebM or OGG. Up to 2GB.", style = MaterialTheme.typography.labelSmall, color = slate500)
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Progress Bar
        Column {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Uploading...", style = MaterialTheme.typography.labelMedium, color = slate500)
                Text("65%", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = PrimaryRed)
            }
            Spacer(modifier = Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = { 0.65f },
                modifier = Modifier.fillMaxWidth().height(10.dp).clip(CircleShape),
                color = PrimaryRed,
                trackColor = PrimaryRed.copy(alpha = 0.1f)
            )
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Metadata Fields
        Text("Video Metadata", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.ExtraBold)
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedTextField(
            value = "", onValueChange = {},
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Briefing Headline") },
            placeholder = { Text("Enter the main topic of your briefing") },
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = slate300,
                focusedBorderColor = PrimaryRed,
                unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                focusedContainerColor = MaterialTheme.colorScheme.surface
            )
        )
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = "", onValueChange = {},
            modifier = Modifier.fillMaxWidth().height(140.dp),
            label = { Text("Briefing Summary") },
            placeholder = { Text("Provide context for this political briefing") },
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = slate300,
                focusedBorderColor = PrimaryRed,
                unfocusedContainerColor = MaterialTheme.colorScheme.surface,
                focusedContainerColor = MaterialTheme.colorScheme.surface
            )
        )
    }
}

@Composable
fun BlogEditorSection() {
    val slate300 = Color(0xFFCBD5E1)
    
    Column {
        // Hero Image Upload
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(180.dp)
                .background(Color.White, RoundedCornerShape(20.dp))
                .border(1.dp, slate300, RoundedCornerShape(20.dp)),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.AddPhotoAlternate, null, tint = Color.LightGray, modifier = Modifier.size(48.dp))
                Text("Add Cover Image", color = Color.Gray, style = MaterialTheme.typography.labelMedium)
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Editor Title
        OutlinedTextField(
            value = "", onValueChange = {},
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Policy Analysis Title...", style = MaterialTheme.typography.headlineSmall, color = Color.LightGray) },
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = slate300,
                focusedBorderColor = PrimaryRed,
                unfocusedContainerColor = Color.White,
                focusedContainerColor = Color.White
            ),
            textStyle = MaterialTheme.typography.headlineSmall.copy(fontWeight = FontWeight.Bold)
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Mock Toolbar
        Surface(
            color = Color.White,
            shape = RoundedCornerShape(12.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, Color(0xFFF1F5F9))
        ) {
            Row(
                modifier = Modifier.padding(horizontal = 16.dp, vertical = 10.dp),
                horizontalArrangement = Arrangement.spacedBy(20.dp)
            ) {
                Icon(Icons.Default.FormatBold, null, tint = Color.Gray, modifier = Modifier.size(20.dp))
                Icon(Icons.Default.FormatItalic, null, tint = Color.Gray, modifier = Modifier.size(20.dp))
                Icon(Icons.Default.FormatQuote, null, tint = Color.Gray, modifier = Modifier.size(20.dp))
                Icon(Icons.Default.Link, null, tint = Color.Gray, modifier = Modifier.size(20.dp))
                Icon(Icons.Default.Code, null, tint = Color.Gray, modifier = Modifier.size(20.dp))
            }
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Body Editor
        OutlinedTextField(
            value = "", onValueChange = {},
            modifier = Modifier.fillMaxWidth().height(350.dp),
            placeholder = { Text("Draft your political analysis here...", style = MaterialTheme.typography.bodyLarge, color = Color.LightGray) },
            shape = RoundedCornerShape(16.dp),
            colors = OutlinedTextFieldDefaults.colors(
                unfocusedBorderColor = slate300,
                focusedBorderColor = PrimaryRed,
                unfocusedContainerColor = Color.White,
                focusedContainerColor = Color.White
            )
        )
    }
}
