package com.viewer.app.ui.screens

import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import androidx.compose.runtime.collectAsState
import androidx.lifecycle.viewmodel.compose.viewModel
import com.viewer.app.ui.theme.ThemeViewModel
import kotlinx.coroutines.launch
import com.viewer.app.ui.theme.CreamBg
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.Slate500
import com.viewer.app.ui.viewmodels.AuthViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(navController: NavController, themeViewModel: ThemeViewModel = viewModel()) {
    val authViewModel: AuthViewModel = viewModel()
    val snackbarHostState = remember { SnackbarHostState() }
    val scope = rememberCoroutineScope()
    
    // Dialog States
    var showAboutDialog by remember { mutableStateOf(false) }
    var showLanguageDialog by remember { mutableStateOf(false) }
    var showPrivacyDialog by remember { mutableStateOf(false) }
    var showHelpDialog by remember { mutableStateOf(false) }

    // Preference States
    val isDarkMode by themeViewModel.isDarkMode.collectAsState()
    var isDataSaver by remember { mutableStateOf(true) }
    var selectedLanguage by remember { mutableStateOf("English") }

    // --- Dialogs ---
    if (showAboutDialog) {
        AlertDialog(
            onDismissRequest = { showAboutDialog = false },
            title = { Text("About Jan Samvad") },
            text = { 
                Column {
                    Text("Version 1.0.0 (Build 20240312)")
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Jan Samvad is a platform for citizen analysis and political discourse. Empowering voices for a better nation.")
                }
            },
            confirmButton = {
                TextButton(onClick = { showAboutDialog = false }) {
                    Text("Close", color = PrimaryRed)
                }
            },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(16.dp)
        )
    }

    if (showLanguageDialog) {
        AlertDialog(
            onDismissRequest = { showLanguageDialog = false },
            title = { Text("Select Language") },
            text = {
                Column {
                    val languages = listOf("English", "Hindi", "Marathi", "Bengali")
                    languages.forEach { lang ->
                        Row(
                            Modifier.fillMaxWidth().clickable { 
                                selectedLanguage = lang
                                showLanguageDialog = false
                                scope.launch { snackbarHostState.showSnackbar("Language set to $lang") }
                            }.padding(vertical = 12.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(selected = selectedLanguage == lang, onClick = null)
                            Spacer(Modifier.width(8.dp))
                            Text(lang)
                        }
                    }
                }
            },
            confirmButton = {},
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(16.dp)
        )
    }

    if (showPrivacyDialog) {
        AlertDialog(
            onDismissRequest = { showPrivacyDialog = false },
            title = { Text("Privacy & Security") },
            text = {
                Column {
                    Text("• Your data is encrypted and stored securely.", style = MaterialTheme.typography.bodyMedium)
                    Spacer(Modifier.height(8.dp))
                    Text("• We do not share your personal information with third parties.", style = MaterialTheme.typography.bodyMedium)
                    Spacer(Modifier.height(8.dp))
                    Text("• You have full control over your content and profile visibility.", style = MaterialTheme.typography.bodyMedium)
                }
            },
            confirmButton = {
                TextButton(onClick = { showPrivacyDialog = false }) { Text("Got it", color = PrimaryRed) }
            },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(16.dp)
        )
    }

    if (showHelpDialog) {
        AlertDialog(
            onDismissRequest = { showHelpDialog = false },
            title = { Text("Help Center") },
            text = {
                Column(modifier = Modifier.verticalScroll(rememberScrollState())) {
                    Text("FAQ", fontWeight = FontWeight.Bold, style = MaterialTheme.typography.titleMedium)
                    Spacer(Modifier.height(8.dp))
                    Text("Q: How do I create a briefing?", fontWeight = FontWeight.Bold)
                    Text("A: Go to the Analyst Dashboard and click 'New Briefing'.")
                    Spacer(Modifier.height(12.dp))
                    Text("Q: How can I change my profile photo?", fontWeight = FontWeight.Bold)
                    Text("A: Tap 'Edit Profile' in settings to update your details.")
                    Spacer(Modifier.height(12.dp))
                    Text("Support Email: help@jansamvad.in", color = PrimaryRed)
                }
            },
            confirmButton = {
                TextButton(onClick = { showHelpDialog = false }) { Text("Close", color = PrimaryRed) }
            },
            containerColor = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(16.dp)
        )
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            TopAppBar(
                title = { Text("Settings", fontWeight = FontWeight.Bold) },
                navigationIcon = {
                    IconButton(onClick = { navController.popBackStack() }) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    titleContentColor = MaterialTheme.colorScheme.onSurface,
                    navigationIconContentColor = MaterialTheme.colorScheme.onSurface
                )
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .padding(padding)
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.background)
                .verticalScroll(rememberScrollState())
                .padding(16.dp)
        ) {
            SettingsGroup(title = "Account") {
                SettingsItem("Edit Profile", Icons.Default.Person) { 
                    navController.navigate("profile_setup") 
                }
                SettingsItem("Notification Settings", Icons.Default.Notifications) { 
                    navController.navigate("notifications") 
                }
                SettingsItem("Privacy & Security", Icons.Default.Security) { 
                    showPrivacyDialog = true
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            SettingsGroup(title = "Preferences") {
                SettingsItem(
                    label = "Appearance", 
                    icon = Icons.Default.Palette,
                    trailing = {
                        Switch(
                            checked = isDarkMode,
                            onCheckedChange = { themeViewModel.toggleTheme() },
                            colors = SwitchDefaults.colors(checkedThumbColor = PrimaryRed, checkedTrackColor = PrimaryRed.copy(alpha = 0.5f))
                        )
                    }
                ) {
                    themeViewModel.toggleTheme()
                }

                SettingsItem(
                    label = "Language", 
                    icon = Icons.Default.Language,
                    trailing = {
                        Text(selectedLanguage, style = MaterialTheme.typography.bodyMedium, color = Slate500)
                    }
                ) { 
                    showLanguageDialog = true
                }
                SettingsItem(
                    label = "Data Saver", 
                    icon = Icons.Default.BarChart,
                    trailing = {
                        Switch(
                            checked = isDataSaver,
                            onCheckedChange = { isDataSaver = it },
                            colors = SwitchDefaults.colors(checkedThumbColor = PrimaryRed, checkedTrackColor = PrimaryRed.copy(alpha = 0.5f))
                        )
                    }
                ) { 
                    isDataSaver = !isDataSaver
                }
            }

            Spacer(modifier = Modifier.height(24.dp))

            SettingsGroup(title = "Support") {
                SettingsItem("Help Center", Icons.Default.Help) { 
                    showHelpDialog = true
                }
                SettingsItem("About Jan Samvad", Icons.Default.Info) { 
                    showAboutDialog = true 
                }
            }

            Spacer(modifier = Modifier.height(32.dp))

            Button(
                onClick = { 
                    authViewModel.logout()
                    navController.navigate("login") {
                        popUpTo("home") { inclusive = true }
                    }
                },
                modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    contentColor = PrimaryRed
                ),
                shape = RoundedCornerShape(12.dp),
                border = androidx.compose.foundation.BorderStroke(1.dp, PrimaryRed.copy(alpha = 0.2f))
            ) {
                Text("Log Out", fontWeight = FontWeight.Bold)
            }
            
            Spacer(modifier = Modifier.height(100.dp))
        }
    }
}

@Composable
fun SettingsGroup(title: String, content: @Composable ColumnScope.() -> Unit) {
    Column {
        Text(
            text = title,
            style = MaterialTheme.typography.labelMedium,
            color = Slate500,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(start = 4.dp, bottom = 8.dp)
        )
        Surface(
            color = MaterialTheme.colorScheme.surface,
            shape = RoundedCornerShape(16.dp),
            border = androidx.compose.foundation.BorderStroke(1.dp, MaterialTheme.colorScheme.outlineVariant)
        ) {
            Column {
                content()
            }
        }
    }
}

@Composable
fun SettingsItem(
    label: String, 
    icon: ImageVector, 
    trailing: @Composable (() -> Unit)? = null,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable { onClick() }
            .padding(16.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(icon, null, tint = PrimaryRed, modifier = Modifier.size(24.dp))
        Spacer(modifier = Modifier.width(16.dp))
        Text(label, style = MaterialTheme.typography.bodyLarge, modifier = Modifier.weight(1f))
        if (trailing != null) {
            trailing()
        } else {
            Icon(Icons.Default.ChevronRight, null, tint = Color.LightGray)
        }
    }
}

