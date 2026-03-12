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
import com.viewer.app.ui.theme.CreamBg
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.Slate500

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ContentEditorScreen(navController: NavController) {
    var selectedTab by remember { mutableStateOf("Video Upload") }
    val tabs = listOf("Video Upload", "Blog Editor")

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Content Editor", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, null)
                    }
                },
                actions = {
                    TextButton(onClick = {}) { Text("Save Draft", color = Slate500) }
                    Button(
                        onClick = {},
                        colors = ButtonDefaults.buttonColors(containerColor = PrimaryRed),
                        shape = RoundedCornerShape(8.dp)
                    ) {
                        Text("Publish")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(containerColor = Color.White)
            )
        },
        bottomBar = { AppBottomNavBar(navController, "content_editor") }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(CreamBg)
        ) {
            // Tabs
            TabRow(
                selectedTabIndex = tabs.indexOf(selectedTab),
                containerColor = Color.White,
                contentColor = PrimaryRed,
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
                        text = { Text(tab, style = MaterialTheme.typography.titleSmall) }
                    )
                }
            }

            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .verticalScroll(rememberScrollState())
                    .padding(16.dp)
            ) {
                if (selectedTab == "Video Upload") {
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
    Column {
        // Upload Zone
        Surface(
            modifier = Modifier.fillMaxWidth().height(200.dp),
            color = PrimaryRed.copy(alpha = 0.05f),
            shape = RoundedCornerShape(12.dp),
            border = androidx.compose.foundation.BorderStroke(2.dp, PrimaryRed.copy(alpha = 0.2f))
        ) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                verticalArrangement = Arrangement.Center,
                modifier = Modifier.padding(24.dp)
            ) {
                Surface(color = Color.White, shape = CircleShape, modifier = Modifier.size(64.dp)) {
                    Icon(Icons.Default.CloudUpload, null, tint = PrimaryRed, modifier = Modifier.padding(16.dp))
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text("Select video files to upload", fontWeight = FontWeight.Bold)
                Text("MP4, WebM or OGG. Up to 2GB.", style = MaterialTheme.typography.labelSmall, color = Slate500)
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Progress Bar
        Column {
            Row(modifier = Modifier.fillMaxWidth(), horizontalArrangement = Arrangement.SpaceBetween) {
                Text("Uploading...", style = MaterialTheme.typography.labelMedium, color = Slate500)
                Text("65%", style = MaterialTheme.typography.labelMedium, fontWeight = FontWeight.Bold, color = PrimaryRed)
            }
            Spacer(modifier = Modifier.height(8.dp))
            LinearProgressIndicator(
                progress = 0.65f,
                modifier = Modifier.fillMaxWidth().height(8.dp).clip(CircleShape),
                color = PrimaryRed,
                trackColor = PrimaryRed.copy(alpha = 0.1f)
            )
        }

        Spacer(modifier = Modifier.height(32.dp))

        // Metadata Fields
        Text("Video Metadata", style = MaterialTheme.typography.titleMedium, fontWeight = FontWeight.Bold)
        Spacer(modifier = Modifier.height(16.dp))
        
        OutlinedTextField(
            value = "", onValueChange = {},
            modifier = Modifier.fillMaxWidth(),
            label = { Text("Title") },
            placeholder = { Text("Enter video title") }
        )
        Spacer(modifier = Modifier.height(16.dp))
        OutlinedTextField(
            value = "", onValueChange = {},
            modifier = Modifier.fillMaxWidth().height(120.dp),
            label = { Text("Description") },
            placeholder = { Text("Tell viewers about your video") }
        )
    }
}

@Composable
fun BlogEditorSection() {
    Column {
        // Hero Image Upload
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(200.dp)
                .background(Color.White, RoundedCornerShape(12.dp))
                .border(1.dp, Color(0xFFE2E8F0), RoundedCornerShape(12.dp)),
            contentAlignment = Alignment.Center
        ) {
            Column(horizontalAlignment = Alignment.CenterHorizontally) {
                Icon(Icons.Default.AddPhotoAlternate, null, tint = Color.LightGray, modifier = Modifier.size(48.dp))
                Text("Add Cover Image", color = Color.Gray)
            }
        }
        
        Spacer(modifier = Modifier.height(24.dp))
        
        // Editor
        TextField(
            value = "", onValueChange = {},
            modifier = Modifier.fillMaxWidth(),
            placeholder = { Text("Enter your blog title...", style = MaterialTheme.typography.headlineLarge, color = Color.LightGray) },
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.Transparent,
                unfocusedContainerColor = Color.Transparent,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent
            )
        )
        
        Spacer(modifier = Modifier.height(16.dp))
        
        // Mock Toolbar
        Row(
            modifier = Modifier.fillMaxWidth().padding(vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Icon(Icons.Default.FormatBold, null, tint = Color.Gray)
            Icon(Icons.Default.FormatItalic, null, tint = Color.Gray)
            Icon(Icons.Default.FormatQuote, null, tint = Color.Gray)
            Icon(Icons.Default.Link, null, tint = Color.Gray)
            Icon(Icons.Default.Code, null, tint = Color.Gray)
        }
        
        Spacer(modifier = Modifier.height(16.dp))
        
        TextField(
            value = "", onValueChange = {},
            modifier = Modifier.fillMaxWidth().height(300.dp),
            placeholder = { Text("Write your story here...", style = MaterialTheme.typography.bodyLarge, color = Color.LightGray) },
            colors = TextFieldDefaults.colors(
                focusedContainerColor = Color.Transparent,
                unfocusedContainerColor = Color.Transparent,
                focusedIndicatorColor = Color.Transparent,
                unfocusedIndicatorColor = Color.Transparent
            )
        )
    }
}
