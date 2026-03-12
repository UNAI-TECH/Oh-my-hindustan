package com.viewer.app.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.vector.ImageVector
import androidx.compose.ui.unit.dp
import androidx.navigation.NavController
import com.viewer.app.ui.theme.PrimaryRed
import com.viewer.app.ui.theme.SlateText

@Composable
fun StudioBottomNavBar(navController: NavController, currentRoute: String?) {
    var showExitDialog by remember { mutableStateOf(false) }

    if (showExitDialog) {
        AlertDialog(
            onDismissRequest = { showExitDialog = false },
            title = { Text("Exit Studio?") },
            text = { Text("Are you sure you want to exit the Analyst Studio and return to the main feed?") },
            confirmButton = {
                TextButton(
                    onClick = {
                        showExitDialog = false
                        navController.navigate("home") {
                            popUpTo("home") { inclusive = true }
                        }
                    }
                ) {
                    Text("Exit", color = PrimaryRed)
                }
            },
            dismissButton = {
                TextButton(onClick = { showExitDialog = false }) {
                    Text("Cancel", color = Color.Gray)
                }
            },
            containerColor = Color.White,
            shape = androidx.compose.foundation.shape.RoundedCornerShape(24.dp)
        )
    }

    NavigationBar(
        containerColor = Color.White,
        tonalElevation = 8.dp
    ) {
        val items = listOf(
            StudioBottomNavItem("Dashboard", "creator_dashboard", Icons.Default.Dashboard),
            StudioBottomNavItem("Analytics", "creator_analytics", Icons.Default.Analytics),
            StudioBottomNavItem("Drafts", "content_editor", Icons.Default.EditNote),
            StudioBottomNavItem("Exit", "exit", Icons.Default.ExitToApp)
        )

        items.forEach { item ->
            val isSelected = currentRoute == item.route
            NavigationBarItem(
                icon = { Icon(item.icon, contentDescription = item.label) },
                label = { Text(item.label, style = MaterialTheme.typography.labelSmall) },
                selected = isSelected,
                onClick = {
                    if (item.route == "exit") {
                        showExitDialog = true
                    } else if (currentRoute != item.route) {
                        navController.navigate(item.route) {
                            popUpTo("creator_dashboard") { saveState = true }
                            launchSingleTop = true
                            restoreState = true
                        }
                    }
                },
                colors = NavigationBarItemDefaults.colors(
                    selectedIconColor = PrimaryRed,
                    selectedTextColor = PrimaryRed,
                    unselectedIconColor = SlateText.copy(alpha = 0.4f),
                    unselectedTextColor = SlateText.copy(alpha = 0.4f),
                    indicatorColor = PrimaryRed.copy(alpha = 0.1f)
                )
            )
        }
    }
}

data class StudioBottomNavItem(val label: String, val route: String, val icon: ImageVector)
